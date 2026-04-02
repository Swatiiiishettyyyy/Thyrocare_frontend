import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'

const NAV_LINKS = [
  { label: 'Tests', href: '/' }, { label: 'Packages', href: '/' },
  { label: 'Reports', href: '/reports' }, { label: 'Metrics', href: '#' }, { label: 'Orders', href: '/orders' },
]

const steps = [
  { num: 1, label: 'Upload', done: true },
  { num: 2, label: 'Report Details', active: true },
  { num: 3, label: 'Review', active: false },
]

export default function UploadReportDetailsPage() {
  const navigate = useNavigate()
  const [reportFor, setReportFor] = React.useState('Self')
  const [labName, setLabName] = React.useState('Self')

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
                  background: step.done ? '#7C5CFC' : step.active ? '#EDE9FE' : '#EDE9FE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: step.done ? 18 : 15, fontWeight: 500,
                  color: step.done ? '#fff' : step.active ? '#7C5CFC' : '#9CA3AF',
                  border: step.active ? '2px solid #7C5CFC' : 'none',
                }}>
                  {step.done ? '✓' : step.num}
                </div>
                <span style={{ fontSize: 13, color: step.done || step.active ? '#7C5CFC' : '#9CA3AF', fontWeight: step.active ? 600 : 400 }}>{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ width: 100, height: 1.5, background: '#E5E7EB', margin: '0 8px 20px' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 20, padding: '36px 40px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', textAlign: 'center', margin: '0 0 8px' }}>Report Details</h2>
          <p style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', margin: '0 0 28px' }}>Confirm a few details before we analyze your report.</p>

          {/* File info */}
          <div style={{ border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Frame 1948759968.png</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>0.42 MB</div>
            </div>
            <button onClick={() => navigate('/upload-report')} style={{ background: 'none', border: 'none', color: '#7C5CFC', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Change</button>
          </div>

          {/* Report For */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 8 }}>Report For</label>
            <div style={{ position: 'relative' }}>
              <select value={reportFor} onChange={e => setReportFor(e.target.value)} style={{
                width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #E5E7EB',
                fontSize: 14, color: '#374151', background: '#fff', appearance: 'none', cursor: 'pointer', outline: 'none',
              }}>
                <option>Self</option>
                <option>Family Member</option>
              </select>
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9CA3AF' }}>▾</span>
            </div>
          </div>

          {/* Lab Name */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 8 }}>Lab Name (optional)</label>
            <div style={{ position: 'relative' }}>
              <select value={labName} onChange={e => setLabName(e.target.value)} style={{
                width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #E5E7EB',
                fontSize: 14, color: '#374151', background: '#fff', appearance: 'none', cursor: 'pointer', outline: 'none',
              }}>
                <option>Self</option>
                <option>Apollo</option>
                <option>Thyrocare</option>
                <option>Lal Path Labs</option>
              </select>
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9CA3AF' }}>▾</span>
            </div>
          </div>

          {/* Back + Analyse */}
          <div style={{ display: 'flex', gap: 16 }}>
            <button onClick={() => navigate('/upload-report')} style={{
              flex: 1, padding: '14px', borderRadius: 12, border: '1.5px solid #E5E7EB',
              background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>‹ Back</button>
            <button onClick={() => navigate('/analysing-report')} style={{
              flex: 1, padding: '14px', borderRadius: 12, border: 'none',
              background: '#7C5CFC', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>Analyse Report ›</button>
          </div>
        </div>

      </div>
    </div>
  )
}
