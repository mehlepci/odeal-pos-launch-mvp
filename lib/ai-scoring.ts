// AI-powered urgency boost for the free-text `notes` field (DECISIONS.md D-005/D-010).
//
// The rule-based engine (lib/scoring.ts) can't read prose — a note like
// "POS cihazım bozuldu, acil ihtiyacım var" signals a hot, ready-to-buy lead that
// no structured field captures. This calls Google Gemini to classify the note's
// urgency / purchase intent and returns a bounded point boost the API route adds
// on top of the rule score. The LLM only *classifies*; the points per class are
// fixed here, so the boost stays explainable and deterministic given the class.
//
// Provider note: Gemini (not Claude) — see DECISIONS.md D-010. Uses the REST API
// directly (no SDK) with structured JSON output.
//
// Degrades gracefully: empty note or missing GEMINI_API_KEY → { points: 0 }.

export interface AiBoost {
  points: number
  reason: string
}

// Urgency class → fixed point boost. Keeps scoring auditable (the model picks the
// class; we own the points). Capped well below the rule weights so AI augments,
// never dominates, the score.
const URGENCY_POINTS = { none: 0, low: 10, high: 20 } as const
type Urgency = keyof typeof URGENCY_POINTS

const MODEL = 'gemini-2.0-flash'

const SYSTEM_PROMPT = `Sen bir fiziki POS satış ekibi için lead skorlama asistanısın.
Sana bir potansiyel müşterinin iletişim formuna yazdığı serbest-metin not verilecek.
Notu, satın alma niyeti ve aciliyet açısından sınıflandır:
- "high": Acil ihtiyaç, mevcut POS bozuk/yetersiz, hemen geçiş isteği, fiyat/kurulum sorusu ("POS'um bozuldu acil", "bu hafta başlamam lazım").
- "low": Genel ilgi, karşılaştırma, ileri tarihli plan ("araştırıyorum", "ilerde lazım olabilir").
- "none": Aciliyet/niyet sinyali yok, alakasız ya da boş içerikli not.
Yalnızca nottaki kanıta dayan; abartma. Gerekçeyi kısa ve Türkçe yaz (en fazla 12 kelime).`

export async function aiScoreBoost(notes?: string | null): Promise<AiBoost> {
  const note = notes?.trim()
  const apiKey = process.env.GEMINI_API_KEY
  if (!note || !apiKey) {
    return { points: 0, reason: '' }
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: `Not: """${note}"""` }] }],
          generationConfig: {
            temperature: 0,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'object',
              properties: {
                urgency: { type: 'string', enum: ['none', 'low', 'high'] },
                reason: { type: 'string' },
              },
              required: ['urgency', 'reason'],
            },
          },
        }),
      }
    )

    if (!res.ok) {
      console.error(`[ai-scoring] Gemini error: ${res.status} ${await res.text()}`)
      return { points: 0, reason: '' }
    }

    const data = await res.json()
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return { points: 0, reason: '' }

    const parsed = JSON.parse(text) as { urgency?: string; reason?: string }
    const urgency = (parsed.urgency ?? 'none') as Urgency
    if (!(urgency in URGENCY_POINTS)) return { points: 0, reason: '' }

    return { points: URGENCY_POINTS[urgency], reason: parsed.reason ?? '' }
  } catch (err) {
    // Never let scoring fail the lead capture — log and fall back to no boost.
    console.error('[ai-scoring] boost failed:', err)
    return { points: 0, reason: '' }
  }
}
