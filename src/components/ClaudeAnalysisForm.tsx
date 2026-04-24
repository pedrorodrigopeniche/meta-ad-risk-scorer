'use client'

import { useState } from 'react'
import type { ClaudeAnalysis, ClaudeApiResult } from '@/types'
import { RISK_LEVEL_CLASS, RISK_LEVEL_LABEL, VERDICT_CONFIG } from '@/lib/constants'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Bot, Loader2, Sparkles, CheckCircle2, XCircle, AlertTriangle, ClipboardPaste,
} from 'lucide-react'

interface Props {
  value: ClaudeAnalysis
  onChange: (updated: ClaudeAnalysis) => void
  onAdNameSuggested?: (name: string) => void
  onAnalyze?: () => Promise<void>
  isAnalyzing?: boolean
  canAnalyze?: boolean
}

const REQUIRED_FIELDS = [
  'claudeScore', 'claudeRiskLevel', 'claudeVerdict', 'claudeTriggers',
  'claudeLikelyRejectionReason', 'claudeMetaInterpretation', 'claudeHowToFix', 'claudeSafeRewrite',
] as const

function parseClaudeJson(raw: string): { data: ClaudeApiResult; error: null } | { data: null; error: string } {
  if (!raw.trim()) return { data: null, error: '' }

  let parsed: unknown
  try { parsed = JSON.parse(raw.trim()) }
  catch { return { data: null, error: 'JSON inválido. Verifica que no falten llaves o comillas.' } }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
    return { data: null, error: 'El JSON debe ser un objeto {}.' }

  const obj = parsed as Record<string, unknown>
  const missing = REQUIRED_FIELDS.filter((f) => !(f in obj))
  if (missing.length > 0)
    return { data: null, error: `Faltan campos requeridos: ${missing.join(', ')}` }

  if (typeof obj.claudeScore !== 'number' || obj.claudeScore < 1 || obj.claudeScore > 10)
    return { data: null, error: 'claudeScore debe ser un número entre 1 y 10.' }

  return { data: obj as unknown as ClaudeApiResult, error: null }
}

function apiResultToAnalysis(d: ClaudeApiResult): ClaudeAnalysis {
  return {
    claudeScore: d.claudeScore,
    claudeRiskLevel: d.claudeRiskLevel,
    claudeVerdict: d.claudeVerdict,
    claudeTriggers: Array.isArray(d.claudeTriggers) ? d.claudeTriggers.join(', ') : String(d.claudeTriggers),
    claudeLikelyRejectionReason: d.claudeLikelyRejectionReason,
    claudeMetaInterpretation: d.claudeMetaInterpretation,
    claudeHowToFix: Array.isArray(d.claudeHowToFix) ? d.claudeHowToFix.join('\n') : String(d.claudeHowToFix),
    claudeSafeRewrite: d.claudeSafeRewrite,
  }
}

export function ClaudeAnalysisForm({
  value, onChange, onAdNameSuggested, onAnalyze, isAnalyzing, canAnalyze,
}: Props) {
  const [jsonText, setJsonText] = useState('')
  const [showPaste, setShowPaste] = useState(false)

  const hasResult = value.claudeScore !== undefined
  const parseResult = parseClaudeJson(jsonText)
  const jsonIsValid = jsonText.trim() !== '' && parseResult.error === null
  const jsonError = jsonText.trim() ? parseResult.error : null

  function set<K extends keyof ClaudeAnalysis>(key: K, val: ClaudeAnalysis[K]) {
    onChange({ ...value, [key]: val })
  }

  function handleApplyJson() {
    if (!parseResult.data) return
    onChange(apiResultToAnalysis(parseResult.data))
    if (parseResult.data.adName && onAdNameSuggested) {
      onAdNameSuggested(parseResult.data.adName)
    }
    setJsonText('')
    setShowPaste(false)
  }

  const verdictCfg = value.claudeVerdict ? VERDICT_CONFIG[value.claudeVerdict] : undefined
  const previewData = parseResult.data

  return (
    <Card className="border-violet-200 bg-violet-50/40">
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2 text-violet-900">
            <Bot className="h-4 w-4" />
            Análisis Claude
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm" variant="ghost"
              className="text-violet-700 hover:bg-violet-100"
              onClick={() => setShowPaste((v) => !v)}
            >
              <ClipboardPaste className="h-3.5 w-3.5 mr-1.5" />
              Pegar JSON
            </Button>
            {onAnalyze && (
              <Button
                size="sm" variant="outline"
                className="border-violet-300 text-violet-800 hover:bg-violet-100"
                onClick={onAnalyze}
                disabled={isAnalyzing || !canAnalyze}
              >
                {isAnalyzing
                  ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Analizando…</>
                  : <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Analizar con Claude</>}
              </Button>
            )}
          </div>
        </div>
        {!hasResult && !showPaste && (
          <p className="text-xs text-muted-foreground mt-1">
            Pega el JSON resultado del análisis de Claude Chat.
          </p>
        )}
      </CardHeader>

      {/* Paste panel */}
      {showPaste && (
        <CardContent className="pt-0 pb-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="pasteJson" className="text-xs font-semibold text-violet-800">
              Pegar JSON de Claude
            </Label>
            <Textarea
              id="pasteJson" rows={7}
              placeholder={'{\n  "adName": "Nombre del anuncio",\n  "claudeScore": 8,\n  "claudeRiskLevel": "High",\n  "claudeVerdict": "Do not launch",\n  "claudeTriggers": ["pluma visible"],\n  "claudeLikelyRejectionReason": "...",\n  "claudeMetaInterpretation": "...",\n  "claudeHowToFix": ["..."],\n  "claudeSafeRewrite": "..."\n}'}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="font-mono text-xs bg-background"
              spellCheck={false}
            />
          </div>

          {/* Validation feedback */}
          {jsonText.trim() && (
            jsonError ? (
              <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2">
                <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700">{jsonError}</p>
              </div>
            ) : previewData ? (
              <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <p className="text-xs font-semibold text-green-800">
                    JSON válido{previewData.adName ? ` · "${previewData.adName}"` : ''} — vista previa:
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 pl-6">
                  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium bg-violet-100 text-violet-800 border-violet-200">
                    <Bot className="h-3 w-3" />{previewData.claudeScore} / 10
                  </span>
                  {previewData.claudeRiskLevel && (
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${RISK_LEVEL_CLASS[previewData.claudeRiskLevel] ?? 'bg-muted border-border'}`}>
                      {RISK_LEVEL_LABEL[previewData.claudeRiskLevel] ?? previewData.claudeRiskLevel}
                    </span>
                  )}
                  {previewData.claudeVerdict && (() => {
                    const vc = VERDICT_CONFIG[previewData.claudeVerdict!]
                    return (
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${vc?.class ?? 'bg-muted border-border'}`}>
                        {vc ? (previewData.claudeVerdict === 'Approved to test'
                          ? <CheckCircle2 className="h-3 w-3" />
                          : previewData.claudeVerdict === 'Do not launch'
                            ? <XCircle className="h-3 w-3" />
                            : <AlertTriangle className="h-3 w-3" />) : null}
                        {vc?.label ?? previewData.claudeVerdict}
                      </span>
                    )
                  })()}
                </div>
              </div>
            ) : null
          )}

          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => { setJsonText(''); setShowPaste(false) }}>
              Cancelar
            </Button>
            <Button
              size="sm" disabled={!jsonIsValid} onClick={handleApplyJson}
              className="bg-violet-700 hover:bg-violet-800 text-white"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              Aplicar resultado
            </Button>
          </div>
        </CardContent>
      )}

      {/* Results display */}
      {hasResult && (
        <CardContent className="space-y-4 pt-0">
          {showPaste && <Separator />}

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold bg-violet-100 text-violet-900 border-violet-300">
              <Bot className="h-3.5 w-3.5" />{value.claudeScore} / 10
            </span>
            {value.claudeRiskLevel && (
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${RISK_LEVEL_CLASS[value.claudeRiskLevel] ?? 'bg-muted border-border'}`}>
                {RISK_LEVEL_LABEL[value.claudeRiskLevel] ?? value.claudeRiskLevel}
              </span>
            )}
            {verdictCfg && (
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${verdictCfg.class}`}>
                {value.claudeVerdict === 'Approved to test' ? <CheckCircle2 className="h-3.5 w-3.5" />
                  : value.claudeVerdict === 'Do not launch' ? <XCircle className="h-3.5 w-3.5" />
                  : <AlertTriangle className="h-3.5 w-3.5" />}
                {verdictCfg.label}
              </span>
            )}
          </div>

          {value.claudeTriggers && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Disparadores detectados</p>
              <div className="flex flex-wrap gap-1.5">
                {value.claudeTriggers.split(',').map((t) =>
                  t.trim() ? <Badge key={t} variant="secondary" className="text-xs">{t.trim()}</Badge> : null
                )}
              </div>
            </div>
          )}

          {value.claudeLikelyRejectionReason && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Motivo probable de rechazo</p>
              <p className="text-sm">{value.claudeLikelyRejectionReason}</p>
            </div>
          )}

          {value.claudeMetaInterpretation && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Cómo lo interpreta Meta</p>
              <p className="text-sm text-muted-foreground">{value.claudeMetaInterpretation}</p>
            </div>
          )}

          {value.claudeHowToFix && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Cómo corregirlo</p>
              <ul className="space-y-1">
                {value.claudeHowToFix.split('\n').map((fix) =>
                  fix.trim()
                    ? <li key={fix} className="text-sm flex gap-2"><span className="text-green-600 mt-0.5 shrink-0">✓</span>{fix.trim()}</li>
                    : null
                )}
              </ul>
            </div>
          )}

          {value.claudeSafeRewrite && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Reescritura segura sugerida</p>
                <Textarea
                  rows={4} value={value.claudeSafeRewrite}
                  onChange={(e) => set('claudeSafeRewrite', e.target.value || undefined)}
                  className="text-sm bg-background"
                />
              </div>
            </>
          )}

          <Separator />
          <div className="space-y-1.5">
            <Label htmlFor="claudeExplanation" className="text-xs text-muted-foreground">Notas adicionales</Label>
            <Textarea
              id="claudeExplanation" rows={2}
              placeholder="Observaciones propias…"
              value={value.claudeExplanation ?? ''}
              onChange={(e) => set('claudeExplanation', e.target.value || undefined)}
              className="text-sm"
            />
          </div>
        </CardContent>
      )}
    </Card>
  )
}
