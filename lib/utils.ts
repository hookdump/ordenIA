import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  return `${hours}h ${remainingMinutes}m`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays < 7) return `Hace ${diffDays} días`
  return formatDate(d)
}

export function getDifficultyColor(difficulty: number): string {
  const colors: Record<number, string> = {
    1: 'text-green-600 bg-green-100',
    2: 'text-lime-600 bg-lime-100',
    3: 'text-yellow-600 bg-yellow-100',
    4: 'text-orange-600 bg-orange-100',
    5: 'text-red-600 bg-red-100',
  }
  return colors[difficulty] || colors[3]
}

export function getPriorityColor(priority: number): string {
  if (priority <= 3) return 'text-red-600 bg-red-100'
  if (priority <= 5) return 'text-orange-600 bg-orange-100'
  if (priority <= 7) return 'text-yellow-600 bg-yellow-100'
  return 'text-green-600 bg-green-100'
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    order: 'bg-blue-100 text-blue-700',
    dust: 'bg-gray-100 text-gray-700',
    surfaces: 'bg-purple-100 text-purple-700',
    floor: 'bg-amber-100 text-amber-700',
    trash: 'bg-red-100 text-red-700',
    laundry: 'bg-cyan-100 text-cyan-700',
    kitchen: 'bg-orange-100 text-orange-700',
    bathroom: 'bg-teal-100 text-teal-700',
    general: 'bg-green-100 text-green-700',
  }
  return colors[category] || colors.general
}

export function generateInviteToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}

export async function compressImage(file: File, maxWidth = 1200): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Could not compress image'))
            }
          },
          'image/jpeg',
          0.8
        )
      }
      img.onerror = () => reject(new Error('Could not load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove data URL prefix to get just the base64
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}
