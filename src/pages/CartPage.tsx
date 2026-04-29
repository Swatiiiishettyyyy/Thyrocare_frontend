import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CartItem } from '../types'
import { fetchActiveGroups, deleteCartProduct, getCheckoutPriceSummary, checkoutPatientCount, type CartGroup } from '../api/cart'
import { toTestCard } from '../api/products'
import { useProductCatalog } from '../hooks/useProductCatalog'
import { parseMoney } from '../utils/money'
import { Navbar } from '../components'
import { CheckoutStepper, DEFAULT_STEPS } from '../components/CheckoutStepper'
import { OrderSummaryCard } from '../components/OrderSummaryCard'
import EmptyCartPage from './EmptyCartPage'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/' },
  { label: 'Reports', href: '#' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '#' },
]

const LS_KEY = 'nucleotide_cart_page1_v1'

type Page1Selection = Record<number, number> // pid -> memberCount (quantity)

function loadLocalSelection(): Page1Selection {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const out: Page1Selection = {}
    for (const [k, v] of Object.entries(parsed ?? {})) {
      const pid = Number(k)
      const qty = typeof v === 'number' ? v : Number(v)
      if (Number.isFinite(pid) && pid > 0 && Number.isFinite(qty) && qty > 0) out[pid] = Math.floor(qty)
    }
    return out
  } catch {
    return {}
  }
}

function saveLocalSelection(sel: Page1Selection) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(sel)) } catch { /* ignore */ }
}

interface CartPageProps {
  cartCount?: number
  /** Page-1 local-only selections (pid + quantity). */
  items: CartItem[]
  onSessionUpdate: (patch: Partial<import('../hooks/useCheckoutSession').CheckoutSession>) => void
}

export default function CartPage({
  cartCount,
  items,
  onSessionUpdate,
}: CartPageProps) {
  const navigate = useNavigate()
  const { products, ready } = useProductCatalog()

  const [dbGroups, setDbGroups] = useState<CartGroup[]>([])
  const [loadingDb, setLoadingDb] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)

  const [selection, setSelection] = useState<Page1Selection>(() => {
    // start with session items (e.g. from TestDetailPage), fall back to localStorage
    const fromSession: Page1Selection = {}
    for (const it of items) {
      if (it.thyrocareProductId != null && Number.isFinite(it.thyrocareProductId) && it.quantity > 0) {
        fromSession[it.thyrocareProductId] = it.quantity
      }
    }
    const fromLs = loadLocalSelection()
    // IMPORTANT: if we already have an explicit selection from navigation/session,
    // do not merge in older localStorage state (it causes “extra” items to appear).
    return Object.keys(fromSession).length > 0 ? fromSession : fromLs
  })

  useEffect(() => { saveLocalSelection(selection) }, [selection])

  // Page-1 load rule: GET /thyrocare/cart/active-all and restore DB-saved selections
  useEffect(() => {
    let cancelled = false
    setLoadingDb(true)
    setDbError(null)
    fetchActiveGroups()
      .then(groups => {
        if (cancelled) return
        setDbGroups(groups)
        setSelection(prev => {
          // If user already has a selection (e.g. just came from TestDetailPage),
          // do NOT auto-add previously saved DB groups into Page-1 UI.
          if (Object.keys(prev).length > 0) return prev
          const next = { ...prev }
          for (const g of groups) {
            const pid = Number(g.thyrocare_product_id)
            if (!Number.isFinite(pid) || pid <= 0) continue
            const cnt = Array.isArray(g.member_ids) ? g.member_ids.length : 0
            if (cnt > 0) next[pid] = cnt
            else next[pid] = next[pid] ?? 1
          }
          return next
        })
      })
      .catch(() => {
        if (!cancelled) setDbError('Could not restore saved tests. Please check your connection and retry.')
      })
      .finally(() => { if (!cancelled) setLoadingDb(false) })
    return () => { cancelled = true }
  }, [])

  const dbSavedPids = useMemo(() => new Set(dbGroups.map(g => Number(g.thyrocare_product_id)).filter(Number.isFinite)), [dbGroups])

  const selectedItems: CartItem[] = useMemo(() => {
    if (!ready) return []
    const byPid = new Map<number, CartItem>()
    // build from catalog so the list is always “products DB”
    for (const p of products) {
      const pid = Number((p as any).id)
      if (!Number.isFinite(pid) || pid <= 0) continue
      const qty = selection[pid]
      if (!qty || qty <= 0) continue
      const card = toTestCard(p)
      byPid.set(pid, {
        thyrocareProductId: pid,
        name: card.name,
        type: card.type,
        price: card.price,
        originalPrice: card.originalPrice,
        quantity: Math.max(1, Math.floor(qty)),
        maxBeneficiaries: card.maxBeneficiaries,
      })
    }
    return [...byPid.values()]
  }, [products, ready, selection])

  // keep checkout session in sync with Page-1 selection (local-only)
  useEffect(() => {
    onSessionUpdate({
      cartItems: selectedItems,
      // Page-1 rule: don't trust DB groups for non-saved picks; keep groups as-is until Address pulls active-all
      netPayableAmount: null,
      thyrocarePricing: null,
      pricingSnapshotKey: null,
    })
  }, [selectedItems, onSessionUpdate])

  const patientCount = useMemo(() => checkoutPatientCount(selectedItems), [selectedItems])
  const { subtotal, savings, total } = useMemo(
    () =>
      getCheckoutPriceSummary(selectedItems, {
        thyrocarePricing: null,
        netPayableAmount: null,
        groups: [],
        pricingSnapshotKey: null,
      }),
    [selectedItems],
  )

  // If the user removed everything, show the empty cart state.
  // (Don't depend on catalog readiness; selection is the source of truth for Page-1.)
  if (selectedItems.length === 0 && Object.keys(selection).length === 0) return <EmptyCartPage />

  return (
    <div className="cart-page" style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Poppins', sans-serif" }}>
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
        }}
      >
        <span style={{ fontSize: 14, color: '#6B7280', cursor: 'pointer' }} onClick={() => navigate('/')}>Tests</span>
        <span style={{ fontSize: 14, color: '#6B7280' }}>›</span>
        <span style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>Checkout</span>
      </div>

      {/* Stepper */}
      <CheckoutStepper steps={DEFAULT_STEPS} activeStep={0} />

      {/* Content */}
      <div className="cart-content" style={{ gap: 24, maxWidth: 1200 }}>

        {/* Selected tests only */}
        <div style={{ flex: 1 }}>
          <h2 className="cart-items-title" style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 20 }}>
            Select Tests ({selectedItems.length} selected)
          </h2>
          {dbError && (
            <div role="alert" style={{ fontSize: 13, color: '#B91C1C', fontFamily: 'Inter, sans-serif', padding: '10px 12px', background: '#FEF2F2', borderRadius: 10, border: '1px solid #FECACA', marginBottom: 12 }}>
              {dbError}
            </div>
          )}
          {loadingDb && (
            <p style={{ color: '#828282', fontSize: 14, fontFamily: 'Inter,sans-serif' }}>Restoring saved selections…</p>
          )}

          {!ready ? (
            <p style={{ color: '#828282', fontSize: 14, fontFamily: 'Inter,sans-serif' }}>Loading tests…</p>
          ) : selectedItems.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
              No selected tests.
            </div>
          ) : (
            selectedItems.map((it) => {
              const pid = Number(it.thyrocareProductId)
              if (!Number.isFinite(pid) || pid <= 0) return null
              const qty = selection[pid] ?? it.quantity ?? 1
              const isSaved = dbSavedPids.has(pid)
              const max = it.maxBeneficiaries ?? 10
              const plusDisabled = qty >= max
              return (
                <div key={pid} className="cart-line" style={{
                  background: '#fff',
                  borderRadius: 20,
                  outline: '1px solid #8B5CF6',
                  boxShadow: '0px 4px 27.3px 0px rgba(0,0,0,0.05)',
                  padding: '20px 24px',
                  marginBottom: 12,
                  opacity: 1,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 320px', minWidth: 260 }}>
                      <span style={{ fontFamily: 'Poppins,sans-serif', fontSize: 15, fontWeight: 500, color: '#161616' }}>
                        {it.name}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          setSelection(prev => {
                            const next = { ...prev }
                            delete next[pid]
                            return next
                          })
                          if (isSaved) {
                            try {
                              await deleteCartProduct(pid)
                              const refreshed = await fetchActiveGroups()
                              setDbGroups(refreshed)
                            } catch {
                              /* keep local */
                            }
                          }
                        }}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#DC2626',
                          cursor: 'pointer',
                          fontFamily: 'Inter,sans-serif',
                          fontSize: 13,
                          padding: '6px 8px',
                          borderRadius: 8,
                        }}
                        title="Remove"
                      >
                        Remove
                      </button>
                    </div>

                    <span className="cart-line-typePill" style={{
                      fontFamily: 'Poppins,sans-serif', fontSize: 13, fontWeight: 400, color: '#101129',
                      background: '#E7E1FF', borderRadius: 122, padding: '4px 14px',
                      outline: '1px solid #E7E1FF', whiteSpace: 'nowrap',
                    }}>{it.type}</span>

                    {isSaved && (
                      <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#059669', background: '#E6F6F3', border: '1px solid #A7F3D0', borderRadius: 999, padding: '3px 10px', whiteSpace: 'nowrap' }}>
                        Saved
                      </span>
                    )}
                  </div>

                  <>
                    <div style={{ height: 0, outline: '1px solid #E7E1FF', margin: '14px 0' }} />
                    <div className="cart-line-patientBox" style={{ background: '#fff', border: '0.4px solid #E7E1FF', borderRadius: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                      <span className="cart-line-patientLabel" style={{ fontFamily: 'Inter,sans-serif', fontSize: 15, fontWeight: 400, color: '#828282', whiteSpace: 'nowrap' }}>No of Patients</span>
                      <div className="cart-line-stepper" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button
                          onClick={() => setSelection(prev => ({ ...prev, [pid]: Math.max(1, (prev[pid] ?? qty) - 1) }))}
                          disabled={qty <= 1}
                          title={qty <= 1 ? 'Minimum 1 patient' : undefined}
                          className="cart-line-stepperBtn cart-line-stepperBtn--minus"
                          style={{
                            width: 38, height: 38, borderRadius: '50%', border: 'none',
                            background: qty <= 1 ? '#E7E1FF' : 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)',
                            color: qty <= 1 ? '#828282' : '#fff', fontSize: 18,
                            cursor: qty <= 1 ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>−</button>
                        <span className="cart-line-stepperValue" style={{ fontFamily: 'Poppins,sans-serif', fontSize: 18, fontWeight: 400, color: '#101129', minWidth: 12, textAlign: 'center' }}>{qty}</span>
                        <button
                          onClick={() => setSelection(prev => ({ ...prev, [pid]: Math.min(max, (prev[pid] ?? qty) + 1) }))}
                          disabled={plusDisabled}
                          title={plusDisabled ? `Max ${max} patients` : undefined}
                          className="cart-line-stepperBtn cart-line-stepperBtn--plus"
                          style={{
                            width: 38, height: 38, borderRadius: '50%', border: 'none',
                            background: plusDisabled ? '#E7E1FF' : 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)',
                            color: plusDisabled ? '#828282' : '#fff',
                            fontSize: 18, cursor: plusDisabled ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>+</button>
                      </div>
                    </div>
                    {max && (
                      <div className="cart-line-maxHint" style={{ marginTop: 10, fontSize: 12, color: '#828282', fontFamily: 'Inter,sans-serif' }}>
                        Max {max} patients
                      </div>
                    )}
                  </>
                </div>
              )
            })
          )}
        </div>

        {/* Order Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 380 }}>
          <OrderSummaryCard
            itemCount={patientCount}
            subtotal={subtotal}
            savings={savings}
            total={total}
            onContinue={async () => {
              if (selectedItems.length === 0) return
              navigate('/address')
            }}
            continueDisabled={selectedItems.length === 0}
            continueLabel={'Continue'}
          />
        </div>

      </div>
    </div>
  )
}
