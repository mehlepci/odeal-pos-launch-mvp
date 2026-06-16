'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { pushEvent } from '@/lib/gtm'
import { persistUTMParams } from '@/lib/utm'

const FEATURES = [
  { icon: '💳', title: '%0 Komisyon', desc: 'POS kazançlarınız hiçbir komisyon kesintisi olmadan hesabınıza aktarılır.' },
  { icon: '⚡', title: 'Ertesi Gün Transfer', desc: 'Hafta sonları ve resmi tatiller dahil, haftanın 7 günü ertesi gün para hesabınızda.' },
  { icon: '🏦', title: 'Tüm Banka Kartları', desc: 'Tek sözleşmeyle Visa, Mastercard, Troy ve tüm anlaşmalı banka kartlarını kabul edin.' },
  { icon: '📅', title: '12 Aya Taksit', desc: 'Paraf, World, CardFinans, Axess ve Bonus kartlarla 12 aya varan taksit imkânı.' },
  { icon: '📱', title: 'Dokunmatik Ekran', desc: 'Android tabanlı 5.5" renkli dokunmatik ekran, termal yazıcı ve NFC chip dahil.' },
  { icon: '🛡️', title: 'TCMB Lisanslı', desc: 'Türkiye Cumhuriyet Merkez Bankası onaylı ödeme kuruluşu güvencesiyle.' },
]

const STEPS = [
  { number: '01', title: 'Online Başvurun', desc: '2 dakikada formu doldurun. Belge yükleyin.' },
  { number: '02', title: 'Hızlı Onay', desc: '1 iş günü içinde başvurunuz değerlendirilir.' },
  { number: '03', title: 'Cihaz Gelsin', desc: 'POS cihazı adresinize ücretsiz kargo ile gelir.' },
  { number: '04', title: 'Ödeme Alın', desc: 'İlk günden tüm kartları kabul etmeye başlayın.' },
]

const STATS = [
  { value: '125.000+', label: 'Üye İşyeri' },
  { value: '10+', label: 'Yıl Deneyim' },
  { value: '7/24', label: 'Teknik Destek' },
  { value: '%0', label: 'Komisyon' },
]

export default function LandingPage() {
  useEffect(() => {
    persistUTMParams()
    pushEvent('page_view', { page_title: 'Landing Page', page_location: window.location.href })
  }, [])

  function handleCTAClick(label: string, location: string) {
    pushEvent('cta_click', { cta_label: label, cta_location: location })
  }

  return (
    <div className="min-h-screen">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black text-blue-950 tracking-tight">Ödeal</span>
            <span className="hidden sm:inline text-xs font-bold bg-blue-950 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
              Akıllı POS
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#ozellikler" className="hover:text-blue-900 transition-colors">Özellikler</a>
            <a href="#nasil-calisir" className="hover:text-blue-900 transition-colors">Nasıl Çalışır?</a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/iletisim"
              onClick={() => handleCTAClick('Sizi Arayalım', 'navbar')}
              className="hidden sm:inline-flex text-sm font-semibold text-blue-950 border-2 border-blue-950 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Sizi Arayalım
            </Link>
            <Link
              href="/basvur"
              onClick={() => handleCTAClick('Hemen Başvur', 'navbar')}
              className="text-sm font-bold bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
            >
              Hemen Başvur
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white py-20 sm:py-28 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-xs font-bold bg-blue-700 text-blue-100 px-3 py-1 rounded-full uppercase tracking-widest mb-4">
              ✦ Yeni Ürün
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5">
              İşletmenize Özel<br />
              <span className="text-blue-300">Akıllı POS Cihazı</span>
            </h1>
            <p className="text-lg text-blue-100 mb-8 leading-relaxed max-w-md">
              Tek sözleşmeyle tüm banka kartlarını kabul edin.
              Kazançlarınız <strong className="text-white">%0 komisyonla</strong> ertesi gün hesabınızda.
              Hafta sonu, tatil fark etmez.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link
                href="/basvur"
                onClick={() => handleCTAClick('Hemen Başvur', 'hero')}
                className="inline-flex items-center justify-center bg-white text-blue-900 font-bold px-7 py-4 rounded-xl hover:bg-blue-50 transition-all shadow-lg text-base"
              >
                Hemen Başvur →
              </Link>
              <Link
                href="/iletisim"
                onClick={() => handleCTAClick('Sizi Arayalım', 'hero')}
                className="inline-flex items-center justify-center border-2 border-white/40 text-white font-semibold px-7 py-4 rounded-xl hover:bg-white/10 transition-all text-base"
              >
                📞 Sizi Arayalım
              </Link>
            </div>
            <p className="text-blue-300 text-sm">
              ✓ Ücretsiz kurulum &nbsp;·&nbsp; ✓ Minimum ciro şartı yok &nbsp;·&nbsp; ✓ Gizli ücret yok
            </p>
          </div>

          {/* Stylised POS device — pure CSS/HTML, no image assets needed */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-52 h-80 bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-gray-700 flex flex-col items-center justify-between py-6 px-4">
                <div className="w-full h-44 bg-blue-900 rounded-xl border border-blue-700 flex flex-col items-center justify-center gap-2">
                  <span className="text-4xl">💳</span>
                  <span className="text-white text-xs font-bold tracking-wide">ÖDEAL AKILLI POS</span>
                  <div className="flex gap-1 mt-1">
                    <div className="w-6 h-1 bg-blue-400 rounded-full" />
                    <div className="w-6 h-1 bg-blue-700 rounded-full" />
                    <div className="w-6 h-1 bg-blue-700 rounded-full" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 w-full px-2">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="h-5 bg-gray-700 rounded-md" />
                  ))}
                </div>
                <div className="w-3/4 h-2 bg-gray-600 rounded-full" />
              </div>
              <div className="absolute inset-0 -z-10 bg-blue-500/20 rounded-3xl blur-3xl scale-110" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <div className="bg-white border-b border-gray-100 py-6 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-900">{s.value}</div>
              <div className="text-sm text-gray-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section id="ozellikler" className="py-20 px-4 bg-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-blue-950 mb-3">Neden Ödeal Akıllı POS?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              İşletmenizin ihtiyacına göre tasarlandı. Karmaşık sözleşme yok, gizli ücret yok.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="text-lg font-bold text-blue-950 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="nasil-calisir" className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-blue-950 mb-3">4 Adımda POS Sahibi Olun</h2>
            <p className="text-gray-500">İşletmenizi terk etmeden, tamamen online başvurun.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, idx) => (
              <div key={step.number} className="relative">
                {idx < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-full w-full h-0.5 bg-blue-100 z-0" />
                )}
                <div className="relative z-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-900 text-white font-extrabold text-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
                    {step.number}
                  </div>
                  <h3 className="font-bold text-blue-950 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-900 to-blue-800 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold mb-3">Başvurun, cihazı kapınıza getirelim.</h2>
          <p className="text-blue-200 mb-8 text-lg">
            Online başvuru 2 dakika sürer. Yoksa satış ekibimiz sizi arasın.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/basvur"
              onClick={() => handleCTAClick('Hemen Başvur', 'cta_banner')}
              className="inline-flex items-center justify-center bg-white text-blue-900 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-all shadow-lg text-base"
            >
              Hemen Başvur →
            </Link>
            <Link
              href="/iletisim"
              onClick={() => handleCTAClick('Sizi Arayalım', 'cta_banner')}
              className="inline-flex items-center justify-center border-2 border-white/40 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition-all text-base"
            >
              Sizi Arayalım
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-blue-950 text-blue-300 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <span className="text-white font-extrabold text-xl">Ödeal</span>
          <p className="text-center">Ödeal Ödeme Kuruluşu A.Ş. — TCMB Lisanslı Ödeme Kuruluşu</p>
          <p>© {new Date().getFullYear()} Tüm hakları saklıdır.</p>
        </div>
      </footer>

    </div>
  )
}
