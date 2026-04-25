import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LineGraph, Navbar } from '../components'
import { fetchMyReports, pickSampleCollectedTimestampFromReport, type MyReportRow } from '../api/orders'
import { useAuth } from '../context/AuthContext'

import heartIcon from '../assets/figma/Health metrics/heart.svg'
import kidneyIcon from '../assets/figma/Health metrics/kidney.svg'
import liverIcon from '../assets/figma/Health metrics/liver.svg'
import boneIcon from '../assets/figma/Health metrics/Bone.svg'
import gutIcon from '../assets/figma/Health metrics/gut.svg'
import thyroidIcon from '../assets/figma/Health metrics/thyroid.svg'
import bloodIcon from '../assets/figma/Health metrics/blood.svg'
import vitaminsIcon from '../assets/figma/Health metrics/vitamins.svg'

const NAV_LINKS = [
  { label: 'Tests',    href: '/' },
  { label: 'Packages', href: '/packages' },
  { label: 'Reports',  href: '/reports' },
  { label: 'Metrics',  href: '/metrics' },
  { label: 'Orders',   href: '/orders' },
]

type OrganName = 'Heart' | 'Kidney' | 'Liver' | 'Bone' | 'Gut' | 'Thyroid' | 'Blood' | 'Vitamins'
type Status = 'Normal' | 'High' | 'Low'
type StatusType = 'Normal' | 'Abnormal'

const ORGAN_ICON: Record<OrganName, string> = {
  Heart: heartIcon,
  Kidney: kidneyIcon,
  Liver: liverIcon,
  Bone: boneIcon,
  Gut: gutIcon,
  Thyroid: thyroidIcon,
  Blood: bloodIcon,
  Vitamins: vitaminsIcon,
}

const STATUS_STYLE: Record<StatusType, { bg: string; color: string }> = {
  Normal: { bg: '#E6F6F3', color: '#41C9B3' },
  Abnormal: { bg: '#FFF0F0', color: '#E12D2D' },
}

function normalizeParamName(s: string): string {
  return String(s ?? '')
    .trim()
    .toUpperCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
}

function normalizeParamCode(s: string): string {
  return String(s ?? '').trim().toUpperCase().replace(/\s+/g, '')
}

function parseNormalValRangeString(s: string): { low: number; high: number } {
  const m = String(s)
    .trim()
    .match(/([\d.]+(?:[eE][+-]?\d+)?)\s*[-–—]\s*([\d.]+(?:[eE][+-]?\d+)?)/)
  if (!m) return { low: NaN, high: NaN }
  return { low: Number(m[1]), high: Number(m[2]) }
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

function toOrganName(raw: unknown): OrganName | null {
  const t = String(raw ?? '').trim()
  if (!t) return null
  const low = t.toLowerCase()
  for (const k of Object.keys(ORGAN_ICON) as OrganName[]) {
    if (k.toLowerCase() === low) return k
  }
  return null
}

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

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
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

type SeriesPoint = { date: Date; label: string; value: number }
type ParamSeries = {
  key: string
  code?: string
  name: string
  unit: string
  normalRange: string
  status: StatusType
  changePct: string
  changeDir: 'up' | 'down' | null
  points: SeriesPoint[]
}

export default function OrganDetailPage({ cartCount }: { cartCount?: number } = {}) {
  const navigate = useNavigate()
  const { currentMember } = useAuth()
  const { organ } = useParams<{ organ: string }>()
  const organName = (organ ? (organ.charAt(0).toUpperCase() + organ.slice(1)) : 'Heart') as string
  const organKey = toOrganName(organName) ?? 'Heart'

  const [activeParamFilter, setActiveParamFilter] = useState<'All' | 'Normal' | 'Needs'>('All')
  const [activeTimeFilter, setActiveTimeFilter] = useState('Monthly')
  const [selectedParamKey, setSelectedParamKey] = useState<string>('') // optional "chip" selection
  const [reports, setReports] = useState<MyReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        if (!cancelled) setError('Could not load organ metrics yet.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [currentMember?.member_id])

  const pointsCount = useMemo(() => {
    if (activeTimeFilter === 'Yearly') return 2
    if (activeTimeFilter === 'Quarterly') return 4
    return 6
  }, [activeTimeFilter])

  const paramSeries = useMemo<ParamSeries[]>(() => {
    // Collect points per parameter key across all reports for this organ
    const keyTo = new Map<string, { name: string; code?: string; unit: string; normalRange: string; points: SeriesPoint[]; latestStatus: Status }>()

    for (const r of reports) {
      const d = parseReportDate(r)
      if (!d) continue
      const label = formatShortDate(d)
      const lines = extractReportLines(r)
      for (const line of lines) {
        const organFromLine = toOrganName(line.category ?? line.organ ?? null)
        if (organFromLine !== organKey) continue

        const codeRaw = line.test_code ?? line.testCode ?? line.code ?? line.parameter_code ?? line.parameterCode
        const code = codeRaw != null && String(codeRaw).trim() ? String(codeRaw).trim() : undefined

        const name = String(
          line.name ??
            line.parameter_name ??
            line.test_name ??
            line.investigation ??
            line.label ??
            line.description ??
            line.test_code ??
            '',
        ).trim()
        if (!name) continue

        const rawVal = line.value ?? line.result ?? line.observed_value ?? line.reading ?? line.test_value
        if (rawVal == null) continue
        const value = Number(String(rawVal).replace(/,/g, ''))
        if (!Number.isFinite(value)) continue

        const unit = String(line.unit ?? line.units ?? '').trim()
        const rangeSrc = String(line.normal_range ?? line.reference_range ?? line.range ?? line.normal_val ?? '').trim()
        let normalRange = rangeSrc
        if (!normalRange) {
          const low = Number(line.low ?? line.min ?? line.reference_low ?? line.lower_bound ?? NaN)
          const high = Number(line.high ?? line.max ?? line.reference_high ?? line.upper_bound ?? NaN)
          if (Number.isFinite(low) && Number.isFinite(high)) normalRange = `${low} – ${high}`
        }
        const st = statusFromItem(line)

        const key = code ? `code:${normalizeParamCode(code)}` : `name:${normalizeParamName(name)}`
        const entry = keyTo.get(key) ?? { name, code, unit, normalRange, points: [], latestStatus: st }
        entry.name = entry.name || name
        entry.code = entry.code || code
        entry.unit = entry.unit || unit
        entry.normalRange = entry.normalRange || normalRange
        entry.points.push({ date: d, label, value })
        // keep the most recent status (by date)
        if (entry.points.length === 1 || d.getTime() >= Math.max(...entry.points.map(p => p.date.getTime()))) {
          entry.latestStatus = st
        }
        keyTo.set(key, entry)
      }
    }

    const out: ParamSeries[] = []
    for (const [key, v] of keyTo.entries()) {
      const sorted = [...v.points].sort((a, b) => a.date.getTime() - b.date.getTime())
      const clipped = sorted.slice(Math.max(0, sorted.length - pointsCount))
      const last = clipped.at(-1)
      const prev = clipped.length >= 2 ? clipped.at(-2) : null
      const changeDir: 'up' | 'down' | null =
        prev && last ? (last.value > prev.value ? 'up' : last.value < prev.value ? 'down' : null) : null
      const changePct =
        prev && last && prev.value !== 0
          ? `${Math.abs(((last.value - prev.value) / prev.value) * 100).toFixed(1)}%`
          : '—'
      const status: StatusType = v.latestStatus === 'Normal' ? 'Normal' : 'Abnormal'
      out.push({
        key,
        code: v.code,
        name: v.name,
        unit: v.unit,
        normalRange: v.normalRange || '—',
        status,
        changePct,
        changeDir,
        points: clipped,
      })
    }

    // sort: abnormal first, then alphabetical
    out.sort((a, b) => {
      if (a.status !== b.status) return a.status === 'Abnormal' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    return out
  }, [reports, organKey, pointsCount])

  const filteredParams = useMemo(() => {
    let arr = paramSeries
    if (activeParamFilter === 'Normal') arr = arr.filter(p => p.status === 'Normal')
    if (activeParamFilter === 'Needs') arr = arr.filter(p => p.status !== 'Normal')
    if (selectedParamKey) arr = arr.filter(p => p.key === selectedParamKey)
    return arr
  }, [paramSeries, activeParamFilter, selectedParamKey])

  const normalCount = useMemo(() => paramSeries.filter(p => p.status === 'Normal').length, [paramSeries])
  const abnormalCount = useMemo(() => paramSeries.filter(p => p.status === 'Abnormal').length, [paramSeries])
  const allCount = paramSeries.length

  const organScore = useMemo(() => {
    if (allCount === 0) return null
    return Math.round((normalCount / Math.max(1, allCount)) * 100)
  }, [normalCount, allCount])

  const organStatusLabel = useMemo(() => {
    if (organScore == null) return 'No Data'
    if (organScore >= 80) return 'Good'
    if (organScore >= 60) return 'Monitor'
    return 'Attention'
  }, [organScore])

  const updatedLabel = useMemo(() => {
    const ds = reports.map(parseReportDate).filter((d): d is Date => d != null)
    if (!ds.length) return 'No Data Available'
    const latest = ds.sort((a, b) => b.getTime() - a.getTime())[0]!
    return `Updated ${latest.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
  }, [reports])

  const chips = useMemo(() => paramSeries.slice(0, 6), [paramSeries])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F9F9F9', fontFamily: 'Poppins, sans-serif' }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" cartCount={cartCount} hideSearchOnMobile onCtaClick={() => navigate('/cart')} />

      {/* Breadcrumb */}
      <div
        className="cart-breadcrumb"
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
        <span style={{ fontSize: 14, color: '#6B7280', cursor: 'pointer' }} onClick={() => navigate('/metrics')}>Health Metrics</span>
        <span style={{ fontSize: 14, color: '#6B7280' }}>›</span>
        <span style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>{organName}</span>
      </div>

      <div className="organ-detail-inner" style={{ flex: 1, width: '100%', maxWidth: 1200, margin: '0 auto', padding: '32px 40px 60px', boxSizing: 'border-box' }}>

        {/* Header card */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '20px 20px 16px',
          boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
          outline: '1px solid #E7E1FF', outlineOffset: -1,
          marginBottom: 20,
        }}>
          {/* Organ name + status + score */}
          <div className="organ-detail-headerRow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            {/* Left: icon | name+badge row, then score, then date */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Row 1: icon + name + Monitor badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={ORGAN_ICON[organKey]} alt={organName} width={44} height={44} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 18, fontWeight: 500, color: '#161616' }}>{organName}</span>
                <span style={{
                  padding: '2px 10px',
                  borderRadius: 100,
                  background: organStatusLabel === 'Good' ? '#E6F6F3' : organStatusLabel === 'Monitor' ? '#FFF4EF' : organStatusLabel === 'Attention' ? '#FFF0F0' : '#F4F4F4',
                  color: organStatusLabel === 'Good' ? '#41C9B3' : organStatusLabel === 'Monitor' ? '#EA8C5A' : organStatusLabel === 'Attention' ? '#E12D2D' : '#828282',
                  fontSize: 13,
                  fontFamily: 'Inter, sans-serif',
                }}>{organStatusLabel}</span>
              </div>
              {/* Row 2: score */}
              <div className="organ-detail-scoreRow" style={{ display: 'flex', alignItems: 'flex-end', gap: 4, paddingLeft: 56 }}>
                <span style={{ fontSize: 28, fontWeight: 500, color: '#161616', lineHeight: 1 }}>{organScore ?? '—'}</span>
                <span style={{ fontSize: 14, color: '#828282', marginBottom: 2, fontFamily: 'Inter, sans-serif' }}>/100</span>
                {organScore != null && (
                  <svg width="16" height="10" viewBox="0 0 24 14" fill="none" style={{ marginBottom: 3 }}>
                    <path d="M1 13L12 2L23 13" stroke="#41C9B3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              {/* Row 3: date */}
              <span className="organ-detail-updated" style={{ fontSize: 12, color: '#828282', fontFamily: 'Inter, sans-serif', paddingLeft: 56 }}>{updatedLabel}</span>
            </div>

            {/* Right: insight banner */}
            <div className="organ-detail-insight" style={{
              flex: '0 0 340px', padding: '12px 14px',
              background: 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)',
              borderRadius: 14, display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                <circle cx="12" cy="12" r="10" stroke="#8B5CF6" strokeWidth="1.8"/>
                <path d="M12 8v4M12 16h.01" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: 13, color: '#fff', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
                {error ? error : loading ? 'Loading your latest insights…' : allCount === 0 ? 'No parameter trends available for this organ yet.' : `${abnormalCount} parameter(s) need attention out of ${allCount}.`}
              </span>
            </div>
          </div>
        </div>

        {/* Parameters section */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '28px 28px 28px',
          boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
          outline: '1px solid #E7E1FF', outlineOffset: -1,
          marginBottom: 20,
        }}>
          {/* Parameters header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 18, fontWeight: 500, color: '#161616' }}>Parameters</span>
            <button
              type="button"
              onClick={() => { setActiveParamFilter('All'); setSelectedParamKey('') }}
              style={{ background: 'none', border: 'none', color: '#8B5CF6', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}
            >
              Clear Filter
            </button>
          </div>

          {/* Filter row */}
          <div className="organ-detail-filterRow" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
            <div className="organ-detail-filterGroup" style={{ display: 'flex', background: '#fff', boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)', borderRadius: 112, outline: '1px solid #E7E1FF', outlineOffset: -1, padding: 8 }}>
              {[
                { key: 'All', label: `All(${allCount})` },
                { key: 'Normal', label: `Normal(${normalCount})` },
                { key: 'Needs', label: `Needs Attention(${abnormalCount})` },
              ].map(f => (
                <button key={f.key} onClick={() => setActiveParamFilter(f.key as any)} style={{
                  padding: '6px 16px', borderRadius: 47, border: 'none',
                  background: activeParamFilter === f.key ? '#fff' : 'transparent',
                  boxShadow: activeParamFilter === f.key ? '0px 4px 27.3px rgba(0,0,0,0.05)' : 'none',
                  outline: activeParamFilter === f.key ? '1px solid #E7E1FF' : 'none', outlineOffset: -1,
                  color: activeParamFilter === f.key ? '#8B5CF6' : '#414141',
                  fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
                }}>{f.label}</button>
              ))}
            </div>
            <div className="organ-detail-filterDivider" style={{ width: 1, height: 28, background: '#E7E1FF' }} />
            {chips.map(p => (
              <button key={p.key} type="button" onClick={() => setSelectedParamKey(p.key)} style={{
                padding: '6px 14px', borderRadius: 36, border: 'none',
                background: selectedParamKey === p.key ? '#E7E1FF' : '#F9F9F9',
                color: '#414141',
                fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
              }}>{p.name}</button>
            ))}
          </div>

          {/* Parameter cards with charts */}
          {loading ? (
            <div style={{ padding: 12, color: '#828282' }}>Loading parameters…</div>
          ) : error ? (
            <div style={{ padding: 12, color: '#B91C1C' }}>{error}</div>
          ) : filteredParams.length === 0 ? (
            <div style={{ padding: 12, color: '#828282' }}>No parameters found for this organ yet.</div>
          ) : filteredParams.map(p => {
            const ss = STATUS_STYLE[p.status]
            const chartColor = '#8B5CF6'
            const last = p.points.at(-1)
            return (
              <div
                key={p.key}
                className="organ-paramCard"
                style={{
                  background: '#fff', borderRadius: 20, padding: '24px',
                  outline: '1px solid #E7E1FF', outlineOffset: -1,
                  marginBottom: 16,
                }}
              >
                {/* Param header */}
                <div className="organ-paramHeader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <div className="organ-paramName" style={{ fontSize: 18, fontWeight: 500, color: '#161616', marginBottom: 8 }}>{p.name}</div>
                    <div className="organ-paramValueRow" style={{ display: 'flex', alignItems: 'flex-end', gap: 8, rowGap: 8, flexWrap: 'wrap', marginBottom: 6, minWidth: 0 }}>
                      <span className="organ-paramValue" style={{ fontSize: 28, fontWeight: 600, color: '#161616', lineHeight: 1 }}>{last ? last.value : '—'}</span>
                      <span className="organ-paramUnit" style={{ fontSize: 15, color: '#828282', marginBottom: 2, fontFamily: 'Inter, sans-serif' }}>{p.unit}</span>
                      <span className="organ-paramStatusPill" style={{ padding: '3px 10px', borderRadius: 100, background: ss.bg, color: ss.color, fontSize: 13, fontFamily: 'Inter, sans-serif' }}>{p.status}</span>
                      <div className="organ-paramChangePill" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#E6F6F3', borderRadius: 100 }}>
                        <svg width="14" height="10" viewBox="0 0 24 14" fill="none" aria-hidden="true">
                          <path
                            d="M1 13L12 2L23 13"
                            stroke={p.changeDir === 'down' ? '#E12D2D' : '#41C9B3'}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            transform={p.changeDir === 'down' ? 'rotate(180 12 7)' : undefined}
                          />
                        </svg>
                        <span className="organ-paramChangeText" style={{ fontSize: 13, color: '#101129', fontFamily: 'Inter, sans-serif' }}>{p.changePct}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, color: '#828282', fontFamily: 'Poppins, sans-serif' }}>
                      Normal range: <span style={{ color: '#161616' }}>{p.normalRange}</span>
                    </span>
                  </div>
                  {/* Time filter */}
                  <div className="organ-paramTimeToggle" style={{ display: 'flex', background: '#fff', boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)', borderRadius: 112, outline: '1px solid #E7E1FF', outlineOffset: -1, padding: 8 }}>
                    {['Monthly', 'Quarterly', 'Yearly'].map(f => (
                      <button key={f} onClick={() => setActiveTimeFilter(f)} className={`organ-paramTimeBtn ${activeTimeFilter === f ? 'is-active' : ''}`} style={{
                        padding: '6px 16px', borderRadius: 47, border: 'none',
                        background: activeTimeFilter === f ? '#fff' : 'transparent',
                        boxShadow: activeTimeFilter === f ? '0px 4px 27.3px rgba(0,0,0,0.05)' : 'none',
                        outline: activeTimeFilter === f ? '1px solid #E7E1FF' : 'none', outlineOffset: -1,
                        color: activeTimeFilter === f ? '#8B5CF6' : '#161616',
                        fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                      }}>{f}</button>
                    ))}
                  </div>
                </div>

                {/* Chart */}
                <div style={{ position: 'relative' }}>
                  <LineGraph
                    data={p.points.map(pt => ({ x: pt.label, y: pt.value }))}
                    stroke={chartColor}
                    height={196}
                  />
                </div>

                {/* Mobile scrubber (visual only) */}
                <div className="organ-paramScrubber" aria-hidden="true">
                  <div className="organ-paramScrubberThumb" />
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
