// RAG core: retrieve relevant company-doc chunks → build a grounded prompt →
// ask the LLM to answer ONLY from those chunks, with citations.
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { supabase } from "./supabase";
import { embedText } from "./embeddings";
import { generateAnswer } from "./llm";

const TOP_K = Number(process.env.RAG_TOP_K || 5);
// Chunks below this cosine similarity are treated as irrelevant.
const MIN_SIMILARITY = 0.55;
// Sentinel the model returns when the context has no answer.
const NOT_FOUND = "NOT_FOUND";

export interface RetrievedChunk {
  source: string;
  title: string | null;
  category: string | null;
  url: string | null;
  content: string;
  similarity: number;
}

export interface RagResult {
  answer: string;
  answered: boolean;
  sources: { source: string; title: string | null; url: string | null }[];
  chunks: RetrievedChunk[];
}

const SYSTEM_PROMPT = `คุณคือ "NPC Brain" ผู้ช่วยตอบคำถามภายในบริษัท NPC Co., Ltd. ให้กับพนักงาน

กติกาสำคัญ (ห้ามฝ่าฝืน):
1. ตอบ "จากข้อมูลในเอกสารที่ให้มาเท่านั้น" ห้ามใช้ความรู้ทั่วไปหรือเดาเอง
2. ถ้าเอกสารที่ให้มาไม่มีคำตอบ หรือไม่เกี่ยวข้องกับคำถาม ให้ตอบเพียงคำเดียวว่า: ${NOT_FOUND}
3. ตอบเป็นภาษาไทย กระชับ ชัดเจน ตรงประเด็น
4. ถ้ามีขั้นตอน ให้สรุปเป็นข้อ ๆ
5. ห้ามแต่งลิงก์ ตัวเลข วันที่ หรือชื่อไฟล์ที่ไม่ได้อยู่ในเอกสาร

รูปแบบ context: แต่ละชิ้นขึ้นต้นด้วย [แหล่ง: ชื่อไฟล์ — หัวข้อ] ตามด้วยเนื้อหา`;

/** Retrieve the most relevant chunks for a question. */
export async function retrieve(
  question: string,
  category?: string,
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embedText(question, "RETRIEVAL_QUERY");

  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: queryEmbedding,
    match_count: TOP_K,
    filter_category: category ?? null,
  });

  if (error) throw new Error(`match_document_chunks failed: ${error.message}`);
  return (data ?? []) as RetrievedChunk[];
}

/** True when Gemini + Supabase are configured for vector search. */
function vectorConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

// ── No-DB fallback: read local markdown docs directly (tiny corpus) ──
interface LocalDoc {
  source: string;
  title: string | null;
  category: string | null;
  url: string | null;
  content: string;
}
let localDocsCache: LocalDoc[] | null = null;

const DATA_ROOT = join(process.cwd(), "data");
// Both bundled demo docs and user-uploaded files feed Company knowledge.
const DOC_DIRS = ["npc-corp", "uploads"];

/** Clear the cache so freshly uploaded files are picked up on the next query. */
export function resetLocalDocsCache() {
  localDocsCache = null;
}

function loadLocalDocs(): LocalDoc[] {
  if (localDocsCache) return localDocsCache;
  const files: string[] = [];
  const walk = (d: string) => {
    if (!existsSync(d)) return;
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".md") || entry.endsWith(".txt")) files.push(full);
    }
  };
  for (const sub of DOC_DIRS) walk(join(DATA_ROOT, sub));

  localDocsCache = files.map((f) => {
    const raw = readFileSync(f, "utf-8");
    let title: string | null = null;
    let category: string | null = "general";
    let url: string | null = null;
    let body = raw;
    if (raw.startsWith("---")) {
      const end = raw.indexOf("\n---", 3);
      if (end !== -1) {
        for (const line of raw.slice(3, end).split("\n")) {
          const idx = line.indexOf(":");
          if (idx === -1) continue;
          const k = line.slice(0, idx).trim();
          const v = line.slice(idx + 1).trim();
          if (k === "title") title = v;
          else if (k === "category") category = v;
          else if (k === "url") url = v;
        }
        body = raw.slice(end + 4).trim();
      }
    }
    return { source: relative(DATA_ROOT, f), title, category, url, content: body };
  });
  return localDocsCache;
}

/** Language-agnostic relevance via character-bigram overlap (works for Thai). */
function scoreDoc(query: string, content: string): number {
  const q = query.replace(/\s+/g, "");
  if (q.length < 2) return 0;
  const grams = new Set<string>();
  for (let i = 0; i < q.length - 1; i++) grams.add(q.slice(i, i + 2));
  let hits = 0;
  for (const g of grams) if (content.includes(g)) hits++;
  return grams.size ? hits / grams.size : 0;
}

async function answerFromLocalDocs(question: string): Promise<RagResult> {
  const docs = loadLocalDocs();
  const ranked = docs
    .map((d) => ({ doc: d, score: scoreDoc(question, d.content) }))
    .sort((a, b) => b.score - a.score);

  // Use the top matches as context (corpus is tiny). If nothing matches, use all.
  const picked =
    ranked[0]?.score > 0.15 ? ranked.filter((r) => r.score > 0.15).slice(0, 4) : ranked;

  const context = picked
    .map(
      ({ doc }) =>
        `[แหล่ง: ${doc.source}${doc.title ? ` — ${doc.title}` : ""}]\n${doc.content}`,
    )
    .join("\n\n---\n\n");

  const userMessage = `เอกสารอ้างอิง:\n\n${context}\n\n---\n\nคำถามของพนักงาน: ${question}`;
  const raw = await generateAnswer(SYSTEM_PROMPT, userMessage);

  const chunks: RetrievedChunk[] = picked.map(({ doc, score }) => ({
    source: doc.source,
    title: doc.title,
    category: doc.category,
    url: doc.url,
    content: doc.content.slice(0, 200),
    similarity: score,
  }));

  if (!raw || raw.trim().toUpperCase().includes(NOT_FOUND)) {
    return { answer: "", answered: false, sources: [], chunks };
  }

  const seen = new Set<string>();
  const sources: RagResult["sources"] = [];
  for (const { doc, score } of picked) {
    if (score <= 0.15 || seen.has(doc.source)) continue;
    seen.add(doc.source);
    sources.push({ source: doc.source, title: doc.title, url: doc.url });
  }

  return { answer: raw.trim(), answered: true, sources: sources.slice(0, 3), chunks };
}

/** Full RAG pipeline: retrieve → ground → answer with citations. */
export async function answerQuestion(
  question: string,
  category?: string,
): Promise<RagResult> {
  // No Gemini/Supabase configured → answer from local docs directly (no DB needed).
  if (!vectorConfigured()) return answerFromLocalDocs(question);

  const chunks = await retrieve(question, category);
  const relevant = chunks.filter((c) => c.similarity >= MIN_SIMILARITY);

  if (relevant.length === 0) {
    return { answer: "", answered: false, sources: [], chunks };
  }

  const context = relevant
    .map(
      (c) => `[แหล่ง: ${c.source}${c.title ? ` — ${c.title}` : ""}]\n${c.content}`,
    )
    .join("\n\n---\n\n");

  const userMessage = `เอกสารอ้างอิง:\n\n${context}\n\n---\n\nคำถามของพนักงาน: ${question}`;

  const raw = await generateAnswer(SYSTEM_PROMPT, userMessage);

  if (!raw || raw.trim().toUpperCase().includes(NOT_FOUND)) {
    return { answer: "", answered: false, sources: [], chunks };
  }

  // Deduplicate cited sources (keep only ones actually used as context).
  const seen = new Set<string>();
  const sources: RagResult["sources"] = [];
  for (const c of relevant) {
    if (seen.has(c.source)) continue;
    seen.add(c.source);
    sources.push({ source: c.source, title: c.title, url: c.url });
  }

  return { answer: raw.trim(), answered: true, sources, chunks };
}

const WORLD_PROMPT = `คุณคือผู้ช่วย AI ที่เก่งเรื่องการเขียนและค้นคว้า ตอบคำถามด้วยความรู้ทั่วไป
ตอบเป็นภาษาไทย กระชับ ชัดเจน (ตอบภาษาอื่นได้ถ้าผู้ใช้ถามด้วยภาษานั้น)
หมายเหตุ: โหมดนี้ไม่ได้ค้นเอกสารภายในบริษัท ถ้าเป็นคำถามเฉพาะบริษัทให้แนะนำผู้ใช้สลับไปโหมด "Company knowledge"`;

/** World-knowledge answer: ask the LLM directly, no company-doc retrieval. */
export async function answerWorld(question: string): Promise<RagResult> {
  const answer = await generateAnswer(WORLD_PROMPT, question);
  return { answer: answer.trim(), answered: true, sources: [], chunks: [] };
}

/** Format a RAG result into a LINE-friendly text reply with citations. */
export function formatReply(result: RagResult, question: string): string {
  if (!result.answered) {
    return `🔍 ไม่พบข้อมูลนี้ในระบบครับ\n\nคำถาม: "${question}"\n\nลองถามใหม่ด้วยคำที่เฉพาะเจาะจงขึ้น หรือติดต่อฝ่ายที่เกี่ยวข้องโดยตรงนะครับ`;
  }

  let text = result.answer;

  if (result.sources.length > 0) {
    text += `\n\n📎 อ้างอิงจาก:`;
    for (const s of result.sources) {
      text += `\n• ${s.title || s.source}`;
      if (s.url) text += `\n  ${s.url}`;
    }
  }

  return text;
}
