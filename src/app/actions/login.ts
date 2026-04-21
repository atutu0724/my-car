'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function loginWithCompanyCode(formData: FormData) {
  const companyCode = (formData.get('company_code') as string).trim().toLowerCase()
  const email = (formData.get('email') as string).trim()
  const password = formData.get('password') as string

  const supabase = await createClient()

  // 1. メール + パスワードでサインイン
  const { data: session, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError || !session.user) {
    return { error: 'メールアドレスまたはパスワードが正しくありません。' }
  }

  // 2. ログインユーザーの company_id を取得
  const userCompanyId = session.user.user_metadata?.company_id as string | undefined
  if (!userCompanyId) {
    await supabase.auth.signOut()
    return { error: 'アカウントに企業情報が設定されていません。管理者に連絡してください。' }
  }

  // 3. 入力された会社コードと一致するか検証
  const service = createServiceClient()
  const { data: company } = await service
    .from('companies')
    .select('id')
    .eq('code', companyCode)
    .eq('id', userCompanyId)
    .single()

  if (!company) {
    await supabase.auth.signOut()
    return { error: '会社コードが正しくありません。' }
  }

  return { error: null }
}
