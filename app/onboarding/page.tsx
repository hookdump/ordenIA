'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Home, ChevronRight, ChevronLeft, Plus, X, Bell, Check } from 'lucide-react'
import { Button, Input, Checkbox, Card } from '@/components/ui'
import { Loading } from '@/components/ui/loading'
import { createClient } from '@/lib/supabase/client'
import { ROOM_TYPES, SENSITIVITY_TAGS, RESTRICTIONS } from '@/types'
import { ONBOARDING_STEPS, DEFAULT_ROOMS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/database'

type Step = 'home' | 'rooms' | 'preferences' | 'notifications'

interface RoomToCreate {
  name: string
  type: string
  icon: string
  sensitivityTags: string[]
}

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('home')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Step 1: Home
  const [homeName, setHomeName] = useState('Mi hogar')

  // Step 2: Rooms
  const [rooms, setRooms] = useState<RoomToCreate[]>(
    DEFAULT_ROOMS.map(r => ({ ...r, sensitivityTags: [] }))
  )
  const [customRoomName, setCustomRoomName] = useState('')
  const [showAddRoom, setShowAddRoom] = useState(false)

  // Step 3: Preferences
  const [detailLevel, setDetailLevel] = useState<'brief' | 'normal' | 'detailed'>('normal')
  const [cleaningStandard, setCleaningStandard] = useState<'quick' | 'deep'>('quick')
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([])
  const [minutesPerDay, setMinutesPerDay] = useState(30)

  // Step 4: Notifications
  const [enableNotifications, setEnableNotifications] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Check if already onboarded
    const { data: membership } = await supabase
      .from('home_members')
      .select('home_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (membership) {
      router.push('/dashboard')
      return
    }

    setLoading(false)
  }

  const handleAddRoom = () => {
    if (!customRoomName.trim()) return

    setRooms([...rooms, {
      name: customRoomName.trim(),
      type: 'custom',
      icon: 'Box',
      sensitivityTags: [],
    }])
    setCustomRoomName('')
    setShowAddRoom(false)
  }

  const handleRemoveRoom = (index: number) => {
    setRooms(rooms.filter((_, i) => i !== index))
  }

  const handleToggleSensitivity = (roomIndex: number, tag: string) => {
    setRooms(rooms.map((room, i) => {
      if (i !== roomIndex) return room
      const tags = room.sensitivityTags.includes(tag)
        ? room.sensitivityTags.filter(t => t !== tag)
        : [...room.sensitivityTags, tag]
      return { ...room, sensitivityTags: tags }
    }))
  }

  const handleComplete = async () => {
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')

      // Create home
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: homeData, error: homeError } = await (supabase
        .from('homes') as any)
        .insert({ name: homeName, owner_id: user.id })
        .select()
        .single()

      if (homeError) throw homeError
      const home = homeData as Tables<'homes'>

      // Add owner as member
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('home_members') as any).insert({
        home_id: home.id,
        user_id: user.id,
        role: 'owner',
        joined_at: new Date().toISOString(),
      })

      // Create rooms
      const roomInserts = rooms.map((room, index) => ({
        home_id: home.id,
        name: room.name,
        type: room.type,
        icon: room.icon,
        sensitivity_tags: room.sensitivityTags,
        sort_order: index,
      }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('rooms') as any).insert(roomInserts)

      // Create preferences
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('user_preferences') as any).insert({
        user_id: user.id,
        home_id: home.id,
        detail_level: detailLevel,
        cleaning_standard: cleaningStandard,
        restrictions: selectedRestrictions,
        minutes_per_day: minutesPerDay,
      })

      // Create user stats
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('user_stats') as any).insert({
        user_id: user.id,
        home_id: home.id,
      })

      // Create notification prefs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('notification_prefs') as any).insert({
        user_id: user.id,
        daily_reminder: enableNotifications,
      })

      // Request notification permission if enabled
      if (enableNotifications && 'Notification' in window) {
        await Notification.requestPermission()
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      alert('Error al guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const steps: Step[] = ['home', 'rooms', 'preferences', 'notifications']
  const currentIndex = steps.indexOf(step)

  const nextStep = () => {
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1])
    }
  }

  const prevStep = () => {
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1])
    }
  }

  if (loading) {
    return <Loading fullScreen text="Cargando..." />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {ONBOARDING_STEPS.map((s, i) => (
              <div
                key={s.id}
                className={cn(
                  'flex items-center',
                  i < ONBOARDING_STEPS.length - 1 && 'flex-1'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    i < currentIndex
                      ? 'bg-emerald-600 text-white'
                      : i === currentIndex
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  )}
                >
                  {i < currentIndex ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < ONBOARDING_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'h-1 flex-1 mx-2',
                      i < currentIndex ? 'bg-emerald-600' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="font-semibold text-gray-900">{ONBOARDING_STEPS[currentIndex].title}</h2>
            <p className="text-sm text-gray-500">{ONBOARDING_STEPS[currentIndex].description}</p>
          </div>
        </div>

        {/* Step content */}
        <Card variant="bordered" className="p-6">
          {step === 'home' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <Home className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">¿Cómo se llama tu hogar?</h3>
                <p className="text-sm text-gray-500">Puede ser &quot;Mi casa&quot;, &quot;Depto&quot;, o cualquier nombre que quieras.</p>
              </div>
              <Input
                value={homeName}
                onChange={(e) => setHomeName(e.target.value)}
                placeholder="Mi hogar"
                className="text-center text-lg"
              />
            </div>
          )}

          {step === 'rooms' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">¿Qué habitaciones tiene?</h3>
                <p className="text-sm text-gray-500">Selecciona las habitaciones que vas a limpiar.</p>
              </div>

              <div className="space-y-2">
                {rooms.map((room, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Home className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="font-medium text-gray-900">{room.name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveRoom(index)}
                      className="p-1 rounded hover:bg-gray-200"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>

              {showAddRoom ? (
                <div className="flex gap-2">
                  <Input
                    value={customRoomName}
                    onChange={(e) => setCustomRoomName(e.target.value)}
                    placeholder="Nombre de la habitación"
                    autoFocus
                  />
                  <Button onClick={handleAddRoom}>Agregar</Button>
                  <Button variant="ghost" onClick={() => setShowAddRoom(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAddRoom(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar habitación
                </Button>
              )}
            </div>
          )}

          {step === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Nivel de detalle en las tareas</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'brief', label: 'Breve' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'detailed', label: 'Detallado' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDetailLevel(option.value as typeof detailLevel)}
                      className={cn(
                        'p-3 rounded-lg border text-sm font-medium transition-colors',
                        detailLevel === option.value
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Tipo de limpieza preferida</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCleaningStandard('quick')}
                    className={cn(
                      'p-4 rounded-lg border text-left transition-colors',
                      cleaningStandard === 'quick'
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="font-medium text-gray-900">Rápida</div>
                    <div className="text-sm text-gray-500">Lo esencial, menos tiempo</div>
                  </button>
                  <button
                    onClick={() => setCleaningStandard('deep')}
                    className={cn(
                      'p-4 rounded-lg border text-left transition-colors',
                      cleaningStandard === 'deep'
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="font-medium text-gray-900">Profunda</div>
                    <div className="text-sm text-gray-500">Más completa y detallada</div>
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">¿Minutos disponibles por día?</h4>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={10}
                    max={120}
                    step={10}
                    value={minutesPerDay}
                    onChange={(e) => setMinutesPerDay(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="font-medium text-gray-900 w-16 text-right">{minutesPerDay} min</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Restricciones (opcional)</h4>
                <div className="space-y-2">
                  {RESTRICTIONS.map((r) => (
                    <Checkbox
                      key={r.id}
                      label={r.label}
                      checked={selectedRestrictions.includes(r.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRestrictions([...selectedRestrictions, r.id])
                        } else {
                          setSelectedRestrictions(selectedRestrictions.filter(id => id !== r.id))
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'notifications' && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
                <Bell className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">¿Activar recordatorios?</h3>
                <p className="text-sm text-gray-500">
                  Te enviaremos recordatorios útiles para mantener tu rutina de limpieza.
                  Podés configurarlos después.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant={enableNotifications ? 'primary' : 'outline'}
                  onClick={() => setEnableNotifications(true)}
                >
                  Sí, activar recordatorios
                </Button>
                <Button
                  variant={!enableNotifications ? 'primary' : 'outline'}
                  onClick={() => setEnableNotifications(false)}
                >
                  No, gracias
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>

          {currentIndex === steps.length - 1 ? (
            <Button onClick={handleComplete} loading={saving}>
              Comenzar
            </Button>
          ) : (
            <Button onClick={nextStep}>
              Siguiente
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
