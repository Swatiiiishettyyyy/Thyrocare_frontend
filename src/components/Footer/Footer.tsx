import { useState } from 'react'

const COLUMNS = [
  {
    heading: 'Privacy & Legal',
    links: ['Privacy Policy', 'Terms and Conditions', 'Refund and Cancellation'],
  },
  {
    heading: 'Quick Links',
    links: ['About Us', 'Track Your Order'],
  },
  {
    heading: 'Resources',
    links: ['Blog', 'Sample Reports'],
  },
  {
    heading: 'Support',
    links: ['FAQs', 'Support Center', 'Contact Us'],
  },
]

export function Footer() {
  const [email, setEmail] = useState('')

  return (
    <footer style={{ background: '#13152B', fontFamily: 'Poppins,sans-serif' }}>
      {/* Main section */}
      <div className="footer-main">
        {/* Brand col */}
        <div style={{ minWidth: 260, flexShrink: 0 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <img src="/favicon.svg" alt="Nucleotide" style={{ width: 36, height: 34 }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Nucleotide</span>
          </div>
          {/* Tagline */}
          <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.7, margin: '0 0 24px', maxWidth: 240 }}>
            Decoding your DNA to reveal disease risk, drug response, vitamin needs, and cognitive insights for a healthier future.
          </p>
          {/* Social icons */}
          <div style={{ display: 'flex', gap: 14 }}>
            {/* Facebook */}
            <a href="#" aria-label="Facebook" style={iconStyle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            {/* Instagram */}
            <a href="#" aria-label="Instagram" style={iconStyle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            {/* LinkedIn */}
            <a href="#" aria-label="LinkedIn" style={iconStyle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
            {/* YouTube */}
            <a href="#" aria-label="YouTube" style={iconStyle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#13152B"/></svg>
            </a>
          </div>
        </div>

        {/* Link columns */}
        <div className="footer-links-grid">
          {COLUMNS.map(col => (
            <div key={col.heading}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16 }}>{col.heading}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {col.links.map(link => (
                  <a key={link} href="#" style={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <span style={{ fontSize: 13, color: '#6B7280' }}>© 2024 Nucleotide. All rights reserved.</span>
        {/* Email subscribe */}
        <div style={{ display: 'flex', gap: 0 }}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              padding: '12px 18px', borderRadius: '8px 0 0 8px',
              border: '1px solid #2D3160', borderRight: 'none',
              background: '#1B1F3B', color: '#fff', fontSize: 13,
              outline: 'none', width: 220,
              fontFamily: 'Poppins,sans-serif',
            }}
          />
          <button style={{
            padding: '12px 22px', borderRadius: '0 8px 8px 0',
            border: 'none', background: '#7C5CFC',
            color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Poppins,sans-serif',
          }}>
            Subscribe
          </button>
        </div>
      </div>
    </footer>
  )
}

const iconStyle: React.CSSProperties = {
  width: 34, height: 34, borderRadius: '50%',
  background: '#1F2340',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  textDecoration: 'none',
}
