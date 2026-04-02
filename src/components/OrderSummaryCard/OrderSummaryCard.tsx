interface OrderSummaryCardProps {
  itemCount: number
  subtotal: number
  savings: number
  total: number
  onBack?: () => void
  onContinue: () => void
  continueLabel?: string
}

export default function OrderSummaryCard({
  itemCount,
  subtotal,
  savings,
  total,
  onBack,
  onContinue,
  continueLabel = 'Continue',
}: OrderSummaryCardProps) {
  return (
    <div style={{
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
        <span style={{ fontSize: 21, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif', lineHeight: '27px' }}>
          Order Summary
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 18, fontWeight: 400, color: '#414141', fontFamily: 'Poppins, sans-serif', lineHeight: '29px' }}>
                Subtotal({itemCount} item{itemCount !== 1 ? 's' : ''})
              </span>
              <span style={{ fontSize: 18, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif', lineHeight: '26px' }}>
                ₹{subtotal}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 18, fontWeight: 400, color: '#414141', fontFamily: 'Poppins, sans-serif', lineHeight: '29px' }}>
                You Save
              </span>
              <span style={{ fontSize: 18, fontWeight: 500, color: '#41C9B3', fontFamily: 'Poppins, sans-serif', lineHeight: '26px' }}>
                -₹{savings}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 18, fontWeight: 400, color: '#414141', fontFamily: 'Poppins, sans-serif', lineHeight: '29px' }}>
                Home Collection
              </span>
              <span style={{ fontSize: 18, fontWeight: 500, color: '#41C9B3', fontFamily: 'Poppins, sans-serif', lineHeight: '26px' }}>
                FREE
              </span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 0, outline: '1px solid #E7E1FF', outlineOffset: '-0.5px' }} />
        </div>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 400, color: '#414141', fontFamily: 'Poppins, sans-serif', lineHeight: '29px' }}>
            Total
          </span>
          <span style={{ fontSize: 24, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif', lineHeight: '27px' }}>
            ₹{total}
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

        <button onClick={onContinue} style={{
          height: 58,
          borderRadius: 8,
          border: 'none',
          background: '#8B5CF6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          cursor: 'pointer',
          fontFamily: 'Poppins, sans-serif',
          fontSize: 18,
          fontWeight: 500,
          color: 'white',
          lineHeight: '26px',
        }}>
          {continueLabel} ›
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
          <span style={{ fontSize: 18 }}>✅</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 18, fontWeight: 320, color: '#828282', lineHeight: '27px' }}>
            You are saving ₹{savings} on this order
          </span>
        </div>
      </div>
    </div>
  )
}
