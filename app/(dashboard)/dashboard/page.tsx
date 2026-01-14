'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Camera, CheckSquare, TrendingUp, Clock, Flame, Trophy, Plus, ChevronRight } from 'lucide-react'
import { Button, Card, Badge, Progress } from '@/components/ui'
import { Loading } from '@/components/ui/loading'
import { createClient } from '@/lib/supabase/client'
import { useHome } from '@/hooks/use-home'
import { getGreeting, formatMinutes, pluralize } from '@/lib/utils'
import { STRIPE_ENABLED } from '@/lib/constants'
import type { Tables } from '@/types/database'

export default function DashboardPage() {
  const { currentHome, rooms, loading: homeLoading } = useHome()
  const [user, setUser] = useState<Tables<'users'> | null>(null)
  const [stats, setStats] = useState<Tables<'user_stats'> | null>(null)
  const [activePlan, setActivePlan] = useState<Tables<'plans'> | null>(null)
  const [pendingTasks, setPendingTasks] = useState(0)
  const [quickWins, setQuickWins] = useState<Tables<'tasks'>[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!homeLoading && currentHome) {
      fetchData()
    }
  }, [homeLoading, currentHome])

  const fetchData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser || !currentHome) return

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    setUser(profile)

    // Get stats
    const { data: userStats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', authUser.id)
      .eq('home_id', currentHome.id)
      .single()

    setStats(userStats)

    // Get active plan
    const { data: plans } = await supabase
      .from('plans')
      .select('*')
      .eq('home_id', currentHome.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    if (plans && plans.length > 0) {
      const activePlanData = plans[0] as Tables<'plans'>
      setActivePlan(activePlanData)

      // Get pending tasks count
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('plan_id', activePlanData.id)
        .eq('status', 'pending')

      setPendingTasks(count || 0)
    }

    // Get quick win suggestions (from recent uncompleted tasks)
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'pending')
      .lte('estimated_minutes', 5)
      .order('priority', { ascending: true })
      .limit(3)

    setQuickWins(tasks || [])

    setLoading(false)
  }

  if (loading || homeLoading) {
    return <Loading fullScreen text="Cargando..." />
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {user?.full_name?.split(' ')[0] || 'amigo'}
        </h1>
        <p className="text-gray-500">
          {currentHome?.name || 'Tu hogar'}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={CheckSquare}
          value={stats?.total_tasks_completed || 0}
          label="Tareas completadas"
          color="emerald"
        />
        <StatCard
          icon={Clock}
          value={formatMinutes(stats?.total_minutes_cleaned || 0)}
          label="Tiempo limpiando"
          color="blue"
        />
        <StatCard
          icon={Flame}
          value={stats?.current_streak || 0}
          label={pluralize(stats?.current_streak || 0, 'día de racha', 'días de racha')}
          color="orange"
        />
        <StatCard
          icon={Trophy}
          value={stats?.longest_streak || 0}
          label="Mejor racha"
          color="purple"
        />
      </div>

      {/* Active plan or CTA */}
      {activePlan ? (
        <Card variant="bordered" className="mb-6 overflow-hidden">
          <div className="p-4 bg-emerald-50 border-b border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-emerald-900">{activePlan.name}</h3>
                <p className="text-sm text-emerald-700">
                  {pendingTasks} {pluralize(pendingTasks, 'tarea pendiente', 'tareas pendientes')}
                </p>
              </div>
              <Link href={`/tasks?plan=${activePlan.id}`}>
                <Button size="sm">
                  Continuar
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="p-4">
            <Progress
              value={activePlan.total_estimated_minutes - (pendingTasks * 5)}
              max={activePlan.total_estimated_minutes}
              showLabel
            />
          </div>
        </Card>
      ) : (
        <Card variant="bordered" className="mb-6 p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">¿Listo para limpiar?</h3>
          <p className="text-sm text-gray-500 mb-4">
            Saca una foto de cualquier habitación y te generamos un plan de limpieza personalizado.
          </p>
          <Link href="/scan">
            <Button>
              <Camera className="w-4 h-4 mr-2" />
              Nueva evaluación
            </Button>
          </Link>
        </Card>
      )}

      {/* Quick wins */}
      {quickWins.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Quick wins</h2>
            <Badge variant="info">2-5 min cada una</Badge>
          </div>
          <div className="space-y-2">
            {quickWins.map((task) => (
              <Card key={task.id} variant="bordered" className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                      <p className="text-xs text-gray-500">{task.estimated_minutes} min</p>
                    </div>
                  </div>
                  <Link href={`/tasks?task=${task.id}`}>
                    <Button size="sm" variant="ghost">
                      Hacer
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Rooms */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Habitaciones</h2>
          <Link href="/rooms" className="text-sm text-emerald-600 font-medium">
            Ver todas
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {rooms.slice(0, 4).map((room) => (
            <Link key={room.id} href={`/scan?room=${room.id}`}>
              <Card variant="bordered" className="p-4 text-center hover:border-emerald-300 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-2">
                  <Camera className="w-5 h-5 text-gray-600" />
                </div>
                <p className="font-medium text-gray-900 text-sm">{room.name}</p>
              </Card>
            </Link>
          ))}
          {rooms.length < 4 && (
            <Link href="/rooms">
              <Card variant="bordered" className="p-4 text-center hover:border-emerald-300 transition-colors h-full flex flex-col items-center justify-center">
                <Plus className="w-6 h-6 text-gray-400 mb-1" />
                <p className="text-sm text-gray-500">Agregar</p>
              </Card>
            </Link>
          )}
        </div>
      </div>

      {/* Subscription banner for free users (only show if Stripe is enabled) */}
      {STRIPE_ENABLED && user?.subscription_tier === 'free' && (
        <Card className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Actualiza a Premium</h3>
              <p className="text-sm text-emerald-100">
                Escaneos ilimitados, multi-usuario y más.
              </p>
            </div>
            <Link href="/settings?tab=billing">
              <Button className="bg-white text-emerald-600 hover:bg-emerald-50">
                Ver planes
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: number | string
  label: string
  color: 'emerald' | 'blue' | 'orange' | 'purple'
}) {
  const colors = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
  }

  return (
    <Card variant="bordered" className="p-3">
      <div className={`w-8 h-8 rounded-lg ${colors[color]} flex items-center justify-center mb-2`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </Card>
  )
}
