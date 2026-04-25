import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { MemberProfile } from '../../services/memberService'

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

const MemberSwitchDropdown: React.FC = () => {
  const {
    isLoggedIn,
    user,
    currentMember,
    members,
    openLoginModal,
    handleLogout,
    handleSelectMember,
    openAddMemberModal,
  } = useAuth()

  const [isOpen, setIsOpen] = useState(false)
  const [switching, setSwitching] = useState<number | string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  if (!isLoggedIn) {
    return (
      <button
        onClick={openLoginModal}
        className="navbar-login-btn flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors"
        style={{
          background: 'linear-gradient(90deg, #101129 0%, #2A2C5B 100%)',
          color: '#fff',
          border: '1px solid #E7E1FF',
          height: 44,
        }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Login
      </button>
    )
  }

  const displayName = currentMember?.name || user?.name || 'Account'
  const initials = getInitials(displayName)
  const currentId = currentMember?.member_id || currentMember?.id

  const onSelectMember = async (m: MemberProfile) => {
    const id = m.member_id || m.id
    if (!id || id === currentId) { setIsOpen(false); return }
    setSwitching(id)
    try {
      await handleSelectMember(id)
    } finally {
      setSwitching(null)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(p => !p)}
        className="member-switch-trigger flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ backgroundColor: '#101129' }}
        >
          {initials || '?'}
        </div>
        <span className="text-sm font-medium text-gray-800 max-w-24 truncate hidden sm:block">{displayName}</span>
        <svg
          className="w-3.5 h-3.5 text-gray-500 transition-transform flex-shrink-0"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="member-switch-panel absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          {/* Current member header */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Viewing as</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">{displayName}</p>
            {user?.mobileNumber && (
              <p className="text-xs text-gray-500">+91 {user.mobileNumber}</p>
            )}
          </div>

          {/* Member list */}
          {members.length > 0 && (
            <div className="py-1 max-h-48 overflow-y-auto">
              <p className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">Switch Member</p>
              {members.map(m => {
                const mId = m.member_id || m.id
                const isSelected = mId === currentId
                const isSwitch = switching === mId
                return (
                  <button
                    key={mId}
                    onClick={() => onSelectMember(m)}
                    disabled={isSwitch || isSelected}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    style={{ backgroundColor: isSelected ? '#F0F4FF' : undefined }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        backgroundColor: isSelected ? '#101129' : '#E5E7EB',
                        color: isSelected ? '#fff' : '#374151',
                      }}
                    >
                      {isSwitch ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : getInitials(m.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                      <p className="text-xs text-gray-500 truncate">{m.relation || 'Member'}</p>
                    </div>
                    {isSelected && (
                      <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={() => { setIsOpen(false); openAddMemberModal() }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">Add Family Member</span>
            </button>
            <button
              onClick={() => { setIsOpen(false); handleLogout() }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <span className="text-sm text-red-600 font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MemberSwitchDropdown
