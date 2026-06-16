// Rule-based lead scoring. See DECISIONS.md D-005 for full reasoning.
// Every rule maps directly to a business value signal that a POS sales team can verify.

export interface LeadInput {
  phone?: string
  company?: string
  companySize?: string
  industry?: string
  flowType: 'SALES_CONTACT' | 'SELF_SERVE'
}

// Industries with the highest daily transaction volume → highest POS revenue potential.
const HIGH_VALUE_INDUSTRIES = [
  'Restoran', 'Market', 'Kafe', 'Kuaför', 'Eczane',
  'Berber', 'Giyim Mağazası', 'Fırın', 'Pastane',
]

export function scoreLead(input: LeadInput): { score: number; label: 'LOW' | 'MEDIUM' | 'HIGH' } {
  let score = 0

  // Self-serve = user actively chose to fill a longer form without a salesperson nudging them.
  // This is the single strongest intent signal we have.
  if (input.flowType === 'SELF_SERVE') score += 25

  // Phone = willing to be called back. Moves lead from digital to human pipeline faster.
  if (input.phone) score += 15

  // Company name = they're representing an established business, not just browsing.
  if (input.company) score += 15

  // Larger businesses process more transactions = more value per POS device.
  const size = parseInt(input.companySize ?? '0', 10)
  if (size >= 10) score += 20
  else if (size >= 5) score += 10

  // High-frequency industries: a restaurant processes 100+ card payments a day.
  if (input.industry && HIGH_VALUE_INDUSTRIES.includes(input.industry)) score += 25

  return {
    score: Math.min(score, 100),
    label: score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW',
  }
}

export function scoreBadgeClass(label: string): string {
  if (label === 'HIGH') return 'bg-green-100 text-green-800'
  if (label === 'MEDIUM') return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}
