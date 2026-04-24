export interface RiskFactor {
  id: string
  label: string
  description: string
  points: number
  category: 'critical' | 'high' | 'medium' | 'low'
}

export type AdStatus = 'Active' | 'Off' | 'Rejected' | 'Draft'
export type AdAccount = 'Bajar de Peso' | 'Control de Peso'

export interface ClaudeAnalysis {
  claudeScore?: number
  claudeRiskLevel?: string
  claudeVerdict?: string
  claudeTriggers?: string        // stored as comma-joined string
  claudeLikelyRejectionReason?: string
  claudeMetaInterpretation?: string
  claudeHowToFix?: string        // stored as newline-joined string
  claudeSafeRewrite?: string
  // legacy / extra
  claudeExplanation?: string
  claudeSuggestedRewrite?: string
}

export interface Ad extends ClaudeAnalysis {
  id: string
  adName: string
  account: AdAccount
  status: AdStatus
  content: string
  fileName?: string
  imageFileName?: string
  imageBase64?: string           // stored locally for preview
  notes: string
  createdAt: string
  updatedAt: string
  // Legacy rule-based fields kept for migration
  score?: number
  riskFactors?: RiskFactor[]
}

// Shape returned by /api/analyze-claude (or pasted JSON)
export interface ClaudeApiResult {
  adName?: string
  claudeScore: number
  claudeRiskLevel: 'Low' | 'Medium' | 'High' | 'Very High'
  claudeVerdict: 'Approved to test' | 'Revise before testing' | 'Do not launch'
  claudeTriggers: string[]
  claudeLikelyRejectionReason: string
  claudeMetaInterpretation: string
  claudeHowToFix: string[]
  claudeSafeRewrite: string
}

export type SortField = 'createdAt' | 'claudeScore' | 'updatedAt'
export type SortDir = 'asc' | 'desc'
