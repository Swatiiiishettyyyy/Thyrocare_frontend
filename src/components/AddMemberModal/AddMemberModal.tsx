import React, { useState, useEffect, useRef } from 'react'
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
  const [relationOpen, setRelationOpen] = useState(false)
  const relationRef = useRef<HTMLDivElement>(null)

  const isEditing = !!editingMember
  const isSelf = String(editingMember?.relation ?? '').trim().toLowerCase() === 'self'

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (relationRef.current && !relationRef.current.contains(e.target as Node)) {
        setRelationOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const lock = isAddMemberModalOpen
    document.body.style.overflow = lock ? 'hidden' : ''
    document.documentElement.style.overflow = lock ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [isAddMemberModalOpen])

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
    if (!isSelf && !relation) errs.relation = 'Relationship is required'
    if (!isSelf && relation === 'Other' && !customRelation.trim()) errs.customRelation = 'Please specify relationship'
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
      const finalRelation = isSelf ? 'Self' : (relation === 'Other' ? customRelation.trim() : relation)
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
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: '70px 16px 16px' }}
      onClick={closeAddMemberModal}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full relative overflow-y-auto"
        style={{
          maxWidth: 448,
          maxHeight: '88vh',
          padding: '28px 24px 28px',
          fontFamily: 'Poppins, sans-serif',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={closeAddMemberModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-light"
          aria-label="Close"
        >
          &times;
        </button>

        <div className="mb-5">
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', fontFamily: 'Poppins, sans-serif', margin: 0 }}>
            {isEditing ? 'Edit Member' : 'Add Family Member'}
          </h2>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4, fontFamily: 'Inter, sans-serif' }}>
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
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#101129', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
              placeholder="Enter full name"
              style={{
                width: '100%', padding: '11px 14px', border: `1px solid ${errors.name ? '#EF4444' : '#E7E1FF'}`,
                borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif',
                color: '#101129', background: '#fff', boxSizing: 'border-box',
              }}
              disabled={isLoading}
            />
            {errors.name && <p style={{ marginTop: 4, fontSize: 12, color: '#EF4444' }}>{errors.name}</p>}
          </div>

          {/* Relationship — hidden when editing self */}
          {!isSelf && <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#101129', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>Relationship *</label>
            <div ref={relationRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setRelationOpen(o => !o)}
                disabled={isLoading}
                style={{
                  width: '100%', padding: '11px 14px', border: `1px solid ${errors.relation ? '#EF4444' : '#E7E1FF'}`,
                  borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif',
                  color: relation ? '#101129' : '#828282', background: '#fff', boxSizing: 'border-box',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                }}
              >
                <span>{relation || 'Select relationship'}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, transform: relationOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path d="M6 9l6 6 6-6" stroke="#828282" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {relationOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                  background: '#fff', border: '1px solid #E7E1FF', borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(16,17,41,0.12)', zIndex: 100,
                  overflow: 'hidden', maxHeight: 220, overflowY: 'auto',
                }}>
                  {RELATIONSHIPS.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => { setRelation(r); setRelationOpen(false); setErrors(p => ({ ...p, relation: '', customRelation: '' })) }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '10px 16px', fontSize: 14, fontFamily: 'Inter, sans-serif',
                        background: relation === r ? '#F3F0FF' : '#fff',
                        color: relation === r ? '#101129' : '#374151',
                        fontWeight: relation === r ? 500 : 400,
                        border: 'none', cursor: 'pointer',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.relation && <p style={{ marginTop: 4, fontSize: 12, color: '#EF4444' }}>{errors.relation}</p>}
          </div>}

          {!isSelf && relation === 'Other' && (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#101129', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>Specify Relationship *</label>
              <input
                type="text"
                value={customRelation}
                onChange={e => { setCustomRelation(e.target.value); setErrors(p => ({ ...p, customRelation: '' })) }}
                placeholder="e.g. Cousin, Grandparent"
                style={{
                  width: '100%', padding: '11px 14px', border: `1px solid ${errors.customRelation ? '#EF4444' : '#E7E1FF'}`,
                  borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif',
                  color: '#101129', background: '#fff', boxSizing: 'border-box',
                }}
                disabled={isLoading}
              />
              {errors.customRelation && <p style={{ marginTop: 4, fontSize: 12, color: '#EF4444' }}>{errors.customRelation}</p>}
            </div>
          )}

          {/* Mobile */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#101129', fontFamily: 'Inter, sans-serif' }}>Mobile Number</label>
              {!isSelf && 'contacts' in navigator && (navigator as any).contacts?.select && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const contacts = await (navigator as any).contacts.select(['tel'], { multiple: false })
                      if (contacts?.[0]?.tel?.[0]) {
                        const raw = contacts[0].tel[0].replace(/\D/g, '').slice(-10)
                        setMobile(raw)
                        setErrors(p => ({ ...p, mobile: '' }))
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
            <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${errors.mobile ? '#EF4444' : '#E7E1FF'}`, borderRadius: 12, overflow: 'hidden', background: isSelf ? '#F9FAFB' : '#fff' }}>
              <span style={{ padding: '11px 12px', background: '#F7F7FF', color: '#828282', fontSize: 14, fontFamily: 'Inter, sans-serif', borderRight: '1px solid #E7E1FF', whiteSpace: 'nowrap' }}>+91</span>
              <input
                type="tel"
                inputMode="numeric"
                value={mobile}
                readOnly={isSelf}
                onChange={isSelf ? undefined : e => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setErrors(p => ({ ...p, mobile: '' })) }}
                placeholder="10-digit number"
                style={{ flex: 1, padding: '11px 12px', fontSize: 14, outline: 'none', border: 'none', fontFamily: 'Inter, sans-serif', color: isSelf ? '#6B7280' : '#101129', background: 'transparent', cursor: isSelf ? 'not-allowed' : 'text' }}
                disabled={isLoading}
              />
            </div>
            {errors.mobile && <p style={{ marginTop: 4, fontSize: 12, color: '#EF4444' }}>{errors.mobile}</p>}
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#101129', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
              placeholder="Enter email"
              style={{
                width: '100%', padding: '11px 14px', border: `1px solid ${errors.email ? '#EF4444' : '#E7E1FF'}`,
                borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif',
                color: '#101129', background: '#fff', boxSizing: 'border-box',
              }}
              disabled={isLoading}
            />
            {errors.email && <p style={{ marginTop: 4, fontSize: 12, color: '#EF4444' }}>{errors.email}</p>}
          </div>

          {/* DOB */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#101129', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%', padding: '11px 14px', border: '1px solid #E7E1FF',
                borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif',
                color: '#101129', background: '#fff', boxSizing: 'border-box',
              }}
              disabled={isLoading}
            />
          </div>

          {/* Gender */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#101129', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>Gender</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {GENDER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGender(opt.value)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 12,
                    border: `1px solid ${gender === opt.value ? '#101129' : '#E7E1FF'}`,
                    background: gender === opt.value ? '#101129' : '#fff',
                    color: gender === opt.value ? '#fff' : '#828282',
                    fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer', transition: 'all 0.15s',
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
            style={{
              width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
              background: isLoading ? '#9CA3AF' : 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)',
              color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: 'Poppins, sans-serif',
              cursor: isLoading ? 'not-allowed' : 'pointer', marginTop: 4,
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
