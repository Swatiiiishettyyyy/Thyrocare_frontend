import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import {
  isAuthenticated,
  getUserData,
  saveUserData,
  saveCsrfToken,
  saveLoginMobileNumber,
  clearAuthData,
  saveAuthToken,
  saveRefreshToken,
  UserData,
} from '../utils/authStorage'
import { globalHandlers } from '../utils/globalHandlers'
import { authService, VerifyOTPResponse } from '../services/authService'
import { memberService, MemberProfile } from '../services/memberService'
import { getAuthToken } from '../utils/authStorage'
import { jwtExpMs } from '../utils/jwt'
import { refreshAuthIfNeeded } from '../api/client'

interface AuthContextValue {
  isLoggedIn: boolean
  user: UserData | null
  currentMember: MemberProfile | null
  members: MemberProfile[]
  isLoginModalOpen: boolean
  isOTPModalOpen: boolean
  mobileNumber: string
  isCompleteProfileModalOpen: boolean
  isAddMemberModalOpen: boolean
  editingMember: MemberProfile | null
  openCompleteProfileModal: () => void
  openLoginModal: () => void
  closeLoginModal: () => void
  openOTPModal: (mobile: string) => void
  closeOTPModal: () => void
  openAddMemberModal: (member?: MemberProfile) => void
  closeAddMemberModal: () => void
  handleVerifySuccess: (response: VerifyOTPResponse, mobile: string) => Promise<void>
  updateUser: (patch: Partial<UserData>) => void
  handleLogout: () => Promise<void>
  handleSelectMember: (memberId: number | string) => Promise<void>
  refreshMembers: () => Promise<void>
  closeCompleteProfileModal: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [currentMember, setCurrentMember] = useState<MemberProfile | null>(null)
  const [members, setMembers] = useState<MemberProfile[]>([])
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false)
  const [mobileNumber, setMobileNumber] = useState('')
  const [isCompleteProfileModalOpen, setIsCompleteProfileModalOpen] = useState(false)
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<MemberProfile | null>(null)
  const initialized = useRef(false)
  const refreshTimerRef = useRef<number | null>(null)

  const loadMemberData = useCallback(async () => {
    try {
      const [currentRes, listRes] = await Promise.allSettled([
        memberService.getCurrentMember(),
        memberService.getMemberList(),
      ])
      if (currentRes.status === 'fulfilled') {
        const data = currentRes.value?.data || currentRes.value?.member || currentRes.value
        setCurrentMember(data || null)
      }
      if (listRes.status === 'fulfilled') {
        const list = listRes.value?.data || listRes.value?.members || []
        setMembers(Array.isArray(list) ? list : [])
      }
    } catch {}
  }, [])

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const init = async () => {
      if (!isAuthenticated()) return
      const storedUser = getUserData()
      if (!storedUser) return
      setUser(storedUser)
      setIsLoggedIn(true)
      await loadMemberData()
    }

    init()
  }, [loadMemberData])

  // Wire global 401 handler
  useEffect(() => {
    globalHandlers.setLogoutHandler(async (skipApiCall = false) => {
      if (!skipApiCall) {
        try { await authService.logout() } catch {}
      }
      clearAuthData()
      setIsLoggedIn(false)
      setUser(null)
      setCurrentMember(null)
      setMembers([])
      setIsLoginModalOpen(true)
    })
  }, [])

  // Proactive token refresh: schedule refresh shortly before access token expiry.
  useEffect(() => {
    const clearTimer = () => {
      if (refreshTimerRef.current != null) {
        window.clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
    }

    const schedule = async () => {
      clearTimer()
      if (!isLoggedIn) return

      const token = getAuthToken()
      const exp = jwtExpMs(token)
      if (!exp) return

      // Refresh 120s before expiry (and add small jitter so multiple tabs don't sync).
      const now = Date.now()
      const jitterMs = Math.floor(Math.random() * 5000)
      const refreshAt = exp - 120_000 - jitterMs
      const delay = Math.max(0, refreshAt - now)

      refreshTimerRef.current = window.setTimeout(async () => {
        // Don't refresh while the app is backgrounded — the browser may kill the
        // response before the frontend can save the new tokens, leaving a rotated
        // (now-invalid) refresh token in localStorage and causing TOKEN_REUSE_DETECTED
        // on the next reactive refresh.
        if (document.visibilityState === 'hidden') {
          const onVisible = () => {
            document.removeEventListener('visibilitychange', onVisible)
            schedule()
          }
          document.addEventListener('visibilitychange', onVisible, { once: true })
          return
        }
        try {
          await refreshAuthIfNeeded()
        } catch (err) {
          console.warn('[auth] Proactive token refresh failed — will retry on next 401:', err)
        } finally {
          // Reschedule using the rotated access token (if any).
          schedule()
        }
      }, delay)
    }

    schedule()
    return () => clearTimer()
  }, [isLoggedIn])

  const openLoginModal = useCallback(() => {
    setIsLoginModalOpen(true)
    setIsOTPModalOpen(false)
  }, [])

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false)
  }, [])

  const openOTPModal = useCallback((mobile: string) => {
    setMobileNumber(mobile)
    setIsLoginModalOpen(false)
    setIsOTPModalOpen(true)
  }, [])

  const closeOTPModal = useCallback(() => {
    setIsOTPModalOpen(false)
  }, [])

  const openAddMemberModal = useCallback((member?: MemberProfile) => {
    setEditingMember(member || null)
    setIsAddMemberModalOpen(true)
  }, [])

  const closeAddMemberModal = useCallback(() => {
    setIsAddMemberModalOpen(false)
    setEditingMember(null)
  }, [])

  const closeCompleteProfileModal = useCallback(() => {
    setIsCompleteProfileModalOpen(false)
  }, [])

  const openCompleteProfileModal = useCallback(() => {
    setIsCompleteProfileModalOpen(true)
  }, [])

  const handleVerifySuccess = useCallback(async (response: VerifyOTPResponse, mobile: string) => {
    // Extract CSRF token from response
    const csrfToken =
      response.csrf_token ||
      response.csrfToken ||
      response.data?.csrf_token ||
      response.data?.csrfToken

    if (csrfToken) saveCsrfToken(csrfToken)

    const accessToken =
      response.data?.token ||
      response.data?.access_token ||
      (response as { token?: string }).token
    const refreshTok = response.data?.refreshToken || response.data?.refresh_token
    if (typeof accessToken === 'string' && accessToken.trim()) saveAuthToken(accessToken.trim())
    if (typeof refreshTok === 'string' && refreshTok.trim()) saveRefreshToken(refreshTok.trim())

    saveLoginMobileNumber(mobile)

    const isNewUser = response.data?.is_new_user ?? false
    const userData: UserData = {
      id: response.data?.user?.id,
      name: response.data?.user?.name || '',
      email: '',
      mobileNumber: mobile,
      is_new_user: isNewUser,
    }
    saveUserData(userData)
    setUser(userData)
    setIsLoggedIn(true)
    setIsOTPModalOpen(false)
    setIsLoginModalOpen(false)

    await loadMemberData()
  }, [loadMemberData])

  const updateUser = useCallback((patch: Partial<UserData>) => {
    setUser(prev => {
      const next = { ...(prev ?? { name: '', email: '' }), ...patch } as UserData
      saveUserData(next)
      return next
    })
  }, [])

  const handleLogout = useCallback(async () => {
    try { await authService.logout() } catch {}
    clearAuthData()
    setIsLoggedIn(false)
    setUser(null)
    setCurrentMember(null)
    setMembers([])
  }, [])

  const handleSelectMember = useCallback(async (memberId: number | string) => {
    try {
      const response = await memberService.selectMember(memberId)
      // Save new JWT — backend embeds selected_member_id in it so all subsequent
      // data fetches (orders, reports, metrics) are automatically scoped to this member.
      const newToken = response?.token || response?.data?.token
      if (typeof newToken === 'string' && newToken.trim()) saveAuthToken(newToken.trim())
      const newCsrf = response?.csrf_token || response?.csrfToken || response?.data?.csrf_token
      if (newCsrf) saveCsrfToken(newCsrf)

      const numId = typeof memberId === 'string' ? parseInt(memberId, 10) : memberId
      const picked = members.find(m => (m.member_id ?? Number(m.id)) === numId)
      if (picked) {
        const normId = picked.member_id ?? (Number(picked.id) || undefined)
        setCurrentMember({ ...picked, member_id: normId })
      }
      try {
        const listRes = await memberService.getMemberList()
        const list = listRes?.data || (listRes as any)?.members || []
        if (Array.isArray(list)) setMembers(list)
      } catch {}
    } catch (error: any) {
      throw error
    }
  }, [members])

  const refreshMembers = useCallback(async () => {
    await loadMemberData()
  }, [loadMemberData])

  return (
    <AuthContext.Provider value={{
      isLoggedIn,
      user,
      currentMember,
      members,
      isLoginModalOpen,
      isOTPModalOpen,
      mobileNumber,
      isCompleteProfileModalOpen,
      isAddMemberModalOpen,
      editingMember,
      openCompleteProfileModal,
      openLoginModal,
      closeLoginModal,
      openOTPModal,
      closeOTPModal,
      openAddMemberModal,
      closeAddMemberModal,
      handleVerifySuccess,
      updateUser,
      handleLogout,
      handleSelectMember,
      refreshMembers,
      closeCompleteProfileModal,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
