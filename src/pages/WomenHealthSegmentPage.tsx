import { useMemo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Navbar, Footer, TestCard } from '../components'
import { useProductCatalog } from '../hooks/useProductCatalog'
import {
  filterComprehensive, toTestCard, parseProductCategories,
  type ComprehensiveAgeBand,
} from '../api/products'

const NAV_LINKS = [
  { label: 'Tests',    href: '/' },
  { label: 'Packages', href: '/packages' },
  { label: 'Reports',  href: '/reports' },
  { label: 'Metrics',  href: '/metrics' },
  { label: 'Orders',   href: '/orders' },
]

const AGE_SEGMENTS: { slug: string; age: ComprehensiveAgeBand; label: string }[] = [
  { slug: 'under-25', age: 'under25', label: 'Under 25' },
  { slug: '25-50',    age: '25_50',   label: '25–50'    },
  { slug: '50-plus',  age: '50plus',  label: '50+'      },
]

const GENDER_OPTIONS = [
  { value: 'women', label: 'Female' },
  { value: 'men',   label: 'Male'   },
]

export function womenHealthPath(age: ComprehensiveAgeBand): string {
  const row = AGE_SEGMENTS.find(s => s.age === age)
  return row ? `/women-health/${row.slug}` : '/women-health/under-25'
}

function segmentFromSlug(raw: string | undefined) {
  if (!raw) return null
  return AGE_SEGMENTS.find(s => s.slug === raw) ?? null
}

const DROPDOWN: React.CSSProperties = {
  height: 44, padding: '0 36px 0 16px',
  background: '#fff', borderRadius: 319,
  border: '1px solid #E7E1FF',
  boxShadow: '0px 4px 156px rgba(136,107,249,0.23)',
  fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#161616',
  cursor: 'pointer',
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23161616' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
}

const DROPDOWN_BTN: React.CSSProperties = {
  ...DROPDOWN,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  outline: 'none',
}

const OVERLAY: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'transparent',
  zIndex: 200,
}

export default function WomenHealthSegmentPage({ cartCount }: { cartCount?: number }) {
  const { segment: segmentParam } = useParams<{ segment: string }>()
  const navigate = useNavigate()
  const { products, ready, error } = useProductCatalog()
  const [visibleCount, setVisibleCount] = useState(6)
  const [showGenderModal, setShowGenderModal] = useState(false)
  const [showAgeModal, setShowAgeModal] = useState(false)
  const LOAD_STEP = 6
  const genderBtnRef = useRef<HTMLButtonElement | null>(null)
  const ageBtnRef = useRef<HTMLButtonElement | null>(null)
  const [genderPopover, setGenderPopover] = useState<{ top: number; left: number; width: number } | null>(null)
  const [agePopover, setAgePopover] = useState<{ top: number; left: number; width: number } | null>(null)

  const active = segmentFromSlug(segmentParam)

  function openAnchored(el: HTMLButtonElement | null, set: (v: { top: number; left: number; width: number }) => void) {
    if (!el) return
    const r = el.getBoundingClientRect()
    const width = Math.max(210, Math.round(r.width))
    set({
      top: Math.round(r.bottom + 8),
      left: Math.round(r.left),
      width,
    })
  }

  function openGenderPopover() {
    openAnchored(genderBtnRef.current, setGenderPopover)
    setShowGenderModal(true)
  }

  function openAgePopover() {
    openAnchored(ageBtnRef.current, setAgePopover)
    setShowAgeModal(true)
  }

  useLayoutEffect(() => {
    if (!showGenderModal) return
    openAnchored(genderBtnRef.current, setGenderPopover)
  }, [showGenderModal])

  useLayoutEffect(() => {
    if (!showAgeModal) return
    openAnchored(ageBtnRef.current, setAgePopover)
  }, [showAgeModal])

  useEffect(() => {
    if (!showGenderModal && !showAgeModal) return
    function onReflow() {
      if (showGenderModal) openAnchored(genderBtnRef.current, setGenderPopover)
      if (showAgeModal) openAnchored(ageBtnRef.current, setAgePopover)
    }
    window.addEventListener('scroll', onReflow, true)
    window.addEventListener('resize', onReflow)
    return () => {
      window.removeEventListener('scroll', onReflow, true)
      window.removeEventListener('resize', onReflow)
    }
  }, [showGenderModal, showAgeModal])

  useEffect(() => {
    if (!active) navigate('/women-health/under-25', { replace: true })
  }, [active, navigate])

  useEffect(() => {
    setVisibleCount(6)
  }, [active?.slug])

  const cards = useMemo(
    () => active ? filterComprehensive(products, 'women', active.age).map(toTestCard) : [],
    [products, active],
  )
  const visible = useMemo(() => cards.slice(0, visibleCount), [cards, visibleCount])
  const hasMore = visibleCount < cards.length

  // Debug: log what categories exist for women products
  useMemo(() => {
    if (ready && products.length > 0) {
      const womenCats = [...new Set(
        products
          .filter(p => parseProductCategories(p).some(c => /women|woman/i.test(c)))
          .map(p => parseProductCategories(p).find(c => /women|woman/i.test(c)) ?? null)
      )]
      console.log('[WomenHealth] women categories:', womenCats)
    }
  }, [ready, products])

  if (!active) return null

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins, sans-serif', overflowX: 'hidden' }}>
      <Navbar
        logoSrc="/favicon.svg" logoAlt="Nucleotide"
        links={NAV_LINKS} ctaLabel="My Cart"
        onCtaClick={() => navigate('/cart')}
        cartCount={cartCount}
      />

      <main className="page-section women-health-main">
      <div className="page-inner" style={{ boxSizing: 'border-box' }}>

        {/* Breadcrumb + dropdowns */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0 28px', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#828282' }}>
            <Link to="/" style={{ color: '#828282', textDecoration: 'none' }}>Tests</Link>
            <svg width="8" height="12" viewBox="0 0 8 12" fill="none"><path d="M1 1l6 5-6 5" stroke="#828282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ color: '#101129' }}>Women ({active.label})</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              ref={genderBtnRef}
              className="women-health-dropdown"
              style={{ ...DROPDOWN_BTN, minWidth: 210 }}
              onClick={openGenderPopover}
              aria-haspopup="dialog"
              aria-expanded={showGenderModal}
            >
              <span>Gender</span>
              <span aria-hidden style={{ width: 12 }} />
            </button>
            <button
              type="button"
              ref={ageBtnRef}
              className="women-health-dropdown"
              style={{ ...DROPDOWN_BTN, minWidth: 210 }}
              onClick={openAgePopover}
              aria-haspopup="dialog"
              aria-expanded={showAgeModal}
            >
              <span>Age Group</span>
              <span aria-hidden style={{ width: 12 }} />
            </button>
          </div>
        </div>

        {error && <p style={{ color: '#E12D2D', fontSize: 14, marginBottom: 16 }}>{error}</p>}

        {/* Cards grid — same TestCard used everywhere */}
        <div className="grid-3">
          {!ready && !error && [0,1,2].map(i => (
            <div key={i} style={{ height: 320, borderRadius: 20, background: '#F3F4F6' }} />
          ))}
          {ready && visible.map((t, i) => (
            <TestCard key={`${t.thyrocareProductId ?? t.name}-${active.slug}-${i}`} {...t} />
          ))}
          {ready && cards.length === 0 && !error && (
            <p style={{ color: '#828282', fontSize: 14, gridColumn: '1 / -1', fontFamily: 'Inter, sans-serif' }}>
              No packages found for this segment. Check console for available categories.
            </p>
          )}
        </div>
        {ready && !error && hasMore && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
            <button
              type="button"
              onClick={() => setVisibleCount(v => Math.min(cards.length, v + LOAD_STEP))}
              style={{
                padding: '12px 22px',
                borderRadius: 999,
                border: '1px solid #E7E1FF',
                background: '#F9F9F9',
                color: '#101129',
                fontFamily: 'Poppins, sans-serif',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Load more
            </button>
          </div>
        )}

      </div>
      </main>

      {/* Gender Modal (Figma node 281:2597) */}
      {showGenderModal && (
        <div style={OVERLAY} onClick={() => setShowGenderModal(false)}>
          <div
            role="dialog"
            aria-label="Gender"
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: '9px 11px 19px',
              width: genderPopover?.width ?? 210,
              maxWidth: 'calc(100vw - 16px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 21,
              boxSizing: 'border-box',
              position: 'fixed',
              top: genderPopover?.top ?? 120,
              left: genderPopover?.left ?? 16,
              boxShadow: '0px 20px 50px rgba(0,0,0,0.12)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                background: '#E7E1FF',
                border: '1px solid #E7E1FF',
                borderRadius: 10,
                height: 67,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 27,
                  top: 26,
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: 20,
                  fontWeight: 500,
                  lineHeight: '26px',
                  color: '#101129',
                }}
              >
                Gender
              </span>
            </div>

            <div style={{ paddingInline: 25, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <button
                type="button"
                onClick={() => setShowGenderModal(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: 20,
                  fontWeight: 500,
                  lineHeight: '26px',
                  color: '#101129',
                }}
              >
                Female
              </button>
              <div style={{ height: 1, width: '100%', background: '#8B5CF6' }} />
              <button
                type="button"
                onClick={() => navigate(`/men-health/${active.slug}`)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: 20,
                  fontWeight: 500,
                  lineHeight: '26px',
                  color: '#828282',
                }}
              >
                Male
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Age Group Modal (Figma node 281:2607) */}
      {showAgeModal && (
        <div style={OVERLAY} onClick={() => setShowAgeModal(false)}>
          <div
            role="dialog"
            aria-label="Age Group"
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: '9px 11px 19px',
              width: agePopover?.width ?? 210,
              maxWidth: 'calc(100vw - 16px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 21,
              boxSizing: 'border-box',
              position: 'fixed',
              top: agePopover?.top ?? 120,
              left: agePopover?.left ?? 16,
              boxShadow: '0px 20px 50px rgba(0,0,0,0.12)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                background: '#E7E1FF',
                border: '1px solid #E7E1FF',
                borderRadius: 10,
                height: 67,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 27,
                  top: 26,
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: 20,
                  fontWeight: 500,
                  lineHeight: '26px',
                  color: '#101129',
                }}
              >
                Age Group
              </span>
            </div>

            <div style={{ paddingInline: 25, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {AGE_SEGMENTS.map(s => {
                const isActive = s.slug === active.slug
                return (
                  <div key={s.slug} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <button
                      type="button"
                      onClick={() => { setShowAgeModal(false); navigate(`/women-health/${s.slug}`) }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: 20,
                        fontWeight: 500,
                        lineHeight: '26px',
                        color: isActive ? '#101129' : '#828282',
                      }}
                    >
                      {s.label}
                    </button>
                    {isActive && <div style={{ height: 1, width: '100%', background: '#8B5CF6' }} />}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
