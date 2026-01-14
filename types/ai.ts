import { z } from 'zod'
import type { TaskCategory } from './database'

// AI Response Schema for validation
export const AIObservationSchema = z.object({
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  location: z.string().optional(),
  uncertain: z.boolean().default(false),
})

export const AITaskSchema = z.object({
  title: z.string(),
  description_steps: z.array(z.string()),
  category: z.enum(['order', 'dust', 'surfaces', 'floor', 'trash', 'laundry', 'kitchen', 'bathroom', 'general']),
  estimated_minutes: z.number().min(1).max(120),
  difficulty: z.number().min(1).max(5),
  priority: z.number().min(1).max(10),
  supplies: z.array(z.string()).default([]),
  safety_notes: z.array(z.string()).default([]),
  assignable: z.boolean().default(true),
  quick_win: z.boolean().default(false),
})

export const AIRecurringTaskSchema = z.object({
  title: z.string(),
  category: z.enum(['order', 'dust', 'surfaces', 'floor', 'trash', 'laundry', 'kitchen', 'bathroom', 'general']),
  frequency_days: z.number(),
  reason: z.string(),
})

export const AIResponseSchema = z.object({
  room_guess: z.string().nullable(),
  room_confidence: z.number().min(0).max(100).nullable(),
  observations: z.array(AIObservationSchema),
  tasks: z.array(AITaskSchema),
  total_estimated_minutes: z.number(),
  suggested_recurring_tasks: z.array(AIRecurringTaskSchema).default([]),
  before_score: z.number().min(0).max(100),
  summary: z.string(),
  quick_wins_summary: z.string().optional(),
})

export type AIObservation = z.infer<typeof AIObservationSchema>
export type AITask = z.infer<typeof AITaskSchema>
export type AIRecurringTask = z.infer<typeof AIRecurringTaskSchema>
export type AIResponse = z.infer<typeof AIResponseSchema>

// Request types
export interface AIAnalysisRequest {
  imageBase64: string
  selectedRoom: string | null
  roomType: string | null
  preferences: {
    detailLevel: 'brief' | 'normal' | 'detailed'
    cleaningStandard: 'quick' | 'deep'
    restrictions: string[]
    sensitivityTags: string[]
  }
  recentTasks?: string[]
  taskFeedback?: {
    skipAlways: string[]
    timeAdjustments: Record<string, number>
  }
}

// Category display info
export const CATEGORY_INFO: Record<TaskCategory, { label: string; icon: string; color: string }> = {
  order: { label: 'Ordenar', icon: 'Layout', color: 'blue' },
  dust: { label: 'Polvo', icon: 'Wind', color: 'gray' },
  surfaces: { label: 'Superficies', icon: 'Square', color: 'purple' },
  floor: { label: 'Pisos', icon: 'Grid3x3', color: 'amber' },
  trash: { label: 'Basura', icon: 'Trash2', color: 'red' },
  laundry: { label: 'Ropa', icon: 'Shirt', color: 'cyan' },
  kitchen: { label: 'Cocina', icon: 'ChefHat', color: 'orange' },
  bathroom: { label: 'Baño', icon: 'Bath', color: 'teal' },
  general: { label: 'General', icon: 'Sparkles', color: 'green' },
}

// Difficulty labels
export const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Muy fácil',
  2: 'Fácil',
  3: 'Moderado',
  4: 'Difícil',
  5: 'Muy difícil',
}
