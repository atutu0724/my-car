import { createClient } from '@/lib/supabase/server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { EmployeeDialog } from '@/components/employees/employee-dialog'
import { EmployeeDeleteButton } from '@/components/employees/employee-delete-button'
import { LineIdDialog } from '@/components/employees/line-id-dialog'
import { format, differenceInDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { MessageCircle } from 'lucide-react'

export default async function EmployeesPage() {
  const supabase = await createClient()

  const { data: employees } = await supabase
    .from('employees')
    .select('*, vehicles(count)')
    .order('created_at', { ascending: true })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">従業員管理</h1>
        <EmployeeDialog />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                    {emp.license_expiry ? (() => {
                      const days = differenceInDays(new Date(emp.license_expiry), new Date())
                      const label = format(new Date(emp.license_expiry), 'yyyy/MM/dd', { locale: ja })
                      if (days < 0) return <Badge variant="destructive">{label}</Badge>
                      if (days <= 30) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">{label}</Badge>
                      return <span>{label}</span>
                    })() : <span className="text-gray-400">-</span>}
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

      <p className="mt-4 text-sm text-gray-500">
        💡 従業員が公式LINEを友だち追加後、氏名を送信すると自動で連携されます。
        <MessageCircle className="inline h-4 w-4 ml-1 text-green-500" /> アイコンから手動設定も可能です。
      </p>
    </div>
  )
}
