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

const DAYS = [
  { label: 'Sat, 8 Feb', slots: ['7:00 AM - 8:00 AM', '8:00 AM - 9:00 AM', '9:00 AM - 10:00 AM'] },
  { label: 'Sun, 9 Feb', slots: ['7:00 AM - 8:00 AM', '8:00 AM - 9:00 AM', '9:00 AM - 10:00 AM'] },
]

interface TimeSlotPageProps {
  items: CartItem[]
}

export default function TimeSlotPage({ items }: TimeSlotPageProps) {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<{ day: number; slot: number } | null>(null)

  const subtotal  = items.length > 0 ? items.reduce((s, i) => s + parseInt(i.originalPrice) * i.quantity, 0) : 599
  const total     = items.length > 0 ? items.reduce((s, i) => s + parseInt(i.price) * i.quantity, 0) : 399
  const savings   = subtotal - total
  const itemCount = items.length > 0 ? items.length : 1

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Poppins', sans-serif", overflowX: 'hidden' }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} />

      <CheckoutStepper activeStep={2} />

      {/* Main layout */}
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

          {/* Select Collection Time + banner */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <span style={{
              fontSize: 'clamp(16px, 1.4vw, 20px)',
              fontWeight: 500,
              color: '#161616',
              fontFamily: 'Poppins, sans-serif',
              lineHeight: '1.3',
            }}>
              Select Collection Time
            </span>

            {/* Teal recommendation banner */}
            <div style={{
              background: '#E6F6F3',
              borderRadius: 20,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              boxSizing: 'border-box',
            }}>
              {/* Fasting icon placeholder */}
              <div style={{ width: 24, height: 24, flexShrink: 0, marginTop: 2 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="6" width="20" height="16" rx="2" stroke="#41C9B3" strokeWidth="2"/>
                  <path d="M8 2v4M16 2v4M2 10h20" stroke="#41C9B3" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <span style={{
                  fontSize: 'clamp(14px, 1.2vw, 20px)',
                  fontWeight: 500,
                  color: '#101129',
                  fontFamily: 'Poppins, sans-serif',
                  lineHeight: '1.3',
                }}>
                  Early Morning Recommended
                </span>
                <span style={{
                  fontSize: 'clamp(12px, 1vw, 18px)',
                  fontWeight: 400,
                  color: '#414141',
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: '1.5',
                }}>
                  Since fasting is required, we recommend selecting an early morning slot.
                </span>
              </div>
            </div>
          </div>

          {/* Day + time slot rows */}
          {DAYS.map((day, di) => (
            <div key={di} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <span style={{
                fontSize: 'clamp(13px, 1vw, 18px)',
                fontWeight: 400,
                color: '#000',
                fontFamily: 'Inter, sans-serif',
                lineHeight: '1.5',
              }}>
                {day.label}
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                {day.slots.map((slot, si) => {
                  const isActive = selected?.day === di && selected?.slot === si
                  return (
                    <button
                      key={si}
                      onClick={() => setSelected({ day: di, slot: si })}
                      style={{
                        flex: '1 1 160px',
                        maxWidth: 219,
                        height: 52,
                        borderRadius: 103,
                        border: `1px solid ${isActive ? '#8B5CF6' : '#E7E1FF'}`,
                        background: isActive ? '#8B5CF6' : '#E7E1FF',
                        color: isActive ? '#fff' : '#161616',
                        fontSize: 'clamp(12px, 1vw, 18px)',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 400,
                        lineHeight: '1.5',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s',
                        boxSizing: 'border-box',
                        whiteSpace: 'nowrap',
                        padding: '0 12px',
                      }}
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Card */}
        <div style={{ flex: '0 1 380px', width: '100%', maxWidth: 380, boxSizing: 'border-box' }}>
          <OrderSummaryCard
            itemCount={itemCount}
            subtotal={subtotal}
            savings={savings}
            total={total}
            onBack={() => navigate('/address')}
            onContinue={() => navigate('/payment')}
          />
        </div>
      </div>
    </div>
  )
}
