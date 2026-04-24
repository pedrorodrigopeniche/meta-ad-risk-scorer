'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Ad, AdStatus } from '@/types'
import { STATUS_CONFIG, ACCOUNT_CONFIG, RISK_LEVEL_CLASS, RISK_LEVEL_LABEL, VERDICT_CONFIG } from '@/lib/constants'
import { FileText, ImageIcon, Pencil, Trash2, Bot, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { upsertAd } from '@/lib/storage'
import { useState } from 'react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface Props {
  ad: Ad
  onDelete: (id: string) => void
  onUpdate: (ad: Ad) => void
}

export function AdCard({ ad, onDelete, onUpdate }: Props) {
  const router = useRouter()
  const [statusOpen, setStatusOpen] = useState(false)

  const preview = ad.content
    ? ad.content.slice(0, 140).replace(/\s+/g, ' ')
    : ad.imageFileName ?? ''

  const accountCfg = ACCOUNT_CONFIG[ad.account]
  const statusCfg = STATUS_CONFIG[ad.status]
  const riskClass = ad.claudeRiskLevel ? (RISK_LEVEL_CLASS[ad.claudeRiskLevel] ?? '') : ''
  const verdictCfg = ad.claudeVerdict ? VERDICT_CONFIG[ad.claudeVerdict] : undefined

  function handleStatusChange(newStatus: string | null) {
    if (!newStatus) return
    const updated: Ad = { ...ad, status: newStatus as AdStatus, updatedAt: new Date().toISOString() }
    upsertAd(updated)
    onUpdate(updated)
  }

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow overflow-hidden">
      {/* Image thumbnail */}
      {ad.imageBase64 && (
        <div className="h-36 bg-muted overflow-hidden shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:${ad.imageFileName?.endsWith('.png') ? 'image/png' : 'image/jpeg'};base64,${ad.imageBase64}`}
            alt={ad.adName || 'Ad image'}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <CardContent className="flex-1 pt-3 space-y-2 pb-2">
        {/* Name + account */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight truncate" title={ad.adName}>
              {ad.adName || <span className="text-muted-foreground italic">Sin nombre</span>}
            </p>
            <span className={`inline-flex items-center mt-0.5 rounded-full border px-2 py-0 text-xs font-medium ${accountCfg?.class ?? ''}`}>
              {accountCfg?.label ?? ad.account}
            </span>
          </div>
          {/* Status inline select */}
          <Select value={ad.status} onValueChange={handleStatusChange}>
            <SelectTrigger className={`h-7 w-auto text-xs px-2 border rounded-full ${statusCfg?.class ?? ''}`} style={{ boxShadow: 'none' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Draft">Borrador</SelectItem>
              <SelectItem value="Active">Activo</SelectItem>
              <SelectItem value="Off">Pausado</SelectItem>
              <SelectItem value="Rejected">Rechazado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Copy preview */}
        {preview && (
          <p className="text-xs leading-relaxed text-foreground/70 line-clamp-2">
            {preview}{ad.content.length > 140 && '…'}
          </p>
        )}

        {/* Claude score row */}
        {ad.claudeScore !== undefined ? (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold bg-violet-100 text-violet-900 border-violet-200">
              <Bot className="h-3 w-3" />{ad.claudeScore}/10
            </span>
            {ad.claudeRiskLevel && (
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${riskClass}`}>
                {RISK_LEVEL_LABEL[ad.claudeRiskLevel] ?? ad.claudeRiskLevel}
              </span>
            )}
            {verdictCfg && (
              <span className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs font-medium ${verdictCfg.class}`}>
                {ad.claudeVerdict === 'Approved to test' ? <CheckCircle2 className="h-3 w-3" />
                  : ad.claudeVerdict === 'Do not launch' ? <XCircle className="h-3 w-3" />
                  : <AlertTriangle className="h-3 w-3" />}
                {verdictCfg.label}
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Sin análisis Claude</p>
        )}

        {/* File indicator */}
        {(ad.imageFileName || ad.fileName) && !ad.imageBase64 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {ad.imageFileName
              ? <><ImageIcon className="h-3 w-3" />{ad.imageFileName}</>
              : <><FileText className="h-3 w-3" />{ad.fileName}</>}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-0 pb-3">
        <span className="text-xs text-muted-foreground">
          {new Date(ad.updatedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => router.push(`/anuncio/${ad.id}`)}>
            <Pencil className="h-3.5 w-3.5 mr-1" />Editar
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(ad.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
