'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { deleteEmployee } from '@/app/actions/employees'
import { Trash2 } from 'lucide-react'

export function EmployeeDeleteButton({ employeeId }: { employeeId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('この従業員を削除しますか？\n関連する車両データも削除されます。')) return
    setLoading(true)
    try {
      await deleteEmployee(employeeId)
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
