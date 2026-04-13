import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { TestCardProps } from '../../types'
import fileIcon from '../../assets/figma/file.svg'
import iconsIcon from '../../assets/figma/icons.svg'
import cartImg from '../../assets/figma/cart.png'

const ComprehensiveCard = React.memo(function ComprehensiveCard(props: TestCardProps) {
  const {
    name, description, price, originalPrice, offerPercent,
    tests, fasting, type, thyrocareProductId, maxBeneficiaries,
  } = props
  const navigate = useNavigate()

  function goToDetail(e?: React.MouseEvent) {
    e?.stopPropagation()
    navigate(`/test/${thyrocareProductId ?? encodeURIComponent(name)}`, {
      state: { test: props },
    })
  }

  const isPackage = type === 'Package'

  return (
    <article
      onClick={goToDetail}
      style={{
        padding: 10, background: '#fff', borderRadius: 20,
        border: '1px solid #E7E1FF', cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        boxSizing: 'border-box', height: '100%',
      }}
    >
      {/* Inner gradient area */}
      <div style={{
        background: 'linear-gradient(0deg, #E7E1FF 0%, #fff 100%)',
        borderRadius: 10, flex: 1,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Top badges row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{
            background: isPackage
              ? 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)'
              : 'linear-gradient(131deg, #101129 0%, #2A2C5B 100%)',
            borderTopLeftRadius: 10, borderBottomRightRadius: 8,
            padding: '8px 20px',
            color: '#fff', fontSize: 13, fontWeight: 500,
            fontFamily: 'Poppins, sans-serif', flexShrink: 0,
          }}>{type}</div>
          <div style={{
            background: '#fff', border: '1px solid #E7E1FF',
            borderRadius: 8, padding: '6px 10px', margin: '8px 8px 0 0',
            fontSize: 12, color: '#414141', fontFamily: 'Inter, sans-serif',
            whiteSpace: 'nowrap',
          }}>{fasting}</div>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 0, flex: 1 }}>

          {/* Price row + Add to Cart */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 28, fontWeight: 600, color: '#161616', fontFamily: 'Poppins, sans-serif', lineHeight: 1 }}>
                ₹{price}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16, color: '#828282', textDecoration: 'line-through', fontFamily: 'Poppins, sans-serif' }}>
                  ₹{originalPrice}
                </span>
                {offerPercent && (
                  <span style={{
                    background: '#E6F6F3', color: '#41C9B3',
                    border: '0.2px solid #41C9B3', borderRadius: 5,
                    padding: '2px 8px', fontSize: 14, fontWeight: 500,
                    fontFamily: 'Poppins, sans-serif',
                  }}>{offerPercent}</span>
                )}
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); goToDetail() }}
              style={{
                height: 48, padding: '0 24px',
                background: '#8B5CF6', border: 'none', borderRadius: 8,
                color: '#fff', fontSize: 16, fontWeight: 500,
                fontFamily: 'Poppins, sans-serif', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
              }}
            >
              <img src={cartImg} alt="" width={16} height={14} />
              Add to Cart
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#6D55CC', marginBottom: 20 }} />

          {/* Meta boxes */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <div style={{
              flex: 1, background: '#fff', borderRadius: 8,
              boxShadow: '0px 4px 54px rgba(136,107,249,0.10)',
              padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src={fileIcon} alt="" width={18} height={18} />
                <span style={{ fontSize: 13, color: '#828282', fontFamily: 'Inter, sans-serif' }}>Report Time:</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#161616', fontFamily: 'Inter, sans-serif', paddingLeft: 26 }}>
                within 24 hours
              </span>
            </div>
            <div style={{
              flex: 1, background: '#fff', borderRadius: 8,
              boxShadow: '0px 4px 54px rgba(136,107,249,0.10)',
              padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src={iconsIcon} alt="" width={18} height={18} />
                <span style={{ fontSize: 13, color: '#828282', fontFamily: 'Inter, sans-serif' }}>Tests included</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#161616', fontFamily: 'Inter, sans-serif', paddingLeft: 26 }}>
                {tests}
              </span>
            </div>
          </div>

          {/* Description + Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 14, color: '#828282', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
              {description}
            </p>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif', lineHeight: 1.3 }}>
              {name}
            </h3>
          </div>

        </div>
      </div>
    </article>
  )
})

export { ComprehensiveCard }
