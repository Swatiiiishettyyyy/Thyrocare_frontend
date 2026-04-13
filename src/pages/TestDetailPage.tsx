import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { Navbar } from '../components'
import type { TestCardProps } from '../types'
import { useProductCatalog } from '../hooks/useProductCatalog'
import { fetchProductById, toTestCard, type ThyrocareProduct } from '../api/products'

import parametersIcon from '../assets/figma/Test-detail/Frame-3.svg'
import nablIcon from '../assets/figma/Test-detail/Vector-1.svg'
import cartIcon from '../assets/figma/Test-detail/cart.svg'
import bestTimeIcon from '../assets/figma/Best_time_sample.svg'
import doIcon from '../assets/figma/Do.svg'
import dontIcon from '../assets/figma/Dont.svg'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/packages' },
  { label: 'Reports', href: '/reports' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '/orders' },
]

const TABS = ['About', 'Parameters'] as const

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

export default function TestDetailPage({ cartCount, onAddToCart }: { cartCount?: number; onAddToCart?: (test: TestCardProps) => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const stateTest = (location.state as { test?: TestCardProps } | null)?.test

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

  const parameters = product?.parameters ?? []
  /** Long `about` from detail row, then catalog row (detail-only `null` must not hide list text). */
  const aboutLong = pickAboutText(detailFromApi?.about, catalogProduct?.about)
  const shortDesc = pickAboutText(detailFromApi?.short_description, catalogProduct?.short_description)

  const paramCount = product
    ? (parameters.length > 0 ? parameters.length : product.no_of_tests_included)
    : (card?.tests ?? 0)

  const maxPatients = product?.beneficiaries_max ?? card?.maxBeneficiaries ?? 10
  const minPatients = product?.beneficiaries_min ?? 1

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('About')
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
    onAddToCart({
      ...card,
      maxBeneficiaries: product?.beneficiaries_max ?? maxBeneficiaries,
      thyrocareProductId: product?.id ?? thyrocareProductId,
      quantity: qty,
    })
    navigate('/cart')
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

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins, sans-serif', overflowX: 'hidden' }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" cartCount={cartCount} hideSearchOnMobile onCtaClick={() => navigate('/cart')} />

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
        <span style={{ fontSize: 14, color: '#6B7280', cursor: 'pointer' }} onClick={() => navigate('/')}>Tests</span>
        <span style={{ fontSize: 14, color: '#6B7280' }}>›</span>
        <span style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>{name}</span>
      </div>

      <div className="test-detail-wrapper" style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 16px 40px' : '0 24px 60px', boxSizing: 'border-box' }}>

        {detailError && catalogProduct && (
          <p style={{
            background: '#FFF8E6', border: '1px solid #F5D78E', borderRadius: 10,
            padding: '12px 16px', fontSize: 14, color: '#92400E', marginBottom: 16,
          }}>
            Could not refresh from server ({detailError}). Showing catalog data.
          </p>
        )}

        <div className="test-detail-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0 20px', color: '#828282', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
          <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Tests</span>
          <svg width="8" height="12" viewBox="0 0 8 12" fill="none"><path d="M1 1l6 5-6 5" stroke="#828282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ color: '#101129' }}>{name}</span>
        </div>

        <div className="test-detail-heroWrap" style={{ position: 'relative' }}>
          <div className="test-detail-hero" style={{
            background: 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)',
            borderRadius: 20,
            padding: isMobile ? '20px' : '36px 40px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 16 : 32,
            alignItems: 'flex-start',
            position: 'relative',
            overflow: isMobile ? 'hidden' : 'visible',
            marginBottom: isMobile ? 0 : 40,
          }}>
            <div style={{
              position: 'absolute', top: 0, right: 0,
              background: '#E7E1FF', borderTopRightRadius: 20, borderBottomLeftRadius: 16,
              padding: '8px 20px', zIndex: 3,
              fontFamily: 'Poppins, sans-serif', fontSize: 15, fontWeight: 500, color: '#101129',
            }}>{type}</div>

            <div className="test-detail-info" style={{
              flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: 24,
              paddingRight: isMobile ? 0 : 340,
              width: isMobile ? '100%' : undefined,
            }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 100, padding: '4px 14px',
                fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#E7E1FF',
                alignSelf: 'flex-start',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#41C9B3', flexShrink: 0 }} />
                {fasting}
              </span>
              <h1 style={{ margin: 0, color: '#fff', fontSize: 'clamp(24px, 3vw, 42px)', fontWeight: 500, lineHeight: 1.25 }}>
                {name}
              </h1>
              <p style={{ margin: 0, color: '#B4B4C6', fontSize: 15, fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
                {description}
              </p>
            </div>

            <div className="test-detail-statsRow" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <div style={{
                flex: '1 1 200px', borderRadius: 10, border: '1px solid #2A2C5B',
                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <img src={parametersIcon} alt="" width={22} height={22} />
                <div>
                  <div style={{ color: '#828282', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>Parameters</div>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>
                    {paramCount} {paramCount === 1 ? 'parameter' : 'parameters'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>

          <div className="test-detail-card" style={{
            position: isMobile ? 'static' : 'absolute',
            top: isMobile ? undefined : 44,
            right: isMobile ? undefined : 20,
            width: isMobile ? '100%' : 300,
            borderRadius: 16,
            background: 'linear-gradient(180deg, #E7E1FF 0%, #fff 100%)',
            padding: '16px',
            display: 'flex', flexDirection: 'column', gap: 12,
            boxShadow: isMobile ? 'none' : '0 8px 40px rgba(139,92,246,0.18)',
            zIndex: 2,
            boxSizing: 'border-box',
          }}>
            <div style={{ background: '#fff', borderRadius: 10, padding: '16px 16px 12px' }}>
              <div style={{ color: '#828282', fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Price</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 40, fontWeight: 500, color: '#101129', lineHeight: 1 }}>₹{price}</span>
                <span style={{ fontSize: 20, color: '#828282', textDecoration: 'line-through' }}>₹{originalPrice}</span>
                {offerPercent ? (
                  <span style={{
                    background: '#E6F6F3', color: '#41C9B3', border: '1px solid #41C9B3',
                    borderRadius: 6, padding: '3px 10px', fontSize: 16, fontWeight: 500,
                  }}>{offerPercent}</span>
                ) : null}
              </div>
            </div>

            {product ? (
              <p style={{ margin: 0, fontSize: 13, color: '#828282', fontFamily: 'Inter, sans-serif' }}>
                {minPatients === maxPatients
                  ? `${maxPatients} patient${maxPatients === 1 ? '' : 's'} per booking`
                  : `${minPatients}–${maxPatients} patients per booking`}
              </p>
            ) : null}

            <div style={{
              background: '#fff', borderRadius: 10, border: '1px solid #E7E1FF',
              padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ color: '#828282', fontSize: 15, fontFamily: 'Inter, sans-serif' }}>No of Patients</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <button
                  type="button"
                  onClick={() => setQty(q => Math.max(minPatients, q - 1))}
                  disabled={qty <= minPatients}
                  style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: qty <= minPatients ? '#E7E1FF' : 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)',
                    border: 'none', color: qty <= minPatients ? '#828282' : '#fff', fontSize: 22,
                    cursor: qty <= minPatients ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>−</button>
                <span style={{ fontSize: 18, fontWeight: 500, color: '#101129', minWidth: 20, textAlign: 'center' }}>{qty}</span>
                <button type="button" onClick={() => setQty(q => Math.min(maxPatients, q + 1))} style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)',
                  border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>+</button>
              </div>
            </div>

            <button type="button" onClick={submitAddToCart} style={{
              height: 52, background: '#8B5CF6', border: 'none', borderRadius: 8,
              color: '#fff', fontSize: 18, fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
              <img src={cartIcon} alt="" width={22} height={20} />
              Add to Cart
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <img src={nablIcon} alt="" width={20} height={19} />
              <span style={{ color: '#828282', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                NABL certified labs
              </span>
            </div>
          </div>
        </div>

        <div style={{ borderRadius: 20, border: '1px solid #E7E1FF', overflow: 'hidden', marginTop: isMobile ? 24 : 0 }}>
          <div className="test-detail-tabs" style={{ display: 'flex', borderBottom: '1px solid #E7E1FF', background: '#fff', padding: '0 32px' }}>
            {TABS.map(tab => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)} style={{
                padding: '20px 24px', border: 'none', background: 'none', cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif', fontSize: 16, fontWeight: 500,
                color: activeTab === tab ? '#8B5CF6' : '#161616',
                borderBottom: activeTab === tab ? '4px solid #8B5CF6' : '4px solid transparent',
                marginBottom: -1,
              }}>{tab}</button>
            ))}
          </div>

          <div className="test-detail-tab-content" style={{ background: 'linear-gradient(0deg, #E7E1FF 0%, #fff 100%)', padding: '24px 32px 32px' }}>
            {activeTab === 'About' && (
              <div style={{
                fontSize: 15, color: '#414141', fontFamily: 'Poppins, sans-serif',
                lineHeight: 1.75, whiteSpace: 'pre-wrap',
              }}>
                {aboutLoading ? (
                  <p style={{ color: '#828282', margin: 0 }}>Loading product details…</p>
                ) : (
                  aboutTabBody
                )}
              </div>
            )}
            {activeTab === 'Parameters' && (
              <div>
                {detailLoading && parameters.length === 0 ? (
                  <p style={{ color: '#828282', fontSize: 15, margin: 0 }}>Loading parameters…</p>
                ) : parameters.length === 0 ? (
                  <p style={{ color: '#828282', fontSize: 15, margin: 0 }}>
                    No parameter list returned for this product.
                  </p>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Best Time for Sample */}
                <div style={{
                  background: '#fff', borderRadius: 20, border: '1px solid #E7E1FF',
                  padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src={bestTimeIcon} alt="" width={16} height={13} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#101129', fontFamily: 'Poppins, sans-serif' }}>Best Time for Sample</span>
                  </div>
                  <div style={{
                    background: '#E7E1FF', borderRadius: 10, padding: '10px 16px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 140,
                  }}>
                    <span style={{ fontSize: 12, color: '#414141', fontFamily: 'Inter, sans-serif', textAlign: 'center', lineHeight: 1.5 }}>
                      Recommended time for accurate results
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#101129', fontFamily: 'Poppins, sans-serif' }}>7 AM – 10 AM</span>
                  </div>
                </div>

                {/* Do's */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <img src={doIcon} alt="" width={16} height={16} />
                    <span style={{ fontSize: 16, fontWeight: 500, color: '#101129', fontFamily: 'Poppins, sans-serif' }}>Do's</span>
                  </div>
                  {[
                    'Fast for 8–12 hours before the test (water is allowed)',
                    'Drink plenty of water to stay hydrated',
                    'Get a good night\'s sleep before the test',
                    'Wear comfortable, loose-fitting clothing',
                  ].map((item, i) => (
                    <div key={i} style={{
                      background: '#E8FFFB', borderRadius: 20, padding: '12px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#41C9B3', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#414141', fontFamily: 'Poppins, sans-serif', lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Don'ts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <img src={dontIcon} alt="" width={16} height={16} />
                    <span style={{ fontSize: 16, fontWeight: 500, color: '#101129', fontFamily: 'Poppins, sans-serif' }}>Don'ts</span>
                  </div>
                  {[
                    'Avoid eating or drinking anything except water before the test',
                    'Do not smoke or consume alcohol 24 hours before',
                    'Avoid strenuous exercise the day before',
                    'Do not take medications without consulting your doctor',
                  ].map((item, i) => (
                    <div key={i} style={{
                      background: '#FFF0F0', borderRadius: 20, padding: '12px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#E12D2D', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#414141', fontFamily: 'Poppins, sans-serif', lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
