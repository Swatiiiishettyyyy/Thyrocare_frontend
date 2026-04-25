const STORAGE_KEYS = {
  AUTH_TOKEN: 'nucleotide_auth_token',
  REFRESH_TOKEN: 'nucleotide_refresh_token',
  CSRF_TOKEN: 'nucleotide_csrf_token',
  USER_DATA: 'nucleotide_user_data',
  API_KEY: 'nucleotide_api_key',
  LOGIN_MOBILE: 'nucleotide_login_mobile',
} as const

export interface UserData {
  id?: string
  name: string
  email: string
  mobileNumber?: string
  avatar?: string
  has_taken_genetic_test?: boolean
  gene_report_status?: string
  relationship?: string
  is_new_user?: boolean
}

export const COMPLETE_PROFILE_PROMPT_SHOWN_KEY = 'nucleotide_complete_profile_prompt_shown'
export const COOKIE_PREFERENCE_KEY = 'nucleotide_cookie_preference'

export const saveAuthToken = (token: string): void => {
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
}

export const getAuthToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
}

export const saveRefreshToken = (token: string): void => {
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token)
}

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
}

export const saveCsrfToken = (token: string): void => {
  localStorage.setItem(STORAGE_KEYS.CSRF_TOKEN, token)
}

export const getCsrfToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.CSRF_TOKEN)
}

export const saveApiKey = (key: string): void => {
  localStorage.setItem(STORAGE_KEYS.API_KEY, key)
}

export const getApiKey = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.API_KEY)
}

function normalizeUserData(raw: Record<string, unknown>): UserData {
  const mobileNumber =
    (raw.mobileNumber as string) ||
    (raw.mobile as string) ||
    (raw.mobile_number as string) ||
    ''
  return {
    id: raw.id != null ? String(raw.id) : undefined,
    name: (raw.name as string) ?? '',
    email: (raw.email as string) ?? '',
    mobileNumber: typeof mobileNumber === 'string' ? mobileNumber.trim() : '',
    avatar: raw.avatar as string | undefined,
    has_taken_genetic_test: raw.has_taken_genetic_test as boolean | undefined,
    gene_report_status: raw.gene_report_status as string | undefined,
    relationship: raw.relationship as string | undefined,
    is_new_user: raw.is_new_user as boolean | undefined,
  }
}

export const saveUserData = (userData: UserData): void => {
  localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
}

export const getUserData = (): UserData | null => {
  const raw = localStorage.getItem(STORAGE_KEYS.USER_DATA)
  if (!raw) return null
  try {
    return normalizeUserData(JSON.parse(raw) as Record<string, unknown>)
  } catch {
    return null
  }
}

export const saveLoginMobileNumber = (mobile: string): void => {
  const trimmed = typeof mobile === 'string' ? mobile.replace(/\D/g, '').trim() : ''
  if (trimmed) localStorage.setItem(STORAGE_KEYS.LOGIN_MOBILE, trimmed)
}

export const getLoginMobileNumber = (): string | null => {
  const val = localStorage.getItem(STORAGE_KEYS.LOGIN_MOBILE)
  if (!val) return null
  const trimmed = val.replace(/\D/g, '').trim()
  return trimmed || null
}

export const saveAuthData = (
  token: string,
  userData: UserData,
  refreshToken?: string,
  csrfToken?: string,
): void => {
  saveAuthToken(token)
  if (refreshToken) saveRefreshToken(refreshToken)
  saveCsrfToken(csrfToken || token)
  saveUserData(userData)
}

export const clearAuthData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.CSRF_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.API_KEY)
  localStorage.removeItem(STORAGE_KEYS.USER_DATA)
  localStorage.removeItem(STORAGE_KEYS.LOGIN_MOBILE)
  sessionStorage.removeItem(COMPLETE_PROFILE_PROMPT_SHOWN_KEY)

  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.startsWith('nucleotide_') || key.startsWith('persist:')) && key !== COOKIE_PREFERENCE_KEY) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(k => { try { localStorage.removeItem(k) } catch {} })

  try {
    sessionStorage.removeItem('nucleotide_checkout')
    sessionStorage.removeItem('nucleotide_last_confirmation_v1')
  } catch {}
}

export const isAuthenticated = (): boolean => {
  const csrf = getCsrfToken()
  const auth = getAuthToken()
  return (!!csrf && csrf !== '') || (!!auth && auth !== '')
}

const TEST_LOGIN_MOBILE = '9958847730'
const TEST_MEMBER_ID = '007'

export const getMemberIdForApi = (actualId: string | number | undefined | null): string | number => {
  const loginMobile = getLoginMobileNumber()
  if (loginMobile?.replace(/\D/g, '').trim() === TEST_LOGIN_MOBILE) return TEST_MEMBER_ID
  if (actualId != null) return typeof actualId === 'number' ? actualId : String(actualId)
  return ''
}

export { STORAGE_KEYS }
