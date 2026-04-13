import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Navbar } from '../components'
import emptyReportIllustration from '../assets/figma/empty-report/fi_4751509.svg'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/' },
  { label: 'Reports', href: '/reports' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '/orders' },
]

const REPORTS: any[] = []

export default function ReportsListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'All')
  const tabs = ['All', 'Nucleotide', 'Uploaded', 'Needs Attention']

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Poppins', sans-serif" }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" hideSearchOnMobile onCtaClick={() => navigate('/cart')} />

      {/* Breadcrumb */}
      <div
        className="cart-breadcrumb"
        style={{
          padding: '14px clamp(16px, 5vw, 56px)',
          borderBottom: '1px solid #F3F4F6',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 14, color: '#6B7280', cursor: 'pointer' }} onClick={() => navigate('/')}>Tests</span>
        <span style={{ fontSize: 14, color: '#6B7280' }}>›</span>
        <span style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>Reports</span>
      </div>

      <div className="reports-list-inner">

        {/* Header */}
        <div className="reports-header-row">
          <div>
            <h1 className="reports-page-title">My Reports</h1>
            <p style={{ fontSize: 15, color: '#9CA3AF', margin: 0 }}>View, track, and understand your health data</p>
          </div>
        </div>

        {/* Tabs + Filter row */}
        <div className="reports-toolbar">
          <div className="reports-tabs-scroller">
            <div className="reports-tab-group" role="tablist" aria-label="Report type">
              {tabs.map(t => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === t}
                  onClick={() => setActiveTab(t)}
                  className={`reports-tab-btn${activeTab === t ? ' reports-tab-btn--active' : ''}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="reports-filter-group">
            <button type="button" className="reports-filter-btn">
              Filter
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button type="button" className="reports-filter-btn">
              Sorting
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>

        {/* Report list or empty state */}
        {REPORTS.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 24 }}>
            {/* Illustration */}
            <div style={{
              width: 200, height: 200,
              background: 'linear-gradient(180deg, #E7E1FF 0%, #fff 100%)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <img src={emptyReportIllustration} alt="No reports" style={{ width: 80, height: 80 }} />
            </div>
            {/* Text */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, maxWidth: 440, textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'Poppins,sans-serif', fontSize: 24, fontWeight: 500, color: '#161616', margin: 0 }}>No Reports Found</h2>
              <p style={{ fontFamily: 'Poppins,sans-serif', fontSize: 15, fontWeight: 400, color: '#414141', margin: 0, lineHeight: 1.6 }}>
                Your reports will appear here after you complete a test or upload an external report.
              </p>
            </div>
            {/* CTAs */}
            <div className="reports-empty-ctas" style={{ display: 'flex', gap: 14, width: '100%', maxWidth: 440 }}>
              <button className="reports-empty-cta" onClick={() => navigate('/')} style={{
                flex: 1, height: 56, background: '#8B5CF6', color: '#fff', border: 'none',
                borderRadius: 10, fontFamily: 'Poppins,sans-serif', fontSize: 15, fontWeight: 500,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '0 16px',
              }}>
                Browse Tests
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button className="reports-empty-cta" onClick={() => navigate('/upload-report')} style={{
                flex: 1, height: 52, background: '#fff', color: '#101129',
                border: '1.5px solid #8B5CF6', borderRadius: 8,
                fontFamily: 'Poppins,sans-serif', fontSize: 15, fontWeight: 500,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                Upload Report
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        ) : (
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
        )}

      </div>
    </div>
  )
}
