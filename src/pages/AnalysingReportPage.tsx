import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'

const NAV_LINKS = [
  { label: 'Tests', href: '/' }, { label: 'Packages', href: '/' },
  { label: 'Reports', href: '/reports' }, { label: 'Metrics', href: '/metrics' }, { label: 'Orders', href: '/orders' },
]

const steps = [
  { num: 1, label: 'Upload', done: true },
  { num: 2, label: 'Report Details', done: true },
  { num: 3, label: 'Review', active: true },
]

export default function AnalysingReportPage() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          setTimeout(() => navigate('/review-report'), 500)
          return 100
        }
        return p + 2
      })
    }, 60)
    return () => clearInterval(interval)
  }, [navigate])

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
                <div style={{ width: 100, height: 1.5, background: step.done ? '#7C5CFC' : '#E5E7EB', margin: '0 8px 20px' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Loading card */}
        <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 20, padding: '48px 40px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

          {/* Spinner */}
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '4px solid #EDE9FE',
            borderTop: '4px solid #7C5CFC',
            animation: 'spin 1s linear infinite',
          }} />

          <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0, textAlign: 'center' }}>
            This may take a few seconds. We are analysing your report
          </p>

          {/* Progress bar */}
          <div style={{ width: '100%' }}>
            <div style={{ height: 6, background: '#EDE9FE', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#7C5CFC', borderRadius: 3, transition: 'width 0.06s linear' }} />
            </div>
            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 14, fontWeight: 600, color: '#374151' }}>{progress}%</div>
          </div>

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
