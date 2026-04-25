import { useCallback, useEffect, useRef } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginModal from './components/LoginModal/LoginModal'
import OTPModal from './components/OTPModal/OTPModal'
import CompleteProfileModal from './components/CompleteProfileModal/CompleteProfileModal'
import AddMemberModal from './components/AddMemberModal/AddMemberModal'
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
  checkoutPricingSnapshotKey,
  pullCheckoutSnapshot,
} from './api/cart'
import { useCheckoutSession } from './hooks/useCheckoutSession'
import { cartLineKey, findExistingLineForAdd } from './utils/cartLineKey'

// Page-1 Cart is now local-only; server hydration starts from Address onward.
const CHECKOUT_PATHS = ['/address', '/timeslot', '/payment']

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, openLoginModal } = useAuth()
  const triggered = useRef(false)

  useEffect(() => {
    if (!isLoggedIn && !triggered.current) {
      triggered.current = true
      openLoginModal()
    }
    if (isLoggedIn) triggered.current = false
  }, [isLoggedIn, openLoginModal])

  if (!isLoggedIn) return <Navigate to="/" replace />
  return <>{children}</>
}

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
  const { isLoggedIn, members, openLoginModal, openCompleteProfileModal } = useAuth()
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
  // Runs when user opens a checkout step (Page-1 cart is local-only).
  useEffect(() => {
    const onCheckout = CHECKOUT_PATHS.includes(location.pathname)
    if (!onCheckout) return
    if (!didInitialSync.current) didInitialSync.current = true
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

  const handleAddToCart = useCallback((test: TestCardProps): boolean => {
    const hasSelf =
      members.some(m => String(m.relation ?? '').trim().toLowerCase() === 'self' || m.is_self === true)

    // Requirement: if profile isn't completed, prompt for Self profile when attempting to add to cart.
    if (!isLoggedIn) {
      openLoginModal()
      return false
    }
    if (!hasSelf) {
      openCompleteProfileModal()
      // Block add-to-cart until Self profile exists.
      return false
    }

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
    return true
  }, [cartItems, update, isLoggedIn, members, openLoginModal, openCompleteProfileModal])

  const showCheckoutSyncBanner =
    CHECKOUT_PATHS.includes(location.pathname) && session.checkoutSyncError

  return (
    <>
      <ScrollToTopOnRouteChange />
      {/* Auth modals — always in DOM, shown via AuthContext state */}
      <LoginModal />
      <OTPModal />
      <CompleteProfileModal />
      <AddMemberModal />
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
      {/* Detail route: keep it short under basename (/labtest/:id) */}
      <Route path="/:id" element={<TestDetailPage cartCount={cartLineCount} onAddToCart={handleAddToCart} />} />
      <Route
        path="/cart"
        element={
          <ProtectedRoute>
            <CartPage
              cartCount={cartLineCount}
              items={cartItems}
              onSessionUpdate={update}
            />
          </ProtectedRoute>
        }
      />
      <Route path="/address" element={<ProtectedRoute><AddressPage cartCount={cartLineCount} items={cartItems} session={session} onSessionUpdate={update} onUpsertGroup={upsertGroup} /></ProtectedRoute>} />
      <Route path="/timeslot" element={<ProtectedRoute><TimeSlotPage cartCount={cartLineCount} items={cartItems} session={session} onSessionUpdate={update} onUpsertGroup={upsertGroup} /></ProtectedRoute>} />
      <Route path="/payment" element={<ProtectedRoute><PaymentPage cartCount={cartLineCount} items={cartItems} session={session} onSessionUpdate={update} onOrderComplete={clearSession} /></ProtectedRoute>} />
      <Route path="/confirmation" element={<ProtectedRoute><ConfirmationPage /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
      <Route path="/order-details" element={<ProtectedRoute><OrderDetailsPage /></ProtectedRoute>} />
      <Route path="/report" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsListPage /></ProtectedRoute>} />
      <Route path="/empty-report" element={<ProtectedRoute><EmptyReportPage /></ProtectedRoute>} />
      <Route path="/compare-reports" element={<ProtectedRoute><CompareReportsPage /></ProtectedRoute>} />
      <Route path="/upload-report" element={<ProtectedRoute><UploadReportPage /></ProtectedRoute>} />
      <Route path="/upload-report-details" element={<ProtectedRoute><UploadReportDetailsPage /></ProtectedRoute>} />
      <Route path="/analysing-report" element={<ProtectedRoute><AnalysingReportPage /></ProtectedRoute>} />
      <Route path="/review-report" element={<ProtectedRoute><ReviewReportPage /></ProtectedRoute>} />
      <Route path="/packages" element={<PackagesPage cartCount={cartLineCount} />} />
      <Route path="/metrics" element={<HealthMetricsPage cartCount={cartLineCount} />} />
      <Route path="/metrics/:organ" element={<OrganDetailPage cartCount={cartLineCount} />} />
    </Routes>
    </>
  )
}


