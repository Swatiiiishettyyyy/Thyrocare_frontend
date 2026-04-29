import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Navbar } from '../components'
import { CheckoutStepper } from '../components/CheckoutStepper'
import { OrderSummaryCard } from '../components/OrderSummaryCard'
import type { CartItem } from '../types'
import { searchSlots, setAppointment } from '../api/slots'
import type { SlotTime } from '../api/slots'
import {
  getCheckoutPriceSummary,
  checkoutPatientCount,
  fetchActiveGroups,
  filterGroupsToMatchCartItems,
  type CartGroup,
} from '../api/cart'
import type { CheckoutSession } from '../hooks/useCheckoutSession'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/' },
  { label: 'Reports', href: '#' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '#' },
]

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 768)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return isMobile
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function toDateStr(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface TimeSlotPageProps {
  cartCount?: number
  items: CartItem[]
  session: CheckoutSession
  onSessionUpdate: (patch: Partial<CheckoutSession>) => void
  onUpsertGroup: (group: CartGroup) => void
}

export default function TimeSlotPage({ cartCount, items, session, onSessionUpdate, onUpsertGroup }: TimeSlotPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()
  const blockReason = (location.state as any)?.checkoutBlockReason as string | undefined
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  type GroupUiState = {
    selectedDate: Date | null
    calYear: number
    calMonth: number
    slots: SlotTime[]
    loadingSlots: boolean
    dropdownOpen: boolean
    selectedSlotIdx: number | null
    settingAppt: boolean
    slotError: string | null
  }

  const [groupUi, setGroupUi] = useState<Record<string, GroupUiState>>({})

  const apptSet = useMemo(
    () => session.groups.length > 0 && session.groups.every(g => String(g.appointment_start_time ?? '').trim()),
    [session.groups],
  )

  // apptSet is derived from session.groups (avoids stale snapshot after set-appointment).

  // Always refresh groups from DB on page load (drop-off resume)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const gr = await fetchActiveGroups()
        if (cancelled) return
        if (gr.length > 0) {
          const pruned = filterGroupsToMatchCartItems(gr, items)
          if (pruned.length > 0) onSessionUpdate({ groups: pruned })
        }
      } catch {
        /* keep session */
      }
    })()
    return () => { cancelled = true }
  }, [items, onSessionUpdate])

  // Ensure UI state exists for all groups (prefill from appointment_date if present).
  useEffect(() => {
    if (session.groups.length === 0) return
    setGroupUi(prev => {
      let next = { ...prev }
      for (const g of session.groups) {
        const gid = String(g.group_id ?? '').trim()
        if (!gid) continue
        if (next[gid]) continue
        const restored = g.appointment_date
          ? (() => { const d = new Date(String(g.appointment_date) + 'T00:00:00'); d.setHours(0, 0, 0, 0); return d })()
          : null
        const baseYear = (restored ?? today).getFullYear()
        const baseMonth = (restored ?? today).getMonth()
        next = {
          ...next,
          [gid]: {
            selectedDate: restored,
            calYear: baseYear,
            calMonth: baseMonth,
            slots: [],
            loadingSlots: false,
            dropdownOpen: false,
            selectedSlotIdx: null,
            settingAppt: false,
            slotError: null,
          },
        }
      }
      return next
    })
  }, [session.groups, today])

  const { subtotal, savings, total: slotTotal } = getCheckoutPriceSummary(items, {
    thyrocarePricing: session.thyrocarePricing,
    netPayableAmount: session.netPayableAmount,
    groups: session.groups,
    pricingSnapshotKey: session.pricingSnapshotKey,
  })
  const patientCount = useMemo(() => checkoutPatientCount(items), [items])

  async function handleDateSelect(groupId: string, date: Date) {
    const gid = String(groupId).trim()
    if (!gid) return
    setGroupUi(prev => ({
      ...prev,
      [gid]: {
        ...(prev[gid] ?? {
          selectedDate: null,
          calYear: date.getFullYear(),
          calMonth: date.getMonth(),
          slots: [],
          loadingSlots: false,
          dropdownOpen: false,
          selectedSlotIdx: null,
          settingAppt: false,
          slotError: null,
        }),
        selectedDate: date,
        slots: [],
        loadingSlots: true,
        dropdownOpen: false,
        selectedSlotIdx: null,
        settingAppt: false,
        slotError: null,
      },
    }))
    const dateStr = toDateStr(date)
    const g = session.groups.find(x => x.group_id === gid)
    try {
      const result = await searchSlots(gid, dateStr, dateStr, {
        thyrocare_product_id: g?.thyrocare_product_id,
      })
      const daySlots = result[0]?.slots ?? []
      if (daySlots.length === 0) {
        setGroupUi(prev => ({
          ...prev,
          [gid]: { ...prev[gid], slots: [], loadingSlots: false, dropdownOpen: false, slotError: 'No slots available for this date, try another date.' },
        }))
      } else {
        setGroupUi(prev => ({
          ...prev,
          [gid]: { ...prev[gid], slots: daySlots, loadingSlots: false, dropdownOpen: true, slotError: null },
        }))
      }
    } catch (e: any) {
      const msg =
        (typeof e?.data?.message === 'string' && e.data.message) ||
        (typeof e?.message === 'string' && e.message) ||
        'Unable to load slots from the server. Please try again or pick another date.'
      console.error('[timeslot] searchSlots failed', { group_id: gid, date: dateStr, err: e })
      setGroupUi(prev => ({
        ...prev,
        [gid]: { ...prev[gid], slots: [], loadingSlots: false, dropdownOpen: false, slotError: msg },
      }))
    }
  }

  async function handleSlotSelect(groupId: string, idx: number) {
    const gid = String(groupId).trim()
    const ui = groupUi[gid]
    if (!ui?.selectedDate) return
    const slot = ui.slots[idx]
    if (!slot) return
    setGroupUi(prev => ({
      ...prev,
      [gid]: { ...prev[gid], selectedSlotIdx: idx, dropdownOpen: false, settingAppt: true, slotError: null },
    }))
    const dateStr = toDateStr(ui.selectedDate)
    try {
      await setAppointment(gid, dateStr, slot.start_time)
    } catch (e: any) {
      const msg =
        (typeof e?.data?.message === 'string' && e.data.message) ||
        (typeof e?.message === 'string' && e.message) ||
        'Could not save this time slot. Please try again.'
      console.error('[timeslot] setAppointment failed', { group_id: gid, date: dateStr, slot: slot.start_time, err: e })
      setGroupUi(prev => ({
        ...prev,
        [gid]: { ...prev[gid], settingAppt: false, slotError: msg },
      }))
      return
    }
    try {
      const fresh = await fetchActiveGroups()
      if (fresh.length > 0) {
        const pruned = filterGroupsToMatchCartItems(fresh, items)
        if (pruned.length > 0) onSessionUpdate({ groups: pruned })
      } else {
        const g = session.groups.find(x => x.group_id === gid)
        if (g) onUpsertGroup({ ...g, appointment_date: dateStr, appointment_start_time: slot.start_time })
      }
    } catch {
      const g = session.groups.find(x => x.group_id === gid)
      if (g) onUpsertGroup({ ...g, appointment_date: dateStr, appointment_start_time: slot.start_time })
    }
    setGroupUi(prev => ({
      ...prev,
      [gid]: { ...prev[gid], settingAppt: false },
    }))
  }

  function buildCalCells(year: number, month: number): (Date | null)[] {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
    ]
  }

  const groups = session.groups

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Poppins', sans-serif", overflowX: 'hidden' }}>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" cartCount={cartCount} hideSearchOnMobile onCtaClick={() => navigate('/cart')} />

      {/* Breadcrumb */}
      <div
        className="cart-breadcrumb"
        style={{
          padding: '14px clamp(16px, 5vw, 56px)',
          borderBottom: '1px solid #F3F4F6',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 14, color: '#6B7280', cursor: 'pointer' }} onClick={() => navigate('/')}>Tests</span>
        <span style={{ fontSize: 14, color: '#6B7280' }}>›</span>
        <span style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>Checkout</span>
      </div>

      <CheckoutStepper activeStep={2} />

      <div className="checkout-layout checkout-layout--timeslot" style={{
        display: 'flex', flexWrap: 'wrap', gap: 28,
        padding: '0 clamp(16px, 4vw, 56px) 60px',
        maxWidth: 1700, margin: '0 auto', alignItems: 'flex-start',
        boxSizing: 'border-box', width: '100%',
      }}>
        {/* Left column */}
        <div style={{ flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 32 }}>

          <span style={{ fontSize: 'clamp(16px, 1.4vw, 20px)', fontWeight: 500, color: '#161616' }}>Select Collection Time</span>
          {blockReason && (
            <div role="alert" style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 12, padding: '10px 12px', fontSize: 13, color: '#92400E', fontFamily: 'Inter, sans-serif' }}>
              {blockReason}
            </div>
          )}

          {groups.length === 0 ? (
            <div style={{ fontSize: 14, color: '#828282', fontFamily: 'Inter, sans-serif' }}>
              No active cart groups found.{' '}
              <button onClick={() => navigate('/address')} style={{ color: '#8B5CF6', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 0, textDecoration: 'underline' }}>
                Go back to Address
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {groups.map(g => {
                const gid = String(g.group_id ?? '').trim()
                const ui = groupUi[gid]
                const calCells = ui ? buildCalCells(ui.calYear, ui.calMonth) : []
                const selectedSlot = ui?.selectedSlotIdx != null ? ui.slots[ui.selectedSlotIdx] : null
                const selectedDateLabel = ui?.selectedDate
                  ? ui.selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
                  : null
                const confirmedLabel = g.appointment_date && g.appointment_start_time
                  ? `${new Date(g.appointment_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · ${g.appointment_start_time}`
                  : null

                return (
                  <div key={gid} style={{ border: '1px solid #E7E1FF', borderRadius: 16, padding: isMobile ? '12px 10px' : 16, background: '#fff', boxShadow: '0px 4px 20px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#101129', fontFamily: 'Poppins, sans-serif' }}>
                          {g.product_name}
                        </span>
                        <span style={{ fontSize: 12, color: '#828282', fontFamily: 'Inter, sans-serif' }}>
                          {g.member_ids.length} patient{g.member_ids.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {confirmedLabel && (
                        <span style={{ background: '#E6F6F3', borderRadius: 122, padding: '4px 14px', fontSize: 13, color: '#059669', fontFamily: 'Inter, sans-serif' }}>
                          ✓ {confirmedLabel}
                        </span>
                      )}
                    </div>

                    <div className="timeslot-picker" style={{ display: 'flex', gap: isMobile ? 14 : 20, alignItems: isMobile ? 'stretch' : 'flex-start', flexWrap: 'wrap', marginTop: 14, width: '100%' }}>
                      {/* Calendar */}
                      <div className="timeslot-calendar-container" style={{ flex: '1 1 260px', minWidth: 0, background: '#fff', borderRadius: 16, padding: '14px 12px', boxSizing: 'border-box', border: '1px solid #F3F4F6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <button
                            onClick={() => {
                              if (!gid) return
                              setGroupUi(prev => {
                                const cur = prev[gid]
                                if (!cur) return prev
                                const m = cur.calMonth === 0 ? 11 : cur.calMonth - 1
                                const y = cur.calMonth === 0 ? cur.calYear - 1 : cur.calYear
                                return { ...prev, [gid]: { ...cur, calMonth: m, calYear: y } }
                              })
                            }}
                            style={navBtn}
                          >
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="#161616" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#161616' }}>{MONTHS[ui?.calMonth ?? today.getMonth()]} {ui?.calYear ?? today.getFullYear()}</span>
                          <button
                            onClick={() => {
                              if (!gid) return
                              setGroupUi(prev => {
                                const cur = prev[gid]
                                if (!cur) return prev
                                const m = cur.calMonth === 11 ? 0 : cur.calMonth + 1
                                const y = cur.calMonth === 11 ? cur.calYear + 1 : cur.calYear
                                return { ...prev, [gid]: { ...cur, calMonth: m, calYear: y } }
                              })
                            }}
                            style={navBtn}
                          >
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#161616" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4, gap: 2 }}>
                          {(isMobile ? DAYS_SHORT : DAYS).map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: isMobile ? 11 : 10, color: '#9CA3AF', fontFamily: 'Inter, sans-serif', padding: '2px 0' }}>{d}</div>)}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                          {calCells.map((date, i) => {
                            if (!date) return <div key={i} style={{ aspectRatio: '1' }} />
                            const isPast = date < today
                            const isToday = toDateStr(date) === toDateStr(today)
                            const isSelected = ui?.selectedDate ? toDateStr(date) === toDateStr(ui.selectedDate) : false
                            return (
                              <button key={i} disabled={isPast} onClick={() => handleDateSelect(gid, date)} style={{
                                width: '100%', aspectRatio: '1', borderRadius: '50%', border: 'none',
                                background: isSelected ? '#8B5CF6' : 'transparent',
                                color: isSelected ? '#fff' : isPast ? '#D1D5DB' : isToday ? '#8B5CF6' : '#374151',
                                fontWeight: isSelected ? 600 : 400, fontSize: 12, fontFamily: 'Inter, sans-serif',
                                cursor: isPast ? 'not-allowed' : 'pointer',
                                outline: isToday && !isSelected ? '1.5px solid #8B5CF6' : 'none',
                                transition: 'background 0.15s', padding: 0,
                              }}>
                                {date.getDate()}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Slot dropdown */}
                      <div className="timeslot-slotcol" style={{ flex: '1 1 180px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontSize: 13, color: '#414141', fontFamily: 'Inter, sans-serif' }}>
                          {ui?.selectedDate ? <>Time slot for <strong>{selectedDateLabel}</strong></> : 'Select a date first'}
                        </span>
                        {ui?.slotError && <div style={{ fontSize: 12, color: '#DC2626', fontFamily: 'Inter, sans-serif' }}>{ui.slotError}</div>}
                        {ui?.loadingSlots ? (
                          <div style={{ fontSize: 13, color: '#828282', fontFamily: 'Inter, sans-serif' }}>Loading slots...</div>
                        ) : (
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={() => ui && ui.slots.length > 0 && setGroupUi(prev => ({ ...prev, [gid]: { ...prev[gid], dropdownOpen: !prev[gid].dropdownOpen } }))}
                              style={{
                                width: '100%', height: 44, borderRadius: 10, padding: '0 14px',
                                border: '1px solid #E7E1FF', background: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                cursor: ui && ui.slots.length > 0 ? 'pointer' : 'default',
                                fontFamily: 'Inter, sans-serif', fontSize: 13,
                                color: selectedSlot ? '#161616' : '#9CA3AF', boxSizing: 'border-box',
                              }}
                            >
                              <span>{ui?.settingAppt ? 'Setting...' : selectedSlot ? selectedSlot.label : 'Select a time slot'}</span>
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
                                style={{ transform: ui?.dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                                <path d="M4 6l4 4 4-4" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            {ui?.dropdownOpen && ui.slots.length > 0 && (
                              <div style={{
                                position: 'absolute', top: 48, left: 0, right: 0, zIndex: 50,
                                background: '#fff', borderRadius: 10, border: '1px solid #E7E1FF',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.1)', overflow: 'hidden',
                                maxHeight: 240, overflowY: 'auto',
                              }}>
                                {ui.slots.map((slot, si) => (
                                  <button key={si} onClick={() => handleSlotSelect(gid, si)} style={{
                                    width: '100%', padding: '11px 14px', border: 'none',
                                    background: ui.selectedSlotIdx === si ? '#F5F3FF' : '#fff',
                                    color: ui.selectedSlotIdx === si ? '#8B5CF6' : '#161616',
                                    fontWeight: ui.selectedSlotIdx === si ? 500 : 400,
                                    fontSize: 13, fontFamily: 'Inter, sans-serif',
                                    cursor: 'pointer', textAlign: 'left',
                                    borderBottom: si < ui.slots.length - 1 ? '1px solid #F3F4F6' : 'none',
                                  }}>
                                    {slot.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="checkout-summary" style={{ flex: '0 1 380px', width: '100%', maxWidth: 380, boxSizing: 'border-box' }}>
          <OrderSummaryCard
            itemCount={patientCount}
            subtotal={subtotal}
            savings={savings}
            total={slotTotal}
            onBack={() => navigate('/address')}
            onContinue={() => navigate('/payment')}
            continueDisabled={!apptSet}
          />
        </div>
      </div>
    </div>
  )
}

const navBtn: React.CSSProperties = {
  width: 30, height: 30, borderRadius: '50%', border: '1px solid #E7E1FF',
  background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', padding: 0,
}
