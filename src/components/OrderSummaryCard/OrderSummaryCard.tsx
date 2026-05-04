import { useState } from 'react'

interface OrderSummaryCardProps {
  itemCount: number
  subtotal: number
  savings: number
  total: number
  couponDiscount?: number
  onBack?: () => void
  onContinue: () => void | Promise<void>
  continueLabel?: string
  continueDisabled?: boolean
  continueReasons?: string[]
}

export default function OrderSummaryCard({
  itemCount,
  subtotal,
  savings,
  total,
  couponDiscount = 0,
  onBack,
  onContinue,
  continueLabel = 'Continue',
  continueDisabled = false,
  continueReasons = [],
}: OrderSummaryCardProps) {
  const finalTotal = Math.max(0, total - couponDiscount)
  const finalSavings = savings + couponDiscount
  const [showTooltip, setShowTooltip] = useState(false)
  return (
    <div className="order-summary-card" style={{
      background: 'linear-gradient(0deg, #E7E1FF 0%, white 100%)',
      boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
      borderRadius: 18,
      outline: '1px solid #E7E1FF',
      outlineOffset: '-1px',
      padding: '22px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      width: '100%',
      maxWidth: 380,
      boxSizing: 'border-box',
    }}>
      {/* Summary rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <span className="order-summary-title" style={{ fontSize: 21, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif', lineHeight: '27px' }}>
          Order Summary
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="order-summary-rowLabel" style={{ fontSize: 18, fontWeight: 400, color: '#414141', fontFamily: 'Poppins, sans-serif', lineHeight: '29px' }}>
                Subtotal({itemCount} item{itemCount !== 1 ? 's' : ''})
              </span>
              <span className="order-summary-rowValue" style={{ fontSize: 18, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif', lineHeight: '26px' }}>
                ₹{subtotal}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="order-summary-rowLabel" style={{ fontSize: 18, fontWeight: 400, color: '#414141', fontFamily: 'Poppins, sans-serif', lineHeight: '29px' }}>
                You Save
              </span>
              <span className="order-summary-rowValue order-summary-rowValue--green" style={{ fontSize: 18, fontWeight: 500, color: '#41C9B3', fontFamily: 'Poppins, sans-serif', lineHeight: '26px' }}>
                {finalSavings > 0 ? `−₹${finalSavings}` : '₹0'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="order-summary-rowLabel" style={{ fontSize: 18, fontWeight: 400, color: '#414141', fontFamily: 'Poppins, sans-serif', lineHeight: '29px' }}>
                Home Collection
              </span>
              <span className="order-summary-rowValue order-summary-rowValue--green" style={{ fontSize: 18, fontWeight: 500, color: '#41C9B3', fontFamily: 'Poppins, sans-serif', lineHeight: '26px' }}>
                FREE
              </span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 0, outline: '1px solid #E7E1FF', outlineOffset: '-0.5px' }} />
        </div>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="order-summary-totalLabel" style={{ fontSize: 18, fontWeight: 400, color: '#414141', fontFamily: 'Poppins, sans-serif', lineHeight: '29px' }}>
            Total
          </span>
          <span className="order-summary-totalValue" style={{ fontSize: 24, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif', lineHeight: '27px' }}>
            ₹{finalTotal}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {onBack && (
          <button onClick={onBack} style={{
            height: 58,
            borderRadius: 8,
            outline: '1px solid #8B5CF6',
            outlineOffset: '-1px',
            border: 'none',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif',
            fontSize: 18,
            fontWeight: 500,
            color: '#101129',
            lineHeight: '26px',
          }}>
            ‹ Back
          </button>
        )}

        <div style={{ position: 'relative' }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {showTooltip && continueDisabled && continueReasons.length > 0 && (
            <div style={{
              position: 'absolute',
              bottom: 'calc(100% + 12px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#fff',
              border: '1px solid #E7E1FF',
              borderRadius: 14,
              padding: '12px 16px',
              fontSize: 13,
              fontFamily: 'Poppins, sans-serif',
              lineHeight: '20px',
              zIndex: 100,
              boxShadow: '0px 4px 20px rgba(139,92,246,0.10)',
              pointerEvents: 'none',
              minWidth: 220,
            }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: '#8B5CF6', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Complete to continue</div>
              {continueReasons.map((reason, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: i < continueReasons.length - 1 ? 6 : 0 }}>
                  <span style={{ color: '#8B5CF6', flexShrink: 0, fontWeight: 700, fontSize: 14, lineHeight: '20px' }}>·</span>
                  <span style={{ color: '#101129' }}>{reason}</span>
                </div>
              ))}
              <div style={{
                position: 'absolute',
                bottom: -7,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 12,
                height: 7,
                overflow: 'visible',
              }}>
                <svg width="14" height="8" viewBox="0 0 14 8" fill="none" style={{ display: 'block' }}>
                  <path d="M1 0.5L7 7L13 0.5" stroke="#E7E1FF" strokeWidth="1" fill="#fff" />
                </svg>
              </div>
            </div>
          )}
          <button onClick={onContinue} disabled={continueDisabled} className="order-summary-continueBtn" style={{
            width: '100%',
            height: 58,
            borderRadius: 8,
            border: 'none',
            background: continueDisabled ? '#E7E1FF' : '#8B5CF6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            cursor: continueDisabled ? 'not-allowed' : 'pointer',
            fontFamily: 'Poppins, sans-serif',
            fontSize: 18,
            fontWeight: 500,
            color: continueDisabled ? '#828282' : 'white',
            lineHeight: '26px',
          }}>
            {continueLabel} ›
          </button>
        </div>

        <div className="order-summary-savingsRow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
          <span className="order-summary-savingsIcon" aria-hidden="true" style={{ width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 7L10.5 16.5L4 10" stroke="#41C9B3" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="order-summary-savingsText" style={{ fontFamily: 'Inter, sans-serif', fontSize: 18, fontWeight: 320, color: '#828282', lineHeight: '27px' }}>
            {finalSavings > 0
              ? `You are saving ₹${finalSavings} on this order`
              : 'No discount applied to this order'}
          </span>
        </div>
      </div>
    </div>
  )
}
