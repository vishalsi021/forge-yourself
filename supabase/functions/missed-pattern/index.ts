import { corsHeaders } from '../_shared/cors.ts';
import { callClaudeJson } from '../_shared/anthropic.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { top3MissedTasks = [] } = await request.json();
    const fallback = {
      insight: 'You are not avoiding the tasks because they are impossible. You are avoiding the discomfort, ambiguity, or identity cost attached to them.',
    };

    const prompt = `User consistently skips these tasks: ${JSON.stringify(top3MissedTasks)}. In 2 direct sentences, name the psychological pattern behind this and what it reveals. Return JSON with key insight.`;
    const result = await callClaudeJson({ prompt, fallback, system: 'Return JSON only.' });
    return Response.json(result, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400, headers: corsHeaders });
  }
});
