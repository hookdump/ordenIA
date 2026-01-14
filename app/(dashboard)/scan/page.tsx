'use client'

import { Suspense, useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Camera, Upload, X, Loader2, AlertCircle, ChevronDown, Sparkles, CheckCircle } from 'lucide-react'
import { Button, Card, Select, Badge } from '@/components/ui'
import { Loading } from '@/components/ui/loading'
import { PageHeader } from '@/components/layout/page-header'
import { createClient } from '@/lib/supabase/client'
import { useHome } from '@/hooks/use-home'
import { compressImage, fileToBase64 } from '@/lib/utils'
import { FREE_SCANS_PER_MONTH, STRIPE_ENABLED } from '@/lib/constants'
import type { AIResponse } from '@/types/ai'
import type { Tables } from '@/types/database'

type Stage = 'capture' | 'analyzing' | 'results'

function ScanContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedRoom = searchParams.get('room')
  const { rooms, currentHome } = useHome()
  const supabase = createClient()

  const [stage, setStage] = useState<Stage>('capture')
  const [selectedRoom, setSelectedRoom] = useState<string>(preselectedRoom || '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null)
  const [user, setUser] = useState<Tables<'users'> | null>(null)
  const [savingPlan, setSavingPlan] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchUser()
    if (preselectedRoom) {
      setSelectedRoom(preselectedRoom)
    }
  }, [preselectedRoom])

  const fetchUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()
      setUser(data)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen')
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen es muy grande. Máximo 10MB.')
      return
    }

    // Compress image
    try {
      const compressed = await compressImage(file)
      const compressedFile = new File([compressed], file.name, { type: 'image/jpeg' })
      setImageFile(compressedFile)

      // Create preview
      const reader = new FileReader()
      reader.onload = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(compressedFile)
    } catch (err) {
      setError('Error al procesar la imagen')
    }
  }

  const handleClearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const handleAnalyze = async () => {
    if (!imageFile || !currentHome || !user) {
      setError('Selecciona una imagen primero')
      return
    }

    // Check scan limits for free users (only if Stripe is enabled)
    if (STRIPE_ENABLED && user?.subscription_tier === 'free') {
      if (user.scans_this_month >= FREE_SCANS_PER_MONTH) {
        setError(`Has alcanzado el límite de ${FREE_SCANS_PER_MONTH} escaneos este mes. Actualiza a Premium para escaneos ilimitados.`)
        return
      }
    }

    setStage('analyzing')
    setError(null)

    try {
      const base64 = await fileToBase64(imageFile)
      const room = rooms.find(r => r.id === selectedRoom)

      // Get user preferences
      const { data: preferencesData } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('home_id', currentHome.id)
        .single()

      const preferences = preferencesData as Tables<'user_preferences'> | null

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          selectedRoom: room?.name || null,
          roomType: room?.type || null,
          preferences: {
            detailLevel: preferences?.detail_level || 'normal',
            cleaningStandard: preferences?.cleaning_standard || 'quick',
            restrictions: preferences?.restrictions || [],
            sensitivityTags: room?.sensitivity_tags || [],
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al analizar la imagen')
      }

      const data: AIResponse = await response.json()
      setAiResponse(data)
      setStage('results')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al analizar'
      setError(message)
      setStage('capture')
    }
  }

  const handleSavePlan = async () => {
    if (!aiResponse || !currentHome || !user) return

    setSavingPlan(true)

    try {
      const room = rooms.find(r => r.id === selectedRoom) || rooms[0]

      // Upload image to storage
      let imageUrl: string | null = null
      if (imageFile) {
        const fileName = `${user.id}/${Date.now()}.jpg`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('room-scans')
          .upload(fileName, imageFile)

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('room-scans')
            .getPublicUrl(fileName)
          imageUrl = publicUrl
        }
      }

      // Create scan record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: scanData, error: scanError } = await (supabase
        .from('scans') as any)
        .insert({
          room_id: room.id,
          user_id: user.id,
          image_url: imageUrl,
          ai_model: 'gpt-4o',
          ai_raw_json: aiResponse as unknown as Record<string, unknown>,
          score_before: aiResponse.before_score,
        })
        .select()
        .single()

      if (scanError) throw scanError
      const scan = scanData as Tables<'scans'>

      // Create plan
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: planData, error: planError } = await (supabase
        .from('plans') as any)
        .insert({
          scan_id: scan.id,
          room_id: room.id,
          home_id: currentHome.id,
          user_id: user.id,
          name: `Plan de limpieza - ${room.name}`,
          status: 'active',
          total_estimated_minutes: aiResponse.total_estimated_minutes,
        })
        .select()
        .single()

      if (planError) throw planError
      const plan = planData as Tables<'plans'>

      // Create tasks
      const taskInserts = aiResponse.tasks.map((task, index) => ({
        plan_id: plan.id,
        room_id: room.id,
        title: task.title,
        description_steps: task.description_steps,
        category: task.category,
        priority: task.priority,
        estimated_minutes: task.estimated_minutes,
        difficulty: task.difficulty,
        supplies: task.supplies,
        safety_notes: task.safety_notes,
        sort_order: index,
      }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('tasks') as any).insert(taskInserts)

      // Increment scan count for free users
      if (user.subscription_tier === 'free') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase
          .from('users') as any)
          .update({ scans_this_month: user.scans_this_month + 1 })
          .eq('id', user.id)
      }

      // Navigate to tasks page
      router.push(`/tasks?plan=${plan.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar'
      setError(message)
    } finally {
      setSavingPlan(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <PageHeader
        title="Nueva evaluación"
        subtitle="Saca una foto para generar tu plan"
        backHref="/dashboard"
      />

      {stage === 'capture' && (
        <div className="space-y-4">
          {/* Room selector */}
          <Card variant="bordered" className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Habitación (opcional)
            </label>
            <Select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              options={[
                { value: '', label: 'Auto-detectar' },
                ...rooms.map(r => ({ value: r.id, label: r.name })),
              ]}
            />
            <p className="text-xs text-gray-500 mt-1">
              Seleccionar la habitación ayuda a mejorar las sugerencias
            </p>
          </Card>

          {/* Image capture */}
          <Card variant="bordered" className="p-4">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full rounded-lg"
                />
                <button
                  onClick={handleClearImage}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                <div className="flex justify-center gap-4 mb-4">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-20 h-20 rounded-xl bg-emerald-100 flex flex-col items-center justify-center hover:bg-emerald-200 transition-colors"
                  >
                    <Camera className="w-8 h-8 text-emerald-600 mb-1" />
                    <span className="text-xs font-medium text-emerald-700">Cámara</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-xl bg-gray-100 flex flex-col items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-gray-600 mb-1" />
                    <span className="text-xs font-medium text-gray-700">Subir</span>
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  Toma una foto o sube una imagen de la habitación
                </p>
              </div>
            )}

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </Card>

          {/* Scan count for free users (only show if Stripe is enabled) */}
          {STRIPE_ENABLED && user?.subscription_tier === 'free' && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <span>{FREE_SCANS_PER_MONTH - user.scans_this_month} escaneos restantes este mes</span>
              {user.scans_this_month >= FREE_SCANS_PER_MONTH - 1 && (
                <Badge variant="warning">Casi al límite</Badge>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Analyze button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleAnalyze}
            disabled={!imageFile}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Analizar con IA
          </Button>

          {/* Privacy notice */}
          <p className="text-xs text-gray-400 text-center">
            Tu foto se enviará a nuestros servidores para el análisis.
            Podés borrarla en cualquier momento desde la configuración.
          </p>
        </div>
      )}

      {stage === 'analyzing' && (
        <Card variant="bordered" className="p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analizando tu espacio...</h3>
          <p className="text-sm text-gray-500">
            Esto puede tomar unos segundos. Estamos identificando áreas que necesitan atención.
          </p>
        </Card>
      )}

      {stage === 'results' && aiResponse && (
        <div className="space-y-4">
          {/* Summary */}
          <Card variant="bordered" className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">Plan recomendado</h3>
                <p className="text-sm text-gray-500">{aiResponse.summary}</p>
              </div>
              <Badge variant="info">{aiResponse.tasks.length} tareas</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Tiempo total:</span>
                <span className="font-medium">{aiResponse.total_estimated_minutes} min</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Score inicial:</span>
                <span className="font-medium">{aiResponse.before_score}/100</span>
              </div>
            </div>
          </Card>

          {/* Quick wins */}
          {aiResponse.quick_wins_summary && (
            <Card className="bg-emerald-50 border border-emerald-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-emerald-900">Quick wins</span>
              </div>
              <p className="text-sm text-emerald-700">{aiResponse.quick_wins_summary}</p>
            </Card>
          )}

          {/* Tasks list */}
          <Card variant="bordered" className="divide-y divide-gray-100">
            {aiResponse.tasks.map((task, index) => (
              <div key={index} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                      {index + 1}
                    </span>
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge size="sm">{task.estimated_minutes} min</Badge>
                    {task.quick_win && <Badge variant="success" size="sm">Quick</Badge>}
                  </div>
                </div>
                {task.description_steps.length > 0 && (
                  <ul className="ml-8 space-y-1">
                    {task.description_steps.slice(0, 2).map((step, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        {step}
                      </li>
                    ))}
                    {task.description_steps.length > 2 && (
                      <li className="text-sm text-gray-400">
                        +{task.description_steps.length - 2} pasos más
                      </li>
                    )}
                  </ul>
                )}
              </div>
            ))}
          </Card>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setStage('capture')
                setAiResponse(null)
              }}
            >
              Volver
            </Button>
            <Button
              className="flex-1"
              onClick={handleSavePlan}
              loading={savingPlan}
            >
              Guardar y empezar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ScanPage() {
  return (
    <Suspense fallback={<Loading fullScreen text="Cargando..." />}>
      <ScanContent />
    </Suspense>
  )
}
