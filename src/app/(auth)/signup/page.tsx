'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signupUser } from '@/app/actions/signup'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignupPage() {
  const router = useRouter()
  const [role, setRole] = useState<'admin' | 'employee'>('admin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signupUser(new FormData(e.currentTarget))
      router.push('/login?registered=1')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">アカウント登録</CardTitle>
          <p className="text-sm text-gray-500 mt-1">管理者から受け取った会社コードを入力してください</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ロール選択 */}
            <div className="space-y-1.5">
              <Label>アカウント種別</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['admin', 'employee'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2.5 rounded-md border text-sm font-medium transition-colors ${
                      role === r
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {r === 'admin' ? '管理者' : '従業員'}
                  </button>
                ))}
              </div>
              <input type="hidden" name="role" value={role} />
              <p className="text-xs text-gray-400">
                {role === 'admin'
                  ? '全車両の閲覧・編集が可能です'
                  : '自分に紐づいた車両のみ閲覧・編集できます'}
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="company_code">会社コード</Label>
              <Input id="company_code" name="company_code" placeholder="例: salife-corp" required />
              <p className="text-xs text-gray-400">管理者にご確認ください</p>
            </div>

            {/* 従業員のみ: 氏名入力 */}
            {role === 'employee' && (
              <div className="space-y-1">
                <Label htmlFor="employee_name">氏名（従業員管理に登録済みの名前）</Label>
                <Input
                  id="employee_name"
                  name="employee_name"
                  placeholder="例: 山田 太郎"
                  required={role === 'employee'}
                />
                <p className="text-xs text-gray-400">管理者が登録した氏名と完全一致が必要です</p>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="email">メールアドレス</Label>
              <Input id="email" name="email" type="email" placeholder="admin@example.com" required />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">パスワード（8文字以上）</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登録中...' : '登録する'}
            </Button>

            <p className="text-center text-sm text-gray-500">
              すでにアカウントをお持ちの方は{' '}
              <a href="/login" className="text-blue-600 hover:underline">ログイン</a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
