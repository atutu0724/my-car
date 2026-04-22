'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    liff: any
  }
}

export default function LiffPage() {
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [message, setMessage] = useState('LINEログイン中...')

  async function initLiff() {
    try {
      await window.liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })

      if (!window.liff.isInClient()) {
        setStatus('error')
        setMessage('このページはLINEアプリ内からのみ開けます')
        return
      }

      if (!window.liff.isLoggedIn()) {
        window.liff.login()
        return
      }

      const idToken = window.liff.getIDToken()
      if (!idToken) {
        setStatus('error')
        setMessage('LINEトークンの取得に失敗しました')
        return
      }

      const res = await fetch('/api/liff/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })

      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(data.error ?? 'ログインに失敗しました')
        return
      }

      window.location.href = data.actionLink
    } catch {
      setStatus('error')
      setMessage('エラーが発生しました。再度お試しください。')
    }
  }

  useEffect(() => {
    if (window.liff) initLiff()
  }, [])

  return (
    <>
      <Script
        src="https://static.line-scdn.net/liff/edge/2/sdk.js"
        onLoad={initLiff}
      />
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          {status === 'loading' ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4" />
              <p className="text-gray-600">{message}</p>
            </>
          ) : (
            <>
              <p className="text-red-500 font-medium mb-2">ログインエラー</p>
              <p className="text-gray-600 text-sm">{message}</p>
              <p className="text-gray-400 text-xs mt-4">管理者にLINE連携の設定を依頼してください</p>
            </>
          )}
        </div>
      </div>
    </>
  )
}
