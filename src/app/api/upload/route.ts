import { NextRequest, NextResponse } from "next/server";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { resetLocalDocsCache } from "@/lib/rag";

export const runtime = "nodejs";

const UPLOAD_DIR = join(process.cwd(), "data", "uploads");

// Accepts a file (multipart/form-data, field "file"), extracts its text, stores it
// as a markdown doc so it becomes part of Company knowledge ("remembers" it).
export async function POST(req: NextRequest) {
  let file: File | null = null;
  try {
    const form = await req.formData();
    file = form.get("file") as File | null;
  } catch {
    return NextResponse.json({ error: "expected multipart/form-data" }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: "no file provided" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const text = buf.toString("utf-8");

  // Reject if it looks like a non-text/binary file (too many replacement chars).
  const replacementRatio =
    (text.match(/�/g)?.length || 0) / Math.max(text.length, 1);
  if (!text.trim() || replacementRatio > 0.1) {
    return NextResponse.json(
      {
        error:
          "อ่านไฟล์เป็นข้อความไม่ได้ (รองรับไฟล์ข้อความ เช่น .txt .md .csv .json — PDF/Word ยังไม่รองรับ)",
      },
      { status: 415 },
    );
  }

  const originalName = file.name || "uploaded.txt";
  const safe = originalName
    .replace(/[^a-zA-Z0-9ก-๙._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  const stamp = Date.now().toString(36);
  const filename = `${safe || "file"}-${stamp}.md`;

  const doc = `---\ntitle: ${originalName}\ncategory: uploaded\n---\n\n${text.trim()}`;

  try {
    mkdirSync(UPLOAD_DIR, { recursive: true });
    writeFileSync(join(UPLOAD_DIR, filename), doc, "utf-8");
  } catch (e) {
    const message = e instanceof Error ? e.message : "write failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Make the new file visible to the next Company-knowledge query.
  resetLocalDocsCache();

  return NextResponse.json({
    ok: true,
    name: originalName,
    source: `uploads/${filename}`,
    chars: text.trim().length,
  });
}
