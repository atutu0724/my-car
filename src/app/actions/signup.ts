'use server'

import { createServiceClient } from '@/lib/supabase/service'

export async function signupUser(formData: FormData) {
  const companyCode = (formData.get('company_code') as string).trim().toLowerCase()
  const email = (formData.get('email') as string).trim()
  const password = formData.get('password') as string

  if (!companyCode || !email || !password) throw new Error('必須項目が未入力です。')
  if (password.length < 8) throw new Error('パスワードは8文字以上で入力してください。')

  const supabase = createServiceClient()

  // 会社コードが存在するか確認
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, name')
    .eq('code', companyCode)
    .single()

  if (companyError || !company) {
    throw new Error('会社コードが正しくありません。管理者にご確認ください。')
  }

  // ユーザーを作成して company_id を付与
  const { error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { company_id: company.id },
  })

  if (userError) {
    if (userError.message.includes('already registered')) {
      throw new Error('このメールアドレスはすでに登録されています。')
    }
    throw new Error('アカウントの作成に失敗しました。')
  }

  return { companyName: company.name }
}
