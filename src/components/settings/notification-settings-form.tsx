'use client'

import { useState, useTransition } from 'react'
import { updateNotificationSettings, type NotificationSettings } from '@/app/actions/notification-settings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bell, CheckCircle } from 'lucide-react'

type Props = { initial: NotificationSettings }

export function NotificationSettingsForm({ initial }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [target, setTarget] = useState(initial.notification_target)
  const [enabled, setEnabled] = useState(initial.notify_enabled)
  const [days7, setDays7] = useState(initial.notify_7days)
  const [month1, setMonth1] = useState(initial.notify_1month)
  const [month2, setMonth2] = useState(initial.notify_2months)
  const [adminLineId, setAdminLineId] = useState(initial.admin_line_user_id ?? '')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateNotificationSettings(fd)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  const showAdminLineId = target === 'admin_only' || target === 'admin_and_employees'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 通知先 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">通知先</CardTitle>
          <CardDescription>期限通知をどこに送るか選択してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="notification_target">通知先</Label>
            <Select
              name="notification_target"
              value={target}
              onValueChange={v => setTarget(v as NotificationSettings['notification_target'])}
            >
              <SelectTrigger id="notification_target">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">通知なし</SelectItem>
                <SelectItem value="admin_only">管理者のみ</SelectItem>
                <SelectItem value="admin_and_employees">管理者と紐づいている従業員</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showAdminLineId && (
            <div className="space-y-1.5">
              <Label htmlFor="admin_line_user_id">管理者の LINE ユーザーID</Label>
              <Input
                id="admin_line_user_id"
                name="admin_line_user_id"
                value={adminLineId}
                onChange={e => setAdminLineId(e.target.value)}
                placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
              <p className="text-xs text-gray-500">
                LINE Developersコンソール → Messaging API → ユーザーIDで確認できます
              </p>
            </div>
          )}

          {/* hidden field when not shown */}
          {!showAdminLineId && (
            <input type="hidden" name="admin_line_user_id" value="" />
          )}
        </CardContent>
      </Card>

      {/* 通知タイミング */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">通知タイミング</CardTitle>
          <CardDescription>どのタイミングで通知を送るか設定してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* マスタースイッチ */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">通知を有効にする</p>
              <p className="text-xs text-gray-500">オフにすると全ての自動通知が停止されます</p>
            </div>
            <Switch
              name="notify_enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          <div className={`space-y-4 border-t pt-4 ${!enabled ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">2ヶ月前に通知</p>
                <p className="text-xs text-gray-500">期限の60日前に通知を送信</p>
              </div>
              <Switch
                name="notify_2months"
                checked={month2}
                onCheckedChange={setMonth2}
                disabled={!enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">1ヶ月前に通知</p>
                <p className="text-xs text-gray-500">期限の30日前に通知を送信</p>
              </div>
              <Switch
                name="notify_1month"
                checked={month1}
                onCheckedChange={setMonth1}
                disabled={!enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">7日前に通知</p>
                <p className="text-xs text-gray-500">期限の7日前に通知を送信</p>
              </div>
              <Switch
                name="notify_7days"
                checked={days7}
                onCheckedChange={setDays7}
                disabled={!enabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          <Bell className="h-4 w-4 mr-2" />
          {isPending ? '保存中...' : '設定を保存'}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            保存しました
          </span>
        )}
      </div>
    </form>
  )
}
