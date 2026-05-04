import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'
import { CheckoutStepper } from '../components/CheckoutStepper'
import { OrderSummaryCard } from '../components/OrderSummaryCard'
import type { CartItem } from '../types'
import { createOrder, verifyPayment } from '../api/orders'
import { parseMoney } from '../utils/money'
import {
  fetchCart,
  fetchActiveGroups,
  getCheckoutPriceSummary,
  checkoutPatientCount,
  filterGroupsToMatchCartItems,
  type CartGroup,
  type CartItemAPI,
} from '../api/cart'
import { fetchAddresses } from '../api/address'
import type { Address } from '../api/address'
import {
  applyBloodTestCoupon,
  removeBloodTestCoupon,
  listBloodTestCoupons,
} from '../api/bloodTestCoupon'
import type { BloodTestCoupon } from '../api/bloodTestCoupon'

import type { CheckoutSession } from '../hooks/useCheckoutSession'

function groupsRichnessScore(gs: CartGroup[]): number {
  return gs.reduce((s, g) => {
    let p = 0
    if (g.address_id != null && Number(g.address_id) > 0) p += 2
    if (String(g.appointment_date ?? '').trim() && String(g.appointment_start_time ?? '').trim()) p += 2
    return s + p
  }, 0)
}

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/' },
  { label: 'Reports', href: '#' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '#' },
]

const SECTION_HEADER: React.CSSProperties = {
  background: '#E7E1FF',
  padding: '20px 43px',
  color: '#101129',
  fontSize: 'clamp(15px, 1.2vw, 20px)',
  fontFamily: 'Poppins, sans-serif',
  fontWeight: 500,
  lineHeight: 1.3,
}

const CARD: React.CSSProperties = {
  background: '#fff',
  boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
  borderRadius: 20,
  outline: '1px solid #E7E1FF',
  outlineOffset: -1,
  overflow: 'hidden',
  width: '100%',
  boxSizing: 'border-box',
}


interface PaymentPageProps {
  cartCount?: number
  items: CartItem[]
  session: CheckoutSession
  onSessionUpdate: (patch: Partial<CheckoutSession>) => void
  onOrderComplete: () => void
}

export default function PaymentPage({ cartCount, items, session, onSessionUpdate, onOrderComplete }: PaymentPageProps) {
  const navigate = useNavigate()
  const { groups } = session
  const firstGroup = groups[0]
  const patientCount = useMemo(() => checkoutPatientCount(items), [items])
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768)
  /** Slot may live on any group after set-appointment (we use first that has both fields). */
  const slotGroup =
    groups.find(g => String(g.appointment_date ?? '').trim() && String(g.appointment_start_time ?? '').trim()) ??
    firstGroup

  const slotDay = slotGroup?.appointment_date
    ? new Date(slotGroup.appointment_date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    : ''
  const slotTime = slotGroup?.appointment_start_time ?? ''

  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [address, setAddress] = useState<Address | null>(null)

  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [availableCoupons, setAvailableCoupons] = useState<BloodTestCoupon[]>([])
  const [offersExpanded, setOffersExpanded] = useState(false)
  const orderPlacedRef = useRef(false)


  /** First non-null address_id across groups (checkout often shares one address). */
  const collectionAddressId =
    groups.map(g => g.address_id).find(id => id != null && Number(id) > 0) ?? null

  // Refresh groups on Payment load: always pull freshest address/slot data from active-all.
  useEffect(() => {
    if (items.length === 0) return
    let cancelled = false
    ;(async () => {
      try {
        const fresh = await fetchActiveGroups()
        if (cancelled || fresh.length === 0) return
        const next = filterGroupsToMatchCartItems(fresh, items)
        if (next.length === 0) return
        if (groupsRichnessScore(next) <= groupsRichnessScore(groups)) return
        onSessionUpdate({ groups: next })
      } catch {
        /* keep session */
      }
    })()
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (collectionAddressId == null) {
      setAddress(null)
      return
    }
    const idNum = Number(collectionAddressId)
    fetchAddresses()
      .then(list => {
        const found = list.find(a => Number(a.address_id) === idNum)
        if (found) setAddress(found)
        else setAddress(null)
      })
      .catch(() => setAddress(null))
  }, [collectionAddressId])


  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    listBloodTestCoupons().then(setAvailableCoupons).catch(() => {})
  }, [])

  useEffect(() => {
    return () => {
      if (!orderPlacedRef.current) {
        removeBloodTestCoupon().catch(() => {})
      }
    }
  }, [])

  async function handleApplyCoupon(code: string) {
    const c = code.trim().toUpperCase()
    if (!c) return
    setCouponLoading(true)
    setCouponError(null)
    try {
      const res = await applyBloodTestCoupon(c)
      setAppliedCoupon({ code: res.data.coupon_code, discount: res.data.discount_amount })
      setCouponCode('')
    } catch (err: any) {
      const msg = err?.data?.detail || err?.message || 'Invalid coupon code.'
      setCouponError(msg)
    } finally {
      setCouponLoading(false)
    }
  }

  async function handleRemoveCoupon() {
    setCouponLoading(true)
    try {
      await removeBloodTestCoupon()
      setAppliedCoupon(null)
      setCouponError(null)
    } finally {
      setCouponLoading(false)
    }
  }

  const { total } = getCheckoutPriceSummary(items, {
    thyrocarePricing: session.thyrocarePricing,
    netPayableAmount: session.netPayableAmount,
    groups: session.groups,
    pricingSnapshotKey: session.pricingSnapshotKey,
  })
  const couponAmt = appliedCoupon?.discount ?? 0
  const effectiveTotal = Math.max(0, total - couponAmt)

  async function handlePlaceOrder() {
    if (placing) return
    setPlacing(true)
    setError(null)
    try {
      // Final Thyrocare validation gate (new flow): all groups must have address + slot.
      const freshGroups = await fetchActiveGroups().catch(() => [])
      if (freshGroups.length > 0) {
        const pruned = filterGroupsToMatchCartItems(freshGroups, items)
        if (pruned.length > 0) onSessionUpdate({ groups: pruned })
        const missingAddress = pruned.some(g => g.address_id == null || Number(g.address_id) <= 0)
        const missingSlot = pruned.some(g => !String(g.appointment_date ?? '').trim() || !String(g.appointment_start_time ?? '').trim())
        if (missingAddress) {
          setPlacing(false)
          navigate('/address', { state: { checkoutBlockReason: 'Please select an address for all selected tests before payment.' } })
          return
        }
        if (missingSlot) {
          setPlacing(false)
          navigate('/timeslot', { state: { checkoutBlockReason: 'Please select a time slot for all selected tests before payment.' } })
          return
        }
      } else if (groups.length > 0) {
        const missingAddress = groups.some(g => g.address_id == null || Number(g.address_id) <= 0)
        const missingSlot = groups.some(g => !String(g.appointment_date ?? '').trim() || !String(g.appointment_start_time ?? '').trim())
        if (missingAddress) {
          setPlacing(false)
          navigate('/address', { state: { checkoutBlockReason: 'Please select an address for all selected tests before payment.' } })
          return
        }
        if (missingSlot) {
          setPlacing(false)
          navigate('/timeslot', { state: { checkoutBlockReason: 'Please select a time slot for all selected tests before payment.' } })
          return
        }
      }

      // Place order: `{ cart_id }` only. Thyrocare (addressLine1, etc.) is sent server-side after payment is confirmed.
      const cartView = await fetchCart().catch((err: unknown) => {
        console.error('fetchCart failed:', err)
        return { cartId: null as number | null, items: [] as CartItemAPI[] }
      })
      const cartId =
        cartView.cartId ??
        cartView.items[0]?.cart_id ??
        null
      if (!cartId) {
        throw new Error('Cart not found. Please go back and try again.')
      }

      const orderRes = await createOrder({ cart_id: cartId })

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: Math.round(orderRes.amount * 100),
        currency: 'INR',
        name: 'Nucleotide',
        description: items.map(i => i.name).join(', '),
        order_id: orderRes.razorpay_order_id,
        modal: {
          ondismiss: () => {
            setPlacing(false)
            setError('Payment cancelled. Please try again.')
          },
        },
        handler: async (response: {
          razorpay_payment_id: string
          razorpay_order_id: string
          razorpay_signature: string
        }) => {
          let verifyRes: Awaited<ReturnType<typeof verifyPayment>> | null = null
          try {
            verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: orderRes.order_id,
            })
          } catch {
            if (!import.meta.env.DEV) {
              setError('Payment could not be verified. Please contact support with your payment details.')
              setPlacing(false)
              return
            }
          }
          orderPlacedRef.current = true
          onOrderComplete()
          const confirmationPayload = {
            orderId: orderRes.order_id,
            orderNumber: verifyRes?.order_number || orderRes.order_number || null,
            slotDay,
            slotTime,
            items: items.map(i => ({ name: i.name, quantity: i.quantity })),
            address: address ? `${address.address_label} — ${address.street_address}, ${address.city} - ${address.postal_code}` : null,
            amountPaid: effectiveTotal,
          }
          try {
            sessionStorage.setItem('nucleotide_last_confirmation_v1', JSON.stringify(confirmationPayload))
          } catch {
            /* ignore */
          }
          navigate('/confirmation', {
            state: {
              ...confirmationPayload,
            },
          })
        },
        prefill: {},
        theme: { color: '#8B5CF6' },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', (resp: any) => {
        setError(resp?.error?.description ?? 'Payment failed. Please try again.')
        setPlacing(false)
      })
      rzp.open()
    } catch (err: any) {
      console.error('Place order error:', err)
      const details = err?.data?.details
      const detailMsg =
        Array.isArray(details) && details.length > 0
          ? details.map((d: { message?: string; field?: string }) => d.message || d.field).filter(Boolean).join(' · ')
          : ''
      const base =
        err?.message?.includes('Cart not found') ? err.message : err?.data?.message ?? 'Failed to initiate payment. Please try again.'
      setError(detailMsg ? `${base} (${detailMsg})` : base)
      setPlacing(false)
    }
  }

  return (
    <div className="payment-page-root" style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins, sans-serif', overflowX: 'hidden' }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" cartCount={cartCount} hideSearchOnMobile onCtaClick={() => navigate('/cart')} />

      {/* Breadcrumb (matches Figma mobile checkout) */}
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
        <span style={{ fontSize: 12, color: '#828282', cursor: 'pointer' }} onClick={() => navigate('/')}>Tests</span>
        <span style={{ fontSize: 12, color: '#828282' }}>›</span>
        <span style={{ fontSize: 12, color: '#101129', fontWeight: 400 }}>Checkout</span>
      </div>

      <CheckoutStepper activeStep={3} />

      <div className="checkout-layout" style={{
        display: 'flex', flexWrap: 'wrap', gap: 28,
        padding: '0 clamp(16px, 4vw, 56px) 60px',
        maxWidth: 1700, margin: '0 auto',
        alignItems: 'flex-start', boxSizing: 'border-box', width: '100%',
      }}>
        {/* Left column */}
        <div className="payment-leftcol" style={{ flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Order Summary card */}
          <div className="payment-card" style={CARD}>
            <div className="payment-card-header" style={SECTION_HEADER}>Order Summary</div>
            <div className="payment-card-body" style={{ padding: '16px 20px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.length > 0 && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map((it, idx) => {
                      const qty = Math.max(1, Math.floor(Number(it.quantity) || 1))
                      const lineTotal = parseMoney(it.price) * qty
                      return (
                        <div
                          key={`${it.thyrocareProductId ?? it.name}-${idx}`}
                          style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}
                        >
                          <div style={{ fontSize: 12, color: '#161616', fontFamily: 'Poppins, sans-serif', lineHeight: '20px', flex: 1, minWidth: 0 }}>
                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {it.name}
                            </span>
                            <span style={{ color: '#828282', fontFamily: 'Inter, sans-serif' }}>× {qty}</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#161616', fontFamily: 'Poppins, sans-serif', lineHeight: '20px', whiteSpace: 'nowrap' }}>
                            ₹{Math.round(lineTotal)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ height: 0, borderTop: '1px solid #E7E1FF' }} />
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#161616', fontFamily: 'Poppins, sans-serif', lineHeight: '20px' }}>
                <span>Subtotal({patientCount} item{patientCount !== 1 ? 's' : ''})</span>
                <span>₹{total}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'Poppins, sans-serif', lineHeight: '20px' }}>
                <span style={{ color: '#161616' }}>You Save</span>
                <span style={{ color: '#41C9B3' }}>{couponAmt > 0 ? `-₹${couponAmt}` : '₹0'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'Poppins, sans-serif', lineHeight: '20px' }}>
                <span style={{ color: '#161616' }}>Home Collection</span>
                <span style={{ color: '#41C9B3' }}>FREE</span>
              </div>

              <div style={{ height: 0, borderTop: '1px solid #E7E1FF', marginTop: 2 }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif', lineHeight: '20px', letterSpacing: '-0.32px' }}>
                <span>Total</span>
                <span>₹{effectiveTotal}</span>
              </div>
            </div>
          </div>

          {/* Collection Detail card */}
          <div className="payment-card" style={CARD}>
            <div className="payment-card-header" style={SECTION_HEADER}>Contact Details</div>
            <div className="payment-card-body" style={{ padding: '16px 20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="#8B5CF6"/>
                </svg>
                <div>
                  <div style={{ fontSize: 12, color: '#161616', fontFamily: 'Poppins, sans-serif', lineHeight: '20px' }}>
                    {address?.address_label ?? 'Home Collection'}
                  </div>
                  {address ? (
                    <div style={{ fontSize: 12, color: '#828282', fontFamily: 'Inter, sans-serif', lineHeight: '20px', marginTop: 2 }}>
                      {address.street_address}{address.landmark ? `, ${address.landmark}` : ''}<br />
                      {address.locality}, {address.city}, {address.state} - {address.postal_code}
                    </div>
                  ) : collectionAddressId != null ? (
                    <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter, sans-serif', marginTop: 6 }}>
                      Could not load this address from your profile. Go back to the Address step and save again.
                    </div>
                  ) : groups.length > 0 ? (
                    <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter, sans-serif', marginTop: 6 }}>
                      Cart group has no address yet. Go back to Address and continue.
                    </div>
                  ) : null}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                  <rect x="2" y="6" width="20" height="16" rx="2" stroke="#8B5CF6" strokeWidth="2"/>
                  <path d="M8 2v4M16 2v4M2 10h20" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <div>
                  <div style={{ fontSize: 12, color: '#161616', fontFamily: 'Poppins, sans-serif', lineHeight: '20px' }}>
                    {slotDay || '—'}
                  </div>
                  <div style={{ fontSize: 12, color: '#828282', fontFamily: 'Inter, sans-serif', lineHeight: '20px' }}>
                    {slotTime || '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#DC2626', fontFamily: 'Inter, sans-serif' }}>
              {error}
            </div>
          )}

          {/* Mobile: show action panel at bottom like Figma */}
          {isMobile && (
            <div className="payment-mobile-actions">
              <OrderSummaryCard
                itemCount={patientCount}
                subtotal={total}
                savings={0}
                total={total}
                couponDiscount={couponAmt}
                onBack={() => navigate('/timeslot')}
                onContinue={handlePlaceOrder}
                continueLabel={placing ? 'Placing...' : 'Continue'}
                continueDisabled={placing}
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="checkout-summary payment-desktop-sidebar" style={{ flex: '0 1 380px', width: '100%', maxWidth: 380, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Coupon section */}
          <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #E7E1FF', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#101129', fontFamily: 'Poppins, sans-serif' }}>Apply Coupon</span>

            {appliedCoupon ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" fill="none" stroke="#16A34A" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#15803D', fontFamily: 'Inter, sans-serif' }}>{appliedCoupon.code}</span>
                  <span style={{ fontSize: 12, color: '#16A34A', fontFamily: 'Inter, sans-serif' }}>−₹{appliedCoupon.discount}</span>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  disabled={couponLoading}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#6B7280', lineHeight: 1, padding: '0 2px' }}
                  title="Remove coupon"
                >×</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null) }}
                  onKeyDown={e => { if (e.key === 'Enter') handleApplyCoupon(couponCode) }}
                  placeholder="Enter coupon code"
                  style={{ flex: 1, height: 38, borderRadius: 8, border: '1px solid #E7E1FF', padding: '0 12px', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', color: '#101129' }}
                />
                <button
                  onClick={() => handleApplyCoupon(couponCode)}
                  disabled={couponLoading || !couponCode.trim()}
                  style={{ height: 38, padding: '0 16px', borderRadius: 8, border: 'none', background: couponCode.trim() ? '#8B5CF6' : '#E7E1FF', color: couponCode.trim() ? '#fff' : '#9CA3AF', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: couponCode.trim() ? 'pointer' : 'not-allowed' }}
                >
                  {couponLoading ? '…' : 'Apply'}
                </button>
              </div>
            )}

            {couponError && (
              <span style={{ fontSize: 12, color: '#DC2626', fontFamily: 'Inter, sans-serif' }}>{couponError}</span>
            )}

            {availableCoupons.length > 0 && (
              <div>
                <button
                  onClick={() => setOffersExpanded(p => !p)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#8B5CF6', fontFamily: 'Inter, sans-serif', fontWeight: 600, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  {offersExpanded ? '▲' : '▼'} Available offers ({availableCoupons.length})
                </button>
                {offersExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    {availableCoupons.map(c => (
                      <div
                        key={c.coupon_code}
                        onClick={() => { setCouponCode(c.coupon_code); setCouponError(null); handleApplyCoupon(c.coupon_code) }}
                        style={{ border: '1px dashed #C4B5FD', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', background: '#FAFAFF' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED', fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em' }}>{c.coupon_code}</span>
                          <span style={{ fontSize: 11, color: '#8B5CF6', fontFamily: 'Inter, sans-serif', background: '#EDE9FE', borderRadius: 20, padding: '1px 8px' }}>
                            {c.discount_type === 'percentage' ? `${c.discount_value}% off` : `₹${c.discount_value} off`}
                          </span>
                        </div>
                        {c.min_order_amount > 0 && (
                          <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>Min ₹{c.min_order_amount}</div>
                        )}
                        {c.description && (
                          <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>{c.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <OrderSummaryCard
            itemCount={patientCount}
            subtotal={total}
            savings={0}
            total={total}
            couponDiscount={couponAmt}
            onContinue={handlePlaceOrder}
            continueLabel={placing ? 'Placing...' : 'Place Order'}
            continueDisabled={placing}
          />
        </div>
      </div>
    </div>
  )
}
