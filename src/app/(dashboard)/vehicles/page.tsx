import { createClient } from '@/lib/supabase/server'
import { getCompanyId } from '@/lib/supabase/get-company-id'
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
  const companyId = await getCompanyId()

  const [{ data: vehicles }, { data: employees }] = await Promise.all([
    supabase.from('vehicles').select('*, employee:employees(id, name, line_user_id)').eq('company_id', companyId).order('created_at', { ascending: false }),
    supabase.from('employees').select('*').eq('company_id', companyId).order('name'),
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">車両管理</h1>
        <VehicleDialog employees={employees ?? []} companyId={companyId} />
      </div>

      {/* PC: テーブル表示 */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
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

      {/* スマホ: カード表示 */}
      <div className="md:hidden space-y-3">
        {vehicles && vehicles.length > 0 ? (
          vehicles.map(vehicle => {
            const status = STATUS_MAP[vehicle.status as keyof typeof STATUS_MAP]
            const emp = vehicle.employee as { name: string; line_user_id: string | null } | null
            return (
              <div key={vehicle.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{emp?.name ?? '-'}</p>
                    <p className="text-sm text-gray-500">{vehicle.license_plate} · {TYPE_MAP[vehicle.vehicle_type as keyof typeof TYPE_MAP]}</p>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
                  <span className="text-gray-500">車検</span>
                  <span>{formatDate(vehicle.inspection_expiry)}</span>
                  <span className="text-gray-500">自賠責</span>
                  <span>{formatDate(vehicle.compulsory_insurance_expiry)}</span>
                  <span className="text-gray-500">任意保険</span>
                  <span>{vehicle.voluntary_insurance_expiry ? formatDate(vehicle.voluntary_insurance_expiry) : <span className="text-gray-400">-</span>}</span>
                </div>
                <div className="flex justify-end gap-1 pt-2 border-t border-gray-100">
                  <VehicleNotifyButton
                    vehicleId={vehicle.id}
                    hasLineId={!!emp?.line_user_id}
                  />
                  <VehicleDialog
                    employees={employees ?? []}
                    companyId={companyId}
                    vehicle={vehicle}
                  />
                  <DeleteButton vehicleId={vehicle.id} />
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center text-gray-400 py-12 bg-white rounded-lg border border-gray-200">
            車両が登録されていません
          </div>
        )}
      </div>
    </div>
  )
}
