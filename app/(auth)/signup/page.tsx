'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Home, Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { Loading } from '@/components/ui/loading'
import { createClient } from '@/lib/supabase/client'
import { APP_NAME } from '@/lib/constants'

function SignupForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/api/auth/callback?redirect=/onboarding${plan ? `&plan=${plan}` : ''}`,
        },
      })

      if (error) throw error

      setSuccess(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear la cuenta'
      if (message.includes('already registered')) {
        setError('Este email ya está registrado. ¿Querés iniciar sesión?')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Revisa tu email</h1>
          <p className="text-gray-600 mb-6">
            Te enviamos un link de confirmación a <strong>{email}</strong>.
            Hacé click en el link para activar tu cuenta.
          </p>
          <Link href="/login">
            <Button variant="outline">
              Volver a iniciar sesión
            </Button>
          </Link>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Crear cuenta</h1>
          <p className="text-gray-600">
            {plan === 'premium'
              ? 'Empieza tu prueba gratuita de 7 días'
              : 'Empieza a organizar tu hogar hoy'}
          </p>
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
                type="text"
                label="Nombre"
                placeholder="Tu nombre"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <User className="absolute right-3 top-9 w-5 h-5 text-gray-400" />
            </div>

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
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
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
              {plan === 'premium' ? 'Empezar prueba gratis' : 'Crear cuenta'}
            </Button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            Al crear una cuenta, aceptás nuestros{' '}
            <Link href="/terms" className="underline">términos de servicio</Link> y{' '}
            <Link href="/privacy" className="underline">política de privacidad</Link>.
          </p>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-700">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<Loading fullScreen text="Cargando..." />}>
      <SignupForm />
    </Suspense>
  )
}
