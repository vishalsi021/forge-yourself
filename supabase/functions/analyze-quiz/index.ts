import { corsHeaders } from '../_shared/cors.ts';
import { callClaudeJson } from '../_shared/anthropic.ts';
import { enforceRateLimit } from '../_shared/rate-limit.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    enforceRateLimit(`analyze:${ip}`, 10, 60_000);
    const { answers = {}, fallbackScores = {} } = await request.json();

    const fallback = {
      archScores: {
        fitness: fallbackScores.fitness ?? 5,
        mind: fallbackScores.mind ?? 5,
        career: fallbackScores.career ?? 5,
        social: fallbackScores.social ?? 5,
        habits: fallbackScores.habits ?? 5,
        purpose: fallbackScores.purpose ?? 5,
        wealth: fallbackScores.wealth ?? 5,
      },
      topWeaknesses: Object.entries(fallbackScores).sort((a, b) => a[1] - b[1]).slice(0, 2).map(([key]) => key),
      personalizedGreeting: 'Your answers point to strong potential, but your results will depend on whether you turn clarity into repetition.',
      keyInsight: 'The biggest leverage point is aligning your environment and standards so discipline requires less negotiation.',
      day1TaskAdditions: [
        { text: 'Write the one action that would make today a win', area: 'purpose', why: 'Clarity lowers friction.' },
        { text: 'Reset one physical space for 10 minutes', area: 'habits', why: 'Environment shapes compliance.' },
      ],
      alterEgo: {
        name: 'The Builder',
        desc: 'Calm, consistent, and harder to distract than the version of you that negotiates with mood.',
        traits: ['disciplined', 'focused', 'deliberate'],
      },
    };

    const prompt = `You are a behavioral psychologist analyzing a self-improvement assessment. Based on these answers, calculate dimension scores 1-10, identify top 2 weaknesses, write a 50-word personalized greeting, a key insight about this person, suggest 2 additional personalized tasks for Day 1, and suggest an alter ego name, description, and 3 traits. Return valid JSON only. Answers: ${JSON.stringify(answers)}`;

    const result = await callClaudeJson({
      prompt,
      fallback,
      system: 'Return only valid JSON with keys archScores, topWeaknesses, personalizedGreeting, keyInsight, day1TaskAdditions, alterEgo.',
    });

    return Response.json(result, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400, headers: corsHeaders });
  }
});
