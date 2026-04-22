import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getRole } from '@/lib/supabase/get-role'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'

export default async function AlcoholChecksPage() {
  const role = await getRole()
  if (role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  const companyId = await getCompanyId()

  const today = new Date()
  const dateStr = format(today, 'yyyy-MM-dd')

  const { data: checks } = await supabase
    .from('alcohol_checks')
    .select('*, employees(name)')
    .eq('company_id', companyId)
    .gte('checked_at', `${dateStr}T00:00:00`)
    .lte('checked_at', `${dateStr}T23:59:59`)
    .order('checked_at', { ascending: false })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">アルコールチェック管理</h1>
        <p className="text-sm text-gray-500 mt-1">{format(today, 'yyyy年MM月dd日（E）', { locale: ja })}</p>
      </div>

      {!checks || checks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          本日のチェック記録がありません
        </div>
      ) : (
        <div className="space-y-4">
          {checks.map(check => {
            const isVacation = check.check_type === 'vacation'
            const isOver = !isVacation && check.concentration !== null && check.concentration > 0.15

            return (
              <div key={check.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {(check.employees as { name: string } | null)?.name ?? '不明'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(check.checked_at), 'HH:mm', { locale: ja })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isVacation ? (
                      <Badge className="bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-100">
                        休暇
                      </Badge>
                    ) : (
                      <>
                        <Badge variant={check.check_type === 'before' ? 'default' : 'secondary'}>
                          {check.check_type === 'before' ? '乗車前' : '乗車後'}
                        </Badge>
                        <span className={`text-lg font-bold ${isOver ? 'text-red-600' : 'text-green-600'}`}>
                          {check.concentration !== null ? `${Number(check.concentration).toFixed(3)} mg/L` : '-'}
                        </span>
                        {isOver && <Badge variant="destructive">要確認</Badge>}
                      </>
                    )}
                  </div>
                </div>

                {!isVacation && (
                  <div className="grid grid-cols-2 gap-3">
                    {check.selfie_url && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">本人写真</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={check.selfie_url}
                          alt="selfie"
                          className="rounded-lg w-full aspect-video object-cover border border-gray-100"
                        />
                      </div>
                    )}
                    {check.device_photo_url && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">チェッカー</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={check.device_photo_url}
                          alt="device"
                          className="rounded-lg w-full aspect-video object-cover border border-gray-100"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
