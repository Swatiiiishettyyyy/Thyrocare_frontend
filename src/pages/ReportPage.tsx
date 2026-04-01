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
  const iconBg = CAT_ICON_BG[b.category] || '#7C5CFC'
  const p = pct(b.value, b.low, b.high)
  const fmtVal = b.value >= 1000 ? b.value.toLocaleString('en-IN') : b.value.toString()
  const fmtLow = b.low >= 1000 ? b.low.toLocaleString('en-IN') : b.low.toString()
  const fmtHigh = b.high >= 1000 ? b.high.toLocaleString('en-IN') : b.high.toString()

  return (
    <div style={{ background: ss.card_bg, border: '1px solid #E5E7EB', borderRadius: 14, padding: '16px 20px', marginBottom: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: iconBg + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: iconBg }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{b.name}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{b.category}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: ss.badge_text, background: ss.badge_bg, borderRadius: 20, padding: '3px 14px' }}>{b.status}</span>
          <span style={{ color: '#D1D5DB' }}>›</span>
        </div>
      </div>
      {/* Value */}
      <div style={{ marginBottom: 4 }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: '#111827' }}>{fmtVal}</span>
        <span style={{ fontSize: 13, color: '#9CA3AF', marginLeft: 4 }}>{b.unit}</span>
      </div>
      <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>Normal range: {b.normalRange}</div>
      {/* Range bar */}
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <div style={{ height: 4, borderRadius: 2, background: '#E5E7EB', position: 'relative' }}>
          {/* Value label above dot */}
          <div style={{ position: 'absolute', left: `${p}%`, bottom: 10, transform: 'translateX(-50%)', background: ss.dot, color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '1px 5px', whiteSpace: 'nowrap' }}>
            {fmtVal}
          </div>
          <div style={{ position: 'absolute', left: `${p}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: '50%', background: ss.dot, border: '2px solid #fff', boxShadow: `0 0 0 2px ${ss.dot}66` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11 }}>
          <span style={{ color: '#9CA3AF' }}>Low</span>
          <span style={{ color: '#374151', fontWeight: 600 }}>{fmtLow}</span>
          <span style={{ color: '#374151', fontWeight: 600 }}>{fmtHigh}</span>
          <span style={{ color: '#9CA3AF' }}>High</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#7C5CFC', display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
        <span>📊</span> {b.historical} Historical readings available
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

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 40px' }}>

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
        <div style={{ background: '#1B1F3B', borderRadius: 16, padding: '20px 28px 24px', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Complete Blood Count (CBC)</h2>
                <span style={{ fontSize: 12, color: '#9CA3AF', border: '1px solid #374151', borderRadius: 20, padding: '2px 10px' }}>Single Test</span>
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 10 }}>📅 Saturday, February 7th, 2026</div>
              <div style={{ display: 'flex', gap: 24, marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: '#9CA3AF' }}>Test Groups: <span style={{ color: '#7C5CFC', fontWeight: 600 }}>4</span></span>
                <span style={{ fontSize: 13, color: '#9CA3AF' }}>Parameters: <span style={{ color: '#7C5CFC', fontWeight: 600 }}>14</span></span>
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>👤 Patient: Anany Sharma</span>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>🔵 Collected: 2023-12-26 09:00 AM</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <button style={{ background: 'none', border: '1px solid #374151', color: '#9CA3AF', borderRadius: 8, padding: '8px 16px', fontSize: 12, cursor: 'pointer' }}>⬇ Download PDF</button>
              <button style={{ background: 'none', border: '1px solid #374151', color: '#9CA3AF', borderRadius: 8, padding: '8px 16px', fontSize: 12, cursor: 'pointer' }}>⬆ Share</button>
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
