import { useNavigate } from 'react-router-dom'
import type { CartItem } from '../types'
import { Navbar } from '../components'
import { CheckoutStepper, DEFAULT_STEPS } from '../components/CheckoutStepper'
import { OrderSummaryCard } from '../components/OrderSummaryCard'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/' },
  { label: 'Reports', href: '#' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '#' },
]

interface CartPageProps {
  items: CartItem[]
  onUpdateQty: (name: string, delta: number) => void
}

export default function CartPage({ items, onUpdateQty }: CartPageProps) {
  const navigate = useNavigate()
  const subtotal = items.length > 0 ? items.reduce((sum, i) => sum + parseInt(i.originalPrice) * i.quantity, 0) : 599
  const total = items.length > 0 ? items.reduce((sum, i) => sum + parseInt(i.price) * i.quantity, 0) : 399
  const savings = subtotal - total

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Poppins', sans-serif" }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} />

      {/* Breadcrumb */}
      <div style={{ padding: '14px 56px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8 }}>
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
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 20 }}>
            Your Cart Items({items.length} item{items.length !== 1 ? 's' : ''})
          </h2>
          {items.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
              Your cart is empty
            </div>
          ) : (
            items.map((item) => (
              <div key={item.name} style={{
                background: '#fff',
                borderRadius: 20,
                outline: '1px solid #E7E1FF',
                boxShadow: '0px 4px 27.3px 0px rgba(0,0,0,0.05)',
                padding: '27px 34px',
                marginBottom: 16,
              }}>
                {/* Row 1: Name + type badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontFamily: 'Poppins,sans-serif', fontSize: 16, fontWeight: 500, color: '#161616', flex: 1 }}>{item.name}</span>
                  <span style={{
                    fontFamily: 'Poppins,sans-serif', fontSize: 13, fontWeight: 400, color: '#101129',
                    background: '#E7E1FF', borderRadius: 122, padding: '4px 14px',
                    outline: '1px solid #E7E1FF', whiteSpace: 'nowrap',
                  }}>{item.type}</span>
                </div>

                {/* Divider */}
                <div style={{ height: 0, outline: '1px solid #E7E1FF', marginBottom: 20 }} />

                {/* Row 2: No of Patients + Price */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <span style={{ fontFamily: 'Poppins,sans-serif', fontSize: 14, fontWeight: 400, color: '#828282' }}>No of Patients</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                      <button onClick={() => onUpdateQty(item.name, -1)} style={{
                        width: 42, height: 42, borderRadius: '50%', border: 'none',
                        background: 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)',
                        color: '#fff', fontSize: 20, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>−</button>
                      <span style={{ fontFamily: 'Poppins,sans-serif', fontSize: 20, fontWeight: 400, color: '#101129', minWidth: 12, textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => onUpdateQty(item.name, 1)} style={{
                        width: 42, height: 42, borderRadius: '50%', border: 'none',
                        background: 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)',
                        color: '#fff', fontSize: 20, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>+</button>
                    </div>
                  </div>
                  {/* Price */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'Poppins,sans-serif', fontSize: 28, fontWeight: 600, color: '#161616', lineHeight: 1 }}>₹{parseInt(item.price) * item.quantity}</span>
                    <span style={{ fontFamily: 'Poppins,sans-serif', fontSize: 16, fontWeight: 500, color: '#828282', textDecoration: 'line-through' }}>₹{parseInt(item.originalPrice) * item.quantity}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Summary */}
        <OrderSummaryCard
          itemCount={items.length}
          subtotal={subtotal}
          savings={savings}
          total={total}
          onContinue={() => navigate('/address')}
        />

      </div>
    </div>
  )
}
