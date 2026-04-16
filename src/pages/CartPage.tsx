import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CartItem } from '../types'
import type { CartGroup } from '../api/cart'
import { cartLineKey } from '../utils/cartLineKey'
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

function blockQtyIncrease(item: CartItem, groups: CartGroup[]): boolean {
  if (item.thyrocareProductId == null) return false
  const g = groups.find(x => x.thyrocare_product_id === item.thyrocareProductId)
  if (!g?.group_id || !Array.isArray(g.member_ids) || g.member_ids.length === 0) return false
  return item.quantity + 1 > g.member_ids.length
}

interface CartPageProps {
  cartCount?: number
  items: CartItem[]
  groups?: CartGroup[]
  onUpdateQty: (lineKey: string, delta: number) => void
  onRemoveLine: (lineKey: string) => void
  /** Before opening Address: rehydrate from `/cart/view` + active groups; server lines are created on Address Continue. */
  onSyncCartBeforeAddress?: () => Promise<void>
}

export default function CartPage({
  cartCount,
  items,
  groups = [],
  onUpdateQty,
  onRemoveLine,
  onSyncCartBeforeAddress,
}: CartPageProps) {
  const navigate = useNavigate()
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const subtotal = items.length > 0 ? items.reduce((sum, i) => sum + parseMoney(i.originalPrice) * i.quantity, 0) : 0
  const total = items.length > 0 ? items.reduce((sum, i) => sum + parseMoney(i.price) * i.quantity, 0) : 0
  const savings = subtotal - total

  if (items.length === 0) return <EmptyCartPage />

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

        {/* Cart items */}
        <div style={{ flex: 1 }}>
          <h2 className="cart-items-title" style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 20 }}>
            Your Cart Items({items.length} item{items.length !== 1 ? 's' : ''})
          </h2>
          {items.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
              Your cart is empty
            </div>
          ) : (
            items.map((item) => {
              const lineKey = cartLineKey(item)
              const increaseBlockedByMembers = blockQtyIncrease(item, groups)
              const increaseBlockedByMax =
                item.maxBeneficiaries !== undefined && item.quantity >= item.maxBeneficiaries
              const plusDisabled = increaseBlockedByMembers || increaseBlockedByMax
              return (
              <div key={lineKey} className="cart-line" style={{
                background: '#fff',
                borderRadius: 20,
                outline: '1px solid #E7E1FF',
                boxShadow: '0px 4px 27.3px 0px rgba(0,0,0,0.05)',
                padding: '27px 34px',
                marginBottom: 16,
              }}>
                {/* Row 1: Name + type badge + remove */}
                <div className="cart-line-titleRow" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontFamily: 'Poppins,sans-serif', fontSize: 16, fontWeight: 500, color: '#161616', flex: 1 }}>{item.name}</span>
                  <span className="cart-line-typePill" style={{
                    fontFamily: 'Poppins,sans-serif', fontSize: 13, fontWeight: 400, color: '#101129',
                    background: '#E7E1FF', borderRadius: 122, padding: '4px 14px',
                    outline: '1px solid #E7E1FF', whiteSpace: 'nowrap',
                  }}>{item.type}</span>
                  <button
                    type="button"
                    data-cart-item-id={item.cartItemId != null ? String(item.cartItemId) : undefined}
                    aria-label={
                      item.cartItemId != null
                        ? `Remove line (cart item ${item.cartItemId})`
                        : 'Remove from cart'
                    }
                    onClick={() => onRemoveLine(lineKey)}
                    style={{
                      fontFamily: 'Inter,sans-serif', fontSize: 13, color: '#DC2626',
                      background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
                      textDecoration: 'underline',
                    }}
                  >
                    Remove
                  </button>
                </div>

                {/* Divider */}
                <div className="cart-line-divider" style={{ height: 0, outline: '1px solid #E7E1FF', marginBottom: 20 }} />

                {/* Price */}
                <div className="cart-line-priceRow" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span className="cart-line-price" style={{ fontFamily: 'Poppins,sans-serif', fontSize: 28, fontWeight: 600, color: '#161616', lineHeight: 1 }}>₹{Math.round(parseMoney(item.price) * item.quantity)}</span>
                  <span className="cart-line-mrp" style={{ fontFamily: 'Poppins,sans-serif', fontSize: 16, fontWeight: 500, color: '#828282', textDecoration: 'line-through' }}>₹{Math.round(parseMoney(item.originalPrice) * item.quantity)}</span>
                </div>

                {/* No of Patients */}
                <div className="cart-line-patientBox" style={{ background: '#fff', border: '0.4px solid #E7E1FF', borderRadius: 8, padding: '8px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <span className="cart-line-patientLabel" style={{ fontFamily: 'Inter,sans-serif', fontSize: 18, fontWeight: 400, color: '#828282', whiteSpace: 'nowrap' }}>No of Patients</span>
                  <div className="cart-line-stepper" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <button
                        onClick={() => onUpdateQty(lineKey, -1)}
                        disabled={item.quantity <= 1}
                        title={item.quantity <= 1 ? 'Minimum 1 patient' : undefined}
                        className="cart-line-stepperBtn cart-line-stepperBtn--minus"
                        style={{
                          width: 42, height: 42, borderRadius: '50%', border: 'none',
                          background: item.quantity <= 1 ? '#E7E1FF' : 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)',
                          color: item.quantity <= 1 ? '#828282' : '#fff', fontSize: 20,
                          cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>−</button>
                      <span className="cart-line-stepperValue" style={{ fontFamily: 'Poppins,sans-serif', fontSize: 20, fontWeight: 400, color: '#101129', minWidth: 12, textAlign: 'center' }}>{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQty(lineKey, 1)}
                        disabled={plusDisabled}
                        title={
                          increaseBlockedByMembers
                            ? 'Select more patients on the address step'
                            : item.maxBeneficiaries
                              ? `Max ${item.maxBeneficiaries} patients`
                              : undefined
                        }
                        className="cart-line-stepperBtn cart-line-stepperBtn--plus"
                        style={{
                          width: 42, height: 42, borderRadius: '50%', border: 'none',
                          background: plusDisabled
                            ? '#E7E1FF'
                            : 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)',
                          color: plusDisabled ? '#828282' : '#fff',
                          fontSize: 20, cursor: plusDisabled ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>+</button>
                    </div>
                  </div>

                {item.maxBeneficiaries && (
                  <div className="cart-line-maxHint" style={{ marginTop: 10, fontSize: 12, color: '#828282', fontFamily: 'Inter,sans-serif' }}>
                    Max {item.maxBeneficiaries} patients
                  </div>
                )}
              </div>
            )})
          )}
        </div>

        {/* Order Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 380 }}>
          {syncError && (
            <div
              role="alert"
              style={{
                fontSize: 13,
                color: '#B91C1C',
                fontFamily: 'Inter, sans-serif',
                padding: '10px 12px',
                background: '#FEF2F2',
                borderRadius: 10,
                border: '1px solid #FECACA',
              }}
            >
              {syncError}
            </div>
          )}
          <OrderSummaryCard
            itemCount={items.length}
            subtotal={subtotal}
            savings={savings}
            total={total}
            onContinue={async () => {
              if (items.some(i => !i.thyrocareProductId) || syncing) return
              setSyncError(null)
              if (onSyncCartBeforeAddress) {
                setSyncing(true)
                try {
                  await onSyncCartBeforeAddress()
                  navigate('/address')
                } catch {
                  setSyncError('Could not sync your cart with the server. Please try again.')
                } finally {
                  setSyncing(false)
                }
              } else {
                navigate('/address')
              }
            }}
            continueDisabled={syncing || items.some(i => !i.thyrocareProductId)}
            continueLabel={syncing ? 'Syncing…' : 'Continue'}
          />
        </div>

      </div>
    </div>
  )
}
