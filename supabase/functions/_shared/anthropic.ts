export async function callClaudeJson({ prompt, fallback, system }: { prompt: string; fallback: unknown; system: string }) {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return fallback;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        system,
        max_tokens: 900,
        temperature: 0.4,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      return fallback;
    }

    const raw = await response.json();
    const text = raw?.content?.map((entry: { text?: string }) => entry.text || '').join('') || '';
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      return fallback;
    }

    return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  } catch {
    return fallback;
  }
}
