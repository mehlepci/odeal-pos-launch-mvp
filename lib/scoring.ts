// Rule-based lead scoring. See DECISIONS.md D-005 for full reasoning.
// Every rule maps directly to a business value signal a POS sales team can verify.
//
// explainScore() returns the per-rule breakdown so the dashboard can show *why*
// a lead got its score — the system is transparent, not a black box. scoreLead()
// is the thin wrapper used at write-time (API route + seed).

export interface LeadInput {
  phone?: string | null
  company?: string | null
  companySize?: string | null
  industry?: string | null
  flowType: 'SALES_CONTACT' | 'SELF_SERVE'
}

export interface ScoreContribution {
  label: string
  points: number
}

export type ScoreLabel = 'LOW' | 'MEDIUM' | 'HIGH'

// Industries with the highest daily transaction volume → highest POS revenue potential.
export const HIGH_VALUE_INDUSTRIES = [
  'Restoran', 'Market', 'Kafe', 'Kuaför', 'Eczane',
  'Berber', 'Giyim Mağazası', 'Fırın', 'Pastane',
]

// Score thresholds → label. Exported so the dashboard legend stays in sync.
export const SCORE_THRESHOLDS = { HIGH: 70, MEDIUM: 40 } as const

// Static description of the rule set, for the dashboard "Puanlama Sistemi" legend.
export const SCORING_RULES: { label: string; points: number; reason: string }[] = [
  { label: 'Self-serve başvuru', points: 25, reason: 'Satış temsilcisi olmadan başvurdu — en güçlü niyet sinyali' },
  { label: 'Yüksek hacimli sektör', points: 25, reason: 'Restoran, market, kafe… günde yüzlerce kart işlemi = daha çok POS değeri' },
  { label: 'Çalışan sayısı ≥ 10', points: 20, reason: 'Daha büyük operasyon = daha çok POS cirosu' },
  { label: 'Çalışan sayısı 5–9', points: 10, reason: 'Orta ölçekli, yine değerli' },
  { label: 'Telefon bırakıldı', points: 15, reason: 'Aranmaya açık = daha sıcak lead' },
  { label: 'Firma adı verildi', points: 15, reason: 'Kurumsal bir işletme, sadece meraklı değil' },
]

// Maps a final score to its label. Exported so the API route can re-label after
// adding the async AI boost (lib/ai-scoring.ts) on top of the rule-based score.
export function labelForScore(score: number): ScoreLabel {
  return score >= SCORE_THRESHOLDS.HIGH ? 'HIGH' : score >= SCORE_THRESHOLDS.MEDIUM ? 'MEDIUM' : 'LOW'
}

// Returns the score AND the list of rules that fired (the breakdown).
export function explainScore(input: LeadInput): {
  score: number
  label: ScoreLabel
  contributions: ScoreContribution[]
} {
  const contributions: ScoreContribution[] = []

  // Self-serve = user actively chose to fill a longer form without a salesperson.
  if (input.flowType === 'SELF_SERVE')
    contributions.push({ label: 'Self-serve başvuru', points: 25 })

  // High-frequency industries: a restaurant processes 100+ card payments a day.
  if (input.industry && HIGH_VALUE_INDUSTRIES.includes(input.industry))
    contributions.push({ label: `Yüksek hacimli sektör (${input.industry})`, points: 25 })

  // Larger businesses process more transactions = more value per POS device.
  const size = parseInt(input.companySize ?? '0', 10)
  if (size >= 10)
    contributions.push({ label: `Çalışan sayısı ${input.companySize}`, points: 20 })
  else if (size >= 5)
    contributions.push({ label: `Çalışan sayısı ${input.companySize}`, points: 10 })

  // Phone = willing to be called back. Moves lead from digital to human pipeline faster.
  if (input.phone)
    contributions.push({ label: 'Telefon bırakıldı', points: 15 })

  // Company name = representing an established business, not just browsing.
  if (input.company)
    contributions.push({ label: 'Firma adı verildi', points: 15 })

  const score = Math.min(contributions.reduce((sum, c) => sum + c.points, 0), 100)
  return { score, label: labelForScore(score), contributions }
}

export function scoreLead(input: LeadInput): { score: number; label: ScoreLabel } {
  const { score, label } = explainScore(input)
  return { score, label }
}

export function scoreBadgeClass(label: string): string {
  if (label === 'HIGH') return 'bg-green-100 text-green-800'
  if (label === 'MEDIUM') return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}
