'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Home, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { Loading } from '@/components/ui/loading'
import { createClient } from '@/lib/supabase/client'
import { APP_NAME } from '@/lib/constants'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push(redirect)
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión'
      setError(message === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : message)
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async () => {
    if (!email) {
      setError('Ingresa tu email para recibir el link mágico')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?redirect=${redirect}`,
        },
      })

      if (error) throw error

      alert('Te enviamos un link mágico a tu email. Revisá tu bandeja de entrada.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al enviar el link'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">{APP_NAME}</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bienvenido de nuevo</h1>
          <p className="text-gray-600">Ingresa a tu cuenta para continuar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="relative">
              <Input
                type="email"
                label="Email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail className="absolute right-3 top-9 w-5 h-5 text-gray-400" />
            </div>

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Iniciar sesión
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">o</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleMagicLink}
            disabled={loading}
          >
            <Mail className="w-4 h-4 mr-2" />
            Enviar link mágico
          </Button>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          ¿No tenés cuenta?{' '}
          <Link href="/signup" className="font-medium text-emerald-600 hover:text-emerald-700">
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading fullScreen text="Cargando..." />}>
      <LoginForm />
    </Suspense>
  )
}
