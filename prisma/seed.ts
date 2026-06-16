// Seed file: creates 60 realistic mock leads spread over the last 30 days.
// Represents a realistic distribution for a Turkish B2B POS campaign:
// mix of high-frequency industries, different UTM sources, both flow types.

import 'dotenv/config'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../app/generated/prisma/client'
import { scoreLead } from '../lib/scoring'

// PrismaLibSql takes a Config object {url, authToken?} — not a client instance
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? 'file:./dev.db',
  authToken: process.env.DATABASE_AUTH_TOKEN,
})
const prisma = new PrismaClient({ adapter })

const NAMES = [
  'Ahmet Yılmaz', 'Mehmet Kaya', 'Ayşe Demir', 'Fatma Çelik', 'Ali Şahin',
  'Zeynep Arslan', 'Mustafa Öztürk', 'Hüseyin Koç', 'Emine Doğan', 'İbrahim Kurt',
  'Hatice Yıldız', 'Hasan Aydın', 'Elif Özkan', 'Yusuf Erdoğan', 'Merve Güner',
  'Ömer Polat', 'Selin Kılıç', 'Emre Bulut', 'Derya Çetin', 'Burak Yalçın',
]

const COMPANIES = [
  'Yılmaz Restoran', 'Kaya Market', 'Demir Kuaförü', 'Şahin Eczanesi', 'Arslan Kafe',
  'Öztürk Fırını', 'Koç Elektronik', 'Doğan Giyim', 'Kurt Pastanesi', 'Aydın Market',
  'Yıldız Berber', 'Erdoğan Lokantası', 'Güner Mağazası', 'Polat Kafe', 'Kılıç Eczane',
  'Bulut Restoran', 'Çetin Market', 'Yalçın Fırın', 'Öz Kebap', 'Lezzet Kafe',
]

const INDUSTRIES = [
  'Restoran', 'Market', 'Kuaför', 'Eczane', 'Kafe',
  'Fırın', 'Elektronik', 'Giyim Mağazası', 'Berber', 'Pastane',
]

const SIZES = ['1-4', '5-9', '10-19', '20-49']

const UTM_SOURCES = ['google', 'facebook', 'instagram', 'direct', 'email', 'google']
const UTM_MEDIUMS = ['cpc', 'social', 'organic', '', 'newsletter', 'cpc']
const UTM_CAMPAIGNS = ['pos_launch', 'pos_launch', 'influencer', '', 'q1_promo', 'brand']

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(randomInt(8, 21), randomInt(0, 59), 0, 0)
  return d
}

async function main() {
  console.log('Seeding 60 mock leads...')

  // Clear existing data
  await prisma.lead.deleteMany()

  for (let i = 0; i < 60; i++) {
    const srcIdx = randomInt(0, UTM_SOURCES.length - 1)
    const flowType = Math.random() > 0.45 ? 'SELF_SERVE' : 'SALES_CONTACT'
    const industry = randomPick(INDUSTRIES)
    const companySize = randomPick(SIZES)
    const phone = Math.random() > 0.3 ? `05${randomInt(30, 59)}${randomInt(1000000, 9999999)}` : undefined
    const company = randomPick(COMPANIES)

    const { score, label } = scoreLead({
      phone,
      company,
      companySize,
      industry,
      flowType: flowType as 'SELF_SERVE' | 'SALES_CONTACT',
    })

    await prisma.lead.create({
      data: {
        name: randomPick(NAMES),
        email: `lead${i}@example.com`,
        phone,
        company,
        companySize,
        industry,
        flowType,
        utmSource: UTM_SOURCES[srcIdx],
        utmMedium: UTM_MEDIUMS[srcIdx],
        utmCampaign: UTM_CAMPAIGNS[srcIdx],
        score,
        scoreLabel: label,
        createdAt: daysAgo(randomInt(0, 29)),
      },
    })
  }

  console.log('Done! 60 leads created.')
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
