import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { scoreLead } from '@/lib/scoring'
import { trackServerEvent } from '@/lib/ga4'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, phone, company, companySize, industry, flowType, utmSource, utmMedium, utmCampaign, notes } = body

  if (!name || !email || !flowType) {
    return NextResponse.json({ error: 'name, email ve flowType zorunludur' }, { status: 400 })
  }

  const { score, label } = scoreLead({ phone, company, companySize, industry, flowType })

  const lead = await prisma.lead.create({
    data: {
      name, email, phone, company, companySize, industry,
      flowType, utmSource, utmMedium, utmCampaign,
      score, scoreLabel: label, notes,
    },
  })

  // Server-side GA4 event — bypasses ad blockers, more reliable than client-side
  await trackServerEvent('lead_created', {
    flow_type: flowType,
    score,
    industry: industry ?? 'unknown',
    source: utmSource ?? 'direct',
  })

  return NextResponse.json({ success: true, leadId: lead.id, score, scoreLabel: label })
}

export async function GET() {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(leads)
}
