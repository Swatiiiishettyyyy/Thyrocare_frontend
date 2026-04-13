import cartActive from '../../assets/figma/checkout-pages/active_cart.svg'
import cartInactive from '../../assets/figma/checkout-pages/Frame-29323.svg'
import completedIcon from '../../assets/figma/checkout-pages/active_cart.svg'
import addressActive from '../../assets/figma/checkout-pages/active_location.svg'
import addressInactive from '../../assets/figma/checkout-pages/inactive_location.svg'
import timeSlotActive from '../../assets/figma/checkout-pages/active_timeslot.svg'
import timeSlotInactive from '../../assets/figma/checkout-pages/inactive_timeslot.svg'
import paymentActive from '../../assets/figma/checkout-pages/active_payment.svg'
import paymentInactive from '../../assets/figma/checkout-pages/inactive_payment.svg'

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
    <div className="checkout-stepper" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '32px 0 24px',
    }}>
      {steps.map((step, i) => {
        const isActive = i === activeStep
        const isCompleted = i < activeStep
        const icon = isCompleted ? completedIcon : isActive ? step.activeIcon : step.inactiveIcon
        return (
          <div key={step.label} style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div className="checkout-stepper__step" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 13, width: 75 }}>
              <img
                src={icon}
                alt={step.label}
                width={60}
                height={60}
                style={{ flexShrink: 0 }}
              />
              <span style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: 14,
                fontWeight: 500,
                color: isActive ? '#8B5CF6' : '#414141',
                textAlign: 'center',
                lineHeight: '26px',
              }}>
                {step.label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div className="checkout-stepper__connector" style={{
                width: 80,
                borderTop: `2px ${isCompleted ? 'solid' : 'dashed'} ${isCompleted ? '#8B5CF6' : '#C4B5FD'}`,
                marginTop: 30,
                flexShrink: 0,
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
