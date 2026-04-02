import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'

const NAV_LINKS = [
  { label: 'Tests', href: '/' }, { label: 'Packages', href: '/' },
  { label: 'Reports', href: '/reports' }, { label: 'Metrics', href: '#' }, { label: 'Orders', href: '/orders' },
]

const steps = [
  { num: 1, label: 'Upload', done: true },
  { num: 2, label: 'Report Details', done: true },
  { num: 3, label: 'Review', active: true },
]

const PARAMS = [
  { name: 'Hemoglobin', range: '12–17 g/dL', value: '13.5G/dl', dot: '#10B981' },
  { name: 'White Blood Cells', range: '12–17 g/dL', value: '13.5G/dl', dot: '#10B981' },
  { name: 'Red Blood Cells', range: '12–17 g/dL', value: '13.5G/dl', dot: '#10B981' },
  { name: 'Platelets', range: '12–17 g/dL', value: '13.5G/dl', dot: '#10B981' },
  { name: 'Fasting Blood Sugar', range: '12–17 g/dL', value: '13.5G/dl', dot: '#F59E0B' },
  { name: 'Total Cholesterol', range: '12–17 g/dL', value: '13.5G/dl', dot: '#F59E0B' },
]

export default function ReviewReportPage() {
  const navigate = useNavigate()

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
                  background: step.done ? '#7C5CFC' : '#EDE9FE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: step.done ? 18 : 15, fontWeight: 500,
                  color: step.done ? '#fff' : '#9CA3AF',
                  border: step.active ? '2px solid #7C5CFC' : 'none',
                }}>
                  {step.done ? '✓' : step.num}
                </div>
                <span style={{ fontSize: 13, color: step.done || step.active ? '#7C5CFC' : '#9CA3AF', fontWeight: step.active ? 600 : 400 }}>{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ width: 100, height: 1.5, background: '#7C5CFC', margin: '0 8px 20px' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Review card */}
        <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 20, padding: '32px 32px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>Review Extracted Data</h2>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 24px' }}>6 parameters found · 2 abnormal</p>

          {/* Test name field */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Test Name</label>
            <div style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#374151' }}>
              Complete Blood Count(CBC)
            </div>
          </div>

          {/* Parameters list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
            {PARAMS.map((p, i) => (
              <div key={i} style={{ border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.dot, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>Range: {p.range}</div>
                  </div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{p.value}</span>
              </div>
            ))}
          </div>

          {/* Save button */}
          <button onClick={() => navigate('/reports?tab=Uploaded')} style={{
            width: '100%', padding: '15px', borderRadius: 12, border: 'none',
            background: '#7C5CFC', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}>
            Save to My Reports ›
          </button>
        </div>

      </div>
    </div>
  )
}
