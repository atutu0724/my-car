import { createClient } from '@/lib/supabase/server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { VehicleDialog } from '@/components/vehicles/vehicle-dialog'
import { DeleteButton } from '@/components/vehicles/delete-button'
import { VehicleNotifyButton } from '@/components/vehicles/vehicle-notify-button'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

const STATUS_MAP = {
  active: { label: '正常', variant: 'default' as const },
  warning: { label: '期限間近', variant: 'secondary' as const },
  expired: { label: '期限切れ', variant: 'destructive' as const },
}

const TYPE_MAP = {
  personal: 'マイカー',
  company: '社用車',
}

function formatDate(dateStr: string) {
  return format(new Date(dateStr), 'yyyy/MM/dd', { locale: ja })
}

export default async function VehiclesPage() {
  const supabase = await createClient()

  const [{ data: vehicles }, { data: employees }, { data: companies }] = await Promise.all([
    supabase.from('vehicles').select('*, employee:employees(id, name, line_user_id)').order('created_at', { ascending: false }),
    supabase.from('employees').select('*').order('name'),
    supabase.from('companies').select('*').limit(1),
  ])

  const companyId = companies?.[0]?.id ?? ''

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">車両管理</h1>
        <VehicleDialog employees={employees ?? []} companyId={companyId} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>従業員</TableHead>
              <TableHead>種別</TableHead>
              <TableHead>ナンバープレート</TableHead>
              <TableHead>車検期限</TableHead>
              <TableHead>自賠責期限</TableHead>
              <TableHead>任意保険期限</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles && vehicles.length > 0 ? (
              vehicles.map(vehicle => {
                const status = STATUS_MAP[vehicle.status as keyof typeof STATUS_MAP]
                return (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">
                      {(vehicle.employee as { name: string; line_user_id: string | null } | null)?.name ?? '-'}
                    </TableCell>
                    <TableCell>{TYPE_MAP[vehicle.vehicle_type as keyof typeof TYPE_MAP]}</TableCell>
                    <TableCell>{vehicle.license_plate}</TableCell>
                    <TableCell>{formatDate(vehicle.inspection_expiry)}</TableCell>
                    <TableCell>{formatDate(vehicle.compulsory_insurance_expiry)}</TableCell>
                    <TableCell>
                      {vehicle.voluntary_insurance_expiry
                        ? formatDate(vehicle.voluntary_insurance_expiry)
                        : <span className="text-gray-400">-</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <VehicleNotifyButton
                          vehicleId={vehicle.id}
                          hasLineId={!!(vehicle.employee as { line_user_id: string | null } | null)?.line_user_id}
                        />
                        <VehicleDialog
                          employees={employees ?? []}
                          companyId={companyId}
                          vehicle={vehicle}
                        />
                        <DeleteButton vehicleId={vehicle.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-400 py-12">
                  車両が登録されていません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
