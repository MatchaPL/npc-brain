import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import { messagingApi, webhook } from "@line/bot-sdk";
import { supabase } from "@/lib/supabase";
import { answerQuestion, formatReply } from "@/lib/rag";

const channelSecret = process.env.LINE_CHANNEL_SECRET || "";
const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";

const client = new messagingApi.MessagingApiClient({ channelAccessToken });

function validateSignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac("SHA256", channelSecret)
    .update(body)
    .digest("base64");
  return hash === signature;
}

const HELP_TEXT = `NPC Brain — สมองของบริษัท

พิมพ์คำถามเกี่ยวกับบริษัทได้เลย เช่น:
- "ลาป่วยได้กี่วัน ต้องมีใบรับรองแพทย์ไหม"
- "เบิกค่าเดินทางต่างจังหวัดได้เท่าไหร่"
- "ขอ template ใบเสนอราคาอยู่ที่ไหน"
- "wifi office password อะไร"
- "ขั้นตอนขอซื้อของทำยังไง"

ผมจะตอบจากเอกสารภายในบริษัทจริง พร้อมบอกแหล่งอ้างอิงครับ`;

async function handleFollow(event: webhook.FollowEvent) {
  if (!event.replyToken) return;
  await client.replyMessage({
    replyToken: event.replyToken,
    messages: [
      {
        type: "text",
        text: `สวัสดีครับ ผมคือ NPC Brain\nผู้ช่วยที่รู้ทุกเรื่องของบริษัท ถามอะไรก็ได้เกี่ยวกับงาน นโยบาย หรือหาไฟล์ไม่เจอ\n\n${HELP_TEXT}`,
      },
    ],
  });
}

async function handleMessage(event: webhook.MessageEvent) {
  if (
    !event.source ||
    !("userId" in event.source) ||
    !event.source.userId ||
    !event.replyToken ||
    event.message.type !== "text"
  ) {
    return;
  }

  const lineUserId = event.source.userId;
  const text = (event.message as webhook.TextMessageContent).text.trim();

  if (text === "ช่วยเหลือ" || text === "help" || text === "เมนู" || text === "?") {
    await client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: "text", text: HELP_TEXT }],
    });
    return;
  }

  const started = Date.now();
  let reply: string;
  let answered = false;
  let sources: string[] = [];

  try {
    const result = await answerQuestion(text);
    reply = formatReply(result, text);
    answered = result.answered;
    sources = result.sources.map((s) => s.source);
  } catch (e) {
    console.error("RAG error:", e);
    reply = "ขออภัยครับ ระบบมีปัญหาชั่วคราว ลองใหม่อีกครั้งนะครับ";
  }

  const latencyMs = Date.now() - started;

  await client.replyMessage({
    replyToken: event.replyToken,
    messages: [{ type: "text", text: reply }],
  });

  // Log for analytics (fire and forget).
  supabase
    .from("query_logs")
    .insert({
      line_user_id: lineUserId,
      question: text,
      answer: reply,
      answered,
      sources,
      latency_ms: latencyMs,
    })
    .then(({ error }) => {
      if (error) console.error("query_logs insert failed:", error.message);
    });
}

async function handleEvent(event: webhook.Event) {
  if (event.type === "follow") return handleFollow(event as webhook.FollowEvent);
  if (event.type === "message") return handleMessage(event as webhook.MessageEvent);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-line-signature") || "";

  if (!validateSignature(body, signature)) {
    console.error("Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const events: webhook.Event[] = JSON.parse(body).events;
  await Promise.all(events.map(handleEvent));

  return NextResponse.json({ status: "ok" });
}

export async function GET() {
  return NextResponse.json({ status: "NPC Brain webhook is running" });
}
