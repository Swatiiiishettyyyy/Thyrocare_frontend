import { api } from './client'

export interface BloodTestCoupon {
  coupon_code: string
  description?: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount: number
  max_discount_amount?: number | null
  special_type: 'standard' | 'corporate' | 'family' | 'founder'
  valid_until?: string | null
}

export interface ApplyCouponResponse {
  status: string
  message: string
  data: {
    coupon_code: string
    discount_type: string
    discount_value: number
    special_type: string
    discount_amount: number
    subtotal: number
    final_amount: number
  }
}

export async function applyBloodTestCoupon(couponCode: string): Promise<ApplyCouponResponse> {
  return api.post<ApplyCouponResponse>('/cart/blood-test/apply-coupon', {
    coupon_code: couponCode,
  })
}

export async function removeBloodTestCoupon(): Promise<void> {
  await api.delete<unknown>('/cart/blood-test/remove-coupon')
}

export async function listBloodTestCoupons(): Promise<BloodTestCoupon[]> {
  const res = await api.get<{ status: string; data: { coupons: BloodTestCoupon[] } }>(
    '/cart/blood-test/list-coupons'
  )
  return res?.data?.coupons ?? []
}
