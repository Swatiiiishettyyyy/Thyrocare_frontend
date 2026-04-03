import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Navbar } from '../components'
import heartIcon from '../assets/figma/Health metrics/Frame 1948760734.svg'

const NAV_LINKS = [
  { label: 'Tests',    href: '/' },
  { label: 'Packages', href: '/packages' },
  { label: 'Reports',  href: '/reports' },
  { label: 'Metrics',  href: '/metrics' },
  { label: 'Orders',   href: '/orders' },
]

const PARAMS = [
  { name: 'LDL Cholesterol', value: 110, unit: 'mg/dl', normalRange: '0 - 100 mg/dL', status: 'Abnormal' as const, change: '6.8%', changeDir: 'up' as const, data: [134, 128, 122, 118, 114, 110] },
  { name: 'HDL Cholesterol', value: 55,  unit: 'mg/dl', normalRange: '40 - 60 mg/dL', status: 'Normal'   as const, change: '2.1%', changeDir: 'up' as const, data: [48, 50, 52, 53, 54, 55] },
]

const DATES = ['Aug 15,23', 'Sept, 20', 'Oct 25', 'Nov 18', 'Dec 20', 'Jan 27']

const STATUS_STYLE = {
  Normal:   { bg: '#E6F6F3', color: '#41C9B3' },
  Abnormal: { bg: '#FFF0F0', color: '#E12D2D' },
}

function MiniChart({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data) - 10
  const max = Math.max(...data) + 10
  const w = 1069, h = 196
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / (max - min)) * h
    return `${x},${y}`
  }).join(' ')

  return (
    <div style={{ position: 'relative', width: '100%', height: 196 }}>
      <svg width="100%" height="196" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <line key={i} x1="0" y1={h * t} x2={w} y2={h * t} stroke="#E7E1FF" strokeWidth="2"/>
        ))}
        {/* Fill */}
        <polygon
          points={`0,${h} ${pts} ${w},${h}`}
          fill="url(#grad)" opacity="0.3"
        />
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#fff" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Line */}
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2"/>
        {/* Dots */}
        {data.map((v, i) => {
          const x = (i / (data.length - 1)) * w
          const y = h - ((v - min) / (max - min)) * h
          return <circle key={i} cx={x} cy={y} r="5" fill={color}/>
        })}
      </svg>
    </div>
  )
}

export default function OrganDetailPage() {
  const navigate = useNavigate()
  const { organ } = useParams<{ organ: string }>()
  const organName = organ ? organ.charAt(0).toUpperCase() + organ.slice(1) : 'Heart'

  const [activeParamFilter, setActiveParamFilter] = useState('All(8)')
  const [activeTimeFilter, setActiveTimeFilter] = useState('Monthly')

  return (
    <div style={{ minHeight: '100vh', background: '#F9F9F9', fontFamily: 'Poppins, sans-serif' }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 40px 60px', boxSizing: 'border-box' }}>

        {/* Header card */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '20px 20px 16px',
          boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
          outline: '1px solid #E7E1FF', outlineOffset: -1,
          marginBottom: 20,
        }}>
          {/* Organ name + status + score */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <img src={heartIcon} alt={organName} width={48} height={48} />
              <span style={{ fontSize: 20, fontWeight: 500, color: '#161616' }}>{organName}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ padding: '3px 10px', borderRadius: 100, background: '#FFF4EF', color: '#EA8C5A', fontSize: 15, fontFamily: 'Inter, sans-serif' }}>Monitor</span>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 500, color: '#161616', lineHeight: 1 }}>72</span>
                <span style={{ fontSize: 14, color: '#828282', marginBottom: 2, fontFamily: 'Inter, sans-serif' }}>/100</span>
                <svg width="16" height="10" viewBox="0 0 24 14" fill="none" style={{ marginBottom: 3 }}>
                  <path d="M1 13L12 2L23 13" stroke="#41C9B3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
          <span style={{ fontSize: 13, color: '#828282', display: 'block', textAlign: 'right', fontFamily: 'Inter, sans-serif' }}>Updated 15th Nov</span>

          {/* Insight banner */}
          <div style={{
            marginTop: 16, padding: '14px 18px',
            background: 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)',
            borderRadius: 16, display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-7-7z" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M13 2v7h7" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 14, color: '#fff', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
              LDL has reduced by 12% over the last 3 months. HDL is improving.
            </span>
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
            <button style={{ background: 'none', border: 'none', color: '#8B5CF6', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>Clear Filter</button>
          </div>

          {/* Filter row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: '#fff', boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)', borderRadius: 112, outline: '1px solid #E7E1FF', outlineOffset: -1, padding: 8 }}>
              {['All(8)', 'Normal(7)', 'Needs Attention(2)'].map(f => (
                <button key={f} onClick={() => setActiveParamFilter(f)} style={{
                  padding: '6px 16px', borderRadius: 47, border: 'none',
                  background: activeParamFilter === f ? '#fff' : 'transparent',
                  boxShadow: activeParamFilter === f ? '0px 4px 27.3px rgba(0,0,0,0.05)' : 'none',
                  outline: activeParamFilter === f ? '1px solid #E7E1FF' : 'none', outlineOffset: -1,
                  color: activeParamFilter === f ? '#8B5CF6' : '#414141',
                  fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
                }}>{f}</button>
              ))}
            </div>
            <div style={{ width: 1, height: 28, background: '#E7E1FF' }} />
            {['LDL Cholesterol', 'HDL Cholesterol', 'Triglycerides', 'Total Cholesterol', 'hs-CRP'].map(f => (
              <button key={f} style={{
                padding: '6px 14px', borderRadius: 36, border: 'none',
                background: '#F9F9F9', color: '#414141',
                fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
              }}>{f}</button>
            ))}
          </div>

          {/* Parameter cards with charts */}
          {PARAMS.map(p => {
            const ss = STATUS_STYLE[p.status]
            const chartColor = p.status === 'Normal' ? '#8B5CF6' : '#8B5CF6'
            return (
              <div key={p.name} style={{
                background: '#fff', borderRadius: 20, padding: '24px',
                outline: '1px solid #E7E1FF', outlineOffset: -1,
                marginBottom: 16,
              }}>
                {/* Param header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 500, color: '#161616', marginBottom: 8 }}>{p.name}</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 28, fontWeight: 600, color: '#161616', lineHeight: 1 }}>{p.value}</span>
                      <span style={{ fontSize: 15, color: '#828282', marginBottom: 2, fontFamily: 'Inter, sans-serif' }}>{p.unit}</span>
                      <span style={{ padding: '3px 10px', borderRadius: 100, background: ss.bg, color: ss.color, fontSize: 13, fontFamily: 'Inter, sans-serif' }}>{p.status}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#E6F6F3', borderRadius: 100 }}>
                        <svg width="14" height="10" viewBox="0 0 24 14" fill="none">
                          <path d="M1 13L12 2L23 13" stroke="#41C9B3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span style={{ fontSize: 13, color: '#101129', fontFamily: 'Inter, sans-serif' }}>{p.change}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, color: '#828282', fontFamily: 'Poppins, sans-serif' }}>
                      Normal range: <span style={{ color: '#161616' }}>{p.normalRange}</span>
                    </span>
                  </div>
                  {/* Time filter */}
                  <div style={{ display: 'flex', background: '#fff', boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)', borderRadius: 112, outline: '1px solid #E7E1FF', outlineOffset: -1, padding: 8 }}>
                    {['Monthly', 'Quarterly', 'Yearly'].map(f => (
                      <button key={f} onClick={() => setActiveTimeFilter(f)} style={{
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
                  {/* Y-axis labels */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 40 }}>
                    {['160', '120', '80', '40', '0'].map(v => (
                      <span key={v} style={{ fontSize: 13, color: '#828282', fontFamily: 'Poppins, sans-serif', textAlign: 'right', display: 'block' }}>{v}</span>
                    ))}
                  </div>
                  <div style={{ marginLeft: 48 }}>
                    <MiniChart data={p.data} color={chartColor} />
                    {/* X-axis labels */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                      {DATES.map(d => (
                        <span key={d} style={{ fontSize: 12, color: '#828282', fontFamily: 'Poppins, sans-serif' }}>{d}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Insights section */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '28px',
          boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
          outline: '1px solid #E7E1FF', outlineOffset: -1,
        }}>
          <div style={{ fontSize: 18, fontWeight: 500, color: '#161616', marginBottom: 20 }}>Insights</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              'LDL Cholesterol is currently above the normal range. Monitor closely.',
              'HDL levels are improving — keep up the current lifestyle changes.',
              'Triglycerides are within normal range. Continue monitoring quarterly.',
              'Total Cholesterol ratio is borderline. Consider dietary adjustments.',
            ].map((insight, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 4, height: 20, background: '#8B5CF6', borderRadius: 2, flexShrink: 0, marginTop: 3 }} />
                <span style={{ fontSize: 14, color: '#828282', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>{insight}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
