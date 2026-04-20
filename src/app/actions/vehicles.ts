'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createVehicle(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('vehicles').insert({
    company_id: formData.get('company_id') as string,
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('vehicles').update({
    employee_id: formData.get('employee_id') as string,
    vehicle_type: formData.get('vehicle_type') as string,
    license_plate: formData.get('license_plate') as string,
    inspection_expiry: formData.get('inspection_expiry') as string,
    compulsory_insurance_expiry: formData.get('compulsory_insurance_expiry') as string,
    voluntary_insurance_expiry: formData.get('voluntary_insurance_expiry') as string || null,
  }).eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/vehicles')
  revalidatePath('/dashboard')
}

export async function deleteVehicle(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('vehicles').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/vehicles')
  revalidatePath('/dashboard')
}
