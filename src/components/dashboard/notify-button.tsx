'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { sendExpiryNotifications } from '@/app/actions/line-notify'
import { Bell } from 'lucide-react'

export function NotifyButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleNotify() {
    setLoading(true)
    setResult(null)
    try {
      const { sent } = await sendExpiryNotifications()
      setResult(sent > 0 ? `✅ ${sent}件の通知を送信しました` : '📭 通知対象者がいません（LINE未連携）')
    } catch {
      setResult('❌ 通知の送信に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {result && <span className="text-sm text-gray-600">{result}</span>}
      <Button onClick={handleNotify} disabled={loading} variant="outline">
        <Bell className="h-4 w-4 mr-1" />
        {loading ? '送信中...' : 'LINE通知を送信'}
      </Button>
    </div>
  )
}
