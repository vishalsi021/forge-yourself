import { corsHeaders } from '../_shared/cors.ts';
import { callClaudeJson } from '../_shared/anthropic.ts';
import { enforceRateLimit } from '../_shared/rate-limit.ts';

function getIdentityName(alterEgoName: string | undefined, firstName: string | undefined) {
  const cleanAlterEgo = alterEgoName?.trim();
  if (cleanAlterEgo) return cleanAlterEgo;

  const cleanFirstName = firstName?.trim();
  if (cleanFirstName) return cleanFirstName;

  return 'You';
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    enforceRateLimit(`coach:${ip}`, 15, 60_000);
    const { weekData, alterEgoName, firstName } = await request.json();
    const identityName = getIdentityName(alterEgoName, firstName);

    const fallback = {
      coachMessage: `${identityName}, enough analysis. Pick one standard and protect it daily for the next seven days.`,
      pattern: 'Your misses are not random. They cluster around friction and ambiguity.',
      nextWeekFocus: 'Reduce decision fatigue and front-load your hardest action.',
    };

    const prompt = `You are an elite performance coach. Analyze this week's data and respond as JSON with keys coachMessage, pattern, nextWeekFocus.
Address the user as "${identityName}" in coachMessage.
Write as if coaching that identity directly.
Data: ${JSON.stringify(weekData)}`;

    const result = await callClaudeJson({
      prompt,
      fallback,
      system: 'Direct mentor tone. Address the alter ego identity. JSON only.',
    });

    return Response.json(result, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400, headers: corsHeaders });
  }
});
