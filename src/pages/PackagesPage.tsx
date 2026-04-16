import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar, Footer, HeroSection } from '../components'
import { WhyChooseUs } from '../components/WhyChooseUs'
import { HowItWorks } from '../components/HowItWorks'
import { TestCard } from '../components/TestCard'
import type { TestCardProps } from '../types'
import { fetchProducts, toTestCard, filterByCategory } from '../api/products'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/packages' },
  { label: 'Reports', href: '/reports' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '/orders' },
]

// Map display label → API category value
const CATEGORIES: { label: string; category: string }[] = [
  { label: 'Popular Package',  category: 'Popular Packages' },
  { label: 'Organ Health',     category: 'Organ Health'     },
  { label: "Men's Health",     category: "Men's Health"     },
  { label: "Women's Health",   category: "Women's Health"   },
  { label: 'Essential Tests',  category: 'Essential Tests'  },
]

export default function PackagesPage({ cartCount }: { cartCount?: number } = {}) {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState<string>('Popular Packages')
  const [loading, setLoading] = useState(true)
  const [rawProducts, setRawProducts] = useState<import('../api/products').ThyrocareProduct[]>([])
  const [visibleCount, setVisibleCount] = useState(6)

  const LOAD_STEP = 6

  useEffect(() => {
    fetchProducts()
      .then(products => {
        setRawProducts(products)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setVisibleCount(6)
  }, [activeCategory])

  const filtered = useMemo(
    () => filterByCategory(rawProducts, activeCategory).map(toTestCard),
    [rawProducts, activeCategory],
  )
  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  return (
    <div className="packages-page-root" style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Poppins', sans-serif" }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" cartCount={cartCount} onCtaClick={() => navigate('/cart')} />

      <HeroSection />

      <div className="page-section">
        <div className="page-inner">

        {/* Category filter pills */}
        <div className="packages-filter-pills">
          {CATEGORIES.map(({ label, category }) => (
            <button
              key={label}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`condition-pill-btn${activeCategory === category ? ' condition-pill-btn--active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Package cards grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#828282', fontFamily: 'Poppins,sans-serif' }}>Loading products...</div>
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
                  onClick={() => setVisibleCount(v => Math.min(filtered.length, v + LOAD_STEP))}
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
