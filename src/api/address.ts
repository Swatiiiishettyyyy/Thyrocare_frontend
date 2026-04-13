import { api } from './client'

export interface Address {
  address_id: number
  address_label: string
  street_address: string
  landmark?: string
  locality: string
  city: string
  state: string
  postal_code: string
  country: string
  save_for_future?: boolean
}

interface AddressListResponse {
  status?: string
  data?: Address[]
  addresses?: Address[]
}

export async function fetchAddresses(): Promise<Address[]> {
  const res = await api.get<AddressListResponse | Address[]>('/address/list')
  if (Array.isArray(res)) return res
  const list = (res as AddressListResponse).data ?? (res as AddressListResponse).addresses ?? []
  return list.map((a: any) => ({
    address_id: a.address_id,
    address_label: a.address_label,
    street_address: a.street_address,
    landmark: a.landmark,
    locality: a.locality ?? '',
    city: a.city,
    state: a.state,
    postal_code: a.postal_code,
    country: a.country,
    save_for_future: a.save_for_future,
  }))
}

export async function saveAddress(data: Address): Promise<Address> {
  return _saveAddressToEndpoint('/address/save', data)
}

export async function saveThyrocareAddress(data: Address): Promise<Address> {
  return _saveAddressToEndpoint('/thyrocare/address/save', data)
}

async function _saveAddressToEndpoint(endpoint: string, data: Address): Promise<Address> {
  const payload = {
    address_id: 0,
    address_label: data.address_label,
    street_address: data.street_address,
    landmark: data.landmark ?? '',
    locality: data.locality,
    city: data.city,
    state: data.state,
    postal_code: data.postal_code,
    country: data.country,
    save_for_future: true,
  }
  const res = await api.post<any>(endpoint, payload)
  const a = res.data ?? res
  return {
    address_id: a.address_id,
    address_label: a.address_label,
    street_address: a.street_address,
    landmark: a.landmark,
    locality: a.locality ?? data.locality,
    city: a.city,
    state: a.state,
    postal_code: a.postal_code,
    country: a.country,
    save_for_future: a.save_for_future,
  }
}
