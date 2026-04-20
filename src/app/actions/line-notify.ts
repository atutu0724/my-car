'use server'

import { createClient } from '@/lib/supabase/server'
import { pushMessage } from '@/lib/line'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export async function sendExpiryNotifications() {
  const supabase = await createClient()

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*, employee:employees(name, line_user_id)')
    .in('status', ['warning', 'expired'])

  if (!vehicles || vehicles.length === 0) return { sent: 0 }

  let sent = 0
  for (const vehicle of vehicles) {
    const emp = vehicle.employee as { name: string; line_user_id: string | null } | null
    if (!emp?.line_user_id) continue

    const lines: string[] = []
    const isExpired = vehicle.status === 'expired'
    const prefix = isExpired ? '🚨 期限切れのお知らせ' : '⚠️ 期限間近のお知らせ'

    lines.push(`${prefix}`)
    lines.push(``)
    lines.push(`${emp.name} さんの登録車両（${vehicle.license_plate}）`)
    lines.push(``)

    if (isExpired || new Date(vehicle.inspection_expiry) <= new Date()) {
      lines.push(`🔴 車検：${format(new Date(vehicle.inspection_expiry), 'yyyy年MM月dd日', { locale: ja })}`)
    }
    if (isExpired || new Date(vehicle.compulsory_insurance_expiry) <= new Date()) {
      lines.push(`🔴 自賠責：${format(new Date(vehicle.compulsory_insurance_expiry), 'yyyy年MM月dd日', { locale: ja })}`)
    }
    if (vehicle.voluntary_insurance_expiry) {
      const vDate = new Date(vehicle.voluntary_insurance_expiry)
      const soon = vDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      if (isExpired || soon) {
        lines.push(`🔴 任意保険：${format(vDate, 'yyyy年MM月dd日', { locale: ja })}`)
      }
    }

    lines.push(``)
    lines.push(`早めに更新手続きをお願いします。`)

    await pushMessage(emp.line_user_id, lines.join('\n'))
    sent++
  }

  return { sent }
}

export async function sendVehicleNotification(vehicleId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*, employee:employees(name, line_user_id)')
    .eq('id', vehicleId)
    .single()

  if (!vehicle) throw new Error('車両が見つかりません')

  const emp = vehicle.employee as { name: string; line_user_id: string | null } | null
  if (!emp?.line_user_id) return { sent: false, reason: 'LINE未連携' }

  const status = vehicle.status as string
  const prefix = status === 'expired' ? '🚨 期限切れのお知らせ' : '⚠️ 期限間近のお知らせ'

  const lines: string[] = [
    prefix, '',
    `${emp.name} さんの登録車両（${vehicle.license_plate}）`, '',
    `🔹 車検：${format(new Date(vehicle.inspection_expiry), 'yyyy年MM月dd日', { locale: ja })}`,
    `🔹 自賠責：${format(new Date(vehicle.compulsory_insurance_expiry), 'yyyy年MM月dd日', { locale: ja })}`,
  ]
  if (vehicle.voluntary_insurance_expiry) {
    lines.push(`🔹 任意保険：${format(new Date(vehicle.voluntary_insurance_expiry), 'yyyy年MM月dd日', { locale: ja })}`)
  }
  lines.push('', '早めに更新手続きをお願いします。')

  await pushMessage(emp.line_user_id, lines.join('\n'))
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
