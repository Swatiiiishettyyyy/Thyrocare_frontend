import { useState, useEffect } from 'react'
import banner1 from '../../assets/figma/doctor_banner.png'
import banner2 from '../../assets/figma/Banner2.png'
import banner3 from '../../assets/figma/banner3.png'

const BANNERS = [banner1, banner2, banner3]

export function HeroSection() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % BANNERS.length)
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="hero-section" style={{ margin: '16px 12px' }}>
      <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
        <div className="hero-track" style={{
          display: 'flex',
          transform: `translateX(-${current * 100}%)`,
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform',
        }}>
          {BANNERS.map((src, i) => (
            <img key={i} src={src} alt={`Banner ${i + 1}`} className="hero-img" />
          ))}
        </div>
      </div>
      <div className="hero-dots" style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
        {BANNERS.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} aria-label={`Go to banner ${i + 1}`} style={{
            width: i === current ? 24 : 8, height: 8, borderRadius: 4, border: 'none',
            cursor: 'pointer', background: i === current ? '#8B5CF6' : '#E7E1FF',
            transition: 'all 0.3s ease', padding: 0,
          }} />
        ))}
      </div>
    </section>
  )
}
