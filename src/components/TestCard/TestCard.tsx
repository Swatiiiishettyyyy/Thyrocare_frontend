import React from 'react'
import type { TestCardProps } from '../../types'
import cartImg from '../../assets/figma/cart.png'
import fileIcon from '../../assets/figma/file.svg'
import iconsIcon from '../../assets/figma/icons.svg'

const TestCard = React.memo(function TestCard({
  name, description, price, originalPrice, offerPercent,
  tests, fasting, turnaround, type, onAddToCart,
}: TestCardProps) {
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
      minHeight: 0,
    }}>
      <div style={{
        background: 'linear-gradient(0deg, #E7E1FF 0%, #FFFFFF 100%)',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden',
      }}>
        {/* Badge row — flush corners */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <span style={{
            background: 'linear-gradient(131deg, #101129 0%, #2A2C5B 100%)',
            color: '#fff',
            fontFamily: 'Poppins,sans-serif',
            fontSize: 13, fontWeight: 600,
            padding: '6px 20px 10px 14px',
            borderTopLeftRadius: 12,
            borderBottomRightRadius: 10,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: 0,
            flexShrink: 0,
            lineHeight: 1.2,
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
            padding: '5px 12px',
            margin: '8px 8px 0 0',
            whiteSpace: 'nowrap',
            lineHeight: 1.2,
          }}>
            {fasting}
          </span>
        </div>

        {/* Card content — less top/bottom, more left/right */}
        <div style={{ padding: '20px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h3 style={{
            fontFamily: 'Poppins,sans-serif', fontSize: 19, fontWeight: 500,
            color: '#161616', margin: '20px 0 8px', lineHeight: 1.35,
          }}>
            {name}
          </h3>

          <p style={{
            fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 400,
            color: '#828282', margin: '0 0 16px', lineHeight: 1.6,
            flex: 1,
          }}>
            {description}
          </p>

          {/* Meta boxes */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{
              flex: 1, minWidth: 0, background: '#fff', borderRadius: 10,
              boxShadow: '0px 4px 24px rgba(136,107,249,0.12)',
              padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              {/* file.svg is 24×24 viewBox — render at 22px */}
              <img src={fileIcon} alt="" width={22} height={22} style={{ display: 'block', flexShrink: 0, marginTop: 2 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#828282', lineHeight: 1.4, whiteSpace: 'nowrap' }}>Report Time:</div>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#161616', fontWeight: 600, lineHeight: 1.4 }}>{turnaround}</div>
              </div>
            </div>
            <div style={{
              flex: 1, minWidth: 0, background: '#fff', borderRadius: 10,
              boxShadow: '0px 4px 24px rgba(136,107,249,0.12)',
              padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              {/* parameters icon from icons.svg */}
              <img src={iconsIcon} alt="" width={22} height={22} style={{ display: 'block', flexShrink: 0, marginTop: 2 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#828282', lineHeight: 1.4, whiteSpace: 'nowrap' }}>Parameters</div>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#161616', fontWeight: 600, lineHeight: 1.4 }}>{tests}</div>
              </div>
            </div>
          </div>

          {/* Dashed divider */}
          <div style={{ margin: '20px 0 20px' }}>
            <svg width="100%" height="1" style={{ display: 'block' }}>
              <line x1="0" y1="0" x2="100%" y2="0" stroke="#8B5CF6" strokeWidth="1.5" strokeDasharray="5 5" />
            </svg>
          </div>

          {/* Price + Button */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'nowrap' }}>
            <div>
              <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: 24, fontWeight: 500, color: '#161616', lineHeight: 1 }}>
                ₹{price}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'nowrap' }}>
                <span style={{
                  fontFamily: 'Poppins,sans-serif', fontSize: 13, fontWeight: 400,
                  color: '#828282', textDecoration: 'line-through', flexShrink: 0,
                }}>
                  ₹{originalPrice}
                </span>
                <span style={{
                  fontFamily: 'Poppins,sans-serif', fontSize: 11, fontWeight: 600,
                  color: '#41C9B3', background: '#E6F6F3',
                  border: '0.5px solid #41C9B3',
                  borderRadius: 6, padding: '2px 7px',
                  display: 'inline-flex', alignItems: 'center',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {offerPercent}
                </span>
              </div>
            </div>
            <button onClick={onAddToCart} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#8B5CF6', color: '#fff', border: 'none',
              borderRadius: 10, height: 48, padding: '0 24px',
              cursor: 'pointer',
              fontFamily: 'Poppins,sans-serif', fontSize: 14, fontWeight: 600,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              <img src={cartImg} alt="" style={{ width: 15, height: 14, objectFit: 'contain' }} />
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </article>
  )
})

export { TestCard }
