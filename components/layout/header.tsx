'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Menu, X, Bell, Settings, User } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/use-user'
import { APP_NAME } from '@/lib/constants'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, profile } = useUser()

  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/signup')

  if (isAuthPage) return null

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 hidden sm:block">{APP_NAME}</span>
          </Link>

          {/* Desktop nav */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              <NavLink href="/dashboard" active={pathname === '/dashboard'}>
                Inicio
              </NavLink>
              <NavLink href="/scan" active={pathname === '/scan'}>
                Escanear
              </NavLink>
              <NavLink href="/tasks" active={pathname === '/tasks'}>
                Tareas
              </NavLink>
              <NavLink href="/progress" active={pathname === '/progress'}>
                Progreso
              </NavLink>
              <NavLink href="/rooms" active={pathname === '/rooms'}>
                Habitaciones
              </NavLink>
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/settings"
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                </Link>
                <Link
                  href="/settings"
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors hidden sm:flex"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Menu className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                <Link
                  href="/settings"
                  className="hidden md:flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                >
                  Comenzar
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="flex flex-col p-4 gap-1">
            <MobileNavLink href="/dashboard" active={pathname === '/dashboard'} onClick={() => setMobileMenuOpen(false)}>
              Inicio
            </MobileNavLink>
            <MobileNavLink href="/scan" active={pathname === '/scan'} onClick={() => setMobileMenuOpen(false)}>
              Escanear
            </MobileNavLink>
            <MobileNavLink href="/tasks" active={pathname === '/tasks'} onClick={() => setMobileMenuOpen(false)}>
              Tareas
            </MobileNavLink>
            <MobileNavLink href="/progress" active={pathname === '/progress'} onClick={() => setMobileMenuOpen(false)}>
              Progreso
            </MobileNavLink>
            <MobileNavLink href="/rooms" active={pathname === '/rooms'} onClick={() => setMobileMenuOpen(false)}>
              Habitaciones
            </MobileNavLink>
            <MobileNavLink href="/members" active={pathname === '/members'} onClick={() => setMobileMenuOpen(false)}>
              Miembros
            </MobileNavLink>
            <MobileNavLink href="/settings" active={pathname === '/settings'} onClick={() => setMobileMenuOpen(false)}>
              Configuración
            </MobileNavLink>
          </nav>
        </div>
      )}
    </header>
  )
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
        active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'
      )}
    >
      {children}
    </Link>
  )
}

function MobileNavLink({ href, active, onClick, children }: { href: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'px-4 py-3 text-sm font-medium rounded-lg transition-colors',
        active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'
      )}
    >
      {children}
    </Link>
  )
}
