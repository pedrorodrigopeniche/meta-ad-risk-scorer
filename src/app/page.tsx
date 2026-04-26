'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { loadAds, deleteAd, exportCSV, clearImagePreviews } from '@/lib/storage'
import { STATUS_CONFIG, ACCOUNT_CONFIG, RISK_LEVEL_LABEL, VERDICT_CONFIG } from '@/lib/constants'
import type { Ad, SortField, SortDir } from '@/types'
import { AdCard } from '@/components/AdCard'
import { DeleteDialog } from '@/components/DeleteDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Plus, Search, AlertTriangle, Bot, TrendingDown, Lightbulb, ImageOff } from 'lucide-react'
import { toast } from 'sonner'

export default function DashboardPage() {
  const router = useRouter()
  const [ads, setAds] = useState<Ad[]>([])
  const [search, setSearch] = useState('')
  const [filterAccount, setFilterAccount] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterRisk, setFilterRisk] = useState('all')
  const [filterVerdict, setFilterVerdict] = useState('all')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => { setAds(loadAds()) }, [])

  const stats = useMemo(() => {
    if (ads.length === 0) return null
    const analyzed = ads.filter((a) => a.claudeScore !== undefined)
    const avgScore = analyzed.length
      ? (analyzed.reduce((s, a) => s + (a.claudeScore ?? 0), 0) / analyzed.length).toFixed(1)
      : '—'

    const byStatus = Object.fromEntries(
      (['Draft', 'Active', 'Off', 'Rejected'] as const).map((s) => [s, ads.filter((a) => a.status === s).length])
    )
    const byAccount = {
      'Bajar de Peso': ads.filter((a) => a.account === 'Bajar de Peso').length,
      'Control de Peso': ads.filter((a) => a.account === 'Control de Peso').length,
    }
    const byRisk = {
      Low: analyzed.filter((a) => a.claudeRiskLevel === 'Low').length,
      Medium: analyzed.filter((a) => a.claudeRiskLevel === 'Medium').length,
      High: analyzed.filter((a) => a.claudeRiskLevel === 'High').length,
      'Very High': analyzed.filter((a) => a.claudeRiskLevel === 'Very High').length,
    }
    const recentRejected = ads
      .filter((a) => a.status === 'Rejected')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 4)
    const topTriggers = getTopTriggers(analyzed, 6)

    return { total: ads.length, analyzed: analyzed.length, avgScore, byStatus, byAccount, byRisk, recentRejected, topTriggers }
  }, [ads])

  const filtered = useMemo(() => {
    let result = [...ads]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((a) =>
        a.adName.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        (a.claudeTriggers?.toLowerCase().includes(q) ?? false) ||
        (a.notes?.toLowerCase().includes(q) ?? false)
      )
    }
    if (filterAccount !== 'all') result = result.filter((a) => a.account === filterAccount)
    if (filterStatus !== 'all') result = result.filter((a) => a.status === filterStatus)
    if (filterRisk !== 'all') result = result.filter((a) => a.claudeRiskLevel === filterRisk)
    if (filterVerdict !== 'all') result = result.filter((a) => a.claudeVerdict === filterVerdict)

    result.sort((a, b) => {
      let cmp = 0
      if (sortField === 'claudeScore') cmp = (a.claudeScore ?? -1) - (b.claudeScore ?? -1)
      else if (sortField === 'createdAt') cmp = a.createdAt.localeCompare(b.createdAt)
      else cmp = a.updatedAt.localeCompare(b.updatedAt)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return result
  }, [ads, search, filterAccount, filterStatus, filterRisk, filterVerdict, sortField, sortDir])

  function confirmDelete() {
    if (!deleteId) return
    deleteAd(deleteId)
    setAds(loadAds())
    setDeleteId(null)
    toast.success('Anuncio eliminado')
  }

  function handleExport() {
    if (ads.length === 0) { toast.error('No hay anuncios para exportar'); return }
    exportCSV(filtered.length > 0 ? filtered : ads)
    toast.success('CSV exportado')
  }

  function handleClearImages() {
    clearImagePreviews()
    setAds(loadAds())
    toast.success('Imágenes eliminadas — análisis conservados')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Historial de anuncios evaluados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1.5" />Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearImages}>
            <ImageOff className="h-4 w-4 mr-1.5" />Limpiar imágenes guardadas
          </Button>
          <Button size="sm" onClick={() => router.push('/ideas')} variant="outline">
            <Lightbulb className="h-4 w-4 mr-1.5" />Aprendizajes
          </Button>
          <Button size="sm" onClick={() => router.push('/nuevo')}>
            <Plus className="h-4 w-4 mr-1.5" />Nuevo anuncio
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total" value={stats.total} />
            <StatCard label="Score Claude promedio" value={stats.avgScore} icon={<Bot className="h-4 w-4 text-violet-500" />} valueClass="text-violet-700" />
            <StatCard label="Alto / Muy Alto riesgo" value={(stats.byRisk.High ?? 0) + (stats.byRisk['Very High'] ?? 0)} valueClass="text-red-600" icon={<AlertTriangle className="h-4 w-4 text-red-500" />} />
            <StatCard label="Rechazados" value={stats.byStatus.Rejected ?? 0} valueClass="text-red-600" icon={<TrendingDown className="h-4 w-4 text-red-500" />} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* By status */}
            <Card>
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Por estado</p>
                <div className="flex flex-wrap gap-1.5">
                  {(['Draft', 'Active', 'Off', 'Rejected'] as const).map((s) => (
                    <span key={s} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_CONFIG[s].class}`}>
                      {STATUS_CONFIG[s].label} · {stats.byStatus[s] ?? 0}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* By account */}
            <Card>
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Por cuenta</p>
                <div className="flex flex-wrap gap-1.5">
                  {(['Bajar de Peso', 'Control de Peso'] as const).map((a) => (
                    <span key={a} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${ACCOUNT_CONFIG[a].class}`}>
                      {ACCOUNT_CONFIG[a].label} · {stats.byAccount[a] ?? 0}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top triggers */}
            <Card>
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Disparadores frecuentes</p>
                {stats.topTriggers.length === 0
                  ? <p className="text-xs text-muted-foreground">Sin datos aún</p>
                  : <div className="flex flex-wrap gap-1">
                      {stats.topTriggers.map(([t, n]) => (
                        <span key={t} className="inline-flex items-center rounded-full bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 text-xs">
                          {t} <span className="ml-1 opacity-60">·{n}</span>
                        </span>
                      ))}
                    </div>
                }
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre, copy, trigger…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <Select value={filterAccount} onValueChange={(v) => setFilterAccount(v ?? 'all')}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Cuenta" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las cuentas</SelectItem>
            <SelectItem value="Bajar de Peso">Bajar de Peso</SelectItem>
            <SelectItem value="Control de Peso">Control de Peso</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? 'all')}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Draft">Borrador</SelectItem>
            <SelectItem value="Active">Activo</SelectItem>
            <SelectItem value="Off">Pausado</SelectItem>
            <SelectItem value="Rejected">Rechazado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterRisk} onValueChange={(v) => setFilterRisk(v ?? 'all')}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Riesgo Claude" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los riesgos</SelectItem>
            <SelectItem value="Low">Bajo</SelectItem>
            <SelectItem value="Medium">Medio</SelectItem>
            <SelectItem value="High">Alto</SelectItem>
            <SelectItem value="Very High">Muy Alto</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterVerdict} onValueChange={(v) => setFilterVerdict(v ?? 'all')}>
          <SelectTrigger className="w-[190px]"><SelectValue placeholder="Veredicto" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los veredictos</SelectItem>
            <SelectItem value="Approved to test">Aprobado para probar</SelectItem>
            <SelectItem value="Revise before testing">Revisar antes de lanzar</SelectItem>
            <SelectItem value="Do not launch">No lanzar</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={`${sortField}-${sortDir}`}
          onValueChange={(v) => {
            if (!v) return
            const last = v.lastIndexOf('-')
            setSortField(v.slice(0, last) as SortField)
            setSortDir(v.slice(last + 1) as SortDir)
          }}
        >
          <SelectTrigger className="w-[190px]"><SelectValue placeholder="Ordenar" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt-desc">Más recientes</SelectItem>
            <SelectItem value="createdAt-asc">Más antiguos</SelectItem>
            <SelectItem value="claudeScore-desc">Mayor score Claude</SelectItem>
            <SelectItem value="claudeScore-asc">Menor score Claude</SelectItem>
            <SelectItem value="updatedAt-desc">Última edición</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-medium">
            {ads.length === 0 ? 'Sin anuncios guardados' : 'Sin resultados'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            {ads.length === 0
              ? 'Crea tu primer anuncio para empezar a registrar análisis de Claude.'
              : 'Intenta cambiar los filtros.'}
          </p>
          {ads.length === 0 && (
            <Button className="mt-4" onClick={() => router.push('/nuevo')}>
              <Plus className="h-4 w-4 mr-1.5" />Crear primer anuncio
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{filtered.length} anuncio{filtered.length !== 1 ? 's' : ''}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ad) => (
              <AdCard
                key={ad.id} ad={ad}
                onDelete={(id) => setDeleteId(id)}
                onUpdate={(updated) => setAds((prev) => prev.map((a) => a.id === updated.id ? updated : a))}
              />
            ))}
          </div>
        </>
      )}

      <DeleteDialog open={deleteId !== null} onCancel={() => setDeleteId(null)} onConfirm={confirmDelete} />
    </div>
  )
}

function StatCard({ label, value, icon, valueClass }: {
  label: string; value: number | string; icon?: React.ReactNode; valueClass?: string
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
          {icon}
        </div>
        <p className={`text-2xl font-bold mt-1 ${valueClass ?? ''}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

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
