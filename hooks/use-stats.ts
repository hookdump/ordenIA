'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types/database'

interface DailyStats {
  date: string
  tasks_completed: number
  minutes_cleaned: number
}

export function useStats(homeId?: string) {
  const [stats, setStats] = useState<Tables<'user_stats'> | null>(null)
  const [badges, setBadges] = useState<Tables<'user_badges'>[]>([])
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchStats = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !homeId) return

    setLoading(true)

    // Get user stats
    const { data: statsData } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('home_id', homeId)
      .single()

    const userStats = statsData as Tables<'user_stats'> | null
    if (userStats) {
      setStats(userStats)
    }

    // Get badges
    const { data: badgesData } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', user.id)

    const userBadges = (badgesData || []) as Tables<'user_badges'>[]
    setBadges(userBadges)

    // Get daily stats for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: eventsData } = await supabase
      .from('task_events')
      .select('created_at, metadata')
      .eq('user_id', user.id)
      .eq('event_type', 'completed')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    const events = (eventsData || []) as Pick<Tables<'task_events'>, 'created_at' | 'metadata'>[]
    if (events.length > 0) {
      // Group by date
      const dailyMap = new Map<string, DailyStats>()

      events.forEach(event => {
        const date = new Date(event.created_at).toISOString().split('T')[0]
        const existing = dailyMap.get(date) || { date, tasks_completed: 0, minutes_cleaned: 0 }
        existing.tasks_completed += 1
        existing.minutes_cleaned += (event.metadata as { actual_minutes?: number })?.actual_minutes || 0
        dailyMap.set(date, existing)
      })

      setDailyStats(Array.from(dailyMap.values()))
    }

    setLoading(false)
  }, [supabase, homeId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const updateStreak = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !homeId || !stats) return

    const today = new Date().toISOString().split('T')[0]
    const lastActivity = stats.last_activity_date

    let newStreak = stats.current_streak

    if (!lastActivity) {
      newStreak = 1
    } else {
      const lastDate = new Date(lastActivity)
      const todayDate = new Date(today)
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        // Same day, no change
        return
      } else if (diffDays === 1) {
        // Consecutive day
        newStreak = stats.current_streak + 1
      } else {
        // Streak broken
        newStreak = 1
      }
    }

    const longestStreak = Math.max(stats.longest_streak, newStreak)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('user_stats') as any)
      .update({
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_activity_date: today,
      })
      .eq('id', stats.id)

    setStats(prev => prev ? {
      ...prev,
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_activity_date: today,
    } : null)
  }

  const incrementStats = async (tasksCompleted: number, minutesCleaned: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !homeId || !stats) return

    const newTotalTasks = stats.total_tasks_completed + tasksCompleted
    const newTotalMinutes = stats.total_minutes_cleaned + minutesCleaned

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('user_stats') as any)
      .update({
        total_tasks_completed: newTotalTasks,
        total_minutes_cleaned: newTotalMinutes,
      })
      .eq('id', stats.id)

    setStats(prev => prev ? {
      ...prev,
      total_tasks_completed: newTotalTasks,
      total_minutes_cleaned: newTotalMinutes,
    } : null)

    // Update streak
    await updateStreak()
  }

  return {
    stats,
    badges,
    dailyStats,
    loading,
    fetchStats,
    incrementStats,
    updateStreak,
  }
}
