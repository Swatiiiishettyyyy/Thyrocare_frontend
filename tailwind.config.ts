import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:             '#101129',
        black:            '#161616',
        purple:           '#8B5CF6',
        'purple-light':   '#E7E1FF',
        'purple-glow':    'rgba(136,107,249,0.23)',
        teal:             '#41C9B3',
        'teal-light':     '#E6F6F3',
        orange:           '#EA8C5A',
        'orange-light':   '#FFF4EF',
        gray:             '#667388',
        'gray-mid':       '#828282',
        'gray-bg':        '#F9F9F9',
        'hero-bg':        '#F7F9FF',
        'border-light':   '#E0E5EF',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      fontSize: {
        'h1': ['48px', { lineHeight: '1.2',   letterSpacing: '-1.44px', fontWeight: '700' }],
        'h2': ['36px', { lineHeight: '1.2',   fontWeight: '700' }],
        'h3': ['18px', { lineHeight: '1.4',   fontWeight: '600' }],
        'b1': ['16px', { lineHeight: '1.6',   fontWeight: '400' }],
        'b2': ['14px', { lineHeight: '1.5',   fontWeight: '500' }],
        'b3': ['14px', { lineHeight: '1.6',   fontWeight: '400' }],
        'nav': ['14px', { lineHeight: '1.5',  fontWeight: '500' }],
        'logo': ['20px', { lineHeight: '1.2', fontWeight: '700' }],
        'price': ['24px', { lineHeight: '1.2', fontWeight: '700' }],
        'price-sm': ['20px', { lineHeight: '1.2', fontWeight: '700' }],
      },
      spacing: {
        'section': '80px',
      },
      borderRadius: {
        card:     '16px',
        'card-sm':'12px',
        pill:     '100px',
        btn:      '8px',
      },
      boxShadow: {
        'card-purple': '0px 4px 156px 0px rgba(136,107,249,0.23)',
      },
      maxWidth: {
        'page': '1280px',
      },
    },
  },
  plugins: [],
}

export default config
