import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/' },
  { label: 'Reports', href: '#' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '#' },
]

export default function ConfirmationPage() {
  const navigate = useNavigate()
  const orderId = '#NUC-' + Math.floor(1000000 + Math.random() * 9000000)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fff',
      fontFamily: 'Poppins, sans-serif',
      overflowX: 'hidden',
      position: 'relative',
    }}>
      {/* Ambient blobs — clipped, no overflow */}
      <div style={{
        position: 'fixed', left: '-10vw', bottom: '5vh',
        width: '25vw', height: '20vh',
        background: '#41C9B3', opacity: 0.18,
        borderRadius: '50%', filter: 'blur(80px)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', right: '-8vw', top: '40vh',
        width: '22vw', height: '18vh',
        background: '#8B5CF6', opacity: 0.18,
        borderRadius: '50%', filter: 'blur(80px)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar
          logoSrc="/favicon.svg"
          logoAlt="Nucleotide"
          links={NAV_LINKS}
          ctaLabel="My Cart"
          onCtaClick={() => navigate('/cart')}
        />

        {/* Main content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          padding: 'clamp(16px, 2.5vw, 36px) clamp(16px, 4vw, 56px)',
          maxWidth: 1106,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}>

          {/* Top section: icon + heading + subtext */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%', maxWidth: 573 }}>

            {/* Concentric circles icon */}
            <div style={{ position: 'relative', width: 'clamp(72px, 8vw, 120px)', height: 'clamp(72px, 8vw, 120px)', flexShrink: 0 }}>
              <div style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%', background: '#D9F6F3', opacity: 0.5,
              }} />
              <div style={{
                position: 'absolute', inset: '15%',
                borderRadius: '50%', background: 'rgba(65,201,179,0.21)', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: '42%', height: '42%',
                  background: '#41C9B3', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg viewBox="0 0 24 24" fill="none" style={{ width: '60%', height: '60%' }}>
                    <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Heading + subtext */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
              <div style={{
                textAlign: 'center',
                color: '#101129',
                fontSize: 'clamp(22px, 2.5vw, 32px)',
                fontWeight: 600,
                lineHeight: 1,
              }}>
                Booking Confirmed!
              </div>
              <div style={{
                textAlign: 'center',
                color: '#828282',
                fontSize: 'clamp(13px, 1.2vw, 20px)',
                fontWeight: 400,
                lineHeight: 1.45,
              }}>
                Your health checkup has been successfully scheduled. We've sent the details to your email and phone.
              </div>
            </div>
          </div>

          {/* Order detail card */}
          <div style={{
            width: '100%',
            maxWidth: 964,
            background: 'linear-gradient(0deg, #E7E1FF 0%, #fff 100%)',
            borderRadius: 20,
            outline: '1px solid #E7E1FF',
            outlineOffset: -1,
            padding: 'clamp(14px, 2vw, 20px) clamp(16px, 3vw, 40px)',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            {/* Order ID row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ color: '#161616', fontSize: 'clamp(13px, 1.1vw, 20px)', fontWeight: 400, lineHeight: 1.45 }}>
                  Order ID
                </span>
                <span style={{ color: '#161616', fontSize: 'clamp(16px, 1.5vw, 24px)', fontWeight: 500, lineHeight: 1.125 }}>
                  {orderId}
                </span>
              </div>
              {/* Share icon */}
              <div style={{
                padding: 10, background: '#E7E1FF', borderRadius: 115,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: '#E7E1FF' }} />

            {/* Appointment + Samples */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 140 }}>
                <span style={{ color: '#828282', fontSize: 'clamp(13px, 1.1vw, 20px)', fontWeight: 400, lineHeight: 1.45 }}>
                  Appointment
                </span>
                <span style={{ color: '#161616', fontSize: 'clamp(13px, 1.1vw, 20px)', fontWeight: 500, lineHeight: 1.3 }}>
                  Sunday, 8th Feb<br />7:00 AM - 8:00 AM
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 140 }}>
                <span style={{ color: '#828282', fontSize: 'clamp(13px, 1.1vw, 20px)', fontWeight: 400, lineHeight: 1.45 }}>
                  Samples
                </span>
                <span style={{ color: '#161616', fontSize: 'clamp(13px, 1.1vw, 20px)', fontWeight: 500, lineHeight: 1.3 }}>
                  Home Collection
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, width: '100%', maxWidth: 964 }}>
            <button
              onClick={() => navigate('/orders')}
              style={{
                flex: '1 1 200px',
                height: 58,
                background: '#8B5CF6',
                borderRadius: 8,
                border: 'none',
                color: '#fff',
                fontSize: 'clamp(14px, 1.2vw, 20px)',
                fontWeight: 500,
                fontFamily: 'Poppins, sans-serif',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              Track My Orders
              <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
                <path d="M2 2l8 8-8 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={() => navigate('/')}
              style={{
                flex: '1 1 200px',
                height: 58,
                background: 'transparent',
                borderRadius: 8,
                outline: '1px solid #8B5CF6',
                outlineOffset: -1,
                border: 'none',
                color: '#101129',
                fontSize: 'clamp(14px, 1.2vw, 20px)',
                fontWeight: 500,
                fontFamily: 'Poppins, sans-serif',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <svg width="12" height="20" viewBox="0 0 12 20" fill="none" style={{ transform: 'rotate(180deg)' }}>
                <path d="M2 2l8 8-8 8" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Home
            </button>
          </div>

          {/* Reminder banner */}
          <div style={{
            width: '100%',
            maxWidth: 964,
            background: '#FFF4EF',
            borderRadius: 20,
            outline: '1px solid #EA8C5A',
            outlineOffset: -1,
            padding: 'clamp(12px, 1.5vw, 18px) clamp(16px, 4vw, 60px)',
            boxSizing: 'border-box',
            textAlign: 'center',
            fontSize: 'clamp(12px, 1vw, 16px)',
            lineHeight: 1.4,
          }}>
            <span style={{ color: '#101129', fontWeight: 500 }}>Reminder: </span>
            <span style={{ color: '#828282', fontWeight: 500 }}>
              Please ensure 12 hours of fasting for the most accurate results. Only water is allowed.
            </span>
          </div>

        </div>
      </div>
    </div>
  )
}
