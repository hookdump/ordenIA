export const APP_NAME = 'CleanHome AI'
export const APP_DESCRIPTION = 'Tu asistente inteligente de limpieza del hogar'

// Stripe - only enabled if explicitly set to 'true'
export const STRIPE_ENABLED = process.env.NEXT_PUBLIC_STRIPE_ENABLED === 'true'

export const FREE_SCANS_PER_MONTH = STRIPE_ENABLED ? 5 : 999 // Unlimited if no billing
export const TRIAL_DAYS = 7

export const PREMIUM_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || ''
export const PREMIUM_MONTHLY_PRICE = 9.99

export const AI_MODEL = 'gpt-4o'
export const AI_MAX_TOKENS = 4096

export const IMAGE_MAX_SIZE_MB = 10
export const IMAGE_MAX_WIDTH = 1200

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

export const DEFAULT_ROOMS = [
  { type: 'living', name: 'Living', icon: 'Sofa' },
  { type: 'kitchen', name: 'Cocina', icon: 'ChefHat' },
  { type: 'bathroom', name: 'Baño', icon: 'Bath' },
  { type: 'bedroom', name: 'Dormitorio', icon: 'Bed' },
]

export const ONBOARDING_STEPS = [
  { id: 'home', title: 'Tu hogar', description: 'Nombra tu espacio' },
  { id: 'rooms', title: 'Habitaciones', description: 'Define tus espacios' },
  { id: 'preferences', title: 'Preferencias', description: 'Personaliza tu experiencia' },
  { id: 'notifications', title: 'Notificaciones', description: 'Mantente al día' },
]
