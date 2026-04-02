import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'

const NAV_LINKS = [
  { label: 'Tests', href: '/' }, { label: 'Packages', href: '/' },
  { label: 'Reports', href: '/reports' }, { label: 'Metrics', href: '#' }, { label: 'Orders', href: '/orders' },
]

const steps = [
  { num: 1, label: 'Upload', active: true },
  { num: 2, label: 'Report Details', active: false },
  { num: 3, label: 'Review', active: false },
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
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Poppins', sans-serif" }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 40px 60px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
          <span onClick={() => navigate('/reports')} style={{ fontSize: 13, color: '#9CA3AF', cursor: 'pointer' }}>Reports</span>
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>›</span>
          <span style={{ fontSize: 13, color: '#1B1F3B', fontWeight: 600 }}>Upload Report</span>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 40 }}>
          {steps.map((step, i) => (
            <React.Fragment key={step.num}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: step.active ? '#7C5CFC' : '#EDE9FE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 500,
                  color: step.active ? '#fff' : '#9CA3AF',
                }}>{step.num}</div>
                <span style={{ fontSize: 13, color: step.active ? '#7C5CFC' : '#9CA3AF', fontWeight: step.active ? 600 : 400 }}>{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ width: 100, height: 1.5, background: '#E5E7EB', margin: '0 8px 20px' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Upload card */}
        <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 20, padding: '40px 40px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', textAlign: 'center', margin: '0 0 8px' }}>Upload Your Lab Report</h2>
          <p style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', margin: '0 0 28px' }}>Upload reports from any lab to track and compare your health metrics over time.</p>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            style={{
              border: `2px dashed ${file ? '#10B981' : '#C4B5FD'}`,
              borderRadius: 14, padding: '40px 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              marginBottom: 28, background: file ? '#F0FDF9' : '#FAFAFA',
            }}
          >
            {file ? (
              <>
                <div style={{ fontSize: 16, fontWeight: 500, color: '#111827' }}>{file.name}</div>
                <div style={{ fontSize: 13, color: '#9CA3AF' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>Max file size: 10 MB</div>
                <button onClick={() => setFile(null)} style={{
                  background: '#fff', color: '#374151', border: '1.5px solid #E5E7EB',
                  borderRadius: 10, padding: '10px 32px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}>Remove</button>
              </>
            ) : (
              <>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>⬆</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 500, color: '#111827', marginBottom: 4 }}>Drag & drop your report here</div>
                  <div style={{ fontSize: 13, color: '#9CA3AF' }}>or click to browse files</div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  {['PDF', 'JPG', 'PNG'].map(f => (
                    <span key={f} style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{f}</span>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>Max file size: 10 MB</div>
                <button onClick={() => fileInputRef.current?.click()} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#fff', color: '#7C5CFC', border: '1.5px solid #7C5CFC',
                  borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}>⬆ Browse Files</button>
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </>
            )}
          </div>

          {/* Back + Continue */}
          <div style={{ display: 'flex', gap: 16 }}>
            <button onClick={() => navigate('/reports')} style={{
              flex: 1, padding: '14px', borderRadius: 12, border: '1.5px solid #E5E7EB',
              background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>‹ Back</button>
            <button style={{
              flex: 1, padding: '14px', borderRadius: 12, border: 'none',
              background: '#7C5CFC', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }} onClick={() => navigate('/upload-report-details')}>Continue ›</button>
          </div>
        </div>

      </div>
    </div>
  )
}
