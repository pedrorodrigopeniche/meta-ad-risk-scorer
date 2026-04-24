import type { AdAccount, AdStatus } from '@/types'

export const ACCOUNTS: AdAccount[] = ['Bajar de Peso', 'Control de Peso']

export const STATUSES: AdStatus[] = ['Draft', 'Active', 'Off', 'Rejected']

export const STATUS_CONFIG: Record<AdStatus, { label: string; class: string }> = {
  Active:   { label: 'Activo',    class: 'bg-green-100 text-green-800 border-green-300' },
  Off:      { label: 'Pausado',   class: 'bg-gray-100 text-gray-700 border-gray-300' },
  Rejected: { label: 'Rechazado', class: 'bg-red-100 text-red-800 border-red-300' },
  Draft:    { label: 'Borrador',  class: 'bg-amber-100 text-amber-800 border-amber-300' },
}

export const ACCOUNT_CONFIG: Record<AdAccount, { label: string; class: string }> = {
  'Bajar de Peso':   { label: 'Bajar de Peso',   class: 'bg-blue-100 text-blue-800 border-blue-300' },
  'Control de Peso': { label: 'Control de Peso',  class: 'bg-purple-100 text-purple-800 border-purple-300' },
}

export const RISK_LEVEL_CLASS: Record<string, string> = {
  Low:        'bg-green-100 text-green-800 border-green-300',
  Medium:     'bg-yellow-100 text-yellow-800 border-yellow-300',
  High:       'bg-red-100 text-red-800 border-red-300',
  'Very High':'bg-red-200 text-red-900 border-red-400',
}

export const RISK_LEVEL_LABEL: Record<string, string> = {
  Low:        'Bajo',
  Medium:     'Medio',
  High:       'Alto',
  'Very High':'Muy Alto',
}

export const VERDICT_CONFIG: Record<string, { label: string; class: string }> = {
  'Approved to test':      { label: 'Aprobado para probar',    class: 'bg-green-100 text-green-800 border-green-300' },
  'Revise before testing': { label: 'Revisar antes de lanzar', class: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  'Do not launch':         { label: 'No lanzar',               class: 'bg-red-100 text-red-800 border-red-300' },
}
