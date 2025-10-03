import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const message = searchParams.get("message") || "アラートが発生しました"

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="ja-JP">
    安心見守りアプリからの緊急通知です。${message}。この通話を終了するには電話を切ってください。
  </Say>
  <Pause length="2"/>
  <Say voice="alice" language="ja-JP">
    繰り返します。${message}。
  </Say>
</Response>`

  return new NextResponse(twiml, {
    headers: {
      "Content-Type": "application/xml",
    },
  })
}
