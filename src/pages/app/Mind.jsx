import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { PageWrapper } from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { cbtExercises } from '@/data/cbtExercises';
import { hubermanProtocol } from '@/data/hubermanProtocol';
import { stoicPractices } from '@/data/stoicPractices';
import { useAuth } from '@/hooks/useAuth';
import { mergeProfileQuizAnswers } from '@/lib/profile';
import { supabase } from '@/lib/supabase';

const beliefLibrary = [
  { belief: 'I’m not smart enough', reframe: 'Ability is trainable. A fixed self-story makes improvement harder than the work itself.' },
  { belief: 'I don’t deserve success', reframe: 'Success follows repeated behavior more than worthiness narratives.' },
  { belief: 'I’ll start when I’m ready', reframe: 'Readiness usually follows action, not the other way around.' },
  { belief: 'I always self-sabotage', reframe: 'Patterns can be interrupted when the unmet need underneath them becomes visible.' },
  { belief: 'I’m too old or too young to change', reframe: 'Neuroplasticity does not vanish because a story says it should.' },
  { belief: 'People like me don’t succeed', reframe: 'Identity is partly inherited, but standards and action still rewrite the story.' },
];

const distortionOptions = ['Catastrophizing', 'All-or-nothing', 'Mind-reading', 'Overgeneralizing', 'Personalization', 'Fortune-telling', 'Emotional reasoning', 'Should statements'];

export default function MindPage() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('cbt');
  const [cbtStep, setCbtStep] = useState(0);
  const [cbtValues, setCbtValues] = useState({});
  const [dopamineState, setDopamineState] = useState({});
  const [stoicText, setStoicText] = useState('');

  const extras = profile?.quiz_answers || {};
  const savedBeliefs = extras.beliefs || beliefLibrary;
  const savedHuberman = extras.hubermanChecklist || {};

  const cbtHistoryQuery = useQuery({
    queryKey: ['cbt-history', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cbt_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const completeCbt = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user.id,
        session_number: (cbtHistoryQuery.data?.[0]?.session_number || 0) + 1,
        answers: cbtValues,
        distortion_type: cbtValues.step2 || '',
      };
      const { error } = await supabase.from('cbt_sessions').insert(payload);
      if (error) throw error;
    },
    onSuccess: async () => {
      setCbtStep(0);
      setCbtValues({});
      await queryClient.invalidateQueries({ queryKey: ['cbt-history', user?.id] });
    },
  });

  const saveExtras = async (updater) => {
    await mergeProfileQuizAnswers(user.id, updater);
    await queryClient.invalidateQueries({ queryKey: ['auth-state'] });
  };

  const dopamineScore = useMemo(() => {
    const scores = {
      scroll: -15,
      porn: -40,
      junk: -20,
      phone: -25,
      procrastinated: -15,
      alcohol: -50,
      exercised: 35,
      focused: 30,
      cold: 25,
      goal: 40,
      connection: 20,
      learned: 15,
    };

    let total = 50;
    Object.entries(dopamineState).forEach(([key, value]) => {
      if (value) total += scores[key] || 0;
    });
    return Math.max(0, Math.min(100, total));
  }, [dopamineState]);

  const tabs = [
    { id: 'cbt', label: 'CBT' },
    { id: 'beliefs', label: 'Beliefs' },
    { id: 'dopamine', label: 'Dopamine' },
    { id: 'stoic', label: 'Stoicism' },
    { id: 'huberman', label: 'Huberman' },
  ];

  return (
    <PageWrapper>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((item) => (
          <button key={item.id} className={`border px-3 py-2 font-condensed text-xs font-bold uppercase tracking-[0.18em] ${tab === item.id ? 'border-forge-gold bg-forge-gold/10 text-forge-gold' : 'border-forge-border text-forge-muted2'}`} onClick={() => setTab(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'cbt' ? (
        <Card className="p-5">
          <div className="section-label mb-2">Cognitive Behavioral Therapy</div>
          <p className="mb-4 text-sm leading-6 text-forge-muted2">CBT works by slowing down automatic stories, checking them against evidence, and replacing distortions with action.</p>
          <div className="font-condensed text-xs font-bold uppercase tracking-[0.18em] text-forge-purple">{cbtExercises[cbtStep].step}</div>
          <p className="mt-3 text-sm text-forge-text">{cbtExercises[cbtStep].prompt}</p>
          {cbtStep === 2 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {distortionOptions.map((option) => (
                <button key={option} type="button" className={`border px-3 py-2 font-condensed text-xs font-bold uppercase tracking-[0.12em] ${cbtValues.step2 === option ? 'border-forge-purple bg-forge-purple/10 text-forge-purple' : 'border-forge-border text-forge-muted2'}`} onClick={() => setCbtValues((current) => ({ ...current, step2: option }))}>
                  {option}
                </button>
              ))}
            </div>
          ) : null}
          <Textarea className="mt-4" placeholder={cbtExercises[cbtStep].placeholder} value={cbtValues[`step${cbtStep}`] || ''} onChange={(event) => setCbtValues((current) => ({ ...current, [`step${cbtStep}`]: event.target.value }))} />
          <p className="mt-2 text-xs text-forge-muted2">{cbtExercises[cbtStep].example}</p>
          <div className="mt-4 grid gap-3">
            <Button variant="secondary" onClick={() => setCbtStep((value) => Math.max(0, value - 1))} disabled={cbtStep === 0}>Back</Button>
            {cbtStep < cbtExercises.length - 1 ? (
              <Button onClick={() => setCbtStep((value) => Math.min(cbtExercises.length - 1, value + 1))}>Next Step</Button>
            ) : (
              <Button onClick={() => completeCbt.mutate()} disabled={completeCbt.isPending}>Complete Session</Button>
            )}
          </div>
          <div className="mt-6">
            <div className="section-label mb-3">Recent sessions</div>
            <div className="grid gap-2">
              {(cbtHistoryQuery.data || []).map((session) => (
                <div key={session.id} className="border border-forge-border p-3 text-sm text-forge-muted2">Session {session.session_number} · {session.distortion_type || 'No distortion tagged'}</div>
              ))}
            </div>
          </div>
        </Card>
      ) : null}

      {tab === 'beliefs' ? (
        <Card className="p-5">
          <div className="section-label mb-2">Limiting beliefs</div>
          <div className="grid gap-3">
            {savedBeliefs.map((item, index) => (
              <Card key={`${item.belief}-${index}`} className="bg-forge-bg3 p-4">
                <div className="font-condensed text-xs font-bold uppercase tracking-[0.18em] text-forge-purple">Belief</div>
                <p className="mt-2 text-sm text-forge-text">{item.belief}</p>
                <div className="mt-4 font-condensed text-xs font-bold uppercase tracking-[0.18em] text-forge-muted2">Reframe</div>
                <p className="mt-2 text-sm leading-6 text-forge-muted2">{item.reframe}</p>
              </Card>
            ))}
          </div>
          <Button
            className="mt-4 w-full"
            variant="secondary"
            onClick={async () => {
              const belief = window.prompt('Write your limiting belief');
              if (!belief) return;
              await saveExtras((current) => ({
                ...current,
                beliefs: [...(current.beliefs || beliefLibrary), { belief, reframe: 'Challenge this belief with evidence and repetition until it loses authority.' }],
              }));
            }}
          >
            Add My Own Belief
          </Button>
        </Card>
      ) : null}

      {tab === 'dopamine' ? (
        <Card className="p-5">
          <div className="section-label mb-2">Dopamine science</div>
          <div className="font-display text-7xl text-forge-gold">{dopamineScore}</div>
          <div className="mt-2 text-sm text-forge-muted2">Your score is {dopamineScore}. {dopamineScore >= 80 ? 'Your system is dialed in.' : dopamineScore >= 60 ? 'You are stable with room to sharpen.' : dopamineScore >= 40 ? 'You have meaningful drains to fix.' : 'Your reward system is depleted right now.'}</div>
          <div className="mt-5 grid gap-3">
            {[
              ['scroll', 'Scrolled social media', '-15'],
              ['porn', 'Watched porn', '-40'],
              ['junk', 'Ate junk food', '-20'],
              ['phone', 'Phone first thing in the morning', '-25'],
              ['procrastinated', 'Procrastinated 30+ min', '-15'],
              ['alcohol', 'Alcohol or substances', '-50'],
              ['exercised', 'Exercised today', '+35'],
              ['focused', 'Did hard work without distraction', '+30'],
              ['cold', 'Cold shower', '+25'],
              ['goal', 'Hit a goal or milestone', '+40'],
              ['connection', 'Had genuine human connection', '+20'],
              ['learned', 'Learned something new', '+15'],
            ].map(([key, label, impact]) => (
              <button key={key} type="button" className={`flex items-center justify-between border px-3 py-3 text-sm ${dopamineState[key] ? 'border-forge-gold bg-forge-gold/10 text-forge-gold' : 'border-forge-border text-forge-muted2'}`} onClick={() => setDopamineState((current) => ({ ...current, [key]: !current[key] }))}>
                <span>{label}</span>
                <span>{impact}</span>
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      {tab === 'stoic' ? (
        <Card className="p-5">
          <div className="section-label mb-2">Stoic practice</div>
          <div className="display-title text-4xl">{stoicPractices[0].type}</div>
          <p className="mt-3 text-sm italic text-forge-text">{stoicPractices[0].quote}</p>
          <p className="mt-3 text-sm leading-6 text-forge-muted2">{stoicPractices[0].context}</p>
          <Textarea className="mt-4" placeholder={stoicPractices[0].placeholder} value={stoicText} onChange={(event) => setStoicText(event.target.value)} />
          <Button className="mt-4 w-full" onClick={() => saveExtras((current) => ({ ...current, stoicHistory: [{ date: new Date().toISOString(), text: stoicText }, ...(current.stoicHistory || [])].slice(0, 7) }))}>Save Reflection</Button>
        </Card>
      ) : null}

      {tab === 'huberman' ? (
        <Card className="p-5">
          <div className="section-label mb-2">Huberman protocol</div>
          <div className="grid gap-3">
            {hubermanProtocol.map((block) => (
              <Card key={block.time} className="bg-forge-bg3 p-4" style={{ borderLeft: `2px solid ${block.color}` }}>
                <div className="font-condensed text-xs font-bold uppercase tracking-[0.18em]" style={{ color: block.color }}>{block.time} — {block.title}</div>
                <div className="mt-3 grid gap-2">
                  {block.items.map((item) => {
                    const key = `${block.time}:${item}`;
                    const checked = savedHuberman[key];
                    return (
                      <button key={item} type="button" className={`flex items-center gap-3 border px-3 py-3 text-left text-sm ${checked ? 'border-forge-green bg-forge-green/10 text-forge-green' : 'border-forge-border text-forge-muted2'}`} onClick={() => saveExtras((current) => ({ ...current, hubermanChecklist: { ...(current.hubermanChecklist || {}), [key]: !checked } }))}>
                        <span>{checked ? '✓' : '○'}</span>
                        <span>{item}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </Card>
      ) : null}
    </PageWrapper>
  );
}
