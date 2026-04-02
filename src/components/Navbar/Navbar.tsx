import React, { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import type { NavbarProps } from '../../types'

const Navbar = React.memo(function Navbar({ links, ctaLabel, onCtaClick }: NavbarProps) {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header style={{ background: '#fff', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #F3F4F6', boxShadow: '0 1px 12px rgba(139,92,246,0.08)' }}>
      <div className="navbar-inner">

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <img src="/favicon.svg" alt="Nucleotide" style={{ width: 28, height: 26 }} />
          <span style={{ fontFamily: 'Poppins,sans-serif', fontSize: 16, fontWeight: 700, color: '#101129' }}>Nucleotide</span>
        </Link>

        {/* Search bar */}
        <div className="navbar-search" style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#F9F9F9', border: '1px solid #E7E1FF', borderRadius: 100, height: 40, overflow: 'hidden' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fff', border: 'none', borderRight: '1px solid #E7E1FF', borderRadius: '100px 0 0 100px', padding: '0 14px', height: '100%', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="10" height="12" viewBox="0 0 12 16" fill="none">
              <path d="M6 0C3.24 0 1 2.24 1 5C1 8.75 6 14 6 14C6 14 11 8.75 11 5C11 2.24 8.76 0 6 0ZM6 6.5C5.17 6.5 4.5 5.83 4.5 5C4.5 4.17 5.17 3.5 6 3.5C6.83 3.5 7.5 4.17 7.5 5C7.5 5.83 6.83 6.5 6 6.5Z" fill="#7C5CFC"/>
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
            } else { isActive = path === link.href }
            return (
              <Link key={link.label} to={link.href.startsWith('#') ? '/' + link.href : link.href}
                style={{ fontFamily: 'Poppins,sans-serif', fontSize: 14, fontWeight: 500, color: isActive ? '#8B5CF6' : '#374151', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Bell */}
        <div className="navbar-bell" style={{ position: 'relative', flexShrink: 0 }}>
          <button aria-label="Notifications" style={{ width: 40, height: 40, borderRadius: '50%', background: '#F9F9F9', border: '1px solid #E7E1FF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="14" height="17" viewBox="0 0 18 22" fill="none">
              <path d="M7 19C7 20.1 7.9 21 9 21C10.1 21 11 20.1 11 19M2 17V16C2 14.6 2.42 13.3 3.15 12.3C3.88 11.24 4 10.62 4 9C4 6.24 6.24 4 9 4C11.76 4 14 6.24 14 9C14 10.62 14.12 11.24 14.85 12.3C15.58 13.3 16 14.6 16 16V17H2Z" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <span style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, background: '#7C5CFC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Poppins,sans-serif', fontSize: 10, fontWeight: 600, color: '#fff' }}>1</span>
        </div>

        {/* Cart button */}
        <button onClick={onCtaClick} style={{ height: 40, borderRadius: 100, padding: '0 18px', background: '#101129', border: 'none', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}>
          <svg width="16" height="14" viewBox="0 0 20 18" fill="none">
            <path d="M1 1H3.25L4.2 3M4.2 3H19L16 10H6L4.2 3ZM7 15C7 15.55 6.8 16.02 6.41 16.41C6.02 16.8 5.55 17 5 17C4.45 17 3.98 16.8 3.59 16.41C3.2 16.02 3 15.55 3 15C3 14.45 3.2 13.98 3.59 13.59C3.98 13.2 4.45 13 5 13C5.55 13 6.02 13.2 6.41 13.59C6.8 13.98 17 14.45 17 15Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="navbar-cart-label" style={{ fontFamily: 'Poppins,sans-serif', fontSize: 13, fontWeight: 600, color: '#fff' }}>{ctaLabel}</span>
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
