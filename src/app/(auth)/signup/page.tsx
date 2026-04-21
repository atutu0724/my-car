'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signupCompany } from '@/app/actions/signup'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signupCompany(new FormData(e.currentTarget))
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
          <CardTitle className="text-xl">新規登録</CardTitle>
          <p className="text-sm text-gray-500 mt-1">企業情報と管理者アカウントを作成します</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="company_name">企業名</Label>
              <Input id="company_name" name="company_name" placeholder="株式会社サンプル" required />
            </div>

            <div className="space-y-1">
              <Label htmlFor="company_code">会社コード</Label>
              <Input
                id="company_code"
                name="company_code"
                placeholder="例: salife-corp（半角英数字・ハイフン、3〜20文字）"
                pattern="[a-zA-Z0-9\-]{3,20}"
                title="半角英数字・ハイフンで3〜20文字"
                required
              />
              <p className="text-xs text-gray-400">ログイン時に使用します。後から変更できません。</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="plan_type">プラン</Label>
              <select
                id="plan_type"
                name="plan_type"
                defaultValue="small"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="small">スモール（〜10台）</option>
                <option value="standard">スタンダード（11台〜）</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">管理者メールアドレス</Label>
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
