'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/api/auth/callback?next=/reset-password/confirm`,
    })
    setLoading(false)
    if (error) {
      setError('送信に失敗しました。メールアドレスを確認してください。')
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">パスワードリセット</CardTitle>
          <p className="text-sm text-gray-500 mt-1">登録済みのメールアドレスを入力してください</p>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-green-700 font-medium">リセット用メールを送信しました</p>
              <p className="text-sm text-gray-500">メール内のリンクからパスワードを再設定してください。</p>
              <a href="/login" className="text-blue-600 hover:underline text-sm">ログインページへ戻る</a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '送信中...' : 'リセットメールを送信'}
              </Button>
              <p className="text-center text-sm">
                <a href="/login" className="text-blue-600 hover:underline">ログインへ戻る</a>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
