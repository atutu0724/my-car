'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createEmployee, updateEmployee } from '@/app/actions/employees'
import type { Employee } from '@/types'
import { Plus, Pencil } from 'lucide-react'

interface Props {
  employee?: Employee
}

export function EmployeeDialog({ employee }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isEdit = !!employee

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      if (isEdit) {
        await updateEmployee(employee.id, formData)
      } else {
        await createEmployee(formData)
      }
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {isEdit ? (
        <DialogTrigger render={<Button variant="ghost" size="sm" />}>
          <Pencil className="h-4 w-4" />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <Plus className="h-4 w-4 mr-1" />
          従業員を追加
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? '従業員を編集' : '従業員を追加'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="name">氏名</Label>
            <Input
              id="name"
              name="name"
              defaultValue={employee?.name}
              placeholder="山田 太郎"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="license_expiry">免許更新期限（任意）</Label>
            <Input
              id="license_expiry"
              name="license_expiry"
              type="date"
              defaultValue={employee?.license_expiry ?? ''}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
