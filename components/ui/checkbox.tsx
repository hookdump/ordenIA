'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s/g, '-')

    return (
      <label htmlFor={checkboxId} className="flex items-center gap-2 cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            id={checkboxId}
            className="sr-only peer"
            ref={ref}
            {...props}
          />
          <div
            className={cn(
              'h-5 w-5 rounded border-2 border-gray-300 bg-white transition-colors',
              'peer-checked:border-emerald-600 peer-checked:bg-emerald-600',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 peer-focus-visible:ring-offset-2',
              'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
              className
            )}
          />
          <Check className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
        </div>
        {label && <span className="text-sm text-gray-700">{label}</span>}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export { Checkbox }
