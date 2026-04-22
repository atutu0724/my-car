import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { BottomNav } from '@/components/layout/bottom-nav'
import type { UserRole } from '@/lib/supabase/get-role'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = (user.user_metadata?.role as UserRole) ?? 'admin'

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userEmail={user.email ?? ''} role={role} />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl pb-24 md:pb-8">
        {children}
      </main>
      <BottomNav role={role} />
    </div>
  )
}
