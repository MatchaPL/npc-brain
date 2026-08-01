// LLM abstraction. Provider is chosen automatically by which API key is present:
//   1. OPENROUTER_API_KEY → OpenRouter (pick any model via OPENROUTER_MODEL)
//   2. ANTHROPIC_API_KEY   → Claude
//   3. GEMINI_API_KEY      → Gemini (free)
// Override explicitly with LLM_PROVIDER = openrouter | claude | gemini.
//
// NOTE: embeddings always use Gemini (see embeddings.ts) — OpenRouter has no embeddings API.
import Anthropic from "@anthropic-ai/sdk";

type Provider = "openrouter" | "claude" | "gemini";

function detectProvider(): Provider {
  const explicit = process.env.LLM_PROVIDER as Provider | undefined;
  if (explicit) return explicit;
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  return "gemini";
}

export const activeProvider: Provider = detectProvider();

/** Generate an answer given a system prompt and a user message. Returns plain text. */
export async function generateAnswer(
  system: string,
  user: string,
): Promise<string> {
  switch (activeProvider) {
    case "openrouter":
      return generateWithOpenRouter(system, user);
    case "claude":
      return generateWithClaude(system, user);
    default:
      return generateWithGemini(system, user);
  }
}

// ── OpenRouter (OpenAI-compatible; one key, any model) ──
async function generateWithOpenRouter(
  system: string,
  user: string,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY || "";
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set.");
  // Pick your model here, e.g. anthropic/claude-3.5-sonnet, openai/gpt-4o, google/gemini-2.0-flash-001
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // Optional attribution headers (shown on OpenRouter dashboard)
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://npc-brain.local",
      "X-Title": "NPC Brain",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return (data.choices?.[0]?.message?.content || "").trim();
}

// ── Claude (Anthropic SDK) ──
async function generateWithClaude(system: string, user: string): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });
  const model = process.env.LLM_MODEL || "claude-opus-5";

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: user }],
  });

  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

// ── Gemini (free) ──
async function generateWithGemini(system: string, user: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    throw new Error("No LLM configured: set OPENROUTER_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY.");
  }
  const model = process.env.LLM_MODEL || "gemini-2.0-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini generate failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text || "")
    .join("");
  return (text || "").trim();
}
