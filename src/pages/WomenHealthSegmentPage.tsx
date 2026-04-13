import { useMemo, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Navbar, Footer } from '../components'
import { TestCard } from '../components/TestCard'
import { useProductCatalog } from '../hooks/useProductCatalog'
import {
  filterComprehensive, toTestCard,
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

export default function WomenHealthSegmentPage({ cartCount }: { cartCount?: number }) {
  const { segment: segmentParam } = useParams<{ segment: string }>()
  const navigate = useNavigate()
  const { products, ready, error } = useProductCatalog()
  const [visibleCount, setVisibleCount] = useState(6)
  const LOAD_STEP = 6

  const active = segmentFromSlug(segmentParam)

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
          .filter(p => /women|woman/i.test(p.category ?? ''))
          .map(p => p.category)
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

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px, 3vw, 40px) 60px', boxSizing: 'border-box' }}>

        {/* Breadcrumb + dropdowns */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0 28px', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#828282' }}>
            <Link to="/" style={{ color: '#828282', textDecoration: 'none' }}>Tests</Link>
            <svg width="8" height="12" viewBox="0 0 8 12" fill="none"><path d="M1 1l6 5-6 5" stroke="#828282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ color: '#101129' }}>Women ({active.label})</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <select style={DROPDOWN} value="women" onChange={e => e.target.value === 'men' && navigate('/men-health/under-25')}>
              {GENDER_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
            <select style={DROPDOWN} value={active.slug} onChange={e => navigate(`/women-health/${e.target.value}`)}>
              {AGE_SEGMENTS.map(s => <option key={s.slug} value={s.slug}>{s.label}</option>)}
            </select>
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

      <Footer />
    </div>
  )
}
