import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getRole } from '@/lib/supabase/get-role'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { EmployeeDialog } from '@/components/employees/employee-dialog'
import { EmployeeDeleteButton } from '@/components/employees/employee-delete-button'
import { LineIdDialog } from '@/components/employees/line-id-dialog'
import { format, differenceInDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { MessageCircle } from 'lucide-react'

export default async function EmployeesPage() {
  const role = await getRole()
  if (role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  const companyId = await getCompanyId()

  const { data: employees } = await supabase
    .from('employees')
    .select('*, vehicles(count)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true })

  function LicenseBadge({ expiry }: { expiry: string | null }) {
    if (!expiry) return <span className="text-gray-400">-</span>
    const days = differenceInDays(new Date(expiry), new Date())
    const label = format(new Date(expiry), 'yyyy/MM/dd', { locale: ja })
    if (days < 0) return <Badge variant="destructive">{label}</Badge>
    if (days <= 30) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">{label}</Badge>
    return <span>{label}</span>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">従業員管理</h1>
        <EmployeeDialog />
      </div>

      {/* PC: テーブル表示 */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>氏名</TableHead>
              <TableHead>LINE連携</TableHead>
              <TableHead>登録車両数</TableHead>
              <TableHead>免許更新期限</TableHead>
              <TableHead>登録日</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees && employees.length > 0 ? (
              employees.map(emp => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell>
                    {emp.line_user_id ? (
                      <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">連携済み</Badge>
                    ) : (
                      <Badge variant="secondary">未連携</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {(emp.vehicles as unknown as { count: number }[])?.[0]?.count ?? 0} 台
                  </TableCell>
                  <TableCell>
                    <LicenseBadge expiry={emp.license_expiry ?? null} />
                  </TableCell>
                  <TableCell>
                    {format(new Date(emp.created_at), 'yyyy/MM/dd', { locale: ja })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <LineIdDialog
                        employeeId={emp.id}
                        employeeName={emp.name}
                        currentLineId={emp.line_user_id}
                      />
                      <EmployeeDialog employee={emp} />
                      <EmployeeDeleteButton employeeId={emp.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-12">
                  従業員が登録されていません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* スマホ: カード表示 */}
      <div className="md:hidden space-y-3">
        {employees && employees.length > 0 ? (
          employees.map(emp => (
            <div key={emp.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{emp.name}</p>
                  <p className="text-sm text-gray-500">
                    登録車両: {(emp.vehicles as unknown as { count: number }[])?.[0]?.count ?? 0} 台
                  </p>
                </div>
                {emp.line_user_id ? (
                  <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">LINE連携済み</Badge>
                ) : (
                  <Badge variant="secondary">LINE未連携</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
                <span className="text-gray-500">免許更新期限</span>
                <span><LicenseBadge expiry={emp.license_expiry ?? null} /></span>
                <span className="text-gray-500">登録日</span>
                <span>{format(new Date(emp.created_at), 'yyyy/MM/dd', { locale: ja })}</span>
              </div>
              <div className="flex justify-end gap-1 pt-2 border-t border-gray-100">
                <LineIdDialog
                  employeeId={emp.id}
                  employeeName={emp.name}
                  currentLineId={emp.line_user_id}
                />
                <EmployeeDialog employee={emp} />
                <EmployeeDeleteButton employeeId={emp.id} />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-400 py-12 bg-white rounded-lg border border-gray-200">
            従業員が登録されていません
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-gray-500">
        💡 従業員が公式LINEを友だち追加後、氏名を送信すると自動で連携されます。
        <MessageCircle className="inline h-4 w-4 ml-1 text-green-500" /> アイコンから手動設定も可能です。
      </p>
    </div>
  )
}
