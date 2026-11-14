import "server-only";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";

type GeminiContentPart = { type?: string; text?: string; data?: string; mime_type?: string; mimeType?: string };
type GeminiInteraction = {
  output_text?: string;
  output_image?: { data?: string; mime_type?: string; mimeType?: string };
  output?: GeminiContentPart[];
  steps?: Array<{
    content?: GeminiContentPart[];
    model_output?: { content?: GeminiContentPart[] };
  }>;
};

function getKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
}

async function callGemini(payload: Record<string, unknown>, timeoutMs: number) {
  const apiKey = getKey();
  if (!apiKey) throw new Error("GEMINI_NOT_CONFIGURED");

  const response = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({ ...payload, store: false }),
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });

  const result = await response.json().catch(() => null) as GeminiInteraction | { error?: { message?: string } } | null;
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error("GEMINI_KEY_REJECTED");
    if (response.status === 429) throw new Error("GEMINI_RATE_LIMIT");
    throw new Error("GEMINI_UPSTREAM_ERROR");
  }
  if (!result) throw new Error("GEMINI_INVALID_RESPONSE");
  return result as GeminiInteraction;
}

function extractText(result: GeminiInteraction) {
  if (typeof result.output_text === "string" && result.output_text.trim()) return result.output_text.trim();

  const parts: string[] = [];
  for (const item of result.output ?? []) {
    if (item.type === "text" && typeof item.text === "string") parts.push(item.text);
  }
  for (const step of result.steps ?? []) {
    const content = [...(step.content ?? []), ...(step.model_output?.content ?? [])];
    for (const item of content) {
      if (item.type === "text" && typeof item.text === "string") parts.push(item.text);
    }
  }
  return parts.join("\n").trim();
}

export async function generateGeminiText(
  input: string,
  systemInstruction: string,
  options: { model?: string; timeoutMs?: number; maxOutputTokens?: number } = {},
) {
  const response = await callGemini({
    model: options.model || process.env.GEMINI_MODEL || "gemini-3.8-flash",
    system_instruction: systemInstruction,
    input,
    generation_config: {
      temperature: 0.35,
      max_output_tokens: options.maxOutputTokens ?? 1800,
    },
  }, options.timeoutMs ?? 40_000);

  const text = extractText(response);
  if (!text) throw new Error("GEMINI_EMPTY_RESPONSE");
  return text;
}

export async function generateGeminiImage(prompt: string) {
  const response = await callGemini({
    model: process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image",
    input: prompt,
    response_format: {
      type: "image",
      mime_type: "image/png",
      aspect_ratio: "16:9",
      image_size: "1K",
    },
  }, 40_000);

  const image = response.output_image;
  if (image?.data) {
    return {
      data: image.data,
      mimeType: image.mime_type || image.mimeType || "image/png",
    };
  }

  for (const step of response.steps ?? []) {
    const content = [...(step.content ?? []), ...(step.model_output?.content ?? [])];
    const imagePart = content.find((item) => item.type === "image" && typeof item.data === "string");
    if (imagePart?.data) {
      return { data: imagePart.data, mimeType: imagePart.mime_type || imagePart.mimeType || "image/png" };
    }
  }

  throw new Error("GEMINI_IMAGE_EMPTY");
}

export function isGeminiConfigured() {
  return Boolean(getKey());
}
