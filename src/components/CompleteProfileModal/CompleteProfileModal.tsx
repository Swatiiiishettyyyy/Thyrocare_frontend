import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { memberService } from '../../services/memberService'
import { getLoginMobileNumber, getUserData } from '../../utils/authStorage'

const GENDER_OPTIONS = [
  { label: 'Male', value: 'M' },
  { label: 'Female', value: 'F' },
  { label: 'Other', value: 'O' },
]

const CompleteProfileModal: React.FC = () => {
  const {
    isCompleteProfileModalOpen,
    closeCompleteProfileModal,
    refreshMembers,
    currentMember,
    members,
    user,
    updateUser,
    handleSelectMember,
  } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [mobile, setMobile] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    const lock = isCompleteProfileModalOpen
    document.body.style.overflow = lock ? 'hidden' : ''
    document.documentElement.style.overflow = lock ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [isCompleteProfileModalOpen])

  useEffect(() => {
    if (!isCompleteProfileModalOpen) return
    const loginMobile = getLoginMobileNumber()
    setMobile(loginMobile || user?.mobileNumber || '')
    // Pre-fill from existing member data if available
    if (currentMember) {
      setName(currentMember.name || '')
      setEmail(currentMember.email || '')
      if (currentMember.dob) setDob(currentMember.dob)
      setGender(currentMember.gender || '')
    } else if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
    }
  }, [isCompleteProfileModalOpen, currentMember, user])

  if (!isCompleteProfileModalOpen) return null

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Full name is required'
    if (email && !/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Enter a valid email'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const calculateAge = (dobStr: string): number => {
    if (!dobStr) return 0
    const today = new Date()
    const birthDate = new Date(dobStr)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
    return Math.max(age, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsLoading(true)
    setApiError(null)
    try {
      const normalizeId = (m: any): number | null => {
        const v = m?.member_id ?? m?.id
        const n = typeof v === 'number' ? v : Number(v)
        return Number.isFinite(n) && n > 0 ? n : null
      }

      const isSelf = (rel: unknown): boolean => String(rel ?? '').trim().toLowerCase() === 'self'

      const currentId = normalizeId(currentMember)
      const existingSelf = members.find(m => (m as any).is_self_profile === true || isSelf(m.relation) || (m as any).is_self === true) ?? null
      const selfId = normalizeId(existingSelf)

      // If current member is not available yet but a Self profile exists, edit that instead of creating duplicates.
      const memberId = currentId ?? selfId
      const payload = {
        name: name.trim(),
        relation: 'Self',
        age: calculateAge(dob),
        gender: gender || 'M',
        dob: dob || new Date().toISOString().split('T')[0],
        mobile: mobile,
        email: email.trim() || undefined,
      }

      if (memberId) {
        await memberService.editMember(Number(memberId), payload)
      } else {
        // Always do a fresh server fetch first — catches cases where a previous
        // save succeeded server-side but the client never received the response
        // (network timeout, etc.), which would otherwise create a duplicate self.
        const freshRes = await memberService.getMemberList().catch(() => null)
        const freshList: any[] = (freshRes as any)?.data ?? (freshRes as any)?.members ?? []
        const existingSelfFresh = freshList.find((m: any) => isSelf(m.relation) || (m as any).is_self_profile === true || (m as any).is_self === true) ?? null
        const freshSelfId = existingSelfFresh ? Number(existingSelfFresh.member_id ?? existingSelfFresh.id) : null

        if (freshSelfId) {
          await memberService.editMember(freshSelfId, payload)
        } else {
          try {
            const res = await memberService.saveMember({ ...payload, member_id: 0 })
            const savedId =
              (typeof res?.data?.member_id === 'number' && res.data.member_id) ||
              (typeof (res as any)?.member_id === 'number' && (res as any).member_id) ||
              (typeof res?.data?.member?.member_id === 'number' && res.data.member.member_id) ||
              null
            if (savedId) {
              try {
                await handleSelectMember(savedId)
              } catch {
                /* ignore */
              }
            }
          } catch (createErr: any) {
            const isAlreadyExists =
              createErr?.message?.toLowerCase().includes('already exists') ||
              String(createErr?.detail ?? '').toLowerCase().includes('already exists')
            if (isAlreadyExists) {
              await refreshMembers()
              const retryRes = await memberService.getMemberList().catch(() => null)
              const retryList: any[] = (retryRes as any)?.data ?? (retryRes as any)?.members ?? []
              const selfMember = retryList.find((m: any) => isSelf(m.relation) || (m as any).is_self_profile === true || (m as any).is_self === true)
              if (selfMember) {
                await memberService.editMember(Number(selfMember.member_id ?? selfMember.id), payload)
              } else {
                throw createErr
              }
            } else {
              throw createErr
            }
          }
        }
      }

      await refreshMembers()
      if (user?.is_new_user) updateUser({ is_new_user: false })
      closeCompleteProfileModal()
    } catch (err: any) {
      setApiError(err?.message || 'Failed to save profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: '16px' }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative my-auto"
        style={{ padding: '24px 20px', marginTop: '16px', marginBottom: '16px' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-5 text-center">
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>Complete Your Profile</h2>
          <p className="text-sm text-gray-500 mt-1">Please fill in your details to get started</p>
        </div>

        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: errors.name ? '#EF4444' : '#D1D5DB' }}
              disabled={isLoading}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Mobile (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
              <span className="px-3 py-3 text-gray-500 text-sm border-r border-gray-200">+91</span>
              <input
                type="tel"
                value={mobile}
                readOnly
                className="flex-1 px-3 py-3 text-sm bg-gray-50 text-gray-600 cursor-not-allowed outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: errors.email ? '#EF4444' : '#D1D5DB' }}
              disabled={isLoading}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <div className="flex gap-3">
              {GENDER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGender(opt.value)}
                  className="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors"
                  style={{
                    borderColor: gender === opt.value ? '#101129' : '#D1D5DB',
                    backgroundColor: gender === opt.value ? '#101129' : '#fff',
                    color: gender === opt.value ? '#fff' : '#374151',
                  }}
                  disabled={isLoading}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={closeCompleteProfileModal}
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors border"
              style={{
                backgroundColor: '#fff',
                borderColor: '#D1D5DB',
                color: '#374151',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{
                backgroundColor: isLoading ? '#9CA3AF' : '#101129',
                color: '#fff',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CompleteProfileModal
