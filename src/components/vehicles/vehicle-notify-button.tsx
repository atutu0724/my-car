'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { sendVehicleNotification } from '@/app/actions/line-notify'
import { Bell } from 'lucide-react'

export function VehicleNotifyButton({ vehicleId, hasLineId }: { vehicleId: string; hasLineId: boolean }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  if (!hasLineId) return null

  async function handleClick() {
    setLoading(true)
    setResult(null)
    try {
      const { sent, reason } = await sendVehicleNotification(vehicleId)
      setResult(sent ? '✅' : `－`)
    } catch {
      setResult('❌')
    } finally {
      setLoading(false)
      setTimeout(() => setResult(null), 3000)
    }
  }

  return (
    <div className="flex items-center gap-1">
      {result && <span className="text-xs text-gray-500">{result}</span>}
      <Button variant="outline" size="sm" onClick={handleClick} disabled={loading} title="LINE通知を送信">
        <Bell className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
