const LINE_API = 'https://api.line.me/v2/bot/message'
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!

export async function replyMessage(replyToken: string, text: string) {
  await fetch(`${LINE_API}/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text }],
    }),
  })
}

export async function pushMessage(lineUserId: string, text: string) {
  await fetch(`${LINE_API}/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: 'text', text }],
    }),
  })
}

export async function pushMessages(lineUserId: string, texts: string[]) {
  await fetch(`${LINE_API}/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: texts.map(text => ({ type: 'text', text })),
    }),
  })
}
