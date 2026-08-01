-- NPC Company Brain — Database Schema (RAG with pgvector)
-- Run this in Supabase SQL Editor (supabase.com > SQL Editor > New Query)
--
-- NOTE: embedding dimension = 768 to match Gemini text-embedding-004.
-- If you switch embedding models, change vector(768) everywhere and re-ingest.

-- 1) Enable pgvector
create extension if not exists vector;

-- 2) Document chunks (one row per chunk of a source document)
create table if not exists document_chunks (
  id uuid default gen_random_uuid() primary key,
  source text not null,          -- filename, e.g. "hr-leave-policy.md"
  title text,                    -- human title, e.g. "นโยบายการลา"
  category text,                 -- hr | finance | it | sop | files | customer | general
  url text,                      -- link to original file (Drive/SharePoint) if any
  chunk_index int default 0,     -- order within the source doc
  content text not null,         -- the chunk text
  embedding vector(768),
  created_at timestamptz default now()
);

-- Vector index for fast similarity search (cosine distance)
create index if not exists idx_document_chunks_embedding
  on document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create index if not exists idx_document_chunks_source on document_chunks(source);
create index if not exists idx_document_chunks_category on document_chunks(category);

-- 3) Similarity search function (called via supabase.rpc)
create or replace function match_document_chunks(
  query_embedding vector(768),
  match_count int default 5,
  filter_category text default null
)
returns table (
  id uuid,
  source text,
  title text,
  category text,
  url text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    dc.id,
    dc.source,
    dc.title,
    dc.category,
    dc.url,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  where filter_category is null or dc.category = filter_category
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

-- 4) Query log (for demo analytics: what people ask, was it answered)
create table if not exists query_logs (
  id uuid default gen_random_uuid() primary key,
  line_user_id text,
  question text not null,
  answer text,
  answered boolean default true,   -- false when the bot could not find info
  sources text[],                  -- source filenames cited
  latency_ms int,
  created_at timestamptz default now()
);

create index if not exists idx_query_logs_created on query_logs(created_at desc);

-- 5) RLS — allow the service role full access (server-side only usage)
alter table document_chunks enable row level security;
alter table query_logs enable row level security;

create policy "service role full access - chunks" on document_chunks for all using (true) with check (true);
create policy "service role full access - logs" on query_logs for all using (true) with check (true);
