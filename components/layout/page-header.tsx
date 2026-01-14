'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, backHref, action, className }: PageHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  return (
    <div className={cn('flex items-center justify-between gap-4 mb-6', className)}>
      <div className="flex items-center gap-3">
        {backHref !== undefined && (
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
