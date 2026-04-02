import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Navbar } from '../components'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/' },
  { label: 'Reports', href: '/reports' },
  { label: 'Metrics', href: '#' },
  { label: 'Orders', href: '/orders' },
]

const REPORTS = [
  { initials: 'AS', name: 'Full Body Checkup – Basic', patient: 'Ananya Sharma -Self', status: 'Normal Range', statusColor: '#059669', statusBg: '#D1FAE5', statusIcon: '✅', date: 'Feb 7, 2026', type: 'Single Test', external: false },
  { initials: 'AS', name: 'Full Body Checkup – Basic', patient: 'Ananya Sharma -Self', status: 'Needs Attention', statusColor: '#DC2626', statusBg: '#FEE2E2', statusIcon: '❗', date: 'Feb 7, 2026', type: 'Package', external: false },
  { initials: 'AS', name: 'Complete Blood Count (CBC) with ESR', patient: 'Ananya Sharma -Self', status: 'Normal Range', statusColor: '#059669', statusBg: '#D1FAE5', statusIcon: '✅', date: 'Feb 7, 2026', type: 'Single Test', external: true },
  { initials: 'AS', name: 'Complete Blood Count (CBC) with ESR', patient: 'Ananya Sharma -Self', status: 'Needs Attention', statusColor: '#DC2626', statusBg: '#FEE2E2', statusIcon: '❗', date: 'Feb 7, 2026', type: 'Single Test', external: false },
]

export default function ReportsListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'All')
  const tabs = ['All', 'Nucleotide', 'Uploaded', 'Needs Attention']

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Poppins', sans-serif" }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 500, color: '#111827', margin: '0 0 6px' }}>My Reports</h1>
            <p style={{ fontSize: 15, color: '#9CA3AF', margin: 0 }}>View, track, and understand your health data</p>
          </div>
          <button onClick={() => navigate('/upload-report')} style={{ background: '#7C5CFC', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 13 }}>
            📄 Upload Report
          </button>
        </div>

        {/* Tabs + Filter row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 50, padding: 4, gap: 2 }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding: '8px 20px', borderRadius: 50, fontSize: 16, fontWeight: 300, cursor: 'pointer', border: 'none',
                background: activeTab === t ? '#fff' : 'transparent',
                color: activeTab === t ? '#111827' : '#6B7280',
                boxShadow: activeTab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}>{t}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#374151' }}>Filter ▾</button>
            <button style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#374151' }}>Sorting ▾</button>
          </div>
        </div>

        {/* Report list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {REPORTS.map((r, i) => (
            <div key={i} onClick={() => navigate('/report')} style={{
              background: '#fff', border: '1px solid #F0F0F0', borderRadius: 16,
              padding: '20px 28px ', display: 'flex', alignItems: 'center',
              cursor: 'pointer', position: 'relative',
              boxShadow: '0px 4px 27.3px 0px rgba(0,0,0,0.05)',
              transition: 'box-shadow 0.15s ease',
            }}>
              {r.external && (
                <span style={{ position: 'absolute', top: 0, right: 0, background: '#EDE9FE', color: '#7C5CFC', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: '0 14px 0 8px' }}>External Reports</span>
              )}

              {/* Avatar */}
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: '#7C5CFC', flexShrink: 0, marginRight: 20 }}>
                {r.initials}
              </div>

              {/* Name + patient */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{r.name}</div>
                <div style={{ fontSize: 13, color: '#9CA3AF' }}>{r.patient}</div>
              </div>

              {/* Status + meta — center-right block */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, marginRight: 40, minWidth: 400 }}>
                {/* Status badge */}
                <span style={{
                  fontSize: 13, fontWeight: 500, color: r.statusColor,
                  background: r.statusBg, borderRadius: 100,
                  padding: '5px 14px',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  border: `1.5px solid ${r.statusColor}55`,
                }}>
                  {r.statusIcon === '✅'
                    ? <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill={r.statusColor} opacity="0.15"/><path d="M4.5 8.5l2.5 2.5 4.5-5" stroke={r.statusColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill={r.statusColor} opacity="0.15"/><path d="M8 5v4M8 11v.5" stroke={r.statusColor} strokeWidth="1.6" strokeLinecap="round"/></svg>
                  }
                  {r.status}
                </span>
                {/* Date + type row */}
                <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="13" rx="2" stroke="#9CA3AF" strokeWidth="1.2"/><path d="M5 1v2M11 1v2M1 6h14" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    {r.date}
                  </span>
                  <span style={{ fontSize: 13, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="12" height="14" rx="2" stroke="#9CA3AF" strokeWidth="1.2"/><path d="M5 5h6M5 8h6M5 11h4" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    {r.type}
                  </span>
                </div>
              </div>

              {/* Chevron */}
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M1 1l6 6-6 6" stroke="#C4C4C4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
