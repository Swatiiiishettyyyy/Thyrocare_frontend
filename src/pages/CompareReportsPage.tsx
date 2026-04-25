import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Navbar } from '../components'
import { fetchMyReports, pickSampleCollectedTimestampFromReport, type MyReportRow } from '../api/orders'
import { fetchUploadedReports, type UploadedReportRow } from '../api/upload'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/' },
  { label: 'Reports', href: '/reports' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '/orders' },
]

type LocationState = { report?: MyReportRow } | null

type Status = 'Normal' | 'High' | 'Low'
type Point = { date: Date; label: string; value: number }

interface Biomarker {
  name: string
  code?: string
  category: string
  value: number
  unit: string
  normalRange: string
  low: number
  high: number
  status: Status
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

function biomarkerKey(b: { code?: string; name: string }): string {
  const code = normalizeParamCode(b.code ?? '')
  if (code) return `code:${code}`
  return `name:${normalizeParamName(b.name)}`
}

function parseNormalValRangeString(s: string): { low: number; high: number } {
  const m = String(s)
    .trim()
    .match(/([\d.]+(?:[eE][+-]?\d+)?)\s*[-–—]\s*([\d.]+(?:[eE][+-]?\d+)?)/)
  if (!m) return { low: NaN, high: NaN }
  return { low: Number(m[1]), high: Number(m[2]) }
}

const REPORT_ITEM_ARRAY_KEYS = [
  'biomarkers',
  'parameters',
  'results',
  'tests',
  'report_parameters',
  'analytes',
  'observations',
  'report_details',
  'report_lines',
  'test_results',
  'thyrocare_results',
  'lab_results',
  'line_items',
] as const

type AnyReportKind = 'lab' | 'uploaded'
type AnyReportRow = MyReportRow | UploadedReportRow

type AnyReportItem = {
  kind: AnyReportKind
  key: string
  row: AnyReportRow
  date: Date
  label: string
}

function firstReportItemArray(row: MyReportRow): unknown[] | null {
  for (const k of REPORT_ITEM_ARRAY_KEYS) {
    const v = row[k]
    if (Array.isArray(v) && v.length) return v
  }
  return null
}

function isThyrocareStyleLineRow(o: MyReportRow): boolean {
  const r = o as Record<string, unknown>
  const hasVal = r.test_value != null && String(r.test_value).trim() !== ''
  const hasName = !!(String(r.description ?? '').trim() || String(r.test_code ?? '').trim())
  return hasVal && hasName
}

function unwrapRowData(row: AnyReportRow): Record<string, unknown> {
  if (row == null || typeof row !== 'object') return {}
  const r = row as Record<string, unknown>
  const d = r.data
  if (d != null && typeof d === 'object' && !Array.isArray(d)) return d as Record<string, unknown>
  return r
}

function firstReportItemArrayAny(row: AnyReportRow): unknown[] | null {
  const r = unwrapRowData(row)
  for (const k of REPORT_ITEM_ARRAY_KEYS) {
    const v = r[k]
    if (Array.isArray(v) && v.length) return v
  }
  return null
}

function biomarkerFromReportItem(o: Record<string, unknown>): Biomarker | null {
  const codeRaw =
    o.test_code ??
    o.testCode ??
    o.code ??
    o.parameter_code ??
    o.parameterCode ??
    null
  const code = codeRaw != null && String(codeRaw).trim() ? String(codeRaw).trim() : undefined

  const name = String(
    o.name ??
      o.parameter_name ??
      o.test_name ??
      o.investigation ??
      o.label ??
      o.description ??
      o.test_code ??
      '',
  ).trim()
  if (!name) return null

  const rawVal = o.value ?? o.result ?? o.observed_value ?? o.reading ?? o.test_value
  if (rawVal == null) return null
  if (typeof rawVal === 'string' && !rawVal.trim()) return null
  const value = Number(String(rawVal).replace(/,/g, ''))

  let low = Number(o.low ?? o.min ?? o.reference_low ?? o.lower_bound ?? NaN)
  let high = Number(o.high ?? o.max ?? o.reference_high ?? o.upper_bound ?? NaN)
  const rangeSrc = String(
    o.normal_range ?? o.reference_range ?? o.range ?? o.normal_val ?? '',
  ).trim()
  if ((!Number.isFinite(low) || !Number.isFinite(high)) && rangeSrc) {
    const p = parseNormalValRangeString(rangeSrc)
    if (Number.isFinite(p.low) && Number.isFinite(p.high)) {
      low = p.low
      high = p.high
    }
  }

  const unit = String(o.unit ?? o.units ?? '')
  const normalRange =
    rangeSrc || (Number.isFinite(low) && Number.isFinite(high) ? `${low} – ${high}` : '—')

  let status: Status = 'Normal'
  const ind = String(o.indicator ?? '').trim().toUpperCase()
  if (ind === 'RED' || ind === 'HIGH' || ind === 'H') status = 'High'
  else if (ind === 'LOW' || ind === 'L') status = 'Low'
  else {
    const st = String(o.status ?? o.flag ?? o.interpretation ?? '').toLowerCase()
    if (st.includes('high') || st === 'h') status = 'High'
    else if (st.includes('low') || st === 'l') status = 'Low'
    else if (Number.isFinite(value) && Number.isFinite(low) && Number.isFinite(high)) {
      if (value > high) status = 'High'
      else if (value < low) status = 'Low'
    }
  }

  const catRaw = o.report_group ?? o.group ?? o.department ?? o.category
  const category =
    catRaw != null && String(catRaw).trim() ? String(catRaw).trim() : 'Results'

  return {
    name,
    code,
    category,
    value: Number.isFinite(value) ? value : NaN,
    unit,
    normalRange,
    low,
    high,
    status,
  }
}

function parseBiomarkersFromRow(row: MyReportRow | null): Biomarker[] {
  if (!row) return []
  const arr = firstReportItemArray(row)
  if (arr) {
    const out: Biomarker[] = []
    for (const item of arr) {
      if (item == null || typeof item !== 'object') continue
      const b = biomarkerFromReportItem(item as Record<string, unknown>)
      if (b) out.push(b)
    }
    return out
  }
  if (isThyrocareStyleLineRow(row)) {
    const b = biomarkerFromReportItem(row as Record<string, unknown>)
    return b ? [b] : []
  }
  return []
}

function parseBiomarkersFromAnyRow(row: AnyReportRow | null): Biomarker[] {
  if (!row) return []
  const r = unwrapRowData(row)
  const arr = firstReportItemArrayAny(r)
  if (arr) {
    const out: Biomarker[] = []
    for (const item of arr) {
      if (item == null || typeof item !== 'object') continue
      const b = biomarkerFromReportItem(item as Record<string, unknown>)
      if (b) out.push(b)
    }
    return out
  }
  // Uploaded reports may also come in Thyrocare-style single-line rows.
  if (isThyrocareStyleLineRow(r as MyReportRow)) {
    const b = biomarkerFromReportItem(r as Record<string, unknown>)
    return b ? [b] : []
  }
  return []
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function parseReportDate(row: MyReportRow): Date | null {
  const picked = pickSampleCollectedTimestampFromReport(row)
  const raw =
    picked ??
    String(
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

function strAny(row: AnyReportRow, ...keys: string[]): string {
  const r = unwrapRowData(row)
  for (const k of keys) {
    const v = r[k]
    if (v != null && String(v).trim()) return String(v).trim()
  }
  return ''
}

function parseAnyReportDate(row: AnyReportRow): Date | null {
  // Prefer the same source as lab reports when present.
  const picked =
    (row as any) != null && typeof row === 'object'
      ? pickSampleCollectedTimestampFromReport(row as MyReportRow)
      : null
  const raw = String(
    picked ??
      strAny(
        row,
        'sample_date',
        'sampleDate',
        'report_date',
        'reportDate',
        'completed_at',
        'created_at',
        'updated_at',
        'uploaded_at',
        'uploadedAt',
        'timestamp',
        'date',
      ) ??
      '',
  ).trim()
  if (!raw) return null
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null
  return d
}

function anyReportKey(kind: AnyReportKind, row: AnyReportRow, index: number): string {
  const r = unwrapRowData(row)
  if (kind === 'lab') {
    const key = String((r.order_id ?? r.id ?? r.thyrocare_order_id ?? '') as any).trim()
    return key || `lab:${index}`
  }
  const key = String((r.upload_id ?? r.report_id ?? r.id ?? r.file_id ?? '') as any).trim()
  if (key) return `uploaded:${key}`
  const fn = String((r.report_name ?? r.file_name ?? r.fileName ?? '') as any).trim()
  const dt = String((r.created_at ?? r.uploaded_at ?? r.report_date ?? '') as any).trim()
  return `uploaded:${fn || 'file'}:${dt || index}`
}

function SparkLine({ points }: { points: Point[] }) {
  const w = 980
  const h = 220
  const pad = 20
  if (points.length < 2) {
    return (
      <div style={{ padding: 16, background: '#fff', borderRadius: 12, outline: '1px solid #E7E1FF' }}>
        Not enough data points to plot a trend.
      </div>
    )
  }

  const ys = points.map(p => p.value).filter(v => Number.isFinite(v))
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const span = maxY - minY || 1

  const xFor = (i: number) => pad + (i * (w - pad * 2)) / Math.max(1, points.length - 1)
  const yFor = (v: number) => pad + (1 - (v - minY) / span) * (h - pad * 2)

  const d = points
    .map((p, i) => {
      const x = xFor(i)
      const y = yFor(p.value)
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 16, outline: '1px solid #E7E1FF' }}>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Trend chart">
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={w} height={h} fill="#fff" />

        {/* Axes baseline */}
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#F3F4F6" />
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#F3F4F6" />

        {/* Area fill */}
        <path d={`${d} L ${xFor(points.length - 1).toFixed(2)} ${(h - pad).toFixed(2)} L ${xFor(0).toFixed(2)} ${(h - pad).toFixed(2)} Z`} fill="url(#lineFill)" />

        {/* Line */}
        <path d={d} fill="none" stroke="#8B5CF6" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

        {/* Points */}
        {points.map((p, i) => (
          <circle key={`${p.label}-${p.date.getTime()}-${i}`} cx={xFor(i)} cy={yFor(p.value)} r="4.5" fill="#8B5CF6" />
        ))}

        {/* X labels (first/last) */}
        <text x={xFor(0)} y={h - 2} fontSize="12" textAnchor="start" fill="#6B7280">
          {points[0]?.label}
        </text>
        <text x={xFor(points.length - 1)} y={h - 2} fontSize="12" textAnchor="end" fill="#6B7280">
          {points[points.length - 1]?.label}
        </text>

        {/* Y labels (min/max) */}
        <text x={pad} y={pad - 6} fontSize="12" textAnchor="start" fill="#6B7280">
          {maxY.toFixed(2)}
        </text>
        <text x={pad} y={h - pad + 14} fontSize="12" textAnchor="start" fill="#6B7280">
          {minY.toFixed(2)}
        </text>
      </svg>
    </div>
  )
}

export default function CompareReportsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentMember } = useAuth()
  const seedReport = (location.state as LocationState)?.report ?? null

  const [reports, setReports] = useState<MyReportRow[]>(seedReport ? [seedReport] : [])
  const [uploadedReports, setUploadedReports] = useState<UploadedReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReportKeys, setSelectedReportKeys] = useState<string[]>([])
  const [selectedParamKey, setSelectedParamKey] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const memberId = currentMember?.member_id ?? undefined
    Promise.allSettled([fetchMyReports(memberId), fetchUploadedReports(memberId)])
      .then(([labRes, upRes]) => {
        if (cancelled) return
        const lab = labRes.status === 'fulfilled' ? labRes.value : []
        const upl = upRes.status === 'fulfilled' ? upRes.value : []
        setReports(lab)
        setUploadedReports(upl)

        // Auto-select 2 most recent across both sources.
        const all: AnyReportItem[] = []
        for (let i = 0; i < lab.length; i++) {
          const r = lab[i]!
          const d = parseAnyReportDate(r)
          if (!d) continue
          all.push({ kind: 'lab', key: anyReportKey('lab', r, i), row: r, date: d, label: formatShortDate(d) })
        }
        for (let i = 0; i < upl.length; i++) {
          const r = upl[i]!
          const d = parseAnyReportDate(r)
          if (!d) continue
          all.push({ kind: 'uploaded', key: anyReportKey('uploaded', r, i), row: r, date: d, label: formatShortDate(d) })
        }
        all.sort((a, b) => b.date.getTime() - a.date.getTime())
        const keys = all.slice(0, 2).map(x => x.key)
        if (keys.length >= 2) setSelectedReportKeys(keys.slice(0, 2))
      })
      .catch(() => {
        if (!cancelled) setError('Could not load reports to compare.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [currentMember?.member_id])

  const reportItems = useMemo(() => {
    const items: AnyReportItem[] = []
    for (let i = 0; i < reports.length; i++) {
      const r = reports[i]!
      const d = parseAnyReportDate(r)
      const key = anyReportKey('lab', r, i)
      if (!key || !d) continue
      items.push({ kind: 'lab', key, row: r, date: d, label: formatShortDate(d) })
    }
    for (let i = 0; i < uploadedReports.length; i++) {
      const r = uploadedReports[i]!
      const d = parseAnyReportDate(r)
      const key = anyReportKey('uploaded', r, i)
      if (!key || !d) continue
      items.push({ kind: 'uploaded', key, row: r, date: d, label: formatShortDate(d) })
    }
    items.sort((a, b) => b.date.getTime() - a.date.getTime())
    return items
  }, [reports, uploadedReports])

  const selectedRows = useMemo(() => {
    const wanted = new Set(selectedReportKeys)
    const picked = reportItems.filter(x => wanted.has(x.key))
    picked.sort((a, b) => a.date.getTime() - b.date.getTime())
    return picked
  }, [reportItems, selectedReportKeys])

  const availableParams = useMemo(() => {
    const keyTo = new Map<string, { label: string; unit: string }>()
    for (const it of selectedRows) {
      for (const b of parseBiomarkersFromAnyRow(it.row)) {
        if (!b.name) continue
        const key = biomarkerKey(b)
        if (!keyTo.has(key)) {
          const label = b.name.trim()
          keyTo.set(key, { label, unit: b.unit || '' })
        }
      }
    }
    return [...keyTo.entries()]
      .map(([key, v]) => ({ key, name: v.label, unit: v.unit }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [selectedRows])

  useEffect(() => {
    if (!selectedParamKey && availableParams.length) {
      setSelectedParamKey(availableParams[0]!.key)
    }
  }, [availableParams, selectedParamKey])

  const series = useMemo((): { points: Point[]; unit: string } => {
    const points: Point[] = []
    let unit = ''
    for (const it of selectedRows) {
      const biom = parseBiomarkersFromAnyRow(it.row).find(b => biomarkerKey(b) === selectedParamKey)
      if (!biom || !Number.isFinite(biom.value)) continue
      unit = biom.unit || unit
      points.push({ date: it.date, label: it.label, value: biom.value })
    }
    return { points, unit }
  }, [selectedRows, selectedParamKey])

  return (
    <div style={{ minHeight: '100vh', background: '#F9F9F9', fontFamily: 'Poppins, sans-serif', overflowX: 'hidden' }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} />

      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '0 clamp(12px, 3vw, 32px) 32px',
        boxSizing: 'border-box',
        width: '100%',
      }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 0 24px' }}>
          {[
            { label: 'Reports', path: '/reports' },
            { label: 'Report Detail', path: '/report' },
            { label: 'Compare Reports', path: null },
          ].map((crumb, i, arr) => (
            <span key={crumb.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                onClick={() => crumb.path && navigate(crumb.path)}
                style={{
                  fontSize: 13,
                  fontFamily: 'Inter, sans-serif',
                  color: i === arr.length - 1 ? '#161616' : '#828282',
                  cursor: crumb.path ? 'pointer' : 'default',
                }}
              >
                {crumb.label}
              </span>
              {i < arr.length - 1 && (
                <svg width="6" height="10" viewBox="0 0 8 12" fill="none">
                  <path d="M1 1l6 5-6 5" stroke="#828282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
          ))}
        </div>

        {/* Dark selector ribbon */}
        <div style={{
          background: '#101129',
          borderRadius: 10,
          padding: '20px 28px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          boxSizing: 'border-box',
          width: '100%',
        }}>
          {/* Title */}
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 500, flexShrink: 0, maxWidth: 160 }}>
            Select Reports to Compare
          </div>

          {/* Report selectors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 auto', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <select
              value={selectedReportKeys[0] ?? ''}
              onChange={e => {
                const v = e.target.value
                setSelectedReportKeys(prev => [v, prev[1] ?? ''].filter(Boolean))
              }}
              style={{ background: 'transparent', color: '#fff', border: '1px solid #2A2C5B', borderRadius: 10, padding: '10px 12px', minWidth: 200 }}
            >
              <option value="" style={{ color: '#111827' }}>Select report</option>
              {reportItems.map(r => (
                <option key={r.key} value={r.key} style={{ color: '#111827' }}>
                  {r.label}{r.kind === 'uploaded' ? ' · Uploaded' : ''}
                </option>
              ))}
            </select>
            <span style={{ color: '#fff', opacity: 0.7 }}>vs</span>
            <select
              value={selectedReportKeys[1] ?? ''}
              onChange={e => {
                const v = e.target.value
                setSelectedReportKeys(prev => [prev[0] ?? '', v].filter(Boolean))
              }}
              style={{ background: 'transparent', color: '#fff', border: '1px solid #2A2C5B', borderRadius: 10, padding: '10px 12px', minWidth: 200 }}
            >
              <option value="" style={{ color: '#111827' }}>Select report</option>
              {reportItems.map(r => (
                <option key={r.key} value={r.key} style={{ color: '#111827' }}>
                  {r.label}{r.kind === 'uploaded' ? ' · Uploaded' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {loading ? (
            <div style={{ padding: 16, color: '#6B7280' }}>Loading reports…</div>
          ) : error ? (
            <div style={{ padding: 16, color: '#B91C1C' }}>{error}</div>
          ) : selectedRows.length < 2 ? (
            <div style={{ padding: 16, background: '#fff', borderRadius: 12, outline: '1px solid #E7E1FF' }}>
              Select two reports to compare.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Trend</span>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>
                    {selectedParamKey ? `${availableParams.find(p => p.key === selectedParamKey)?.name ?? 'Parameter'}${series.unit ? ` (${series.unit})` : ''}` : 'Choose a parameter'}
                  </span>
                </div>
                <select
                  value={selectedParamKey}
                  onChange={e => setSelectedParamKey(e.target.value)}
                  style={{ background: '#fff', border: '1px solid #E7E1FF', borderRadius: 10, padding: '10px 12px', minWidth: 260 }}
                >
                  {availableParams.length === 0 ? (
                    <option value="">No numeric parameters found</option>
                  ) : (
                    availableParams.map(p => (
                      <option key={p.key} value={p.key}>
                        {p.name}{p.unit ? ` (${p.unit})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <SparkLine points={series.points} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
