const FEATURES = [
  {
    icon: '🏠',
    title: 'Home Sample Collection',
    desc: 'Convenient sample pickup from your preferred location.',
  },
  {
    icon: '✅',
    title: 'Trusted Partner Labs',
    desc: 'Certified labs ensuring accurate and reliable results.',
  },
  {
    icon: '📊',
    title: 'Clear, Structured Reports',
    desc: 'Easy-to-read reports designed for non-medical users.',
  },
  {
    icon: '📋',
    title: 'Compare & Track Results',
    desc: 'Monitor changes across reports over time.',
  },
]

export default function WhyChooseUs() {
  return (
    <section className="page-section" style={{ background: '#fff' }}>
      <div className="page-inner" style={{ maxWidth: 1100 }}>
        {/* Heading */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'Poppins,sans-serif', fontSize: 36, fontWeight: 600, color: '#101129', margin: 0, textAlign: 'center' }}>
            Why Choose Nucleotide
          </h2>
          <p style={{ fontFamily: 'Poppins,sans-serif', fontSize: 15, color: '#828282', margin: 0, textAlign: 'center', maxWidth: 560 }}>
            Built to make lab testing simple, reliable, and easy to understand.
          </p>
        </div>

        {/* Cards */}
        <div className="grid-4">
          {FEATURES.map(f => (
            <div key={f.title} style={{
              background: 'linear-gradient(145deg, #F5F3FF 0%, #EDE9FE 100%)',
              borderRadius: 20,
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              boxShadow: '0 2px 8px rgba(124,92,252,0.06)',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: '#7C5CFC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: 16, fontWeight: 600, color: '#101129', marginBottom: 8 }}>
                  {f.title}
                </div>
                <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: 13, color: '#828282', lineHeight: 1.7 }}>
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
