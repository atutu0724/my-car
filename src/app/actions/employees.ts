'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCompanyId } from '@/lib/supabase/get-company-id'

export async function createEmployee(formData: FormData) {
  const supabase = await createClient()
  const companyId = await getCompanyId()

  const { error } = await supabase.from('employees').insert({
    company_id: companyId,
    name: formData.get('name') as string,
    license_expiry: (formData.get('license_expiry') as string) || null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/employees')
  revalidatePath('/vehicles')
}

export async function updateEmployee(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('employees').update({
    name: formData.get('name') as string,
    license_expiry: (formData.get('license_expiry') as string) || null,
  }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/employees')
}

export async function deleteEmployee(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('employees').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/employees')
  revalidatePath('/vehicles')
}
