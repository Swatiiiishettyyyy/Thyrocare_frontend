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

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>My Reports</h1>
            <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>View, track, and understand your health data</p>
          </div>
          <button onClick={() => navigate('/upload-report')} style={{ background: '#7C5CFC', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            📄 Upload Report
          </button>
        </div>

        {/* Tabs + Filter row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 50, padding: 4, gap: 2 }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding: '8px 20px', borderRadius: 50, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
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
              background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 14,
              padding: '18px 20px', display: 'flex', alignItems: 'center',
              cursor: 'pointer', position: 'relative',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              {r.external && (
                <span style={{ position: 'absolute', top: 0, right: 0, background: '#EDE9FE', color: '#7C5CFC', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: '0 12px 0 8px' }}>External Reports</span>
              )}
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#7C5CFC', flexShrink: 0, marginRight: 16 }}>
                {r.initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{r.patient}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginRight: 24 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: r.statusColor, background: r.statusBg, borderRadius: 20, padding: '3px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {r.statusIcon} {r.status}
                </span>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>📅 {r.date}</span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>📋 {r.type}</span>
                </div>
              </div>
              <span style={{ color: '#D1D5DB', fontSize: 18 }}>›</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
