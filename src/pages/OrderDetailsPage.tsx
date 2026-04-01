import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'
import type { CartItem } from '../types'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/' },
  { label: 'Reports', href: '/reports' },
  { label: 'Metrics', href: '#' },
  { label: 'Orders', href: '/orders' },
]

const TRACKING_STEPS = [
  { label: 'Order Placed', time: 'Jan 28, 10:30 AM', done: true },
  { label: 'Sample Collection', time: 'Jan 29, 9:15 AM', done: true },
  { label: 'Lab Received', time: 'Jan 29, 11:00 AM', done: true },
  { label: 'Processing', time: '', done: false },
  { label: 'Report Ready', time: '', done: false },
]

interface OrderTrackingPageProps {
  items: CartItem[]
}

export default function OrderTrackingPage({ items }: OrderTrackingPageProps) {
  const navigate = useNavigate()
  const subtotal = items.reduce((s, i) => s + parseInt(i.originalPrice) * i.quantity, 0)
  const total = items.reduce((s, i) => s + parseInt(i.price) * i.quantity, 0)
  const savings = subtotal - total

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Poppins', sans-serif" }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 24px 60px' }}>

        {/* Back */}
        <button onClick={() => navigate('/orders')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7C5CFC', fontSize: 14, fontWeight: 500, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
          ‹ Back to Orders
        </button>

        {/* Order header card */}
        <div style={{ background: '#1B1F3B', borderRadius: 16, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#2D3160', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏠</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Order #NUC-8429103</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', background: '#7C5CFC', borderRadius: 20, padding: '3px 12px' }}>In Progress</span>
              </div>
              <span style={{ fontSize: 13, color: '#9CA3AF' }}>Home Collection</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>✉ ananya.sharma@email.com</div>
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>📞 +91 98765 43210</div>
          </div>
        </div>

        {/* Appointment + Collection Address */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 8 }}>
          <div>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 8px' }}>Appointment</p>
            <div style={{ border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>📅</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Sunday, 8th Feb</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>7.00 AM– 8.00 AM</div>
              </div>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 8px' }}>Collection Address</p>
            <div style={{ border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>📍</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Sunday, 8th Feb</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>7.00 AM– 8.00 AM</div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Tracking */}
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: '20px 0 8px' }}>Order Tracking</p>
        <div style={{ border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
          {TRACKING_STEPS.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: i < TRACKING_STEPS.length - 1 ? 20 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: step.done ? '#7C5CFC' : '#E5E7EB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: '#fff',
                }}>
                  {step.done ? '✓' : ''}
                </div>
                {i < TRACKING_STEPS.length - 1 && (
                  <div style={{ width: 2, height: 20, background: step.done ? '#7C5CFC' : '#E5E7EB', marginTop: 4 }} />
                )}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: step.done ? 600 : 400, color: step.done ? '#111827' : '#9CA3AF' }}>{step.label}</div>
                {step.time && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{step.time}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Patient Record */}
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 8px' }}>Patient Record</p>
        <div style={{ border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
          {[
            { name: 'Ananya Sharma', age: '28 Yrs', gender: 'Female', uid: 'P-101', test: 'Complete Blood Count (CBC) with ESR-Single', outcome: 'In Analysis', complete: false },
            { name: 'Rajesh Sharma', age: '56 Yrs', gender: 'Male', uid: 'P-102', test: 'Full Body Checkup- Package', outcome: 'Complete', complete: true },
          ].map((p, i) => (
            <div key={i} style={{ marginBottom: i === 0 ? 24 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📋</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>{p.age} • {p.gender} • UID: {p.uid}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Report Outcome</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                    {!p.complete && <span style={{ fontSize: 14 }}>🔵</span>}
                    <span style={{ fontSize: 13, fontWeight: 600, color: p.complete ? '#111827' : '#6B7280' }}>{p.outcome}</span>
                  </div>
                  {p.complete && (
                    <button onClick={() => navigate('/report')} style={{ marginTop: 8, background: '#7C5CFC', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      📄 View Report
                    </button>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>Assigned Biomarker</div>
              <span style={{ fontSize: 12, color: '#374151', border: '1px solid #E5E7EB', borderRadius: 20, padding: '4px 12px' }}>{p.test}</span>
              {i === 0 && <div style={{ borderTop: '1px solid #F3F4F6', margin: '20px 0 0' }} />}
            </div>
          ))}
        </div>

        {/* Billing & Payment Summary */}
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 8px' }}>Billing & Payment Summary</p>
        <div style={{ border: '1.5px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ background: '#F5F3FF', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '12px 20px', gap: 8 }}>
            {['Payment Mode', 'Transaction Date', 'Security', 'Invoice No'].map(h => (
              <span key={h} style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{h}</span>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '12px 20px', gap: 8, borderBottom: '1px solid #F3F4F6' }}>
            {['UPI / Digital Wallet', '7th Feb, 2026', 'AES-256 Encrypted', 'NUC-INV-2401'].map(v => (
              <span key={v} style={{ fontSize: 13, color: '#6B7280' }}>{v}</span>
            ))}
          </div>
          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13, color: '#374151', marginBottom: 16 }}>
              {items.length > 0 ? `${items[0].name} x ${items[0].quantity}` : 'Complete Blood Count (CBC) with ESR x 1'}
            </div>
            {[
              { label: `Subtotal(${items.length || 1} item)`, value: `₹${subtotal || 599}`, color: '#111827' },
              { label: 'You Save', value: `-₹${savings || 200}`, color: '#059669' },
              { label: 'Home Collection', value: 'FREE', color: '#059669' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 14, color: '#6B7280' }}>{row.label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: row.color }}>{row.value}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Total</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>₹{total || 399}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
