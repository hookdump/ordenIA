'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Circle, Clock, ChevronRight, Filter, Play, SkipForward, Pause, Trophy } from 'lucide-react'
import { Button, Card, Badge, Progress, Modal } from '@/components/ui'
import { Loading } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/layout/page-header'
import { createClient } from '@/lib/supabase/client'
import { useHome } from '@/hooks/use-home'
import { useTasks } from '@/hooks/use-tasks'
import { formatMinutes, getCategoryColor, getDifficultyColor, cn } from '@/lib/utils'
import { CATEGORY_INFO, DIFFICULTY_LABELS } from '@/types/ai'
import type { Tables, TaskStatus, TaskCategory } from '@/types/database'

function TasksContent() {
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan')
  const { currentHome } = useHome()
  const supabase = createClient()

  const [plans, setPlans] = useState<Tables<'plans'>[]>([])
  const [selectedPlan, setSelectedPlan] = useState<Tables<'plans'> | null>(null)
  const [loading, setLoading] = useState(true)
  const [executionMode, setExecutionMode] = useState(false)
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [taskStartTime, setTaskStartTime] = useState<Date | null>(null)
  const [showCompletionModal, setShowCompletionModal] = useState(false)

  const {
    tasks,
    fetchTasks,
    updateTaskStatus,
    completedCount,
    totalCount,
    progress,
    totalMinutes,
    completedMinutes,
  } = useTasks(selectedPlan?.id)

  useEffect(() => {
    if (currentHome) {
      fetchPlans()
    }
  }, [currentHome])

  useEffect(() => {
    if (selectedPlan) {
      fetchTasks()
    }
  }, [selectedPlan, fetchTasks])

  const fetchPlans = async () => {
    if (!currentHome) return

    const { data: activePlans } = await supabase
      .from('plans')
      .select('*')
      .eq('home_id', currentHome.id)
      .in('status', ['active', 'draft'])
      .order('created_at', { ascending: false })

    const plansList = (activePlans || []) as Tables<'plans'>[]
    if (plansList.length > 0) {
      setPlans(plansList)

      if (planId) {
        const plan = plansList.find(p => p.id === planId)
        if (plan) setSelectedPlan(plan)
      } else if (plansList.length > 0) {
        setSelectedPlan(plansList[0])
      }
    }

    setLoading(false)
  }

  const handleStartExecution = () => {
    setExecutionMode(true)
    setCurrentTaskIndex(tasks.findIndex(t => t.status === 'pending'))
  }

  const handleCompleteTask = async () => {
    const task = tasks[currentTaskIndex]
    if (!task) return

    const actualMinutes = taskStartTime
      ? Math.round((Date.now() - taskStartTime.getTime()) / 60000)
      : task.estimated_minutes

    await updateTaskStatus(task.id, 'completed', actualMinutes)

    // Move to next task
    const nextPendingIndex = tasks.findIndex((t, i) => i > currentTaskIndex && t.status === 'pending')

    if (nextPendingIndex === -1) {
      // All tasks done
      setExecutionMode(false)
      setShowCompletionModal(true)

      // Update plan status
      if (selectedPlan) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('plans') as any)
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            total_actual_minutes: completedMinutes + actualMinutes,
          })
          .eq('id', selectedPlan.id)
      }
    } else {
      setCurrentTaskIndex(nextPendingIndex)
      setTaskStartTime(new Date())
    }
  }

  const handleSkipTask = async () => {
    const task = tasks[currentTaskIndex]
    if (!task) return

    await updateTaskStatus(task.id, 'skipped')

    const nextPendingIndex = tasks.findIndex((t, i) => i > currentTaskIndex && t.status === 'pending')

    if (nextPendingIndex === -1) {
      setExecutionMode(false)
    } else {
      setCurrentTaskIndex(nextPendingIndex)
    }
  }

  if (loading) {
    return <Loading fullScreen text="Cargando tareas..." />
  }

  if (plans.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <PageHeader title="Tareas" />
        <EmptyState
          icon={CheckCircle}
          title="No hay planes activos"
          description="Crea un nuevo plan de limpieza escaneando una habitación"
          action={
            <Link href="/scan">
              <Button>Nueva evaluación</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (executionMode && tasks[currentTaskIndex]) {
    const task = tasks[currentTaskIndex]

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setExecutionMode(false)}
              className="text-sm text-gray-500"
            >
              Salir
            </button>
            <span className="text-sm text-gray-500">
              {currentTaskIndex + 1} de {tasks.length}
            </span>
          </div>
          <Progress value={completedCount} max={totalCount} />
        </div>

        {/* Task content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-lg mx-auto">
            <div className="mb-6">
              <Badge className={getCategoryColor(task.category)}>
                {CATEGORY_INFO[task.category as TaskCategory]?.label || task.category}
              </Badge>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h1>

            <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {task.estimated_minutes} min
              </div>
              <Badge size="sm" className={getDifficultyColor(task.difficulty)}>
                {DIFFICULTY_LABELS[task.difficulty]}
              </Badge>
            </div>

            {task.description_steps.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Pasos:</h3>
                <ol className="space-y-3">
                  {task.description_steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {task.supplies.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Materiales:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {task.supplies.map((supply, i) => (
                    <li key={i}>• {supply}</li>
                  ))}
                </ul>
              </div>
            )}

            {task.safety_notes.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-2">Precauciones:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {task.safety_notes.map((note, i) => (
                    <li key={i}>⚠️ {note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 bg-white safe-area-bottom">
          <div className="max-w-lg mx-auto flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSkipTask}
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Omitir
            </Button>
            <Button
              className="flex-1"
              onClick={handleCompleteTask}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Hecho
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <PageHeader
        title="Tareas"
        subtitle={selectedPlan?.name}
        action={
          tasks.some(t => t.status === 'pending') && (
            <Button onClick={handleStartExecution}>
              <Play className="w-4 h-4 mr-2" />
              Ejecutar
            </Button>
          )
        }
      />

      {/* Plan selector */}
      {plans.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 -mx-4 px-4">
          {plans.map(plan => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                selectedPlan?.id === plan.id
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {plan.name}
            </button>
          ))}
        </div>
      )}

      {/* Progress */}
      {selectedPlan && (
        <Card variant="bordered" className="p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Progreso</span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <Progress value={progress} />
          <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
            <span>{completedCount} de {totalCount} tareas</span>
            <span>{formatMinutes(completedMinutes)} de {formatMinutes(totalMinutes)}</span>
          </div>
        </Card>
      )}

      {/* Tasks list */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={() => updateTaskStatus(task.id, 'completed')}
            onStart={() => updateTaskStatus(task.id, 'in_progress')}
          />
        ))}
      </div>

      {/* Completion modal */}
      <Modal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        title="¡Felicitaciones!"
      >
        <div className="text-center py-4">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">¡Plan completado!</h3>
          <p className="text-gray-500 mb-6">
            Completaste {completedCount} tareas en {formatMinutes(completedMinutes)}.
          </p>
          <div className="flex gap-3">
            <Link href="/progress" className="flex-1">
              <Button variant="outline" className="w-full">Ver progreso</Button>
            </Link>
            <Link href="/scan" className="flex-1">
              <Button className="w-full">Nueva evaluación</Button>
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function TaskCard({
  task,
  onComplete,
  onStart,
}: {
  task: Tables<'tasks'>
  onComplete: () => void
  onStart: () => void
}) {
  const isCompleted = task.status === 'completed'
  const isSkipped = task.status === 'skipped'

  return (
    <Card
      variant="bordered"
      className={cn(
        'p-4 transition-opacity',
        (isCompleted || isSkipped) && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={isCompleted ? undefined : onComplete}
          className={cn(
            'mt-0.5 flex-shrink-0 transition-colors',
            isCompleted ? 'text-emerald-600' : 'text-gray-300 hover:text-emerald-500'
          )}
          disabled={isCompleted}
        >
          {isCompleted ? (
            <CheckCircle className="w-6 h-6" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              'font-medium',
              isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'
            )}>
              {task.title}
            </h4>
            <Badge size="sm" className={getCategoryColor(task.category)}>
              {CATEGORY_INFO[task.category as TaskCategory]?.label || task.category}
            </Badge>
          </div>

          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {task.estimated_minutes} min
            </span>
            <Badge size="sm" className={getDifficultyColor(task.difficulty)}>
              {DIFFICULTY_LABELS[task.difficulty]}
            </Badge>
          </div>

          {task.description_steps.length > 0 && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-1">
              {task.description_steps[0]}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function TasksPage() {
  return (
    <Suspense fallback={<Loading fullScreen text="Cargando..." />}>
      <TasksContent />
    </Suspense>
  )
}
