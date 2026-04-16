import React from 'react'

import tickIcon from '../../assets/figma/order-details/icon.svg'

export type UploadReportStepState = 'todo' | 'active' | 'done'

export type UploadReportStepperProps = {
  /** 1-based active step */
  currentStep: 1 | 2 | 3
}

const STEPS = [
  { num: 1 as const, label: 'Upload' },
  { num: 2 as const, label: 'Report Details' },
  { num: 3 as const, label: 'Review' },
] as const

function getStepState(stepNum: 1 | 2 | 3, currentStep: 1 | 2 | 3): UploadReportStepState {
  if (stepNum < currentStep) return 'done'
  if (stepNum === currentStep) return 'active'
  return 'todo'
}

function StepBubble({
  stepNum,
  label,
  state,
}: {
  stepNum: 1 | 2 | 3
  label: string
  state: UploadReportStepState
}) {
  const bubbleBg = state === 'done' ? '#8B5CF6' : '#E7E1FF'
  const textColor = state === 'done' ? '#fff' : '#101129'

  const content =
    state === 'done' ? (
      <img src={tickIcon} alt="" style={{ width: 16, height: 12, display: 'block' }} />
    ) : (
      stepNum
    )

  return (
    <div
      style={{
        width: 120,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'clamp(10px, 1.6vmin, 13px)',
      }}
    >
      <div
        style={{
          width: 'clamp(52px, 6.6vmin, 60px)',
          height: 'clamp(52px, 6.6vmin, 60px)',
          borderRadius: 999,
          background: bubbleBg,
          display: 'grid',
          placeItems: 'center',
          color: textColor,
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 500,
          fontSize: 'clamp(16px, 1.7vmin, 20px)',
          lineHeight: 'clamp(20px, 2.2vmin, 26px)',
        }}
        aria-current={state === 'active' ? 'step' : undefined}
      >
        {content}
      </div>
      <div
        style={{
          fontFamily: 'Poppins, sans-serif',
          fontSize: 'clamp(14px, 1.7vmin, 20px)',
          fontWeight: 500,
          color: '#414141',
          textAlign: 'center',
          lineHeight: 'clamp(20px, 2.2vmin, 26px)',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
    </div>
  )
}

export function UploadReportStepper({ currentStep }: UploadReportStepperProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 'min(675px, 100%)' }}>
        <div style={{ position: 'relative', height: 'clamp(92px, 10vmin, 114px)' }}>
          {/* Single connector line (between step 1 and step 3) */}
          <div
            style={{
              position: 'absolute',
              top: 'clamp(26px, 3.3vmin, 30px)',
              left: '16%',
              right: '16%',
              height: 1,
              background: '#E7E1FF',
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: 'clamp(64px, 9vw, 125px)',
            }}
          >
            {STEPS.map((s) => (
              <StepBubble
                key={s.num}
                stepNum={s.num}
                label={s.label}
                state={getStepState(s.num, currentStep)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

