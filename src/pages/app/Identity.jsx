import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { PageWrapper } from '@/components/layout/PageWrapper';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { valuesList } from '@/data/values';
import { useAuth } from '@/hooks/useAuth';
import { mergeProfileQuizAnswers, updateProfile } from '@/lib/profile';
import { getTodayDateString } from '@/utils/dateHelpers';

export default function IdentityPage() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const [traitInput, setTraitInput] = useState('');
  const [mission, setMission] = useState(profile?.mission_statement || '');
  const alterEgo = profile?.alter_ego || { name: '', desc: '', traits: [] };
  const selectedValues = profile?.selected_values || [];
  const identityVotes = profile?.quiz_answers?.identityVotes || {};
  const todayKey = getTodayDateString();

  const preview = useMemo(() => {
    const parts = mission.split('|');
    return parts.filter(Boolean).join(' ');
  }, [mission]);

  const saveProfile = useMutation({
    mutationFn: async (patch) => updateProfile(user.id, patch),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth-state'] });
    },
  });

  const saveVotes = async (nextVotes) => {
    await mergeProfileQuizAnswers(user.id, (current) => ({
      ...current,
      identityVotes: {
        ...(current.identityVotes || {}),
        [todayKey]: nextVotes,
      },
    }));
    await queryClient.invalidateQueries({ queryKey: ['auth-state'] });
  };

  const voteStatements = (alterEgo.name ? [
    `A ${alterEgo.name} reads every day`,
    `A ${alterEgo.name} never misses a workout`,
    `A ${alterEgo.name} tracks finances weekly`,
    `A ${alterEgo.name} chooses discomfort over comfort`,
    `A ${alterEgo.name} shows up fully every day`,
  ] : [
    'A disciplined person reads every day',
    'A disciplined person never misses a workout',
    'A disciplined person tracks finances weekly',
    'A disciplined person chooses discomfort over comfort',
    'A disciplined person shows up fully every day',
  ]);

  const todayVotes = identityVotes[todayKey] || [];

  return (
    <PageWrapper>
      <Card className="border border-forge-gold/20 p-5">
        <div className="section-label mb-2">Alter ego</div>
        <h1 className="display-title text-5xl">{alterEgo.name || 'Define your alter ego'}</h1>
        <p className="mt-3 text-sm leading-6 text-forge-muted2">{alterEgo.desc || 'Examples: Black Mamba, Sasha Fierce, The Builder.'}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(alterEgo.traits || []).map((trait) => <Badge key={trait}>{trait}</Badge>)}
        </div>
        <div className="mt-5 grid gap-4">
          <Input placeholder="Alter ego name" defaultValue={alterEgo.name} onBlur={(event) => saveProfile.mutate({ alter_ego: { ...alterEgo, name: event.target.value } })} />
          <Textarea placeholder="Alter ego essence" defaultValue={alterEgo.desc} onBlur={(event) => saveProfile.mutate({ alter_ego: { ...alterEgo, desc: event.target.value } })} />
          <div className="flex gap-2">
            <Input value={traitInput} onChange={(event) => setTraitInput(event.target.value)} placeholder="Add a trait" />
            <Button type="button" onClick={() => {
              if (!traitInput.trim()) return;
              saveProfile.mutate({ alter_ego: { ...alterEgo, traits: [...(alterEgo.traits || []), traitInput.trim()] } });
              setTraitInput('');
            }}>Add</Button>
          </div>
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <div className="section-label mb-2">Core values</div>
        <p className="mb-4 text-sm text-forge-muted2">Select up to 7 values that define the person you are becoming.</p>
        <div className="grid grid-cols-2 gap-3">
          {valuesList.map((value) => {
            const selected = selectedValues.includes(value.name);
            return (
              <button
                key={value.name}
                type="button"
                className={`border p-3 text-left ${selected ? 'border-forge-gold bg-forge-gold/10' : 'border-forge-border bg-forge-bg3'}`}
                onClick={() => {
                  const next = selected
                    ? selectedValues.filter((item) => item !== value.name)
                    : selectedValues.length < 7
                      ? [...selectedValues, value.name]
                      : selectedValues;
                  saveProfile.mutate({ selected_values: next });
                }}
              >
                <div className="font-condensed text-xs font-bold uppercase tracking-[0.16em] text-forge-text">{value.name}</div>
                <div className="mt-2 text-xs leading-5 text-forge-muted2">{value.description}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <div className="section-label mb-2">Mission statement</div>
        <Textarea
          placeholder="I am [identity] | who [what you do] | so that [your why] | My standard is [non-negotiable]."
          value={mission}
          onChange={(event) => setMission(event.target.value)}
        />
        <div className="mt-4 border border-forge-gold/20 bg-forge-gold/10 p-4 text-sm leading-6 text-forge-text">{preview || 'Fill the formula to generate your mission statement.'}</div>
        <Button className="mt-4 w-full" onClick={() => saveProfile.mutate({ mission_statement: preview || mission })}>Save Mission Statement</Button>
      </Card>

      <Card className="mt-4 p-5">
        <div className="section-label mb-2">Identity votes</div>
        <p className="mb-4 text-sm text-forge-muted2">Every action is a vote for the person you are becoming.</p>
        <div className="grid gap-3">
          {voteStatements.map((statement) => {
            const active = todayVotes.includes(statement);
            return (
              <button key={statement} type="button" className={`border p-4 text-left ${active ? 'border-forge-green bg-forge-green/10 text-forge-green' : 'border-forge-border text-forge-muted2'}`} onClick={() => {
                const next = active ? todayVotes.filter((item) => item !== statement) : [...todayVotes, statement];
                saveVotes(next);
              }}>
                {statement}
              </button>
            );
          })}
        </div>
        <div className="mt-4 text-sm text-forge-muted2">{todayVotes.length}/5 identity votes today</div>
      </Card>
    </PageWrapper>
  );
}
