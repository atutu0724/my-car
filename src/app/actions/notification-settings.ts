'use server'

import { createClient } from '@/lib/supabase/server'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { revalidatePath } from 'next/cache'

export type NotificationSettings = {
  notification_target: 'none' | 'admin_only' | 'admin_and_employees'
  notify_enabled: boolean
  notify_7days: boolean
  notify_1month: boolean
  notify_2months: boolean
  admin_line_user_id: string | null
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const supabase = await createClient()
  const companyId = await getCompanyId()

  const { data } = await supabase
    .from('companies')
    .select('notification_target, notify_enabled, notify_7days, notify_1month, notify_2months, admin_line_user_id')
    .eq('id', companyId)
    .single()

  return data as NotificationSettings ?? {
    notification_target: 'admin_and_employees',
    notify_enabled: true,
    notify_7days: true,
    notify_1month: true,
    notify_2months: false,
    admin_line_user_id: null,
  }
}

export async function updateNotificationSettings(formData: FormData) {
  const supabase = await createClient()
  const companyId = await getCompanyId()

  const settings: NotificationSettings = {
    notification_target: formData.get('notification_target') as NotificationSettings['notification_target'],
    notify_enabled: formData.get('notify_enabled') === 'on',
    notify_7days: formData.get('notify_7days') === 'on',
    notify_1month: formData.get('notify_1month') === 'on',
    notify_2months: formData.get('notify_2months') === 'on',
    admin_line_user_id: (formData.get('admin_line_user_id') as string)?.trim() || null,
  }

  const { error } = await supabase
    .from('companies')
    .update(settings)
    .eq('id', companyId)

  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}
