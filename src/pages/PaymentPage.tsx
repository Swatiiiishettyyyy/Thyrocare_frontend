import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'
import { CheckoutStepper } from '../components/CheckoutStepper'
import { OrderSummaryCard } from '../components/OrderSummaryCard'
import type { CartItem } from '../types'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/' },
  { label: 'Reports', href: '#' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '#' },
]

const SECTION_HEADER: React.CSSProperties = {
  background: '#E7E1FF',
  padding: '20px 43px',
  color: '#101129',
  fontSize: 'clamp(15px, 1.2vw, 20px)',
  fontFamily: 'Poppins, sans-serif',
  fontWeight: 500,
  lineHeight: 1.3,
}

const CARD: React.CSSProperties = {
  background: '#fff',
  boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
  borderRadius: 20,
  outline: '1px solid #E7E1FF',
  outlineOffset: -1,
  overflow: 'hidden',
  width: '100%',
  boxSizing: 'border-box',
}

interface PaymentPageProps {
  items: CartItem[]
}

export default function PaymentPage({ items }: PaymentPageProps) {
  const navigate = useNavigate()
  const [payMethod, setPayMethod] = useState<'online' | 'collection'>('online')

  const subtotal  = items.length > 0 ? items.reduce((s, i) => s + parseInt(i.originalPrice) * i.quantity, 0) : 599
  const total     = items.length > 0 ? items.reduce((s, i) => s + parseInt(i.price) * i.quantity, 0) : 399
  const savings   = subtotal - total
  const itemCount = items.length > 0 ? items.length : 1

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins, sans-serif', overflowX: 'hidden' }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} />
      <CheckoutStepper activeStep={3} />

      {/* Page wrapper */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 28,
        padding: '0 clamp(16px, 4vw, 56px) 60px',
        maxWidth: 1700,
        margin: '0 auto',
        alignItems: 'flex-start',
        boxSizing: 'border-box',
        width: '100%',
      }}>

        {/* Left column */}
        <div style={{ flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Breadcrumb */}
          <span style={{ fontSize: 'clamp(12px, 1vw, 18px)', color: '#828282', fontFamily: 'Inter, sans-serif' }}>
            Tests &rsaquo; <span style={{ color: '#101129' }}>Checkout</span>
          </span>

          {/* ── Order Summary card ── */}
          <div style={CARD}>
            <div style={SECTION_HEADER}>Order Summary</div>
            <div style={{ padding: '24px 43px', minHeight: 80 }}>
              {items.length === 0 ? (
                <span style={{ fontSize: 'clamp(13px, 1vw, 18px)', color: '#828282', fontFamily: 'Inter, sans-serif' }}>
                  No items in cart
                </span>
              ) : items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 'clamp(13px, 1vw, 18px)', color: '#414141', fontFamily: 'Poppins, sans-serif' }}>{item.name}</span>
                  <span style={{ fontSize: 'clamp(13px, 1vw, 18px)', fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif' }}>₹{parseInt(item.price) * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Collection Detail card ── */}
          <div style={CARD}>
            <div style={SECTION_HEADER}>Collection Detail</div>
            <div style={{ padding: '24px 43px', display: 'flex', flexDirection: 'column', gap: 26 }}>

              {/* Address row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="#8B5CF6"/>
                </svg>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 'clamp(14px, 1.1vw, 20px)', fontWeight: 400, color: '#161616', fontFamily: 'Poppins, sans-serif', lineHeight: 1.45 }}>
                    Home Collection
                  </div>
                  <div style={{ fontSize: 'clamp(12px, 1vw, 18px)', fontWeight: 400, color: '#828282', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                    123 Main Street, Apartment 4B<br />
                    Mumbai, Maharashtra - 400001
                  </div>
                </div>
              </div>

              {/* Date/time row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                  <rect x="2" y="6" width="20" height="16" rx="2" stroke="#8B5CF6" strokeWidth="2"/>
                  <path d="M8 2v4M16 2v4M2 10h20" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 'clamp(14px, 1.1vw, 20px)', fontWeight: 400, color: '#161616', fontFamily: 'Poppins, sans-serif', lineHeight: 1.45 }}>
                    Sunday, 8th Feb
                  </div>
                  <div style={{ fontSize: 'clamp(12px, 1vw, 18px)', fontWeight: 400, color: '#828282', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                    7:00 AM - 8:00 AM
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Payment Method card ── */}
          <div style={CARD}>
            <div style={SECTION_HEADER}>Payment Method</div>
            <div style={{ padding: '16px 43px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { id: 'online',     label: 'Pay Online',        sub: 'UPI, Cards, Net Banking' },
                { id: 'collection', label: 'Pay On Collection', sub: 'UPI, Cards, Net Banking' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setPayMethod(opt.id as 'online' | 'collection')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0,
                    height: 78,
                    borderRadius: 10,
                    outline: '1px solid #E7E1FF',
                    outlineOffset: -1,
                    border: 'none',
                    background: '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    padding: '0 14px',
                    boxSizing: 'border-box',
                    width: '100%',
                  }}
                >
                  {/* Radio */}
                  <div style={{
                    width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      border: `2px solid ${payMethod === opt.id ? '#8B5CF6' : '#D1D5DB'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {payMethod === opt.id && (
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#8B5CF6' }} />
                      )}
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 'clamp(14px, 1.1vw, 20px)', fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif', lineHeight: 1.3 }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: 'clamp(12px, 1vw, 18px)', fontWeight: 400, color: '#828282', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                      {opt.sub}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary sidebar */}
        <div style={{ flex: '0 1 380px', width: '100%', maxWidth: 380, boxSizing: 'border-box' }}>
          <OrderSummaryCard
            itemCount={itemCount}
            subtotal={subtotal}
            savings={savings}
            total={total}
            onBack={() => navigate('/timeslot')}
            onContinue={() => navigate('/confirmation')}
            continueLabel="Place Order"
          />
        </div>
      </div>
    </div>
  )
}
