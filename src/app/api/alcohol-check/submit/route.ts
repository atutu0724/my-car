import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getUserMeta } from '@/lib/supabase/get-role'

export async function POST(request: NextRequest) {
  const { checkType, selfieBase64, deviceBase64, concentration } = await request.json()

  const meta = await getUserMeta()
  if (!meta.employeeId) return NextResponse.json({ error: '従業員情報が見つかりません' }, { status: 403 })

  const companyId = await getCompanyId()
  const service = createServiceClient()

  // Upload selfie
  const selfieBuffer = Buffer.from(selfieBase64, 'base64')
  const selfiePath = `${companyId}/${meta.employeeId}/${Date.now()}_selfie.jpg`
  const { error: selfieErr } = await service.storage
    .from('alcohol-checks')
    .upload(selfiePath, selfieBuffer, { contentType: 'image/jpeg' })
  if (selfieErr) return NextResponse.json({ error: '写真のアップロードに失敗しました' }, { status: 500 })

  // Upload device photo
  const deviceBuffer = Buffer.from(deviceBase64, 'base64')
  const devicePath = `${companyId}/${meta.employeeId}/${Date.now()}_device.jpg`
  const { error: deviceErr } = await service.storage
    .from('alcohol-checks')
    .upload(devicePath, deviceBuffer, { contentType: 'image/jpeg' })
  if (deviceErr) return NextResponse.json({ error: '写真のアップロードに失敗しました' }, { status: 500 })

  // Get signed URLs (1 year)
  const { data: selfieUrl } = await service.storage.from('alcohol-checks').createSignedUrl(selfiePath, 31536000)
  const { data: deviceUrl } = await service.storage.from('alcohol-checks').createSignedUrl(devicePath, 31536000)

  // Save to DB
  const supabase = await createClient()
  const { error: dbErr } = await supabase.from('alcohol_checks').insert({
    company_id: companyId,
    employee_id: meta.employeeId,
    check_type: checkType,
    selfie_url: selfieUrl?.signedUrl,
    device_photo_url: deviceUrl?.signedUrl,
    concentration,
  })

  if (dbErr) return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 })

  return NextResponse.json({ success: true })
}
