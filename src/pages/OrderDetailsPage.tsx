import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'
import type { CartItem } from '../types'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/' },
  { label: 'Reports', href: '#' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '/orders' },
]

const TRACKING_STEPS = [
  { label: 'Order Placed',      time: 'Jan 28, 10:30 AM', done: true },
  { label: 'Sample Collection', time: 'Jan 29, 9:15 AM',  done: true },
  { label: 'Lab Received',      time: 'Jan 29, 11:00 AM', done: true },
  { label: 'Processing',        time: '',                  done: false },
  { label: 'Report Ready',      time: '',                  done: false },
]

const PATIENTS = [
  { name: 'Ananya Sharma', meta: '28 Yrs • Female • UID: P-101', test: 'Complete Blood Count (CBC) with ESR-Single', outcome: 'In Analysis', outcomeDone: false },
  { name: 'Rajesh Sharma',  meta: '56 Yrs • Male • UID: P-102',   test: 'Full Body Checkup- Package',                outcome: 'Complete',   outcomeDone: true  },
]

interface OrderDetailsPageProps { items: CartItem[] }

const CARD: React.CSSProperties = {
  background: '#fff',
  boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
  borderRadius: 16,
  outline: '1px solid #E7E1FF',
  outlineOffset: -1,
  padding: '20px 24px',
  boxSizing: 'border-box',
  width: '100%',
}

const LABEL: React.CSSProperties = { fontSize: 'clamp(11px, 0.9vw, 14px)', color: '#828282', fontWeight: 400 }
const VALUE: React.CSSProperties = { fontSize: 'clamp(12px, 1vw, 16px)', color: '#161616', fontWeight: 500 }
const SECTION_TITLE: React.CSSProperties = { fontSize: 'clamp(13px, 1.1vw, 18px)', fontWeight: 500, color: '#161616', marginBottom: 8 }

export default function OrderDetailsPage(_: OrderDetailsPageProps) {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins, sans-serif', overflowX: 'hidden' }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 40px', boxSizing: 'border-box', width: '100%' }}>

        {/* Back */}
        <button onClick={() => navigate('/orders')} style={{
          display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
          cursor: 'pointer', marginBottom: 20, padding: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: 'clamp(12px, 1vw, 16px)', color: '#161616', fontFamily: 'Inter, sans-serif' }}>Back to Orders</span>
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Order header banner */}
          <div style={{
            background: 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)',
            borderRadius: 16, padding: '18px 24px',
            display: 'flex', flexWrap: 'wrap', alignItems: 'center',
            justifyContent: 'space-between', gap: 16,
            outline: '1px solid #E7E1FF', outlineOffset: -1,
          }}>
            {/* Left */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'rgba(139,92,246,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="20" height="22" viewBox="0 0 21 23" fill="none">
                  <path d="M17.5 1H3.5C2.4 1 1.5 1.9 1.5 3V21L5.5 18L10.5 21L15.5 18L19.5 21V3C19.5 1.9 18.6 1 17.5 1Z" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.5 8h8M6.5 12h5" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 'clamp(13px, 1.1vw, 18px)', fontWeight: 500, color: '#fff' }}>Order #NUC-8429103</span>
                  <span style={{ padding: '2px 10px', background: '#8B5CF6', borderRadius: 20, fontSize: 'clamp(10px, 0.8vw, 13px)', color: '#F9F9F9' }}>In Progress</span>
                </div>
                <span style={{ fontSize: 'clamp(11px, 0.9vw, 14px)', color: '#828282' }}>Home Collection</span>
              </div>
            </div>
            {/* Right: contact */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="14" height="11" viewBox="0 0 16 12" fill="none">
                  <rect x="1" y="1" width="14" height="10" rx="2" stroke="#8B5CF6" strokeWidth="1.5"/>
                  <path d="M1 3l7 5 7-5" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize: 'clamp(11px, 0.9vw, 14px)', color: '#F9F9F9' }}>ananya.sharma@email.com</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M14 10.5c-1 0-2-.2-2.9-.5a1 1 0 0 0-1 .2l-1.8 1.8A11 11 0 0 1 4.1 7.7l1.8-1.8a1 1 0 0 0 .2-1C5.8 4 5.5 3 5.5 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1c0 7.2 5.8 13 13 13a1 1 0 0 0 1-1v-2.5a1 1 0 0 0-1-1z" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize: 'clamp(11px, 0.9vw, 14px)', color: '#F9F9F9' }}>+91 98765 43210</span>
              </div>
            </div>
          </div>

          {/* Appointment + Collection Address row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {[
              { title: 'Appointment',         icon: '📅', line1: 'Sunday, 8th Feb', line2: '7:00 AM - 8:00 AM' },
              { title: 'Collection Address',  icon: '📍', line1: 'Sunday, 8th Feb', line2: '7:00 AM - 8:00 AM' },
            ].map(sec => (
              <div key={sec.title} style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={SECTION_TITLE}>{sec.title}</span>
                <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#E7E1FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
                    {sec.icon}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={VALUE}>{sec.line1}</span>
                    <span style={LABEL}>{sec.line2}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Tracking */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={SECTION_TITLE}>Order Tracking</span>
            <div style={CARD}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {TRACKING_STEPS.map((step, i) => (
                  <div key={step.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {/* Dot + line */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: step.done ? '#8B5CF6' : '#E7E1FF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {step.done && (
                          <svg width="10" height="8" viewBox="0 0 14 11" fill="none">
                            <path d="M1 5l4 4L13 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      {i < TRACKING_STEPS.length - 1 && (
                        <div style={{ width: 1, height: 28, background: '#E7E1FF' }} />
                      )}
                    </div>
                    {/* Text */}
                    <div style={{ paddingBottom: i < TRACKING_STEPS.length - 1 ? 0 : 0, paddingTop: 1 }}>
                      <span style={{ ...VALUE, display: 'block' }}>{step.label}</span>
                      {step.time && <span style={{ ...LABEL, display: 'block' }}>{step.time}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Patient Record */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={SECTION_TITLE}>Patient Record</span>
            <div style={CARD}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {PATIENTS.map((p, i) => (
                  <div key={p.name}>
                    {i > 0 && <div style={{ height: 1, background: '#E7E1FF', marginBottom: 16 }} />}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      {/* Patient info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#E7E1FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="18" height="20" viewBox="0 0 21 23" fill="none">
                            <path d="M17.5 1H3.5C2.4 1 1.5 1.9 1.5 3V21L5.5 18L10.5 21L15.5 18L19.5 21V3C19.5 1.9 18.6 1 17.5 1Z" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={VALUE}>{p.name}</span>
                          <span style={LABEL}>{p.meta}</span>
                        </div>
                      </div>
                      {/* Outcome + test */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={LABEL}>Report Outcome</span>
                          <span style={{ ...VALUE, color: p.outcomeDone ? '#41C9B3' : '#8B5CF6' }}>{p.outcome}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={LABEL}>Assigned Biomarker</span>
                          <span style={{
                            padding: '4px 10px', background: '#FFF4EF',
                            borderRadius: 100, outline: '1px solid #EA8C5A', outlineOffset: -1,
                            fontSize: 'clamp(10px, 0.8vw, 13px)', color: '#161616',
                          }}>{p.test}</span>
                        </div>
                        {p.outcomeDone && (
                          <button style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 20px', background: '#8B5CF6', borderRadius: 8, border: 'none',
                            color: '#fff', fontSize: 'clamp(11px, 0.9vw, 14px)', fontWeight: 500,
                            cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
                          }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                            View Report
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Billing & Payment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={SECTION_TITLE}>Billing &amp; Payment Summary</span>
            <div style={CARD}>
              {/* Payment meta */}
              <div style={{
                background: 'linear-gradient(180deg, #E7E1FF 0%, #fff 100%)',
                borderRadius: 10, padding: '16px 20px', marginBottom: 16,
                display: 'flex', flexWrap: 'wrap', gap: 24,
              }}>
                {[
                  { label: 'Payment Mode',    value: 'UPI / Digital Wallet' },
                  { label: 'Transaction Date', value: '7th Feb, 2026' },
                  { label: 'Security',         value: 'AES-256 Encrypted' },
                  { label: 'Invoice No',       value: 'NUC-INV-2401' },
                ].map(m => (
                  <div key={m.label} style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 120 }}>
                    <span style={VALUE}>{m.label}</span>
                    <span style={LABEL}>{m.value}</span>
                  </div>
                ))}
              </div>
              {/* Line items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={LABEL}>Complete Blood Count (CBC) with ESR x 1</span>
                </div>
                <div style={{ height: 1, background: '#E7E1FF' }} />
                {[
                  { label: 'Subtotal (1 item)', value: '₹599', color: '#161616' },
                  { label: 'You Save',          value: '-₹200', color: '#41C9B3' },
                  { label: 'Home Collection',   value: 'FREE',  color: '#41C9B3' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={LABEL}>{row.label}</span>
                    <span style={{ ...VALUE, color: row.color }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ height: 1, background: '#E7E1FF' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'clamp(13px, 1.1vw, 18px)', fontWeight: 500, color: '#161616' }}>Total</span>
                  <span style={{ fontSize: 'clamp(16px, 1.5vw, 24px)', fontWeight: 600, color: '#101129' }}>₹399</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
