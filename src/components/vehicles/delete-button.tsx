'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { deleteVehicle } from '@/app/actions/vehicles'
import { Trash2 } from 'lucide-react'

export function DeleteButton({ vehicleId }: { vehicleId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('この車両を削除しますか？')) return
    setLoading(true)
    try {
      await deleteVehicle(vehicleId)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} disabled={loading}>
      <Trash2 className="h-4 w-4 text-red-500" />
    </Button>
  )
}
