'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Home, Check, X } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { Loading } from '@/components/ui/loading'
import { createClient } from '@/lib/supabase/client'
import { APP_NAME } from '@/lib/constants'
import type { Tables } from '@/types/database'

export default function InvitePage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState<{ home_name: string; inviter_name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    checkInvite()
  }, [token])

  const checkInvite = async () => {
    try {
      // Get the invite
      const { data: memberData, error: memberError } = await supabase
        .from('home_members')
        .select('*, homes(name, owner_id)')
        .eq('invite_token', token)
        .is('user_id', null)
        .single()

      if (memberError || !memberData) {
        setError('Esta invitación no es válida o ya fue usada.')
        setLoading(false)
        return
      }

      const member = memberData as Tables<'home_members'> & { homes: { name: string; owner_id: string } }
      const homeData = member.homes

      // Get inviter name
      const { data: ownerData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', homeData.owner_id)
        .single()

      const owner = ownerData as Pick<Tables<'users'>, 'full_name'> | null

      setInvite({
        home_name: homeData.name,
        inviter_name: owner?.full_name || 'Alguien',
      })

      setLoading(false)
    } catch (err) {
      setError('Error al verificar la invitación')
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    setAccepting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Redirect to signup with return URL
        router.push(`/signup?redirect=/invite/${token}`)
        return
      }

      // Update the invite with the user's ID
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('home_members') as any)
        .update({
          user_id: user.id,
          invite_token: null,
          joined_at: new Date().toISOString(),
        })
        .eq('invite_token', token)

      if (error) throw error

      router.push('/dashboard')
    } catch (err) {
      setError('Error al aceptar la invitación')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return <Loading fullScreen text="Verificando invitación..." />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <Card variant="bordered" className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invitación no válida</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <Button variant="outline" onClick={() => router.push('/')}>
            Ir al inicio
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <Card variant="bordered" className="max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <Home className="w-8 h-8 text-emerald-600" />
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Te invitaron a un hogar
        </h1>

        <p className="text-gray-500 mb-6">
          <strong>{invite?.inviter_name}</strong> te invitó a unirte a{' '}
          <strong>{invite?.home_name}</strong> en {APP_NAME}.
        </p>

        <div className="space-y-3">
          <Button className="w-full" onClick={handleAccept} loading={accepting}>
            <Check className="w-4 h-4 mr-2" />
            Aceptar invitación
          </Button>

          <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
            Rechazar
          </Button>
        </div>
      </Card>
    </div>
  )
}
