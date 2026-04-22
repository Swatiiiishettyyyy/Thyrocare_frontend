import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Navbar, Footer, HeroSection } from '../components'
import { WhyChooseUs } from '../components/WhyChooseUs'
import { HowItWorks } from '../components/HowItWorks'
import { TestCard } from '../components/TestCard'
import { filterByCategory, toTestCard } from '../api/products'
import { useProductCatalog } from '../hooks/useProductCatalog'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/packages' },
  { label: 'Reports', href: '/reports' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '/orders' },
]

const CATEGORIES: { label: string; category: string }[] = [
  { label: 'Popular Package',  category: 'Popular Packages' },
  { label: 'Organ Health',     category: 'Organ Health'     },
  { label: "Men's Health",     category: "Men's Health"     },
  { label: "Women's Health",   category: "Women's Health"   },
]

const LOAD_STEP = 6

export default function PackagesPage({ cartCount }: { cartCount?: number } = {}) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { products, ready } = useProductCatalog()

  const qParam = searchParams.get('q')?.trim() ?? ''
  const [activeCategory, setActiveCategory] = useState<string>('Popular Packages')
  const [query, setQuery] = useState(qParam)
  const [visibleCount, setVisibleCount] = useState(6)

  // When URL ?q= changes (e.g. Navbar search navigates here), sync state.
  useEffect(() => {
    const q = searchParams.get('q')?.trim() ?? ''
    setQuery(q)
    if (q) setVisibleCount(LOAD_STEP)
  }, [searchParams])

  useEffect(() => {
    setVisibleCount(6)
  }, [activeCategory, query])

  const allCards = useMemo(
    () => (query
      ? products
          .filter(p => p.name.toLowerCase().includes(query.toLowerCase()) ||
            (p.category ?? '').toLowerCase().includes(query.toLowerCase()))
          .map(toTestCard)
      : filterByCategory(products, activeCategory).map(toTestCard)
    ),
    [products, activeCategory, query],
  )

  const visible = allCards.slice(0, visibleCount)
  const hasMore = visibleCount < allCards.length

  return (
    <div className="packages-page-root" style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Poppins', sans-serif" }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" cartCount={cartCount} onCtaClick={() => navigate('/cart')} />

      <HeroSection />

      <div className="page-section">
        <div className="page-inner">

        {/* Category filter pills — hidden during search */}
        {!query && (
          <div className="packages-filter-pills">
            {CATEGORIES.map(({ label, category }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (category === 'Organ Health') {
                    navigate('/vitals/liver')
                    return
                  }
                  if (category === "Men's Health") {
                    navigate('/men-health/under-25')
                    return
                  }
                  if (category === "Women's Health") {
                    navigate('/women-health/under-25')
                    return
                  }
                  setActiveCategory(category)
                }}
                className={`condition-pill-btn${activeCategory === category ? ' condition-pill-btn--active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {query && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <p style={{ fontSize: 14, color: '#828282', margin: 0, fontFamily: 'Poppins,sans-serif' }}>
              Showing results for <strong style={{ color: '#101129' }}>"{query}"</strong>
            </p>
            <button
              type="button"
              onClick={() => { setQuery(''); setSearchParams({}) }}
              style={{
                height: 36, padding: '0 14px', borderRadius: 999,
                border: '1px solid #E7E1FF', background: 'transparent',
                color: '#828282', fontFamily: 'Inter, sans-serif', fontSize: 13,
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              Clear
            </button>
          </div>
        )}

        {/* Package cards grid */}
        {!ready ? (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="test-card-skeleton" aria-hidden style={{ flex: '1 1 280px', minWidth: 260, height: 260 }} />
            ))}
          </div>
        ) : allCards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#828282', fontFamily: 'Poppins,sans-serif' }}>
            {query ? `No results for "${query}". Try a different search.` : 'No products available in this category.'}
          </div>
        ) : (
          <>
            <div className="grid-3">
              {visible.map((pkg, i) => (
                <TestCard key={`${activeCategory}-${pkg.thyrocareProductId ?? pkg.name}-${i}`} {...pkg} />
              ))}
            </div>
            {hasMore && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
                <button
                  type="button"
                  onClick={() => setVisibleCount(v => Math.min(allCards.length, v + LOAD_STEP))}
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
          </>
        )}

        </div>
      </div>

      <WhyChooseUs />
      <HowItWorks />
      <Footer />
    </div>
  )
}
