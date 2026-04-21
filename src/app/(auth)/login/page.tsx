'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { loginWithCompanyCode } from '@/app/actions/login'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered') === '1'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await loginWithCompanyCode(new FormData(e.currentTarget))
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <CardContent>
      {registered && (
        <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
          登録が完了しました。ログインしてください。
        </p>
      )}
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="company_code">会社コード</Label>
          <Input
            id="company_code"
            name="company_code"
            placeholder="例: salife-corp"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="admin@example.com"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">パスワード</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'ログイン中...' : 'ログイン'}
        </Button>
        <p className="text-center text-sm text-gray-500">
          <a href="/reset-password" className="text-blue-600 hover:underline">パスワードを忘れた方はこちら</a>
        </p>
        <p className="text-center text-sm text-gray-500">
          アカウントをお持ちでない方は{' '}
          <a href="/signup" className="text-blue-600 hover:underline">新規登録</a>
        </p>
      </form>
    </CardContent>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Image src="/logo.png" alt="マイカー通勤管理" width={160} height={80} style={{ height: '80px', width: 'auto' }} priority />
          </div>
          <CardTitle className="sr-only">ログイン</CardTitle>
          <p className="text-sm text-gray-500 mt-1">管理者アカウントでログイン</p>
        </CardHeader>
        <Suspense fallback={<CardContent><div className="h-48" /></CardContent>}>
          <LoginForm />
        </Suspense>
      </Card>
    </div>
  )
}
