'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCompanyId } from '@/lib/supabase/get-company-id'

export async function createVehicle(formData: FormData) {
  const supabase = await createClient()
  const companyId = await getCompanyId()

  const { error } = await supabase.from('vehicles').insert({
    company_id: companyId,
    employee_id: formData.get('employee_id') as string,
    vehicle_type: formData.get('vehicle_type') as string,
    license_plate: formData.get('license_plate') as string,
    inspection_expiry: formData.get('inspection_expiry') as string,
    compulsory_insurance_expiry: formData.get('compulsory_insurance_expiry') as string,
    voluntary_insurance_expiry: formData.get('voluntary_insurance_expiry') as string || null,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/vehicles')
  revalidatePath('/dashboard')
}

export async function updateVehicle(id: string, formData: FormData) {
  const supabase = await createClient()
  const companyId = await getCompanyId()

  const { error } = await supabase.from('vehicles').update({
    employee_id: formData.get('employee_id') as string,
    vehicle_type: formData.get('vehicle_type') as string,
    license_plate: formData.get('license_plate') as string,
    inspection_expiry: formData.get('inspection_expiry') as string,
    compulsory_insurance_expiry: formData.get('compulsory_insurance_expiry') as string,
    voluntary_insurance_expiry: formData.get('voluntary_insurance_expiry') as string || null,
  }).eq('id', id).eq('company_id', companyId)

  if (error) throw new Error(error.message)
  revalidatePath('/vehicles')
  revalidatePath('/dashboard')
}

export async function deleteVehicle(id: string) {
  const supabase = await createClient()
  const companyId = await getCompanyId()

  const { error } = await supabase.from('vehicles').delete().eq('id', id).eq('company_id', companyId)
  if (error) throw new Error(error.message)
  revalidatePath('/vehicles')
  revalidatePath('/dashboard')
}
