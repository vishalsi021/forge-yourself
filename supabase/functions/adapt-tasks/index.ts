import { corsHeaders } from '../_shared/cors.ts';
import { callClaudeJson } from '../_shared/anthropic.ts';
import { dynamicPools } from '../_shared/tasks.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { last7DaysMissed = [] } = await request.json();
    const fallback = {
      updatedTaskSet: last7DaysMissed.slice(0, 2).flatMap((task: string) => {
        if (task.toLowerCase().includes('read')) return dynamicPools.career.slice(0, 1);
        if (task.toLowerCase().includes('cold')) return dynamicPools.mind.slice(0, 1);
        return dynamicPools.habits.slice(0, 1);
      }),
    };

    const prompt = `User consistently misses: ${JSON.stringify(last7DaysMissed)}. Suggest 2 replacement tasks from the same area with lower resistance. Return JSON with updatedTaskSet.`;
    const result = await callClaudeJson({ prompt, fallback, system: 'Return JSON only.' });
    return Response.json(result, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400, headers: corsHeaders });
  }
});
