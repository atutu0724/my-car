'use server'

import { createServiceClient } from '@/lib/supabase/service'

export async function signupCompany(formData: FormData) {
  const companyName = (formData.get('company_name') as string).trim()
  const companyCode = (formData.get('company_code') as string).trim().toLowerCase()
  const planType = formData.get('plan_type') as 'small' | 'standard'
  const email = (formData.get('email') as string).trim()
  const password = formData.get('password') as string

  if (!companyName || !companyCode || !email || !password) throw new Error('必須項目が未入力です。')
  if (!/^[a-z0-9-]{3,20}$/.test(companyCode)) throw new Error('会社コードは半角英数字・ハイフンで3〜20文字で入力してください。')
  if (password.length < 8) throw new Error('パスワードは8文字以上で入力してください。')

  const supabase = createServiceClient()

  // 1. companies テーブルに挿入して company_id を取得
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({ name: companyName, code: companyCode, plan_type: planType })
    .select('id')
    .single()

  if (companyError || !company) {
    if (companyError?.message.includes('unique') || companyError?.code === '23505') {
      throw new Error('この会社コードはすでに使用されています。別のコードを入力してください。')
    }
    throw new Error('企業情報の登録に失敗しました。')
  }

  // 2. Auth ユーザーを作成し user_metadata に company_id を付与
  const { error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { company_id: company.id },
  })

  if (userError) {
    // ユーザー作成失敗時は company をロールバック
    await supabase.from('companies').delete().eq('id', company.id)
    if (userError.message.includes('already registered')) {
      throw new Error('このメールアドレスはすでに登録されています。')
    }
    throw new Error('アカウントの作成に失敗しました。')
  }
}
