import cartActive from '../../assets/figma/checkout-pages/Frame-29323.svg'
import cartInactive from '../../assets/figma/checkout-pages/Frame-29323-3.svg'
import addressActive from '../../assets/figma/checkout-pages/Frame-29323-6.svg'
import addressInactive from '../../assets/figma/checkout-pages/Frame-29323-5.svg'
import timeSlotActive from '../../assets/figma/checkout-pages/Frame-29323-7.svg'
import timeSlotInactive from '../../assets/figma/checkout-pages/Frame-29323-8.svg'
import paymentActive from '../../assets/figma/checkout-pages/Frame-29323-10.svg'
import paymentInactive from '../../assets/figma/checkout-pages/Frame-29323-4.svg'

export interface StepperStep {
  label: string
  activeIcon: string
  inactiveIcon: string
}

interface CheckoutStepperProps {
  steps?: StepperStep[]
  activeStep: number
}

export const DEFAULT_STEPS: StepperStep[] = [
  { label: 'Cart',      activeIcon: cartActive,      inactiveIcon: cartInactive },
  { label: 'Address',   activeIcon: addressActive,   inactiveIcon: addressInactive },
  { label: 'Time Slot', activeIcon: timeSlotActive,  inactiveIcon: timeSlotInactive },
  { label: 'Payment',   activeIcon: paymentActive,   inactiveIcon: paymentInactive },
]

export default function CheckoutStepper({ steps = DEFAULT_STEPS, activeStep }: CheckoutStepperProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '32px 0 24px',
    }}>
      {steps.map((step, i) => (
        <div key={step.label} style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 13, width: 75 }}>
            <img
              src={i === activeStep ? step.activeIcon : step.inactiveIcon}
              alt={step.label}
              width={60}
              height={60}
              style={{ flexShrink: 0 }}
            />
            <span style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: 14,
              fontWeight: 500,
              color: '#414141',
              textAlign: 'center',
              lineHeight: '26px',
            }}>
              {step.label}
            </span>
          </div>

          {i < steps.length - 1 && (
            <div style={{
              width: 80,
              borderTop: '2px dashed #C4B5FD',
              marginTop: 30,
              flexShrink: 0,
            }} />
          )}
        </div>
      ))}
    </div>
  )
}
