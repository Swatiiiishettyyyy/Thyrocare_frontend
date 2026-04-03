import { useState } from 'react'
import profileIcon from '../assets/figma/checkout-pages/profile.svg'
import familyIcon from '../assets/figma/checkout-pages/family.svg'
import selectIcon from '../assets/figma/checkout-pages/select.svg'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'
import { CheckoutStepper } from '../components/CheckoutStepper'
import { OrderSummaryCard } from '../components/OrderSummaryCard'
import type { CartItem } from '../types'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/' },
  { label: 'Reports', href: '#' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '#' },
]

interface AddressPageProps {
  items: CartItem[]
}

export default function AddressPage({ items }: AddressPageProps) {
  const navigate = useNavigate()
  const [forSelf, setForSelf] = useState(true)

  const subtotal = items.length > 0 ? items.reduce((s, i) => s + parseInt(i.originalPrice) * i.quantity, 0) : 599
  const total = items.length > 0 ? items.reduce((s, i) => s + parseInt(i.price) * i.quantity, 0) : 399
  const savings = subtotal - total

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Poppins', sans-serif" }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => navigate('/cart')} />

      {/* Stepper */}
      <CheckoutStepper activeStep={1} />

      {/* Content */}
      <div style={{ display: 'flex', gap: 32, padding: '0 56px 60px', maxWidth: 1600, margin: '0 auto', alignItems: 'flex-start' }}>

        {/* Left */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Who is this test for */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <span style={{ fontSize: 16, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif', lineHeight: '26px' }}>
              Who is this test for?
            </span>
            <div style={{ display: 'flex', gap: 18 }}>
              {/* For Myself */}
              <button onClick={() => setForSelf(true)} style={{
                flex: 1, height: 80, position: 'relative',
                background: '#fff', boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
                borderRadius: 20, outline: `1px solid ${forSelf ? '#E7E1FF' : '#8B5CF6'}`,
                outlineOffset: '-1px', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 118, background: '#E7E1FF', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={profileIcon} alt="person" width={48} height={48} style={{ borderRadius: '50%' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif' }}>For Myself</span>
                    <span style={{ fontSize: 13, fontWeight: 400, color: '#828282', fontFamily: 'Inter, sans-serif' }}>Book for Self</span>
                  </div>
                </div>
              </button>

              {/* For Family Members */}
              <button onClick={() => setForSelf(false)} style={{
                flex: 1, height: 80, position: 'relative',
                background: '#fff', boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
                borderRadius: 20, outline: `1px solid ${!forSelf ? '#8B5CF6' : '#E7E1FF'}`,
                outlineOffset: '-1px', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 118, background: !forSelf ? '#8B5CF6' : '#E7E1FF', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={familyIcon} alt="family" width={48} height={48} style={{ borderRadius: '50%' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif' }}>For Family Members</span>
                    <span style={{ fontSize: 13, fontWeight: 400, color: '#828282', fontFamily: 'Inter, sans-serif' }}>1 Members</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Select Family Member */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 16, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif' }}>Select Family Member</span>
              <button style={{ padding: '4px 14px', borderRadius: 56, outline: '1px solid #8B5CF6', outlineOffset: '-1px', border: 'none', background: 'transparent', fontSize: 14, fontFamily: 'Inter, sans-serif', color: '#101129', cursor: 'pointer' }}>Add New +</button>
            </div>
            <div style={{ width: '100%', height: 80, position: 'relative', background: '#fff', boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)', borderRadius: 20, outline: '1px solid #E7E1FF', outlineOffset: '-1px', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <input type="radio" name="familyMember" defaultChecked style={{ width: 20, height: 20, accentColor: '#8B5CF6', flexShrink: 0, cursor: 'pointer' }} />
                <div style={{ width: 48, height: 48, borderRadius: 118, background: '#F9F9F9', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={selectIcon} alt="avatar" width={48} height={48} style={{ borderRadius: '50%' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 15, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif' }}>Ananya Sharma</span>
                    <span style={{ background: '#E7E1FF', borderRadius: 122, padding: '1px 10px', fontSize: 13, fontFamily: 'Inter, sans-serif', color: '#8B5CF6' }}>Spouse</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', color: '#828282' }}>30 Year</span>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#D9D9D9' }} />
                    <span style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', color: '#828282' }}>Female</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Select Collection Address */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 16, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif' }}>Select Collection Address</span>
              <button style={{ padding: '4px 14px', borderRadius: 56, outline: '1px solid #8B5CF6', outlineOffset: '-1px', border: 'none', background: 'transparent', fontSize: 14, fontFamily: 'Inter, sans-serif', color: '#101129', cursor: 'pointer' }}>Add New +</button>
            </div>
            <div style={{ width: '100%', position: 'relative', background: '#fff', boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)', borderRadius: 20, outline: '1px solid #E7E1FF', outlineOffset: '-1px', padding: '16px 16px 16px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <input type="radio" name="address" defaultChecked style={{ width: 20, height: 20, accentColor: '#8B5CF6', flexShrink: 0, marginTop: 4, cursor: 'pointer' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 15, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif' }}>Home</span>
                    <span style={{ background: '#E7E1FF', borderRadius: 122, padding: '1px 10px', fontSize: 13, fontFamily: 'Inter, sans-serif', color: '#8B5CF6' }}>Default</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', color: '#828282', lineHeight: '1.6' }}>
                      123 Main Street, Apartment 4B<br />Mumbai, Maharashtra - 400001
                    </span>
                    <span style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', color: '#101129' }}>+91 9768767765</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Order Summary */}
        <OrderSummaryCard
          itemCount={items.length}
          subtotal={subtotal}
          savings={savings}
          total={total}
          onBack={() => navigate('/cart')}
          onContinue={() => navigate('/timeslot')}
        />

      </div>
    </div>
  )
}
