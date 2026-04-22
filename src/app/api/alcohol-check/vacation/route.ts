import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getUserMeta } from '@/lib/supabase/get-role'

export async function POST(request: NextRequest) {
  const { date } = await request.json()

  const meta = await getUserMeta()
  if (!meta.employeeId) return NextResponse.json({ error: '従業員情報が見つかりません' }, { status: 403 })

  // Validate date: must be today or within 3 months ahead
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maxDate = new Date(today)
  maxDate.setMonth(maxDate.getMonth() + 3)

  const targetDate = new Date(`${date}T00:00:00`)
  if (isNaN(targetDate.getTime()) || targetDate < today || targetDate > maxDate) {
    return NextResponse.json({ error: '無効な日付です' }, { status: 400 })
  }

  const companyId = await getCompanyId()
  const supabase = await createClient()

  const { error } = await supabase.from('alcohol_checks').insert({
    company_id: companyId,
    employee_id: meta.employeeId,
    check_type: 'vacation',
    checked_at: `${date}T00:00:00`,
  })

  if (error) return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 })
  return NextResponse.json({ success: true })
}
