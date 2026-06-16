import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const now = Date.now()
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000)

  const [total, recentLeads, byFlow, byScore, bySource, thisWeek, lastWeek] = await Promise.all([
    prisma.lead.count(),

    // Fetch raw leads for the last 30 days — we aggregate by day in JS
    // (avoids SQLite-specific date functions that differ from Postgres)
    prisma.lead.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),

    prisma.lead.groupBy({ by: ['flowType'], _count: { _all: true } }),
    prisma.lead.groupBy({ by: ['scoreLabel'], _count: { _all: true } }),

    prisma.lead.groupBy({
      by: ['utmSource'],
      _count: { _all: true },
      orderBy: { _count: { utmSource: 'desc' } },
      take: 6,
    }),

    prisma.lead.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.lead.count({ where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
  ])

  // Group by day in JavaScript — same query works for SQLite and Postgres
  const dailyMap: Record<string, number> = {}
  for (const lead of recentLeads) {
    const day = lead.createdAt.toISOString().split('T')[0]
    dailyMap[day] = (dailyMap[day] ?? 0) + 1
  }
  const daily = Object.entries(dailyMap).map(([date, count]) => ({ date, count }))

  return NextResponse.json({ total, thisWeek, lastWeek, byFlow, byScore, bySource, daily })
}
