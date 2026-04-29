import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'
import emptyCartImg from '../assets/figma/checkout-pages/empty_cart.png'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/' },
  { label: 'Reports', href: '#' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '#' },
]

export default function EmptyCartPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fff',
      fontFamily: 'Poppins, sans-serif',
      overflowX: 'hidden',
    }}>
      <Navbar
        logoSrc="/favicon.svg"
        logoAlt="Nucleotide"
        links={NAV_LINKS}
        ctaLabel="My Cart"
        hideSearchOnMobile
        onCtaClick={() => navigate('/cart')}
      />

      {/* Centered content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 51,
        padding: 'clamp(40px, 6vw, 80px) clamp(16px, 4vw, 56px)',
        maxWidth: 600,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}>

        {/* Illustration + text */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
          width: '100%',
          maxWidth: 437,
        }}>
          {/* Illustration */}
          <img
            src={emptyCartImg}
            alt="Empty cart"
            style={{
              width: 'clamp(180px, 30vw, 400px)',
              height: 'auto',
              marginBottom: -35,
              flexShrink: 0,
            }}
          />

          {/* Text */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 18,
            width: '100%',
            textAlign: 'center',
          }}>
            <div style={{
              color: '#161616',
              fontSize: 'clamp(20px, 2.5vw, 32px)',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 500,
              lineHeight: 1.03,
              letterSpacing: '-0.02em',
            }}>
              Your Cart is Empty
            </div>
            <div style={{
              color: '#414141',
              fontSize: 'clamp(14px, 1.3vw, 20px)',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 400,
              lineHeight: 1.45,
            }}>
              Add a test or health package to get started.
            </div>
          </div>
        </div>

        {/* Browse Test button */}
        <button
          onClick={() => navigate('/')}
          style={{
            width: '100%',
            maxWidth: 470,
            height: 'clamp(48px, 5vw, 64px)',
            background: '#8B5CF6',
            borderRadius: 10,
            border: 'none',
            color: '#fff',
            fontSize: 'clamp(14px, 1.3vw, 20px)',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxSizing: 'border-box',
          }}
        >
          Browse Test
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
            <path d="M2 2l8 8-8 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
