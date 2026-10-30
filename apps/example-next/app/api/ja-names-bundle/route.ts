import { loadJaNamesDictionaryBundle } from "@local-mask-security/patterns-ja/names";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** クライアントが姓名辞書 JSON を同一オリインで取得する（外部 NER ではない） */
export async function GET() {
  const bundle = loadJaNamesDictionaryBundle();
  return NextResponse.json(bundle, {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
