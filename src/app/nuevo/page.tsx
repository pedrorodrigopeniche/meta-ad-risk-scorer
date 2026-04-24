'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { upsertAd } from '@/lib/storage'
import type { Ad, ClaudeAnalysis, AdAccount, AdStatus, ClaudeApiResult } from '@/types'
import { ACCOUNTS, STATUSES, STATUS_CONFIG, ACCOUNT_CONFIG } from '@/lib/constants'
import { ClaudeAnalysisForm } from '@/components/ClaudeAnalysisForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileText, ImageIcon, X, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg']

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function NuevoPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [adName, setAdName] = useState('')
  const [account, setAccount] = useState<AdAccount>('Bajar de Peso')
  const [status, setStatus] = useState<AdStatus>('Draft')
  const [content, setContent] = useState('')
  const [notes, setNotes] = useState('')
  const [fileName, setFileName] = useState<string | undefined>()
  const [imageFile, setImageFile] = useState<File | undefined>()
  const [imageFileName, setImageFileName] = useState<string | undefined>()
  const [imageBase64, setImageBase64] = useState<string | undefined>()
  const [claudeAnalysis, setClaudeAnalysis] = useState<ClaudeAnalysis>({})
  const [isDragging, setIsDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const canAnalyze = !!content.trim() || !!imageFile

  function handleFileRead(file: File) {
    if (IMAGE_TYPES.includes(file.type)) {
      setImageFile(file)
      setImageFileName(file.name)
      setFileName(undefined)
      // Read base64 for preview + storage
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setImageBase64(dataUrl.split(',')[1])
      }
      reader.readAsDataURL(file)
      return
    }
    if (!file.type.startsWith('text/') && file.type !== 'application/json') {
      toast.error('Tipo de archivo no soportado.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setContent(e.target?.result as string)
      setFileName(file.name)
      setImageFile(undefined)
      setImageFileName(undefined)
      setImageBase64(undefined)
    }
    reader.readAsText(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileRead(file)
  }, [])

  async function handleAnalyze() {
    if (!canAnalyze) return
    setIsAnalyzing(true)
    try {
      const body: Record<string, string> = {}
      if (content.trim()) body.adCopy = content.trim()
      if (imageFile) {
        body.imageBase64 = await fileToBase64(imageFile)
        body.imageMediaType = imageFile.type
        body.imageFileName = imageFile.name
      }
      const res = await fetch('/api/analyze-claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Error al analizar'); return }
      const r = data as ClaudeApiResult
      setClaudeAnalysis({
        claudeScore: r.claudeScore,
        claudeRiskLevel: r.claudeRiskLevel,
        claudeVerdict: r.claudeVerdict,
        claudeTriggers: r.claudeTriggers.join(', '),
        claudeLikelyRejectionReason: r.claudeLikelyRejectionReason,
        claudeMetaInterpretation: r.claudeMetaInterpretation,
        claudeHowToFix: r.claudeHowToFix.join('\n'),
        claudeSafeRewrite: r.claudeSafeRewrite,
      })
      if (r.adName && !adName) setAdName(r.adName)
      toast.success('Análisis completado')
    } catch {
      toast.error('Error de red al conectar con Claude')
    } finally {
      setIsAnalyzing(false)
    }
  }

  function handleSave() {
    if (!adName.trim()) { toast.error('El nombre del anuncio es obligatorio'); return }
    setSaving(true)
    const now = new Date().toISOString()
    const ad: Ad = {
      id: crypto.randomUUID(),
      adName: adName.trim(),
      account,
      status,
      content: content.trim(),
      fileName,
      imageFileName,
      imageBase64,
      notes: notes.trim(),
      ...claudeAnalysis,
      createdAt: now,
      updatedAt: now,
    }
    try {
      upsertAd(ad)
      toast.success('Anuncio guardado')
      router.push('/')
    } catch (err: unknown) {
      setSaving(false)
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo anuncio</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Registra el anuncio y pega el JSON de análisis de Claude.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Información del anuncio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="adName">Nombre del anuncio <span className="text-destructive">*</span></Label>
            <Input
              id="adName" placeholder="ej. Video pluma ozempic v1"
              value={adName} onChange={(e) => setAdName(e.target.value)}
            />
          </div>

          {/* Account + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cuenta</Label>
              <Select value={account} onValueChange={(v) => setAccount(v as AdAccount)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
              <Select value={status} onValueChange={(v) => setStatus(v as AdStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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

          {/* File upload */}
          <div className="space-y-2">
            <Label>Imagen del anuncio (opcional)</Label>
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50',
              )}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Arrastra o <span className="text-primary font-medium">selecciona</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">.png · .jpg · .jpeg · .txt</p>
              <input
                ref={fileInputRef} type="file"
                accept=".txt,text/*,image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileRead(f); e.target.value = '' }}
              />
            </div>

            {imageBase64 && imageFileName && (
              <div className="relative w-full rounded-lg overflow-hidden border bg-muted max-h-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:${imageFileName.endsWith('.png') ? 'image/png' : 'image/jpeg'};base64,${imageBase64}`}
                  alt="Preview" className="w-full object-contain max-h-48"
                />
                <button
                  className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-background"
                  onClick={() => { setImageFile(undefined); setImageFileName(undefined); setImageBase64(undefined) }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {fileName && !imageBase64 && (
              <div className="flex items-center gap-2 text-sm bg-muted rounded px-3 py-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate flex-1">{fileName}</span>
                <button onClick={() => { setFileName(undefined); setContent('') }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Copy text */}
          <div className="space-y-1.5">
            <Label htmlFor="content">Copy del anuncio (opcional)</Label>
            <Textarea id="content" placeholder="Pega el copy del anuncio…" rows={6} value={content}
              onChange={(e) => { setContent(e.target.value); if (fileName) setFileName(undefined) }}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas internas (opcional)</Label>
            <Textarea id="notes" placeholder="Observaciones, campaña…" rows={2} value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Claude analysis */}
      <ClaudeAnalysisForm
        value={claudeAnalysis}
        onChange={setClaudeAnalysis}
        onAdNameSuggested={(name) => { if (!adName) setAdName(name) }}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
        canAnalyze={canAnalyze}
      />

      {/* Actions */}
      <div className="flex gap-2 justify-end pb-4">
        <Button variant="outline" onClick={() => router.push('/')}>Cancelar</Button>
        <Button onClick={handleSave} disabled={!adName.trim() || saving}>
          <CheckCircle2 className="h-4 w-4 mr-1.5" />
          Guardar anuncio
        </Button>
      </div>
    </div>
  )
}
