import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'
import { CheckoutStepper } from '../components/CheckoutStepper'
import { OrderSummaryCard } from '../components/OrderSummaryCard'
import type { CartItem } from '../types'
import { searchSlots, setAppointment } from '../api/slots'
import type { SlotTime } from '../api/slots'
import {
  fetchPriceBreakup,
  getCheckoutPriceSummary,
  checkoutPricingSnapshotKey,
  fetchActiveGroups,
  fetchActiveGroupsForProduct,
  filterGroupsToMatchCartItems,
  type CartGroup,
} from '../api/cart'
import { fetchAddresses } from '../api/address'
import type { CheckoutSession } from '../hooks/useCheckoutSession'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/' },
  { label: 'Reports', href: '#' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '#' },
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
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
  const today = new Date(); today.setHours(0, 0, 0, 0)

  // Single shared slot state
  const firstGroup = session.groups[0]
  const restoredDate = firstGroup?.appointment_date
    ? (() => { const d = new Date(firstGroup.appointment_date + 'T00:00:00'); d.setHours(0, 0, 0, 0); return d })()
    : null

  const [calYear, setCalYear] = useState(restoredDate?.getFullYear() ?? today.getFullYear())
  const [calMonth, setCalMonth] = useState(restoredDate?.getMonth() ?? today.getMonth())
  const [selectedDate, setSelectedDate] = useState<Date | null>(restoredDate)
  const [slots, setSlots] = useState<SlotTime[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null)
  const [settingAppt, setSettingAppt] = useState(false)
  const [slotError, setSlotError] = useState<string | null>(null)
  const [apptSet, setApptSet] = useState(
    session.groups.length > 0 && session.groups.every(g => !!g.appointment_start_time)
  )
  const [collectionPincode, setCollectionPincode] = useState<string | undefined>(undefined)

  // Sync if groups arrive late
  useEffect(() => {
    if (session.groups.length > 0 && session.groups.every(g => !!g.appointment_start_time)) {
      setApptSet(true)
    }
  }, [session.groups])

  useEffect(() => {
    const aid = session.groups[0]?.address_id
    if (aid == null) {
      setCollectionPincode(undefined)
      return
    }
    fetchAddresses()
      .then(list => {
        const a = list.find(x => x.address_id === aid)
        const pc = a?.postal_code?.replace(/\D/g, '').slice(0, 6)
        setCollectionPincode(pc && pc.length === 6 ? pc : undefined)
      })
      .catch(() => setCollectionPincode(undefined))
  }, [session.groups])

  /** Recover groups when active-all was empty on checkout sync but cart has Thyrocare lines. */
  useEffect(() => {
    if (session.groups.length > 0) return
    const pids = [...new Set(items.map(i => i.thyrocareProductId).filter((x): x is number => x != null))]
    if (pids.length === 0) return
    let cancelled = false
    ;(async () => {
      try {
        let gr = await fetchActiveGroups()
        if (cancelled) return
        if (gr.length === 0 && pids.length === 1) {
          gr = await fetchActiveGroupsForProduct(pids[0])
        } else if (gr.length === 0 && pids.length > 1) {
          const merged: CartGroup[] = []
          for (const pid of pids) {
            if (cancelled) break
            const part = await fetchActiveGroupsForProduct(pid)
            merged.push(...part)
          }
          gr = merged
        }
        if (!cancelled && gr.length > 0) {
          const pruned = filterGroupsToMatchCartItems(gr, items)
          if (pruned.length > 0) onSessionUpdate({ groups: pruned })
        }
      } catch {
        /* keep empty state */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [session.groups.length, items, onSessionUpdate])

  useEffect(() => {
    const ids = session.groups.map(g => g.group_id).filter(Boolean)
    if (ids.length === 0) return
    const snap = checkoutPricingSnapshotKey(session.groups, items)
    if (session.pricingSnapshotKey === snap && session.thyrocarePricing) return
    let cancelled = false
    fetchPriceBreakup(ids)
      .then(pricing => {
        if (cancelled) return
        onSessionUpdate({
          netPayableAmount: pricing.net_payable_amount,
          thyrocarePricing: pricing,
          pricingSnapshotKey: checkoutPricingSnapshotKey(session.groups, items),
        })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [session.groups, session.pricingSnapshotKey, session.thyrocarePricing, items, onSessionUpdate])

  const { subtotal, savings, total: slotTotal } = getCheckoutPriceSummary(items, {
    thyrocarePricing: session.thyrocarePricing,
    netPayableAmount: session.netPayableAmount,
    groups: session.groups,
    pricingSnapshotKey: session.pricingSnapshotKey,
  })

  const confirmedLabel = firstGroup?.appointment_date && firstGroup?.appointment_start_time
    ? `${new Date(firstGroup.appointment_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · ${firstGroup.appointment_start_time}`
    : null

  async function handleDateSelect(date: Date) {
    setSelectedDate(date)
    setSlots([])
    setLoadingSlots(true)
    setDropdownOpen(false)
    setSelectedSlotIdx(null)
    setApptSet(false)
    setSlotError(null)
    const dateStr = toDateStr(date)
    // use first group to search slots
    const gid = session.groups[0]?.group_id
    if (!gid) { setLoadingSlots(false); return }
    try {
      const first = session.groups[0]
      const result = await searchSlots(gid, dateStr, dateStr, {
        pincode: collectionPincode,
        thyrocare_product_id: first?.thyrocare_product_id,
      })
      const daySlots = result[0]?.slots ?? []
      if (daySlots.length === 0) {
        setSlots([])
        setLoadingSlots(false)
        setSlotError('No slots available for this date, try another date.')
      } else {
        setSlots(daySlots)
        setLoadingSlots(false)
        setDropdownOpen(true)
      }
    } catch {
      setSlots([])
      setLoadingSlots(false)
      setDropdownOpen(false)
      setSlotError('Unable to load slots from the server. Please try again or pick another date.')
    }
  }

  async function handleSlotSelect(idx: number) {
    if (!selectedDate) return
    const slot = slots[idx]
    setSelectedSlotIdx(idx)
    setDropdownOpen(false)
    setSettingAppt(true)
    setApptSet(false)
    setSlotError(null)
    const dateStr = toDateStr(selectedDate)
    // apply slot to ALL groups
    try {
      await Promise.all(session.groups.map(g => setAppointment(g.group_id, dateStr, slot.start_time)))
    } catch {
      setSlotError('Could not save this time slot. Please try again.')
      setSettingAppt(false)
      return
    }
    try {
      const fresh = await fetchActiveGroups()
      if (fresh.length > 0) {
        onSessionUpdate({ groups: fresh })
      } else {
        session.groups.forEach(g =>
          onUpsertGroup({ ...g, appointment_date: dateStr, appointment_start_time: slot.start_time }),
        )
      }
    } catch {
      session.groups.forEach(g =>
        onUpsertGroup({ ...g, appointment_date: dateStr, appointment_start_time: slot.start_time }),
      )
    }
    setSettingAppt(false)
    setApptSet(true)
  }

  function buildCalCells(year: number, month: number): (Date | null)[] {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
    ]
  }

  const calCells = buildCalCells(calYear, calMonth)
  const selectedSlot = selectedSlotIdx !== null ? slots[selectedSlotIdx] : null
  const selectedDateLabel = selectedDate
    ? selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    : null

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
        <div style={{ flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 32 }}>

          <span style={{ fontSize: 'clamp(16px, 1.4vw, 20px)', fontWeight: 500, color: '#161616' }}>Select Collection Time</span>

          {session.groups.length === 0 ? (
            <div style={{ fontSize: 14, color: '#828282', fontFamily: 'Inter, sans-serif' }}>
              No active cart groups found.{' '}
              <button onClick={() => navigate('/address')} style={{ color: '#8B5CF6', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 0, textDecoration: 'underline' }}>
                Go back to Address
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Product labels */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {session.groups.map(g => (
                  <span key={g.group_id} style={{
                    background: '#F5F3FF', borderRadius: 122, padding: '4px 14px',
                    fontSize: 13, fontWeight: 500, color: '#8B5CF6', fontFamily: 'Poppins, sans-serif',
                    border: '1px solid #E7E1FF',
                  }}>
                    {g.product_name}
                    {g.member_ids.length > 0 && (
                      <span style={{ fontWeight: 400, color: '#828282', marginLeft: 6, fontSize: 12 }}>
                        · {g.member_ids.length} patient{g.member_ids.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </span>
                ))}
              </div>

              {/* Confirmed badge */}
              {confirmedLabel && (
                <span style={{ background: '#E6F6F3', borderRadius: 122, padding: '4px 14px', fontSize: 13, color: '#059669', fontFamily: 'Inter, sans-serif', alignSelf: 'flex-start' }}>
                  ✓ {confirmedLabel}
                </span>
              )}

              <div className="timeslot-picker" style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Calendar */}
                <div style={{ flex: '0 0 auto', width: 280, background: '#fff', borderRadius: 16, boxShadow: '0px 4px 20px rgba(0,0,0,0.06)', padding: '14px 16px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <button onClick={() => {
                      const m = calMonth === 0 ? 11 : calMonth - 1
                      const y = calMonth === 0 ? calYear - 1 : calYear
                      setCalMonth(m); setCalYear(y)
                    }} style={navBtn}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="#161616" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#161616' }}>{MONTHS[calMonth]} {calYear}</span>
                    <button onClick={() => {
                      const m = calMonth === 11 ? 0 : calMonth + 1
                      const y = calMonth === 11 ? calYear + 1 : calYear
                      setCalMonth(m); setCalYear(y)
                    }} style={navBtn}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#161616" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
                    {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#9CA3AF', fontFamily: 'Inter, sans-serif', padding: '2px 0' }}>{d}</div>)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                    {calCells.map((date, i) => {
                      if (!date) return <div key={i} style={{ aspectRatio: '1' }} />
                      const isPast = date < today
                      const isToday = toDateStr(date) === toDateStr(today)
                      const isSelected = selectedDate ? toDateStr(date) === toDateStr(selectedDate) : false
                      return (
                        <button key={i} disabled={isPast} onClick={() => handleDateSelect(date)} style={{
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
                <div className="timeslot-slotcol" style={{ flex: '0 1 220px', minWidth: 180, display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 2 }}>
                  <span style={{ fontSize: 13, color: '#414141', fontFamily: 'Inter, sans-serif' }}>
                    {selectedDate ? <>Time slot for <strong>{selectedDateLabel}</strong></> : 'Select a date first'}
                  </span>
                  {slotError && <div style={{ fontSize: 12, color: '#DC2626', fontFamily: 'Inter, sans-serif' }}>{slotError}</div>}
                  {loadingSlots ? (
                    <div style={{ fontSize: 13, color: '#828282', fontFamily: 'Inter, sans-serif' }}>Loading slots...</div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => slots.length > 0 && setDropdownOpen(o => !o)}
                        style={{
                          width: '100%', height: 44, borderRadius: 10, padding: '0 14px',
                          border: '1px solid #E7E1FF', background: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          cursor: slots.length > 0 ? 'pointer' : 'default',
                          fontFamily: 'Inter, sans-serif', fontSize: 13,
                          color: selectedSlot ? '#161616' : '#9CA3AF', boxSizing: 'border-box',
                        }}
                      >
                        <span>{settingAppt ? 'Setting...' : selectedSlot ? selectedSlot.label : 'Select a time slot'}</span>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
                          style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                          <path d="M4 6l4 4 4-4" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {dropdownOpen && slots.length > 0 && (
                        <div style={{
                          position: 'absolute', top: 48, left: 0, right: 0, zIndex: 50,
                          background: '#fff', borderRadius: 10, border: '1px solid #E7E1FF',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.1)', overflow: 'hidden',
                          maxHeight: 240, overflowY: 'auto',
                        }}>
                          {slots.map((slot, si) => (
                            <button key={si} onClick={() => handleSlotSelect(si)} style={{
                              width: '100%', padding: '11px 14px', border: 'none',
                              background: selectedSlotIdx === si ? '#F5F3FF' : '#fff',
                              color: selectedSlotIdx === si ? '#8B5CF6' : '#161616',
                              fontWeight: selectedSlotIdx === si ? 500 : 400,
                              fontSize: 13, fontFamily: 'Inter, sans-serif',
                              cursor: 'pointer', textAlign: 'left',
                              borderBottom: si < slots.length - 1 ? '1px solid #F3F4F6' : 'none',
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
          )}
        </div>

        {/* Sidebar */}
        <div className="checkout-summary" style={{ flex: '0 1 380px', width: '100%', maxWidth: 380, boxSizing: 'border-box' }}>
          <OrderSummaryCard
            itemCount={items.length}
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
