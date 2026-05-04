import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { Navbar, Footer } from '../components'
import type { TestCardProps } from '../types'
import { useProductCatalog } from '../hooks/useProductCatalog'
import { fetchProductById, toTestCard, type ThyrocareProduct } from '../api/products'

import parametersIcon from '../assets/figma/Test-detail/Frame-3.svg'
import nablIcon from '../assets/figma/Test-detail/Vector-1.svg'
import cartIcon from '../assets/figma/Test-detail/cart.svg'
import fileIcon from '../assets/figma/file.svg'
import fastingReqIcon from '../assets/figma/Test-detail/Vector-5.svg'
import homeCollectionIcon from '../assets/figma/Test-detail/Vector-6.svg'
import postpaidIcon from '../assets/figma/Test-detail/Vector-4.svg'
import rupeeIcon from '../assets/figma/Test-detail/Vector-3.svg'
import bestTimeIcon from '../assets/figma/Best_time_sample.svg'
import doIcon from '../assets/figma/Do.svg'
import dontIcon from '../assets/figma/Dont.svg'
import aboutIconChecks from '../assets/figma/Test-detail/Frame.svg'
import aboutIconWho from '../assets/figma/Test-detail/Vector-7.svg'
import aboutIconWhy from '../assets/figma/Test-detail/Frame-1.svg'
import aboutBulletCheck from '../assets/figma/Test-detail/Vector.svg'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/packages' },
  { label: 'Reports', href: '/reports' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '/orders' },
]

const TABS = ['About', 'Parameters', 'Preparation'] as const
const DEFAULT_OFFER_LABEL = '40% OFF'

function findProduct(products: ThyrocareProduct[], idParam: string | undefined): ThyrocareProduct | undefined {
  if (!idParam || products.length === 0) return undefined
  if (/^\d+$/.test(idParam)) {
    const n = Number(idParam)
    return products.find(p => p.id === n)
  }
  try {
    const name = decodeURIComponent(idParam)
    return products.find(p => p.name === name)
  } catch {
    return undefined
  }
}

/** Prefer first non-empty `about` so detail `null` does not wipe list copy from the catalog. */
function pickAboutText(...candidates: (string | null | undefined)[]): string {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim()
  }
  return ''
}

function groupParameters(list: { id: number; name: string; group_name?: string | null }[]) {
  const map = new Map<string, { id: number; name: string; group_name?: string | null }[]>()
  for (const p of list) {
    const g = (p.group_name || '').trim() || 'Parameters'
    if (!map.has(g)) map.set(g, [])
    map.get(g)!.push(p)
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
}

export default function TestDetailPage({ cartCount, onAddToCart }: { cartCount?: number; onAddToCart?: (test: TestCardProps) => boolean }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const stateTest = (location.state as { test?: TestCardProps } | null)?.test

  // Ensure the details page always opens from the top on navigation / id change.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [id])

  const { products, ready: catalogReady } = useProductCatalog()

  const catalogProduct = useMemo(() => findProduct(products, id), [products, id])

  /** Always load `GET /thyrocare/products/:id` when we know the numeric id (route, catalog, or nav state). */
  const thyrocareDetailId = useMemo((): number | null => {
    if (id && /^\d+$/.test(id)) return Number(id)
    if (catalogProduct?.id != null) return catalogProduct.id
    const sid = stateTest?.thyrocareProductId
    if (typeof sid === 'number' && Number.isFinite(sid)) return sid
    return null
  }, [id, catalogProduct, stateTest])

  const [detailFromApi, setDetailFromApi] = useState<ThyrocareProduct | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const lastFetchedDetailIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (thyrocareDetailId == null) {
      lastFetchedDetailIdRef.current = null
      setDetailFromApi(null)
      setDetailError(null)
      setDetailLoading(false)
      return
    }
    const idChanged = lastFetchedDetailIdRef.current !== thyrocareDetailId
    if (idChanged) {
      lastFetchedDetailIdRef.current = thyrocareDetailId
      setDetailFromApi(null)
      setDetailError(null)
    }
    let cancelled = false
    setDetailLoading(true)
    fetchProductById(thyrocareDetailId)
      .then(p => {
        if (!cancelled) setDetailFromApi(p)
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setDetailError(e.message || 'Failed to load product')
          setDetailFromApi(null)
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [thyrocareDetailId])

  /** Prefer live Thyrocare API detail; fall back to cached catalog row or name match. */
  const product = detailFromApi ?? catalogProduct

  const card = useMemo((): TestCardProps | null => {
    if (product) return toTestCard(product)
    if (stateTest) return stateTest
    return null
  }, [product, stateTest])

  /** Prefer full parameter list from detail API; catalog rows often omit `parameters`. */
  const parameters = useMemo(() => {
    const fromDetail = detailFromApi?.parameters
    if (Array.isArray(fromDetail) && fromDetail.length > 0) return fromDetail
    const fromCatalog = catalogProduct?.parameters
    if (Array.isArray(fromCatalog) && fromCatalog.length > 0) return fromCatalog
    return product?.parameters ?? []
  }, [detailFromApi, catalogProduct, product])
  /** Long `about` from detail row, then catalog row (detail-only `null` must not hide list text). */
  const aboutLong = pickAboutText(detailFromApi?.about, catalogProduct?.about)
  const shortDesc = pickAboutText(detailFromApi?.about, catalogProduct?.about)

  // UI requirement: show `no_of_tests_included` in the "Parameters" stat tile (even if the detail API
  // also provides a `parameters[]` list). Fall back only when API value is missing/invalid.
  const paramCount = product
    ? (Number.isFinite(Number(product.no_of_tests_included)) && Number(product.no_of_tests_included) > 0
      ? Number(product.no_of_tests_included)
      : (parameters.length > 0 ? parameters.length : 0))
    : (card?.tests ?? 0)

  const paramCountDisplay = Math.max(1, paramCount)

  const maxPatients = product?.beneficiaries_max ?? card?.maxBeneficiaries ?? 10
  const minPatients = product?.beneficiaries_min ?? 1

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('About')
  const tabsCardRef = useRef<HTMLDivElement>(null)
  const [qty, setQty] = useState(1)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    setQty(q => Math.min(Math.max(minPatients, q), maxPatients))
  }, [minPatients, maxPatients])

  const waitingForAnything =
    !card && !stateTest && (
      (thyrocareDetailId != null && detailLoading && !catalogProduct)
      || (id && !/^\d+$/.test(id) && !catalogReady)
    )

  if (!card && !waitingForAnything && catalogReady && !detailLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins, sans-serif', padding: 40 }}>
        <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" cartCount={cartCount} onCtaClick={() => navigate('/cart')} />
        <p style={{ maxWidth: 600, margin: '40px auto', color: '#828282' }}>
          {detailError ?? 'Product not found.'}
        </p>
      </div>
    )
  }

  if (!card) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins, sans-serif' }}>
        <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" cartCount={cartCount} onCtaClick={() => navigate('/cart')} />
        <div className="test-detail-wrapper" style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
          <div className="grid-3" style={{ marginTop: 24 }}>
            <div className="test-card-skeleton" aria-hidden style={{ minHeight: 280 }} />
            <div className="test-card-skeleton" aria-hidden style={{ minHeight: 280 }} />
            <div className="test-card-skeleton" aria-hidden style={{ minHeight: 280 }} />
          </div>
        </div>
      </div>
    )
  }

  const {
    name, description, price, originalPrice, offerPercent,
    fasting, type, maxBeneficiaries, thyrocareProductId,
  } = card

  function submitAddToCart() {
    if (!onAddToCart) return
    if (!card) return
    const ok = onAddToCart({
      ...card,
      name: card.name || 'Test',
      price: card.price || '0',
      originalPrice: card.originalPrice || card.price || '0',
      maxBeneficiaries: product?.beneficiaries_max ?? maxBeneficiaries,
      thyrocareProductId: product?.id ?? thyrocareProductId,
      quantity: qty,
    })
    if (ok) navigate('/cart')
  }

  /** Only block About text while detail is loading if we still have no `about` (catalog row may omit it). */
  const aboutLoading =
    detailLoading
    && thyrocareDetailId != null
    && !aboutLong
  const aboutTabBody =
    aboutLong
    || shortDesc
    || description
    || 'No description available for this test.'

  const heroSubtitle = shortDesc || description || 'A quick overview of your overall health and immunity.'

  function normalizeAboutField(v: string | string[] | null | undefined): string[] {
    if (v == null) return []
    if (Array.isArray(v)) {
      return v.map(x => String(x ?? '').trim()).filter(Boolean)
    }
    const s = String(v).trim()
    if (!s) return []
    // Split common bullet/newline formats safely.
    return s
      .split(/\r?\n|•|·|^\s*-\s+/m)
      .map(x => x.trim())
      .filter(Boolean)
      .slice(0, 8)
  }

  const dynamicAboutSections = useMemo(() => {
    const p = product
    const apiChecks = normalizeAboutField(p?.what_this_test_checks ?? null)
    const apiWho = normalizeAboutField(p?.who_should_take_this_test ?? null)
    const apiWhy = normalizeAboutField(p?.why_doctors_recommend ?? null)

    const paramNames = (p?.parameters ?? []).map(x => String(x?.name ?? '').trim()).filter(Boolean)
    const uniqueParams: string[] = []
    const seen = new Set<string>()
    for (const n of paramNames) {
      const k = n.toLowerCase()
      if (seen.has(k)) continue
      seen.add(k)
      uniqueParams.push(n)
      if (uniqueParams.length >= 6) break
    }

    const checksItems =
      apiChecks.length > 0
        ? apiChecks
        : uniqueParams.length > 0
        ? uniqueParams
        : [
            `Includes ${paramCountDisplay} ${type === 'Package' ? 'tests' : 'parameters'}`,
            p?.category ? `Category: ${p.category}` : null,
          ].filter((x): x is string => typeof x === 'string' && x.trim().length > 0)

    const minB = p?.beneficiaries_min
    const maxB = p?.beneficiaries_max
    const patientRange =
      typeof minB === 'number' && typeof maxB === 'number' && Number.isFinite(minB) && Number.isFinite(maxB)
        ? `${minB}-${maxB}`
        : maxPatients
          ? `1-${maxPatients}`
          : null

    const whoItems = [
      patientRange ? `Suitable for ${patientRange} patient(s) in one booking` : null,
      p?.is_fasting_required == null ? null : (p.is_fasting_required ? 'Fasting is required before sample collection' : 'No fasting required'),
      p?.is_home_collectible == null ? null : (p.is_home_collectible ? 'Home sample collection available' : 'Home sample collection may not be available'),
    ].filter((x): x is string => typeof x === 'string' && x.trim().length > 0)

    const whyItems =
      apiWhy.length > 0
        ? apiWhy
        : [
            shortDesc ? shortDesc : null,
            p?.about ? (p.about.length > 160 ? `${p.about.slice(0, 160).trim()}…` : p.about.trim()) : null,
          ].filter((x): x is string => typeof x === 'string' && x.trim().length > 0)

    const whoFinal = apiWho.length > 0 ? apiWho : whoItems

    return [
      { title: 'What this test checks', icon: aboutIconChecks, items: checksItems },
      { title: 'Who should take this test', icon: aboutIconWho, items: whoFinal },
      { title: 'Why doctors recommend this', icon: aboutIconWhy, items: whyItems },
    ].filter(s => s.items.length > 0)
  }, [product, paramCount, type, maxPatients, shortDesc])

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins, sans-serif', overflowX: 'hidden' }}>
      <Navbar
        logoSrc="/favicon.svg"
        logoAlt="Nucleotide"
        links={NAV_LINKS}
        ctaLabel="My Cart"
        cartCount={cartCount}
        hideSearchOnMobile
        activeHrefOverride={type === 'Package' ? '/packages' : '/'}
        onCtaClick={() => navigate('/cart')}
      />

      {/* Breadcrumb */}
      <div
        className="cart-breadcrumb"
        style={{
          padding: '14px clamp(16px, 5vw, 56px)',
          borderBottom: '1px solid #F3F4F6',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{ fontSize: 14, color: '#6B7280', cursor: 'pointer' }}
          onClick={() => navigate(type === 'Package' ? '/packages' : '/')}
        >
          {type === 'Package' ? 'Packages' : 'Tests'}
        </span>
        <span style={{ fontSize: 14, color: '#6B7280' }}>›</span>
        <span style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>{name}</span>
      </div>

      <div
        className="test-detail-wrapper"
        style={{
          maxWidth: isMobile ? '100%' : 1320,
          margin: '0 auto',
          padding: isMobile ? '0 12px 20px' : '0 24px 72px',
          boxSizing: 'border-box',
        }}
      >

        {detailError && catalogProduct && (
          <p style={{
            background: '#FFF8E6', border: '1px solid #F5D78E', borderRadius: 10,
            padding: '12px 16px', fontSize: 14, color: '#92400E', marginBottom: 16,
          }}>
            Could not refresh from server ({detailError}). Showing catalog data.
          </p>
        )}

        <div
          className="test-detail-heroWrap"
          style={{
            position: 'relative',
            /* Reserve space for the absolute pricing card so the feature row lines up */
            paddingBottom: isMobile ? 0 : 'clamp(110px, 14vmin, 170px)',
          }}
        >
          <div className="test-detail-hero" style={{
            background: 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)',
            borderRadius: 20,
            padding: isMobile ? '22px 22px 18px' : 'clamp(24px, 2.8vmin, 36px)',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 16 : 28,
            alignItems: isMobile ? 'stretch' : 'flex-start',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: 0,
            alignSelf: isMobile ? 'flex-start' : undefined,
            width: isMobile ? '100%' : undefined,
            height: isMobile ? 'fit-content' : undefined,
          }}>
            <div className="test-detail-typeRibbon" style={{
              position: 'absolute', top: 0, right: 0,
              background: '#E7E1FF',
              /* Let the hero's rounded corner clip the outer edge */
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              /* Sharp top-left + bottom-right like Figma */
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 20,
              minHeight: 'clamp(46px, 5.2vmin, 59px)',
              minWidth: 'clamp(150px, 16vw, 223px)',
              padding: 'clamp(8px, 1.1vmin, 12px) clamp(12px, 1.6vmin, 20px)',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Poppins, sans-serif',
              fontSize: 'clamp(14px, 1.6vmin, 20px)',
              fontWeight: 500,
              color: '#101129',
              boxSizing: 'border-box',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}>{type === 'Single' ? 'Single Test' : type}</div>

            <div className="test-detail-info" style={{
              flex: isMobile ? '0 0 auto' : '1 1 400px', display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 20,
              /* Reserve space for the pricing card so tiles don't wrap */
              paddingRight: isMobile ? 0 : 'clamp(280px, 26vw, 420px)',
              /* More room above fasting + below meta tiles (Figma-like) */
              paddingTop: isMobile ? 0 : 'clamp(10px, 1.6vmin, 16px)',
              paddingBottom: isMobile ? 0 : 'clamp(12px, 2vmin, 20px)',
              width: isMobile ? '100%' : undefined,
            }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'clamp(8px, 1vmin, 10px)',
                background: 'linear-gradient(90deg, #101129 0%, #2A2C5B 81%)',
                borderRadius: 999,
                padding: 'clamp(4px, 0.8vmin, 6px) clamp(12px, 1.6vmin, 14px)',
                fontFamily: 'Inter, sans-serif',
                fontSize: 'clamp(13px, 1.5vmin, 18px)',
                alignSelf: 'flex-start',
                marginTop: isMobile ? 0 : 'clamp(10px, 1.8vmin, 18px)',
              }}>
                <img src={fastingReqIcon} alt="" width={18} height={18} style={{ display: 'block' }} />
                <span style={{
                  background: 'linear-gradient(180deg, #E7E1FF 0%, #FFFFFF 82%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  lineHeight: 1.6,
                  whiteSpace: 'nowrap',
                }}>
                  {fasting}
                </span>
              </span>
              <h1
              className="test-detail-mobileTitle"
              style={{
                margin: 0,
                color: '#fff',
                fontSize: isMobile ? 'clamp(18px, 4.8vw, 22px)' : 'clamp(22px, 2.6vw, 40px)',
                fontWeight: isMobile ? 700 : 500,
                lineHeight: 1.25,
                letterSpacing: isMobile ? '0.02em' : undefined,
              }}
              >
                {name}
              </h1>
              <p
              className="test-detail-mobileSubtitle"
              style={{
                margin: 0,
                color: isMobile ? '#A8A8B8' : '#828282',
                fontSize: isMobile ? 13 : 'clamp(14px, 1.25vw, 16px)',
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1.5,
                maxWidth: 560,
                opacity: isMobile ? 1 : 0.95,
                fontWeight: 400,
              }}
              >
                {heroSubtitle}
              </p>
            </div>

            <div className="test-detail-statsRow" style={{ display: 'flex', gap: 17, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
              <div style={{
                flex: '0 0 260px',
                borderRadius: 10,
                border: '1px solid #2A2C5B',
                padding: 'clamp(10px, 1.4vmin, 12px) clamp(12px, 1.7vmin, 16px)',
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(8px, 1.1vmin, 10px)',
                height: 83,
                boxSizing: 'border-box',
              }}>
                <img src={fileIcon} alt="" width={20} height={20} style={{ display: 'block' }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#828282', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>Report Time:</div>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>within 24 hours</div>
                </div>
              </div>

              <div style={{
                flex: '0 0 261px',
                borderRadius: 10,
                border: '1px solid #2A2C5B',
                padding: 'clamp(10px, 1.4vmin, 12px) clamp(12px, 1.7vmin, 16px)',
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(8px, 1.1vmin, 10px)',
                height: 83,
                boxSizing: 'border-box',
              }}>
                <img src={parametersIcon} alt="" width={20} height={20} style={{ display: 'block' }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#828282', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>Parameters</div>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>
                    {paramCountDisplay}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>

          <div className="test-detail-card" style={{
            position: isMobile ? 'static' : 'absolute',
            /* Push the whole card down so CTA sits outside the hero */
            top: isMobile ? undefined : 'clamp(102px, 11.2vmin, 160px)',
            /* Move slightly left inside the ribbon/hero */
            right: isMobile ? undefined : 'clamp(22px, 3.2vmin, 36px)',
            /* Smaller card, ribbon unchanged */
            width: isMobile ? '100%' : 'clamp(268px, 22.5vw, 340px)',
            borderRadius: 'clamp(14px, 1.6vmin, 16px)',
            background: 'linear-gradient(180deg, #E7E1FF 0%, #fff 100%)',
            padding: 'clamp(9px, 1.4vmin, 11px)',
            display: 'flex',
            flexDirection: 'column',
            /* Match screenshot spacing while still compact */
            gap: 'clamp(18px, 4.2vmin, 38px)',
            boxShadow: isMobile ? 'none' : '0 8px 40px rgba(139,92,246,0.18)',
            zIndex: 2,
            boxSizing: 'border-box',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2.2vmin, 21px)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.2vmin, 11px)', paddingLeft: 'clamp(2px, 0.5vmin, 6px)' }}>
                <div style={{
                  color: '#828282',
                  fontSize: 'clamp(14px, 1.55vmin, 16px)',
                  fontWeight: 500,
                  fontFamily: 'Poppins, sans-serif',
                  letterSpacing: '-0.02em',
                }}>
                  Price
                </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 1.6vmin, 12px)', flexWrap: 'nowrap' }}>
                  <span style={{
                    fontSize: 'clamp(26px, 3vw, 40px)',
                    fontWeight: 500,
                    color: '#101129',
                    lineHeight: 1.1,
                    fontFamily: 'Poppins, sans-serif',
                    letterSpacing: '-0.03em',
                  }}>
                    ₹{price}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.6vmin, 12px)', flexWrap: 'nowrap' }}>
                    <span style={{
                      fontSize: 'clamp(14px, 1.55vmin, 18px)',
                      color: '#828282',
                      textDecoration: 'line-through',
                      fontFamily: 'Poppins, sans-serif',
                      letterSpacing: '-0.02em',
                    }}>
                      ₹{originalPrice}
                    </span>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #41C9B3',
                        background: '#E6F6F3',
                        borderRadius: 'clamp(4px, 0.6vmin, 5px)',
                        padding: 'clamp(5px, 0.9vmin, 7px) clamp(8px, 1.1vmin, 12px)',
                        minHeight: 'clamp(26px, 3.3vmin, 32px)',
                        minWidth: 'clamp(86px, 10vmin, 120px)',
                        color: '#41C9B3',
                        fontSize: 'clamp(12px, 1.45vmin, 14px)',
                        fontWeight: 500,
                        fontFamily: 'Poppins, sans-serif',
                        letterSpacing: '-0.02em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {offerPercent?.trim() || DEFAULT_OFFER_LABEL}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{
                background: '#fff',
                borderRadius: 10,
                padding: 'clamp(8px, 1.2vmin, 12px) clamp(14px, 1.9vmin, 20px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: 'clamp(66px, 8.8vmin, 83px)', /* Figma ~83 */
                boxSizing: 'border-box',
              }}>
                <span style={{
                  color: '#828282',
                  fontSize: 'clamp(13px, 1.55vmin, 16px)',
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: 1.4,
                }}>
                  No of Patients
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(18px, 5vmin, 48px)' }}>
                  <button
                    type="button"
                    onClick={() => setQty(q => Math.max(minPatients, q - 1))}
                    disabled={qty <= minPatients}
                    aria-label="Decrease patients"
                    style={{
                      width: 'clamp(40px, 5.1vmin, 48px)',
                      height: 'clamp(40px, 5.1vmin, 48px)',
                      borderRadius: '999px',
                      background: qty <= minPatients ? '#E7E1FF' : 'linear-gradient(90deg, #101129 0%, #2A2C5B 81%)',
                      border: 'none',
                      color: qty <= minPatients ? '#828282' : '#fff',
                      fontSize: 'clamp(20px, 3.8vmin, 28px)',
                      cursor: qty <= minPatients ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                    }}
                  >
                    −
                  </button>

                  <span style={{
                    fontSize: 'clamp(16px, 2.1vmin, 20px)',
                    fontWeight: 400,
                    color: '#101129',
                    minWidth: 18,
                    textAlign: 'center',
                    fontFamily: 'Poppins, sans-serif',
                  }}>
                    {qty}
                  </span>

                  <button
                    type="button"
                    onClick={() => setQty(q => Math.min(maxPatients, q + 1))}
                    aria-label="Increase patients"
                    style={{
                      width: 'clamp(40px, 5.1vmin, 48px)',
                      height: 'clamp(40px, 5.1vmin, 48px)',
                      borderRadius: '999px',
                      background: 'linear-gradient(90deg, #101129 0%, #2A2C5B 81%)',
                      border: 'none',
                      color: '#fff',
                      fontSize: 'clamp(20px, 3.8vmin, 28px)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.6vmin, 13px)' }}>
              <button type="button" onClick={submitAddToCart} style={{
                minHeight: isMobile ? 52 : 'clamp(46px, 5.8vmin, 54px)',
                background: isMobile
                  ? 'linear-gradient(180deg, #A78BFA 0%, #8B5CF6 45%, #7C3AED 100%)'
                  : '#8B5CF6',
                border: isMobile ? '1px solid rgba(255,255,255,0.12)' : 'none',
                borderRadius: isMobile ? 12 : 'clamp(8px, 1vmin, 10px)',
                color: '#fff',
                fontSize: 'clamp(14px, 1.65vmin, 16px)',
                fontWeight: isMobile ? 600 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: isMobile ? '14px 20px' : 'clamp(8px, 1.2vmin, 12px) clamp(14px, 2vmin, 20px)',
                boxShadow: isMobile
                  ? '0 4px 18px rgba(124, 58, 237, 0.38), inset 0 1px 0 rgba(255,255,255,0.2)'
                  : undefined,
                /* Let the button "hang" below the card */
                marginBottom: isMobile ? 0 : 'calc(-1 * clamp(18px, 3vmin, 28px))',
                position: 'relative',
                zIndex: 3,
                width: isMobile ? '100%' : undefined,
                boxSizing: 'border-box',
              }}>
                <img src={cartIcon} alt="" width={24} height={22} style={{ display: 'block' }} />
                Add to Cart
              </button>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 9,
                flexWrap: 'wrap',
                marginTop: isMobile ? 0 : 'clamp(18px, 3vmin, 28px)', /* keep NABL text readable under the hanging button */
              }}>
                <img src={nablIcon} alt="" width={22} height={21} style={{ display: 'block' }} />
                <span style={{ color: '#828282', fontSize: 'clamp(12px, 1.45vmin, 14px)', fontFamily: 'Inter, sans-serif' }}>
                  NABL certified labs • Safe home collection
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="test-detail-pills"
          style={{
            display: 'flex',
            gap: isMobile ? 16 : 'clamp(18px, 4.2vmin, 58px)',
            alignItems: 'center',
            justifyContent: isMobile ? 'center' : 'flex-start',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            width: isMobile ? '100%' : undefined,
            boxSizing: 'border-box',
            padding: isMobile ? '16px 12px 20px' : '18px 0 22px',
            paddingLeft: isMobile ? 12 : 'clamp(24px, 2.8vmin, 36px)',
            marginTop: isMobile ? 0 : 'calc(-1 * clamp(110px, 14vmin, 170px))',
            marginBottom: isMobile ? 0 : 'clamp(34px, 5.2vmin, 72px)',
            color: '#101129',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {[
            { icon: homeCollectionIcon, text: 'Home Collection' },
            { icon: postpaidIcon, text: 'Prepaid Available' },
            { icon: rupeeIcon, text: '₹ 0 Cashback' },
          ].map(item => (
            <div
              key={item.text}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: isMobile ? 6 : 'clamp(8px, 1.2vmin, 10px)',
                flexShrink: 0,
              }}
            >
              <img
                src={item.icon}
                alt=""
                width={24}
                height={24}
                style={{
                  display: 'block',
                  width: isMobile ? 18 : 'clamp(20px, 2.8vmin, 28px)',
                  height: 'auto',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: isMobile ? 12 : 'clamp(14px, 2vmin, 20px)',
                  color: '#101129',
                  lineHeight: 1.4,
                  whiteSpace: 'nowrap',
                }}
              >
                {item.text}
              </span>
            </div>
          ))}
        </div>

        <div ref={tabsCardRef} className="test-detail-tabsCard" style={{ borderRadius: 20, border: '1px solid #E7E1FF', overflow: 'hidden', marginTop: isMobile ? 24 : 0 }}>
          <div className="test-detail-tabs" style={{ display: 'flex', justifyContent: 'center', borderBottom: '1px solid #E7E1FF', background: '#fff', padding: isMobile ? '0 12px' : '0 20px' }}>
            {TABS.map(tab => (
              <button key={tab} type="button" onClick={() => {
                setActiveTab(tab)
                setTimeout(() => {
                  tabsCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 10)
              }} style={{
                padding: isMobile ? '14px 12px' : '18px 22px', border: 'none', background: 'none', cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif', fontSize: isMobile ? 14 : 16, fontWeight: 500,
                color: activeTab === tab ? '#8B5CF6' : '#161616',
                borderBottom: activeTab === tab ? '3px solid #8B5CF6' : '3px solid transparent',
                marginBottom: -1,
              }}>{tab}</button>
            ))}
          </div>

          <div className="test-detail-tab-content" style={{ background: 'linear-gradient(0deg, #E7E1FF 0%, #fff 100%)', padding: isMobile ? '20px 16px 24px' : '24px 32px 32px' }}>
            {activeTab === 'About' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2.2vmin, 20px)' }}>
                {aboutLoading ? (
                  <p style={{ color: '#828282', margin: 0, fontFamily: 'Inter, sans-serif' }}>Loading product details…</p>
                ) : (
                  <p style={{
                    margin: 0,
                    fontSize: isMobile ? 13 : 'clamp(13px, 1.6vmin, 15px)',
                    color: '#414141',
                    fontFamily: 'Poppins, sans-serif',
                    lineHeight: 1.75,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {aboutTabBody}
                  </p>
                )}

                <div
                  style={{
                    background: 'linear-gradient(0deg, #E7E1FF 37%, #fff 83%)',
                    borderRadius: 'clamp(16px, 2.2vmin, 20px)',
                    overflow: 'hidden',
                    padding: 'clamp(18px, 3.2vmin, 32px) clamp(16px, 3vmin, 28px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'clamp(22px, 3.2vmin, 31px)',
                  }}
                >
                  {dynamicAboutSections.map(section => {
                    const aboutBulletBlock = (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 'clamp(10px, 1.6vmin, 16px)',
                          width: '100%',
                          alignItems: isMobile ? 'flex-start' : undefined,
                        }}
                      >
                        {section.items.map(item => (
                          <div
                            key={item}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'flex-start',
                              /* On mobile the text should align under the section title;
                                 the tick hangs into the left gutter instead of indenting text. */
                              gap: isMobile ? 0 : 'clamp(12px, 2.4vmin, 25px)',
                              width: isMobile ? '100%' : undefined,
                              position: isMobile ? 'relative' : undefined,
                            }}
                          >
                            <img
                              src={aboutBulletCheck}
                              alt=""
                              width={isMobile ? 14 : 18}
                              height={isMobile ? 11 : 14}
                              style={{
                                display: 'block',
                                marginTop: isMobile ? 4 : 3,
                                flexShrink: 0,
                                /* Pull tick into the left gutter (32 icon col + 10 col gap ≈ 42px). */
                                marginLeft: isMobile ? -30 : 0,
                                marginRight: isMobile ? 10 : 0,
                              }}
                            />
                            <div
                              className="test-detail-about-bullet-text"
                              style={{
                                fontFamily: 'Poppins, sans-serif',
                                fontSize: 'clamp(13px, 1.6vmin, 20px)',
                                color: '#414141',
                                lineHeight: isMobile ? '27px' : 1.45,
                                textAlign: isMobile ? 'start' : undefined,
                                flex: isMobile ? '1 1 auto' : undefined,
                                minWidth: 0,
                              }}
                            >
                              {item}
                            </div>
                          </div>
                        ))}
                      </div>
                    )

                    if (isMobile) {
                      /* One grid row: fixed icon column | text column stacks title then bullets (same inset + gap for every section). */
                      const mobileAboutIcon = 28
                      const mobileAboutGlyph = 14
                      const mobileAboutBodyGap = 12
                      return (
                        <div
                          key={section.title}
                          className="test-detail-about-section test-detail-about-section--mobile"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: `${mobileAboutIcon}px 1fr`,
                            columnGap: 10,
                            width: '100%',
                            boxSizing: 'border-box',
                            alignItems: 'start',
                          }}
                        >
                          <div
                            style={{
                              gridColumn: 1,
                              gridRow: 1,
                              width: mobileAboutIcon,
                              height: mobileAboutIcon,
                              /* Align icon with the title’s first line on mobile */
                              marginTop: -2,
                              borderRadius: 999,
                              background: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={section.icon}
                              alt=""
                              width={mobileAboutGlyph}
                              height={mobileAboutGlyph}
                              style={{
                                display: 'block',
                                width: mobileAboutGlyph,
                                height: mobileAboutGlyph,
                                objectFit: 'contain',
                              }}
                            />
                          </div>
                          <div
                            style={{
                              gridColumn: 2,
                              gridRow: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: mobileAboutBodyGap,
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                fontFamily: 'Poppins, sans-serif',
                                fontWeight: 500,
                                color: '#101129',
                                fontSize: 'clamp(15px, 4vw, 18px)',
                                letterSpacing: '-0.02em',
                                textAlign: 'start',
                                lineHeight: 1.25,
                              }}
                            >
                              {section.title}
                            </div>
                            {aboutBulletBlock}
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={section.title}
                        className="test-detail-about-section"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'clamp(40px, 5vmin, 52px) 1fr',
                          gap: 'clamp(12px, 1.8vmin, 18px)',
                          alignItems: 'start',
                        }}
                      >
                        <div
                          style={{
                            width: 'clamp(40px, 5vmin, 52px)',
                            height: 'clamp(40px, 5vmin, 52px)',
                            borderRadius: 999,
                            background: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={section.icon}
                            alt=""
                            width={20}
                            height={20}
                            style={{
                              display: 'block',
                              width: 'clamp(14px, 1.75vmin, 20px)',
                              height: 'clamp(14px, 1.75vmin, 20px)',
                              objectFit: 'contain',
                            }}
                          />
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'clamp(10px, 1.8vmin, 17px)',
                            width: '100%',
                            boxSizing: 'border-box',
                          }}
                        >
                          <div
                            style={{
                              fontFamily: 'Poppins, sans-serif',
                              fontWeight: 500,
                              color: '#101129',
                              fontSize: 'clamp(16px, 2vmin, 24px)',
                              letterSpacing: '-0.02em',
                            }}
                          >
                            {section.title}
                          </div>
                          {aboutBulletBlock}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {activeTab === 'Parameters' && (
              <div>
                {detailLoading && parameters.length === 0 ? (
                  <p style={{ color: '#828282', fontSize: 15, margin: 0 }}>Loading parameters…</p>
                ) : parameters.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                    <div>
                      <h3 style={{
                        margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#101129',
                        fontFamily: 'Poppins, sans-serif',
                      }}>
                        Parameters
                      </h3>
                      <div style={{
                        borderRadius: 12, border: '1px solid #E7E1FF', overflow: 'hidden', background: '#fff',
                      }}>
                        <div
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            gap: 16, padding: '14px 18px',
                            fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#374151',
                          }}
                        >
                          <span style={{ flex: 1, minWidth: 0 }}>{(name || '').trim() || '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                    {groupParameters(parameters).map(([groupName, rows]) => (
                      <div key={groupName}>
                        <h3 style={{
                          margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#101129',
                          fontFamily: 'Poppins, sans-serif',
                        }}>
                          {groupName}
                        </h3>
                        <div style={{
                          borderRadius: 12, border: '1px solid #E7E1FF', overflow: 'hidden', background: '#fff',
                        }}>
                          {rows.map((row, idx) => (
                            <div
                              key={`${groupName}-${row.id}-${idx}`}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                gap: 16, padding: '14px 18px',
                                borderBottom: idx < rows.length - 1 ? '1px solid #F3F4F6' : 'none',
                                fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#374151',
                              }}
                            >
                              <span style={{ flex: 1, minWidth: 0 }}>{row.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'Preparation' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 2.4vmin, 28px)' }}>

                {/* Best Time for Sample */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    background: '#fff',
                    borderRadius: 'clamp(14px, 1.8vmin, 20px)',
                    border: '1px solid #E7E1FF',
                    padding: isMobile ? '12px 12px' : 'clamp(14px, 2.1vmin, 18px) clamp(16px, 2.4vmin, 22px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: isMobile ? 10 : 'clamp(14px, 2.2vmin, 22px)',
                    width: 'min(100%, 664px)',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <img src={bestTimeIcon} alt="" width={20} height={20} style={{ display: 'block', flexShrink: 0 }} />
                      <span style={{
                        fontSize: isMobile ? 14 : 'clamp(14px, 1.6vmin, 20px)',
                        fontWeight: 500,
                        color: '#101129',
                        fontFamily: 'Poppins, sans-serif',
                      }}>
                        Best Time for Sample
                      </span>
                    </div>

                    <div style={{
                      background: '#E7E1FF',
                      borderRadius: 'clamp(8px, 1.2vmin, 10px)',
                      padding: isMobile ? '8px 10px' : 'clamp(10px, 1.7vmin, 14px) clamp(14px, 2.2vmin, 18px)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                      minWidth: isMobile ? 0 : 'clamp(220px, 28vmin, 369px)',
                      flex: isMobile ? '0 0 auto' : undefined,
                      textAlign: 'center',
                      boxSizing: 'border-box',
                    }}>
                      <span style={{
                        fontSize: isMobile ? 10 : 'clamp(12px, 1.35vmin, 18px)',
                        color: '#414141',
                        fontFamily: 'Inter, sans-serif',
                        lineHeight: 1.4,
                        whiteSpace: 'nowrap',
                      }}>
                        {isMobile ? 'Recommended time' : 'Recommended time for accurate results'}
                      </span>
                      <span style={{
                        fontSize: isMobile ? 13 : 'clamp(14px, 1.7vmin, 24px)',
                        fontWeight: 600,
                        color: '#101129',
                        fontFamily: 'Poppins, sans-serif',
                        letterSpacing: '-0.02em',
                      }}>
                        7 AM – 10 AM
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: 'clamp(18px, 3vmin, 33px)',
                  alignItems: 'start',
                }}>
                  {/* Do's */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.6vmin, 14px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={doIcon} alt="" width={20} height={20} style={{ display: 'block' }} />
                      <span style={{ fontSize: 'clamp(16px, 1.9vmin, 24px)', fontWeight: 500, color: '#101129', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em' }}>Do’s</span>
                    </div>
                    {[
                      ...(product?.is_fasting_required
                        ? [
                            'Fast for 8–12 hours before the test (water is allowed)',
                            'Drink plenty of water to stay hydrated',
                            'Get a good night\'s sleep before the test',
                            'Wear comfortable, loose-fitting clothing',
                          ]
                        : [
                            'No fasting required for this test',
                            'Follow your normal diet unless your doctor advised otherwise',
                            'Carry any previous reports/prescriptions if available',
                            'Stay hydrated and rest well before sample collection',
                          ]),
                    ].map((item, i) => (
                      <div key={i} style={{
                        background: '#E8FFFB',
                        borderRadius: 200,
                        padding: 'clamp(12px, 1.8vmin, 16px) clamp(16px, 2.4vmin, 24px)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        minHeight: 'clamp(52px, 7.2vmin, 64px)',
                        boxSizing: 'border-box',
                      }}>
                        <img src={doIcon} alt="" width={20} height={20} style={{ display: 'block' }} />
                        <span style={{ fontSize: 'clamp(13px, 1.6vmin, 20px)', color: '#414141', fontFamily: 'Poppins, sans-serif', lineHeight: 1.45 }}>{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Don'ts */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.6vmin, 14px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={dontIcon} alt="" width={20} height={20} style={{ display: 'block' }} />
                      <span style={{ fontSize: 'clamp(16px, 1.9vmin, 24px)', fontWeight: 500, color: '#101129', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em' }}>Don’ts</span>
                    </div>
                    {[
                      ...(product?.is_fasting_required
                        ? [
                            'Avoid eating or drinking anything except water before the test',
                            'Do not smoke or consume alcohol 24 hours before',
                            'Avoid strenuous exercise the day before',
                            'Do not take medications without consulting your doctor',
                          ]
                        : [
                            'Avoid heavy workouts right before sample collection',
                            'Do not consume alcohol 24 hours before the test',
                            'Avoid smoking 2–3 hours before sample collection',
                            'Do not change medicines without consulting your doctor',
                          ]),
                    ].map((item, i) => (
                      <div key={i} style={{
                        background: '#FFF0F0',
                        borderRadius: 200,
                        padding: 'clamp(12px, 1.8vmin, 16px) clamp(16px, 2.4vmin, 24px)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        minHeight: 'clamp(52px, 7.2vmin, 64px)',
                        boxSizing: 'border-box',
                      }}>
                        <img src={dontIcon} alt="" width={20} height={20} style={{ display: 'block' }} />
                        <span style={{ fontSize: 'clamp(13px, 1.6vmin, 20px)', color: '#414141', fontFamily: 'Poppins, sans-serif', lineHeight: 1.45 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

      </div>

      <Footer />
    </div>
  )
}
