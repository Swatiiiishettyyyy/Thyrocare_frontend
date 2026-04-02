import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'

// Use existing organ images from root figma folder
import heartImg   from '../assets/figma/Heart.png'
import kidneyImg  from '../assets/figma/kidney.png'
import liverImg   from '../assets/figma/liver.png'
import boneImg    from '../assets/figma/Bone.png'
import gutImg     from '../assets/figma/Gut.png'
import hormoneImg from '../assets/figma/Hormone.png'
import vitaminImg from '../assets/figma/Vitamin.png'

const NAV_LINKS = [
  { label: 'Tests',    href: '/' },
  { label: 'Packages', href: '/' },
  { label: 'Reports',  href: '#' },
  { label: 'Metrics',  href: '/metrics' },
  { label: 'Orders',   href: '/orders' },
]

type StatusType = 'Good' | 'Monitor' | 'Attention' | 'No Data'

interface OrganMetric {
  name: string
  icon: string
  status: StatusType
  score: number | null
  updated: string
  trend?: 'up' | 'down' | null
}

const STATUS_STYLE: Record<StatusType, { bg: string; color: string }> = {
  Good:      { bg: '#E6F6F3', color: '#41C9B3' },
  Monitor:   { bg: '#FFF4EF', color: '#EA8C5A' },
  Attention: { bg: '#FFF0F0', color: '#E12D2D' },
  'No Data': { bg: '#F4F4F4', color: '#828282' },
}

const ORGANS: OrganMetric[] = [
  { name: 'Heart',   icon: heartImg,   status: 'Monitor',   score: 72, updated: 'Updated 15th Nov', trend: 'up' },
  { name: 'Kidney',  icon: kidneyImg,  status: 'Good',      score: 88, updated: 'Updated 15th Nov', trend: null },
  { name: 'Liver',   icon: liverImg,   status: 'Good',      score: 88, updated: 'Updated 15th Nov', trend: null },
  { name: 'Bone',    icon: boneImg,    status: 'Good',      score: 88, updated: 'Updated 15th Nov', trend: null },
  { name: 'Gut',     icon: gutImg,     status: 'Good',      score: 88, updated: 'Updated 15th Nov', trend: null },
  { name: 'Thyroid', icon: hormoneImg, status: 'No Data',   score: null, updated: 'No Data Available', trend: null },
  { name: 'Blood',   icon: heartImg,   status: 'Good',      score: 88, updated: 'Updated 15th Nov', trend: null },
  { name: 'Vitamins',icon: vitaminImg, status: 'Attention', score: 72, updated: 'Updated 15th Nov', trend: 'down' },
]

const FILTERS = ['All', 'Heart', 'Kidney', 'Liver', 'Gut', 'Bone', 'Thyroid', 'Blood', 'Vitamins']

export default function HealthMetricsPage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('All')

  const filtered = activeFilter === 'All'
    ? ORGANS
    : ORGANS.filter(o => o.name === activeFilter)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(0deg, #E7E1FF 0%, #fff 100%)', fontFamily: 'Poppins, sans-serif', overflowX: 'hidden' }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} />

      <div style={{ maxWidth: 1700, margin: '0 auto', padding: '24px clamp(16px, 4vw, 56px) 60px', boxSizing: 'border-box', width: '100%' }}>

        {/* Header row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 'clamp(18px, 2vw, 32px)', fontWeight: 500, color: '#161616', lineHeight: 1.03 }}>Health Metrics</span>
            <span style={{ fontSize: 'clamp(12px, 1vw, 20px)', color: '#828282', fontWeight: 400 }}>Track your organ health over time with smart insights.</span>
          </div>
          {/* Person selector */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', background: '#fff',
            boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
            borderRadius: 8, outline: '1px solid #E7E1FF', outlineOffset: -1,
            cursor: 'pointer',
          }}>
            <span style={{ fontSize: 'clamp(12px, 1vw, 16px)', fontWeight: 500, color: '#161616' }}>Self</span>
            <svg width="10" height="6" viewBox="0 0 12 8" fill="none">
              <path d="M1 1l5 5 5-5" stroke="#161616" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 0,
          background: '#fff', boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
          borderRadius: 112, outline: '1px solid #E7E1FF', outlineOffset: -1,
          padding: 10, marginBottom: 28, width: 'fit-content',
        }}>
          {FILTERS.map(f => {
            const isActive = activeFilter === f
            return (
              <button key={f} onClick={() => setActiveFilter(f)} style={{
                padding: '8px clamp(12px, 1.5vw, 24px)',
                borderRadius: 47, border: 'none',
                background: isActive ? '#fff' : 'transparent',
                boxShadow: isActive ? '0px 4px 27.3px rgba(0,0,0,0.05)' : 'none',
                outline: isActive ? '1px solid #E7E1FF' : 'none', outlineOffset: -1,
                color: isActive ? '#8B5CF6' : '#161616',
                fontSize: 'clamp(11px, 0.9vw, 16px)', fontWeight: 400,
                cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif',
              }}>{f}</button>
            )
          })}
        </div>

        {/* Main layout: cards + body image */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>

          {/* Organ cards grid — 2 columns */}
          <div style={{
            flex: '1 1 500px', minWidth: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}>
            {filtered.map(organ => {
              const st = STATUS_STYLE[organ.status]
              return (
                <div key={organ.name} style={{
                  background: '#fff',
                  boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
                  borderRadius: 16,
                  padding: '16px 16px 10px',
                  display: 'flex', flexDirection: 'column', gap: 24,
                }}>
                  {/* Top row: icon + name + status | score */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Icon */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                        background: 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden',
                      }}>
                        <img src={organ.icon} alt={organ.name} style={{ width: 26, height: 26, objectFit: 'contain' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 'clamp(13px, 1vw, 16px)', fontWeight: 400, color: '#161616' }}>{organ.name}</span>
                        <span style={{
                          padding: '2px 8px', borderRadius: 100,
                          background: st.bg, color: st.color,
                          fontSize: 'clamp(10px, 0.8vw, 14px)',
                        }}>{organ.status}</span>
                      </div>
                    </div>
                    {/* Score */}
                    {organ.score !== null ? (
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                        <span style={{ fontSize: 'clamp(20px, 2vw, 28px)', fontWeight: 500, color: '#161616', lineHeight: 1 }}>{organ.score}</span>
                        <span style={{ fontSize: 'clamp(11px, 0.9vw, 14px)', color: '#828282', marginBottom: 2 }}>/100</span>
                        {organ.trend && (
                          <svg width="16" height="10" viewBox="0 0 24 14" fill="none"
                            style={{ marginBottom: 4, transform: organ.trend === 'down' ? 'rotate(180deg)' : 'none' }}>
                            <path d="M1 13L12 2L23 13" stroke={organ.trend === 'down' ? '#E12D2D' : '#41C9B3'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    ) : null}
                  </div>

                  {/* Updated date */}
                  <span style={{ fontSize: 'clamp(10px, 0.8vw, 14px)', color: '#828282', textAlign: 'right', fontFamily: 'Inter, sans-serif' }}>
                    {organ.updated}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Body illustration — placeholder */}
          <div style={{ flex: '0 1 320px', minWidth: 200, background: 'linear-gradient(180deg, #E7E1FF 0%, #fff 100%)', borderRadius: 16, minHeight: 300 }} />
        </div>
      </div>
    </div>
  )
}
