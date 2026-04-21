import { createClient } from './server'

export type UserRole = 'admin' | 'employee'

export async function getRole(): Promise<UserRole> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return (user?.user_metadata?.role as UserRole) ?? 'admin'
}

export async function getUserMeta() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return {
    role: (user?.user_metadata?.role as UserRole) ?? 'admin',
    employeeId: user?.user_metadata?.employee_id as string | undefined,
  }
}
