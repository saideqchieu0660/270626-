export async function executeCerebrasExtraction(
  prompt: string,
  apiKey: string,
  pushLog?: (msg: string, isError?: boolean) => void
) {
  const url = "https://api.cerebras.ai/v1/chat/completions";
  const modelId = "llama3.1-8b-instruct";
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
    const err = new Error(`Cerebras API Error: ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }

  const data = await res.json();
  return data.choices[0].message.content;
}
