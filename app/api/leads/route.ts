import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { scoreLead, labelForScore } from '@/lib/scoring'
import { aiScoreBoost } from '@/lib/ai-scoring'
import { trackServerEvent } from '@/lib/ga4'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, phone, company, companySize, industry, flowType, utmSource, utmMedium, utmCampaign, notes } = body

  if (!name || !email || !flowType) {
    return NextResponse.json({ error: 'name, email ve flowType zorunludur' }, { status: 400 })
  }

  // Rule-based score first, then an AI boost from the free-text note (if any).
  const rule = scoreLead({ phone, company, companySize, industry, flowType })
  const ai = await aiScoreBoost(notes)
  const score = Math.min(rule.score + ai.points, 100)
  const scoreLabel = labelForScore(score)

  const lead = await prisma.lead.create({
    data: {
      name, email, phone, company, companySize, industry,
      flowType, utmSource, utmMedium, utmCampaign,
      score, scoreLabel, notes,
      aiScore: ai.points, aiReason: ai.reason || null,
    },
  })

  // Server-side GA4 event — bypasses ad blockers, more reliable than client-side
  await trackServerEvent('lead_created', {
    flow_type: flowType,
    score,
    ai_score: ai.points,
    industry: industry ?? 'unknown',
    source: utmSource ?? 'direct',
  })

  return NextResponse.json({ success: true, leadId: lead.id, score, scoreLabel })
}

export async function GET() {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(leads)
}
