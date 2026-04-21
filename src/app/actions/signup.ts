'use server'

import { createServiceClient } from '@/lib/supabase/service'

export async function signupUser(formData: FormData) {
  const companyCode = (formData.get('company_code') as string).trim().toLowerCase()
  const email = (formData.get('email') as string).trim()
  const password = formData.get('password') as string
  const role = formData.get('role') as 'admin' | 'employee'
  const employeeName = (formData.get('employee_name') as string | null)?.trim()

  if (!companyCode || !email || !password || !role) throw new Error('必須項目が未入力です。')
  if (password.length < 8) throw new Error('パスワードは8文字以上で入力してください。')
  if (role === 'employee' && !employeeName) throw new Error('氏名を入力してください。')

  const supabase = createServiceClient()

  // 会社コードを確認
  const { data: company } = await supabase
    .from('companies')
    .select('id, name')
    .eq('code', companyCode)
    .single()

  if (!company) throw new Error('会社コードが正しくありません。管理者にご確認ください。')

  let employeeId: string | undefined

  if (role === 'employee') {
    // 氏名で従業員レコードを検索
    const { data: employees } = await supabase
      .from('employees')
      .select('id, name')
      .eq('company_id', company.id)

    const normalized = employeeName!.replace(/\s/g, '')
    const matched = employees?.filter(e =>
      e.name.replace(/\s/g, '') === normalized || e.name === employeeName
    )

    if (!matched || matched.length === 0) {
      throw new Error('従業員情報が見つかりません。氏名を正確に入力するか、管理者にご確認ください。')
    }
    if (matched.length > 1) {
      throw new Error('同じ名前の従業員が複数います。管理者にアカウント作成を依頼してください。')
    }

    employeeId = matched[0].id
  }

  const { error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      company_id: company.id,
      role,
      ...(employeeId ? { employee_id: employeeId } : {}),
    },
  })

  if (userError) {
    if (userError.message.includes('already registered')) {
      throw new Error('このメールアドレスはすでに登録されています。')
    }
    throw new Error('アカウントの作成に失敗しました。')
  }
}
