/**
 * Ingest company docs into Supabase pgvector.
 *
 *   1. reads every .md under data/npc-corp/ (recursively)
 *   2. parses optional frontmatter (title / category / url)
 *   3. chunks the body, embeds each chunk with Gemini
 *   4. replaces existing rows for that source, then inserts
 *
 * Run:  npm run ingest
 */
import { config } from "dotenv";
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";
import { createClient } from "@supabase/supabase-js";
import { embedText } from "../src/lib/embeddings";

config({ path: ".env.local" });

const DATA_DIR = join(process.cwd(), "data", "npc-corp");
const CHUNK_TARGET = 700; // approx chars per chunk
const CHUNK_OVERLAP = 120;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars. Copy .env.local.example → .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

interface Frontmatter {
  title?: string;
  category?: string;
  url?: string;
}

function parseFrontmatter(raw: string): { meta: Frontmatter; body: string } {
  if (!raw.startsWith("---")) return { meta: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { meta: {}, body: raw };

  const header = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).trim();
  const meta: Frontmatter = {};
  for (const line of header.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key === "title" || key === "category" || key === "url") meta[key] = value;
  }
  return { meta, body };
}

function chunkText(text: string): string[] {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const p of paragraphs) {
    if ((current + "\n\n" + p).length > CHUNK_TARGET && current) {
      chunks.push(current.trim());
      // start next chunk with a small overlap tail for context continuity
      const tail = current.slice(-CHUNK_OVERLAP);
      current = tail + "\n\n" + p;
    } else {
      current = current ? current + "\n\n" + p : p;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith(".md")) out.push(full);
  }
  return out;
}

async function main() {
  const files = walk(DATA_DIR);
  console.log(`Found ${files.length} markdown files.\n`);

  let totalChunks = 0;

  for (const file of files) {
    const source = relative(DATA_DIR, file);
    const raw = readFileSync(file, "utf-8");
    const { meta, body } = parseFrontmatter(raw);
    const chunks = chunkText(body);

    // Replace any existing rows for this source (idempotent re-ingest).
    await supabase.from("document_chunks").delete().eq("source", source);

    const rows = [];
    for (let i = 0; i < chunks.length; i++) {
      process.stdout.write(`  ${source} [${i + 1}/${chunks.length}]\r`);
      const embedding = await embedText(chunks[i], "RETRIEVAL_DOCUMENT");
      rows.push({
        source,
        title: meta.title || source,
        category: meta.category || "general",
        url: meta.url || null,
        chunk_index: i,
        content: chunks[i],
        embedding,
      });
    }

    const { error } = await supabase.from("document_chunks").insert(rows);
    if (error) {
      console.error(`\n✗ ${source}: ${error.message}`);
    } else {
      console.log(`✓ ${source} — ${chunks.length} chunks (${meta.category || "general"})`);
      totalChunks += chunks.length;
    }
  }

  console.log(`\nDone. Ingested ${totalChunks} chunks from ${files.length} files.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
