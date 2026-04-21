import { redirect } from 'next/navigation'
import { createClient } from './server'

export async function getCompanyId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const companyId = user.user_metadata?.company_id as string | undefined
  if (!companyId) throw new Error('会社情報が設定されていません。管理者に連絡してください。')
  return companyId
}
