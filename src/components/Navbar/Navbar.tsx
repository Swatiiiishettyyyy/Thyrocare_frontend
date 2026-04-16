import React, { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import type { NavbarProps } from '../../types'
import nucleotideLogo from '../../assets/figma/Property 1=Tests.png'

const locationPinIcon = (
  <svg width="20" height="20" viewBox="0 0 14 18" fill="none" aria-hidden>
    <path
      d="M7 0C3.69 0 1 2.69 1 6C1 10.5 7 17 7 17C7 17 13 10.5 13 6C13 2.69 10.31 0 7 0ZM7 8C5.9 8 5 7.1 5 6C5 4.9 5.9 4 7 4C8.1 4 9 4.9 9 6C9 7.1 8.1 8 7 8Z"
      fill="url(#loc_grad_nav)"
    />
    <defs>
      <linearGradient id="loc_grad_nav" x1="1" y1="0" x2="13" y2="17" gradientUnits="userSpaceOnUse">
        <stop stopColor="#101129" />
        <stop offset="1" stopColor="#2A2C5B" />
      </linearGradient>
    </defs>
  </svg>
)

const Navbar = React.memo(function Navbar({
  links,
  ctaLabel,
  onCtaClick,
  cartCount,
  hideSearchOnMobile,
  activeHrefOverride,
}: NavbarProps & { cartCount?: number }) {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header
      className={`site-navbar-header sm:block${hideSearchOnMobile ? ' site-navbar-header--no-search' : ''}`}
      style={{
        background: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0px 4px 149px rgba(139, 92, 246, 0.21)',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'visible',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div
        className="navbar-inner"
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <button
          className="navbar-hamburger"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setMenuOpen((o) => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            {menuOpen ? (
              <path d="M6 6L18 18M6 18L18 6" stroke="#101129" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="#101129" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>

        <Link to="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
          <img
            src={nucleotideLogo}
            alt="Nucleotide"
            className="navbar-logo-img"
            style={{
              height: 55,
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
              marginLeft: 'calc(-1 * clamp(2px, 0.6vmin, 8px))',
            }}
          />
        </Link>

        <div className="navbar-trailing-actions" style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div className="navbar-bell-wrap" style={{ position: 'relative' }}>
            <button
              type="button"
              className="navbar-bell-btn"
              aria-label="Notifications"
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#F9F9F9',
                border: '1px solid #E7E1FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              <svg width="18" height="20" viewBox="0 0 20 22" fill="none" aria-hidden>
                <path
                  d="M10 2C6.69 2 4 4.69 4 8V13L2 15V16H18V15L16 13V8C16 4.69 13.31 2 10 2Z"
                  fill="url(#bell_grad)"
                />
                <path d="M8 17C8 18.1 8.9 19 10 19C11.1 19 12 18.1 12 17H8Z" fill="url(#bell_grad2)" />
                <defs>
                  <linearGradient id="bell_grad" x1="2" y1="2" x2="18" y2="16" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#101129" />
                    <stop offset="1" stopColor="#2A2C5B" />
                  </linearGradient>
                  <linearGradient id="bell_grad2" x1="8" y1="17" x2="12" y2="19" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#101129" />
                    <stop offset="1" stopColor="#2A2C5B" />
                  </linearGradient>
                </defs>
              </svg>
            </button>
            <span
              className="navbar-bell-badge"
              aria-hidden
              style={{
                position: 'absolute',
                top: 5,
                right: 5,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#EF4444',
                border: '1.5px solid #fff',
                pointerEvents: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div className="navbar-cart-wrap" style={{ position: 'relative', flexShrink: 0 }}>
            <button
              type="button"
              onClick={onCtaClick}
              className="navbar-cart-btn"
              aria-label={ctaLabel}
              style={{
                height: 44,
                padding: '0 18px',
                background: 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)',
                border: '1px solid #E7E1FF',
                borderRadius: 277,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                flexShrink: 0,
                boxSizing: 'border-box',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden>
                <path
                  d="M1 1H4L5.68 13.39C5.77 14.06 6.34 14.56 7.01 14.56H17.4C18.05 14.56 18.61 14.09 18.72 13.44L19.99 6H4.5"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="8" cy="19" r="1.5" fill="white" />
                <circle cx="17" cy="19" r="1.5" fill="white" />
              </svg>
              <span
                className="navbar-cart-label"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: 'var(--type-nav)',
                  fontWeight: 500,
                  lineHeight: 'var(--lh-ui)',
                  color: '#fff',
                  whiteSpace: 'nowrap',
                }}
              >
                {ctaLabel}
              </span>
            </button>
            {cartCount != null && cartCount > 0 && (
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  minWidth: 20,
                  height: 20,
                  padding: '0 5px',
                  borderRadius: 10,
                  background: '#E7E1FF',
                  border: '2px solid #fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#101129',
                  pointerEvents: 'none',
                  boxSizing: 'border-box',
                }}
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
        </div>

        <nav className="navbar-nav" style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
          {links.map((link) => {
            const path = location.pathname
            const hash = location.hash
            let isActive = false
            if (activeHrefOverride) {
              isActive = link.href === activeHrefOverride
            } else if (link.href.startsWith('#')) {
              isActive = path === '/' && (hash === link.href || (link.href === '#tests' && hash === ''))
            } else if (link.href === '/packages') {
              isActive = path === '/packages'
            } else if (link.href === '/orders') {
              isActive = path.startsWith('/order')
            } else if (link.href === '/reports') {
              isActive = path.startsWith('/report') || path.startsWith('/compare-report')
            } else if (link.href === '/metrics') {
              isActive = path === '/metrics' || path.startsWith('/metrics/')
            } else {
              isActive = path === link.href
            }
            return (
              <Link
                key={link.label}
                to={link.href.startsWith('#') ? '/' + link.href : link.href}
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: 'var(--type-nav)',
                  fontWeight: 500,
                  lineHeight: 'var(--lh-ui)',
                  color: isActive ? '#8B5CF6' : '#161616',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <button
          type="button"
          aria-label="Choose location"
          className="navbar-location-mobile"
          style={{
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {locationPinIcon}
          <span
            className="navbar-location-mobile-label"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 16,
              fontWeight: 500,
              color: '#161616',
              lineHeight: '27px',
            }}
          >
            Mumbai
          </span>
          <svg width="20" height="20" viewBox="0 0 12 8" fill="none" aria-hidden className="navbar-location-mobile-chevron">
            <path d="M1 1L6 6L11 1" stroke="#161616" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <div
          className="navbar-search"
          style={{
            flex: 1,
            maxWidth: 720,
            display: 'flex',
            alignItems: 'center',
            background: '#F9F9F9',
            border: '1px solid #E7E1FF',
            borderRadius: 140,
            height: 46,
            overflow: 'hidden',
            minWidth: 0,
            boxSizing: 'border-box',
          }}
        >
          <button
            type="button"
            aria-label="Choose location"
            className="navbar-location-btn navbar-location-desktop"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: '#E7E1FF',
              border: 'none',
              borderRadius: 116,
              padding: '6px 12px',
              margin: 4,
              height: 36,
              cursor: 'pointer',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              boxSizing: 'border-box',
            }}
          >
            <svg width="11" height="14" viewBox="0 0 14 18" fill="none" aria-hidden>
              <path
                d="M7 0C3.69 0 1 2.69 1 6C1 10.5 7 17 7 17C7 17 13 10.5 13 6C13 2.69 10.31 0 7 0ZM7 8C5.9 8 5 7.1 5 6C5 4.9 5.9 4 7 4C8.1 4 9 4.9 9 6C9 7.1 8.1 8 7 8Z"
                fill="url(#loc_grad_desk)"
              />
              <defs>
                <linearGradient id="loc_grad_desk" x1="1" y1="0" x2="13" y2="17" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#101129" />
                  <stop offset="1" stopColor="#2A2C5B" />
                </linearGradient>
              </defs>
            </svg>
            <span
              className="navbar-location-label"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 'var(--type-nav-input)',
                fontWeight: 400,
                color: '#161616',
                lineHeight: 'var(--lh-body)',
              }}
            >
              Location
            </span>
            <svg width="9" height="6" viewBox="0 0 12 8" fill="none" aria-hidden className="navbar-location-chevron">
              <path d="M1 1L6 6L11 1" stroke="#161616" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          <input
            type="search"
            placeholder='Try "Blood Sugar", "Full Body Checkup"'
            aria-label="Search"
            className="navbar-search-input"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'Poppins, sans-serif',
              fontSize: 12,
              fontWeight: 400,
              color: '#828282',
              padding: '0 10px',
              minWidth: 0,
              lineHeight: '27px',
              boxSizing: 'border-box',
            }}
          />

          <button
            type="button"
            aria-label="Search"
            className="navbar-search-submit"
            style={{
              background: '#E7E1FF',
              border: 'none',
              borderRadius: 30,
              width: 34,
              height: 34,
              margin: '0 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxSizing: 'border-box',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 20 21" fill="none" aria-hidden>
              <path
                d="M17.5 18L13.5 14M15.5 9.5A6 6 0 1 1 3.5 9.5a6 6 0 0 1 12 0z"
                stroke="#8B5CF6"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.3)',
              zIndex: 200,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: 300,
              zIndex: 201,
              background: 'linear-gradient(0deg, #E7E1FF 0%, #fff 100%)',
              display: 'flex',
              flexDirection: 'column',
              padding: '20px 0',
              boxShadow: '4px 0 24px rgba(139,92,246,0.15)',
            }}
          >
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              style={{
                position: 'absolute',
                top: 13,
                right: 16,
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#F7F7F7',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="#24254F" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>

            <nav style={{ display: 'flex', flexDirection: 'column', padding: '48px 0 0' }}>
              {links.map((link) => (
                <Link
                  key={link.label}
                  to={link.href.startsWith('#') ? '/' + link.href : link.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: 16,
                    fontWeight: 500,
                    color: '#161616',
                    textDecoration: 'none',
                    padding: '24px 16px',
                    borderBottom: '1px solid rgba(139,92,246,0.08)',
                    display: 'block',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </header>
  )
})

export { Navbar }
