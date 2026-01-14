'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Mail, Crown, User, Trash2, Copy, Check, X } from 'lucide-react'
import { Button, Card, Input, Modal, Badge } from '@/components/ui'
import { Loading } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/layout/page-header'
import { createClient } from '@/lib/supabase/client'
import { useHome } from '@/hooks/use-home'
import { useUser } from '@/hooks/use-user'
import { generateInviteToken, cn } from '@/lib/utils'
import { STRIPE_ENABLED } from '@/lib/constants'
import type { Tables } from '@/types/database'

interface MemberWithUser extends Tables<'home_members'> {
  user?: Tables<'users'> | null
}

export default function MembersPage() {
  const { currentHome, members, refetchMembers } = useHome()
  const { profile } = useUser()
  const supabase = createClient()

  const [membersWithUsers, setMembersWithUsers] = useState<MemberWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (members.length > 0) {
      fetchMemberUsers()
    } else {
      setLoading(false)
    }
  }, [members])

  const fetchMemberUsers = async () => {
    const userIds = members.filter(m => m.user_id).map(m => m.user_id)

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds as string[])

      const usersList = (users || []) as Tables<'users'>[]
      const withUsers = members.map(member => ({
        ...member,
        user: usersList.find(u => u.id === member.user_id) || null,
      }))

      setMembersWithUsers(withUsers)
    } else {
      setMembersWithUsers(members)
    }

    setLoading(false)
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !currentHome) return

    setSending(true)

    try {
      const token = generateInviteToken()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('home_members') as any).insert({
        home_id: currentHome.id,
        invited_email: inviteEmail.trim(),
        invite_token: token,
        role: 'member',
      })

      const link = `${window.location.origin}/invite/${token}`
      setInviteLink(link)
      setInviteEmail('')

      await refetchMembers()
    } catch (error) {
      console.error('Error inviting member:', error)
      alert('Error al enviar la invitación')
    } finally {
      setSending(false)
    }
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('¿Estás seguro de eliminar a este miembro?')) return

    try {
      await supabase.from('home_members').delete().eq('id', memberId)
      await refetchMembers()
    } catch (error) {
      console.error('Error removing member:', error)
    }
  }

  const isOwner = membersWithUsers.find(m => m.user_id === profile?.id)?.role === 'owner'

  if (loading) {
    return <Loading fullScreen text="Cargando miembros..." />
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <PageHeader
        title="Miembros"
        subtitle={`${membersWithUsers.length} ${membersWithUsers.length === 1 ? 'persona' : 'personas'} en ${currentHome?.name}`}
        action={
          isOwner && (
            <Button onClick={() => setShowInviteModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Invitar
            </Button>
          )
        }
      />

      {/* Premium banner for free users (only show if Stripe is enabled) */}
      {STRIPE_ENABLED && profile?.subscription_tier === 'free' && (
        <Card className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 mb-6 text-white">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-200" />
            <div>
              <h3 className="font-semibold">Multi-usuario Premium</h3>
              <p className="text-sm text-purple-200">
                Actualiza para invitar hasta 10 miembros por hogar
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Members list */}
      <div className="space-y-2">
        {membersWithUsers.map((member) => (
          <Card key={member.id} variant="bordered" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                {member.user?.avatar_url ? (
                  <img
                    src={member.user.avatar_url}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <User className="w-5 h-5 text-emerald-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 truncate">
                    {member.user?.full_name || member.invited_email || 'Usuario'}
                  </p>
                  {member.role === 'owner' && (
                    <Badge variant="warning" size="sm">
                      <Crown className="w-3 h-3 mr-1" />
                      Owner
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {member.user?.email || member.invited_email}
                </p>
                {!member.user_id && (
                  <Badge variant="default" size="sm" className="mt-1">
                    Pendiente
                  </Badge>
                )}
              </div>

              {isOwner && member.role !== 'owner' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveMember(member.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {membersWithUsers.length === 0 && (
        <EmptyState
          icon={Users}
          title="Sin miembros"
          description="Invita a tu familia para compartir las tareas de limpieza"
          action={
            <Button onClick={() => setShowInviteModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Invitar miembro
            </Button>
          }
        />
      )}

      {/* Invite modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false)
          setInviteEmail('')
          setInviteLink('')
        }}
        title="Invitar miembro"
      >
        <div className="space-y-4">
          {!inviteLink ? (
            <>
              <p className="text-sm text-gray-500">
                Ingresa el email de la persona que querés invitar a tu hogar.
              </p>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <Button
                className="w-full"
                onClick={handleInvite}
                loading={sending}
                disabled={!inviteEmail.trim()}
              >
                Enviar invitación
              </Button>
            </>
          ) : (
            <>
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">¡Invitación creada!</h3>
                <p className="text-sm text-gray-500">
                  Comparte este link con la persona que querés invitar
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setInviteLink('')
                  setShowInviteModal(false)
                }}
              >
                Cerrar
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
