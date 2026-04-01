import React from 'react'
import type { TestCardProps } from '../../types'
import cartImg from '../../assets/figma/cart.png'

const ReportIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="2" width="18" height="20" rx="3" fill="#7C5CFC" opacity="0.15"/>
    <path d="M7 7h10M7 11h10M7 15h6" stroke="#7C5CFC" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
)

const ParameterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="7" height="7" rx="1.5" fill="#7C5CFC"/>
    <rect x="14" y="3" width="7" height="7" rx="1.5" fill="#7C5CFC"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5" fill="#7C5CFC"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#7C5CFC"/>
  </svg>
)

const TestCard = React.memo(function TestCard({
  name, description, price, originalPrice, offerPercent,
  tests, fasting, turnaround, type, onAddToCart,
}: TestCardProps) {
  const isPackage = type === 'Package'

  return (
    <article style={{
      background: '#FFFFFF',
      borderRadius: 20,
      border: '1px solid #E7E1FF',
      padding: 10,
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      height: '100%',
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #E7E1FF 36%, #FFFFFF 80.05%)',
        borderRadius: 10,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}>
        {/* Badge row — flush to top */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <span style={{
            background: isPackage ? '#7C5CFC' : '#1B1F3B',
            color: '#fff',
            fontFamily: 'Poppins,sans-serif',
            fontSize: 14, fontWeight: 600,
            padding: '8px 23px 13px 12px',
            borderRadius: '10px 0 10px 0px',
            flexShrink: 0,
          }}>
            {type}
          </span>
          <span style={{
            fontFamily: 'Poppins,sans-serif',
            fontSize: 12, fontWeight: 500,
            color: '#374151',
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            padding: '6px 14px',
            margin: '10px 19px 0 0',
            whiteSpace: 'nowrap',
          }}>
            {fasting}
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: '10px 20px 12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* spacing above title */}
          <h3 style={{
            fontFamily: 'Poppins,sans-serif', fontSize: 20, fontWeight: 500,
            color: '#111827', margin: '30px 0 10px', lineHeight: 1.3,
          }}>
            {name}
          </h3>

          {/* spacing below description */}
          <p style={{
            fontFamily: 'Poppins,sans-serif', fontSize: 14,
            color: '#6B7280', margin: '10px 0 18px', lineHeight: 1.6,
            minHeight: 48,
          }}>
            {description}
          </p>

          {/* Meta boxes */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <ReportIcon />
              <div>
                <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: 13, color: '#9CA3AF' }}>Report Time:</div>
                <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: 13, fontWeight: 500, color: '#111827' }}>{turnaround}</div>
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              
              <div>
                <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: 13, color: '#9CA3AF' }}>Parameters</div>
                <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: 13, fontWeight: 500, color: '#111827' }}>{tests}</div>
              </div>
            </div>
          </div>

          {/* Dashed divider */}
          <div style={{ margin: '35px 0 18px' }}>
            <svg width="100%" height="1" style={{ display: 'block' }}>
              <line x1="0" y1="0" x2="100%" y2="0" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="4 4" />
            </svg>
          </div>

          {/* Price + Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: 30, fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                ₹{price}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ fontFamily: 'Poppins,sans-serif', fontSize: 16, fontWeight: 500, color: '#828282', textDecoration: 'line-through' }}>
                  ₹{originalPrice}
                </span>
                <span style={{
                  fontFamily: 'Poppins,sans-serif', fontSize: 13, fontWeight: 600,
                  color: '#0D9488', background: '#CCFBF1',
                  borderRadius: 6, padding: '4px 10px',
                  display: 'inline-flex', alignItems: 'center',
                }}>
                  {offerPercent}
                </span>
              </div>
            </div>
            <button onClick={onAddToCart} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#8B5CF6', color: '#fff', border: 'none',
              borderRadius: 8, height: 48, padding: '15px 30px 20px',
              cursor: 'pointer',
              fontFamily: 'Poppins,sans-serif', fontSize: 14, fontWeight: 600,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              <img src={cartImg} alt="" style={{ width: 18, height: 16, objectFit: 'contain' }} />
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </article>
  )
})

export { TestCard }
