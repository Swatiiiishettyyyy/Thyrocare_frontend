import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'

const LoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, openOTPModal } = useAuth()
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const lock = isLoginModalOpen
    document.body.style.overflow = lock ? 'hidden' : ''
    document.documentElement.style.overflow = lock ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [isLoginModalOpen])

  useEffect(() => {
    if (isLoginModalOpen) {
      setMobile('')
      setError(null)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isLoginModalOpen])

  if (!isLoginModalOpen) return null

  const validate = (num: string): string | null => {
    if (!num || num.length < 10) return 'Please enter a valid 10-digit mobile number'
    if (!/^[6-9]\d{9}$/.test(num)) return 'Please enter a valid Indian mobile number'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate(mobile)
    if (validationError) { setError(validationError); return }
    setError(null)
    setIsLoading(true)
    try {
      await authService.sendOTP(mobile)
      openOTPModal(mobile)
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10)
    setMobile(val)
    if (error) setError(null)
  }

  const isDisabled = isLoading || mobile.length < 10

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)', padding: '70px 16px 16px',
      }}
      onClick={closeLoginModal}
    >
      <div
        style={{
          background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          width: '100%', maxWidth: 420, padding: '32px 28px',
          fontFamily: 'Poppins, sans-serif', position: 'relative',
          boxSizing: 'border-box',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={closeLoginModal}
          aria-label="Close"
          type="button"
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 36, height: 36, borderRadius: '50%',
            background: '#F7F7F7', border: '1px solid #E7E1FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M1 1l12 12M13 1L1 13" stroke="#24254F" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: '#E7E1FF', border: '1px solid #E7E1FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: '#101129', margin: 0, lineHeight: 1.2 }}>
            Login to Nucleotide
          </h2>
          <p style={{ fontSize: 13, color: '#828282', margin: '8px 0 0', lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>
            Enter your mobile number to receive an OTP
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', fontFamily: 'Inter, sans-serif' }}>
                Mobile Number
              </label>
              {'contacts' in navigator && (navigator as any).contacts?.select && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const contacts = await (navigator as any).contacts.select(['tel'], { multiple: false })
                      if (contacts?.[0]?.tel?.[0]) {
                        const raw = contacts[0].tel[0].replace(/\D/g, '').slice(-10)
                        setMobile(raw)
                        if (error) setError(null)
                      }
                    } catch { /* user cancelled */ }
                  }}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    color: '#8B5CF6', fontSize: 12, fontWeight: 500,
                    fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  From contacts
                </button>
              )}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center',
              border: `1.5px solid ${error ? '#EF4444' : '#E7E1FF'}`,
              borderRadius: 12,
              transition: 'border-color 0.15s',
            }}>
              <span style={{
                padding: '0 12px', height: 48, display: 'flex', alignItems: 'center',
                background: '#F9FAFB', color: '#6B7280', fontSize: 14, fontWeight: 500,
                borderRight: '1.5px solid #E7E1FF', fontFamily: 'Inter, sans-serif',
                flexShrink: 0, userSelect: 'none',
                borderRadius: '10px 0 0 10px',
              }}>
                +91
              </span>
              <input
                ref={inputRef}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={mobile}
                onChange={handleMobileChange}
                placeholder="Enter 10-digit number"
                style={{
                  flex: 1, height: 48, padding: '0 14px', border: 'none', outline: 'none',
                  fontSize: 14, color: '#101129', background: '#fff',
                  fontFamily: 'Inter, sans-serif',
                  borderRadius: '0 10px 10px 0',
                  minWidth: 0,
                }}
                maxLength={10}
                disabled={isLoading}
              />
            </div>
            {error && (
              <p style={{ marginTop: 6, fontSize: 12, color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isDisabled}
            style={{
              width: '100%', height: 48, borderRadius: 12, border: 'none',
              background: isDisabled ? '#D1D5DB' : 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)',
              color: '#fff', fontSize: 15, fontWeight: 600,
              fontFamily: 'Poppins, sans-serif',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {isLoading ? 'Sending OTP…' : 'Send OTP'}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>
          By continuing, you agree to our{' '}
          <a href="/blood-test/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#8B5CF6', textDecoration: 'none' }}>Terms of Service</a>{' '}
          and{' '}
          <a href="/blood-test/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#8B5CF6', textDecoration: 'none' }}>Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}

export default LoginModal
