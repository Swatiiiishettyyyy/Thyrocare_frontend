import { api } from './client'

export interface SlotDay {
  date: string        // YYYY-MM-DD
  label: string       // e.g. "Sat, 8 Feb"
  slots: SlotTime[]
}

export interface SlotTime {
  start_time: string  // e.g. "09:00"
  end_time: string    // e.g. "11:00"
  label: string       // e.g. "9:00 AM - 11:00 AM"
}

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export interface SlotSearchExtras {
  pincode?: string
  thyrocare_product_id?: number
}

export async function searchSlots(
  groupId: string,
  dateFrom?: string,
  dateTo?: string,
  extras?: SlotSearchExtras,
): Promise<SlotDay[]> {
  const today = new Date()
  const from = dateFrom ?? toLocalDateStr(today)
  const to = dateTo ?? toLocalDateStr(new Date(today.getTime() + 6 * 86400000))

  const body: Record<string, unknown> = {
    group_id: groupId,
    date_from: from,
    date_to: to,
  }
  if (extras?.pincode) body.pincode = extras.pincode
  if (extras?.thyrocare_product_id != null) body.thyrocare_product_id = extras.thyrocare_product_id

  const res = await api.post<any>('/thyrocare/slots/search', body)

  // Normalize response — API may return various shapes
  let raw: any[] = []
  if (Array.isArray(res)) raw = res
  else if (Array.isArray(res?.data)) raw = res.data
  else if (Array.isArray(res?.data?.days)) raw = res.data.days
  else if (Array.isArray(res?.days)) raw = res.days
  else if (Array.isArray(res?.slots)) raw = res.slots

  return raw.map((day: any) => {
    const dateStr: string = day.date ?? day.appointment_date ?? ''
    const d = new Date(dateStr)
    const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    const rawSlots = day.slots ?? day.available_slots ?? day.time_slots ?? []
    const slots: SlotTime[] = rawSlots.map((s: any) => {
      // API returns camelCase: startTime/endTime
      const start = s.startTime ?? s.start_time ?? s.start ?? ''
      const end = s.endTime ?? s.end_time ?? s.end ?? ''
      return {
        start_time: start,
        end_time: end,
        label: formatSlotLabel(start, end),
      }
    })
    return { date: dateStr, label, slots }
  })
}

// POST /thyrocare/cart/set-appointment
export async function setAppointment(groupId: string, appointmentDate: string, appointmentStartTime: string): Promise<void> {
  await api.post('/thyrocare/cart/set-appointment', {
    group_id: groupId,
    appointment_date: appointmentDate,
    appointment_start_time: appointmentStartTime,
  })
}

function formatSlotLabel(start: string, end: string): string {
  return `${to12h(start)} - ${to12h(end)}`
}

function to12h(time: string): string {
  if (!time) return time
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}
