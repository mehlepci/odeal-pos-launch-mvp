// AI-powered urgency boost for the free-text `notes` field (DECISIONS.md D-005/D-010).
//
// The rule-based engine (lib/scoring.ts) can't read prose — a note like
// "POS cihazım bozuldu, acil ihtiyacım var" signals a hot, ready-to-buy lead that
// no structured field captures. This calls Claude to classify the note's urgency /
// purchase intent and returns a bounded point boost the API route adds on top of
// the rule score. The LLM only *classifies*; the points per class are fixed here,
// so the boost stays explainable and deterministic given the class.
//
// Degrades gracefully: empty note or missing ANTHROPIC_API_KEY → { points: 0 }.

import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'

export interface AiBoost {
  points: number
  reason: string
}

// Urgency class → fixed point boost. Keeps scoring auditable (the model picks the
// class; we own the points). Capped well below the rule weights so AI augments,
// never dominates, the score.
const URGENCY_POINTS = { none: 0, low: 10, high: 20 } as const

const UrgencySchema = z.object({
  urgency: z
    .enum(['none', 'low', 'high'])
    .describe('Notun satın alma niyeti / aciliyet seviyesi'),
  reason: z
    .string()
    .describe('Tek cümlelik, kısa Türkçe gerekçe (en fazla 12 kelime)'),
})

const SYSTEM_PROMPT = `Sen bir fiziki POS satış ekibi için lead skorlama asistanısın.
Sana bir potansiyel müşterinin iletişim formuna yazdığı serbest-metin not verilecek.
Notu, satın alma niyeti ve aciliyet açısından sınıflandır:
- "high": Acil ihtiyaç, mevcut POS bozuk/yetersiz, hemen geçiş isteği, fiyat/kurulum sorusu ("POS'um bozuldu acil", "bu hafta başlamam lazım").
- "low": Genel ilgi, karşılaştırma, ileri tarihli plan ("araştırıyorum", "ilerde lazım olabilir").
- "none": Aciliyet/niyet sinyali yok, alakasız ya da boş içerikli not.
Yalnızca nottaki kanıta dayan; abartma. Gerekçeyi kısa ve Türkçe yaz.`

export async function aiScoreBoost(notes?: string | null): Promise<AiBoost> {
  const note = notes?.trim()
  if (!note || !process.env.ANTHROPIC_API_KEY) {
    return { points: 0, reason: '' }
  }

  try {
    const client = new Anthropic()
    const response = await client.messages.parse({
      model: 'claude-opus-4-8',
      max_tokens: 256,
      thinking: { type: 'disabled' }, // simple classification — skip thinking for latency
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Not: """${note}"""` }],
      output_config: { format: zodOutputFormat(UrgencySchema) },
    })

    const parsed = response.parsed_output
    if (!parsed) return { points: 0, reason: '' }

    return { points: URGENCY_POINTS[parsed.urgency], reason: parsed.reason }
  } catch (err) {
    // Never let scoring fail the lead capture — log and fall back to no boost.
    console.error('[ai-scoring] boost failed:', err)
    return { points: 0, reason: '' }
  }
}
