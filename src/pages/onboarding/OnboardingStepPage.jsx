import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { onboardingSections } from '@/data/onboardingQuestions';
import { loadOnboardingDraft, saveOnboardingDraft } from '@/lib/onboardingDraft';
import { cn } from '@/utils/cn';

export default function OnboardingStepPage() {
  const navigate = useNavigate();
  const { step } = useParams();
  const index = Number(step) - 1;
  const section = onboardingSections[index];
  const draft = loadOnboardingDraft();
  const [customHabits, setCustomHabits] = useState(draft.custom_habits ?? []);
  const [customInput, setCustomInput] = useState('');

  const defaultValues = useMemo(() => {
    const values = {};
    section?.questions?.forEach((question) => {
      if (question.type === 'chips') values[question.id] = draft[question.id] ?? [];
      else if (question.type === 'custom') values[question.id] = draft[question.id] ?? [];
      else values[question.id] = draft[question.id] ?? question.defaultValue ?? '';
    });
    return values;
  }, [draft, section]);

  const { getValues, setValue, watch, handleSubmit } = useForm({ defaultValues });

  if (!section) {
    navigate('/onboarding/0', { replace: true });
    return null;
  }

  const isLast = index === onboardingSections.length - 1;
  const progress = ((index + 1) / onboardingSections.length) * 100;

  const toggleChip = (questionId, option) => {
    const current = getValues(questionId) ?? [];
    const next = current.includes(option) ? current.filter((item) => item !== option) : [...current, option];
    setValue(questionId, next, { shouldDirty: true });
  };

  const addCustomHabit = () => {
    const value = customInput.trim();
    if (!value || customHabits.includes(value)) return;
    const next = [...customHabits, value];
    setCustomHabits(next);
    setValue('custom_habits', next, { shouldDirty: true });
    setCustomInput('');
  };

  const onSubmit = (values) => {
    const nextDraft = { ...draft, ...values, custom_habits: customHabits };
    saveOnboardingDraft(nextDraft);
    navigate(isLast ? '/onboarding/analyzing' : `/onboarding/${index + 2}`);
  };

  return (
    <PageWrapper className="min-h-screen pb-10 pt-0">
      <div className="sticky top-0 z-20 bg-forge-bg/95 py-4 backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between">
          <span className="section-label">{section.label}</span>
          <span className="font-display text-2xl text-forge-gold">Step {index + 1}/9</span>
        </div>
        <div className="h-[2px] bg-forge-bg4">
          <div className="h-full bg-forge-gold transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="pt-4">
        <div className="mb-5">
          <div className="section-label mb-2">{section.subtitle}</div>
          <h1 className="display-title text-5xl">{section.label}</h1>
        </div>

        <form className="grid gap-3" onSubmit={handleSubmit(onSubmit)}>
          {section.questions.map((question) => (
            <Card key={question.id} className="border-l-2 border-l-forge-gold">
              <p className="mb-4 text-sm leading-6 text-forge-text">{question.text}</p>

              {question.type === 'slider' ? (
                <div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={watch(question.id) || 5}
                    onChange={(event) => setValue(question.id, Number(event.target.value), { shouldDirty: true })}
                    className="w-full accent-[#FFD700]"
                  />
                  <div className="mt-2 flex items-center justify-between font-condensed text-[0.72rem] font-bold uppercase tracking-[0.18em] text-forge-muted2">
                    <span>{question.lo}</span>
                    <span className="font-display text-2xl text-forge-gold">{watch(question.id) || 5}</span>
                    <span>{question.hi}</span>
                  </div>
                </div>
              ) : null}

              {question.type === 'chips' ? (
                <div className="flex flex-wrap gap-2">
                  {question.options.map((option) => {
                    const active = (watch(question.id) ?? []).includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        className={cn(
                          'border px-3 py-2 font-condensed text-xs font-bold uppercase tracking-[0.12em]',
                          active ? 'border-forge-gold bg-forge-gold/10 text-forge-gold' : 'border-forge-border text-forge-muted2',
                        )}
                        onClick={() => toggleChip(question.id, option)}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {question.type === 'text' ? <Textarea placeholder="Write honestly." {...{ value: watch(question.id) || '', onChange: (event) => setValue(question.id, event.target.value, { shouldDirty: true }) }} /> : null}

              {question.type === 'custom' ? (
                <div>
                  <div className="mb-3 font-condensed text-xs font-bold uppercase tracking-[0.2em] text-forge-gold">⭐ Add at least 1 personal habit</div>
                  <div className="flex gap-2">
                    <Input value={customInput} onChange={(event) => setCustomInput(event.target.value)} placeholder="Enter a personal habit" />
                    <Button type="button" onClick={addCustomHabit}>Add</Button>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {customHabits.map((habit) => (
                      <div key={habit} className="flex items-center justify-between border border-forge-gold/20 bg-forge-gold/10 px-3 py-2 text-sm text-forge-text">
                        <span>{habit}</span>
                        <button
                          type="button"
                          className="text-forge-muted2"
                          onClick={() => {
                            const next = customHabits.filter((item) => item !== habit);
                            setCustomHabits(next);
                            setValue('custom_habits', next, { shouldDirty: true });
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </Card>
          ))}

          <div className="grid gap-3 pt-2">
            {index > 0 ? (
              <Button type="button" variant="secondary" onClick={() => navigate(`/onboarding/${index}`)}>
                Back
              </Button>
            ) : (
              <Button type="button" variant="secondary" onClick={() => navigate('/onboarding/0')}>
                Back
              </Button>
            )}
            <Button type="submit" disabled={isLast && customHabits.length === 0}>
              {isLast ? 'Analyze My Protocol' : 'Continue'}
            </Button>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
}
