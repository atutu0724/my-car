'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { setEmployeeLineId } from '@/app/actions/line-notify'
import { MessageCircle } from 'lucide-react'

interface Props {
  employeeId: string
  employeeName: string
  currentLineId: string | null
}

export function LineIdDialog({ employeeId, employeeName, currentLineId }: Props) {
  const [open, setOpen] = useState(false)
  const [lineId, setLineId] = useState(currentLineId ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await setEmployeeLineId(employeeId, lineId)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        <MessageCircle className={`h-4 w-4 ${currentLineId ? 'text-green-500' : 'text-gray-400'}`} />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>LINE ID 設定 — {employeeName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="line-id">LINE User ID</Label>
            <Input
              id="line-id"
              value={lineId}
              onChange={e => setLineId(e.target.value)}
              placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <p className="text-xs text-gray-500">空欄にすると紐付けを解除します</p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>キャンセル</Button>
            <Button type="submit" disabled={loading}>{loading ? '保存中...' : '保存'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
