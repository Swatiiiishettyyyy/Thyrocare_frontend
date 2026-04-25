import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { memberService } from '../../services/memberService'

const RELATIONSHIPS = ['Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Friend', 'Other']
const GENDER_OPTIONS = [{ label: 'Male', value: 'M' }, { label: 'Female', value: 'F' }, { label: 'Other', value: 'O' }]

const AddMemberModal: React.FC = () => {
  const { isAddMemberModalOpen, editingMember, closeAddMemberModal, refreshMembers } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [relation, setRelation] = useState('')
  const [customRelation, setCustomRelation] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const isEditing = !!editingMember

  useEffect(() => {
    if (!isAddMemberModalOpen) return
    if (editingMember) {
      setName(editingMember.name || '')
      setEmail(editingMember.email || '')
      setMobile(editingMember.mobile || '')
      setDob(editingMember.dob || '')
      setGender(editingMember.gender || '')
      const rel = editingMember.relation || ''
      if (RELATIONSHIPS.includes(rel)) { setRelation(rel); setCustomRelation('') }
      else { setRelation('Other'); setCustomRelation(rel) }
    } else {
      setName(''); setEmail(''); setMobile(''); setDob(''); setGender(''); setRelation(''); setCustomRelation('')
    }
    setErrors({})
    setApiError(null)
  }, [isAddMemberModalOpen, editingMember])

  if (!isAddMemberModalOpen) return null

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Name is required'
    if (!relation) errs.relation = 'Relationship is required'
    if (relation === 'Other' && !customRelation.trim()) errs.customRelation = 'Please specify relationship'
    if (mobile && !/^\d{10}$/.test(mobile)) errs.mobile = 'Enter a valid 10-digit number'
    if (email && !/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Enter a valid email'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const calculateAge = (dobStr: string): number => {
    if (!dobStr) return 0
    const today = new Date()
    const birth = new Date(dobStr)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return Math.max(age, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsLoading(true)
    setApiError(null)
    try {
      const finalRelation = relation === 'Other' ? customRelation.trim() : relation
      const payload = {
        name: name.trim(),
        relation: finalRelation,
        age: calculateAge(dob),
        gender: gender || 'M',
        dob: dob || new Date().toISOString().split('T')[0],
        mobile: mobile || '',
        email: email.trim() || undefined,
      }

      if (isEditing) {
        const memberId = editingMember!.member_id || Number(editingMember!.id)
        await memberService.editMember(memberId, payload)
      } else {
        await memberService.saveMember({ ...payload, member_id: 0 })
      }

      await refreshMembers()
      closeAddMemberModal()
    } catch (err: any) {
      setApiError(err?.message || 'Failed to save member. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={closeAddMemberModal}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative max-h-screen overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={closeAddMemberModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-light"
          aria-label="Close"
        >
          &times;
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Member' : 'Add Family Member'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isEditing ? 'Update member details' : 'Add a new member to your account'}
          </p>
        </div>

        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
              placeholder="Enter full name"
              className="w-full px-4 py-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: errors.name ? '#EF4444' : '#D1D5DB' }}
              disabled={isLoading}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
            <select
              value={relation}
              onChange={e => { setRelation(e.target.value); setErrors(p => ({ ...p, relation: '', customRelation: '' })) }}
              className="w-full px-4 py-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              style={{ borderColor: errors.relation ? '#EF4444' : '#D1D5DB' }}
              disabled={isLoading}
            >
              <option value="">Select relationship</option>
              {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {errors.relation && <p className="mt-1 text-xs text-red-500">{errors.relation}</p>}
          </div>

          {relation === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specify Relationship *</label>
              <input
                type="text"
                value={customRelation}
                onChange={e => { setCustomRelation(e.target.value); setErrors(p => ({ ...p, customRelation: '' })) }}
                placeholder="e.g. Cousin, Grandparent"
                className="w-full px-4 py-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: errors.customRelation ? '#EF4444' : '#D1D5DB' }}
                disabled={isLoading}
              />
              {errors.customRelation && <p className="mt-1 text-xs text-red-500">{errors.customRelation}</p>}
            </div>
          )}

          {/* Mobile */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <div className="flex items-center border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500"
              style={{ borderColor: errors.mobile ? '#EF4444' : '#D1D5DB' }}>
              <span className="px-3 py-3 bg-gray-50 text-gray-600 text-sm border-r border-gray-200">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                value={mobile}
                onChange={e => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setErrors(p => ({ ...p, mobile: '' })) }}
                placeholder="10-digit number"
                className="flex-1 px-3 py-3 text-sm outline-none"
                disabled={isLoading}
              />
            </div>
            {errors.mobile && <p className="mt-1 text-xs text-red-500">{errors.mobile}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
              placeholder="Enter email"
              className="w-full px-4 py-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: errors.email ? '#EF4444' : '#D1D5DB' }}
              disabled={isLoading}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* DOB */}
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-colors"
            style={{
              backgroundColor: isLoading ? '#9CA3AF' : '#101129',
              color: '#fff',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Saving…' : isEditing ? 'Update Member' : 'Add Member'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddMemberModal
