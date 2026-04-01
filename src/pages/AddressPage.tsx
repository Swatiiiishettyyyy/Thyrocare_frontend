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
  { label: 'Cart', icon: '✓', done: true },
  { label: 'Address', icon: '📍', active: true },
  { label: 'Time Slot', icon: '🕐' },
  { label: 'Payment', icon: '💳' },
]

interface AddressPageProps {
  items: CartItem[]
}

export default function AddressPage({ items }: AddressPageProps) {
  const navigate = useNavigate()
  const [forSelf, setForSelf] = useState(true)

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
                background: step.done ? '#7C5CFC' : step.active ? '#7C5CFC' : '#EDE9FE',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: step.done ? 20 : 18,
                color: step.done || step.active ? '#fff' : '#9CA3AF',
              }}>
                {step.done ? '✓' : step.icon}
              </div>
              <span style={{ fontSize: 13, fontWeight: step.active ? 600 : 400, color: step.active ? '#7C5CFC' : '#9CA3AF' }}>{step.label}</span>
            </div>
            {i < steps.length - 1 && <div style={{ width: 80, height: 2, background: '#EDE9FE', margin: '0 4px 20px' }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <div style={{ display: 'flex', gap: 24, padding: '0 40px 60px', maxWidth: 1100, margin: '0 auto', alignItems: 'flex-start' }}>

        {/* Left */}
        <div style={{ flex: 1 }}>

          {/* Who is this test for */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Who is this test for?</p>
            <div style={{ display: 'flex', gap: 16 }}>
              <button onClick={() => setForSelf(true)} style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 20px', borderRadius: 12,
                border: forSelf ? '2px solid #7C5CFC' : '1.5px solid #E5E7EB',
                background: '#fff', cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>For Myself</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>Book for Self</div>
                </div>
              </button>
              <button onClick={() => setForSelf(false)} style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 20px', borderRadius: 12,
                border: !forSelf ? '2px solid #7C5CFC' : '1.5px solid #E5E7EB',
                background: '#fff', cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👨‍👩‍👧</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>For Family Members</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>1 Members</div>
                </div>
              </button>
            </div>
          </div>

          {/* Select Family Member */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Select Family Member</p>
              <button style={{ fontSize: 12, color: '#7C5CFC', background: 'none', border: '1px solid #7C5CFC', borderRadius: 20, padding: '4px 12px', cursor: 'pointer' }}>Add New +</button>
            </div>
            <div style={{ border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #7C5CFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#7C5CFC' }} />
              </div>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Ananya Sharma</span>
                  <span style={{ fontSize: 11, background: '#EDE9FE', color: '#7C5CFC', borderRadius: 6, padding: '2px 8px', fontWeight: 500 }}>Spouse</span>
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>30 Year · Female</div>
              </div>
            </div>
          </div>

          {/* Select Collection Address */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Select Collection Address</p>
              <button style={{ fontSize: 12, color: '#7C5CFC', background: 'none', border: '1px solid #7C5CFC', borderRadius: 20, padding: '4px 12px', cursor: 'pointer' }}>Add New +</button>
            </div>
            <div style={{ border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ marginTop: 2, width: 20, height: 20, borderRadius: '50%', border: '2px solid #7C5CFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#7C5CFC' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Home</span>
                  <span style={{ fontSize: 11, background: '#EDE9FE', color: '#7C5CFC', borderRadius: 6, padding: '2px 8px', fontWeight: 500 }}>Default</span>
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
                  123 Main Street, Apartment 4B<br />
                  Mumbai, Maharashtra - 400001<br />
                  +91 9768767765
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Order Summary */}
        <div style={{ width: 320, border: '1px solid #E5E7EB', borderRadius: 16, padding: '24px', flexShrink: 0 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>Order Summary</h3>
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
            <span style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>FREE</span>
          </div>
          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 16, display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Total</span>
            <span style={{ fontSize: 15, fontWeight: 700 }}>₹{total}</span>
          </div>
          <button onClick={() => navigate('/cart')} style={{
            width: '100%', padding: '13px', borderRadius: 50, border: '1.5px solid #D1D5DB',
            background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 12,
          }}>‹ Back</button>
          <button style={{
            width: '100%', padding: '14px', borderRadius: 50, border: 'none',
            background: '#7C5CFC', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }} onClick={() => navigate('/payment')}>Continue ›</button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
            <span>✅</span>
            <span style={{ fontSize: 12, color: '#6B7280' }}>You are saving ₹{savings} on this order</span>
          </div>
        </div>

      </div>
    </div>
  )
}
