'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function refreshVehicleStatus() {
  const supabase = await createClient()
  await supabase.rpc('refresh_vehicle_status')
  revalidatePath('/dashboard')
  revalidatePath('/vehicles')
}
