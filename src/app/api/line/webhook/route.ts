import { createHmac } from 'crypto'
import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { replyMessage } from '@/lib/line'

function verifySignature(body: string, signature: string): boolean {
  const hash = createHmac('SHA256', process.env.LINE_CHANNEL_SECRET!)
    .update(body)
    .digest('base64')
  return hash === signature
}

function parseDate(input: string): string | null {
  const cleaned = input
    .replace(/年/g, '-').replace(/月/g, '-').replace(/日/g, '')
    .replace(/\//g, '-').trim()
  const match = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (!match) return null
  const [, y, m, d] = match
  const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  if (isNaN(new Date(iso).getTime())) return null
  return iso
}

type Session = {
  line_user_id: string
  step: string
  vehicle_id: string | null
  temp_data: Record<string, string>
  updated_at: string
}

async function getSession(supabase: ReturnType<typeof createServiceClient>, lineUserId: string): Promise<Session | null> {
  const { data } = await supabase
    .from('line_sessions')
    .select('*')
    .eq('line_user_id', lineUserId)
    .single()
  return data as Session | null
}

async function setSession(
  supabase: ReturnType<typeof createServiceClient>,
  lineUserId: string,
  patch: Partial<Session>
): Promise<string | null> {
  const { error } = await supabase
    .from('line_sessions')
    .upsert(
      { line_user_id: lineUserId, updated_at: new Date().toISOString(), ...patch },
      { onConflict: 'line_user_id' }
    )
  return error ? error.message : null
}

async function clearSession(supabase: ReturnType<typeof createServiceClient>, lineUserId: string) {
  await supabase.from('line_sessions').delete().eq('line_user_id', lineUserId)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-line-signature') ?? ''

  if (!verifySignature(body, signature)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const payload = JSON.parse(body)
  const supabase = createServiceClient()

  for (const event of payload.events ?? []) {
    const lineUserId: string = event.source?.userId
    if (!lineUserId) continue

    if (event.type === 'follow') {
      await replyMessage(
        event.replyToken,
        'マイカー通勤管理システムへようこそ！\n\nご自身の氏名をそのまま送信してください。\n例：山田 太郎\n\nシステムと連携されます。'
      )
      continue
    }

    if (event.type === 'unfollow') {
      await supabase.from('employees').update({ line_user_id: null }).eq('line_user_id', lineUserId)
      await clearSession(supabase, lineUserId)
      continue
    }

    if (event.type !== 'message' || event.message?.type !== 'text') continue

    const text: string = event.message.text.trim()

    // 未連携 → 名前登録フロー
    const { data: employee } = await supabase
      .from('employees')
      .select('id, name')
      .eq('line_user_id', lineUserId)
      .single()

    if (!employee) {
      await handleRegistration(supabase, lineUserId, event.replyToken, text)
      continue
    }

    // 連携解除コマンド
    if (text === '連携解除' || text === '解除') {
      await setSession(supabase, lineUserId, { step: 'confirm_unlink', temp_data: {} })
      await replyMessage(
        event.replyToken,
        `⚠️ LINE連携を解除しますか？\n\n解除すると更新通知が届かなくなります。\n\n「はい」で解除、「いいえ」でキャンセル`
      )
      continue
    }

    // キャンセルコマンド
    if (text === 'キャンセル' || text === 'cancel') {
      await clearSession(supabase, lineUserId)
      await replyMessage(event.replyToken, '操作をキャンセルしました。')
      continue
    }

    // セッション取得
    const session = await getSession(supabase, lineUserId)
    const step = session?.step ?? 'idle'

    if (step === 'confirm_unlink') {
      if (text === 'はい') {
        await supabase.from('employees').update({ line_user_id: null }).eq('id', employee.id)
        await clearSession(supabase, lineUserId)
        await replyMessage(event.replyToken, '✅ LINE連携を解除しました。\nまた連携する場合は氏名を送信してください。')
      } else {
        await clearSession(supabase, lineUserId)
        await replyMessage(event.replyToken, '解除をキャンセルしました。')
      }
    } else if (step === 'idle') {
      if (text === '更新' || text === '車両更新') {
        await handleUpdateStart(supabase, lineUserId, event.replyToken, employee.id)
      } else {
        await replyMessage(
          event.replyToken,
          `${employee.name} さん、こんにちは！\n\n「更新」→ 車両情報を更新\n「連携解除」→ LINE連携を解除`
        )
      }
    } else if (step === 'select_vehicle') {
      await handleVehicleSelect(supabase, lineUserId, event.replyToken, text, session!)
    } else if (step === 'input_inspection') {
      await handleInputInspection(supabase, lineUserId, event.replyToken, text, session!)
    } else if (step === 'input_compulsory') {
      await handleInputCompulsory(supabase, lineUserId, event.replyToken, text, session!)
    } else if (step === 'input_voluntary') {
      await handleInputVoluntary(supabase, lineUserId, event.replyToken, text, session!)
    } else if (step === 'input_license') {
      await handleInputLicense(supabase, lineUserId, event.replyToken, text, session!, employee.id, employee.name)
    }
  }

  return new Response('OK', { status: 200 })
}

async function handleRegistration(
  supabase: ReturnType<typeof createServiceClient>,
  lineUserId: string,
  replyToken: string,
  text: string
) {
  const normalized = text.replace(/\s/g, '')
  const { data: employees } = await supabase
    .from('employees')
    .select('id, name')
    .is('line_user_id', null)

  const matched = employees?.filter(e =>
    e.name.replace(/\s/g, '') === normalized || e.name === text
  )

  if (!matched || matched.length === 0) {
    await replyMessage(replyToken, `「${text}」に一致する従業員が見つかりませんでした。\n正確な氏名を送信してください。`)
    return
  }
  if (matched.length > 1) {
    await replyMessage(replyToken, '同じ名前の従業員が複数います。管理者にLINE ID連携を依頼してください。')
    return
  }

  await supabase.from('employees').update({ line_user_id: lineUserId }).eq('id', matched[0].id)
  await replyMessage(
    replyToken,
    `✅ ${matched[0].name} さんとして登録完了しました！\n\n「更新」と送信すると車両情報を更新できます。`
  )
}

async function handleUpdateStart(
  supabase: ReturnType<typeof createServiceClient>,
  lineUserId: string,
  replyToken: string,
  employeeId: string
) {
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, license_plate, vehicle_type')
    .eq('employee_id', employeeId)

  if (!vehicles || vehicles.length === 0) {
    await replyMessage(replyToken, '登録されている車両がありません。\n管理者に車両の登録を依頼してください。')
    return
  }

  if (vehicles.length === 1) {
    await setSession(supabase, lineUserId, {
      step: 'input_inspection',
      vehicle_id: vehicles[0].id,
      temp_data: {},
    })
    await replyMessage(
      replyToken,
      `【${vehicles[0].license_plate}】の情報を更新します。\n\n① 車検の有効期限を入力してください\n例：2026/08/15\n\n※「キャンセル」で中断できます`
    )
    return
  }

  const list = vehicles.map((v, i) =>
    `${i + 1}. ${v.license_plate}（${v.vehicle_type === 'personal' ? 'マイカー' : '社用車'}）`
  ).join('\n')

  await setSession(supabase, lineUserId, {
    step: 'select_vehicle',
    vehicle_id: null,
    temp_data: { vehicles_json: JSON.stringify(vehicles.map(v => ({ id: v.id, plate: v.license_plate }))) },
  })
  await replyMessage(replyToken, `更新する車両を番号で選択してください：\n\n${list}`)
}

async function handleVehicleSelect(
  supabase: ReturnType<typeof createServiceClient>,
  lineUserId: string,
  replyToken: string,
  text: string,
  session: Session
) {
  const vehicles: { id: string; plate: string }[] = JSON.parse(session.temp_data.vehicles_json ?? '[]')
  const idx = parseInt(text) - 1

  if (isNaN(idx) || idx < 0 || idx >= vehicles.length) {
    await replyMessage(replyToken, `1〜${vehicles.length} の番号を入力してください。`)
    return
  }

  const vehicle = vehicles[idx]
  await setSession(supabase, lineUserId, {
    step: 'input_inspection',
    vehicle_id: vehicle.id,
    temp_data: {},
  })

  await replyMessage(
    replyToken,
    `【${vehicle.plate}】を選択しました。\n\n① 車検の有効期限を入力してください\n例：2026/08/15\n\n※「キャンセル」で中断できます`
  )
}

async function handleInputInspection(
  supabase: ReturnType<typeof createServiceClient>,
  lineUserId: string,
  replyToken: string,
  text: string,
  session: Session
) {
  const date = parseDate(text)
  if (!date) {
    await replyMessage(replyToken, `「${text}」は認識できませんでした。\n以下の形式で入力してください。\n例：2026/08/15 または 2026年8月15日`)
    return
  }

  await setSession(supabase, lineUserId, {
    step: 'input_compulsory',
    vehicle_id: session.vehicle_id,
    temp_data: { inspection_expiry: date },
  })

  await replyMessage(replyToken, `✔ 車検：${date}\n\n② 自賠責保険の期限を入力してください\n例：2026/08/15`)
}

async function handleInputCompulsory(
  supabase: ReturnType<typeof createServiceClient>,
  lineUserId: string,
  replyToken: string,
  text: string,
  session: Session
) {
  const date = parseDate(text)
  if (!date) {
    await replyMessage(replyToken, '日付の形式が正しくありません。\n例：2026/08/15 または 2026年8月15日')
    return
  }

  await setSession(supabase, lineUserId, {
    step: 'input_voluntary',
    vehicle_id: session.vehicle_id,
    temp_data: { ...session.temp_data, compulsory_insurance_expiry: date },
  })

  await replyMessage(replyToken, `✔ 自賠責：${date}\n\n③ 任意保険の期限を入力してください\n例：2026/08/15\n※ない場合は「なし」と送信`)
}

async function handleInputVoluntary(
  supabase: ReturnType<typeof createServiceClient>,
  lineUserId: string,
  replyToken: string,
  text: string,
  session: Session,
) {
  const isNone = ['なし', 'ナシ', 'no', 'No', 'NO'].includes(text)
  const voluntaryDate = isNone ? null : parseDate(text)

  if (!isNone && !voluntaryDate) {
    await replyMessage(replyToken, '日付の形式が正しくありません。\n例：2026/08/15\n（ない場合は「なし」）')
    return
  }

  await setSession(supabase, lineUserId, {
    step: 'input_license',
    vehicle_id: session.vehicle_id,
    temp_data: {
      ...session.temp_data,
      voluntary_insurance_expiry: voluntaryDate ?? '',
    },
  })

  await replyMessage(replyToken, `✔ 任意保険：${voluntaryDate ?? 'なし'}\n\n④ 運転免許証の更新期限を入力してください\n例：2026/08/15\n※変更なしの場合は「スキップ」と送信`)
}

async function handleInputLicense(
  supabase: ReturnType<typeof createServiceClient>,
  lineUserId: string,
  replyToken: string,
  text: string,
  session: Session,
  employeeId: string,
  employeeName: string,
) {
  const isSkip = ['スキップ', 'skip', 'Skip'].includes(text)
  const licenseDate = isSkip ? null : parseDate(text)

  if (!isSkip && !licenseDate) {
    await replyMessage(replyToken, '日付の形式が正しくありません。\n例：2026/08/15\n（変更なしの場合は「スキップ」）')
    return
  }

  const { inspection_expiry, compulsory_insurance_expiry, voluntary_insurance_expiry } = session.temp_data
  const voluntaryDate = voluntary_insurance_expiry || null

  await supabase.from('vehicles').update({
    inspection_expiry,
    compulsory_insurance_expiry,
    voluntary_insurance_expiry: voluntaryDate,
  }).eq('id', session.vehicle_id!)

  if (licenseDate) {
    await supabase.from('employees').update({ license_expiry: licenseDate }).eq('id', employeeId)
  }

  await supabase.rpc('refresh_vehicle_status')
  await clearSession(supabase, lineUserId)

  await replyMessage(replyToken, [
    `✅ ${employeeName} さんの情報を更新しました！`,
    '',
    `🔹 車検：${inspection_expiry}`,
    `🔹 自賠責：${compulsory_insurance_expiry}`,
    `🔹 任意保険：${voluntaryDate ?? 'なし'}`,
    `🔹 免許更新期限：${licenseDate ?? '変更なし'}`,
  ].join('\n'))
}
