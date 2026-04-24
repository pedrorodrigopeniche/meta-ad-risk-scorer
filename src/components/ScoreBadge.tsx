'use client'

import { getRiskLevel } from '@/lib/scorer'
import { cn } from '@/lib/utils'

interface Props {
  score: number
  size?: 'sm' | 'lg'
}

export function ScoreBadge({ score, size = 'sm' }: Props) {
  const { label, color } = getRiskLevel(score)

  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    red: 'bg-red-100 text-red-800 border-red-300',
  }[color]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-semibold',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-4 py-1.5 text-sm',
        colorClasses,
      )}
    >
      <span className={cn('font-bold', size === 'lg' ? 'text-lg' : 'text-sm')}>{score}</span>
      <span className="opacity-80">/ 10 · {label}</span>
    </span>
  )
}
