'use client'

import { useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, RotateCcw, Send, CheckCircle } from 'lucide-react'

type CheckType = 'before' | 'after'
type Step = 'select' | 'selfie-camera' | 'selfie-preview' | 'device-camera' | 'device-preview' | 'confirm' | 'done'

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default function AlcoholCheckPage() {
  const [step, setStep] = useState<Step>('select')
  const [checkType, setCheckType] = useState<CheckType>('before')
  const [selfieBase64, setSelfieBase64] = useState<string>('')
  const [selfiePreview, setSelfiePreview] = useState<string>('')
  const [deviceBase64, setDeviceBase64] = useState<string>('')
  const [devicePreview, setDevicePreview] = useState<string>('')
  const [concentration, setConcentration] = useState<number | null>(null)
  const [ocrRaw, setOcrRaw] = useState<string>('')
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

  // ---- STEP: 種別選択 ----
  if (step === 'select') {
    return (
      <div className="max-w-sm mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">アルコールチェック</h1>
        <p className="text-sm text-gray-500 mb-8">乗車前・乗車後を選択してください</p>
        <div className="grid grid-cols-2 gap-4">
          {(['before', 'after'] as const).map(t => (
            <button
              key={t}
              onClick={() => {
                setCheckType(t)
                setStep('selfie-camera')
                setTimeout(() => startCamera('user'), 100)
              }}
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

  // ---- STEP: 内カメラ（セルフィー）----
  if (step === 'selfie-camera') {
    return (
      <div className="max-w-sm mx-auto">
        <h2 className="text-lg font-bold mb-1">{checkType === 'before' ? '乗車前' : '乗車後'}チェック</h2>
        <p className="text-sm text-gray-500 mb-3">アルコールチェッカーに息を吹いている様子を撮影してください（内カメラ）</p>
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video mb-4">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        </div>
        <Button className="w-full" onClick={() => {
          const dataUrl = capturePhoto()
          const base64 = dataUrl.split(',')[1]
          setSelfiePreview(dataUrl)
          setSelfieBase64(base64)
          stopCamera()
          setStep('selfie-preview')
        }}>
          <Camera className="h-4 w-4 mr-2" />撮影
        </Button>
      </div>
    )
  }

  // ---- STEP: 内カメラプレビュー ----
  if (step === 'selfie-preview') {
    return (
      <div className="max-w-sm mx-auto">
        <h2 className="text-lg font-bold mb-1">撮影確認（本人写真）</h2>
        <p className="text-sm text-gray-500 mb-3">撮影した写真を確認してください</p>
        <div className="rounded-xl overflow-hidden bg-black aspect-video mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selfiePreview} alt="selfie" className="w-full h-full object-cover" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => {
            setStep('selfie-camera')
            setTimeout(() => startCamera('user'), 100)
          }}>
            <RotateCcw className="h-4 w-4 mr-1" />撮り直し
          </Button>
          <Button onClick={() => {
            setStep('device-camera')
            setTimeout(() => startCamera('environment'), 100)
          }}>
            次へ（チェッカー撮影）
          </Button>
        </div>
      </div>
    )
  }

  // ---- STEP: 外カメラ（チェッカー）----
  if (step === 'device-camera') {
    return (
      <div className="max-w-sm mx-auto">
        <h2 className="text-lg font-bold mb-1">チェッカー結果を撮影</h2>
        <p className="text-sm text-gray-500 mb-3">アルコールチェッカーの数値表示を撮影してください（外カメラ）</p>
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video mb-4">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        </div>
        <Button className="w-full" onClick={async () => {
          const dataUrl = capturePhoto()
          const base64 = dataUrl.split(',')[1]
          setDevicePreview(dataUrl)
          setDeviceBase64(base64)
          stopCamera()
          setStep('device-preview')
        }}>
          <Camera className="h-4 w-4 mr-2" />撮影
        </Button>
      </div>
    )
  }

  // ---- STEP: 外カメラプレビュー + OCR ----
  if (step === 'device-preview') {
    return (
      <div className="max-w-sm mx-auto">
        <h2 className="text-lg font-bold mb-1">撮影確認（チェッカー）</h2>
        <p className="text-sm text-gray-500 mb-3">数値がはっきり写っているか確認してください</p>
        <div className="rounded-xl overflow-hidden bg-black aspect-video mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={devicePreview} alt="device" className="w-full h-full object-cover" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => {
            setStep('device-camera')
            setTimeout(() => startCamera('environment'), 100)
          }}>
            <RotateCcw className="h-4 w-4 mr-1" />撮り直し
          </Button>
          <Button disabled={loading} onClick={async () => {
            setLoading(true)
            setError('')
            try {
              const res = await fetch('/api/alcohol-check/ocr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: deviceBase64 }),
              })
              const data = await res.json()
              setConcentration(data.concentration)
              setOcrRaw(data.raw)
              setStep('confirm')
            } catch {
              setError('数値の読み取りに失敗しました')
            } finally {
              setLoading(false)
            }
          }}>
            {loading ? '読み取り中...' : '数値を読み取る'}
          </Button>
        </div>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>
    )
  }

  // ---- STEP: 確認・送信 ----
  if (step === 'confirm') {
    return (
      <div className="max-w-sm mx-auto">
        <h2 className="text-lg font-bold mb-4">送信内容の確認</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">種別</span>
            <span className="font-medium">{checkType === 'before' ? '乗車前' : '乗車後'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">アルコール濃度</span>
            <span className={`text-xl font-bold ${concentration !== null && concentration > 0.15 ? 'text-red-600' : 'text-green-600'}`}>
              {concentration !== null ? `${concentration.toFixed(3)} mg/L` : ocrRaw}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-400 mb-1">本人写真</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selfiePreview} alt="selfie" className="rounded-lg w-full aspect-video object-cover" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">チェッカー</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={devicePreview} alt="device" className="rounded-lg w-full aspect-video object-cover" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => {
            setStep('device-camera')
            setTimeout(() => startCamera('environment'), 100)
          }}>
            <RotateCcw className="h-4 w-4 mr-1" />撮り直し
          </Button>
          <Button onClick={() => setShowConfirm(true)}>
            <Send className="h-4 w-4 mr-1" />送信
          </Button>
        </div>

        {/* 送信確認ダイアログ */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-xs w-full">
              <h3 className="font-bold text-lg mb-2">送信確認</h3>
              <p className="text-gray-600 text-sm mb-4">
                {checkType === 'before' ? '乗車前' : '乗車後'}のアルコールチェック結果を送信しますか？
              </p>
              <p className="text-center text-2xl font-bold mb-4 text-gray-800">
                {concentration !== null ? `${concentration.toFixed(3)} mg/L` : ocrRaw}
              </p>
              {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={loading}>
                  キャンセル
                </Button>
                <Button disabled={loading} onClick={async () => {
                  setLoading(true)
                  setError('')
                  try {
                    const res = await fetch('/api/alcohol-check/submit', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ checkType, selfieBase64, deviceBase64, concentration }),
                    })
                    if (!res.ok) {
                      const d = await res.json()
                      setError(d.error ?? '送信に失敗しました')
                      return
                    }
                    setShowConfirm(false)
                    setStep('done')
                  } catch {
                    setError('送信に失敗しました')
                  } finally {
                    setLoading(false)
                  }
                }}>
                  {loading ? '送信中...' : '送信する'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ---- STEP: 完了 ----
  if (step === 'done') {
    return (
      <div className="max-w-sm mx-auto text-center py-12">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">送信完了</h2>
        <p className="text-gray-500 text-sm mb-6">アルコールチェック結果を送信しました</p>
        <Button onClick={() => {
          setStep('select')
          setSelfieBase64('')
          setSelfiePreview('')
          setDeviceBase64('')
          setDevicePreview('')
          setConcentration(null)
          setOcrRaw('')
          setError('')
        }}>
          もう一度チェックする
        </Button>
      </div>
    )
  }

  return null
}
