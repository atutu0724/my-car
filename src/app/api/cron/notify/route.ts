import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { pushMessage } from '@/lib/line'
import { format, differenceInDays } from 'date-fns'
import { ja } from 'date-fns/locale'

export const runtime = 'nodejs'
export const maxDuration = 300

type CompanySettings = {
  id: string
  notification_target: 'none' | 'admin_only' | 'admin_and_employees'
  notify_enabled: boolean
  notify_7days: boolean
  notify_1month: boolean
  notify_2months: boolean
  admin_line_user_id: string | null
}

type Vehicle = {
  id: string
  license_plate: string
  inspection_expiry: string
  compulsory_insurance_expiry: string
  voluntary_insurance_expiry: string | null
  employee: { name: string; line_user_id: string | null } | null
}

function buildMessage(vehicle: Vehicle, label: string): string {
  const emp = vehicle.employee
  const lines = [
    label,
    '',
    `${emp?.name ?? ''}さんの登録車両（${vehicle.license_plate}）`,
    '',
    `🔹 車検：${format(new Date(vehicle.inspection_expiry), 'yyyy年MM月dd日', { locale: ja })}`,
    `🔹 自賠責：${format(new Date(vehicle.compulsory_insurance_expiry), 'yyyy年MM月dd日', { locale: ja })}`,
  ]
  if (vehicle.voluntary_insurance_expiry) {
    lines.push(`🔹 任意保険：${format(new Date(vehicle.voluntary_insurance_expiry), 'yyyy年MM月dd日', { locale: ja })}`)
  }
  lines.push('', '早めに更新手続きをお願いします。')
  return lines.join('\n')
}

function getNotifyLabel(days: number): string | null {
  if (days < 0) return '🚨 期限切れのお知らせ'
  if (days <= 7) return '⚠️ 期限まで7日以内のお知らせ'
  if (days <= 30) return '⚠️ 期限まで1ヶ月以内のお知らせ'
  if (days <= 60) return '📅 期限まで2ヶ月以内のお知らせ'
  return null
}

export async function GET(request: NextRequest) {
  // Vercel Cron はAuthorizationヘッダーでシークレットを送る
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createServiceClient()

  // 全社の通知設定を取得
  const { data: companies } = await supabase
    .from('companies')
    .select('id, notification_target, notify_enabled, notify_7days, notify_1month, notify_2months, admin_line_user_id')

  if (!companies || companies.length === 0) {
    return Response.json({ sent: 0, companies: 0 })
  }

  let totalSent = 0

  for (const company of companies as CompanySettings[]) {
    if (!company.notify_enabled || company.notification_target === 'none') continue

    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, license_plate, inspection_expiry, compulsory_insurance_expiry, voluntary_insurance_expiry, employee:employees(name, line_user_id)')
      .eq('company_id', company.id)

    if (!vehicles) continue

    for (const vehicle of vehicles as Vehicle[]) {
      // 最も近い期限日を基準に判定
      const expiryDates = [
        vehicle.inspection_expiry,
        vehicle.compulsory_insurance_expiry,
        vehicle.voluntary_insurance_expiry,
      ].filter(Boolean) as string[]

      const minDays = Math.min(
        ...expiryDates.map(d => differenceInDays(new Date(d), new Date()))
      )

      // どの通知ウィンドウに該当するか
      const shouldNotify =
        (minDays < 0) ||
        (company.notify_7days && minDays >= 0 && minDays <= 7) ||
        (company.notify_1month && minDays > 7 && minDays <= 30) ||
        (company.notify_2months && minDays > 30 && minDays <= 60)

      if (!shouldNotify) continue

      const label = getNotifyLabel(minDays)
      if (!label) continue

      const message = buildMessage(vehicle, label)
      const recipients = new Set<string>()

      if (company.notification_target === 'admin_only' || company.notification_target === 'admin_and_employees') {
        if (company.admin_line_user_id) recipients.add(company.admin_line_user_id)
      }
      if (company.notification_target === 'admin_and_employees') {
        const lineId = vehicle.employee?.line_user_id
        if (lineId) recipients.add(lineId)
      }

      for (const lineUserId of recipients) {
        await pushMessage(lineUserId, message)
        totalSent++
      }
    }
  }

  return Response.json({ sent: totalSent, companies: companies.length })
}
