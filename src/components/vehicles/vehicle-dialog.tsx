'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createVehicle, updateVehicle } from '@/app/actions/vehicles'
import type { Vehicle, Employee } from '@/types'
import { Plus, Pencil } from 'lucide-react'

interface Props {
  employees: Employee[]
  companyId: string
  vehicle?: Vehicle
}

export function VehicleDialog({ employees, companyId, vehicle }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [vehicleType, setVehicleType] = useState(vehicle?.vehicle_type ?? 'personal')
  const [employeeId, setEmployeeId] = useState(vehicle?.employee_id ?? '')
  const formRef = useRef<HTMLFormElement>(null)

  const isEdit = !!vehicle

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      formData.set('vehicle_type', vehicleType)
      formData.set('employee_id', employeeId)
      if (!isEdit) formData.set('company_id', companyId)

      if (isEdit) {
        await updateVehicle(vehicle.id, formData)
      } else {
        await createVehicle(formData)
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
          車両を追加
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? '車両を編集' : '車両を追加'}</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label>従業員</Label>
            <Select value={employeeId} onValueChange={(v) => { if (v !== null) setEmployeeId(v) }} required>
              <SelectTrigger>
                <SelectValue placeholder="従業員を選択" />
              </SelectTrigger>
              <SelectContent>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>車両種別</Label>
            <Select value={vehicleType} onValueChange={(v) => { if (v !== null) setVehicleType(v as 'personal' | 'company') }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">マイカー</SelectItem>
                <SelectItem value="company">社用車</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="license_plate">ナンバープレート</Label>
            <Input
              id="license_plate"
              name="license_plate"
              defaultValue={vehicle?.license_plate}
              placeholder="品川 500 あ 1234"
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="inspection_expiry">車検有効期限</Label>
              <Input
                id="inspection_expiry"
                name="inspection_expiry"
                type="date"
                defaultValue={vehicle?.inspection_expiry}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="compulsory_insurance_expiry">自賠責保険期限</Label>
              <Input
                id="compulsory_insurance_expiry"
                name="compulsory_insurance_expiry"
                type="date"
                defaultValue={vehicle?.compulsory_insurance_expiry}
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="voluntary_insurance_expiry">任意保険期限（任意）</Label>
            <Input
              id="voluntary_insurance_expiry"
              name="voluntary_insurance_expiry"
              type="date"
              defaultValue={vehicle?.voluntary_insurance_expiry ?? ''}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading || !employeeId}>
              {loading ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
