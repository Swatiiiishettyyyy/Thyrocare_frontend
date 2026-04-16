import { useState, useEffect } from 'react'
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
  fetchPriceBreakup,
  getCheckoutPriceSummary,
  checkoutPricingSnapshotKey,
  filterGroupsToMatchCartItems,
  type CartGroup,
  type CartItemAPI,
} from '../api/cart'
import { fetchAddresses } from '../api/address'
import type { Address } from '../api/address'
import { fetchMembers } from '../api/member'
import type { Member } from '../api/member'
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

const SUMMARY_LIKE_CARD: React.CSSProperties = {
  background: 'linear-gradient(0deg, #E7E1FF 0%, white 100%)',
  boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
  borderRadius: 18,
  outline: '1px solid #E7E1FF',
  outlineOffset: '-1px',
  padding: 'clamp(16px, 1.2vw, 18px) clamp(16px, 1.4vw, 20px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  width: '100%',
  maxWidth: 380,
  boxSizing: 'border-box',
}

const SUMMARY_LIKE_TITLE: React.CSSProperties = {
  fontSize: 21,
  fontWeight: 500,
  color: '#161616',
  fontFamily: 'Poppins, sans-serif',
  lineHeight: '27px',
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
  const { groups, netPayableAmount, thyrocarePricing } = session
  const firstGroup = groups[0]
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
  const [members, setMembers] = useState<Member[]>([])

  /** First non-null address_id across groups (checkout often shares one address). */
  const collectionAddressId =
    groups.map(g => g.address_id).find(id => id != null && Number(id) > 0) ?? null

  // If session groups are missing address_id or slot (refresh / race), pull latest from active-all once resolved.
  useEffect(() => {
    if (items.length === 0) return
    const hasSlot = groups.some(
      g => String(g.appointment_date ?? '').trim() && String(g.appointment_start_time ?? '').trim(),
    )
    const hasAddressId = groups.some(g => g.address_id != null && Number(g.address_id) > 0)
    if (hasSlot && hasAddressId) return

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
    return () => {
      cancelled = true
    }
  }, [items, groups, onSessionUpdate])

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
    fetchMembers().then(setMembers).catch(() => setMembers([]))
  }, [])

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    const ids = session.groups.map(g => g.group_id).filter(Boolean)
    if (ids.length === 0) return
    const snap = checkoutPricingSnapshotKey(session.groups, items)
    if (session.pricingSnapshotKey === snap && session.thyrocarePricing) return
    let cancelled = false
    fetchPriceBreakup(ids)
      .then(pricing => {
        if (cancelled) return
        onSessionUpdate({
          netPayableAmount: pricing.net_payable_amount,
          thyrocarePricing: pricing,
          pricingSnapshotKey: checkoutPricingSnapshotKey(session.groups, items),
        })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [session.groups, session.pricingSnapshotKey, session.thyrocarePricing, items, onSessionUpdate])

  const { subtotal, savings, total } = getCheckoutPriceSummary(items, {
    thyrocarePricing,
    netPayableAmount,
    groups: session.groups,
    pricingSnapshotKey: session.pricingSnapshotKey,
  })

  function memberLabel(id: number): string {
    const m = members.find(x => x.member_id === id)
    return m ? `${m.name} (${m.relation})` : `Member #${id}`
  }

  async function handlePlaceOrder() {
    if (placing) return
    setPlacing(true)
    setError(null)
    try {
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
        key: 'rzp_test_SaSxoTBvjZTK6C',
        amount: orderRes.amount,
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
          try {
            await verifyPayment({
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
          onOrderComplete()
          navigate('/confirmation', {
            state: {
              orderId: orderRes.order_id,
              slotDay,
              slotTime,
              itemNames: items.map(i => i.name),
              address: address ? `${address.address_label} — ${address.street_address}, ${address.city} - ${address.postal_code}` : null,
              amountPaid: total,
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
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Poppins, sans-serif', overflowX: 'hidden' }}>
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
                  <div style={{ fontSize: 12, color: '#161616', fontFamily: 'Poppins, sans-serif', lineHeight: '20px' }}>
                    {items[0].name} x {items[0].quantity}
                  </div>
                  <div style={{ height: 0, borderTop: '1px solid #E7E1FF' }} />
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#161616', fontFamily: 'Poppins, sans-serif', lineHeight: '20px' }}>
                <span>Subtotal({items.length} item{items.length !== 1 ? 's' : ''})</span>
                <span>₹{subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'Poppins, sans-serif', lineHeight: '20px' }}>
                <span style={{ color: '#161616' }}>You Save</span>
                <span style={{ color: '#41C9B3' }}>{savings > 0 ? `-₹${savings}` : '₹0'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'Poppins, sans-serif', lineHeight: '20px' }}>
                <span style={{ color: '#161616' }}>Home Collection</span>
                <span style={{ color: '#41C9B3' }}>FREE</span>
              </div>

              <div style={{ height: 0, borderTop: '1px solid #E7E1FF', marginTop: 2 }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif', lineHeight: '20px', letterSpacing: '-0.32px' }}>
                <span>Total</span>
                <span>₹{total}</span>
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
                itemCount={items.length}
                subtotal={subtotal}
                savings={savings}
                total={total}
                onBack={() => navigate('/timeslot')}
                onContinue={handlePlaceOrder}
                continueLabel={placing ? 'Placing...' : 'Continue'}
                continueDisabled={placing}
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="checkout-summary payment-desktop-sidebar" style={{ flex: '0 1 380px', width: '100%', maxWidth: 380, boxSizing: 'border-box' }}>
          <OrderSummaryCard
            itemCount={items.length}
            subtotal={subtotal}
            savings={savings}
            total={total}
            onContinue={handlePlaceOrder}
            continueLabel={placing ? 'Placing...' : 'Place Order'}
            continueDisabled={placing}
          />
        </div>
      </div>
    </div>
  )
}
