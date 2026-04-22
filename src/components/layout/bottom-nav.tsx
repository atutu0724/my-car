'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Car, LayoutDashboard, ClipboardList, Users, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/lib/supabase/get-role'

const EMPLOYEE_TABS = [
  { href: '/alcohol-check', label: 'アルコール', icon: ClipboardList },
  { href: '/vehicles', label: '車両管理', icon: Car },
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
]

const ADMIN_TABS = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/vehicles', label: '車両管理', icon: Car },
  { href: '/alcohol-checks', label: 'アルコール', icon: ClipboardList },
  { href: '/employees', label: '従業員', icon: Users },
  { href: '/settings', label: '設定', icon: Settings },
]

export function BottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const tabs = role === 'admin' ? ADMIN_TABS : EMPLOYEE_TABS

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40 flex"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors',
              active ? 'text-blue-600' : 'text-gray-400'
            )}
          >
            <Icon className={cn('h-5 w-5', active ? 'text-blue-600' : 'text-gray-400')} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
