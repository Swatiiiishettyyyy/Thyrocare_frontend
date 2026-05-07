import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar, Footer } from '../components'
import { fetchMyReports, pickSampleCollectedTimestampFromReport, type MyReportRow } from '../api/orders'
import { useAuth } from '../context/AuthContext'

import heartIcon    from '../assets/figma/Health metrics/heart.svg'
import liverIcon    from '../assets/figma/Health metrics/liver.svg'
import boneIcon     from '../assets/figma/Health metrics/Bone.svg'
import gutIcon      from '../assets/figma/Health metrics/gut.svg'
import thyroidIcon  from '../assets/figma/Health metrics/thyroid.svg'
import bloodIcon    from '../assets/figma/Health metrics/blood.svg'
import vitaminsIcon from '../assets/figma/Health metrics/vitamins.svg'
import bodyImg      from '../assets/figma/Health metrics/freepik__use-this-in-midjourney-leonardo-sdxlpromptultra-hi__47708 1.png'

const NAV_LINKS = [
  { label: 'Tests',    href: '/' },
  { label: 'Packages', href: '/packages' },
  { label: 'Reports',  href: '/reports' },
  { label: 'Metrics',  href: '/metrics' },
  { label: 'Orders',   href: '/orders' },
]

type StatusType = 'Good' | 'Monitor' | 'Attention' | 'No Data'

const STATUS_STYLE: Record<StatusType, { bg: string; color: string }> = {
  Good:      { bg: '#E6F6F3', color: '#41C9B3' },
  Monitor:   { bg: '#FFF4EF', color: '#EA8C5A' },
  Attention: { bg: '#FFF0F0', color: '#E12D2D' },
  'No Data': { bg: '#F4F4F4', color: '#828282' },
}

type OrganName = 'Heart' | 'Liver' | 'Bone' | 'Gut' | 'Thyroid' | 'Blood' | 'Vitamins'

const ORGAN_ICON: Record<OrganName, string> = {
  Heart: heartIcon,
  Liver: liverIcon,
  Bone: boneIcon,
  Gut: gutIcon,
  Thyroid: thyroidIcon,
  Blood: bloodIcon,
  Vitamins: vitaminsIcon,
}

const ORGAN_ORDER: OrganName[] = ['Heart', 'Liver', 'Bone', 'Gut', 'Thyroid', 'Blood', 'Vitamins']

type Trend = 'up' | 'down' | null

type OrganCardModel = {
  name: OrganName
  icon: string
  status: StatusType
  score: number | null
  updated: string
  trend: Trend
}

type Status = 'Normal' | 'High' | 'Low'

function parseReportDate(row: MyReportRow): Date | null {
  const picked = pickSampleCollectedTimestampFromReport(row)
  const raw = String(
    picked ??
      row.sample_date ??
      row.sampleDate ??
      row.report_date ??
      row.reportDate ??
      row.completed_at ??
      row.created_at ??
      '',
  ).trim()
  if (!raw) return null
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null
  return d
}

function formatUpdated(d: Date | null): string {
  if (!d) return 'No Data Available'
  return `Updated ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
}

function normalizeOrganName(raw: unknown): OrganName | null {
  const t = String(raw ?? '').trim()
  if (!t) return null
  const low = t.toLowerCase()
  for (const name of ORGAN_ORDER) {
    if (name.toLowerCase() === low) return name
  }
  return null
}

function statusFromItem(o: Record<string, unknown>): Status {
  const ind = String(o.indicator ?? '').trim().toUpperCase()
  if (ind === 'RED' || ind === 'HIGH' || ind === 'H') return 'High'
  if (ind === 'LOW' || ind === 'L') return 'Low'
  const st = String(o.status ?? o.flag ?? o.interpretation ?? '').toLowerCase()
  if (st.includes('high') || st === 'h') return 'High'
  if (st.includes('low') || st === 'l') return 'Low'
  return 'Normal'
}

function extractReportLines(row: MyReportRow): Record<string, unknown>[] {
  const keys = [
    'results',
    'lab_results',
    'thyrocare_results',
    'biomarkers',
    'parameters',
    'report_lines',
    'report_details',
    'tests',
  ] as const
  for (const k of keys) {
    const v = row[k]
    if (Array.isArray(v) && v.length) {
      return v.filter((x): x is Record<string, unknown> => x != null && typeof x === 'object' && !Array.isArray(x))
    }
  }
  return []
}

function computeStatusFromScore(score: number | null): StatusType {
  if (score == null) return 'No Data'
  if (score >= 80) return 'Good'
  if (score >= 60) return 'Monitor'
  return 'Attention'
}

const FILTERS: Array<'All' | OrganName> = ['All', ...ORGAN_ORDER]

function OrganCard({ organ, onClick }: { organ: OrganCardModel; onClick: () => void }) {
  const st = STATUS_STYLE[organ.status]
  return (
    <div onClick={onClick} style={{
      background: '#fff',
      boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
      borderRadius: 20,
      padding: '24px 16px 20px',
      display: 'flex', flexDirection: 'column', gap: 10,
      cursor: 'pointer',
    }}>
      {/* Row 1: icon + name left, badge right */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Icon — displayed directly, no background wrapper */}
          <img src={organ.icon} alt={organ.name} width={44} height={44} style={{ flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 16, fontWeight: 400, color: '#161616', fontFamily: 'Poppins, sans-serif', lineHeight: '22px' }}>
              {organ.name}
            </span>
            {organ.score !== null ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 28, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif', lineHeight: '32px' }}>
                  {organ.score}
                </span>
                <span style={{ fontSize: 13, color: '#828282', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                  /100
                </span>
                {organ.trend && (
                  <svg width="18" height="14" viewBox="0 0 20 16" fill="none">
                    {organ.trend === 'up'
                      ? <path d="M1 15L7 7L12 11L19 1" stroke="#41C9B3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      : <path d="M1 1L7 9L12 5L19 15" stroke="#E12D2D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    }
                  </svg>
                )}
              </div>
            ) : (
              <span style={{ fontSize: 13, color: '#828282', fontFamily: 'Inter, sans-serif' }}>No data</span>
            )}
          </div>
        </div>
        <span style={{
          alignSelf: 'flex-start',
          padding: '3px 10px', borderRadius: 100,
          background: st.bg, color: st.color,
          fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: 400,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>{organ.status}</span>
      </div>
      {/* Updated date bottom right */}
      <span style={{ fontSize: 12, color: '#828282', textAlign: 'right', fontFamily: 'Inter, sans-serif', display: 'block' }}>
        {organ.updated}
      </span>
    </div>
  )
}

export default function HealthMetricsPage({ cartCount }: { cartCount?: number } = {}) {
  const navigate = useNavigate()
  const { currentMember } = useAuth()
  const [activeFilter, setActiveFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reports, setReports] = useState<MyReportRow[]>([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void fetchMyReports(currentMember?.member_id ?? undefined)
      .then(list => {
        if (cancelled) return
        setReports(list)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load health metrics yet.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [currentMember?.member_id])

  const organCards = useMemo<OrganCardModel[]>(() => {
    const byOrgan = new Map<OrganName, Array<{ date: Date; normal: number; abnormal: number; total: number }>>()

    for (const r of reports) {
      const d = parseReportDate(r)
      if (!d) continue
      const lines = extractReportLines(r)
      if (!lines.length) continue

      const counts = new Map<OrganName, { normal: number; abnormal: number; total: number }>()
      for (const line of lines) {
        // Prefer `category` (we fill it with organ in DB), then `organ`, then fallback.
        const organ = normalizeOrganName(line.category ?? line.organ ?? null)
        if (!organ) continue
        const st = statusFromItem(line)
        const c = counts.get(organ) ?? { normal: 0, abnormal: 0, total: 0 }
        c.total += 1
        if (st === 'Normal') c.normal += 1
        else c.abnormal += 1
        counts.set(organ, c)
      }

      for (const [organ, c] of counts) {
        const arr = byOrgan.get(organ) ?? []
        arr.push({ date: d, normal: c.normal, abnormal: c.abnormal, total: c.total })
        byOrgan.set(organ, arr)
      }
    }

    const out: OrganCardModel[] = []
    for (const organ of ORGAN_ORDER) {
      const history = (byOrgan.get(organ) ?? []).sort((a, b) => a.date.getTime() - b.date.getTime())
      const latest = history.length ? history[history.length - 1]! : null
      const prev = history.length >= 2 ? history[history.length - 2]! : null

      const scoreLatest =
        latest && latest.total > 0 ? Math.round((latest.normal / latest.total) * 100) : null
      const scorePrev =
        prev && prev.total > 0 ? Math.round((prev.normal / prev.total) * 100) : null

      const trend: Trend =
        scoreLatest != null && scorePrev != null
          ? (scoreLatest > scorePrev ? 'up' : scoreLatest < scorePrev ? 'down' : null)
          : null

      out.push({
        name: organ,
        icon: ORGAN_ICON[organ],
        score: scoreLatest,
        status: computeStatusFromScore(scoreLatest),
        updated: formatUpdated(latest?.date ?? null),
        trend,
      })
    }
    return out
  }, [reports])

  const filtered = activeFilter === 'All' ? organCards : organCards.filter(o => o.name === activeFilter)
  const leftCol  = filtered.filter((_, i) => i < 4)
  const rightCol = filtered.filter((_, i) => i >= 4)

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(0deg, #E7E1FF 0%, #fff 100%)',
      fontFamily: 'Poppins, sans-serif',
    }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" cartCount={cartCount} hideSearchOnMobile onCtaClick={() => navigate('/cart')} />

      {/* Breadcrumb */}
      <div
        className="cart-breadcrumb metrics-breadcrumb"
        style={{
          padding: '14px clamp(16px, 5vw, 56px)',
          borderBottom: '1px solid #F3F4F6',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 14, color: '#6B7280', cursor: 'pointer' }} onClick={() => navigate('/')}>Tests</span>
        <span style={{ fontSize: 14, color: '#6B7280' }}>›</span>
        <span style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>Health Metrics</span>
      </div>

      <div className="metrics-inner" style={{ flex: 1, width: '100%', maxWidth: 1200, margin: '0 auto', padding: '32px 40px 60px', boxSizing: 'border-box' }}>

        {/* Header */}
        <div className="metrics-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div className="metrics-headerLeft" style={{ minWidth: 0, flex: '1 1 auto' }}>
            <div className="metrics-titleRow" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <h1 className="metrics-title" style={{ fontSize: 28, fontWeight: 500, color: '#161616', margin: 0, lineHeight: 1.1 }}>
                Health Metrics
              </h1>
            </div>
            <p className="metrics-subtitle" style={{ fontSize: 15, color: '#828282', margin: '6px 0 0', fontFamily: 'Poppins, sans-serif' }}>
              Track your organ health over time with smart insights.
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="metrics-filters" style={{
          display: 'flex', flexWrap: 'wrap',
          background: '#fff', boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
          borderRadius: 112, outline: '1px solid #E7E1FF', outlineOffset: -1,
          padding: 8, marginBottom: 32, width: 'fit-content',
        }}>
          {FILTERS.map(f => {
            const isActive = activeFilter === f
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`metrics-filterBtn ${isActive ? 'is-active' : ''}`}
                style={{
                padding: '8px 20px', borderRadius: 47, border: 'none',
                background: isActive ? '#fff' : 'transparent',
                boxShadow: isActive ? '0px 4px 27.3px rgba(0,0,0,0.05)' : 'none',
                outline: isActive ? '1px solid #E7E1FF' : 'none', outlineOffset: -1,
                color: isActive ? '#8B5CF6' : '#161616',
                fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
              }}
              >
                {f}
              </button>
            )
          })}
        </div>

        {/* Mobile grid (CSS shows on small screens) */}
        <div className="metrics-mobile-grid">
          {loading ? (
            <div style={{ padding: 18, color: '#828282' }}>Loading metrics…</div>
          ) : error ? (
            <div style={{ padding: 18, color: '#B91C1C' }}>{error}</div>
          ) : (
            filtered.map(o => (
              <OrganCard key={o.name} organ={o} onClick={() => navigate(`/metrics/${o.name.toLowerCase()}`)} />
            ))
          )}
        </div>

        {/* Desktop 3-column layout: left cards | body | right cards */}
        <div className="metrics-layout" style={{ display: 'flex', gap: 20, alignItems: 'center', justifyContent: 'flex-start' }}>

          {/* Left column */}
          <div className="metrics-col metrics-col--left" style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? (
              <div style={{ padding: 18, color: '#828282' }}>Loading…</div>
            ) : error ? (
              <div style={{ padding: 18, color: '#B91C1C' }}>{error}</div>
            ) : (
              leftCol.map(o => <OrganCard key={o.name} organ={o} onClick={() => navigate(`/metrics/${o.name.toLowerCase()}`)} />)
            )}
          </div>

          {/* Body illustration — fixed center, vertically centered */}
          <div
            className="metrics-body"
            style={{
              width: 340,
              flexShrink: 0,
              position: 'relative',
              alignSelf: 'center',
              marginInline: 28,
            }}
          >
            <img src={bodyImg} alt="Body" style={{ width: '100%', display: 'block', borderRadius: 16, objectFit: 'contain' }} />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 100,
              background: 'linear-gradient(180deg, rgba(233,228,255,0.12) 0%, #EBE7FF 100%)',
              borderRadius: '0 0 16px 16px',
            }} />
          </div>

          {/* Right column */}
          <div className="metrics-col metrics-col--right" style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? null : error ? null : rightCol.map(o => (
              <OrganCard key={o.name} organ={o} onClick={() => navigate(`/metrics/${o.name.toLowerCase()}`)} />
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
