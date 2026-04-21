'use server'

import { createClient } from '@/lib/supabase/server'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { pushMessage } from '@/lib/line'
import { format, differenceInDays } from 'date-fns'
import { ja } from 'date-fns/locale'

type Vehicle = {
  id: string
  license_plate: string
  inspection_expiry: string
  compulsory_insurance_expiry: string
  voluntary_insurance_expiry: string | null
  status: string
  employee: { name: string; line_user_id: string | null } | null
}

type CompanySettings = {
  notification_target: 'none' | 'admin_only' | 'admin_and_employees'
  notify_enabled: boolean
  notify_7days: boolean
  notify_1month: boolean
  notify_2months: boolean
  admin_line_user_id: string | null
}

function buildMessage(vehicle: Vehicle, daysUntil: number): string {
  const emp = vehicle.employee
  const prefix = daysUntil <= 0 ? '🚨 期限切れのお知らせ'
    : daysUntil <= 7 ? '⚠️ 期限まで7日以内'
    : daysUntil <= 30 ? '⚠️ 期限まで1ヶ月以内'
    : '📅 期限まで2ヶ月以内'

  const lines = [
    prefix,
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

function isInWindow(dateStr: string, days: number): boolean {
  const d = differenceInDays(new Date(dateStr), new Date())
  if (days === 7) return d >= 0 && d <= 7
  if (days === 30) return d > 7 && d <= 30
  if (days === 60) return d > 30 && d <= 60
  return false
}

export async function sendExpiryNotifications() {
  const supabase = await createClient()
  const companyId = await getCompanyId()

  // 会社の通知設定を取得
  const { data: company } = await supabase
    .from('companies')
    .select('notification_target, notify_enabled, notify_7days, notify_1month, notify_2months, admin_line_user_id')
    .eq('id', companyId)
    .single()

  const settings = company as CompanySettings | null
  if (!settings || !settings.notify_enabled || settings.notification_target === 'none') {
    return { sent: 0, skipped: 'notifications disabled' }
  }

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*, employee:employees(name, line_user_id)')
    .eq('company_id', companyId)

  if (!vehicles || vehicles.length === 0) return { sent: 0 }

  let sent = 0

  for (const vehicle of vehicles as Vehicle[]) {
    const earliestExpiry = [
      vehicle.inspection_expiry,
      vehicle.compulsory_insurance_expiry,
      vehicle.voluntary_insurance_expiry,
    ].filter(Boolean).sort()[0] as string

    const daysUntil = differenceInDays(new Date(earliestExpiry), new Date())

    // 通知対象かどうか判定
    const shouldNotify =
      (settings.notify_7days && daysUntil >= 0 && daysUntil <= 7) ||
      (settings.notify_1month && isInWindow(earliestExpiry, 30)) ||
      (settings.notify_2months && isInWindow(earliestExpiry, 60)) ||
      daysUntil < 0  // 期限切れは常に通知

    if (!shouldNotify) continue

    const message = buildMessage(vehicle as Vehicle, daysUntil)
    const emp = vehicle.employee as { name: string; line_user_id: string | null } | null
    const recipients = new Set<string>()

    if (settings.notification_target === 'admin_only' || settings.notification_target === 'admin_and_employees') {
      if (settings.admin_line_user_id) recipients.add(settings.admin_line_user_id)
    }
    if (settings.notification_target === 'admin_and_employees') {
      if (emp?.line_user_id) recipients.add(emp.line_user_id)
    }

    for (const lineUserId of recipients) {
      await pushMessage(lineUserId, message)
      sent++
    }
  }

  return { sent }
}

export async function sendVehicleNotification(vehicleId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const companyId = await getCompanyId()

  const [{ data: vehicle }, { data: company }] = await Promise.all([
    supabase
      .from('vehicles')
      .select('*, employee:employees(name, line_user_id)')
      .eq('id', vehicleId)
      .single(),
    supabase
      .from('companies')
      .select('notification_target, admin_line_user_id')
      .eq('id', companyId)
      .single(),
  ])

  if (!vehicle) throw new Error('車両が見つかりません')

  const settings = company as Pick<CompanySettings, 'notification_target' | 'admin_line_user_id'> | null
  if (!settings || settings.notification_target === 'none') {
    return { sent: false, reason: '通知なし設定' }
  }

  const emp = vehicle.employee as { name: string; line_user_id: string | null } | null
  const daysUntil = differenceInDays(new Date(vehicle.inspection_expiry), new Date())
  const message = buildMessage(vehicle as Vehicle, daysUntil)
  const recipients = new Set<string>()

  if (settings.notification_target === 'admin_only' || settings.notification_target === 'admin_and_employees') {
    if (settings.admin_line_user_id) recipients.add(settings.admin_line_user_id)
  }
  if (settings.notification_target === 'admin_and_employees') {
    if (emp?.line_user_id) recipients.add(emp.line_user_id)
  }

  if (recipients.size === 0) return { sent: false, reason: 'LINE ID未設定' }

  for (const lineUserId of recipients) {
    await pushMessage(lineUserId, message)
  }
  return { sent: true, reason: null }
}

export async function setEmployeeLineId(employeeId: string, lineUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('employees')
    .update({ line_user_id: lineUserId || null })
    .eq('id', employeeId)

  if (error) throw new Error(error.message)
}
