import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { CartItem } from '../types'
import { Navbar } from '../components'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/' },
  { label: 'Reports', href: '#' },
  { label: 'Metrics', href: '#' },
  { label: 'Orders', href: '#' },
]

const steps = [
  { label: 'Cart', icon: '🛒' },
  { label: 'Address', icon: '📍' },
  { label: 'Time Slot', icon: '🕐' },
  { label: 'Payment', icon: '💳' },
]

interface CartPageProps {
  items: CartItem[]
  onUpdateQty: (name: string, delta: number) => void
}

export default function CartPage({ items, onUpdateQty }: CartPageProps) {
  const navigate = useNavigate()
  const subtotal = items.reduce((sum, i) => sum + parseInt(i.originalPrice) * i.quantity, 0)
  const total = items.reduce((sum, i) => sum + parseInt(i.price) * i.quantity, 0)
  const savings = subtotal - total

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Poppins', sans-serif" }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} />

      {/* Breadcrumb */}
      <div style={{ padding: '12px 40px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, color: '#6B7280', cursor: 'pointer' }} onClick={() => navigate('/')}>Tests</span>
        <span style={{ fontSize: 13, color: '#6B7280' }}>›</span>
        <span style={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>Checkout</span>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0, padding: '32px 0 24px' }}>
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: i === 0 ? '#7C5CFC' : '#EDE9FE',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>
                {step.icon}
              </div>
              <span style={{ fontSize: 13, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? '#7C5CFC' : '#9CA3AF' }}>{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 80, height: 2, background: '#EDE9FE', margin: '0 4px 20px' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <div style={{ display: 'flex', gap: 24, padding: '0 40px 60px', maxWidth: 1100, margin: '0 auto', alignItems: 'flex-start' }}>

        {/* Cart items */}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
            Your Cart Items({items.length} item{items.length !== 1 ? 's' : ''})
          </h2>
          {items.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
              Your cart is empty
            </div>
          ) : (
            items.map((item) => (
              <div key={item.name} style={{
                border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 20px',
                marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{item.name}</span>
                    <span style={{
                      fontSize: 12, fontWeight: 500, color: '#7C5CFC',
                      background: '#EDE9FE', borderRadius: 6, padding: '2px 10px',
                    }}>{item.type}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>No of Patients</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => onUpdateQty(item.name, -1)} style={{
                        width: 28, height: 28, borderRadius: '50%', border: 'none',
                        background: '#7C5CFC', color: '#fff', fontSize: 16, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>−</button>
                      <span style={{ fontSize: 14, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => onUpdateQty(item.name, 1)} style={{
                        width: 28, height: 28, borderRadius: '50%', border: 'none',
                        background: '#7C5CFC', color: '#fff', fontSize: 16, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>+</button>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>₹{parseInt(item.price) * item.quantity}</div>
                  <div style={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'line-through' }}>₹{parseInt(item.originalPrice) * item.quantity}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Summary */}
        <div style={{ width: 320, border: '1px solid #E5E7EB', borderRadius: 16, padding: '24px', flexShrink: 0 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>Order Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, color: '#6B7280' }}>Subtotal({items.length} item{items.length !== 1 ? 's' : ''})</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>₹{subtotal}</span>
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
            <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Total</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>₹{total}</span>
          </div>
          <button style={{
            width: '100%', padding: '14px', borderRadius: 50, border: 'none',
            background: '#7C5CFC', color: '#fff', fontSize: 15, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }} onClick={() => navigate('/address')}>
            Continue ›
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <span style={{ fontSize: 12, color: '#6B7280' }}>You are saving ₹{savings} on this order</span>
          </div>
        </div>

      </div>
    </div>
  )
}
