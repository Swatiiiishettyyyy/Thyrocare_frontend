import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'

const NAV_LINKS = [
  { label: 'Tests', href: '/' }, { label: 'Packages', href: '/' },
  { label: 'Reports', href: '/reports' }, { label: 'Metrics', href: '#' }, { label: 'Orders', href: '/orders' },
]

type Status = 'Normal' | 'High' | 'Low'
interface Biomarker {
  name: string; category: string; value: number; unit: string
  normalRange: string; low: number; high: number; status: Status; historical: number
}

const BIOMARKERS: Biomarker[] = [
  { name: 'Haemoglobin', category: 'Red Blood Cells', value: 14.2, unit: 'g/dl', normalRange: '13.5 – 17.5 g/dL', low: 13.5, high: 17.5, status: 'Normal', historical: 6 },
  { name: 'Haemoglobin', category: 'Red Blood Cells', value: 14.2, unit: 'g/dl', normalRange: '13.5 – 17.5 g/dL', low: 13.5, high: 17.5, status: 'Normal', historical: 6 },
  { name: 'Haemoglobin', category: 'Red Blood Cells', value: 14.2, unit: 'g/dl', normalRange: '13.5 – 17.5 g/dL', low: 13.5, high: 17.5, status: 'Normal', historical: 6 },
  { name: 'WBC Count', category: 'White Blood Cells', value: 11200, unit: '/mcL', normalRange: '4,500 – 11,000 /mcL', low: 4500, high: 11000, status: 'High', historical: 6 },
  { name: 'Platelet Count', category: 'Platelets', value: 140000, unit: '/mcL', normalRange: '1,50,000 – 4,00,000 /mcL', low: 150000, high: 400000, status: 'Low', historical: 6 },
]

const STATUS_STYLE: Record<Status, { badge_bg: string; badge_text: string; dot: string; card_bg: string }> = {
  Normal: { badge_bg: '#CCFBF1', badge_text: '#059669', dot: '#10B981', card_bg: '#F0FDF9' },
  High:   { badge_bg: '#FEF3C7', badge_text: '#D97706', dot: '#F59E0B', card_bg: '#FFFBEB' },
  Low:    { badge_bg: '#EDE9FE', badge_text: '#7C3AED', dot: '#7C5CFC', card_bg: '#F5F3FF' },
}

const CAT_ICON_BG: Record<string, string> = {
  'Red Blood Cells': '#10B981',
  'White Blood Cells': '#F59E0B',
  'Platelets': '#7C5CFC',
}

function pct(value: number, low: number, high: number) {
  const ext = (high - low) * 0.3
  const min = low - ext, max = high + ext
  return Math.min(96, Math.max(4, ((value - min) / (max - min)) * 100))
}

function BiomarkerCard({ b }: { b: Biomarker }) {
  const ss = STATUS_STYLE[b.status]
  const p = pct(b.value, b.low, b.high)
  const fmtVal = b.value >= 1000 ? b.value.toLocaleString('en-IN') : b.value.toString()
  const fmtLow = b.low >= 1000 ? b.low.toLocaleString('en-IN') : b.low.toString()
  const fmtHigh = b.high >= 1000 ? b.high.toLocaleString('en-IN') : b.high.toString()

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden', marginBottom: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>

      {/* Coloured header row */}
      <div style={{ background: ss.card_bg, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Circle icon with minus */}
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: ss.dot, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="3" viewBox="0 0 14 3" fill="none"><rect width="14" height="3" rx="1.5" fill="#fff"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{b.name}</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{b.category}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: ss.dot, borderRadius: 100, padding: '6px 18px' }}>{b.status}</span>
          <svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 24px 20px' }}>
        {/* Value */}
        <div style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 32, fontWeight: 600, color: '#111827', letterSpacing: '-0.5px' }}>{fmtVal}</span>
          <span style={{ fontSize: 14, color: '#9CA3AF', marginLeft: 6 }}>{b.unit}</span>
        </div>
        <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 24 }}>Normal range: {b.normalRange}</div>

        {/* Range bar */}
        <div style={{ position: 'relative', marginBottom: 6 }}>
          {/* Dot on bar */}
          <div style={{ height: 4, borderRadius: 2, background: '#E5E7EB', position: 'relative', marginBottom: 28 }}>
            <div style={{ position: 'absolute', left: `${p}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 10, height: 10, borderRadius: '50%', background: ss.dot }} />
          </div>
          {/* Labels row: Low | fmtLow ... value pill ... fmtHigh | High */}
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <span style={{ fontSize: 13, color: '#9CA3AF', marginRight: 12 }}>Low</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginRight: 'auto' }}>{fmtLow}</span>
            {/* Value pill — positioned at p% */}
            <span style={{
              position: 'absolute', left: `${p}%`, transform: 'translateX(-50%)',
              background: ss.dot, color: '#fff', fontSize: 12, fontWeight: 600,
              borderRadius: 100, padding: '3px 10px', whiteSpace: 'nowrap',
            }}>{fmtVal}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginLeft: 'auto' }}>{fmtHigh}</span>
            <span style={{ fontSize: 13, color: '#9CA3AF', marginLeft: 12 }}>High</span>
          </div>
        </div>

        {/* Historical readings */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid #F3F4F6' }}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <rect x="1" y="8" width="3" height="9" rx="1" fill="#7C5CFC" opacity="0.5"/>
            <rect x="6" y="5" width="3" height="12" rx="1" fill="#7C5CFC" opacity="0.7"/>
            <rect x="11" y="2" width="3" height="15" rx="1" fill="#7C5CFC"/>
            <rect x="16" y="6" width="3" height="11" rx="1" fill="#7C5CFC" opacity="0.6"/>
          </svg>
          <span style={{ fontSize: 13, color: '#374151' }}>{b.historical} Historical readings available</span>
        </div>
      </div>
    </div>
  )
}

export default function ReportPage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('All(8)')
  const filters = ['All(8)', 'Normal(7)', 'Needs Attention(2)', 'Red Blood Cells', 'White Blood Cells', 'Platelets']
  const normal = BIOMARKERS.filter(b => b.status === 'Normal').length
  const high = BIOMARKERS.filter(b => b.status === 'High').length
  const low = BIOMARKERS.filter(b => b.status === 'Low').length

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "'Poppins', sans-serif" }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px 40px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0 0', marginBottom: 4 }}>
          <span onClick={() => navigate('/reports')} style={{ fontSize: 15, color: '#9CA3AF', cursor: 'pointer', fontWeight: 400 }}>Reports</span>
          <span style={{ fontSize: 15, color: '#9CA3AF' }}>›</span>
          <span style={{ fontSize: 15, color: '#1B1F3B', fontWeight: 600 }}>Report Detail</span>
        </div>
        {/* Compare Reports + View Insights — above the dark card */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, marginBottom: 12 }}>
          <button onClick={() => navigate('/compare-reports')} style={{ background: '#7C5CFC', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>📊 Compare Reports</button>
          <button style={{ background: 'none', color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>✓ View Insights</button>
        </div>

        {/* Dark header card */}
        <div style={{ background: '#1B1F3B', borderRadius: 16, padding: '32px 36px 28px', marginBottom: 12 }}>
          {/* Row 1: Title + badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <h2 style={{ fontSize: 24, fontWeight: 500, color: '#fff', margin: 0 }}>Complete Blood Count (CBC)</h2>
            <span style={{ fontSize: 12, color: '#9CA3AF', border: '1px solid #4B5280', borderRadius: 20, padding: '3px 14px', whiteSpace: 'nowrap' }}>Single Test</span>
          </div>

          {/* Row 2: Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 20 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="13" rx="2" stroke="#7C5CFC" strokeWidth="1.2"/><path d="M5 1v2M11 1v2M1 6h14" stroke="#7C5CFC" strokeWidth="1.2" strokeLinecap="round"/></svg>
            <span style={{ fontSize: 13, color: '#9CA3AF' }}>Saturday, February, 7th, 2026</span>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #2D3160', marginBottom: 20 }} />

          {/* Row 3: Patient + Collected + Download/Share */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="6" r="4" stroke="#9CA3AF" strokeWidth="1.3"/><path d="M2 18c0-4 3.6-7 8-7s8 3 8 7" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round"/></svg>
                Patient: Anany Sharma
              </span>
              <span style={{ fontSize: 14, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="#9CA3AF" strokeWidth="1.3"/><path d="M10 6v4l3 2" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round"/></svg>
                Collected: 2023-12-20 09:00 AM
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <button style={{ background: 'none', border: '1.5px solid #4B5280', color: '#fff', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Download PDF
              </button>
              <button style={{ background: 'none', border: '1.5px solid #4B5280', color: '#fff', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11 2a2 2 0 110 4 2 2 0 010-4zM5 7a2 2 0 110 4A2 2 0 015 7zm6 3a2 2 0 110 4 2 2 0 010-4zM7 8.5l2-1.5M7 9.5l2 1.5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/></svg>
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Stats bar — directly below header, no gap */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div style={{ background: '#10B981', padding: '16px', textAlign: 'center', borderRadius: 12 }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{normal}</div>
            <div style={{ fontSize: 13, color: '#fff', opacity: 0.9, marginTop: 4 }}>Normal</div>
          </div>
          <div style={{ background: '#E8845A', padding: '16px', textAlign: 'center', borderRadius: 12 }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{high}</div>
            <div style={{ fontSize: 13, color: '#fff', opacity: 0.9, marginTop: 4 }}>High</div>
          </div>
          <div style={{ background: '#7C5CFC', padding: '16px', textAlign: 'center', borderRadius: 12 }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{low}</div>
            <div style={{ fontSize: 13, color: '#fff', opacity: 0.9, marginTop: 4 }}>Low</div>
          </div>
        </div>

        {/* Alert banner */}
        {high > 0 || low > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            <span style={{ fontSize: 13, color: '#374151' }}>{high + low} test group{high + low !== 1 ? 's' : ''} with parameters outside normal range. Expand below to review.</span>
          </div>
        ) : null}

        {/* Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {filters.map(f => (
              <button key={f} onClick={() => setActiveFilter(f)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                border: activeFilter === f ? 'none' : '1.5px solid #E5E7EB',
                background: activeFilter === f ? '#1B1F3B' : '#fff',
                color: activeFilter === f ? '#fff' : '#374151',
              }}>{f}</button>
            ))}
          </div>
          <button style={{ background: 'none', border: 'none', color: '#7C5CFC', fontSize: 13, cursor: 'pointer' }}>Clear Filter</button>
        </div>

        {/* Biomarker cards by category */}
        {['Red Blood Cells', 'White Blood Cells', 'Platelets'].map(cat => {
          const markers = BIOMARKERS.filter(b => b.category === cat)
          if (!markers.length) return null
          return (
            <div key={cat}>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: '16px 0 8px' }}>{cat}</p>
              {markers.map((b, i) => <BiomarkerCard key={i} b={b} />)}
            </div>
          )
        })}

      </div>
    </div>
  )
}
