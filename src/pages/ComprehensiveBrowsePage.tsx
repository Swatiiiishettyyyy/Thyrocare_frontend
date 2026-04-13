import { useMemo, useCallback, useEffect } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Navbar, Footer } from '../components'
import { TestCard } from '../components/TestCard'
import { useProductCatalog } from '../hooks/useProductCatalog'
import { filterComprehensive, toTestCard, type ComprehensiveAgeBand } from '../api/products'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/packages' },
  { label: 'Reports', href: '/reports' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '/orders' },
]

const AGE_OPTIONS: { id: ComprehensiveAgeBand; label: string }[] = [
  { id: 'under25', label: 'Under 25' },
  { id: '25_50', label: '25–50' },
  { id: '50plus', label: '50+' },
]

function parseAge(raw: string | null): ComprehensiveAgeBand {
  if (raw === 'under25' || raw === '25_50' || raw === '50plus') return raw
  return 'under25'
}

export default function ComprehensiveBrowsePage({ cartCount }: { cartCount?: number }) {
  const { gender: genderParam } = useParams<{ gender: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { products, ready, error } = useProductCatalog()

  const gender = genderParam === 'men' ? 'men' : 'women'
  const age = parseAge(searchParams.get('age'))

  // Redirect to new segment pages
  useEffect(() => {
    const ageSlug = age === 'under25' ? 'under-25' : age === '25_50' ? '25-50' : '50-plus'
    if (gender === 'men') {
      navigate(`/men-health/${ageSlug}`, { replace: true })
    } else {
      navigate(`/women-health/${ageSlug}`, { replace: true })
    }
  }, [gender, age, navigate])

  const cards = useMemo(
    () => filterComprehensive(products, gender, age).map(toTestCard),
    [products, gender, age],
  )

  const setAge = useCallback(
    (next: ComprehensiveAgeBand) => {
      setSearchParams({ age: next }, { replace: true })
    },
    [setSearchParams],
  )

  const heading = gender === 'women' ? 'Women' : 'Men'

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins, sans-serif' }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} cartCount={cartCount} />

      <main className="page-section">
        <div className="page-inner" style={{ maxWidth: 1200 }}>
          <div style={{ marginBottom: 24 }}>
            <Link
              to="/#comprehensive"
              style={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, fontWeight: 500, color: '#8B5CF6', textDecoration: 'none' }}
            >
              ← Back to home
            </Link>
          </div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 32, fontWeight: 600, color: '#101129', margin: '0 0 8px' }}>
            Comprehensive health — {heading}
          </h1>
          <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: 15, color: '#828282', margin: '0 0 24px' }}>
            Filter by age band. All matching packages from the catalog are shown below.
          </p>

          <div className="condition-pills" style={{ marginBottom: 28, justifyContent: 'flex-start' }}>
            {AGE_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAge(opt.id)}
                className={`condition-pill-btn${age === opt.id ? ' condition-pill-btn--active' : ''}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {error && (
            <p style={{ color: '#E12D2D', fontFamily: 'Inter, sans-serif', fontSize: 14, marginBottom: 16 }}>{error}</p>
          )}

          <div className="grid-3">
            {!ready && !error && (
              <>
                <div className="test-card-skeleton" aria-hidden />
                <div className="test-card-skeleton" aria-hidden />
                <div className="test-card-skeleton" aria-hidden />
              </>
            )}
            {ready && cards.map((t, i) => (
              <TestCard key={`${t.thyrocareProductId ?? t.name}-${i}`} {...t} />
            ))}
            {ready && cards.length === 0 && !error && (
              <p style={{ color: '#828282', fontFamily: 'Inter, sans-serif', fontSize: 14, gridColumn: '1 / -1' }}>
                No packages match this age band in the catalog. Try another filter or check back later.
              </p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
