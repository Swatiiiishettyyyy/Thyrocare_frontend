import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/' },
  { label: 'Reports', href: '/reports' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '/orders' },
]

type Status = 'Normal' | 'High' | 'Low'

interface CompareParam {
  name: string
  normalRange: string
  prevValue: string
  currValue: string
  unit: string
  prevStatus: Status
  currStatus: Status
  change: string
  changeBg: string
  changeColor: string
  iconBg: string
  iconDir?: 'up' | 'down'
}

const PARAMS: CompareParam[] = [
  {
    name: 'Haemoglobin', normalRange: '13.5 - 17.5 g/dL',
    prevValue: '14', currValue: '14.2', unit: 'g/dl',
    prevStatus: 'Normal', currStatus: 'Normal',
    change: '1.4%', changeBg: '#E6F6F3', changeColor: '#41C9B3',
    iconBg: '#41C9B3', iconDir: 'up',
  },
  {
    name: 'Haemoglobin', normalRange: '13.5 - 17.5 g/dL',
    prevValue: '14', currValue: '14.2', unit: 'g/dl',
    prevStatus: 'Normal', currStatus: 'Normal',
    change: '1.4%', changeBg: '#E6F6F3', changeColor: '#41C9B3',
    iconBg: '#41C9B3', iconDir: 'up',
  },
  {
    name: 'WBC Count', normalRange: '4500 - 11000 /mcL',
    prevValue: '9,200', currValue: '11,200', unit: '/mcL',
    prevStatus: 'Normal', currStatus: 'High',
    change: '21.7%', changeBg: '#FFF4EF', changeColor: '#EA8C5A',
    iconBg: '#EA8C5A', iconDir: 'up',
  },
  {
    name: 'Platelet Count', normalRange: '150,000 - 400,000 /mcL',
    prevValue: '140,000', currValue: '160,000', unit: '/mcL',
    prevStatus: 'Low', currStatus: 'Normal',
    change: '1.4%', changeBg: '#E6F6F3', changeColor: '#41C9B3',
    iconBg: '#8B5CF6', iconDir: 'down',
  },
]

const STATUS_COLOR: Record<Status, { bg: string; text: string }> = {
  Normal: { bg: '#41C9B3', text: '#fff' },
  High:   { bg: '#EA8C5A', text: '#fff' },
  Low:    { bg: '#8B5CF6', text: '#fff' },
}

const STATUS_CARD_BG: Record<Status, string> = {
  Normal: '#E6F6F3',
  High:   '#FFF4EF',
  Low:    '#E7E1FF',
}

export default function CompareReportsPage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('All')
  const compareDate = 'Jan 27, 2025'

  const statusFilters = ['All(8)', 'Normal(7)', 'Needs Attention(2)']
  const categoryFilters = ['Red Blood Cells', 'White Blood Cells', 'Platelets']

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 0' }}>
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
          padding: '14px 20px',
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

          {/* Date boxes + arrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 auto', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {/* Latest report */}
            <div style={{
              padding: '8px 20px', borderRadius: 10,
              outline: '1px solid #2A2C5B', outlineOffset: -1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 120,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="6" width="20" height="16" rx="2" stroke="#8B5CF6" strokeWidth="2"/>
                <path d="M8 2v4M16 2v4M2 10h20" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: 11, color: '#828282', fontFamily: 'Inter, sans-serif' }}>Latest Report</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>February 7th, 2026</span>
            </div>

            {/* Arrow */}
            <svg width="20" height="14" viewBox="0 0 24 14" fill="none" style={{ flexShrink: 0 }}>
              <path d="M1 7h22M16 1l6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>

            {/* Compare with */}
            <div style={{
              padding: '8px 20px', borderRadius: 10,
              outline: '1px solid #2A2C5B', outlineOffset: -1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 120,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="6" width="20" height="16" rx="2" stroke="#8B5CF6" strokeWidth="2"/>
                <path d="M8 2v4M16 2v4M2 10h20" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: 11, color: '#828282', fontFamily: 'Inter, sans-serif' }}>Compare with</span>
              <button onClick={() => {}} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '3px 10px', borderRadius: 20,
                outline: '1px solid #2A2C5B', outlineOffset: -1,
                background: 'transparent', border: 'none', cursor: 'pointer',
              }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>{compareDate}</span>
                <svg width="8" height="6" viewBox="0 0 12 8" fill="none">
                  <path d="M1 1l5 5 5-5" stroke="#F9F9F9" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Parameters section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>

          {/* Filter bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#161616' }}>Parameters</span>
              <button style={{ background: 'none', border: 'none', color: '#8B5CF6', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Clear Filter</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <div style={{
                display: 'flex', flexWrap: 'wrap',
                background: '#fff', boxShadow: '0px 2px 10px rgba(0,0,0,0.05)',
                borderRadius: 100, outline: '1px solid #E7E1FF', outlineOffset: -1, padding: 5,
              }}>
                {statusFilters.map(f => {
                  const key = f.split('(')[0].trim()
                  const isActive = activeFilter === key
                  return (
                    <button key={f} onClick={() => setActiveFilter(key)} style={{
                      padding: '4px 14px', borderRadius: 100, border: 'none',
                      background: isActive ? '#fff' : 'transparent',
                      boxShadow: isActive ? '0px 2px 10px rgba(0,0,0,0.05)' : 'none',
                      outline: isActive ? '1px solid #E7E1FF' : 'none', outlineOffset: -1,
                      color: isActive ? '#8B5CF6' : '#414141',
                      fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}>{f}</button>
                  )
                })}
              </div>
              <div style={{ width: 1, height: 24, background: '#E7E1FF', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {categoryFilters.map(f => (
                  <button key={f} onClick={() => setActiveFilter(f)} style={{
                    padding: '4px 12px', borderRadius: 100, border: 'none',
                    background: activeFilter === f ? '#E7E1FF' : '#F9F9F9',
                    color: '#414141', fontSize: 12, fontWeight: 400, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>{f}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Parameter comparison cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#000' }}>Parameter Comparison</span>
              <div style={{ padding: '3px 12px', background: '#fff', borderRadius: 100, outline: '1px solid #E7E1FF', outlineOffset: -1 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#8B5CF6' }}>8 parameters</span>
              </div>
            </div>

            {PARAMS.map((p, i) => (
              <div key={i} style={{
                background: '#fff', boxShadow: '0px 2px 10px rgba(0,0,0,0.05)',
                borderRadius: 12, padding: '12px 16px',
                display: 'flex', flexDirection: 'column', gap: 10,
                boxSizing: 'border-box', width: '100%',
              }}>
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 100, background: p.iconBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <svg width="12" height="8" viewBox="0 0 24 14" fill="none"
                        style={{ transform: p.iconDir === 'down' ? 'rotate(180deg)' : 'none' }}>
                        <path d="M1 13L12 2L23 13" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#161616' }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: '#828282' }}>
                        Normal range: <span style={{ color: '#161616', fontWeight: 500 }}>{p.normalRange}</span>
                      </span>
                    </div>
                  </div>
                  <div style={{
                    padding: '3px 8px', background: p.changeBg, borderRadius: 100,
                    display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                  }}>
                    <svg width="12" height="8" viewBox="0 0 24 14" fill="none"
                      style={{ transform: p.iconDir === 'down' ? 'rotate(180deg)' : 'none' }}>
                      <path d="M1 13L12 2L23 13" stroke={p.changeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#101129' }}>{p.change}</span>
                  </div>
                </div>

                {/* Previous / Current */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { label: 'Previous', value: p.prevValue, status: p.prevStatus },
                    { label: 'Current',  value: p.currValue, status: p.currStatus },
                  ].map(col => {
                    const sc = STATUS_COLOR[col.status]
                    const cardBg = STATUS_CARD_BG[col.status]
                    return (
                      <div key={col.label} style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#161616' }}>{col.label}</span>
                        <div style={{
                          background: cardBg, borderRadius: 8,
                          padding: '8px 12px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          flexWrap: 'wrap', gap: 6, boxSizing: 'border-box',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5 }}>
                            <span style={{ fontSize: 15, fontWeight: 600, color: '#161616', lineHeight: 1 }}>{col.value}</span>
                            <span style={{ fontSize: 11, color: '#828282' }}>{p.unit}</span>
                          </div>
                          <div style={{ padding: '4px 12px', background: sc.bg, borderRadius: 100 }}>
                            <span style={{ fontSize: 11, fontWeight: 500, color: sc.text }}>{col.status}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
