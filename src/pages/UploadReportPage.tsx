import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar, UploadReportStepper } from '../components'
import uploadIcon from '../assets/figma/upload-report/UPLOAD.svg'
import backChevron from '../assets/figma/upload-report/Frame-1.svg'
import chevronRightWhite from '../assets/figma/upload-report/Frame.svg'
import breadcrumbChevron from '../assets/figma/upload-report/Vector.svg'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/packages' },
  { label: 'Reports', href: '/reports' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '/orders' },
]

export default function UploadReportPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)

  const handleFile = (f: File) => setFile(f)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  }

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
          <UploadReportStepper currentStep={1} />
        </div>

        {/* Main card */}
        <div className="upload-report-center" style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            className="upload-report-card"
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
            <div className="upload-report-cardHeader" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.8vmin, 14px)', alignItems: 'center', textAlign: 'center' }}>
              <div className="upload-report-cardTitle" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 'var(--type-subhead)', lineHeight: 1.15, letterSpacing: '-0.03em', color: '#101129' }}>
                Upload Your Lab Report
              </div>
              <div className="upload-report-cardSubtitle" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: 'var(--type-body)', lineHeight: 'var(--lh-body)', color: '#414141', maxWidth: 720 }}>
                Upload reports from any lab to track and compare your health metrics over time.
              </div>
            </div>

            {/* Drop zone */}
            <div
              className="upload-report-dropzone"
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => (file ? undefined : fileInputRef.current?.click())}
              role="button"
              tabIndex={0}
              style={{
                border: `3px dashed ${file ? '#41C9B3' : '#E7E1FF'}`,
                borderRadius: 'clamp(16px, 2.2vmin, 20px)',
                padding: 'clamp(18px, 2.8vmin, 26px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(16px, 2.8vmin, 22px)',
                cursor: 'pointer',
                background: file ? '#E6F6F3' : 'transparent',
              }}
            >
              {file ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500, fontSize: 'var(--type-ui)', color: '#161616', textAlign: 'center' }}>
                      {file.name}
                    </div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--type-body)', color: '#414141', textAlign: 'center' }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>

                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--type-body)', color: '#414141', textAlign: 'center' }}>
                    Max file size: 10 MB
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 'clamp(48px, 6vmin, 58px)',
                      padding: '0 clamp(22px, 4vw, 34px)',
                      borderRadius: 'clamp(8px, 1vmin, 10px)',
                      border: 'none',
                      background: '#fff',
                      cursor: 'pointer',
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 500,
                      fontSize: 'var(--type-ui)',
                      color: '#101129',
                      minWidth: 202,
                    }}
                  >
                    Remove
                  </button>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px, 1.8vmin, 13px)', width: '100%' }}>
                    <div className="upload-report-dropzoneIcon" style={{ width: 'clamp(54px, 7vmin, 66px)', height: 'clamp(54px, 7vmin, 66px)', borderRadius: 999, background: '#E7E1FF', display: 'grid', placeItems: 'center' }}>
                      <img src={uploadIcon} alt="" style={{ width: 24, height: 24, display: 'block' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500, fontSize: 'var(--type-ui)', color: '#161616' }}>
                        Drag &amp; drop your report here
                      </div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: 'var(--type-body)', color: '#414141' }}>
                        or click to browse files
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div className="upload-report-fileChips" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                      {['PDF', 'JPG', 'PNG'].map(ext => (
                        <div key={ext} className="upload-report-fileChip" style={{ background: '#F9F9F9', borderRadius: 10, padding: '10px', fontFamily: 'Poppins, sans-serif', fontWeight: 500, fontSize: 'var(--type-ui)', color: '#161616', lineHeight: 'var(--lh-ui)' }}>
                          {ext}
                        </div>
                      ))}
                    </div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--type-body)', color: '#414141', textAlign: 'center' }}>
                      Max file size: 10 MB
                    </div>
                  </div>

                  <button
                    className="upload-report-browseBtn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      fileInputRef.current?.click()
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      height: 'clamp(48px, 6vmin, 58px)',
                      padding: '0 clamp(22px, 4vw, 34px)',
                      borderRadius: 'clamp(8px, 1vmin, 10px)',
                      border: '1px solid #8B5CF6',
                      background: '#fff',
                      cursor: 'pointer',
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 500,
                      fontSize: 'var(--type-ui)',
                      color: '#101129',
                      minWidth: 202,
                    }}
                  >
                    <img src={uploadIcon} alt="" style={{ width: 24, height: 24, display: 'block' }} />
                    Browse Files
                  </button>
                </>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>

            {/* Bottom actions */}
            <div style={{ display: 'flex', gap: 'clamp(12px, 2.2vmin, 20px)', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate('/reports')}
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
                onClick={() => file && navigate('/upload-report-details', { state: { file } })}
                disabled={!file}
                style={{
                  flex: '1 1 280px',
                  minHeight: 'clamp(48px, 6vmin, 58px)',
                  borderRadius: 'clamp(8px, 1vmin, 10px)',
                  border: 'none',
                  background: file ? '#8B5CF6' : '#E7E1FF',
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
                Continue
                <img src={chevronRightWhite} alt="" style={{ width: 18, height: 18, display: 'block' }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
