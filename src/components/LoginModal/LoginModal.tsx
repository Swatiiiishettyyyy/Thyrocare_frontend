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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={closeLoginModal}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative"
        style={{ fontFamily: 'Poppins, sans-serif' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={closeLoginModal}
          className="absolute top-3 right-3"
          aria-label="Close"
          type="button"
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            background: '#F7F7F7',
            border: '1px solid rgba(231, 225, 255, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M1 1l12 12M13 1L1 13" stroke="#24254F" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div
            className="mx-auto mb-4"
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              background: '#E7E1FF',
              border: '1px solid rgba(231, 225, 255, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                stroke="#101129"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: '#101129', margin: 0, lineHeight: 1.15 }}>
            Login to Nucleotide
          </h2>
          <p style={{ fontSize: 13, color: '#828282', margin: '8px 0 0', lineHeight: 1.4 }}>
            Enter your mobile number to receive an OTP
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
            <div className="flex items-center border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 border-gray-300">
              <span className="px-3 py-3 bg-gray-50 text-gray-600 text-sm font-medium border-r border-gray-300 select-none">
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
                className="flex-1 px-3 py-3 text-sm outline-none bg-white"
                maxLength={10}
                disabled={isLoading}
              />
            </div>
            {error && (
              <p className="mt-2 text-xs text-red-500">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || mobile.length < 10}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-colors"
            style={{
              background: isLoading || mobile.length < 10
                ? '#9CA3AF'
                : 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)',
              color: '#fff',
              cursor: isLoading || mobile.length < 10 ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Sending OTP…' : 'Send OTP'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-400">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-blue-500 hover:underline">Terms of Service</a>{' '}
          and{' '}
          <a href="/privacy" className="text-blue-500 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}

export default LoginModal
