import { api } from '../api/client'
import { getDeviceId, getDevicePlatform, getDeviceDetails } from '../utils/deviceUtil'

export interface SendOTPRequest {
  mobile: string
  country_code?: string
  purpose?: string
}

export interface SendOTPResponse {
  success: boolean
  message?: string
  data?: { sessionId?: string; expiresIn?: number }
}

export interface VerifyOTPRequest {
  country_code: string
  mobile: string
  otp: string
  device_id: string
  device_platform: string
  device_details: string
}

export interface VerifyOTPResponse {
  success: boolean
  message?: string
  csrf_token?: string
  csrfToken?: string
  data?: {
    token?: string
    access_token?: string
    csrf_token?: string
    csrfToken?: string
    refreshToken?: string
    refresh_token?: string
    is_new_user?: boolean
    user?: { id: string; mobileNumber: string; name?: string }
  }
}

export interface LogoutResponse {
  status: 'success' | 'error'
  message?: string
}

export interface RefreshTokenResponse {
  status: 'success' | 'error'
  message?: string
  csrf_token?: string
  expires_in?: number
}

export const sendOTP = async (mobile: string, country_code = '+91'): Promise<SendOTPResponse> => {
  try {
    return await api.post<SendOTPResponse>('/auth/send-otp', { country_code, mobile, purpose: 'login' })
  } catch (error: any) {
    const data = error?.data || error?.response?.data || {}
    const detailsMessage = Array.isArray(data?.details) && data.details.length > 0
      ? data.details[0]?.message || data.details[0]?.msg
      : undefined
    throw { message: detailsMessage || data?.message || error?.message || 'Failed to send OTP', error: data || error, details: data?.details }
  }
}

export const verifyOTP = async (mobile: string, otp: string, country_code = '+91'): Promise<VerifyOTPResponse> => {
  try {
    const payload: VerifyOTPRequest = {
      country_code,
      mobile,
      otp,
      device_id: getDeviceId(),
      device_platform: getDevicePlatform(),
      device_details: getDeviceDetails(),
    }
    return await api.post<VerifyOTPResponse>('/auth/verify-otp', payload)
  } catch (error: any) {
    throw { message: error?.data?.message || error?.response?.data?.message || 'Failed to verify OTP', error: error?.data || error?.response?.data || error }
  }
}

export const refreshToken = async (): Promise<RefreshTokenResponse> => {
  try {
    return await api.post<RefreshTokenResponse>('/auth/refresh', {})
  } catch (error: any) {
    throw { message: error?.data?.message || 'Failed to refresh token', error: error?.data || error }
  }
}

export const logout = async (): Promise<LogoutResponse> => {
  try {
    return await api.post<LogoutResponse>('/auth/logout', {})
  } catch (error: any) {
    throw { message: error?.data?.message || 'Failed to logout', error: error?.data || error }
  }
}

export const authService = { sendOTP, verifyOTP, refreshToken, logout }
export default authService
