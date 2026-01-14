import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AIResponseSchema, type AIAnalysisRequest } from '@/types/ai'
import { AI_MODEL, AI_MAX_TOKENS } from '@/lib/constants'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body: AIAnalysisRequest = await request.json()
    const { imageBase64, selectedRoom, roomType, preferences } = body

    if (!imageBase64) {
      return NextResponse.json({ error: 'Imagen requerida' }, { status: 400 })
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'API key no configurada' }, { status: 500 })
    }

    // Build the prompt based on preferences
    const detailInstructions = {
      brief: 'Genera descripciones muy cortas, 1-2 pasos por tarea máximo.',
      normal: 'Genera descripciones claras con 2-4 pasos por tarea.',
      detailed: 'Genera descripciones detalladas con todos los pasos necesarios.',
    }

    const standardInstructions = {
      quick: 'Prioriza tareas rápidas y esenciales. Enfócate en lo más visible e impactante.',
      deep: 'Incluye tareas de limpieza profunda y detallada, aunque tomen más tiempo.',
    }

    const restrictionsList = preferences.restrictions.length > 0
      ? `\n\nRestricciones del usuario (NO sugieras productos o métodos que las violen):\n${preferences.restrictions.map(r => `- ${r}`).join('\n')}`
      : ''

    const sensitivityList = preferences.sensitivityTags.length > 0
      ? `\n\nCaracterísticas del espacio a considerar:\n${preferences.sensitivityTags.map(s => `- ${s}`).join('\n')}`
      : ''

    const roomContext = selectedRoom
      ? `El usuario ha indicado que esta es la habitación: ${selectedRoom}${roomType ? ` (tipo: ${roomType})` : ''}.`
      : 'El usuario no especificó qué habitación es. Intenta identificarla por los elementos visibles.'

    const systemPrompt = `Eres un asistente experto en limpieza y organización del hogar. Tu trabajo es analizar fotos de habitaciones e identificar qué necesita limpieza o atención, generando un plan de tareas práctico y accionable.

REGLAS IMPORTANTES:
1. Solo menciona lo que PUEDES VER en la imagen. No inventes problemas que no existen.
2. Si algo no está claro o no puedes verlo bien, marca "uncertain: true".
3. Sé específico: "limpiar la mesa del comedor" es mejor que "limpiar superficies".
4. Prioriza impacto visual: las tareas que más cambio visual generan van primero.
5. Estima tiempos realistas basados en el tamaño visible del espacio.
6. Las "quick wins" son tareas de 5 minutos o menos que generan un cambio inmediato.

${detailInstructions[preferences.detailLevel]}
${standardInstructions[preferences.cleaningStandard]}
${restrictionsList}
${sensitivityList}

${roomContext}

DEBES responder SOLO con un JSON válido siguiendo exactamente este esquema:
{
  "room_guess": string | null,
  "room_confidence": number (0-100) | null,
  "observations": [
    {
      "description": string,
      "severity": "low" | "medium" | "high",
      "location": string | null,
      "uncertain": boolean
    }
  ],
  "tasks": [
    {
      "title": string,
      "description_steps": string[],
      "category": "order" | "dust" | "surfaces" | "floor" | "trash" | "laundry" | "kitchen" | "bathroom" | "general",
      "estimated_minutes": number,
      "difficulty": number (1-5),
      "priority": number (1-10, donde 1 es más prioritario),
      "supplies": string[],
      "safety_notes": string[],
      "assignable": boolean,
      "quick_win": boolean
    }
  ],
  "total_estimated_minutes": number,
  "suggested_recurring_tasks": [
    {
      "title": string,
      "category": string,
      "frequency_days": number,
      "reason": string
    }
  ],
  "before_score": number (0-100, donde 0 es muy sucio y 100 está impecable),
  "summary": string (resumen breve del estado general),
  "quick_wins_summary": string | null (si hay tareas rápidas, resumen de qué se puede hacer en 10 min)
}`

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: AI_MAX_TOKENS,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: 'high',
                },
              },
              {
                type: 'text',
                text: 'Analiza esta imagen y genera el plan de limpieza en formato JSON.',
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      return NextResponse.json(
        { error: 'Error al analizar la imagen' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'Respuesta vacía de la IA' },
        { status: 500 }
      )
    }

    // Parse and validate the response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(content)
    } catch {
      console.error('Failed to parse AI response:', content)
      return NextResponse.json(
        { error: 'Respuesta inválida de la IA' },
        { status: 500 }
      )
    }

    // Validate against schema
    const validationResult = AIResponseSchema.safeParse(parsedResponse)

    if (!validationResult.success) {
      console.error('Schema validation failed:', validationResult.error)
      // Try to return what we have anyway, with defaults
      return NextResponse.json({
        room_guess: parsedResponse.room_guess || null,
        room_confidence: parsedResponse.room_confidence || null,
        observations: parsedResponse.observations || [],
        tasks: (parsedResponse.tasks || []).map((t: Record<string, unknown>) => ({
          title: t.title || 'Tarea',
          description_steps: t.description_steps || [],
          category: t.category || 'general',
          estimated_minutes: t.estimated_minutes || 5,
          difficulty: t.difficulty || 3,
          priority: t.priority || 5,
          supplies: t.supplies || [],
          safety_notes: t.safety_notes || [],
          assignable: t.assignable !== false,
          quick_win: t.quick_win || false,
        })),
        total_estimated_minutes: parsedResponse.total_estimated_minutes || 30,
        suggested_recurring_tasks: parsedResponse.suggested_recurring_tasks || [],
        before_score: parsedResponse.before_score || 50,
        summary: parsedResponse.summary || 'Análisis completado',
        quick_wins_summary: parsedResponse.quick_wins_summary || null,
      })
    }

    return NextResponse.json(validationResult.data)
  } catch (error) {
    console.error('Error in AI analyze:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
