import rect20 from '../../assets/figma/Rectangle 20.png'
import rect19 from '../../assets/figma/Rectangle 19.png'

const STEPS = [
  { num: 1, desc: 'Choose tests by organ, condition, packages' },
  { num: 2, desc: 'Schedule home sample pickup in seconds' },
  { num: 3, desc: 'Certified phlebotomist collects sample at home' },
  { num: 4, desc: 'Get clear, visual reports and track changes' },
]

export default function HowItWorks() {
  return (
    <section className="page-section home-section--howitworks" style={{ background: '#fff', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative backgrounds */}
      <img src={rect20} alt="" aria-hidden="true" className="how-works-deco how-works-deco--tl" />
      <img src={rect19} alt="" aria-hidden="true" className="how-works-deco how-works-deco--bl" />
      <img src={rect19} alt="" aria-hidden="true" className="how-works-deco how-works-deco--tr" />
      <img src={rect20} alt="" aria-hidden="true" className="how-works-deco how-works-deco--br" />

      <div className="page-inner" style={{ position: 'relative', zIndex: 1, maxWidth: 1100 }}>
        {/* Heading */}
        <div className="home-section-header">
          <h2 className="type-section" style={{ color: '#101129', margin: 0, textAlign: 'center' }}>
            How It Works
          </h2>
          <p className="type-lead" style={{ color: '#828282', margin: 0, textAlign: 'center', maxWidth: 'min(720px, 100%)' }}>
            Built to make lab testing simple, reliable, and easy to understand.
          </p>
        </div>

        {/* Steps — badge overlaps top of card */}
        <div className="grid-4 how-it-works-grid">
          {STEPS.map(step => (
            <div key={step.num} className="how-works-step">
              {/* Badge — centered, overlapping top edge */}
              <div className="how-works-step__badge">
                Step {step.num}
              </div>

              {/* Card */}
              <div className="how-works-step__card">
                <p className="how-works-step__desc">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
