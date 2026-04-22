'use client'

import { useRef, useState, useCallback } from 'react'
import { Camera, RotateCcw, Send, CheckCircle, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'

type CheckType = 'before' | 'after'
type Step = 'select' | 'selfie-camera' | 'selfie-preview' | 'device-camera' | 'device-preview' | 'confirm' | 'done'

const SAFE_BOTTOM = 'max(1.5rem, env(safe-area-inset-bottom))'

export default function AlcoholCheckPage() {
  const [step, setStep] = useState<Step>('select')
  const [checkType, setCheckType] = useState<CheckType>('before')
  const [selfieBase64, setSelfieBase64] = useState('')
  const [selfiePreview, setSelfiePreview] = useState('')
  const [deviceBase64, setDeviceBase64] = useState('')
  const [devicePreview, setDevicePreview] = useState('')
  const [concentration, setConcentration] = useState('0.00')
  const [isEditingConc, setIsEditingConc] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    stopCamera()
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
    })
    streamRef.current = stream
    if (videoRef.current) videoRef.current.srcObject = stream
  }, [stopCamera])

  const capturePhoto = useCallback((): string => {
    const video = videoRef.current!
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.85)
  }, [])

  const reset = useCallback(() => {
    setStep('select')
    setSelfieBase64(''); setSelfiePreview('')
    setDeviceBase64(''); setDevicePreview('')
    setConcentration('0.00')
    setIsEditingConc(false)
    setShowConfirm(false)
    setError('')
  }, [])

  // ---- 種別選択 ----
  if (step === 'select') {
    return (
      <div className="max-w-sm mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">アルコールチェック</h1>
        <p className="text-sm text-gray-500 mb-8">乗車前・乗車後を選択してください</p>
        <div className="grid grid-cols-2 gap-4">
          {(['before', 'after'] as const).map(t => (
            <button key={t}
              onClick={() => { setCheckType(t); setStep('selfie-camera'); setTimeout(() => startCamera('user'), 100) }}
              className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <Camera className="h-8 w-8 text-blue-600 mb-2" />
              <span className="font-semibold text-blue-700">{t === 'before' ? '乗車前' : '乗車後'}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ---- 内カメラ ----
  if (step === 'selfie-camera') {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col" style={{ height: '100dvh' }}>
        <video ref={videoRef} autoPlay playsInline muted className="flex-1 w-full object-cover min-h-0" />
        <div className="shrink-0 bg-black px-6 pt-4 flex flex-col items-center gap-3" style={{ paddingBottom: SAFE_BOTTOM }}>
          <p className="text-white text-sm text-center">アルコールチェッカーに息を吹いている様子を撮影してください</p>
          <button onClick={() => {
            const dataUrl = capturePhoto()
            setSelfiePreview(dataUrl); setSelfieBase64(dataUrl.split(',')[1])
            stopCamera(); setStep('selfie-preview')
          }} className="w-20 h-20 rounded-full bg-white border-4 border-gray-400 flex items-center justify-center active:scale-95 transition-transform">
            <Camera className="h-8 w-8 text-gray-800" />
          </button>
        </div>
      </div>
    )
  }

  // ---- 内カメラプレビュー ----
  if (step === 'selfie-preview') {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col" style={{ height: '100dvh' }}>
        <div className="flex-1 min-h-0 flex items-center justify-center p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selfiePreview} alt="selfie" className="w-full h-full object-contain rounded-xl" />
        </div>
        <div className="shrink-0 bg-black px-6 pt-3 flex flex-col gap-3" style={{ paddingBottom: SAFE_BOTTOM }}>
          <p className="text-white text-sm text-center">撮影した写真を確認してください</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { setStep('selfie-camera'); setTimeout(() => startCamera('user'), 100) }}
              className="flex items-center justify-center gap-2 h-14 rounded-xl border-2 border-white/30 text-white text-base font-medium active:scale-95 transition-transform">
              <RotateCcw className="h-5 w-5" />撮り直し
            </button>
            <button onClick={() => { setStep('device-camera'); setTimeout(() => startCamera('environment'), 100) }}
              className="flex items-center justify-center gap-2 h-14 rounded-xl bg-blue-600 text-white text-base font-medium active:scale-95 transition-transform">
              次へ
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---- 外カメラ ----
  if (step === 'device-camera') {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col" style={{ height: '100dvh' }}>
        <video ref={videoRef} autoPlay playsInline muted className="flex-1 w-full object-cover min-h-0" />
        <div className="shrink-0 bg-black px-6 pt-4 flex flex-col items-center gap-3" style={{ paddingBottom: SAFE_BOTTOM }}>
          <p className="text-white text-sm text-center">アルコールチェッカーの数値表示を撮影してください</p>
          <button onClick={() => {
            const dataUrl = capturePhoto()
            setDevicePreview(dataUrl); setDeviceBase64(dataUrl.split(',')[1])
            stopCamera(); setStep('device-preview')
          }} className="w-20 h-20 rounded-full bg-white border-4 border-gray-400 flex items-center justify-center active:scale-95 transition-transform">
            <Camera className="h-8 w-8 text-gray-800" />
          </button>
        </div>
      </div>
    )
  }

  // ---- 外カメラプレビュー ----
  if (step === 'device-preview') {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col" style={{ height: '100dvh' }}>
        <div className="flex-1 min-h-0 flex items-center justify-center p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={devicePreview} alt="device" className="w-full h-full object-contain rounded-xl" />
        </div>
        <div className="shrink-0 bg-black px-6 pt-3 flex flex-col gap-3" style={{ paddingBottom: SAFE_BOTTOM }}>
          <p className="text-white text-sm text-center">数値がはっきり写っているか確認してください</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { setStep('device-camera'); setTimeout(() => startCamera('environment'), 100) }}
              className="flex items-center justify-center gap-2 h-14 rounded-xl border-2 border-white/30 text-white text-base font-medium active:scale-95 transition-transform">
              <RotateCcw className="h-5 w-5" />撮り直し
            </button>
            <button onClick={() => setStep('confirm')}
              className="flex items-center justify-center h-14 rounded-xl bg-blue-600 text-white text-base font-medium active:scale-95 transition-transform">
              次へ
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---- 確認・送信 ----
  if (step === 'confirm') {
    const concNum = parseFloat(concentration)
    const isOver = !isNaN(concNum) && concNum > 0.15

    return (
      <div className="fixed inset-0 z-[100] bg-gray-50 flex flex-col" style={{ height: '100dvh' }}>
        {/* 写真エリア */}
        <div className="flex-1 min-h-0 grid grid-cols-2 gap-2 p-3">
          <div className="flex flex-col gap-1 min-h-0">
            <p className="text-xs text-gray-500 text-center">本人写真</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selfiePreview} alt="selfie" className="flex-1 min-h-0 w-full object-contain rounded-xl bg-black" />
          </div>
          <div className="flex flex-col gap-1 min-h-0">
            <p className="text-xs text-gray-500 text-center">チェッカー</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={devicePreview} alt="device" className="flex-1 min-h-0 w-full object-contain rounded-xl bg-black" />
          </div>
        </div>

        {/* 入力・ボタンエリア */}
        <div className="shrink-0 bg-white border-t border-gray-200 px-4 pt-4 flex flex-col gap-3" style={{ paddingBottom: SAFE_BOTTOM }}>
          {/* 種別 */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">種別</span>
            <span className="font-medium">{checkType === 'before' ? '乗車前' : '乗車後'}</span>
          </div>

          {/* 濃度入力 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">アルコール濃度</span>
            <div className="flex items-center gap-2">
              {isEditingConc ? (
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={concentration}
                  onChange={e => setConcentration(e.target.value)}
                  onBlur={() => {
                    const v = parseFloat(concentration)
                    setConcentration(isNaN(v) ? '0.000' : v.toFixed(3))
                    setIsEditingConc(false)
                  }}
                  autoFocus
                  className={`w-28 text-right text-xl font-bold border-b-2 border-blue-500 bg-transparent outline-none ${isOver ? 'text-red-600' : 'text-green-600'}`}
                />
              ) : (
                <span className={`text-xl font-bold ${isOver ? 'text-red-600' : 'text-green-600'}`}>
                  {parseFloat(concentration).toFixed(3)} mg/L
                </span>
              )}
              <button onClick={() => setIsEditingConc(true)}
                className="p-1.5 rounded-lg bg-gray-100 text-gray-500 active:scale-95 transition-transform">
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          {/* ボタン */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { setStep('device-camera'); setTimeout(() => startCamera('environment'), 100) }}
              className="flex items-center justify-center gap-2 h-14 rounded-xl border-2 border-gray-300 text-gray-700 text-base font-medium active:scale-95 transition-transform">
              <RotateCcw className="h-5 w-5" />撮り直し
            </button>
            <button onClick={() => setShowConfirm(true)}
              className="flex items-center justify-center gap-2 h-14 rounded-xl bg-blue-600 text-white text-base font-medium active:scale-95 transition-transform">
              <Send className="h-5 w-5" />送信
            </button>
          </div>
        </div>

        {/* 送信確認ダイアログ */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[110] p-4" style={{ paddingBottom: SAFE_BOTTOM }}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h3 className="font-bold text-lg mb-1 text-center">送信確認</h3>
              <p className="text-gray-500 text-sm text-center mb-4">
                {checkType === 'before' ? '乗車前' : '乗車後'}の結果を送信しますか？
              </p>
              <p className={`text-center text-3xl font-bold mb-5 ${isOver ? 'text-red-600' : 'text-green-600'}`}>
                {parseFloat(concentration).toFixed(3)} mg/L
              </p>
              {error && <p className="text-sm text-red-500 text-center mb-3">{error}</p>}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowConfirm(false)} disabled={loading}
                  className="h-13 rounded-xl border-2 border-gray-300 text-gray-700 font-medium active:scale-95 transition-transform disabled:opacity-50 py-3">
                  キャンセル
                </button>
                <button disabled={loading} onClick={async () => {
                  setLoading(true); setError('')
                  try {
                    const res = await fetch('/api/alcohol-check/submit', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ checkType, selfieBase64, deviceBase64, concentration: parseFloat(concentration) }),
                    })
                    if (!res.ok) { const d = await res.json(); setError(d.error ?? '送信に失敗しました'); return }
                    setShowConfirm(false); setStep('done')
                  } catch { setError('送信に失敗しました') }
                  finally { setLoading(false) }
                }} className="h-13 rounded-xl bg-blue-600 text-white font-medium active:scale-95 transition-transform disabled:opacity-50 py-3">
                  {loading ? '送信中...' : '送信する'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ---- 完了 ----
  if (step === 'done') {
    return (
      <div className="max-w-sm mx-auto text-center py-12">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">送信完了</h2>
        <p className="text-gray-500 text-sm mb-6">アルコールチェック結果を送信しました</p>
        <Button onClick={reset}>もう一度チェックする</Button>
      </div>
    )
  }

  return null
}
