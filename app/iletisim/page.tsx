'use client'

// Sales Contact Flow — "Sizi Arayalım"
// Low-friction: only 4 required fields. Goal: capture phone number so sales team can call.
// See DECISIONS.md D-004 for why this is separate from the self-serve flow.

import { useState } from 'react'
import Link from 'next/link'
import { pushEvent } from '@/lib/gtm'
import { getUTMParams } from '@/lib/utm'

const INDUSTRIES = [
  'Restoran', 'Kafe', 'Market', 'Kuaför', 'Berber', 'Eczane',
  'Giyim Mağazası', 'Fırın', 'Pastane', 'Elektronik', 'Diğer',
]

type FormState = 'idle' | 'loading' | 'success' | 'error'

export default function IletisimPage() {
  const [state, setState] = useState<FormState>('idle')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    company: '',
    industry: '',
    notes: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))

    // Fire form_start on first keystroke
    if (Object.values(form).every((v) => v === '')) {
      pushEvent('form_start', { form_name: 'sales_contact' })
    }
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
          name: form.name,
          email: `${form.phone.replace(/\s/g, '')}@phone-lead.local`, // phone-only leads get a placeholder email
          phone: form.phone,
          company: form.company,
          industry: form.industry,
          flowType: 'SALES_CONTACT',
          utmSource,
          utmMedium,
          utmCampaign,
          notes: form.notes,
        }),
      })

      if (!res.ok) throw new Error('API error')

      pushEvent('form_submit', { form_name: 'sales_contact', utm_source: utmSource })
      setState('success')
    } catch {
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-extrabold text-blue-950 mb-2">Talebiniz Alındı!</h2>
          <p className="text-gray-500 mb-6">
            Satış ekibimiz en kısa sürede <strong>{form.phone}</strong> numaralı telefonunuzu arayacak.
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
      {/* Mini navbar */}
      <nav className="bg-white border-b border-gray-100 px-4 h-14 flex items-center">
        <Link href="/" className="text-xl font-black text-blue-950">Ödeal</Link>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-block text-xs font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full uppercase tracking-widest mb-3">
            Sizi Arayalım
          </span>
          <h1 className="text-3xl font-extrabold text-blue-950 mb-2">
            Uzmanlarımız Sizi Arasın
          </h1>
          <p className="text-gray-500">
            Numaranızı bırakın, POS danışmanımız tüm sorularınızı yanıtlasın.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-5">

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Ad Soyad <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="Ahmet Yılmaz"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Telefon Numarası <span className="text-red-500">*</span>
            </label>
            <input
              name="phone"
              type="tel"
              required
              placeholder="0532 000 00 00"
              value={form.phone}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Firma Adı</label>
            <input
              name="company"
              type="text"
              placeholder="Yılmaz Restoran"
              value={form.company}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Sektör</label>
            <select
              name="industry"
              value={form.industry}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            >
              <option value="">Sektör seçin (opsiyonel)</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Notunuz (opsiyonel)</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="POS hakkında sormak istediğiniz bir şey var mı?"
              value={form.notes}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {state === 'error' && (
            <p className="text-red-600 text-sm text-center">
              Bir hata oluştu. Lütfen tekrar deneyin.
            </p>
          )}

          <button
            type="submit"
            disabled={state === 'loading'}
            className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-60 text-base"
          >
            {state === 'loading' ? 'Gönderiliyor...' : 'Aranmak İstiyorum →'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Bilgileriniz yalnızca Ödeal tarafından kullanılır.
          </p>
        </form>

        <p className="text-center mt-6 text-sm text-gray-500">
          Kendiniz başvurmak ister misiniz?{' '}
          <Link href="/basvur" className="text-blue-700 font-semibold hover:underline">
            Online başvuru →
          </Link>
        </p>
      </div>
    </div>
  )
}
