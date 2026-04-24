'use client'

import { useEffect, useState, useMemo } from 'react'
import { loadAds } from '@/lib/storage'
import type { Ad } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Lightbulb, AlertTriangle, TrendingDown, Sparkles, ShieldCheck, Ban } from 'lucide-react'

// ── Angle suggestion rules ─────────────────────────────────────────────────
interface AngleRule {
  keywords: string[]
  angle: string
  description: string
  example: string
}

const ANGLE_RULES: AngleRule[] = [
  {
    keywords: ['pluma', 'inyección', 'inyeccion', 'syringe', 'pen', 'injection', 'jeringa'],
    angle: 'Programa médico personalizado',
    description: 'Enfocarse en acompañamiento del equipo médico sin mostrar dispositivos de inyección.',
    example: '"Nuestro equipo médico diseña un plan personalizado para ti — sin trucos, sin riesgos."',
  },
  {
    keywords: ['resultado rápido', 'fast result', 'en días', 'en semanas', 'rápido', 'rapido', 'quick', 'fast'],
    angle: 'Acompañamiento sostenible a largo plazo',
    description: 'Eliminar referencias a velocidad; enfatizar proceso gradual y salud duradera.',
    example: '"Transforma tu salud con un plan que se adapta a tu ritmo y tu vida."',
  },
  {
    keywords: ['precio', 'price', 'descuento', 'oferta', 'discount', 'costo', 'coupón', 'coupon'],
    angle: 'Evaluación gratuita como primer paso',
    description: 'Separar propuesta de valor del precio; ofrecer evaluación antes de hablar de costo.',
    example: '"Comienza con una evaluación sin costo con nuestro equipo médico especializado."',
  },
  {
    keywords: ['antes', 'después', 'before', 'after', 'transformación', 'transformacion'],
    angle: 'Proceso y acompañamiento en lugar de comparativas',
    description: 'Evitar imágenes de comparación; mostrar el proceso y el apoyo profesional.',
    example: '"Cada semana con nuestro programa es un paso más hacia tu mejor versión."',
  },
  {
    keywords: ['sin receta', 'without prescription', 'sin médico', 'sin medico'],
    angle: 'Supervisión médica como diferenciador de valor',
    description: 'Posicionar la supervisión médica como ventaja competitiva, no como obstáculo.',
    example: '"Bajo supervisión médica especializada en cada etapa de tu tratamiento."',
  },
  {
    keywords: ['ozempic', 'wegovy', 'saxenda', 'semaglutide', 'mounjaro', 'tirzepatide', 'medicamento', 'fármaco'],
    angle: 'Programa integral de salud sin mencionar fármacos',
    description: 'Hablar del programa y resultados, nunca de medicamentos específicos.',
    example: '"Programa integral de control de peso con acompañamiento médico 24/7."',
  },
  {
    keywords: ['garantía', 'garantia', 'garantizado', 'guarantee', '100%', 'seguro'],
    angle: 'Resultados reales con expectativas honestas',
    description: 'Evitar garantías absolutas; usar testimonios reales con disclaimer.',
    example: '"Pacientes reales con resultados reales — porque cada proceso es único."',
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────
function getTopTriggers(ads: Ad[], n: number): [string, number][] {
  const counts: Record<string, number> = {}
  for (const ad of ads) {
    if (!ad.claudeTriggers) continue
    for (const t of ad.claudeTriggers.split(',')) {
      const k = t.trim().toLowerCase()
      if (k) counts[k] = (counts[k] ?? 0) + 1
    }
  }
  return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, n)
}

function getTopHowToFix(ads: Ad[], n: number): [string, number][] {
  const counts: Record<string, number> = {}
  for (const ad of ads) {
    if (!ad.claudeHowToFix) continue
    for (const fix of ad.claudeHowToFix.split('\n')) {
      const k = fix.trim().toLowerCase().slice(0, 80)
      if (k) counts[k] = (counts[k] ?? 0) + 1
    }
  }
  return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, n)
}

function getSuggestedAngles(triggers: [string, number][]): (AngleRule & { matchCount: number })[] {
  const triggerWords = triggers.map(([t]) => t)
  const results: (AngleRule & { matchCount: number })[] = []
  for (const rule of ANGLE_RULES) {
    const matchCount = rule.keywords.filter((kw) =>
      triggerWords.some((t) => t.includes(kw))
    ).length
    if (matchCount > 0) results.push({ ...rule, matchCount })
  }
  return results.sort((a, b) => b.matchCount - a.matchCount)
}

function getAvoidPatterns(highRiskAds: Ad[]): string[] {
  const reasons: string[] = []
  for (const ad of highRiskAds) {
    if (ad.claudeLikelyRejectionReason) reasons.push(ad.claudeLikelyRejectionReason)
  }
  // Deduplicate by similarity (simple: exact match)
  return [...new Set(reasons)].slice(0, 8)
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function IdeasPage() {
  const [ads, setAds] = useState<Ad[]>([])

  useEffect(() => { setAds(loadAds()) }, [])

  const analyzed = useMemo(() => ads.filter((a) => a.claudeScore !== undefined), [ads])
  const highRisk = useMemo(() => analyzed.filter((a) => (a.claudeScore ?? 0) >= 7), [analyzed])
  const rejected = useMemo(() => ads.filter((a) => a.status === 'Rejected'), [ads])
  const topTriggers = useMemo(() => getTopTriggers(analyzed, 12), [analyzed])
  const topFixes = useMemo(() => getTopHowToFix(analyzed, 8), [analyzed])
  const suggestedAngles = useMemo(() => getSuggestedAngles(topTriggers), [topTriggers])
  const avoidPatterns = useMemo(() => getAvoidPatterns([...highRisk, ...rejected]), [highRisk, rejected])

  if (ads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
        <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold">Sin datos aún</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Guarda anuncios con análisis de Claude para que esta página genere aprendizajes automáticos.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-amber-500" />
          Aprendizajes e Ideas
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Generado automáticamente desde {analyzed.length} anuncio{analyzed.length !== 1 ? 's' : ''} analizados
          {' '}({ads.length} total guardados).
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat label="Analizados" value={analyzed.length} />
        <MiniStat label="Alto riesgo (7+)" value={highRisk.length} valueClass="text-red-600" />
        <MiniStat label="Rechazados" value={rejected.length} valueClass="text-red-600" />
        <MiniStat
          label="Score promedio"
          value={analyzed.length ? (analyzed.reduce((s, a) => s + (a.claudeScore ?? 0), 0) / analyzed.length).toFixed(1) : '—'}
        />
      </div>

      {/* Most common triggers */}
      {topTriggers.length > 0 && (
        <Section icon={<AlertTriangle className="h-5 w-5 text-red-500" />} title="Disparadores más frecuentes">
          <div className="flex flex-wrap gap-2">
            {topTriggers.map(([trigger, count]) => (
              <span
                key={trigger}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 text-red-700 px-3 py-1 text-sm"
              >
                {trigger}
                <span className="rounded-full bg-red-200 text-red-800 text-xs px-1.5 py-0 font-semibold">{count}</span>
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Patterns to avoid */}
      {avoidPatterns.length > 0 && (
        <Section icon={<Ban className="h-5 w-5 text-red-500" />} title="Patrones a evitar">
          <ul className="space-y-2">
            {avoidPatterns.map((p) => (
              <li key={p} className="flex gap-2 text-sm">
                <span className="text-red-500 mt-0.5 shrink-0">✗</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Suggested angles */}
      {suggestedAngles.length > 0 && (
        <Section icon={<Sparkles className="h-5 w-5 text-amber-500" />} title="Ideas de nuevos anuncios">
          <p className="text-sm text-muted-foreground mb-4">
            Ángulos sugeridos basados en los disparadores detectados con más frecuencia.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {suggestedAngles.map((rule) => (
              <Card key={rule.angle} className="border-amber-200 bg-amber-50/40">
                <CardContent className="pt-4 pb-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm text-amber-900">{rule.angle}</p>
                    <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 shrink-0">
                      {rule.matchCount} coincidencia{rule.matchCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{rule.description}</p>
                  <Separator className="my-1" />
                  <p className="text-xs italic text-amber-800">{rule.example}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* Safer directions from Claude's own fixes */}
      {topFixes.length > 0 && (
        <Section icon={<ShieldCheck className="h-5 w-5 text-green-600" />} title="Direcciones creativas más seguras">
          <p className="text-sm text-muted-foreground mb-3">
            Correcciones que Claude ha recomendado con más frecuencia en los análisis guardados.
          </p>
          <ul className="space-y-2">
            {topFixes.map(([fix, count]) => (
              <li key={fix} className="flex gap-2 text-sm items-start">
                <span className="text-green-600 mt-0.5 shrink-0">✓</span>
                <span className="flex-1">{fix}</span>
                {count > 1 && (
                  <span className="text-xs text-muted-foreground shrink-0">×{count}</span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* High risk ads list */}
      {highRisk.length > 0 && (
        <Section icon={<TrendingDown className="h-5 w-5 text-red-500" />} title="Anuncios de alto riesgo (score ≥ 7)">
          <div className="divide-y">
            {highRisk
              .sort((a, b) => (b.claudeScore ?? 0) - (a.claudeScore ?? 0))
              .slice(0, 10)
              .map((ad) => (
                <div key={ad.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{ad.adName || '(sin nombre)'}</p>
                    {ad.claudeTriggers && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{ad.claudeTriggers}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center rounded-full border border-red-300 bg-red-100 text-red-800 px-2 py-0.5 text-xs font-semibold">
                      {ad.claudeScore}/10
                    </span>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${ad.status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                      {ad.status === 'Rejected' ? 'Rechazado' : ad.status}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </Section>
      )}

      {analyzed.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
            <p className="text-sm">Aún no hay anuncios con análisis de Claude.</p>
            <p className="text-xs mt-1">Pega el JSON de Claude en los anuncios guardados para generar aprendizajes.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {icon}{title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function MiniStat({ label, value, valueClass }: { label: string; value: number | string; valueClass?: string }) {
  return (
    <Card>
      <CardContent className="pt-3 pb-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${valueClass ?? ''}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
