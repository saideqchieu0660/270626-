export async function executeGeminiExtraction(
  prompt: string,
  apiKey: string,
  pushLog?: (msg: string, isError?: boolean) => void
) {
  const url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
  const modelId = "models/gemini-1.5-flash";
  const payload = {
    model: modelId,
    messages: [{ role: "user", content: prompt }],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    if (res.status === 404 && pushLog) {
      pushLog(
        `[404 DEBUG] Failed URL: ${url} | Model Passed: ${modelId} | Payload: ${JSON.stringify(
          payload
        )}`,
        true
      );
    }
    const err = new Error(`Gemini API Error: ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }

  const data = await res.json();
  return data.choices[0].message.content;
}
