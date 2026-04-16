import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'
import emptyReportIllustration from '../assets/figma/empty-report/fi_4751509.svg'
import arrowWhite from '../assets/figma/empty-report/Frame-3.svg'
import arrowPurple from '../assets/figma/empty-report/Frame.svg'

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

      <div
      className="empty-report-content"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(24px, 4vmin, 40px)',
        /*
         * Figma: content block top ≈ 268px with a 96px header → ~172px below header.
         * Keep the desktop placement exact-ish while still scaling down on smaller screens.
         */
        padding: 'calc(var(--pad-section-y) * 0.45) var(--pad-section-x) calc(var(--pad-section-y) * 0.55)',
        maxWidth: 'min(805px, var(--page-inner-w))',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
        minHeight: 'calc(100vh - clamp(84px, 10vmin, 96px))',
      }}
      >

        {/* Illustration + text */}
        <div className="empty-report-block" style={{ width: '100%', maxWidth: 470, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* Circle with illustration */}
          <div style={{
            width: 'clamp(170px, 22vw, 300px)',
            aspectRatio: '1',
            background: 'linear-gradient(180deg, #E7E1FF 0%, #fff 82%)',
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
              fontSize: 'var(--type-subhead)',
              fontWeight: 500,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
            }}>No Reports Found</h2>
            <p style={{
              margin: 0, color: '#414141',
              fontSize: 'var(--type-lead)',
              fontWeight: 400,
              lineHeight: 'var(--lh-body)',
              maxWidth: 437,
            }}>
              Your reports will appear here after you complete a test or upload an external report.
            </p>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="empty-report-ctas" style={{ display: 'flex', gap: 15, width: '100%', maxWidth: 470, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/')}
            className="empty-report-cta"
            style={{
              flex: '1 1 200px',
              minHeight: 'clamp(52px, 6vmin, 58px)',
              background: '#8B5CF6', borderRadius: 10, border: 'none',
              color: '#fff', fontSize: 'var(--type-ui)',
              fontWeight: 500,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            Browse Test
            <img src={arrowWhite} alt="" style={{ width: 24, height: 24, display: 'block' }} />
          </button>

          <button
            onClick={() => navigate('/upload-report')}
            className="empty-report-cta"
            style={{
              flex: '1 1 200px',
              minHeight: 'clamp(52px, 6vmin, 58px)',
              background: '#fff', borderRadius: 8,
              border: 'none', outline: '1px solid #8B5CF6', outlineOffset: -1,
              color: '#101129', fontSize: 'var(--type-ui)',
              fontWeight: 500,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            Upload Report
            <img src={arrowPurple} alt="" style={{ width: 24, height: 24, display: 'block' }} />
          </button>
        </div>

      </div>
    </div>
  )
}
