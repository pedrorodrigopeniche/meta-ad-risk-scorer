'use client'

import type { RiskFactor } from '@/types'
import { Badge } from '@/components/ui/badge'

const categoryConfig: Record<RiskFactor['category'], { label: string; variant: 'destructive' | 'secondary' | 'outline' | 'default' }> = {
  critical: { label: 'Crítico', variant: 'destructive' },
  high: { label: 'Alto', variant: 'default' },
  medium: { label: 'Medio', variant: 'secondary' },
  low: { label: 'Bajo', variant: 'outline' },
}

interface Props {
  factors: RiskFactor[]
}

export function RiskFactorList({ factors }: Props) {
  if (factors.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No se detectaron factores de riesgo.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {factors.map((f) => {
        const cfg = categoryConfig[f.category]
        return (
          <li key={f.id} className="flex items-start gap-2">
            <Badge variant={cfg.variant} className="mt-0.5 shrink-0 text-xs">
              {cfg.label}
            </Badge>
            <div>
              <p className="text-sm font-medium leading-tight">{f.label}</p>
              <p className="text-xs text-muted-foreground">{f.description}</p>
            </div>
            <span className="ml-auto shrink-0 text-xs font-semibold text-muted-foreground">
              +{f.points}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
