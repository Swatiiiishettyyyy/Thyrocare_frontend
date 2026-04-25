import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'

const OTP_LENGTH = 4
const RESEND_TIMEOUT = 30

const OTPModal: React.FC = () => {
  const { isOTPModalOpen, mobileNumber, closeOTPModal, openLoginModal, handleVerifySuccess } = useAuth()
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT)
  const [isResending, setIsResending] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (isOTPModalOpen) {
      setOtp(Array(OTP_LENGTH).fill(''))
      setError(null)
      setResendTimer(RESEND_TIMEOUT)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
  }, [isOTPModalOpen])

  useEffect(() => {
    if (!isOTPModalOpen) return
    if (resendTimer <= 0) return
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer, isOTPModalOpen])

  const verify = useCallback(async (code: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await authService.verifyOTP(mobileNumber, code)
      await handleVerifySuccess(response, mobileNumber)
    } catch (err: any) {
      setError(err?.message || 'Invalid OTP. Please try again.')
      setOtp(Array(OTP_LENGTH).fill(''))
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    } finally {
      setIsLoading(false)
    }
  }, [mobileNumber, handleVerifySuccess])

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)
    if (error) setError(null)

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all digits are filled
    if (digit && newOtp.every(d => d !== '')) {
      verify(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const newOtp = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((d, i) => { newOtp[i] = d })
    setOtp(newOtp)
    const nextEmpty = newOtp.findIndex(d => d === '')
    const focusIdx = nextEmpty === -1 ? OTP_LENGTH - 1 : nextEmpty
    inputRefs.current[focusIdx]?.focus()
    if (newOtp.every(d => d !== '')) verify(newOtp.join(''))
  }

  const handleResend = async () => {
    if (resendTimer > 0 || isResending) return
    setIsResending(true)
    setError(null)
    try {
      await authService.sendOTP(mobileNumber)
      setOtp(Array(OTP_LENGTH).fill(''))
      setResendTimer(RESEND_TIMEOUT)
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    } catch (err: any) {
      setError(err?.message || 'Failed to resend OTP.')
    } finally {
      setIsResending(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < OTP_LENGTH) { setError('Please enter the complete OTP'); return }
    verify(code)
  }

  const handleBack = () => {
    closeOTPModal()
    openLoginModal()
  }

  if (!isOTPModalOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative"
        style={{ fontFamily: 'Poppins, sans-serif' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Back button (touch-friendly) */}
        <button
          onClick={handleBack}
          aria-label="Back"
          type="button"
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            height: 40,
            padding: '0 12px',
            borderRadius: 999,
            background: '#F7F7F7',
            border: '1px solid rgba(231, 225, 255, 0.95)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            color: '#24254F',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 19l-7-7 7-7" stroke="#24254F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>

        {/* Header */}
        <div className="mb-6 text-center pt-2">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="#101129"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: '#101129', margin: 0, lineHeight: 1.15 }}>
            Verify OTP
          </h2>
          <p style={{ fontSize: 13, color: '#828282', margin: '8px 0 0', lineHeight: 1.4 }}>
            OTP sent to <span style={{ fontWeight: 600, color: '#101129' }}>+91 {mobileNumber}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* OTP boxes */}
          <div className="flex justify-center gap-3 mb-5" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                disabled={isLoading}
                className="w-14 h-14 text-center text-xl font-bold rounded-2xl border-2 outline-none transition-colors"
                style={{
                  borderColor: error ? '#EF4444' : digit ? '#101129' : '#D1D5DB',
                  color: '#101129',
                  backgroundColor: isLoading ? '#F9FAFB' : '#fff',
                }}
              />
            ))}
          </div>

          {error && (
            <p className="text-center text-xs text-red-500 mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || otp.some(d => d === '')}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-colors mb-4"
            style={{
              background: isLoading || otp.some(d => d === '')
                ? '#9CA3AF'
                : 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)',
              color: '#fff',
              cursor: isLoading || otp.some(d => d === '') ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Verifying…' : 'Verify OTP'}
          </button>
        </form>

        {/* Resend */}
        <div className="text-center" style={{ fontSize: 13 }}>
          {resendTimer > 0 ? (
            <span style={{ color: '#9CA3AF' }}>
              Resend OTP in <span style={{ fontWeight: 600, color: '#6B7280' }}>{resendTimer}s</span>
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={isResending}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: isResending ? 'not-allowed' : 'pointer',
                color: '#8B5CF6',
                fontWeight: 600,
              }}
            >
              {isResending ? 'Sending…' : 'Resend OTP'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default OTPModal
