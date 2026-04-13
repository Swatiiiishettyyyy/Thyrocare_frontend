import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'
import emptyReportIllustration from '../assets/figma/empty-report/fi_4751509.svg'

const NAV_LINKS = [
  { label: 'Tests',    href: '/' },
  { label: 'Packages', href: '/packages' },
  { label: 'Reports',  href: '/reports' },
  { label: 'Metrics',  href: '/metrics' },
  { label: 'Orders',   href: '/orders' },
]

export default function EmptyReportPage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins, sans-serif', overflowX: 'hidden' }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} />

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 51,
        padding: 'clamp(40px, 6vw, 80px) clamp(16px, 4vw, 56px)',
        maxWidth: 805, margin: '0 auto', width: '100%', boxSizing: 'border-box',
      }}>

        {/* Illustration + text */}
        <div style={{ width: '100%', maxWidth: 470, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

          {/* Circle with illustration */}
          <div style={{
            width: 'clamp(200px, 30vw, 400px)',
            aspectRatio: '1',
            background: 'linear-gradient(180deg, #E7E1FF 0%, #fff 100%)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <img src={emptyReportIllustration} alt="No reports" style={{ width: '34%', height: 'auto' }} />
          </div>

          {/* Text */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%', textAlign: 'center' }}>
            <h2 style={{
              margin: 0, color: '#161616',
              fontSize: 'clamp(22px, 2.5vw, 32px)',
              fontFamily: 'Poppins, sans-serif', fontWeight: 500, lineHeight: 1.03,
            }}>No Reports Found</h2>
            <p style={{
              margin: 0, color: '#414141',
              fontSize: 'clamp(14px, 1.3vw, 20px)',
              fontFamily: 'Poppins, sans-serif', fontWeight: 400, lineHeight: 1.45,
              maxWidth: 440,
            }}>
              Your reports will appear here after you complete a test or upload an external report.
            </p>
          </div>
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 15, width: '100%', maxWidth: 470 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              flex: 1, height: 58, background: '#8B5CF6', borderRadius: 10, border: 'none',
              color: '#fff', fontSize: 'clamp(14px, 1.3vw, 20px)',
              fontFamily: 'Poppins, sans-serif', fontWeight: 500,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            Browse Test
            <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
              <path d="M2 2l8 8-8 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button
            onClick={() => navigate('/upload-report')}
            style={{
              flex: 1, height: 58, background: '#fff', borderRadius: 8,
              border: 'none', outline: '1px solid #8B5CF6', outlineOffset: -1,
              color: '#101129', fontSize: 'clamp(14px, 1.3vw, 20px)',
              fontFamily: 'Poppins, sans-serif', fontWeight: 500,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            Upload Report
            <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
              <path d="M2 2l8 8-8 8" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

      </div>
    </div>
  )
}
