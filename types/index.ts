export * from './database'
export * from './ai'

// Room types with icons and default names
export const ROOM_TYPES = [
  { type: 'living', name: 'Living', icon: 'Sofa' },
  { type: 'kitchen', name: 'Cocina', icon: 'ChefHat' },
  { type: 'bathroom', name: 'Baño', icon: 'Bath' },
  { type: 'bedroom', name: 'Dormitorio', icon: 'Bed' },
  { type: 'office', name: 'Oficina', icon: 'Monitor' },
  { type: 'dining', name: 'Comedor', icon: 'UtensilsCrossed' },
  { type: 'laundry', name: 'Lavadero', icon: 'Shirt' },
  { type: 'garage', name: 'Garage', icon: 'Car' },
  { type: 'hallway', name: 'Pasillo', icon: 'ArrowRight' },
  { type: 'balcony', name: 'Balcón', icon: 'Sun' },
  { type: 'custom', name: 'Personalizado', icon: 'Plus' },
] as const

export type RoomType = typeof ROOM_TYPES[number]['type']

// Sensitivity tags
export const SENSITIVITY_TAGS = [
  { id: 'hardwood', label: 'Piso de madera' },
  { id: 'marble', label: 'Mármol' },
  { id: 'carpet', label: 'Alfombra' },
  { id: 'delicate', label: 'Superficies delicadas' },
  { id: 'pets', label: 'Mascotas' },
  { id: 'allergies', label: 'Alergias' },
  { id: 'children', label: 'Niños pequeños' },
  { id: 'plants', label: 'Plantas' },
] as const

// Restrictions
export const RESTRICTIONS = [
  { id: 'no_bleach', label: 'Sin lavandina/lejía' },
  { id: 'no_ammonia', label: 'Sin amoníaco' },
  { id: 'eco_only', label: 'Solo productos ecológicos' },
  { id: 'fragrance_free', label: 'Sin fragancias' },
  { id: 'pet_safe', label: 'Seguro para mascotas' },
  { id: 'child_safe', label: 'Seguro para niños' },
] as const

// Badge definitions
export const BADGE_DEFINITIONS = [
  // Streak badges
  { id: 'streak_3', name: 'En racha', description: '3 días seguidos limpiando', icon: 'Flame', category: 'streak', requirement_type: 'streak', requirement_value: 3 },
  { id: 'streak_7', name: 'Semana impecable', description: '7 días seguidos limpiando', icon: 'Flame', category: 'streak', requirement_type: 'streak', requirement_value: 7 },
  { id: 'streak_30', name: 'Mes dedicado', description: '30 días seguidos limpiando', icon: 'Flame', category: 'streak', requirement_type: 'streak', requirement_value: 30 },

  // Task completion badges
  { id: 'tasks_10', name: 'Primeros pasos', description: '10 tareas completadas', icon: 'CheckCircle', category: 'tasks', requirement_type: 'total_tasks', requirement_value: 10 },
  { id: 'tasks_50', name: 'Limpiador dedicado', description: '50 tareas completadas', icon: 'CheckCircle', category: 'tasks', requirement_type: 'total_tasks', requirement_value: 50 },
  { id: 'tasks_100', name: 'Maestro del hogar', description: '100 tareas completadas', icon: 'Trophy', category: 'tasks', requirement_type: 'total_tasks', requirement_value: 100 },
  { id: 'tasks_500', name: 'Leyenda', description: '500 tareas completadas', icon: 'Crown', category: 'tasks', requirement_type: 'total_tasks', requirement_value: 500 },

  // Time badges
  { id: 'time_60', name: 'Primera hora', description: '60 minutos de limpieza', icon: 'Clock', category: 'time', requirement_type: 'total_minutes', requirement_value: 60 },
  { id: 'time_300', name: 'Medio día de trabajo', description: '5 horas de limpieza', icon: 'Clock', category: 'time', requirement_type: 'total_minutes', requirement_value: 300 },
  { id: 'time_600', name: 'Día completo', description: '10 horas de limpieza', icon: 'Timer', category: 'time', requirement_type: 'total_minutes', requirement_value: 600 },

  // Room-specific badges
  { id: 'kitchen_master', name: 'Chef limpio', description: 'Cocina limpia 10 veces', icon: 'ChefHat', category: 'room', requirement_type: 'room_kitchen', requirement_value: 10 },
  { id: 'bathroom_master', name: 'Baño reluciente', description: 'Baño limpio 10 veces', icon: 'Bath', category: 'room', requirement_type: 'room_bathroom', requirement_value: 10 },
  { id: 'bedroom_master', name: 'Dulces sueños', description: 'Dormitorio limpio 10 veces', icon: 'Bed', category: 'room', requirement_type: 'room_bedroom', requirement_value: 10 },

  // Quick win badges
  { id: 'quick_wins_10', name: 'Victorias rápidas', description: '10 tareas rápidas completadas', icon: 'Zap', category: 'quick', requirement_type: 'quick_wins', requirement_value: 10 },
  { id: 'quick_wins_50', name: 'Eficiencia máxima', description: '50 tareas rápidas completadas', icon: 'Zap', category: 'quick', requirement_type: 'quick_wins', requirement_value: 50 },

  // Plan badges
  { id: 'plans_5', name: 'Planificador', description: '5 planes completados', icon: 'ClipboardCheck', category: 'plans', requirement_type: 'completed_plans', requirement_value: 5 },
  { id: 'plans_20', name: 'Estratega', description: '20 planes completados', icon: 'Target', category: 'plans', requirement_type: 'completed_plans', requirement_value: 20 },
] as const

export type BadgeId = typeof BADGE_DEFINITIONS[number]['id']

// Subscription limits
export const SUBSCRIPTION_LIMITS = {
  free: {
    scansPerMonth: 5,
    maxHomes: 1,
    maxMembersPerHome: 1,
    templates: false,
    advancedAnalytics: false,
    prioritySupport: false,
  },
  premium: {
    scansPerMonth: Infinity,
    maxHomes: 5,
    maxMembersPerHome: 10,
    templates: true,
    advancedAnalytics: true,
    prioritySupport: true,
  },
} as const
