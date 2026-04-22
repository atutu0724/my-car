import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, AlertTriangle, XCircle, Car } from 'lucide-react'
import { NotifyButton } from '@/components/dashboard/notify-button'
import { getRole } from '@/lib/supabase/get-role'

export default async function DashboardPage() {
  const [supabase, role] = await Promise.all([createClient(), getRole()])
  if (role === 'employee') redirect('/alcohol-check')
  const { data: rpcStats } = await supabase.rpc('get_vehicle_stats')

  const rows = (rpcStats ?? []) as { status: string; cnt: number }[]
  const active = rows.find(r => r.status === 'active')?.cnt ?? 0
  const warning = rows.find(r => r.status === 'warning')?.cnt ?? 0
  const expired = rows.find(r => r.status === 'expired')?.cnt ?? 0
  const total = active + warning + expired

  const stats = [
    {
      label: '登録車両数',
      value: total,
      icon: Car,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: '正常',
      value: active,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: '期限間近（30日以内）',
      value: warning,
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      label: '期限切れ',
      value: expired,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        {role === 'admin' && <NotifyButton />}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{label}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-3xl font-bold text-gray-900">{value}</span>
              <div className={`${bg} p-2 rounded-full`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {expired > 0 && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle className="h-5 w-5" />
            <p className="font-medium">期限切れの車両が {expired} 台あります。速やかに更新してください。</p>
          </div>
        </div>
      )}

      {warning > 0 && (
        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-700">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-medium">30日以内に期限が切れる車両が {warning} 台あります。</p>
          </div>
        </div>
      )}
    </div>
  )
}
