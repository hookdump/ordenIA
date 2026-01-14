'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Trophy, Flame, Clock, CheckCircle, TrendingUp, Award } from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import { Loading } from '@/components/ui/loading'
import { PageHeader } from '@/components/layout/page-header'
import { createClient } from '@/lib/supabase/client'
import { useHome } from '@/hooks/use-home'
import { useStats } from '@/hooks/use-stats'
import { formatMinutes, pluralize, cn } from '@/lib/utils'
import { BADGE_DEFINITIONS } from '@/types'

export default function ProgressPage() {
  const { currentHome } = useHome()
  const { stats, badges, dailyStats, loading } = useStats(currentHome?.id)
  const supabase = createClient()

  const [weeklyData, setWeeklyData] = useState<{ day: string; tasks: number; minutes: number }[]>([])
  const [allBadges, setAllBadges] = useState<typeof BADGE_DEFINITIONS[number][]>([])

  useEffect(() => {
    if (dailyStats.length > 0) {
      // Group by day of week
      const last7Days = getLastNDays(7)
      const data = last7Days.map(date => {
        const dayData = dailyStats.find(d => d.date === date)
        return {
          day: formatDayShort(date),
          tasks: dayData?.tasks_completed || 0,
          minutes: dayData?.minutes_cleaned || 0,
        }
      })
      setWeeklyData(data)
    }

    fetchAllBadges()
  }, [dailyStats])

  const fetchAllBadges = async () => {
    const { data } = await supabase.from('badges').select('*')
    if (data) {
      setAllBadges(data as unknown as typeof BADGE_DEFINITIONS[number][])
    }
  }

  const earnedBadgeIds = badges.map(b => b.badge_id)

  if (loading) {
    return <Loading fullScreen text="Cargando progreso..." />
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <PageHeader title="Tu progreso" subtitle="Estadísticas y logros" />

      {/* Stats overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={CheckCircle}
          value={stats?.total_tasks_completed || 0}
          label="Tareas totales"
          color="emerald"
        />
        <StatCard
          icon={Clock}
          value={formatMinutes(stats?.total_minutes_cleaned || 0)}
          label="Tiempo total"
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

      {/* Weekly chart */}
      <Card variant="bordered" className="p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Esta semana</h3>
          <Badge variant="info">
            {weeklyData.reduce((a, b) => a + b.tasks, 0)} tareas
          </Badge>
        </div>

        {weeklyData.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(value) => [`${value ?? 0} tareas`, '']}
                />
                <Bar dataKey="tasks" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400">
            No hay datos aún
          </div>
        )}
      </Card>

      {/* Time trend */}
      <Card variant="bordered" className="p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Minutos por día</h3>
          <TrendingUp className="w-5 h-5 text-gray-400" />
        </div>

        {weeklyData.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(value) => [`${value ?? 0} min`, '']}
                />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400">
            No hay datos aún
          </div>
        )}
      </Card>

      {/* Badges */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Insignias</h3>
          <span className="text-sm text-gray-500">
            {earnedBadgeIds.length} de {allBadges.length}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {allBadges.map((badge) => {
            const earned = earnedBadgeIds.includes(badge.id)

            return (
              <div
                key={badge.id}
                className={cn(
                  'p-3 rounded-xl text-center transition-all',
                  earned
                    ? 'bg-emerald-50 border-2 border-emerald-200'
                    : 'bg-gray-50 border-2 border-gray-100 opacity-50'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2',
                  earned ? 'bg-emerald-100' : 'bg-gray-200'
                )}>
                  <Award className={cn(
                    'w-5 h-5',
                    earned ? 'text-emerald-600' : 'text-gray-400'
                  )} />
                </div>
                <p className={cn(
                  'text-xs font-medium',
                  earned ? 'text-gray-900' : 'text-gray-400'
                )}>
                  {badge.name}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Achievement list */}
      <Card variant="bordered">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Próximos logros</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {allBadges
            .filter(b => !earnedBadgeIds.includes(b.id))
            .slice(0, 5)
            .map((badge) => (
              <div key={badge.id} className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Award className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{badge.name}</p>
                  <p className="text-sm text-gray-500">{badge.description}</p>
                </div>
              </div>
            ))}
        </div>
      </Card>
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

function getLastNDays(n: number): string[] {
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push(date.toISOString().split('T')[0])
  }
  return days
}

function formatDayShort(dateStr: string): string {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const date = new Date(dateStr + 'T00:00:00')
  return days[date.getDay()]
}
