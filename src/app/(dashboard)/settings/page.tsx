import { redirect } from 'next/navigation'
import { getRole } from '@/lib/supabase/get-role'
import { getNotificationSettings } from '@/app/actions/notification-settings'
import { NotificationSettingsForm } from '@/components/settings/notification-settings-form'

export default async function SettingsPage() {
  const role = await getRole()
  if (role !== 'admin') redirect('/dashboard')

  const settings = await getNotificationSettings()

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">設定</h1>
        <p className="text-sm text-gray-500 mt-1">LINE通知の送信先とタイミングを設定できます</p>
      </div>
      <NotificationSettingsForm initial={settings} />
    </div>
  )
}
