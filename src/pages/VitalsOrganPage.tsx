import { useMemo, useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Navbar, Footer } from '../components'
import { TestCard } from '../components/TestCard'
import { useProductCatalog } from '../hooks/useProductCatalog'
import { filterByOrganId, toTestCard } from '../api/products'

const NAV_LINKS = [
  { label: 'Tests',    href: '/' },
  { label: 'Packages', href: '/packages' },
  { label: 'Reports',  href: '/reports' },
  { label: 'Metrics',  href: '/metrics' },
  { label: 'Orders',   href: '/orders' },
]

const ORGANS = [
  { id: 'heart',    label: 'Heart'    },
  { id: 'liver',    label: 'Liver'    },
  { id: 'bone',     label: 'Bone'     },
  { id: 'kidney',   label: 'Kidney'   },
  { id: 'gut',      label: 'Gut'      },
  { id: 'hormones', label: 'Hormones' },
  { id: 'vitamins', label: 'Vitamins' },
]

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

export default function VitalsOrganPage({ cartCount }: { cartCount?: number }) {
  const { organId } = useParams<{ organId: string }>()
  const navigate = useNavigate()
  const { products, ready, error } = useProductCatalog()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const activeOrgan = ORGANS.find(o => o.id === organId) ?? ORGANS[0]

  const cards = useMemo(() => {
    return filterByOrganId(products, activeOrgan.id).map(toTestCard)
  }, [products, activeOrgan.id])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins, sans-serif', overflowX: 'hidden' }}>
      <Navbar
        logoSrc="/favicon.svg" logoAlt="Nucleotide"
        links={NAV_LINKS} ctaLabel="My Cart"
        onCtaClick={() => navigate('/cart')}
        cartCount={cartCount}
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px, 3vw, 40px) 60px', boxSizing: 'border-box' }}>

        {/* Breadcrumb + organ dropdown */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0 28px', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#828282' }}>
            <Link to="/" style={{ color: '#828282', textDecoration: 'none' }}>Tests</Link>
            <svg width="8" height="12" viewBox="0 0 8 12" fill="none"><path d="M1 1l6 5-6 5" stroke="#828282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ color: '#101129' }}>{activeOrgan.label}</span>
          </div>

          {/* Desktop: native select */}
          <select
            className="vitals-organ-select"
            style={DROPDOWN}
            value={activeOrgan.id}
            onChange={e => navigate(`/vitals/${e.target.value}`)}
          >
            {ORGANS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>

          {/* Mobile: custom dropdown */}
          <div ref={dropdownRef} className="vitals-organ-select-mobile" style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setDropdownOpen(o => !o)}
              style={{
                height: 40, padding: '0 36px 0 16px',
                background: '#fff', borderRadius: 999,
                border: '1px solid #E7E1FF',
                boxShadow: '0px 2px 12px rgba(136,107,249,0.15)',
                fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#161616',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                position: 'relative', whiteSpace: 'nowrap',
              }}
            >
              {activeOrgan.label}
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{ position: 'absolute', right: 12, top: '50%', transform: `translateY(-50%) rotate(${dropdownOpen ? 180 : 0}deg)`, transition: 'transform 0.2s' }}>
                <path d="M1 1l5 5 5-5" stroke="#161616" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                background: '#fff', border: '1px solid #E7E1FF',
                borderRadius: 16, boxShadow: '0 8px 24px rgba(16,17,41,0.12)',
                zIndex: 50, overflow: 'hidden', minWidth: 140,
              }}>
                {ORGANS.map(o => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => { navigate(`/vitals/${o.id}`); setDropdownOpen(false) }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '11px 16px', fontSize: 14,
                      fontFamily: 'Inter, sans-serif',
                      background: o.id === activeOrgan.id ? '#F3F0FF' : '#fff',
                      color: o.id === activeOrgan.id ? '#101129' : '#374151',
                      fontWeight: o.id === activeOrgan.id ? 600 : 400,
                      border: 'none', cursor: 'pointer',
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && <p style={{ color: '#E12D2D', fontSize: 14, marginBottom: 16 }}>{error}</p>}

        {/* Cards grid — same TestCard used everywhere */}
        <div className="grid-3">
          {!ready && !error && [0,1,2].map(i => (
            <div key={i} style={{ height: 320, borderRadius: 20, background: '#F3F4F6' }} />
          ))}
          {ready && cards.map((t, i) => (
            <TestCard key={`${t.thyrocareProductId ?? t.name}-${i}`} {...t} />
          ))}
          {ready && cards.length === 0 && !error && (
            <p style={{ color: '#828282', fontSize: 14, gridColumn: '1 / -1', fontFamily: 'Inter, sans-serif' }}>
              No tests found for {activeOrgan.label}.
            </p>
          )}
        </div>

      </div>

      <Footer />
    </div>
  )
}
