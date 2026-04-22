import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  const { idToken } = await request.json()
  if (!idToken) return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })

  // Verify LIFF ID token with LINE API
  const verifyRes = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      id_token: idToken,
      client_id: process.env.LINE_LIFF_CHANNEL_ID!,
    }),
  })

  if (!verifyRes.ok) {
    return NextResponse.json({ error: 'Invalid LINE ID token' }, { status: 401 })
  }

  const lineUser = await verifyRes.json()
  const lineUserId: string = lineUser.sub

  const supabase = createServiceClient()

  // Find employee by line_user_id
  const { data: employee } = await supabase
    .from('employees')
    .select('id, name, company_id, auth_user_id')
    .eq('line_user_id', lineUserId)
    .single()

  if (!employee) {
    return NextResponse.json(
      { error: 'LINE IDが従業員と紐づいていません。管理者に連絡してください。' },
      { status: 404 }
    )
  }

  let authUserId = employee.auth_user_id as string | null

  // Create Supabase auth user if not exists
  if (!authUserId) {
    const email = `${lineUserId}@liff.internal`

    // Check if user already exists with this email
    const { data: existingList } = await supabase.auth.admin.listUsers()
    const existing = existingList?.users?.find(u => u.email === email)

    if (existing) {
      authUserId = existing.id
    } else {
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: crypto.randomUUID(),
        email_confirm: true,
        user_metadata: {
          role: 'employee',
          company_id: employee.company_id,
          employee_id: employee.id,
        },
      })
      if (createError || !created.user) {
        return NextResponse.json({ error: 'アカウント作成に失敗しました' }, { status: 500 })
      }
      authUserId = created.user.id
    }

    // Store auth_user_id in employees table
    await supabase
      .from('employees')
      .update({ auth_user_id: authUserId })
      .eq('id', employee.id)
  }

  // Generate magic link
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: `${lineUserId}@liff.internal`,
    options: { redirectTo: `${baseUrl}/vehicles` },
  })

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.json({ error: 'ログインリンクの生成に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ actionLink: linkData.properties.action_link })
}
