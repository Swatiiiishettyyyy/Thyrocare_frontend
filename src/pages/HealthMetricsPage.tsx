import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'

import heartIcon    from '../assets/figma/Health metrics/Frame 1948760734.svg'
import kidneyIcon   from '../assets/figma/Health metrics/Frame 1948760736.svg'
import liverIcon    from '../assets/figma/Health metrics/Frame 1948760738.svg'
import boneIcon     from '../assets/figma/Health metrics/Frame 1948760740.svg'
import gutIcon      from '../assets/figma/Health metrics/Frame 1948760739.svg'
import thyroidIcon  from '../assets/figma/Health metrics/Frame 1948760735.svg'
import bloodIcon    from '../assets/figma/Health metrics/Frame 1948760737.svg'
import vitaminsIcon from '../assets/figma/Health metrics/Frame 1948760741.svg'
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

const ORGANS = [
  { name: 'Heart',    icon: heartIcon,    status: 'Monitor'   as StatusType, score: 72,   updated: 'Updated 15th Nov', trend: 'up'   as const },
  { name: 'Kidney',   icon: kidneyIcon,   status: 'Good'      as StatusType, score: 88,   updated: 'Updated 15th Nov', trend: null },
  { name: 'Liver',    icon: liverIcon,    status: 'Good'      as StatusType, score: 88,   updated: 'Updated 15th Nov', trend: null },
  { name: 'Bone',     icon: boneIcon,     status: 'Good'      as StatusType, score: 88,   updated: 'Updated 15th Nov', trend: null },
  { name: 'Gut',      icon: gutIcon,      status: 'Good'      as StatusType, score: 88,   updated: 'Updated 15th Nov', trend: null },
  { name: 'Thyroid',  icon: thyroidIcon,  status: 'No Data'   as StatusType, score: null, updated: 'No Data Available', trend: null },
  { name: 'Blood',    icon: bloodIcon,    status: 'Good'      as StatusType, score: 88,   updated: 'Updated 15th Nov', trend: null },
  { name: 'Vitamins', icon: vitaminsIcon, status: 'Attention' as StatusType, score: 72,   updated: 'Updated 15th Nov', trend: 'down' as const },
]

const FILTERS = ['All', 'Heart', 'Kidney', 'Liver', 'Gut', 'Bone', 'Thyroid', 'Blood', 'Vitamins']

function OrganCard({ organ, onClick }: { organ: typeof ORGANS[0]; onClick: () => void }) {
  const st = STATUS_STYLE[organ.status]
  return (
    <div onClick={onClick} style={{
      background: '#fff',
      boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
      borderRadius: 20, padding: '16px 14px 12px',
      display: 'flex', flexDirection: 'column', gap: 0,
      cursor: 'pointer',
    }}>
      {/* Row 1: icon+name LEFT, status badge RIGHT */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={organ.icon} alt={organ.name} width={44} height={44} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 15, fontWeight: 400, color: '#161616', fontFamily: 'Poppins, sans-serif' }}>{organ.name}</span>
        </div>
        <span style={{
          padding: '3px 10px', borderRadius: 100,
          background: st.bg, color: st.color,
          fontSize: 13, fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
        }}>{organ.status}</span>
      </div>

      {/* Row 2: score large */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, marginBottom: 12 }}>
        {organ.score !== null ? (
          <>
            <span style={{ fontSize: 30, fontWeight: 500, color: '#161616', lineHeight: 1, fontFamily: 'Poppins, sans-serif' }}>{organ.score}</span>
            <span style={{ fontSize: 13, color: '#828282', marginBottom: 3, fontFamily: 'Inter, sans-serif' }}>/100</span>
            {organ.trend && (
              <svg width="18" height="12" viewBox="0 0 24 14" fill="none"
                style={{ marginBottom: 4, transform: organ.trend === 'down' ? 'rotate(180deg)' : 'none' }}>
                <path d="M1 13L12 2L23 13" stroke={organ.trend === 'down' ? '#E12D2D' : '#41C9B3'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </>
        ) : <div style={{ height: 30 }} />}
      </div>

      {/* Row 3: updated date right-aligned */}
      <span style={{ fontSize: 12, color: '#828282', textAlign: 'right', fontFamily: 'Inter, sans-serif', display: 'block' }}>
        {organ.updated}
      </span>
    </div>
  )
}

export default function HealthMetricsPage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('All')

  const filtered = activeFilter === 'All' ? ORGANS : ORGANS.filter(o => o.name === activeFilter)
  const leftCol  = filtered.filter((_, i) => i < 4)
  const rightCol = filtered.filter((_, i) => i >= 4)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(0deg, #E7E1FF 0%, #fff 100%)', fontFamily: 'Poppins, sans-serif' }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 40px 60px', boxSizing: 'border-box' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 500, color: '#161616', margin: '0 0 6px', lineHeight: 1.1 }}>Health Metrics</h1>
            <p style={{ fontSize: 15, color: '#828282', margin: 0, fontFamily: 'Poppins, sans-serif' }}>Track your organ health over time with smart insights.</p>
          </div>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', background: '#fff',
            boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
            borderRadius: 8, outline: '1px solid #E7E1FF', outlineOffset: -1,
            border: 'none', cursor: 'pointer',
          }}>
            <span style={{ fontSize: 15, fontWeight: 500, color: '#161616' }}>Self</span>
            <svg width="10" height="6" viewBox="0 0 12 8" fill="none">
              <path d="M1 1l5 5 5-5" stroke="#161616" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{
          display: 'flex', flexWrap: 'wrap',
          background: '#fff', boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
          borderRadius: 112, outline: '1px solid #E7E1FF', outlineOffset: -1,
          padding: 8, marginBottom: 32, width: 'fit-content',
        }}>
          {FILTERS.map(f => {
            const isActive = activeFilter === f
            return (
              <button key={f} onClick={() => setActiveFilter(f)} style={{
                padding: '8px 20px', borderRadius: 47, border: 'none',
                background: isActive ? '#fff' : 'transparent',
                boxShadow: isActive ? '0px 4px 27.3px rgba(0,0,0,0.05)' : 'none',
                outline: isActive ? '1px solid #E7E1FF' : 'none', outlineOffset: -1,
                color: isActive ? '#8B5CF6' : '#161616',
                fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
              }}>{f}</button>
            )
          })}
        </div>

        {/* 3-column layout: left cards | body | right cards */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

          {/* Left column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {leftCol.map(o => <OrganCard key={o.name} organ={o} onClick={() => navigate(`/metrics/${o.name.toLowerCase()}`)} />)}
          </div>

          {/* Body illustration — center */}
          <div style={{ width: 320, flexShrink: 0, position: 'relative', paddingTop: 40 }}>
            <img src={bodyImg} alt="Body" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 16 }} />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 100,
              background: 'linear-gradient(180deg, rgba(233,228,255,0.12) 0%, #EBE7FF 100%)',
              borderRadius: '0 0 16px 16px',
            }} />
          </div>

          {/* Right column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {rightCol.map(o => <OrganCard key={o.name} organ={o} onClick={() => navigate(`/metrics/${o.name.toLowerCase()}`)} />)}
          </div>

        </div>
      </div>
    </div>
  )
}
