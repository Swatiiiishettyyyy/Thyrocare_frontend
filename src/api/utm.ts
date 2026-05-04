import { api } from './client'

export interface UtmTrackPayload {
  fingerprint:   string
  landing_url:   string
  user_id?:      number | null
  utm_source?:   string | null
  utm_medium?:   string | null
  utm_campaign?: string | null
  utm_term?:     string | null
  utm_content?:  string | null
}

export async function trackUtm(payload: UtmTrackPayload): Promise<void> {
  await api.post('/api/utm-tracking', payload)
}
