import React, { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Navbar, UploadReportStepper } from '../components'
import breadcrumbChevron from '../assets/figma/upload-report/Vector.svg'
import chevronDown from '../assets/figma/upload-report/Frame-4.svg'
import chevronRightWhite from '../assets/figma/upload-report/Frame.svg'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/packages' },
  { label: 'Reports', href: '/reports' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '/orders' },
]

type UploadedPayload = Record<string, unknown> | null

export default function ReviewReportPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const uploaded = ((location.state as any)?.uploaded ?? null) as UploadedPayload

  const fileName = useMemo(() => {
    const d = uploaded && typeof uploaded === 'object' ? (uploaded as any).data ?? uploaded : null
    return String(d?.report_name ?? d?.file_name ?? d?.fileName ?? 'Uploaded report').trim() || 'Uploaded report'
  }, [uploaded])

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
          <button
            type="button"
            onClick={() => navigate('/reports')}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: 'var(--type-body)',
              color: '#828282',
            }}
          >
            Reports
          </button>
          <img src={breadcrumbChevron} alt="" style={{ width: 8, height: 12, display: 'block' }} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--type-body)', color: '#101129', fontWeight: 500 }}>
            Upload Report
          </span>
        </div>

        {/* Stepper */}
        <div style={{ marginBottom: 'clamp(18px, 3vmin, 30px)' }}>
          <UploadReportStepper currentStep={3} />
        </div>

        {/* Main card */}
        <div className="review-extracted-center" style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            className="review-extracted-card"
            style={{
              width: 'min(920px, 100%)',
              background: '#fff',
              borderRadius: 'clamp(16px, 2.2vmin, 20px)',
              boxShadow: '0px 4px 156.2px rgba(136, 107, 249, 0.23)',
              padding: 'clamp(16px, 2.6vmin, 32px)',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(18px, 3.2vmin, 32px)',
            }}
          >
            <div className="review-extracted-header" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.8vmin, 14px)' }}>
              <div
                className="review-extracted-title"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: 'var(--type-subhead)',
                  lineHeight: 1.15,
                  letterSpacing: '-0.03em',
                  color: '#101129',
                }}
              >
                Review Extracted Data
              </div>
              <div className="review-extracted-subtitle" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: 'var(--type-body)', lineHeight: 'var(--lh-body)', color: '#414141' }}>
                Your report has been uploaded successfully.
              </div>
            </div>

            {/* Test name */}
            <div className="review-extracted-testNameWrap" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="review-extracted-testNameLabel" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500, fontSize: 'var(--type-ui)', color: '#161616' }}>Test Name</div>
              <div
                className="review-extracted-testNameField"
                style={{
                  width: '100%',
                  background: '#F9F9F9',
                  borderRadius: 'clamp(14px, 2vmin, 20px)',
                  padding: 'clamp(14px, 2.2vmin, 18px) clamp(14px, 2vmin, 16px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: 'var(--type-body)',
                  color: '#414141',
                }}
              >
                <span className="review-extracted-testNameValue" style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Complete Blood Count(CBC)</span>
                <img src={chevronDown} alt="" style={{ width: 24, height: 24, display: 'block' }} />
              </div>
            </div>

            {/* Parameters */}
            <div className="review-extracted-params" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.2vmin, 9px)' }}>
              <div
                className="review-extracted-paramRow"
                style={{
                  border: '1px solid #E7E1FF',
                  borderRadius: 'clamp(14px, 2vmin, 20px)',
                  padding: 'clamp(10px, 1.4vmin, 12px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 24,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 'var(--type-body)', color: '#161616', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fileName}
                  </div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 400, fontSize: 'var(--type-body)', color: '#828282' }}>
                    Saved to your uploaded reports.
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="review-extracted-ctaRow" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => navigate('/reports?tab=Uploaded')}
                className="review-extracted-cta"
                style={{
                  width: 'min(470px, 100%)',
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
                Save to My Reports
                <img src={chevronRightWhite} alt="" style={{ width: 18, height: 18, display: 'block' }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
