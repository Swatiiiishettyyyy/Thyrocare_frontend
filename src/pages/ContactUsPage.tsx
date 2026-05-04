import { Navbar, Footer } from '../components'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/packages' },
  { label: 'Reports', href: '/reports' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '/orders' },
]

export default function ContactUsPage() {
  return (
    <>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => window.location.href = '/cart'} />
      <div style={{ 
        fontFamily: 'Poppins, sans-serif',
        backgroundColor: '#FFFFFF',
        minHeight: '100vh',
        paddingTop: '80px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '40px 32px 48px',
        }}>
          {/* Main Title */}
          <h1 style={{
            fontSize: '32px',
            fontWeight: 600,
            color: '#1F2937',
            textAlign: 'center',
            marginBottom: '16px',
            lineHeight: '40px',
          }}>
            Contact Us
          </h1>

          <p style={{
            fontSize: '16px',
            color: '#6B7280',
            textAlign: 'center',
            marginBottom: '48px',
            lineHeight: '24px',
          }}>
            Have questions? We're here to help. Reach out to our support team.
          </p>

          {/* Contact Information Card */}
          <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            backgroundColor: '#F9FAFB',
            borderRadius: '12px',
            padding: '40px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}>
            {/* Support Name */}
            <div style={{ marginBottom: '32px', textAlign: 'center' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 600,
                color: '#1F2937',
                marginBottom: '8px',
              }}>
                Nucleotide Support
              </h2>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>
                Our team is available to assist you
              </p>
            </div>

            {/* Contact Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Email */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#8B5CF6',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px', fontWeight: 500 }}>
                    Email
                  </p>
                  <a 
                    href="mailto:info@nucleotide.life" 
                    style={{ 
                      fontSize: '16px', 
                      color: '#8B5CF6', 
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                  >
                    info@nucleotide.life
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#8B5CF6',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px', fontWeight: 500 }}>
                    Phone
                  </p>
                  <a 
                    href="tel:+919403891587" 
                    style={{ 
                      fontSize: '16px', 
                      color: '#8B5CF6', 
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                  >
                    +91 9403891587
                  </a>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div style={{
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid #E5E7EB',
            }}>
              <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '20px', textAlign: 'center' }}>
                <strong style={{ color: '#1F2937' }}>Business Hours:</strong><br />
                Monday - Saturday: 9:00 AM - 6:00 PM IST<br />
                Sunday: Closed
              </p>
            </div>
          </div>

          {/* Company Info */}
          <div style={{
            maxWidth: '600px',
            margin: '32px auto 0',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '8px' }}>
              Nucleotide Healthcare Private Limited
            </p>
            <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '20px' }}>
              Registered in India under the Companies Act, 2013
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
