'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function ResetPasswordConfirmForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setError('リンクが無効です。パスワードリセットをやり直してください。')
      return
    }
    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setError('リンクの有効期限が切れています。パスワードリセットをやり直してください。')
      } else {
        setReady(true)
      }
    })
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください。')
      return
    }
    if (password !== confirm) {
      setError('パスワードが一致しません。')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError('パスワードの更新に失敗しました。')
      return
    }
    router.push('/dashboard')
  }

  if (error && !ready) {
    return (
      <div className="text-center space-y-4">
        <p className="text-red-600 text-sm">{error}</p>
        <a href="/reset-password" className="text-blue-600 hover:underline text-sm">
          パスワードリセットをやり直す
        </a>
      </div>
    )
  }

  if (!ready) {
    return <p className="text-center text-sm text-gray-500">確認中...</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="password">新しいパスワード</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="confirm">パスワード（確認）</Label>
        <Input
          id="confirm"
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? '更新中...' : 'パスワードを更新'}
      </Button>
    </form>
  )
}

export default function ResetPasswordConfirmPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">新しいパスワードを設定</CardTitle>
          <p className="text-sm text-gray-500 mt-1">8文字以上で入力してください</p>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-center text-sm text-gray-500">読み込み中...</p>}>
            <ResetPasswordConfirmForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
