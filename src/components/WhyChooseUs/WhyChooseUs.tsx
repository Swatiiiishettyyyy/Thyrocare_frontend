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
    <section className="page-section" style={{ background: '#fff' }}>
      <div className="page-inner">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, marginBottom: 40 }}>
          <h2 style={{ fontFamily: 'Poppins,sans-serif', fontSize: 36, fontWeight: 500, color: '#101129', margin: 0, textAlign: 'center' }}>
            Why Choose Nucleotide
          </h2>
          <p style={{ fontFamily: 'Poppins,sans-serif', fontSize: 15, fontWeight: 400, color: '#828282', margin: 0, textAlign: 'center' }}>
            Built to make lab testing simple, reliable, and easy to understand.
          </p>
        </div>

        <div className="grid-4 why-choose-grid">
          {FEATURES.map(f => (
            <div key={f.title} style={{
              padding: '24px 20px',
              background: 'linear-gradient(360deg, #E7E1FF 0%, #fff 100%)',
              borderRadius: 20,
              outline: '1px solid #E7E1FF',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}>
              {/* Dark navy circle with white icon */}
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)',
                boxShadow: '0px 4px 24px rgba(136,107,249,0.23)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {f.isImg
                  ? <img src={f.icon!} alt="" width={24} height={24} style={{ filter: 'brightness(0) invert(1)' }} />
                  : <CompareIcon />
                }
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: 17, fontWeight: 500, color: '#101129', lineHeight: 1.3 }}>
                  {f.title}
                </div>
                <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: 13, fontWeight: 400, color: '#828282', lineHeight: 1.6 }}>
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
