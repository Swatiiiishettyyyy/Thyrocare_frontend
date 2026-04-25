export const getDeviceId = (): string => {
  if (typeof window === 'undefined') return 'device-web-unknown'
  const STORAGE_KEY = 'nucleotide_device_id'
  let deviceId = localStorage.getItem(STORAGE_KEY)
  if (!deviceId) {
    deviceId = `device-web-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
    localStorage.setItem(STORAGE_KEY, deviceId)
  }
  return deviceId
}

export const getBrowserInfo = (): { browser: string; version: string } => {
  if (typeof window === 'undefined') return { browser: 'Unknown', version: 'Unknown' }
  const ua = navigator.userAgent
  let browser = 'Unknown'
  let version = 'Unknown'
  if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
    browser = 'Chrome'
    version = ua.match(/Chrome\/(\d+)/)?.[1] ?? 'Unknown'
  } else if (ua.indexOf('Edg') > -1) {
    browser = 'Edge'
    version = ua.match(/Edg\/(\d+)/)?.[1] ?? 'Unknown'
  } else if (ua.indexOf('Firefox') > -1) {
    browser = 'Firefox'
    version = ua.match(/Firefox\/(\d+)/)?.[1] ?? 'Unknown'
  } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
    browser = 'Safari'
    version = ua.match(/Version\/(\d+)/)?.[1] ?? 'Unknown'
  } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
    browser = 'Opera'
    version = ua.match(/(?:Opera|OPR)\/(\d+)/)?.[1] ?? 'Unknown'
  }
  return { browser, version }
}

export const getDeviceDetails = (): string => {
  if (typeof window === 'undefined') return JSON.stringify({ browser: 'Unknown', version: 'Unknown' })
  const { browser, version } = getBrowserInfo()
  return JSON.stringify({
    browser,
    version,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  })
}

/**
 * IMPORTANT:
 * Our backend supports two auth modes:
 * - Web mode (cookies): device_platform "web" -> tokens in HttpOnly cookies
 * - Mobile mode (bearer): any non-web value -> tokens returned in JSON (access+refresh)
 *
 * In production, the frontend is often hosted on a different origin than the API, and
 * browsers may block third-party cookies. Using bearer tokens avoids refresh failures.
 */
export const getDevicePlatform = (): string => 'mobile_web'
