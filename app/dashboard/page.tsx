'use client'

// Marcom Dashboard — internal tool for the ÖdeAl growth team.
// See DECISIONS.md D-007 (auth) and D-008 (metric selection).
//
// Auth: simple client-side password gate. MVP tradeoff — see D-007.
// Data: fetched via useEffect from /api/leads and /api/metrics.

import { useState, useEffect, Fragment } from 'react'
import Link from 'next/link'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { scoreBadgeClass, explainScore, SCORING_RULES } from '@/lib/scoring'

// ─── Types ───────────────────────────────────────────────

interface Lead {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  companySize: string | null
  industry: string | null
  flowType: string
  utmSource: string | null
  score: number
  scoreLabel: string
  notes: string | null
  aiScore: number
  aiReason: string | null
  createdAt: string
}

interface Metrics {
  total: number
  thisWeek: number
  lastWeek: number
  avgScore: number
  byFlow: { flowType: string; _count: { _all: number } }[]
  byScore: { scoreLabel: string; _count: { _all: number } }[]
  bySource: { utmSource: string | null; _count: { _all: number } }[]
  industry: { industry: string; count: number; avgScore: number }[]
  daily: { date: string; count: number }[]
}

// ─── Password Gate ────────────────────────────────────────

const DASHBOARD_PASSWORD = 'odeal2026'

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (input === DASHBOARD_PASSWORD) {
      sessionStorage.setItem('dash_auth', '1')
      onAuth()
    } else {
      setError(true)
      setInput('')
    }
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-xl font-extrabold text-blue-950 mb-1">Marcom Dashboard</h2>
        <p className="text-gray-400 text-sm mb-6">Sadece Ödeal ekibi için</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Şifre"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(false) }}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center"
          />
          {error && <p className="text-red-500 text-sm">Hatalı şifre. Tekrar deneyin.</p>}
          <button
            type="submit"
            className="w-full bg-blue-900 text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition-colors"
          >
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Metric Card ─────────────────────────────────────────

function MetricCard({
  label, value, sub, subUp,
}: {
  label: string
  value: string | number
  sub?: string
  subUp?: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-extrabold text-blue-950">{value}</p>
      {sub && (
        <p className={`text-xs font-semibold mt-1 ${subUp ? 'text-green-600' : 'text-gray-400'}`}>
          {sub}
        </p>
      )}
    </div>
  )
}

// ─── Score Badge ─────────────────────────────────────────

function ScoreBadge({ label }: { label: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${scoreBadgeClass(label)}`}>
      {label}
    </span>
  )
}

// ─── Main Dashboard ──────────────────────────────────────

export default function DashboardPage() {
  const [authed, setAuthed] = useState(false)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [filter, setFilter] = useState<'ALL' | 'SELF_SERVE' | 'SALES_CONTACT'>('ALL')
  const [scoreFilter, setScoreFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionStorage.getItem('dash_auth') === '1') setAuthed(true)
  }, [])

  useEffect(() => {
    if (!authed) return
    async function fetchData() {
      setLoading(true)
      const [mRes, lRes] = await Promise.all([
        fetch('/api/metrics'),
        fetch('/api/leads'),
      ])
      setMetrics(await mRes.json())
      setLeads(await lRes.json())
      setLoading(false)
    }
    fetchData()
  }, [authed])

  // Reset to the first page whenever the filters change, so the user isn't
  // stranded on a page that no longer exists for the new result set.
  useEffect(() => {
    setPage(1)
    setExpandedId(null)
  }, [filter, scoreFilter])

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />

  // ── Derived values ──
  const selfServe = metrics?.byFlow.find((f) => f.flowType === 'SELF_SERVE')?._count._all ?? 0
  const salesContact = metrics?.byFlow.find((f) => f.flowType === 'SALES_CONTACT')?._count._all ?? 0
  const highLeads = metrics?.byScore.find((s) => s.scoreLabel === 'HIGH')?._count._all ?? 0
  const weeklyDiff = (metrics?.thisWeek ?? 0) - (metrics?.lastWeek ?? 0)
  const pace90 = metrics ? Math.round((metrics.total / 14) * 90) : 0

  const filteredLeads = leads.filter((l) => {
    const flowOk = filter === 'ALL' || l.flowType === filter
    const scoreOk = scoreFilter === 'ALL' || l.scoreLabel === scoreFilter
    return flowOk && scoreOk
  })

  // ── Pagination (client-side; dataset is small enough to load in one fetch) ──
  const PAGE_SIZE = 10
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pagedLeads = filteredLeads.slice(pageStart, pageStart + PAGE_SIZE)

  const sourceData = (metrics?.bySource ?? []).map((s) => ({
    name: s.utmSource ?? 'direct',
    count: s._count._all,
  }))

  // İşletme analizi: leads per industry + their average score, highest volume first.
  const industryData = metrics?.industry ?? []
  const maxIndustryCount = Math.max(1, ...industryData.map((i) => i.count))

  const BAR_COLORS = ['#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-black text-blue-950">Ödeal</Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-semibold text-gray-500">Marcom Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-semibold text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            ← Landing Page
          </Link>
          <button
            onClick={() => { sessionStorage.removeItem('dash_auth'); setAuthed(false) }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Çıkış
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
            Veriler yükleniyor...
          </div>
        ) : (
          <>
            {/* ── Section header ── */}
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-blue-950">Lead Paneli</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Hedef: 2.500 lead / 90 gün &nbsp;·&nbsp; Mevcut pace: ~{pace90} lead / 90 gün
              </p>
            </div>

            {/* ── Metric Cards (5 — see DECISIONS.md D-008) ── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <MetricCard
                label="Toplam Lead"
                value={metrics?.total ?? 0}
                sub={weeklyDiff >= 0 ? `+${weeklyDiff} bu hafta` : `${weeklyDiff} bu hafta`}
                subUp={weeklyDiff > 0}
              />
              <MetricCard
                label="Self-Serve"
                value={selfServe}
                sub={`${metrics?.total ? Math.round((selfServe / metrics.total) * 100) : 0}% toplam`}
              />
              <MetricCard
                label="Sizi Arayalım"
                value={salesContact}
                sub={`${metrics?.total ? Math.round((salesContact / metrics.total) * 100) : 0}% toplam`}
              />
              <MetricCard
                label="Yüksek Kalite"
                value={highLeads}
                sub="Skor ≥ 70"
                subUp={highLeads > 0}
              />
              <MetricCard
                label="Bu Hafta"
                value={metrics?.thisWeek ?? 0}
                sub={`Geçen hafta: ${metrics?.lastWeek ?? 0}`}
                subUp={(metrics?.thisWeek ?? 0) >= (metrics?.lastWeek ?? 0)}
              />
            </div>

            {/* ── Charts ── */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">

              {/* Daily trend */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-700 mb-4">Günlük Lead Trendi (Son 30 Gün)</h2>
                {(metrics?.daily?.length ?? 0) > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={metrics?.daily}>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        tickFormatter={(v: string) => v.slice(5)}
                      />
                      <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
                      <Tooltip
                        formatter={(v) => [v, 'Lead']}
                        labelFormatter={(l) => String(l)}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#1e40af"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-44 flex items-center justify-center text-gray-300 text-sm">
                    Henüz veri yok
                  </div>
                )}
              </div>

              {/* Source breakdown */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-700 mb-4">Kaynak Dağılımı (Top UTM Sources)</h2>
                {sourceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={sourceData} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} width={60} />
                      <Tooltip formatter={(v) => [v, 'Lead']} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {sourceData.map((_, i) => (
                          <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-44 flex items-center justify-center text-gray-300 text-sm">
                    Henüz veri yok
                  </div>
                )}
              </div>
            </div>

            {/* ── İşletme & Skor Analizi ── */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">

              {/* Industry breakdown with average score — makes the point system legible */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="text-sm font-bold text-gray-700">Sektöre Göre İşletmeler & Ortalama Skor</h2>
                  <span className="text-xs text-gray-400">Genel ort. skor: <strong className="text-blue-900">{metrics?.avgScore ?? 0}</strong></span>
                </div>
                {industryData.length > 0 ? (
                  <div className="space-y-2.5">
                    {industryData.map((row) => {
                      const label = row.avgScore >= 70 ? 'HIGH' : row.avgScore >= 40 ? 'MEDIUM' : 'LOW'
                      return (
                        <div key={row.industry} className="flex items-center gap-3 text-sm">
                          <span className="w-28 shrink-0 text-gray-600 truncate" title={row.industry}>{row.industry}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                            <div
                              className="h-full bg-blue-500/80 rounded-full"
                              style={{ width: `${(row.count / maxIndustryCount) * 100}%` }}
                            />
                            <span className="absolute inset-y-0 left-2 flex items-center text-xs font-semibold text-gray-700">
                              {row.count}
                            </span>
                          </div>
                          <span className={`w-20 shrink-0 text-center px-2 py-0.5 rounded-full text-xs font-bold ${scoreBadgeClass(label)}`}>
                            ⌀ {row.avgScore}
                          </span>
                        </div>
                      )
                    })}
                    <p className="text-xs text-gray-400 pt-2">
                      Yüksek hacimli sektörler (restoran, market, kafe…) +25 puan alır — bu yüzden ortalama skorları daha yüksek.
                    </p>
                  </div>
                ) : (
                  <div className="h-44 flex items-center justify-center text-gray-300 text-sm">Henüz veri yok</div>
                )}
              </div>

              {/* Scoring legend — the rule set, always in sync with lib/scoring.ts */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-700 mb-1">Puanlama Sistemi</h2>
                <p className="text-xs text-gray-400 mb-4">Her lead 0–100 arası puanlanır</p>
                <div className="space-y-2">
                  {SCORING_RULES.map((rule) => (
                    <div key={rule.label} className="flex items-center justify-between gap-2" title={rule.reason}>
                      <span className="text-xs text-gray-600">{rule.label}</span>
                      <span className="text-xs font-bold text-blue-900 whitespace-nowrap">+{rule.points}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 mt-4 pt-3 flex flex-wrap gap-1.5 text-xs">
                  <span className="px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-800">HIGH ≥ 70</span>
                  <span className="px-2 py-0.5 rounded-full font-bold bg-yellow-100 text-yellow-800">MED 40–69</span>
                  <span className="px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-800">LOW &lt; 40</span>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Tablodaki bir lead&apos;e tıklayın → o lead&apos;in puan kırılımını görün.
                </p>
              </div>
            </div>

            {/* ── Lead Table ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <h2 className="text-sm font-bold text-gray-700">
                  Lead Listesi ({filteredLeads.length} sonuç)
                </h2>
                <div className="flex gap-2 flex-wrap">
                  {/* Flow filter */}
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as typeof filter)}
                    className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="ALL">Tüm Akışlar</option>
                    <option value="SELF_SERVE">Self-Serve</option>
                    <option value="SALES_CONTACT">Sizi Arayalım</option>
                  </select>
                  {/* Score filter */}
                  <select
                    value={scoreFilter}
                    onChange={(e) => setScoreFilter(e.target.value as typeof scoreFilter)}
                    className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="ALL">Tüm Skorlar</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      <th className="text-left py-2 pr-4">İsim</th>
                      <th className="text-left py-2 pr-4 hidden md:table-cell">Firma</th>
                      <th className="text-left py-2 pr-4 hidden sm:table-cell">Sektör</th>
                      <th className="text-left py-2 pr-4">Akış</th>
                      <th className="text-left py-2 pr-4">Skor</th>
                      <th className="text-left py-2 pr-4 hidden lg:table-cell">Kaynak</th>
                      <th className="text-left py-2">Tarih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-300 text-sm">
                          Sonuç bulunamadı
                        </td>
                      </tr>
                    ) : (
                      pagedLeads.map((lead) => {
                        const isOpen = expandedId === lead.id
                        const breakdown = explainScore({
                          phone: lead.phone,
                          company: lead.company,
                          companySize: lead.companySize,
                          industry: lead.industry,
                          flowType: lead.flowType as 'SELF_SERVE' | 'SALES_CONTACT',
                        })
                        return (
                          <Fragment key={lead.id}>
                            <tr
                              onClick={() => setExpandedId(isOpen ? null : lead.id)}
                              className={`border-b border-gray-50 hover:bg-blue-50/40 transition-colors cursor-pointer ${isOpen ? 'bg-blue-50/40' : ''}`}
                            >
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-gray-300 text-[10px] transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                                  <div>
                                    <div className="font-semibold text-gray-800">{lead.name}</div>
                                    <div className="text-xs text-gray-400">{lead.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 pr-4 hidden md:table-cell text-gray-600">
                                {lead.company ?? '—'}
                              </td>
                              <td className="py-3 pr-4 hidden sm:table-cell text-gray-500 text-xs">
                                {lead.industry ?? '—'}
                              </td>
                              <td className="py-3 pr-4">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                                  ${lead.flowType === 'SELF_SERVE'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600'}`}>
                                  {lead.flowType === 'SELF_SERVE' ? 'Self-Serve' : 'Arayalım'}
                                </span>
                              </td>
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-2">
                                  <ScoreBadge label={lead.scoreLabel} />
                                  <span className="text-xs text-gray-400">{lead.score}</span>
                                </div>
                              </td>
                              <td className="py-3 pr-4 hidden lg:table-cell text-gray-400 text-xs">
                                {lead.utmSource ?? 'direct'}
                              </td>
                              <td className="py-3 text-xs text-gray-400">
                                {new Date(lead.createdAt).toLocaleDateString('tr-TR')}
                              </td>
                            </tr>
                            {isOpen && (
                              <tr className="bg-blue-50/40 border-b border-gray-100">
                                <td colSpan={7} className="px-4 py-4">
                                  <div className="text-xs font-semibold text-gray-500 mb-2">
                                    Skor kırılımı — neden {lead.score} puan?
                                  </div>
                                  {breakdown.contributions.length > 0 || lead.aiScore > 0 ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                      {breakdown.contributions.map((c, i) => (
                                        <span key={i} className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs">
                                          <span className="text-gray-600">{c.label}</span>
                                          <span className="font-bold text-green-700">+{c.points}</span>
                                        </span>
                                      ))}
                                      {lead.aiScore > 0 && (
                                        <span className="inline-flex items-center gap-1 bg-purple-50 border border-purple-200 rounded-lg px-2.5 py-1 text-xs">
                                          <span className="text-purple-700">🤖 AI aciliyet sinyali</span>
                                          <span className="font-bold text-purple-700">+{lead.aiScore}</span>
                                        </span>
                                      )}
                                      <span className="text-xs text-gray-400">=</span>
                                      <span className="inline-flex items-center gap-1.5 bg-blue-900 text-white rounded-lg px-3 py-1 text-xs font-bold">
                                        {lead.score} puan
                                        <ScoreBadge label={lead.scoreLabel} />
                                      </span>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-400">Hiçbir kural eşleşmedi — taban skor 0.</p>
                                  )}

                                  {lead.notes && (
                                    <div className="mt-3 text-xs">
                                      <span className="font-semibold text-gray-500">Not: </span>
                                      <span className="text-gray-600 italic">“{lead.notes}”</span>
                                      {lead.aiReason && (
                                        <span className="ml-2 text-purple-600">→ 🤖 {lead.aiReason}</span>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ── */}
              {filteredLeads.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    <strong className="text-gray-600">{pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filteredLeads.length)}</strong>
                    {' '}/ {filteredLeads.length} lead gösteriliyor
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setPage(currentPage - 1); setExpandedId(null) }}
                      disabled={currentPage === 1}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Önceki
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => { setPage(i + 1); setExpandedId(null) }}
                        className={`text-xs font-semibold w-8 h-8 rounded-lg transition-colors ${
                          currentPage === i + 1
                            ? 'bg-blue-900 text-white'
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => { setPage(currentPage + 1); setExpandedId(null) }}
                      disabled={currentPage === totalPages}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Sonraki →
                    </button>
                  </div>
                </div>
              )}
            </div>

          </>
        )}
      </div>
    </div>
  )
}
