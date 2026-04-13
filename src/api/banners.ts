import { api } from './client'

export interface Banner {
  id: number
  title: string
  subtitle: string
  image_url: string
  action: { type: string; value: string }
  position: number
  is_active: boolean
}

interface BannersResponse {
  status: string
  message: string
  data: Banner[]
}

export async function fetchBanners(): Promise<Banner[]> {
  const res = await api.get<BannersResponse>('/banners')
  return res.data.filter(b => b.is_active).sort((a, b) => a.position - b.position)
}
