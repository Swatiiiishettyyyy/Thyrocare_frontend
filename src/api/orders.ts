import { api } from './client'

/**
 * POST /orders/create — Orders module: create internal order + Razorpay order from cart.
 * Do **not** use `POST /thyrocare/orders/create` from the app; Thyrocare is invoked server-side after payment.
 *
 * Body: `{ cart_id }` (reference; all active cart lines for the user are included per API).
 */
export interface PlaceOrderCreatePayload {
  cart_id: number
}

/** @deprecated Use PlaceOrderCreatePayload */
export type BloodTestOrderCreatePayload = PlaceOrderCreatePayload
/** @deprecated Use PlaceOrderCreatePayload */
export type CreateOrderPayload = PlaceOrderCreatePayload

/** Matches OpenAPI `RazorpayOrderResponse` from POST /orders/create */
export interface CreateOrderResponse {
  order_id: number
  order_number: string
  razorpay_order_id: string
  amount: number
  currency?: string
}

export interface VerifyPaymentPayload {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  order_id: number
}

export interface VerifyPaymentResponse {
  status: string
  order_id?: number
  message?: string
}

export interface OrderMember {
  member_id: number
  name: string
  relation: string
  age: number
  gender: string
  /** Present when the list API includes contact on the member payload */
  mobile?: string
}

export interface OrderAddress {
  address_id: number
  address_label: string
  street_address: string
  city: string
  state: string
  postal_code: string
}

export interface OrderItem {
  product_id: number
  product_name: string
  group_id: string
  member_ids: number[]
  total_amount: number
  member_address_map: Array<{
    member: OrderMember
    address: OrderAddress
    order_item_id: number
    order_status: string
    scheduled_date: string | null
  }>
}

export interface Order {
  order_number: string
  razorpay_order_id: string
  thyrocare_order_id?: string
  total_amount: number
  subtotal: number
  discount: number
  order_status: string
  payment_status: string
  payment_method: string
  payment_method_details: string
  created_at: string
  order_date: string
  items: OrderItem[]
}

/** Earliest non-null scheduled_date across all line items (not only items[0]). */
export function getEarliestScheduledDate(order: Order): string | null {
  let best: string | null = null
  let bestTime = Infinity
  for (const it of order.items) {
    for (const row of it.member_address_map) {
      const d = row.scheduled_date
      if (!d) continue
      const t = new Date(d).getTime()
      if (Number.isNaN(t)) continue
      if (t < bestTime) {
        bestTime = t
        best = d
      }
    }
  }
  return best
}

// Thyrocare live order details shape
export interface ThyrocareOrderDetails {
  order_number: string
  thyrocare_order_id: string
  current_status: string | null
  current_status_raw: string
  appointment_date: string | null
  phlebo: { name: string | null; contact: string | null }
  payment: {
    amount: number
    currency: string
    payment_status: string
    payment_method: string
    razorpay_payment_id: string
    payment_date: string
  }
  patients: any[]
  status_history: any[]
}

export async function fetchThyrocareReport(thyrocareOrderId: string, leadId: string): Promise<{ url: string }> {
  const res = await api.get<any>(`/thyrocare/orders/${thyrocareOrderId}/reports/${leadId}?type=pdf`)
  return res?.data ?? res
}

export async function downloadPatientReport(patientId: string): Promise<{ url: string }> {
  const res = await api.get<any>(`/thyrocare/reports/${patientId}/download`)
  return res?.data ?? res
}

export async function fetchOrders(): Promise<Order[]> {
  const res = await api.get<any>('/orders/list')
  if (Array.isArray(res)) return res
  return res?.data ?? res?.orders ?? []
}

export async function fetchOrderByThyrocareId(thyrocareOrderId: string): Promise<ThyrocareOrderDetails> {
  const res = await api.get<any>(`/thyrocare/orders/${thyrocareOrderId}/order-details`)
  // API may wrap in { data: ... } or return directly
  const details = res?.data ?? res
  console.log('[fetchOrderByThyrocareId raw]', res)
  return details
}

export async function createOrder(payload: PlaceOrderCreatePayload): Promise<CreateOrderResponse> {
  return api.post<CreateOrderResponse>('/orders/create', payload)
}

export async function verifyPayment(payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> {
  return api.post<VerifyPaymentResponse>('/orders/verify', payload)
}
