import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'
import type { CartItem } from '../types'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/' },
  { label: 'Reports', href: '#' },
  { label: 'Metrics', href: '#' },
  { label: 'Orders', href: '#' },
]

const steps = [
  { label: 'Cart', done: true },
  { label: 'Address', done: true },
  { label: 'Time Slot', done: true },
  { label: 'Payment', active: true },
]

interface PaymentPageProps {
  items: CartItem[]
}

export default function PaymentPage({ items }: PaymentPageProps) {
  const navigate = useNavigate()
  const [payMethod, setPayMethod] = useState<'online' | 'collection'>('online')

  const subtotal = items.reduce((s, i) => s + parseInt(i.originalPrice) * i.quantity, 0)
  const total = items.reduce((s, i) => s + parseInt(i.price) * i.quantity, 0)
  const savings = subtotal - total

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Poppins', sans-serif" }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} />

      {/* Stepper */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '32px 0 24px' }}>
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: step.done || step.active ? '#7C5CFC' : '#EDE9FE',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, color: step.done || step.active ? '#fff' : '#9CA3AF',
              }}>
                {step.done ? '✓' : step.active ? '💳' : '○'}
              </div>
              <span style={{ fontSize: 13, fontWeight: step.active ? 600 : 400, color: step.active ? '#7C5CFC' : '#9CA3AF' }}>{step.label}</span>
            </div>
            {i < steps.length - 1 && <div style={{ width: 80, height: 2, background: '#7C5CFC', margin: '0 4px 20px' }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <div style={{ display: 'flex', gap: 32, padding: '0 56px 60px', maxWidth: 1100, margin: '0 auto', alignItems: 'flex-start' }}>

        {/* Left */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Payment</p>

          {/* Order Summary box */}
          <div style={{ border: '1.5px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ background: '#EDE9FE', padding: '14px 20px' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Order Summary</span>
            </div>
            <div style={{ padding: '20px', minHeight: 120 }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>{item.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>₹{parseInt(item.price) * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Collection Detail */}
          <div style={{ border: '1.5px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ background: '#EDE9FE', padding: '14px 20px' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Collection Detail</span>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 18, marginTop: 2 }}>📍</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Home Collection</div>
                  <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
                    123 Main Street, Apartment 4B<br />
                    Mumbai, Maharashtra - 400001
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 18, marginTop: 2 }}>📅</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 2 }}>Sunday, 8th Feb</div>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>7:00 AM - 8:00 AM</div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div style={{ border: '1.5px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ background: '#EDE9FE', padding: '14px 20px' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Payment Method</span>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { id: 'online', label: 'Pay Online', sub: 'UPI, Cards, Net Banking' },
                { id: 'collection', label: 'Pay On Collection', sub: 'UPI, Cards, Net Banking' },
              ].map(opt => (
                <button key={opt.id} onClick={() => setPayMethod(opt.id as 'online' | 'collection')} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 10,
                  border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${payMethod === opt.id ? '#7C5CFC' : '#D1D5DB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {payMethod === opt.id && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#7C5CFC' }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>{opt.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary sidebar */}
        <div style={{ width: 320, border: '1px solid #E5E7EB', borderRadius: 16, padding: '24px', flexShrink: 0 }}>
          <h3 style={{ fontSize: 18, fontWeight: 500, color: '#111827', margin: '0 0 20px' }}>Order Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, color: '#6B7280' }}>Subtotal({items.length} item{items.length !== 1 ? 's' : ''})</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>₹{subtotal}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, color: '#6B7280' }}>You Save</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#059669' }}>-₹{savings}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontSize: 14, color: '#6B7280' }}>Home Collection</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#059669' }}>FREE</span>
          </div>
          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 16, display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Total</span>
            <span style={{ fontSize: 16, fontWeight: 500 }}>₹{total}</span>
          </div>
          <button onClick={() => navigate('/address')} style={{
            width: '100%', padding: '13px', borderRadius: 50, border: '1.5px solid #D1D5DB',
            background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 12,
          }}>‹ Back</button>
          <button style={{
            width: '100%', padding: '14px', borderRadius: 50, border: 'none',
            background: '#7C5CFC', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }} onClick={() => navigate('/confirmation')}>Place Order ›</button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
            <span>✅</span>
            <span style={{ fontSize: 12, color: '#6B7280' }}>You are saving ₹{savings} on this order</span>
          </div>
        </div>

      </div>
    </div>
  )
}
