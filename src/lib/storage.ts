import type { Ad, AdAccount, AdStatus } from '@/types'

const STORAGE_KEY = 'meta_ad_risk_scorer_ads'

/** Apply defaults for fields added after v1, so old records stay valid. */
function migrate(raw: Record<string, unknown>): Ad {
  return {
    ...(raw as unknown as Ad),
    adName:   (raw.adName  as string    | undefined) ?? '',
    account:  (raw.account as AdAccount | undefined) ?? 'Bajar de Peso',
    status:   (raw.status  as AdStatus  | undefined) ?? 'Draft',
    notes:    (raw.notes   as string    | undefined) ?? '',
  }
}

export function loadAds(): Ad[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return (JSON.parse(raw) as Record<string, unknown>[]).map(migrate)
  } catch {
    return []
  }
}

export function saveAds(ads: Ad[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ads))
  } catch {
    // localStorage quota exceeded — caller should handle
    throw new Error('El almacenamiento local está lleno. Puedes limpiar imágenes guardadas sin borrar tus análisis.')
  }
}

export function getAd(id: string): Ad | undefined {
  return loadAds().find((a) => a.id === id)
}

export function upsertAd(ad: Ad): void {
  const ads = loadAds()
  const idx = ads.findIndex((a) => a.id === ad.id)
  if (idx >= 0) ads[idx] = ad
  else ads.unshift(ad)
  saveAds(ads)
}

export function deleteAd(id: string): void {
  saveAds(loadAds().filter((a) => a.id !== id))
}

/** Remove imageBase64 from every ad, keeping all analysis data. */
export function clearImagePreviews(): void {
  const ads = loadAds()
  saveAds(ads.map((ad) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { imageBase64: _img, ...rest } = ad
    return rest as Ad
  }))
}

export function exportCSV(ads: Ad[]): void {
  const headers = [
    'ID',
    'Nombre del anuncio',
    'Cuenta',
    'Estado',
    'Score Claude',
    'Nivel Riesgo (Claude)',
    'Veredicto Claude',
    'Disparadores',
    'Motivo probable de rechazo',
    'Cómo lo interpreta Meta',
    'Cómo corregirlo',
    'Reescritura segura',
    'Notas',
    'Archivo',
    'Fecha Creación',
    'Fecha Actualización',
    'Copy del anuncio',
  ]

  const rows = ads.map((ad) => [
    ad.id,
    ad.adName,
    ad.account,
    ad.status,
    ad.claudeScore ?? '',
    ad.claudeRiskLevel ?? '',
    ad.claudeVerdict ?? '',
    ad.claudeTriggers ?? '',
    ad.claudeLikelyRejectionReason ?? '',
    ad.claudeMetaInterpretation ?? '',
    (ad.claudeHowToFix ?? '').replace(/\n/g, ' | '),
    ad.claudeSafeRewrite ?? '',
    ad.notes,
    ad.imageFileName ?? ad.fileName ?? '',
    new Date(ad.createdAt).toLocaleString('es-MX'),
    new Date(ad.updatedAt).toLocaleString('es-MX'),
    ad.content.replace(/\n/g, ' ').replace(/"/g, '""'),
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell)}"`).join(','))
    .join('\n')

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `meta-ads-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
