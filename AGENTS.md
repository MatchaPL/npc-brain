# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# NPC Company Brain

"สมองของบริษัท" — ผู้ช่วย AI ที่พนักงานถามผ่าน LINE ได้ ตอบจากเอกสารภายในบริษัทจริง (RAG) พร้อมอ้างอิงแหล่งที่มา

## Provider strategy (ฟรี ไม่ต้องใช้บัตร)

- **Embeddings**: Gemini `text-embedding-004` (768 มิติ) — ตัวเดียวเท่านั้น เพราะ vector dimension ต้อง match กับ schema (`vector(768)`)
- **ตอบคำถาม (LLM)**: เลือกอัตโนมัติใน `src/lib/llm.ts` — ถ้ามี `ANTHROPIC_API_KEY` ใช้ Claude, ไม่งั้น fallback ไป Gemini
- ถ้าเปลี่ยน embedding model → ต้องเปลี่ยน `vector(768)` ใน `supabase-schema.sql` และ ingest ใหม่ทั้งหมด

## Golden rule

ทุกคำตอบต้องอ้างอิงเอกสารต้นทาง ถ้า context ที่ retrieve มาไม่มีคำตอบ → ตอบว่า "ไม่พบข้อมูลนี้ในระบบ" **ห้ามแต่งคำตอบเอง** (ดู system prompt ใน `src/lib/rag.ts`)
