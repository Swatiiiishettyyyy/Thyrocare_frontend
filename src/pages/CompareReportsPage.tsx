import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'

const NAV_LINKS = [
  { label: 'Tests', href: '/' }, { label: 'Packages', href: '/' },
  { label: 'Reports', href: '/reports' }, { label: 'Metrics', href: '#' }, { label: 'Orders', href: '/orders' },
]

type Status = 'Normal' | 'High' | 'Low'
interface CompareParam {
  name: string; normalRange: string; prevValue: number; currValue: number
  unit: string; prevStatus: Status; currStatus: Status; change: string; dot: string
}

const PARAMS: CompareParam[] = [
  { name: 'Haemoglobin', normalRange: '13.5 – 17.5 g/dL', prevValue: 14, currValue: 14.2, unit: 'g/dl', prevStatus: 'Normal', currStatus: 'Normal', change: '↗ 1.4%', dot: '#10B981' },
  { name: 'Haemoglobin', normalRange: '13.5 – 17.5 g/dL', prevValue: 14, currValue: 14.2, unit: 'g/dl', prevStatus: 'Normal', currStatus: 'Normal', change: '↗ 1.4%', dot: '#10B981' },
  { name: 'WBC Count', normalRange: '4500 – 11000 /mcL', prevValue: 9200, currValue: 11200, unit: 'g/dl', prevStatus: 'Normal', currStatus: 'High', change: '↗ 21.7%', dot: '#F59E0B' },
  { name: 'Platelet Count', normalRange: '150,000 – 400,000 /mcL', prevValue: 140000, currValue: 160000, unit: 'g/dl', prevStatus: 'Normal', currStatus: 'Normal', change: '↗ 1.4%', dot: '#7C5CFC' },
]

const STATUS_STYLE: Record<Status, { bg: string; text: string }> = {
  Normal: { bg: '#CCFBF1', text: '#059669' },
  High:   { bg: '#FEF3C7', text: '#D97706' },
  Low:    { bg: '#EDE9FE', text: '#7C3AED' },
}

export default function CompareReportsPage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('All(8)')
  const filters = ['All(8)', 'Normal(7)', 'Needs Attention(2)', 'Red Blood Cells', 'White Blood Cells', 'Platelets']

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "'Poppins', sans-serif" }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px 40px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0 12px' }}>
          <span onClick={() => navigate('/reports')} style={{ fontSize: 13, color: '#9CA3AF', cursor: 'pointer' }}>Reports</span>
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>›</span>
          <span onClick={() => navigate('/report')} style={{ fontSize: 13, color: '#9CA3AF', cursor: 'pointer' }}>Report Detail</span>
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>›</span>
          <span style={{ fontSize: 13, color: '#7C5CFC', fontWeight: 500 }}>Compare Reports</span>
        </div>

        {/* Dark selector ribbon */}
        <div style={{ background: '#1B1F3B', borderRadius: 16, padding: '24px 28px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', minWidth: 160 }}>Select Reports to Compare</div>
          <div style={{ flex: 1, background: '#252A4A', borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 20 }}>📅</span>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>Latest Report</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>February 7th, 2026</span>
          </div>
          <div style={{ fontSize: 20, color: '#9CA3AF' }}>⇄</div>
          <div style={{ flex: 1, background: '#252A4A', borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 20 }}>📅</span>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>Compare with</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>Jan 27, 2025</span>
              <span style={{ color: '#9CA3AF' }}>▾</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>Parameters</span>
          <button style={{ background: 'none', border: 'none', color: '#7C5CFC', fontSize: 13, cursor: 'pointer' }}>Clear Filter</button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {filters.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              border: activeFilter === f ? 'none' : '1.5px solid #E5E7EB',
              background: activeFilter === f ? '#1B1F3B' : '#fff',
              color: activeFilter === f ? '#fff' : '#374151',
            }}>{f}</button>
          ))}
        </div>

        {/* 8 parameters badge */}
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#7C5CFC', background: '#EDE9FE', borderRadius: 20, padding: '4px 14px', border: '1.5px solid #C4B5FD' }}>8 parameters</span>
        </div>

        {/* Comparison cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PARAMS.map((p, i) => {
            const ps = STATUS_STYLE[p.prevStatus]
            const cs = STATUS_STYLE[p.currStatus]
            const fmtPrev = p.prevValue >= 1000 ? p.prevValue.toLocaleString('en-IN') : p.prevValue.toString()
            const fmtCurr = p.currValue >= 1000 ? p.currValue.toLocaleString('en-IN') : p.currValue.toString()
            return (
              <div key={i} style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: p.dot, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#fff', fontSize: 14 }}>✓</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>Normal range: {p.normalRange}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: p.dot, background: p.dot + '22', borderRadius: 20, padding: '3px 12px' }}>{p.change}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>Previous</div>
                    <div style={{ background: '#F0FDF9', borderRadius: 10, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 20, fontWeight: 500, color: '#111827' }}>{fmtPrev} <span style={{ fontSize: 13, fontWeight: 400, color: '#9CA3AF' }}>{p.unit}</span></span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: ps.text, background: ps.bg, borderRadius: 20, padding: '3px 12px' }}>{p.prevStatus}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>Current</div>
                    <div style={{ background: p.currStatus === 'High' ? '#FFF7ED' : '#F0FDF9', borderRadius: 10, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 20, fontWeight: 500, color: '#111827' }}>{fmtCurr} <span style={{ fontSize: 13, fontWeight: 400, color: '#9CA3AF' }}>{p.unit}</span></span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: cs.text, background: cs.bg, borderRadius: 20, padding: '3px 12px' }}>{p.currStatus}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
