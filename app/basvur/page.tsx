'use client'

// Self-Serve Flow — "Hemen Başvur"
// Higher intent: user chooses to fill a longer form without a salesperson.
// Multi-step design: break cognitive load into 3 smaller chunks.
// Each step fires a GTM event so we can measure drop-off per step.
// See DECISIONS.md D-004 and D-005.

import { useState } from 'react'
import Link from 'next/link'
import { pushEvent } from '@/lib/gtm'
import { getUTMParams } from '@/lib/utm'

const INDUSTRIES = [
  'Restoran', 'Kafe', 'Market', 'Kuaför', 'Berber', 'Eczane',
  'Giyim Mağazası', 'Fırın', 'Pastane', 'Elektronik', 'Diğer',
]

const COMPANY_SIZES = ['1-4', '5-9', '10-19', '20-49', '50+']

type FormState = 'idle' | 'loading' | 'success' | 'error'

interface FormData {
  name: string
  email: string
  phone: string
  company: string
  industry: string
  companySize: string
  city: string
}

export default function BasvurPage() {
  const [step, setStep] = useState(1)
  const [state, setState] = useState<FormState>('idle')
  const [form, setForm] = useState<FormData>({
    name: '', email: '', phone: '',
    company: '', industry: '', companySize: '', city: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (step === 1 && Object.values(form).every((v) => v === '')) {
      pushEvent('form_start', { form_name: 'self_serve' })
    }
  }

  function handleNextStep() {
    pushEvent('form_step_complete', { form_name: 'self_serve', step })
    setStep((s) => s + 1)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')

    const { utmSource, utmMedium, utmCampaign } = getUTMParams()

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          flowType: 'SELF_SERVE',
          utmSource,
          utmMedium,
          utmCampaign,
        }),
      })

      if (!res.ok) throw new Error('API error')

      pushEvent('form_submit', { form_name: 'self_serve', utm_source: utmSource })
      setState('success')
    } catch {
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-extrabold text-blue-950 mb-2">Başvurunuz Alındı!</h2>
          <p className="text-gray-500 mb-2">
            <strong>{form.name}</strong>, başvurunuz başarıyla iletildi.
          </p>
          <p className="text-gray-500 mb-6">
            Onay bilgisi <strong>{form.email}</strong> adresine gönderilecek.
            1 iş günü içinde ekibimiz sizinle iletişime geçecek.
          </p>
          <Link href="/" className="inline-block bg-blue-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-800 transition-colors">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <nav className="bg-white border-b border-gray-100 px-4 h-14 flex items-center">
        <Link href="/" className="text-xl font-black text-blue-950">Ödeal</Link>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-block text-xs font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full uppercase tracking-widest mb-3">
            Online Başvuru
          </span>
          <h1 className="text-3xl font-extrabold text-blue-950 mb-2">Ödeal Akıllı POS Başvurusu</h1>
          <p className="text-gray-500">Hızlı, kolay, ücretsiz. 3 adımda tamamlayın.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${step > s ? 'bg-green-500 text-white' : step === s ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">

          {/* ── Step 1: Personal Info ── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-blue-950 mb-4">Kişisel Bilgiler</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Ad Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  name="name" type="text" required placeholder="Ahmet Yılmaz"
                  value={form.name} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  E-posta Adresi <span className="text-red-500">*</span>
                </label>
                <input
                  name="email" type="email" required placeholder="ahmet@firma.com"
                  value={form.email} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Telefon Numarası <span className="text-red-500">*</span>
                </label>
                <input
                  name="phone" type="tel" required placeholder="0532 000 00 00"
                  value={form.phone} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <button
                onClick={handleNextStep}
                disabled={!form.name || !form.email || !form.phone}
                className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-40 mt-2"
              >
                Devam Et →
              </button>
            </div>
          )}

          {/* ── Step 2: Business Info ── */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-blue-950 mb-4">İşletme Bilgileri</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Firma / İşletme Adı <span className="text-red-500">*</span>
                </label>
                <input
                  name="company" type="text" required placeholder="Yılmaz Restoran"
                  value={form.company} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Sektör <span className="text-red-500">*</span>
                </label>
                <select
                  name="industry" required value={form.industry} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                >
                  <option value="">Sektör seçin</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Çalışan Sayısı</label>
                <select
                  name="companySize" value={form.companySize} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                >
                  <option value="">Seçin (opsiyonel)</option>
                  {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s} kişi</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Şehir</label>
                <input
                  name="city" type="text" placeholder="İstanbul"
                  value={form.city} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-4 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  ← Geri
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={!form.company || !form.industry}
                  className="flex-1 bg-blue-900 text-white font-bold py-4 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-40"
                >
                  Devam Et →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Confirm ── */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-lg font-bold text-blue-950 mb-4">Özet ve Onay</h2>

              {/* Summary */}
              <div className="bg-blue-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Ad Soyad</span>
                  <span className="font-semibold text-gray-800">{form.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">E-posta</span>
                  <span className="font-semibold text-gray-800">{form.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Telefon</span>
                  <span className="font-semibold text-gray-800">{form.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Firma</span>
                  <span className="font-semibold text-gray-800">{form.company}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sektör</span>
                  <span className="font-semibold text-gray-800">{form.industry}</span>
                </div>
                {form.companySize && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Çalışan Sayısı</span>
                    <span className="font-semibold text-gray-800">{form.companySize} kişi</span>
                  </div>
                )}
              </div>

              {state === 'error' && (
                <p className="text-red-600 text-sm text-center">Bir hata oluştu. Lütfen tekrar deneyin.</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-4 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  ← Düzenle
                </button>
                <button
                  type="submit"
                  disabled={state === 'loading'}
                  className="flex-1 bg-blue-900 text-white font-bold py-4 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-60"
                >
                  {state === 'loading' ? 'Gönderiliyor...' : 'Başvur ✓'}
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center">
                Başvurunuz 1 iş günü içinde değerlendirilecektir.
              </p>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          Önce uzmanlarımızla konuşmak ister misiniz?{' '}
          <Link href="/iletisim" className="text-blue-700 font-semibold hover:underline">
            Sizi arayalım →
          </Link>
        </p>
      </div>
    </div>
  )
}
