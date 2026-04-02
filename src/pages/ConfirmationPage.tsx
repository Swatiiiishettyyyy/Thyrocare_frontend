import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/' },
  { label: 'Reports', href: '#' },
  { label: 'Metrics', href: '#' },
  { label: 'Orders', href: '#' },
]

export default function ConfirmationPage() {
  const navigate = useNavigate()
  const orderId = '#NUC-' + Math.floor(1000000 + Math.random() * 9000000)

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Poppins', sans-serif", display: 'flex', flexDirection: 'column' }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px 20px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>

        {/* Success icon */}
        <div style={{ position: 'relative', width: 100, height: 100, marginBottom: 28 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(72,200,180,0.15)' }} />
          <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', background: 'rgba(72,200,180,0.25)' }} />
          <div style={{ position: 'absolute', inset: 20, borderRadius: '50%', background: '#3DBFA8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 32, fontWeight: 500, color: '#7C5CFC', margin: '0 0 12px', textAlign: 'center' }}>
          Booking Confirmed!
        </h1>
        <p style={{ fontSize: 15, color: '#6B7280', textAlign: 'center', margin: '0 0 32px', lineHeight: 1.6, maxWidth: 460 }}>
          Your health checkup has been successfully scheduled.<br />
          We've sent the details to your email and phone.
        </p>

        {/* Order card */}
        <div style={{
          background: 'linear-gradient(135deg, #EDE9FE 0%, #F5F3FF 100%)',
          borderRadius: 16, padding: '24px 28px', width: '100%', maxWidth: 560,
          marginBottom: 28, position: 'relative',
        }}>
          <button style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#7C5CFC' }}>
            ⬆
          </button>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Order ID</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: '#111827' }}>{orderId}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Appointment</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#111827' }}>Sunday, 8th Feb</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>7.00 AM– 8.00 AM</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Samples</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#111827' }}>Home Collection</div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 16, width: '100%', maxWidth: 560, marginBottom: 28 }}>
          <button onClick={() => navigate('/orders')} style={{
            flex: 1, padding: '15px', borderRadius: 12, border: 'none',
            background: '#7C5CFC', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}>
            Track My Orders ›
          </button>
          <button onClick={() => navigate('/')} style={{
            flex: 1, padding: '15px', borderRadius: 12,
            border: '1.5px solid #E5E7EB', background: 'transparent',
            color: '#374151', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}>
            ‹ Back to Home
          </button>
        </div>

      </div>

      {/* Reminder banner */}
      <div style={{
        background: '#FFF7ED', borderTop: '1px solid #FED7AA',
        padding: '16px 40px', textAlign: 'center',
      }}>
        <span style={{ fontSize: 14, color: '#374151' }}>
          <strong>Reminder:</strong> <span style={{ color: '#6B7280' }}>Please ensure 12 hours of fasting for the most accurate results. Only water is allowed.</span>
        </span>
      </div>
    </div>
  )
}
