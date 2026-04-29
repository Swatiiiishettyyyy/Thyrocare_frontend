import React, { useState, useEffect, useRef } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import type { NavbarProps } from '../../types'
import nucleotideLogo from '../../assets/figma/Property 1=Tests.png'
import { checkPincodeServiceability } from '../../api/cart'
import { mapboxGeocodeErrorMessage, mapboxReverseGeocode } from '../../lib/mapboxGeocode'
import MemberSwitchDropdown from '../MemberSwitchDropdown/MemberSwitchDropdown'

const PINCODE_LS_KEY = 'nucleotide_pincode_v1'

function loadSavedPincode(): string {
  try { return localStorage.getItem(PINCODE_LS_KEY) ?? '' } catch { return '' }
}
function savePincode(p: string) {
  try { localStorage.setItem(PINCODE_LS_KEY, p) } catch { /* ignore */ }
}

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
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [pincode, setPincode] = useState(loadSavedPincode)
  const [showPincodeModal, setShowPincodeModal] = useState(false)
  const [pincodeStatus, setPincodeStatus] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [pincodeSaving, setPincodeSaving] = useState(false)
  const [pincodeInput, setPincodeInput] = useState('')
  const [pincodeMode, setPincodeMode] = useState<'enter' | 'current'>('enter')
  const pincodeRef = useRef<HTMLDivElement>(null)
  const pincodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-close pincode modal after 30s of inactivity
  useEffect(() => {
    if (!showPincodeModal) {
      if (pincodeTimeoutRef.current) clearTimeout(pincodeTimeoutRef.current)
      return
    }
    pincodeTimeoutRef.current = setTimeout(() => setShowPincodeModal(false), 30000)
    return () => { if (pincodeTimeoutRef.current) clearTimeout(pincodeTimeoutRef.current) }
  }, [showPincodeModal])

  function resetPincodeTimeout() {
    if (!showPincodeModal) return
    if (pincodeTimeoutRef.current) clearTimeout(pincodeTimeoutRef.current)
    pincodeTimeoutRef.current = setTimeout(() => setShowPincodeModal(false), 30000)
  }
  useEffect(() => {
    if (!showPincodeModal) return
    function onOutside(e: MouseEvent) {
      if (pincodeRef.current && !pincodeRef.current.contains(e.target as Node)) {
        setShowPincodeModal(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [showPincodeModal])

  function handleSearch(e: React.SyntheticEvent) {
    e.preventDefault()
    const q = searchValue.trim()
    if (!q) return
    // Global search should always land on Tests page.
    navigate(`/?q=${encodeURIComponent(q)}`)
    setSearchValue('')
  }

  async function savePincodeIfServiceable(pin: string) {
    const p = pin.replace(/\D/g, '').slice(0, 6)
    if (p.length !== 6) {
      setPincodeStatus('Please enter a valid 6-digit pincode.')
      return
    }
    setPincodeSaving(true)
    setPincodeStatus(null)
    try {
      const r = await checkPincodeServiceability(p)
      if (!r.serviceable) {
        setPincodeStatus(r.message || 'Service is not available for this pincode.')
        return
      }
      setPincode(p)
      savePincode(p)
      setShowPincodeModal(false)
      setPincodeInput('')
      setPincodeStatus(null)
    } catch {
      setPincodeStatus('Could not verify serviceability. Please try again.')
    } finally {
      setPincodeSaving(false)
    }
  }

  async function useCurrentLocationForPincode() {
    if (!navigator.geolocation) {
      setPincodeStatus('Location is not supported on this device/browser.')
      return
    }
    setLocating(true)
    setPincodeStatus(null)
    try {
      const coords = await new Promise<{ lat: number; lng: number }>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 60_000 },
        )
      })
      const parsed = await mapboxReverseGeocode(coords.lng, coords.lat, { language: 'en' })
      const digits = String(parsed?.postal_code ?? '').replace(/\\D/g, '').slice(0, 6)
      if (digits.length !== 6) {
        setPincodeStatus('Could not detect a 6-digit pincode from your location.')
        return
      }
      await savePincodeIfServiceable(digits)
    } catch (e) {
      // Mapbox errors are the most common (missing token / blocked origin).
      setPincodeStatus(mapboxGeocodeErrorMessage(e))
    } finally {
      setLocating(false)
    }
  }

  const locationLabel = pincode ? pincode : 'Location'

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
          <div className="navbar-member-switch-inline">
            <MemberSwitchDropdown />
          </div>

          <div className="navbar-cart-wrap" style={{ position: 'relative', flexShrink: 0 }}>
            <button
              type="button"
              onClick={onCtaClick}
              className="navbar-cart-btn"
              aria-label={ctaLabel}
              style={{
                height: 44, padding: '0 18px',
                background: 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)',
                border: '1px solid #E7E1FF', borderRadius: 277,
                display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'pointer', flexShrink: 0, boxSizing: 'border-box',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden>
                <path d="M1 1H4L5.68 13.39C5.77 14.06 6.34 14.56 7.01 14.56H17.4C18.05 14.56 18.61 14.09 18.72 13.44L19.99 6H4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8" cy="19" r="1.5" fill="white" />
                <circle cx="17" cy="19" r="1.5" fill="white" />
              </svg>
              <span
                className="navbar-cart-label"
                style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'var(--type-nav)', fontWeight: 500, lineHeight: 'var(--lh-ui)', color: '#fff', whiteSpace: 'nowrap' }}
              >
                {ctaLabel}
              </span>
            </button>
            {cartCount != null && cartCount > 0 && (
              <span
                aria-hidden
                style={{
                  position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, padding: '0 5px',
                  borderRadius: 10, background: '#E7E1FF', border: '2px solid #fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, color: '#101129',
                  pointerEvents: 'none', boxSizing: 'border-box',
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
                  fontFamily: 'Poppins, sans-serif', fontSize: 'var(--type-nav)', fontWeight: 500,
                  lineHeight: 'var(--lh-ui)', color: isActive ? '#8B5CF6' : '#161616',
                  textDecoration: 'none', whiteSpace: 'nowrap',
                }}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Mobile location button */}
        <button
          type="button"
          aria-label="Choose location"
          className="navbar-location-mobile"
          onClick={() => { setShowPincodeModal(true) }}
          style={{ alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%', boxSizing: 'border-box' }}
        >
          {locationPinIcon}
          <span className="navbar-location-mobile-label" style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 500, color: '#161616', lineHeight: '27px' }}>
            {locationLabel}
          </span>
          <svg width="10" height="10" viewBox="0 0 12 8" fill="none" aria-hidden className="navbar-location-mobile-chevron">
            <path d="M1 1L6 6L11 1" stroke="#161616" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Search + location bar */}
        <div
          ref={pincodeRef}
          className="navbar-search-wrap"
          style={{ position: 'relative', boxSizing: 'border-box' }}
        >
          <form
            onSubmit={handleSearch}
            className="navbar-search"
            style={{
              display: 'flex', alignItems: 'center',
              background: '#F9F9F9', border: '1px solid #E7E1FF', borderRadius: 140,
              height: 46, overflow: 'hidden', boxSizing: 'border-box',
            }}
          >
            {/* Location pill */}
            <button
              type="button"
              aria-label="Choose location"
              className="navbar-location-btn navbar-location-desktop"
              onClick={() => {
                setPincodeInput(pincode)
                setPincodeStatus(null)
                setPincodeMode('enter')
                setShowPincodeModal(v => !v)
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: '#E7E1FF', border: 'none', borderRadius: 116,
                padding: '6px 12px', margin: 4, height: 36,
                cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap', boxSizing: 'border-box',
              }}
            >
              <svg width="11" height="14" viewBox="0 0 14 18" fill="none" aria-hidden>
                <path d="M7 0C3.69 0 1 2.69 1 6C1 10.5 7 17 7 17C7 17 13 10.5 13 6C13 2.69 10.31 0 7 0ZM7 8C5.9 8 5 7.1 5 6C5 4.9 5.9 4 7 4C8.1 4 9 4.9 9 6C9 7.1 8.1 8 7 8Z" fill="url(#loc_grad_desk)" />
                <defs>
                  <linearGradient id="loc_grad_desk" x1="1" y1="0" x2="13" y2="17" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#101129" /><stop offset="1" stopColor="#2A2C5B" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="navbar-location-label" style={{ fontFamily: 'Inter, sans-serif', fontSize: 'var(--type-nav-input)', fontWeight: 400, color: '#161616', lineHeight: 'var(--lh-body)' }}>
                {locationLabel}
              </span>
              <svg width="9" height="6" viewBox="0 0 12 8" fill="none" aria-hidden className="navbar-location-chevron">
                <path d="M1 1L6 6L11 1" stroke="#161616" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            <input
              type="search"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              placeholder='Try "Blood Sugar", "Full Body Checkup"'
              aria-label="Search tests"
              className="navbar-search-input"
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 400,
                color: '#828282', padding: '0 10px', minWidth: 0, lineHeight: '27px', boxSizing: 'border-box',
              }}
            />

            <button
              type="submit"
              aria-label="Search"
              className="navbar-search-submit"
              style={{
                background: '#E7E1FF', border: 'none', borderRadius: 30,
                width: 34, height: 34, margin: '0 4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0, boxSizing: 'border-box',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 20 21" fill="none" aria-hidden>
                <path d="M17.5 18L13.5 14M15.5 9.5A6 6 0 1 1 3.5 9.5a6 6 0 0 1 12 0z" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </form>

          {/* Pincode dropdown */}
          {showPincodeModal && (
            <div
              onMouseMove={resetPincodeTimeout}
              onTouchStart={resetPincodeTimeout}
              style={{
                position: 'absolute', top: '110%', left: 0, zIndex: 200,
                background: '#fff',
                borderRadius: 18,
                padding: 18,
                boxShadow: '0px 16px 60px rgba(16, 17, 41, 0.12)',
                border: '1px solid #E7E1FF',
                width: 320,
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <button
                  type="button"
                  onClick={() => { setPincodeMode('enter'); setPincodeStatus(null) }}
                  disabled={locating || pincodeSaving}
                  style={{
                    flex: 1,
                    height: 36,
                    borderRadius: 999,
                    border: '1px solid #E7E1FF',
                    background: pincodeMode === 'enter' ? '#E7E1FF' : '#fff',
                    color: '#101129',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: locating || pincodeSaving ? 'not-allowed' : 'pointer',
                  }}
                >
                  Enter PIN
                </button>
                <button
                  type="button"
                  onClick={() => { setPincodeMode('current'); setPincodeStatus(null) }}
                  disabled={locating || pincodeSaving}
                  style={{
                    flex: 1,
                    height: 36,
                    borderRadius: 999,
                    border: '1px solid #E7E1FF',
                    background: pincodeMode === 'current' ? '#E7E1FF' : '#fff',
                    color: '#101129',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: locating || pincodeSaving ? 'not-allowed' : 'pointer',
                  }}
                >
                  Current location
                </button>
              </div>

              {pincodeMode === 'enter' ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); void savePincodeIfServiceable(pincodeInput) }}
                  style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}
                >
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={pincodeInput}
                    onChange={e => setPincodeInput(e.target.value.replace(/\\D/g, '').slice(0, 6))}
                    placeholder="6-digit pincode"
                    style={{
                      flex: 1, height: 40, padding: '0 12px', borderRadius: 10,
                      border: '1px solid #E7E1FF',
                      background: '#F9F9F9',
                      fontFamily: 'Inter,sans-serif',
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={pincodeInput.length !== 6 || locating || pincodeSaving}
                    style={{
                      height: 40, padding: '0 14px', borderRadius: 10, border: 'none',
                      background: (pincodeInput.length === 6 && !locating && !pincodeSaving) ? 'linear-gradient(90deg,#101129,#2A2C5B)' : '#E5E7EB',
                      color: (pincodeInput.length === 6 && !locating && !pincodeSaving) ? '#fff' : '#9CA3AF',
                      fontSize: 13, fontWeight: 500,
                      cursor: (pincodeInput.length === 6 && !locating && !pincodeSaving) ? 'pointer' : 'not-allowed',
                      fontFamily: 'Poppins,sans-serif', flexShrink: 0,
                    }}
                  >
                    {pincodeSaving ? 'Checking…' : 'Set'}
                  </button>
                </form>
              ) : (
                navigator.geolocation && (
                  <button
                    type="button"
                    onClick={() => { void useCurrentLocationForPincode() }}
                    disabled={locating || pincodeSaving}
                    style={{
                      width: '100%',
                      height: 40,
                      borderRadius: 10,
                      border: 'none',
                      background: 'linear-gradient(90deg,#101129,#2A2C5B)',
                      color: '#fff',
                      fontFamily: 'Poppins,sans-serif',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: locating || pincodeSaving ? 'not-allowed' : 'pointer',
                      marginBottom: 10,
                      opacity: locating || pincodeSaving ? 0.65 : 1,
                    }}
                  >
                    {locating ? 'Detecting location…' : 'Use current location'}
                  </button>
                )
              )}
              {pincodeStatus && (
                <div
                  role="status"
                  style={{
                    margin: '0 0 10px',
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: pincodeStatus.toLowerCase().includes('available') ? '1px solid #A7F3D0' : '1px solid #FECACA',
                    background: pincodeStatus.toLowerCase().includes('available') ? '#ECFDF5' : '#FEF2F2',
                    color: pincodeStatus.toLowerCase().includes('available') ? '#065F46' : '#991B1B',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 12,
                    lineHeight: 1.4,
                  }}
                >
                  {pincodeStatus}
                </div>
              )}
              {pincode && (
                <button
                  type="button"
                  onClick={() => { setPincode(''); savePincode(''); setShowPincodeModal(false) }}
                  style={{ marginTop: 10, background: 'none', border: 'none', color: '#828282', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter,sans-serif', padding: 0 }}
                >
                  Clear saved pincode
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 200 }} />
          <div
            style={{
              position: 'fixed', top: 0, left: 0, bottom: 0, width: 300, zIndex: 201,
              background: 'linear-gradient(0deg, #E7E1FF 0%, #fff 100%)',
              display: 'flex', flexDirection: 'column', padding: '20px 0',
              boxShadow: '4px 0 24px rgba(139,92,246,0.15)',
            }}
          >
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              style={{ position: 'absolute', top: 13, right: 16, width: 40, height: 40, borderRadius: '50%', background: '#F7F7F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="#24254F" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <div className="navbar-member-switch-drawer" style={{ padding: '48px 16px 12px' }}>
              <MemberSwitchDropdown onAction={() => setMenuOpen(false)} />
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', padding: '0' }}>
              {links.map((link) => (
                <Link
                  key={link.label}
                  to={link.href.startsWith('#') ? '/' + link.href : link.href}
                  onClick={() => setMenuOpen(false)}
                  style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16, fontWeight: 500, color: '#161616', textDecoration: 'none', padding: '24px 16px', borderBottom: '1px solid rgba(139,92,246,0.08)', display: 'block' }}
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
