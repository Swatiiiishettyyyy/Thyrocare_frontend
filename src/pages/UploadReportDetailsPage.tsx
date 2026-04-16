import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar, UploadReportStepper } from '../components'
import backChevron from '../assets/figma/upload-report/Frame-1.svg'
import chevronDown from '../assets/figma/upload-report/Frame-4.svg'
import chevronRightWhite from '../assets/figma/upload-report/Frame.svg'
import breadcrumbChevron from '../assets/figma/upload-report/Vector.svg'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/packages' },
  { label: 'Reports', href: '/reports' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '/orders' },
]

export default function UploadReportDetailsPage() {
  const navigate = useNavigate()
  const [reportFor, setReportFor] = React.useState('Self')
  const [labName, setLabName] = React.useState('Self')

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins, sans-serif', overflowX: 'hidden' }}>
      <Navbar
        logoSrc="/favicon.svg"
        logoAlt="Nucleotide"
        links={NAV_LINKS}
        ctaLabel="My Cart"
        hideSearchOnMobile
        activeHrefOverride="/reports"
        onCtaClick={() => navigate('/cart')}
      />

      <div
        style={{
          maxWidth: 'var(--page-inner-w)',
          margin: '0 auto',
          padding: 'calc(var(--pad-section-y) * 0.45) var(--pad-section-x) calc(var(--pad-section-y) * 0.8)',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 'clamp(18px, 2.8vmin, 30px)' }}>
          <button type="button" onClick={() => navigate('/reports')} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 'var(--type-body)', color: '#828282' }}>
            Reports
          </button>
          <img src={breadcrumbChevron} alt="" style={{ width: 8, height: 12, display: 'block' }} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--type-body)', color: '#101129', fontWeight: 500 }}>Upload Report</span>
        </div>

        {/* Stepper (Figma 716:4889 component) */}
        <div style={{ marginBottom: 'clamp(18px, 3vmin, 30px)' }}>
          <UploadReportStepper currentStep={2} />
        </div>

        {/* Main card */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: 'min(920px, 100%)',
              background: '#fff',
              borderRadius: 'clamp(16px, 2.2vmin, 20px)',
              boxShadow: '0px 4px 156.2px rgba(136, 107, 249, 0.23)',
              padding: 'clamp(16px, 2.6vmin, 32px)',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(16px, 2.6vmin, 24px)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.8vmin, 14px)', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 'var(--type-subhead)', lineHeight: 1.15, letterSpacing: '-0.03em', color: '#101129' }}>
                Report Details
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: 'var(--type-body)', lineHeight: 'var(--lh-body)', color: '#414141', maxWidth: 720 }}>
                Confirm a few details before we analyze your report.
              </div>
            </div>

            {/* File row */}
            <div style={{
              background: '#F9F9F9',
              borderRadius: 'clamp(14px, 2vmin, 20px)',
              padding: 'clamp(10px, 1.6vmin, 14px) clamp(14px, 2vmin, 16px)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500, fontSize: 'var(--type-ui)', color: '#161616', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Frame 1948759968.png
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: 'var(--type-body)', color: '#414141' }}>
                  0.42 MB
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/upload-report')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 500,
                  fontSize: 'var(--type-ui)',
                  color: '#161616',
                  whiteSpace: 'nowrap',
                }}
              >
                Change
              </button>
            </div>

            {/* Report For */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500, fontSize: 'var(--type-ui)', color: '#161616' }}>Report For</div>
              <button
                type="button"
                onClick={() => {}}
                style={{
                  width: '100%',
                  background: '#F9F9F9',
                  border: 'none',
                  borderRadius: 'clamp(14px, 2vmin, 20px)',
                  padding: 'clamp(14px, 2.2vmin, 18px) clamp(14px, 2vmin, 16px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  cursor: 'default',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: 'var(--type-body)',
                  color: '#414141',
                }}
              >
                <span>{reportFor}</span>
                <img src={chevronDown} alt="" style={{ width: 24, height: 24, display: 'block' }} />
              </button>
              {/* Keep actual value in state for later wiring */}
              <select value={reportFor} onChange={e => setReportFor(e.target.value)} style={{ display: 'none' }}>
                <option>Self</option>
                <option>Family Member</option>
              </select>
            </div>

            {/* Lab Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500, fontSize: 'var(--type-ui)', color: '#161616' }}>Lab Name (optional)</div>
              <button
                type="button"
                onClick={() => {}}
                style={{
                  width: '100%',
                  background: '#F9F9F9',
                  border: 'none',
                  borderRadius: 'clamp(14px, 2vmin, 20px)',
                  padding: 'clamp(14px, 2.2vmin, 18px) clamp(14px, 2vmin, 16px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  cursor: 'default',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: 'var(--type-body)',
                  color: '#414141',
                }}
              >
                <span>{labName}</span>
                <img src={chevronDown} alt="" style={{ width: 24, height: 24, display: 'block' }} />
              </button>
              <select value={labName} onChange={e => setLabName(e.target.value)} style={{ display: 'none' }}>
                <option>Self</option>
                <option>Apollo</option>
                <option>Thyrocare</option>
                <option>Lal Path Labs</option>
              </select>
            </div>

            {/* Bottom actions */}
            <div style={{ display: 'flex', gap: 'clamp(12px, 2.2vmin, 20px)', flexWrap: 'wrap', marginTop: 'clamp(2px, 0.8vmin, 8px)' }}>
              <button
                type="button"
                onClick={() => navigate('/upload-report')}
                style={{
                  flex: '1 1 280px',
                  minHeight: 'clamp(48px, 6vmin, 58px)',
                  borderRadius: 'clamp(8px, 1vmin, 10px)',
                  border: '1px solid #8B5CF6',
                  background: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 500,
                  fontSize: 'var(--type-ui)',
                  color: '#101129',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                <img src={backChevron} alt="" style={{ width: 18, height: 18, display: 'block' }} />
                Back
              </button>
              <button
                type="button"
                onClick={() => navigate('/analysing-report')}
                style={{
                  flex: '1 1 280px',
                  minHeight: 'clamp(48px, 6vmin, 58px)',
                  borderRadius: 'clamp(8px, 1vmin, 10px)',
                  border: 'none',
                  background: '#8B5CF6',
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 500,
                  fontSize: 'var(--type-ui)',
                  color: '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                Analyse Report
                <img src={chevronRightWhite} alt="" style={{ width: 18, height: 18, display: 'block' }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
