import homeIcon from '../../assets/figma/Home_collection.svg'
import labsIcon from '../../assets/figma/NABL_certified_tick.svg'
import reportsIcon from '../../assets/figma/file.svg'

// compareIcon is 390×390 — extract just the icon path as inline SVG
const CompareIcon = () => (
  <svg width="24" height="24" viewBox="184 177 24 28" fill="none">
    <path d="M192.997 205.266V202.762H186.737C186.049 202.762 185.459 202.517 184.969 202.026C184.479 201.536 184.233 200.947 184.233 200.258V182.731C184.233 182.043 184.479 181.453 184.969 180.963C185.459 180.472 186.049 180.227 186.737 180.227H192.997V177.723H195.501V205.266H192.997ZM198.005 182.731V180.227H204.264C204.953 180.227 205.542 180.472 206.033 180.963C206.523 181.453 206.768 182.043 206.768 182.731V200.258C206.768 200.947 206.523 201.536 206.033 202.026C205.542 202.517 204.953 202.762 204.264 202.762H198.005V200.258H204.264V182.731H198.005ZM198.005 192.747V190.243H201.76V192.747H198.005ZM198.005 187.739V185.235H201.76V187.739H198.005ZM189.241 197.754H192.997V195.25H189.241V197.754ZM189.241 192.747H192.997V190.243H189.241V192.747ZM189.241 187.739H192.997V185.235H189.241V187.739Z" fill="white"/>
  </svg>
)

const FEATURES = [
  { icon: homeIcon,    title: 'Home Sample Collection', desc: 'Convenient sample pickup from your preferred location.',    isImg: true },
  { icon: labsIcon,    title: 'Trusted Partner Labs',   desc: 'Certified labs ensuring accurate and reliable results.',   isImg: true },
  { icon: reportsIcon, title: 'Clear, Structured Reports', desc: 'Easy-to-read reports designed for non-medical users.',  isImg: true },
  { icon: null,        title: 'Compare & Track Results',   desc: 'Monitor changes across reports over time.',              isImg: false },
]

export default function WhyChooseUs() {
  return (
    <section className="page-section home-section--whychoose" style={{ background: '#fff' }}>
      <div className="page-inner">
        <div className="home-section-header">
          <h2 className="type-section" style={{ color: '#101129', margin: 0, textAlign: 'center' }}>
            Why Choose Nucleotide
          </h2>
          <p className="type-lead" style={{ color: '#828282', margin: 0, textAlign: 'center', maxWidth: 'min(720px, 100%)' }}>
            Built to make lab testing simple, reliable, and easy to understand.
          </p>
        </div>

        <div className="grid-4 why-choose-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="why-choose-card">
              {/* Dark navy circle with white icon */}
              <div className="why-choose-icon">
                {f.isImg
                  ? <img src={f.icon!} alt="" width={24} height={24} style={{ filter: 'brightness(0) invert(1)' }} />
                  : <CompareIcon />
                }
              </div>
              <div className="why-choose-text">
                <div className="type-subhead" style={{ color: '#101129' }}>
                  {f.title}
                </div>
                <div className="type-lead" style={{ color: '#828282' }}>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
