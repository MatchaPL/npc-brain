import { NextRequest, NextResponse } from "next/server";
import { answerQuestion, answerWorld } from "@/lib/rag";
import { activeProvider } from "@/lib/llm";

// REST endpoint for the web playground.
//   mode: "company" (RAG over company docs, default) | "world" (LLM only, no retrieval)
export async function POST(req: NextRequest) {
  let question = "";
  let category: string | undefined;
  let mode: "company" | "world" = "company";
  try {
    const body = await req.json();
    question = (body.question || "").trim();
    category = body.category || undefined;
    if (body.mode === "world") mode = "world";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  try {
    const result =
      mode === "world"
        ? await answerWorld(question)
        : await answerQuestion(question, category);

    return NextResponse.json({
      mode,
      provider: activeProvider,
      answered: result.answered,
      answer: result.answer,
      sources: result.sources,
      matches: result.chunks.map((c) => ({
        source: c.source,
        title: c.title,
        similarity: Number(c.similarity.toFixed(3)),
      })),
    });
  } catch (e) {
    console.error("/api/ask error:", e);
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
