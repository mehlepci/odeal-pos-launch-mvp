'use client'

// Marcom Dashboard — internal tool for the ÖdeAl growth team.
// See DECISIONS.md D-007 (auth) and D-008 (metric selection).
//
// Auth: simple client-side password gate. MVP tradeoff — see D-007.
// Data: fetched via useEffect from /api/leads and /api/metrics.

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { scoreBadgeClass } from '@/lib/scoring'

// ─── Types ───────────────────────────────────────────────

interface Lead {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  industry: string | null
  flowType: string
  utmSource: string | null
  score: number
  scoreLabel: string
  createdAt: string
}

interface Metrics {
  total: number
  thisWeek: number
  lastWeek: number
  byFlow: { flowType: string; _count: { _all: number } }[]
  byScore: { scoreLabel: string; _count: { _all: number } }[]
  bySource: { utmSource: string | null; _count: { _all: number } }[]
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

  const sourceData = (metrics?.bySource ?? []).map((s) => ({
    name: s.utmSource ?? 'direct',
    count: s._count._all,
  }))

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
                      filteredLeads.map((lead) => (
                        <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-3 pr-4">
                            <div className="font-semibold text-gray-800">{lead.name}</div>
                            <div className="text-xs text-gray-400">{lead.email}</div>
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  )
}
