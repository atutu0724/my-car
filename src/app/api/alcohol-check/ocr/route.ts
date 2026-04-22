import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const { imageBase64 } = await request.json()
  if (!imageBase64) return NextResponse.json({ error: 'Missing image' }, { status: 400 })

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
          },
          {
            type: 'text',
            text: 'この画像はアルコールチェッカーの表示画面です。数値（mg/L）を読み取り、数値のみを返してください。例: 0.00 または 0.15。数値が読み取れない場合は "unknown" と返してください。',
          },
        ],
      },
    ],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()
  const match = raw.match(/\d+\.?\d*/)
  const concentration = match ? parseFloat(match[0]) : null

  return NextResponse.json({ concentration, raw })
}
