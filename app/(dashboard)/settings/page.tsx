'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { User, Bell, CreditCard, Shield, LogOut, Trash2, Crown, Check } from 'lucide-react'
import { Button, Card, Input, Checkbox, Badge } from '@/components/ui'
import { Loading } from '@/components/ui/loading'
import { PageHeader } from '@/components/layout/page-header'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { cn } from '@/lib/utils'
import { FREE_SCANS_PER_MONTH, PREMIUM_MONTHLY_PRICE, STRIPE_ENABLED } from '@/lib/constants'
import type { Tables } from '@/types/database'

type Tab = 'account' | 'notifications' | 'billing' | 'privacy'

function SettingsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, profile, loading } = useUser()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get('tab') as Tab) || 'account'
  )
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [notificationPrefs, setNotificationPrefs] = useState({
    dailyReminder: true,
    dailyReminderTime: '09:00',
    dueReminders: true,
    achievementNotifications: true,
  })

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      fetchNotificationPrefs()
    }
  }, [profile])

  const fetchNotificationPrefs = async () => {
    if (!user) return

    const { data } = await supabase
      .from('notification_prefs')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const prefs = data as Tables<'notification_prefs'> | null
    if (prefs) {
      setNotificationPrefs({
        dailyReminder: prefs.daily_reminder,
        dailyReminderTime: prefs.daily_reminder_time || '09:00',
        dueReminders: prefs.due_reminders,
        achievementNotifications: prefs.achievement_notifications,
      })
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('users') as any)
      .update({ full_name: fullName })
      .eq('id', user.id)

    setSaving(false)
  }

  const handleSaveNotifications = async () => {
    if (!user) return
    setSaving(true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('notification_prefs') as any)
      .upsert({
        user_id: user.id,
        daily_reminder: notificationPrefs.dailyReminder,
        daily_reminder_time: notificationPrefs.dailyReminderTime,
        due_reminders: notificationPrefs.dueReminders,
        achievement_notifications: notificationPrefs.achievementNotifications,
      })

    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleDeleteAccount = async () => {
    if (!confirm('¿Estás seguro de que querés eliminar tu cuenta? Esta acción no se puede deshacer.')) {
      return
    }

    // In production, this would call an API to delete all user data
    alert('Para eliminar tu cuenta, por favor contactanos a support@cleanhome.ai')
  }

  const handleUpgrade = async () => {
    // In production, this would redirect to Stripe checkout
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
    })

    if (response.ok) {
      const { url } = await response.json()
      window.location.href = url
    } else {
      alert('Error al procesar. Intenta de nuevo.')
    }
  }

  const handleManageBilling = async () => {
    const response = await fetch('/api/stripe/portal', {
      method: 'POST',
    })

    if (response.ok) {
      const { url } = await response.json()
      window.location.href = url
    }
  }

  if (loading) {
    return <Loading fullScreen />
  }

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'account', label: 'Cuenta', icon: User },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    ...(STRIPE_ENABLED ? [{ id: 'billing' as Tab, label: 'Suscripción', icon: CreditCard }] : []),
    { id: 'privacy', label: 'Privacidad', icon: Shield },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <PageHeader title="Configuración" />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2 -mx-4 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === tab.id
                ? 'bg-emerald-100 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Account tab */}
      {activeTab === 'account' && (
        <div className="space-y-4">
          <Card variant="bordered" className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Información personal</h3>
            <div className="space-y-4">
              <Input
                label="Nombre"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Input
                label="Email"
                value={profile?.email || ''}
                disabled
                hint="El email no se puede cambiar"
              />
              <Button onClick={handleSaveProfile} loading={saving}>
                Guardar cambios
              </Button>
            </div>
          </Card>

          <Card variant="bordered" className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Cerrar sesión</h3>
            <p className="text-sm text-gray-500 mb-4">
              Cerrar sesión en este dispositivo
            </p>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </Button>
          </Card>
        </div>
      )}

      {/* Notifications tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <Card variant="bordered" className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Preferencias de notificaciones</h3>
            <div className="space-y-4">
              <Checkbox
                label="Recordatorio diario"
                checked={notificationPrefs.dailyReminder}
                onChange={(e) => setNotificationPrefs({
                  ...notificationPrefs,
                  dailyReminder: e.target.checked,
                })}
              />

              {notificationPrefs.dailyReminder && (
                <div className="ml-7">
                  <Input
                    type="time"
                    label="Hora del recordatorio"
                    value={notificationPrefs.dailyReminderTime}
                    onChange={(e) => setNotificationPrefs({
                      ...notificationPrefs,
                      dailyReminderTime: e.target.value,
                    })}
                  />
                </div>
              )}

              <Checkbox
                label="Recordatorios de tareas vencidas"
                checked={notificationPrefs.dueReminders}
                onChange={(e) => setNotificationPrefs({
                  ...notificationPrefs,
                  dueReminders: e.target.checked,
                })}
              />

              <Checkbox
                label="Notificaciones de logros"
                checked={notificationPrefs.achievementNotifications}
                onChange={(e) => setNotificationPrefs({
                  ...notificationPrefs,
                  achievementNotifications: e.target.checked,
                })}
              />

              <Button onClick={handleSaveNotifications} loading={saving}>
                Guardar preferencias
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Billing tab (only show if Stripe is enabled) */}
      {STRIPE_ENABLED && activeTab === 'billing' && (
        <div className="space-y-4">
          <Card variant="bordered" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Plan actual</h3>
                <p className="text-sm text-gray-500">
                  {profile?.subscription_tier === 'premium' ? 'Premium' : 'Gratuito'}
                </p>
              </div>
              {profile?.subscription_tier === 'premium' ? (
                <Badge variant="success">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              ) : (
                <Badge>Gratis</Badge>
              )}
            </div>

            {profile?.subscription_tier === 'free' && (
              <>
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>{FREE_SCANS_PER_MONTH - (profile?.scans_this_month || 0)}</strong> escaneos restantes este mes
                  </p>
                </div>

                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5" />
                    <span className="font-semibold">Actualiza a Premium</span>
                  </div>
                  <p className="text-emerald-100 text-sm mb-4">
                    Escaneos ilimitados, multi-usuario, analytics avanzados y más.
                  </p>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold">${PREMIUM_MONTHLY_PRICE}</span>
                    <span className="text-emerald-200">/mes</span>
                  </div>
                  <ul className="space-y-2 mb-4 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-200" />
                      Escaneos ilimitados
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-200" />
                      Hasta 10 miembros por hogar
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-200" />
                      Plantillas personalizadas
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-200" />
                      Analytics avanzados
                    </li>
                  </ul>
                  <Button
                    className="w-full bg-white text-emerald-600 hover:bg-emerald-50"
                    onClick={handleUpgrade}
                  >
                    Empezar 7 días gratis
                  </Button>
                </div>
              </>
            )}

            {profile?.subscription_tier === 'premium' && (
              <Button variant="outline" onClick={handleManageBilling}>
                Administrar suscripción
              </Button>
            )}
          </Card>
        </div>
      )}

      {/* Privacy tab */}
      {activeTab === 'privacy' && (
        <div className="space-y-4">
          <Card variant="bordered" className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Tus datos</h3>
            <p className="text-sm text-gray-500 mb-4">
              Tus fotos y datos se almacenan de forma segura. Podés eliminarlos
              en cualquier momento.
            </p>
            <Button variant="outline">
              Descargar mis datos
            </Button>
          </Card>

          <Card variant="bordered" className="p-4 border-red-200">
            <h3 className="font-semibold text-red-600 mb-2">Zona de peligro</h3>
            <p className="text-sm text-gray-500 mb-4">
              Eliminar tu cuenta borrará todos tus datos permanentemente.
              Esta acción no se puede deshacer.
            </p>
            <Button variant="danger" onClick={handleDeleteAccount}>
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar mi cuenta
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<Loading fullScreen text="Cargando..." />}>
      <SettingsContent />
    </Suspense>
  )
}
