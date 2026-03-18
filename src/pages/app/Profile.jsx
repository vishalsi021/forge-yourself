import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { PageWrapper } from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { claudeApi } from '@/lib/claude';
import { mergeProfileQuizAnswers, updateProfile, uploadToBucket } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { useUiStore } from '@/stores/uiStore';

const defaultSocialSettings = {
  streak_visible: true,
  profile_public: false,
};

async function fetchSocialSettings(userId) {
  const { data, error } = await supabase.from('social').select('*').eq('user_id', userId).maybeSingle();

  if (error) throw error;
  return data ? { ...defaultSocialSettings, ...data } : defaultSocialSettings;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pushToast = useUiStore((state) => state.pushToast);
  const { profile, user, signOut } = useAuth();
  const { preferences, savePreferences, enablePush, pushFeatureEnabled } = useNotifications(user?.id);

  const socialQuery = useQuery({
    queryKey: ['social-settings', user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => fetchSocialSettings(user.id),
  });

  const saveProfile = useMutation({
    mutationFn: async (patch) => updateProfile(user.id, patch),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth-state'] });
    },
    onError: (error) => {
      pushToast({ title: error.message || 'Unable to save profile changes', variant: 'error' });
    },
  });

  const saveSocial = useMutation({
    mutationFn: async (patch) => {
      const { data, error } = await supabase
        .from('social')
        .upsert({ user_id: user.id, ...socialQuery.data, ...patch }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return { ...defaultSocialSettings, ...data };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['social-settings', user?.id], data);
      pushToast({ title: 'Privacy settings updated', variant: 'success' });
    },
    onError: (error) => {
      pushToast({ title: error.message || 'Unable to save privacy settings', variant: 'error' });
    },
  });

  const uploadAvatar = async (file) => {
    try {
      const extension = file.name.split('.').pop();
      const path = `${user.id}/avatar.${extension}`;
      const publicUrl = await uploadToBucket({ bucket: 'avatars', path, file });
      await saveProfile.mutateAsync({ avatar_url: publicUrl });
      pushToast({ title: 'Avatar updated', variant: 'success' });
    } catch (error) {
      pushToast({ title: error.message || 'Unable to upload avatar', variant: 'error' });
    }
  };

  const toggleShareProgress = async () => {
    try {
      const currentValue = Boolean(profile?.quiz_answers?.profileSettings?.shareProgress);
      await mergeProfileQuizAnswers(user.id, (current) => ({
        ...current,
        profileSettings: {
          ...current.profileSettings,
          shareProgress: !currentValue,
        },
      }));
      await queryClient.invalidateQueries({ queryKey: ['auth-state'] });
      pushToast({ title: 'Share settings updated', variant: 'success' });
    } catch (error) {
      pushToast({ title: error.message || 'Unable to update share settings', variant: 'error' });
    }
  };

  return (
    <PageWrapper>
      <Card className="p-5">
        <div className="flex items-center gap-4">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name} className="h-20 w-20 object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center border border-forge-gold/20 bg-forge-gold/10 font-display text-4xl text-forge-gold">
              {(profile?.full_name || user?.email || 'F').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <div className="display-title text-4xl">{profile?.full_name || 'FORGE Member'}</div>
            <div className="section-label mt-1">{profile?.username || 'set-username'} - {profile?.plan_tier || 'free'}</div>
          </div>
        </div>
        <label className="mt-4 block cursor-pointer border border-forge-border px-4 py-3 text-center font-condensed text-xs font-bold uppercase tracking-[0.18em] text-forge-muted2">
          Upload avatar
          <input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && uploadAvatar(event.target.files[0])} />
        </label>
      </Card>

      <Card className="mt-4 p-5">
        <div className="section-label mb-2">Profile</div>
        <Input
          placeholder="Display name"
          defaultValue={profile?.full_name || ''}
          onBlur={(event) => {
            const value = event.target.value.trim();
            if (value !== (profile?.full_name || '')) {
              saveProfile.mutate({ full_name: value });
            }
          }}
        />
        <Input
          placeholder="Username"
          defaultValue={profile?.username || ''}
          onBlur={(event) => {
            const value = event.target.value.trim().toLowerCase().replace(/\s+/g, '-');
            if (value !== (profile?.username || '')) {
              event.target.value = value;
              saveProfile.mutate({ username: value });
            }
          }}
        />
      </Card>

      <Card className="mt-4 p-5">
        <div className="section-label mb-2">Stats</div>
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-forge-bg3 p-4">
            <div className="font-display text-4xl text-forge-gold">{profile?.custom_habits?.length || 0}</div>
            <div className="section-label mt-1">Custom habits</div>
          </Card>
          <Card className="bg-forge-bg3 p-4">
            <div className="font-display text-4xl text-forge-orange">{profile?.onboarding_complete ? 'Yes' : 'No'}</div>
            <div className="section-label mt-1">Onboarded</div>
          </Card>
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <div className="section-label mb-2">Custom habits</div>
        <div className="grid gap-2">
          {(profile?.custom_habits || []).map((habit) => (
            <div key={habit} className="flex items-center justify-between border border-forge-border px-3 py-3 text-sm text-forge-muted2">
              <span>{habit}</span>
              <button
                type="button"
                className="text-forge-red"
                onClick={() => saveProfile.mutate({ custom_habits: profile.custom_habits.filter((item) => item !== habit) })}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        <Input
          className="mt-4"
          placeholder="Add a new habit"
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            const value = event.currentTarget.value.trim();
            if (!value) return;
            saveProfile.mutate({ custom_habits: [...(profile?.custom_habits || []), value] });
            event.currentTarget.value = '';
          }}
        />
      </Card>

      <Card className="mt-4 p-5">
        <div className="section-label mb-2">Notification settings</div>
        <div className="grid gap-4 text-sm text-forge-muted2">
          <div>
            <div className="mb-1 font-condensed text-xs font-bold uppercase tracking-[0.18em] text-forge-text">Morning reminder</div>
            <Input
              key={`morning-${preferences?.morning_time || '08:00'}`}
              type="time"
              defaultValue={preferences?.morning_time || '08:00'}
              onBlur={(event) => savePreferences({ morning_time: event.target.value })}
            />
          </div>
          <div>
            <div className="mb-1 font-condensed text-xs font-bold uppercase tracking-[0.18em] text-forge-text">Evening reminder</div>
            <Input
              key={`evening-${preferences?.evening_time || '21:00'}`}
              type="time"
              defaultValue={preferences?.evening_time || '21:00'}
              onBlur={(event) => savePreferences({ evening_time: event.target.value })}
            />
          </div>
          <SettingRow
            label="Sunday weekly review reminder"
            description="Get nudged to lock in your next week before Monday hits."
            enabled={Boolean(preferences?.weekly_review_enabled)}
            onToggle={() => savePreferences({ weekly_review_enabled: !preferences?.weekly_review_enabled })}
          />
          <SettingRow
            label="Streak at-risk alert"
            description="Warn me when the day is slipping and my streak can still be saved."
            enabled={Boolean(preferences?.streak_risk_enabled)}
            onToggle={() => savePreferences({ streak_risk_enabled: !preferences?.streak_risk_enabled })}
          />
          <SettingRow
            label="Partner check-in reminder"
            description="Keep accountability touchpoints visible when social features are enabled."
            enabled={Boolean(preferences?.partner_checkin_enabled)}
            onToggle={() => savePreferences({ partner_checkin_enabled: !preferences?.partner_checkin_enabled })}
          />
          {pushFeatureEnabled ? (
            <Button variant="secondary" onClick={() => enablePush()}>
              Enable Web Push
            </Button>
          ) : (
            <div className="border border-forge-border px-3 py-3 text-xs leading-5 text-forge-muted2">
              Web Push is wired for release 2 and stays hidden in production until cross-browser QA is complete.
            </div>
          )}
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <div className="section-label mb-2">Privacy settings</div>
        <div className="grid gap-4">
          <SettingRow
            label="Show streak to friends"
            description="Allow approved social surfaces to display your streak when release 2 is enabled."
            enabled={Boolean(socialQuery.data?.streak_visible)}
            onToggle={() => saveSocial.mutate({ streak_visible: !socialQuery.data?.streak_visible })}
          />
          <SettingRow
            label="Public profile"
            description="Make your leaderboard card discoverable if you choose to join public community spaces later."
            enabled={Boolean(socialQuery.data?.profile_public)}
            onToggle={() => saveSocial.mutate({ profile_public: !socialQuery.data?.profile_public })}
          />
          <SettingRow
            label="Share progress card"
            description="Allow FORGE to prepare your current streak and day card for export/share."
            enabled={Boolean(profile?.quiz_answers?.profileSettings?.shareProgress)}
            onToggle={toggleShareProgress}
          />
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <div className="section-label mb-2">Account</div>
        <div className="grid gap-3">
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                const data = await claudeApi.exportUserData();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = 'forge-export.json';
                anchor.click();
                URL.revokeObjectURL(url);
                pushToast({ title: 'Export ready', variant: 'success' });
              } catch (error) {
                pushToast({ title: error.message || 'Unable to export your data', variant: 'error' });
              }
            }}
          >
            Export Data
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (!window.confirm('Delete your account permanently?')) return;

              try {
                await claudeApi.deleteAccount({ confirm: true });
                await signOut();
                navigate('/');
              } catch (error) {
                pushToast({ title: error.message || 'Unable to delete your account', variant: 'error' });
              }
            }}
          >
            Delete Account
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              await signOut();
              navigate('/login');
            }}
          >
            Logout
          </Button>
        </div>
      </Card>
    </PageWrapper>
  );
}

function SettingRow({ label, description, enabled, onToggle }) {
  return (
    <div className="flex items-start justify-between gap-4 border border-forge-border px-3 py-3">
      <div>
        <div className="font-condensed text-xs font-bold uppercase tracking-[0.18em] text-forge-text">{label}</div>
        <p className="mt-2 text-sm leading-6 text-forge-muted2">{description}</p>
      </div>
      <button
        type="button"
        aria-pressed={enabled}
        onClick={onToggle}
        className={`min-w-20 border px-3 py-2 font-condensed text-[0.68rem] font-bold uppercase tracking-[0.18em] ${
          enabled ? 'border-forge-green bg-forge-green/10 text-forge-green' : 'border-forge-border text-forge-muted2'
        }`}
      >
        {enabled ? 'On' : 'Off'}
      </button>
    </div>
  );
}
