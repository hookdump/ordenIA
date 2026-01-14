'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Tables, TaskStatus } from '@/types/database'

export function useTasks(planId?: string) {
  const [tasks, setTasks] = useState<Tables<'tasks'>[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const fetchTasks = useCallback(async () => {
    if (!planId) return

    setLoading(true)
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('plan_id', planId)
      .order('sort_order', { ascending: true })

    const tasksList = (tasksData || []) as Tables<'tasks'>[]
    setTasks(tasksList)
    setLoading(false)
  }, [supabase, planId])

  const updateTaskStatus = async (taskId: string, status: TaskStatus, actualMinutes?: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const updates: Partial<Tables<'tasks'>> = { status }

    if (status === 'in_progress') {
      updates.started_at = new Date().toISOString()
    } else if (status === 'completed') {
      updates.completed_at = new Date().toISOString()
      if (actualMinutes !== undefined) {
        updates.actual_minutes = actualMinutes
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: taskData, error } = await (supabase
      .from('tasks') as any)
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()

    if (error) throw error
    const task = taskData as Tables<'tasks'>

    // Log event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('task_events') as any)
      .insert({
        task_id: taskId,
        user_id: user.id,
        event_type: status,
        metadata: { actual_minutes: actualMinutes },
      })

    setTasks(prev => prev.map(t => t.id === taskId ? task : t))
    return task
  }

  const assignTask = async (taskId: string, assigneeId: string | null) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: taskData, error } = await (supabase
      .from('tasks') as any)
      .update({ assignee_id: assigneeId })
      .eq('id', taskId)
      .select()
      .single()

    if (error) throw error
    const task = taskData as Tables<'tasks'>

    setTasks(prev => prev.map(t => t.id === taskId ? task : t))
    return task
  }

  const updateTask = async (taskId: string, updates: Partial<Tables<'tasks'>>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: taskData, error } = await (supabase
      .from('tasks') as any)
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()

    if (error) throw error
    const task = taskData as Tables<'tasks'>

    setTasks(prev => prev.map(t => t.id === taskId ? task : t))
    return task
  }

  const deleteTask = async (taskId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('tasks') as any)
      .delete()
      .eq('id', taskId)

    if (error) throw error

    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  const completedCount = tasks.filter(t => t.status === 'completed').length
  const totalMinutes = tasks.reduce((acc, t) => acc + t.estimated_minutes, 0)
  const completedMinutes = tasks
    .filter(t => t.status === 'completed')
    .reduce((acc, t) => acc + (t.actual_minutes || t.estimated_minutes), 0)

  return {
    tasks,
    loading,
    fetchTasks,
    updateTaskStatus,
    assignTask,
    updateTask,
    deleteTask,
    completedCount,
    totalCount: tasks.length,
    totalMinutes,
    completedMinutes,
    progress: tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0,
  }
}
