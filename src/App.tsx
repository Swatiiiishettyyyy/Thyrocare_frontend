import { useCallback, useEffect, useRef } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import CartPage from './pages/CartPage'
import AddressPage from './pages/AddressPage'
import PaymentPage from './pages/PaymentPage'
import ConfirmationPage from './pages/ConfirmationPage'
import OrderDetailsPage from './pages/OrderDetailsPage'
import ReportsListPage from './pages/ReportsListPage'
import EmptyReportPage from './pages/EmptyReportPage'
import CompareReportsPage from './pages/CompareReportsPage'
import UploadReportPage from './pages/UploadReportPage'
import UploadReportDetailsPage from './pages/UploadReportDetailsPage'
import AnalysingReportPage from './pages/AnalysingReportPage'
import ReviewReportPage from './pages/ReviewReportPage'
import PackagesPage from './pages/PackagesPage'
import OrdersPage from './pages/OrdersPage'
import ReportPage from './pages/ReportPage'
import TestPage from './pages/TestPage'
import TestDetailPage from './pages/TestDetailPage'
import WomenHealthSegmentPage from './pages/WomenHealthSegmentPage'
import MenHealthSegmentPage from './pages/MenHealthSegmentPage'
import OrganDetailPage from './pages/OrganDetailPage'
import HealthMetricsPage from './pages/HealthMetricsPage'
import TimeSlotPage from './pages/TimeSlotPage'
import VitalsOrganPage from './pages/VitalsOrganPage'
import ComprehensiveBrowsePage from './pages/ComprehensiveBrowsePage'
import type { TestCardProps } from './types'
import {
  updateCartItem,
  removeCartLineBestEffort,
  fetchActiveGroups,
  checkoutPricingSnapshotKey,
  upsertCart,
  pullCheckoutSnapshot,
  addBloodTestToCart,
} from './api/cart'
import { useCheckoutSession } from './hooks/useCheckoutSession'
import { cartLineKey, findExistingLineForAdd, memberIdsForQuantity } from './utils/cartLineKey'

const CHECKOUT_PATHS = ['/cart', '/address', '/timeslot', '/payment']

function ScrollToTopOnRouteChange() {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])
  return null
}

export default function App() {
  const location = useLocation()
  const { session, update, upsertGroup, clearSession } = useCheckoutSession()
  const cartItems = session.cartItems
  const cartLineCount = cartItems.length
  const didInitialSync = useRef(false)
  const sessionRef = useRef(session)
  sessionRef.current = session

  const applyCheckoutSnapshot = useCallback(
    (snap: Awaited<ReturnType<typeof pullCheckoutSnapshot>>) => {
      const clearPricing = !snap.hadCartLinesFromApi
      update({
        cartItems: snap.cartItems,
        groups: snap.groups,
        checkoutSyncError: null,
        ...(clearPricing
          ? {
              netPayableAmount: null,
              thyrocarePricing: null,
              pricingSnapshotKey: null,
            }
          : {}),
      })
    },
    [update],
  )

  /** GET /cart/view + active groups → session (single source of truth for checkout UI). */
  const hydrateCheckoutFromView = useCallback(async () => {
    const snap = await pullCheckoutSnapshot({
      previousGroups: sessionRef.current.groups,
      localOnlyItems: sessionRef.current.cartItems.filter(i => !i.cartItemId),
      fallbackItems: sessionRef.current.cartItems,
    })
    applyCheckoutSnapshot(snap)
  }, [applyCheckoutSnapshot])

  const runCheckoutHydrateWithErrorBanner = useCallback(async () => {
    try {
      await hydrateCheckoutFromView()
    } catch (e) {
      console.error('Checkout sync failed:', e)
      update({
        checkoutSyncError: 'Could not refresh your cart. Check your connection and try again.',
      })
    }
  }, [hydrateCheckoutFromView, update])

  const retryCheckoutSync = useCallback(async () => {
    await runCheckoutHydrateWithErrorBanner()
  }, [runCheckoutHydrateWithErrorBanner])

  // Align session with server cart + Thyrocare groups (replaces merge-only upsert that left stale groups).
  // Runs once on first paint, then again whenever user opens a checkout step.
  useEffect(() => {
    const onCheckout = CHECKOUT_PATHS.includes(location.pathname)
    if (didInitialSync.current) {
      if (!onCheckout) return
    } else {
      didInitialSync.current = true
    }

    void runCheckoutHydrateWithErrorBanner()
  }, [location.pathname, runCheckoutHydrateWithErrorBanner])

  useEffect(() => {
    const key = checkoutPricingSnapshotKey(session.groups, session.cartItems)
    const hasPricing = !!(session.thyrocarePricing || session.netPayableAmount)
    if (!hasPricing) return
    if (!session.pricingSnapshotKey || session.pricingSnapshotKey !== key) {
      update({
        netPayableAmount: null,
        thyrocarePricing: null,
        pricingSnapshotKey: null,
      })
    }
  }, [session.groups, session.cartItems, session.pricingSnapshotKey, session.thyrocarePricing, session.netPayableAmount, update])

  const handleAddToCart = useCallback((test: TestCardProps) => {
    const addQty = test.quantity != null && test.quantity > 0 ? test.quantity : 1
    const existing = findExistingLineForAdd(cartItems, test)
    const newQuantity = existing ? existing.quantity + addQty : addQty
    const mergeKey = existing ? cartLineKey(existing) : null
    update({
      cartItems: (() => {
        if (existing && mergeKey) {
          return cartItems.map(i => (cartLineKey(i) === mergeKey ? { ...i, quantity: i.quantity + addQty } : i))
        }
        return [...cartItems, {
          thyrocareProductId: test.thyrocareProductId,
          maxBeneficiaries: test.maxBeneficiaries,
          name: test.name,
          type: test.type,
          price: test.price,
          originalPrice: test.originalPrice,
          quantity: addQty,
        }]
      })(),
      netPayableAmount: null,
      thyrocarePricing: null,
      pricingSnapshotKey: null,
    })

    const pid = test.thyrocareProductId != null ? Number(test.thyrocareProductId) : NaN
    if (!Number.isFinite(pid)) return

    void (async () => {
      try {
        const g = sessionRef.current.groups.find(x => x.thyrocare_product_id === pid)
        const hasCheckoutContext =
          g?.address_id != null && Array.isArray(g.member_ids) && g.member_ids.length > 0

        if (existing?.cartItemId != null) {
          await updateCartItem(existing.cartItemId, newQuantity)
        } else {
          const qty = existing ? newQuantity : addQty
          if (hasCheckoutContext) {
            const mids = memberIdsForQuantity(g!.member_ids!, qty)
            if (mids != null) {
              await addBloodTestToCart({
                thyrocare_product_id: pid,
                quantity: qty,
                address_id: g!.address_id!,
                member_ids: mids,
              })
            }
            /* else: not enough selected members for qty — keep local line; user fixes on Address */
          }
          /* no address/members yet — keep local-only line; Address Continue uses thyrocare/cart/add */
        }
        const snap = await pullCheckoutSnapshot({
          previousGroups: sessionRef.current.groups,
          localOnlyItems: sessionRef.current.cartItems.filter(i => !i.cartItemId),
          fallbackItems: sessionRef.current.cartItems,
        })
        update({
          cartItems: snap.cartItems,
          groups: snap.groups,
          checkoutSyncError: null,
          netPayableAmount: null,
          thyrocarePricing: null,
          pricingSnapshotKey: null,
        })
      } catch (e) {
        console.error('Cart sync after add failed:', e)
      }
    })()
  }, [cartItems, update])

  const handleUpdateQty = useCallback(async (lineKey: string, delta: number) => {
    const item = cartItems.find(i => cartLineKey(i) === lineKey)
    if (!item || item.thyrocareProductId == null) return
    const newQty = item.quantity + delta
    if (newQty < 1) return
    const maxB = item.maxBeneficiaries
    if (maxB != null && newQty > maxB) return

    let group = session.groups.find(g => g.thyrocare_product_id === item.thyrocareProductId)
    let canUpsert =
      !!group?.group_id &&
      group.address_id != null &&
      Array.isArray(group.member_ids) &&
      group.member_ids.length > 0

    if (!canUpsert) {
      try {
        const active = await fetchActiveGroups()
        const g = active.find(
          x =>
            x.thyrocare_product_id === item.thyrocareProductId &&
            String(x.group_id ?? '').trim() &&
            x.address_id != null &&
            Array.isArray(x.member_ids) &&
            x.member_ids.length > 0,
        )
        if (g) {
          group = g
          canUpsert = true
        }
      } catch {
        /* use generic cart update below */
      }
    }

    if (canUpsert && group) {
      const memberIds = memberIdsForQuantity(group.member_ids, newQty)
      if (memberIds != null) {
        try {
          await upsertCart(group.group_id, item.thyrocareProductId, memberIds, group.address_id!)
          const snap = await pullCheckoutSnapshot({
            previousGroups: sessionRef.current.groups,
            localOnlyItems: sessionRef.current.cartItems.filter(i => !i.cartItemId),
            fallbackItems: sessionRef.current.cartItems,
          })
          if (snap.hadCartLinesFromApi) {
            update({
              cartItems: snap.cartItems,
              groups: snap.groups,
              checkoutSyncError: null,
              netPayableAmount: null,
              thyrocarePricing: null,
              pricingSnapshotKey: null,
            })
            return
          }
        } catch {
          /* fall through to generic update / local */
        }
      }
    }

    if (item.cartItemId) {
      try {
        await updateCartItem(item.cartItemId, newQty)
        const snap = await pullCheckoutSnapshot({
          previousGroups: sessionRef.current.groups,
          localOnlyItems: sessionRef.current.cartItems.filter(i => !i.cartItemId),
          fallbackItems: sessionRef.current.cartItems,
        })
        if (snap.hadCartLinesFromApi) {
          update({
            cartItems: snap.cartItems,
            groups: snap.groups,
            checkoutSyncError: null,
            netPayableAmount: null,
            thyrocarePricing: null,
            pricingSnapshotKey: null,
          })
          return
        }
      } catch { /* API failed — still update local state */ }
    }
    update({
      cartItems: cartItems.map(i => (cartLineKey(i) === lineKey ? { ...i, quantity: newQty } : i)),
      netPayableAmount: null,
      thyrocarePricing: null,
      pricingSnapshotKey: null,
    })
  }, [cartItems, session.groups, update])

  const handleRemoveLine = useCallback(async (lineKey: string) => {
    const item = cartItems.find(i => cartLineKey(i) === lineKey)
    if (!item) return
    if (!item.cartItemId) {
      const pid = item.thyrocareProductId
      const displayName = item.name
      update({
        cartItems: cartItems.filter(i => cartLineKey(i) !== lineKey),
        groups: session.groups.filter(g =>
          pid != null ? g.thyrocare_product_id !== pid : g.product_name !== displayName,
        ),
        netPayableAmount: null,
        thyrocarePricing: null,
        pricingSnapshotKey: null,
      })
      return
    }
    if (import.meta.env.DEV) {
      console.log('[cart/remove] DELETE line', item.cartItemId, item.name)
    }
    try {
      await removeCartLineBestEffort(item.cartItemId)
    } catch { /* refetch anyway */ }
    try {
      const snap = await pullCheckoutSnapshot({
        previousGroups: sessionRef.current.groups,
        localOnlyItems: sessionRef.current.cartItems.filter(
          i => !i.cartItemId && cartLineKey(i) !== lineKey,
        ),
        fallbackItems: sessionRef.current.cartItems,
      })
      update({
        cartItems: snap.cartItems,
        groups: snap.groups,
        checkoutSyncError: null,
        netPayableAmount: null,
        thyrocarePricing: null,
        pricingSnapshotKey: null,
      })
    } catch {
      const pid = item.thyrocareProductId
      const displayName = item.name
      update({
        cartItems: cartItems.filter(i => cartLineKey(i) !== lineKey),
        groups: session.groups.filter(g =>
          pid != null ? g.thyrocare_product_id !== pid : g.product_name !== displayName,
        ),
        netPayableAmount: null,
        thyrocarePricing: null,
        pricingSnapshotKey: null,
      })
    }
  }, [cartItems, session.groups, update])

  /** Cart step → Address: rehydrate from `/cart/view`; lines stay local until Address Continue (`thyrocare/cart/add`). */
  const prepareCartBeforeAddress = useCallback(async () => {
    const hadItems = sessionRef.current.cartItems.length > 0
    const snap = await pullCheckoutSnapshot({
      previousGroups: sessionRef.current.groups,
      localOnlyItems: sessionRef.current.cartItems.filter(i => !i.cartItemId),
      fallbackItems: sessionRef.current.cartItems,
    })
    applyCheckoutSnapshot(snap)
    if (hadItems && snap.cartItems.length === 0) {
      throw new Error('Cart sync returned no items')
    }
  }, [applyCheckoutSnapshot])

  const showCheckoutSyncBanner =
    CHECKOUT_PATHS.includes(location.pathname) && session.checkoutSyncError

  return (
    <>
      <ScrollToTopOnRouteChange />
      {showCheckoutSyncBanner && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            flexWrap: 'wrap',
            padding: '10px 16px',
            background: '#FEF3C7',
            borderBottom: '1px solid #FCD34D',
            fontFamily: 'Inter, sans-serif',
            fontSize: 14,
            color: '#92400E',
          }}
        >
          <span>{session.checkoutSyncError}</span>
          <button
            type="button"
            onClick={() => void retryCheckoutSync()}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: '#101129',
              color: '#fff',
              fontFamily: 'Inter, sans-serif',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Retry
          </button>
        </div>
      )}
    <Routes>
      {/* Some static hosts land on /index.html; treat it as / */}
      <Route path="/index.html" element={<Navigate to="/" replace />} />
      {/* Badge = number of distinct cart lines (products), not sum of patient quantities */}
      <Route path="/" element={<TestPage cartCount={cartLineCount} />} />
      <Route path="/vitals/:organId" element={<VitalsOrganPage cartCount={cartLineCount} />} />
      <Route path="/comprehensive/:gender" element={<ComprehensiveBrowsePage cartCount={cartLineCount} />} />
      <Route path="/women-health/:segment" element={<WomenHealthSegmentPage cartCount={cartLineCount} />} />
      <Route path="/women-health" element={<WomenHealthSegmentPage cartCount={cartLineCount} />} />
      <Route path="/men-health/:segment" element={<MenHealthSegmentPage cartCount={cartLineCount} />} />
      <Route path="/men-health" element={<MenHealthSegmentPage cartCount={cartLineCount} />} />
      <Route path="/test/:id" element={<TestDetailPage cartCount={cartLineCount} onAddToCart={handleAddToCart} />} />
      <Route
        path="/cart"
        element={
          <CartPage
            cartCount={cartLineCount}
            items={cartItems}
            groups={session.groups}
            onUpdateQty={handleUpdateQty}
            onRemoveLine={handleRemoveLine}
            onSyncCartBeforeAddress={prepareCartBeforeAddress}
          />
        }
      />
      <Route path="/address" element={<AddressPage cartCount={cartLineCount} items={cartItems} session={session} onSessionUpdate={update} onUpsertGroup={upsertGroup} />} />
      <Route path="/timeslot" element={<TimeSlotPage cartCount={cartLineCount} items={cartItems} session={session} onSessionUpdate={update} onUpsertGroup={upsertGroup} />} />
      <Route path="/payment" element={<PaymentPage cartCount={cartLineCount} items={cartItems} session={session} onSessionUpdate={update} onOrderComplete={clearSession} />} />
      <Route path="/confirmation" element={<ConfirmationPage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/order-details" element={<OrderDetailsPage />} />
      <Route path="/report" element={<ReportPage />} />
      <Route path="/reports" element={<ReportsListPage />} />
      <Route path="/empty-report" element={<EmptyReportPage />} />
      <Route path="/compare-reports" element={<CompareReportsPage />} />
      <Route path="/upload-report" element={<UploadReportPage />} />
      <Route path="/upload-report-details" element={<UploadReportDetailsPage />} />
      <Route path="/analysing-report" element={<AnalysingReportPage />} />
      <Route path="/review-report" element={<ReviewReportPage />} />
      <Route path="/packages" element={<PackagesPage cartCount={cartLineCount} />} />
      <Route path="/metrics" element={<HealthMetricsPage cartCount={cartLineCount} />} />
      <Route path="/metrics/:organ" element={<OrganDetailPage cartCount={cartLineCount} />} />
    </Routes>
    </>
  )
}


