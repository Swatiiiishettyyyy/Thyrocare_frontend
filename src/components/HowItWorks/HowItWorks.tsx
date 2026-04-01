const STEPS = [
  { num: 1, desc: 'Choose tests by organ, condition, packages' },
  { num: 2, desc: 'Schedule home sample pickup in seconds' },
  { num: 3, desc: 'Certified phlebotomist collects sample at home' },
  { num: 4, desc: 'Get clear, visual reports and track changes over time.' },
]

export default function HowItWorks() {
  return (
    <section style={{ background: '#fff', padding: '60px 110px' }}>
      <div style={{ maxWidth: 1700, margin: '0 auto' }}>
        {/* Heading */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'Poppins,sans-serif', fontSize: 36, fontWeight: 600, color: '#7C5CFC', margin: 0, textAlign: 'center' }}>
            How It Works
          </h2>
          <p style={{ fontFamily: 'Poppins,sans-serif', fontSize: 15, color: '#828282', margin: 0, textAlign: 'center', maxWidth: 560 }}>
            Built to make lab testing simple, reliable, and easy to understand.
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
          {STEPS.map(step => (
            <div key={step.num} style={{
              background: '#fff',
              border: '1.5px solid #E5E7EB',
              borderRadius: 20,
              padding: '28px 24px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              position: 'relative',
            }}>
              {/* Step badge */}
              <div style={{
                alignSelf: 'flex-start',
                background: '#1B1F3B',
                color: '#fff',
                fontFamily: 'Poppins,sans-serif',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 100,
                padding: '6px 18px',
              }}>
                Step {step.num}
              </div>

              {/* Description */}
              <p style={{
                fontFamily: 'Poppins,sans-serif',
                fontSize: 15,
                color: '#374151',
                margin: 0,
                lineHeight: 1.6,
                fontWeight: 400,
              }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
