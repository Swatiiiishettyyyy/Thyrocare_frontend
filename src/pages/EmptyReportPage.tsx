import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'
import emptyReportIllustration from '../assets/figma/empty-report/fi_4751509.svg'
import arrowWhite from '../assets/figma/empty-report/Frame-3.svg'

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
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" hideSearchOnMobile onCtaClick={() => navigate('/cart')} />

      <div
      className="empty-report-content"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
        padding: '40px 24px 60px',
        maxWidth: 500,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
        minHeight: 'calc(100vh - 72px)',
      }}
      >

        {/* Illustration + text */}
        <div className="empty-report-block" style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

          {/* Circle with illustration */}
          <div style={{
            width: 120,
            height: 120,
            background: 'linear-gradient(180deg, #E7E1FF 0%, #fff 82%)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <img src={emptyReportIllustration} alt="No reports" style={{ width: '40%', height: 'auto' }} />
          </div>

          {/* Text */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%', textAlign: 'center' }}>
            <h2 style={{
              margin: 0, color: '#161616',
              fontSize: 20,
              fontWeight: 600,
              lineHeight: 1.2,
            }}>No Reports Found</h2>
            <p style={{
              margin: 0, color: '#828282',
              fontSize: 14,
              fontWeight: 400,
              lineHeight: 1.6,
              maxWidth: 320,
              fontFamily: 'Inter, sans-serif',
            }}>
              Your reports will appear here after you complete a test or upload an external report.
            </p>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="empty-report-ctas" style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 340 }}>
          <button
            onClick={() => navigate('/')}
            className="empty-report-cta"
            style={{
              width: '100%',
              height: 48,
              background: '#8B5CF6', borderRadius: 10, border: 'none',
              color: '#fff', fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            Browse Test
            <img src={arrowWhite} alt="" style={{ width: 20, height: 20, display: 'block' }} />
          </button>
        </div>

      </div>
    </div>
  )
}
