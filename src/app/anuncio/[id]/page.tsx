'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getAd, upsertAd, deleteAd } from '@/lib/storage'
import type { Ad, ClaudeAnalysis, AdAccount, AdStatus, ClaudeApiResult } from '@/types'
import { STATUSES, STATUS_CONFIG, ACCOUNTS, ACCOUNT_CONFIG } from '@/lib/constants'
import { ClaudeAnalysisForm } from '@/components/ClaudeAnalysisForm'
import { DeleteDialog } from '@/components/DeleteDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Save, Trash2, X, Upload } from 'lucide-react'
import { toast } from 'sonner'

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg']

export default function AdDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const imageInputRef = useRef<HTMLInputElement>(null)

  const [ad, setAd] = useState<Ad | null>(null)
  const [adName, setAdName] = useState('')
  const [account, setAccount] = useState<AdAccount>('Bajar de Peso')
  const [status, setStatus] = useState<AdStatus>('Draft')
  const [content, setContent] = useState('')
  const [notes, setNotes] = useState('')
  const [imageBase64, setImageBase64] = useState<string | undefined>()
  const [imageFileName, setImageFileName] = useState<string | undefined>()
  const [newImageFile, setNewImageFile] = useState<File | undefined>()
  const [claudeAnalysis, setClaudeAnalysis] = useState<ClaudeAnalysis>({})
  const [isDirty, setIsDirty] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    const found = getAd(params.id)
    if (!found) { setNotFound(true); return }
    setAd(found)
    setAdName(found.adName ?? '')
    setAccount(found.account ?? 'Bajar de Peso')
    setStatus(found.status ?? 'Draft')
    setContent(found.content ?? '')
    setNotes(found.notes ?? '')
    setImageBase64(found.imageBase64)
    setImageFileName(found.imageFileName)
    setClaudeAnalysis({
      claudeScore: found.claudeScore,
      claudeRiskLevel: found.claudeRiskLevel,
      claudeVerdict: found.claudeVerdict,
      claudeTriggers: found.claudeTriggers,
      claudeLikelyRejectionReason: found.claudeLikelyRejectionReason,
      claudeMetaInterpretation: found.claudeMetaInterpretation,
      claudeHowToFix: found.claudeHowToFix,
      claudeSafeRewrite: found.claudeSafeRewrite,
      claudeExplanation: found.claudeExplanation,
    })
  }, [params.id])

  const canAnalyze = !!content.trim() || !!newImageFile

  function handleImageFile(file: File) {
    if (!IMAGE_TYPES.includes(file.type)) { toast.error('Solo imágenes PNG/JPEG'); return }
    setNewImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setImageBase64(dataUrl.split(',')[1])
      setImageFileName(file.name)
      setIsDirty(true)
    }
    reader.readAsDataURL(file)
  }

  async function handleAnalyze() {
    setIsAnalyzing(true)
    try {
      const body: Record<string, string> = {}
      if (content.trim()) body.adCopy = content.trim()
      if (newImageFile) {
        const reader = new FileReader()
        const base64 = await new Promise<string>((res, rej) => {
          reader.onload = () => res((reader.result as string).split(',')[1])
          reader.onerror = rej
          reader.readAsDataURL(newImageFile)
        })
        body.imageBase64 = base64
        body.imageMediaType = newImageFile.type
        body.imageFileName = newImageFile.name
      } else if (imageBase64 && imageFileName) {
        // Re-send stored image
        body.imageBase64 = imageBase64
        body.imageMediaType = imageFileName.endsWith('.png') ? 'image/png' : 'image/jpeg'
        body.imageFileName = imageFileName
      }
      const res = await fetch('/api/analyze-claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Error al analizar'); return }
      const r = data as ClaudeApiResult
      const updated: ClaudeAnalysis = {
        ...claudeAnalysis,
        claudeScore: r.claudeScore,
        claudeRiskLevel: r.claudeRiskLevel,
        claudeVerdict: r.claudeVerdict,
        claudeTriggers: r.claudeTriggers.join(', '),
        claudeLikelyRejectionReason: r.claudeLikelyRejectionReason,
        claudeMetaInterpretation: r.claudeMetaInterpretation,
        claudeHowToFix: r.claudeHowToFix.join('\n'),
        claudeSafeRewrite: r.claudeSafeRewrite,
      }
      setClaudeAnalysis(updated)
      setIsDirty(true)
      toast.success('Análisis completado')
    } catch { toast.error('Error de red') }
    finally { setIsAnalyzing(false) }
  }

  function handleSave() {
    if (!ad) return
    if (!adName.trim()) { toast.error('El nombre del anuncio es obligatorio'); return }
    const updated: Ad = {
      ...ad,
      adName: adName.trim(),
      account,
      status,
      content: content.trim(),
      notes: notes.trim(),
      imageBase64,
      imageFileName,
      ...claudeAnalysis,
      updatedAt: new Date().toISOString(),
    }
    try {
      upsertAd(updated)
      setAd(updated)
      setIsDirty(false)
      toast.success('Anuncio actualizado')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  function confirmDelete() {
    if (!ad) return
    deleteAd(ad.id)
    toast.success('Anuncio eliminado')
    router.push('/')
  }

  if (notFound) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-lg font-medium">Anuncio no encontrado</p>
      <Button className="mt-4" onClick={() => router.push('/')}><ArrowLeft className="h-4 w-4 mr-1.5" />Volver</Button>
    </div>
  )

  if (!ad) return null

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4 mr-1" />Dashboard
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div>
            <h1 className="text-xl font-bold tracking-tight truncate max-w-xs">{ad.adName || 'Editar anuncio'}</h1>
            <p className="text-xs text-muted-foreground">
              Creado {new Date(ad.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isDirty && (
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1.5" />Guardar cambios
            </Button>
          )}
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-4 w-4 mr-1.5" />Eliminar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Información del anuncio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="adName">Nombre del anuncio</Label>
            <Input id="adName" value={adName} onChange={(e) => { setAdName(e.target.value); setIsDirty(true) }} />
          </div>

          {/* Account + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cuenta</Label>
              <Select value={account} onValueChange={(v) => { setAccount(v as AdAccount); setIsDirty(true) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCOUNTS.map((a) => (
                    <SelectItem key={a} value={a}>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium mr-1 ${ACCOUNT_CONFIG[a].class}`}>{a}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={status} onValueChange={(v) => { setStatus(v as AdStatus); setIsDirty(true) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium mr-1 ${STATUS_CONFIG[s].class}`}>{STATUS_CONFIG[s].label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Image */}
          <div className="space-y-2">
            <Label>Imagen del anuncio</Label>
            {imageBase64 && imageFileName ? (
              <div className="relative rounded-lg overflow-hidden border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:${imageFileName.endsWith('.png') ? 'image/png' : 'image/jpeg'};base64,${imageBase64}`}
                  alt="Ad preview" className="w-full object-contain max-h-64"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    className="bg-background/80 rounded-full p-1 hover:bg-background"
                    onClick={() => imageInputRef.current?.click()}
                    title="Reemplazar imagen"
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="bg-background/80 rounded-full p-1 hover:bg-background"
                    onClick={() => { setImageBase64(undefined); setImageFileName(undefined); setNewImageFile(undefined); setIsDirty(true) }}
                    title="Eliminar imagen"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="w-full text-sm text-muted-foreground border border-dashed rounded-lg px-4 py-6 hover:border-primary/50 transition-colors flex flex-col items-center gap-1"
                onClick={() => imageInputRef.current?.click()}
              >
                <Upload className="h-5 w-5 opacity-50" />
                <span>Subir imagen</span>
                <span className="text-xs opacity-60">.png · .jpg · .jpeg</span>
              </button>
            )}
            <input
              ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/jpg" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = '' }}
            />
          </div>

          {/* Copy */}
          <div className="space-y-1.5">
            <Label htmlFor="content">Copy del anuncio</Label>
            <Textarea id="content" rows={6} value={content}
              onChange={(e) => { setContent(e.target.value); setIsDirty(true) }}
              placeholder="Texto del anuncio…"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas internas</Label>
            <Textarea id="notes" rows={2} value={notes}
              onChange={(e) => { setNotes(e.target.value); setIsDirty(true) }}
              placeholder="Observaciones, campaña…"
            />
          </div>
        </CardContent>
      </Card>

      {/* Claude analysis */}
      <ClaudeAnalysisForm
        value={claudeAnalysis}
        onChange={(updated) => { setClaudeAnalysis(updated); setIsDirty(true) }}
        onAdNameSuggested={(name) => { if (!adName) { setAdName(name); setIsDirty(true) } }}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
        canAnalyze={canAnalyze || !!(imageBase64)}
      />

      {/* Bottom save */}
      {isDirty && (
        <div className="flex justify-end pb-4">
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-1.5" />Guardar cambios
          </Button>
        </div>
      )}

      <DeleteDialog open={showDelete} onCancel={() => setShowDelete(false)} onConfirm={confirmDelete} />
    </div>
  )
}
