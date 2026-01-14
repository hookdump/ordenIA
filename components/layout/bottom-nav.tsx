'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Camera, CheckSquare, BarChart2, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/use-user'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Inicio' },
  { href: '/scan', icon: Camera, label: 'Escanear' },
  { href: '/tasks', icon: CheckSquare, label: 'Tareas' },
  { href: '/progress', icon: BarChart2, label: 'Progreso' },
  { href: '/settings', icon: Settings, label: 'Config' },
]

export function BottomNav() {
  const pathname = usePathname()
  const { user } = useUser()

  if (!user) return null

  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/signup')
  if (isAuthPage) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors',
                active ? 'text-emerald-600' : 'text-gray-500'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
