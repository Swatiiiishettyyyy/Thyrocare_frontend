import React, { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import type { NavbarProps } from '../../types'
import nucleotideLogo from '../../assets/figma/Property 1=Tests.png'
import frame29051 from '../../assets/figma/Frame 29051.png'

const Navbar = React.memo(function Navbar({ links, ctaLabel, onCtaClick }: NavbarProps) {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header style={{ background: '#fff', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #F3F4F6', boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)' }}>
      <div className="navbar-inner">

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <img src={nucleotideLogo} alt="Nucleotide" style={{ width: 250, height: 190, objectFit: 'contain' }} />
        </Link>

        {/* Search bar */}
        <div className="navbar-search" style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#F9F9F9', border: '1px solid #E7E1FF', borderRadius: 100, height: 40, overflow: 'hidden' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fff', border: 'none', borderRight: '1px solid #E7E1FF', borderRadius: '100px 0 0 100px', padding: '0 14px', height: '100%', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="10" height="12" viewBox="0 0 12 16" fill="none">
              <path d="M6 0C3.24 0 1 2.24 1 5C1 8.75 6 14 6 14C6 14 11 8.75 11 5C11 2.24 8.76 0 6 0ZM6 6.5C5.17 6.5 4.5 5.83 4.5 5C4.5 4.17 5.17 3.5 6 3.5C6.83 3.5 7.5 4.17 7.5 5C7.5 5.83 6.83 6.5 6 6.5Z" fill="#8B5CF6"/>
            </svg>
            <span style={{ fontFamily: 'Poppins,sans-serif', fontSize: 12, fontWeight: 500, color: '#374151' }}>Location</span>
            <svg width="8" height="5" viewBox="0 0 12 8" fill="none">
              <path d="M1 1L6 6L11 1" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <input type="search" placeholder='Try "Blood Sugar", "Full Body Checkup"' aria-label="Search"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'Poppins,sans-serif', fontSize: 13, color: '#828282', padding: '0 12px' }} />
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 14px', display: 'flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M18.5 18.5L13.5 13.5M15.5 9A6.5 6.5 0 1 1 2.5 9a6.5 6.5 0 0 1 13 0z" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Nav links desktop */}
        <nav className="navbar-nav">
          {links.map((link) => {
            const path = location.pathname
            const hash = location.hash
            let isActive = false
            if (link.href.startsWith('#')) {
              isActive = path === '/' && (hash === link.href || (link.href === '#tests' && hash === ''))
            } else if (link.href === '/packages') { isActive = path === '/packages'
            } else if (link.href === '/orders') { isActive = path.startsWith('/order')
            } else if (link.href === '/reports') { isActive = path.startsWith('/report') || path.startsWith('/compare-report')
            } else if (link.href === '/metrics') { isActive = path === '/metrics'
            } else { isActive = path === link.href }
            return (
              <Link key={link.label} to={link.href.startsWith('#') ? '/' + link.href : link.href}
                style={{ fontFamily: 'Poppins,sans-serif', fontSize: 14, fontWeight: 500, color: isActive ? '#8B5CF6' : '#374151', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Bell + Cart replaced by Frame 29051 */}
        <button onClick={onCtaClick} aria-label="Cart and notifications" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <img src={frame29051} alt="Cart and notifications" style={{ height: 40, objectFit: 'contain' }} />
        </button>

        {/* Hamburger — mobile only */}
        <button className="navbar-hamburger" aria-label="Toggle menu" onClick={() => setMenuOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0, display: 'none' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            {menuOpen
              ? <path d="M6 6L18 18M6 18L18 6" stroke="#101129" strokeWidth="2" strokeLinecap="round"/>
              : <path d="M3 6h18M3 12h18M3 18h18" stroke="#101129" strokeWidth="2" strokeLinecap="round"/>
            }
          </svg>
        </button>

      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <nav className="navbar-mobile-menu">
          {links.map((link) => (
            <Link key={link.label} to={link.href.startsWith('#') ? '/' + link.href : link.href}
              onClick={() => setMenuOpen(false)}
              style={{ fontFamily: 'Poppins,sans-serif', fontSize: 15, fontWeight: 500, color: '#374151', textDecoration: 'none', padding: '12px 16px', borderBottom: '1px solid #F3F4F6', display: 'block' }}>
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
})

export { Navbar }
