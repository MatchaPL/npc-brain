// Embeddings via Google Gemini text-embedding-004 (768-dim, free tier, no card).
// This is the single source of embeddings — the DB schema uses vector(768) to match.

const MODEL = "text-embedding-004";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:embedContent`;

export const EMBEDDING_DIM = 768;

/**
 * Embed a single piece of text. `taskType` tunes the vector for its use:
 * RETRIEVAL_DOCUMENT for chunks stored in the DB, RETRIEVAL_QUERY for user questions.
 */
export async function embedText(
  text: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_QUERY",
): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set — required for embeddings.");
  }

  const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${MODEL}`,
      content: { parts: [{ text }] },
      taskType,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini embed failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as { embedding?: { values?: number[] } };
  const values = data.embedding?.values;
  if (!values || values.length !== EMBEDDING_DIM) {
    throw new Error(`Unexpected embedding shape: got ${values?.length} dims`);
  }
  return values;
}
