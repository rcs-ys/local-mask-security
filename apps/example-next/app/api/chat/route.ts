import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * モック LLM: マスク済みテキストのみ受け取り、トークンを保持したまま返す。
 * 本番ではここで外部 LLM API を呼び出す（PII は maskedText のみ渡す）。
 */
export async function POST(request: Request) {
  let body: { maskedText?: string; sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { maskedText } = body;
  if (typeof maskedText !== "string" || !maskedText.trim()) {
    return NextResponse.json(
      { error: "maskedText is required" },
      { status: 400 },
    );
  }

  const content = [
    "【モック LLM 応答】",
    "以下の内容を確認しました（トークンは改変していません）:",
    "",
    maskedText,
  ].join("\n");

  return NextResponse.json({ content });
}
