import { useState, useEffect, useMemo } from 'react'
import profileIcon from '../assets/figma/checkout-pages/profile.svg'
import familyIcon from '../assets/figma/checkout-pages/family.svg'
import selectIcon from '../assets/figma/checkout-pages/select.svg'
import { useNavigate, useLocation } from 'react-router-dom'
import { Navbar } from '../components'
import { AddAddressModal } from '../components/AddAddressModal'
import { CheckoutStepper } from '../components/CheckoutStepper'
import { OrderSummaryCard } from '../components/OrderSummaryCard'
import type { CartItem } from '../types'
import { fetchMembers, saveMember } from '../api/member'
import { fetchAddresses } from '../api/address'
import {
  fetchActiveGroups,
  checkPincodeServiceability,
  getCheckoutPriceSummary,
  checkoutPatientCount,
  upsertCartByProduct,
  pullCheckoutSnapshot,
} from '../api/cart'
import type { CartGroup } from '../api/cart'
import type { Member } from '../api/member'
import type { Address } from '../api/address'
import type { CheckoutSession } from '../hooks/useCheckoutSession'

function isSelfMember(m: Member): boolean {
  return (m.relation ?? '').toLowerCase() === 'self'
}

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/' },
  { label: 'Reports', href: '#' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '#' },
]

const OVERLAY: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
}
const MODAL: React.CSSProperties = {
  background: '#fff', borderRadius: 20, padding: 28, width: 420,
  display: 'flex', flexDirection: 'column', gap: 16, boxSizing: 'border-box',
}
const INPUT: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1px solid #E7E1FF', outline: 'none',
  fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#161616',
  boxSizing: 'border-box',
}
const LABEL: React.CSSProperties = {
  fontSize: 13, fontFamily: 'Inter, sans-serif', color: '#414141',
  marginBottom: 4, display: 'block',
}

interface AddressPageProps {
  cartCount?: number
  items: CartItem[]
  session: CheckoutSession
  onSessionUpdate: (patch: Partial<CheckoutSession>) => void
  onUpsertGroup: (group: CartGroup) => void
}

export default function AddressPage({ cartCount, items, session, onSessionUpdate, onUpsertGroup }: AddressPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const blockReason = (location.state as any)?.checkoutBlockReason as string | undefined

  const [members, setMembers] = useState<Member[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  // per-product: selected patient member_ids (any mix of self + family; length must === cart quantity)
  const [memberMap, setMemberMap] = useState<Record<number, number[]>>({})
  /** Which list is visible: profile only vs family only (selections in `memberMap` are kept when toggling) */
  const [memberListFocus, setMemberListFocus] = useState<Record<number, 'profile' | 'family'>>({})
  // per-product address (one product group = one address)
  const [addressMap, setAddressMap] = useState<Record<number, number | null>>({})
  const [serviceabilityMap, setServiceabilityMap] = useState<Record<number, { checking: boolean; serviceable: boolean | null; message?: string }>>({})
  const [upsertError, setUpsertError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // member modal — tracks which productId triggered it
  const [memberModalProductId, setMemberModalProductId] = useState<number | null>(null)
  const [newMember, setNewMember] = useState({ name: '', relation: 'Spouse', age: '', gender: 'M', dob: '', mobile: '' })
  const [savingMember, setSavingMember] = useState(false)
  const [showGenderModal, setShowGenderModal] = useState(false)

  const [showAddressModal, setShowAddressModal] = useState(false)

  const { subtotal, savings, total: displayTotal } = getCheckoutPriceSummary(items, {
    thyrocarePricing: session.thyrocarePricing,
    netPayableAmount: session.netPayableAmount,
    groups: session.groups,
    pricingSnapshotKey: session.pricingSnapshotKey,
  })
  const patientCount = useMemo(() => checkoutPatientCount(items), [items])

  useEffect(() => {
    async function init() {
      try {
        const [m, a, activeGroups] = await Promise.all([fetchMembers(), fetchAddresses(), fetchActiveGroups()])
        setMembers(m)
        setAddresses(a)
        const mMap: Record<number, number[]> = {}
        const aMap: Record<number, number | null> = {}
        for (const g of activeGroups) {
          mMap[g.thyrocare_product_id] = g.member_ids
          aMap[g.thyrocare_product_id] = g.address_id ?? null
          onUpsertGroup(g)
        }
        for (const item of items) {
          if (!item.thyrocareProductId) continue
          const pid = item.thyrocareProductId
          if (!mMap[pid]) {
            const sg = session.groups.find(g => g.thyrocare_product_id === pid)
            mMap[pid] = sg?.member_ids ?? []
            if (aMap[pid] == null) aMap[pid] = sg?.address_id ?? null
          }
          if (aMap[pid] == null) aMap[pid] = null
        }
        // If user reduced patients on Cart, do not keep extra saved members here.
        for (const item of items) {
          const pid = item.thyrocareProductId
          if (!pid) continue
          const needed = Math.max(1, item.quantity || 1)
          const cur = mMap[pid] ?? []
          if (Array.isArray(cur) && cur.length > needed) {
            mMap[pid] = cur.slice(0, needed)
          }
        }
        setMemberMap(mMap)
        setAddressMap(aMap)
      } catch {
        const mMap: Record<number, number[]> = {}
        const aMap: Record<number, number | null> = {}
        for (const item of items) {
          if (!item.thyrocareProductId) continue
          const pid = item.thyrocareProductId
          const sg = session.groups.find(g => g.thyrocare_product_id === pid)
          mMap[pid] = sg?.member_ids ?? []
          aMap[pid] = sg?.address_id ?? null
        }
        for (const item of items) {
          const pid = item.thyrocareProductId
          if (!pid) continue
          const needed = Math.max(1, item.quantity || 1)
          const cur = mMap[pid] ?? []
          if (Array.isArray(cur) && cur.length > needed) {
            mMap[pid] = cur.slice(0, needed)
          }
        }
        setMemberMap(mMap)
        setAddressMap(aMap)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep member/address maps consistent with cart quantity when user goes back to Cart and edits patients.
  // - If qty decreases: truncate selected members to match qty (can't keep extra members).
  // - If qty increases: keep existing selection; user must add more members to reach qty.
  useEffect(() => {
    if (loading) return

    setMemberMap(prev => {
      let next = prev
      let changed = false
      for (const item of items) {
        const pid = item.thyrocareProductId
        if (!pid) continue
        const needed = Math.max(1, item.quantity || 1)
        const cur = next[pid] ?? []
        if (!Array.isArray(cur)) continue
        if (cur.length > needed) {
          if (next === prev) next = { ...prev }
          next[pid] = cur.slice(0, needed)
          changed = true
        } else if (!(pid in next)) {
          if (next === prev) next = { ...prev }
          next[pid] = cur
          changed = true
        }
      }
      return changed ? next : prev
    })

    setAddressMap(prev => {
      let next = prev
      let changed = false
      for (const item of items) {
        const pid = item.thyrocareProductId
        if (!pid) continue
        if (!(pid in next)) {
          if (next === prev) next = { ...prev }
          next[pid] = null
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [items, loading])


  function setProductMembers(productId: number, memberIds: number[]) {
    setMemberMap(prev => ({ ...prev, [productId]: memberIds }))
  }
  async function selectProductAddress(productId: number, addressId: number) {
    setAddressMap(prev => ({ ...prev, [productId]: addressId }))
    const addr = addresses.find(a => a.address_id === addressId)
    if (!addr?.postal_code || addr.postal_code.length !== 6) return
    setServiceabilityMap(prev => ({ ...prev, [productId]: { checking: true, serviceable: null } }))
    try {
      const result = await checkPincodeServiceability(addr.postal_code)
      setServiceabilityMap(prev => ({
        ...prev,
        [productId]: { checking: false, serviceable: result.serviceable, message: result.message },
      }))
    } catch {
      setServiceabilityMap(prev => ({
        ...prev,
        [productId]: {
          checking: false,
          serviceable: false,
          message: 'Could not verify pincode. Check your connection and try again.',
        },
      }))
    }
  }

  const canContinue = items.every(item => {
    if (!item.thyrocareProductId) return false
    const pid = item.thyrocareProductId
    const memberIds = memberMap[pid] ?? []
    const addrId = addressMap[pid] ?? null
    const svc = serviceabilityMap[pid] ?? { checking: false, serviceable: null }
    return memberIds.length === item.quantity && addrId != null && svc.serviceable === true && !svc.checking
  })

  async function handleContinue() {
    if (!canContinue || submitting) return
    setSubmitting(true)
    setUpsertError(null)
    try {
      // IMPORTANT: upsert sequentially.
      // Some backends race/500 when multiple `/thyrocare/cart/upsert` run concurrently for the same cart.
      const updatedGroups: CartGroup[] = []
      for (const item of items.filter(i => i.thyrocareProductId)) {
        const pid = item.thyrocareProductId!
        const memberIds = memberMap[pid] ?? []
        const selectedAddressId = addressMap[pid] ?? null
        if (!selectedAddressId) continue
        const existingGroup = session.groups.find(g => g.thyrocare_product_id === pid)

        let groupId: string
        try {
          groupId = await upsertCartByProduct({
            thyrocare_product_id: pid,
            member_ids: memberIds,
            address_id: selectedAddressId,
            group_id: existingGroup?.group_id ?? null,
          })
        } catch (e: any) {
          const msg =
            (typeof e?.data?.message === 'string' && e.data.message) ||
            (typeof e?.message === 'string' && e.message) ||
            'Could not update cart. Please try again.'
          throw new Error(`${msg} (${item.name})`)
        }

        const updated: CartGroup = {
          ...(existingGroup ?? {
            group_id: groupId,
            thyrocare_product_id: pid,
            product_name: item.name,
            items: [],
          }),
          group_id: groupId,
          member_ids: memberIds,
          address_id: selectedAddressId,
          appointment_date: existingGroup?.appointment_date ?? '',
          appointment_start_time: existingGroup?.appointment_start_time ?? '',
        }
        updatedGroups.push(updated)
        onUpsertGroup(updated)
      }
      const groupIds = updatedGroups.map(g => g.group_id).filter(Boolean)

      if (groupIds.length === 0) {
        setUpsertError('Could not save cart groups. Please try again.')
        setSubmitting(false)
        return
      }

      try {
        const snap = await pullCheckoutSnapshot({
          previousGroups: updatedGroups,
          localOnlyItems: [],
          fallbackItems: items,
        })
        const nextItems = snap.cartItems.length > 0 ? snap.cartItems : items
        const nextGroups = snap.groups.length > 0 ? snap.groups : updatedGroups
        onSessionUpdate({
          cartItems: nextItems,
          groups: nextGroups,
          netPayableAmount: null,
          thyrocarePricing: null,
          pricingSnapshotKey: null,
        })
        navigate('/timeslot')
      } catch {
        setUpsertError('Unable to confirm price, please retry.')
        setSubmitting(false)
        return
      }
    } catch (err: any) {
      setUpsertError(
        (typeof err?.message === 'string' && err.message) ||
          err?.data?.message ||
          'Failed to save your selection. Please try again.',
      )
    }
    setSubmitting(false)
  }

  async function handleSaveMember() {
    if (!newMember.name || !newMember.age || !newMember.dob || !newMember.mobile) return
    if (new Date(newMember.dob) >= new Date()) return
    const mobile10 = newMember.mobile.replace(/\D/g, '').slice(-10)
    if (mobile10.length !== 10) return
    const productIdForModal = memberModalProductId
    const payload: Member = {
      member_id: 0,
      name: newMember.name,
      relation: newMember.relation,
      age: parseInt(newMember.age, 10),
      gender: newMember.gender,
      dob: newMember.dob,
      mobile: mobile10,
    }
    setSavingMember(true)
    try {
      const saved = await saveMember(payload)
      setMembers(prev => [...prev.filter(m => m.member_id !== saved.member_id), saved])
      if (productIdForModal != null) {
        const line = items.find(i => i.thyrocareProductId === productIdForModal)
        const cap = line?.quantity ?? 1
        setMemberMap(prev => {
          const cur = prev[productIdForModal] ?? []
          if (cur.includes(saved.member_id)) return prev
          if (cur.length >= cap) return prev
          return { ...prev, [productIdForModal]: [...cur, saved.member_id] }
        })
      }
      setMemberModalProductId(null)
      setNewMember({ name: '', relation: 'Spouse', age: '', gender: 'M', dob: '', mobile: '' })
    } catch {
      /* CORS / API */
    } finally {
      setSavingMember(false)
    }
  }

  const showMemberModal = memberModalProductId !== null
  function setShowMemberModal(open: boolean) { if (!open) setMemberModalProductId(null) }

  function genderLabel(value: string) {
    return value === 'F' ? 'Female' : 'Male'
  }

  function selectGender(value: 'M' | 'F') {
    setNewMember(p => ({ ...p, gender: value }))
    setShowGenderModal(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Poppins', sans-serif" }}>
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

      <CheckoutStepper activeStep={1} />
      <div className="checkout-layout checkout-layout--address" style={{ display: 'flex', gap: 32, padding: '0 56px 60px', maxWidth: 1600, margin: '0 auto', alignItems: 'flex-start' }}>
        <div className="checkout-leftcol" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 32 }}>
          {blockReason && (
            <div role="alert" style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 12, padding: '10px 12px', fontSize: 13, color: '#92400E', fontFamily: 'Inter, sans-serif' }}>
              {blockReason}
            </div>
          )}
          {loading ? (
            <p style={{ color: '#828282', fontSize: 14, fontFamily: 'Inter,sans-serif' }}>Loading...</p>
          ) : (
            <>
              {/* Per-product: toggle + member selection */}
              {items.map(item => {
                if (!item.thyrocareProductId) return null
                const productId = item.thyrocareProductId
                const memberIds = memberMap[productId] ?? []
                const needed = item.quantity
                const focus = memberListFocus[productId] ?? 'profile'
                const selfList = members.filter(isSelfMember)
                const familyList = members.filter(m => !isSelfMember(m))
                const showProfileList = focus === 'profile'
                const showFamilyList = focus === 'family'

                function renderMemberRow(member: Member) {
                  const isSelected = memberIds.includes(member.member_id)
                  const isDisabled = !isSelected && memberIds.length >= needed
                  return (
                    <div key={member.member_id}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          if (!isDisabled) {
                            setProductMembers(productId, isSelected
                              ? memberIds.filter(id => id !== member.member_id)
                              : [...memberIds, member.member_id])
                          }
                        }
                      }}
                      onClick={() => {
                        if (isDisabled) return
                        setProductMembers(productId, isSelected
                          ? memberIds.filter(id => id !== member.member_id)
                          : [...memberIds, member.member_id])
                      }}
                      style={{
                        background: '#fff', boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)', borderRadius: 20,
                        outline: isSelected ? '1px solid #8B5CF6' : '1px solid #E7E1FF', outlineOffset: '-1px',
                        padding: '14px 16px', cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.5 : 1,
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input type="checkbox" checked={isSelected} readOnly style={{ width: 18, height: 18, accentColor: '#8B5CF6', flexShrink: 0 }} />
                        <img src={selectIcon} alt="" width={40} height={40} style={{ borderRadius: '50%', flexShrink: 0 }} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif' }}>{member.name}</span>
                            <span style={{ background: '#E7E1FF', borderRadius: 122, padding: '1px 10px', fontSize: 12, color: '#8B5CF6', fontFamily: 'Inter, sans-serif' }}>{member.relation}</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#828282', fontFamily: 'Inter, sans-serif' }}>{member.age} yr · {member.gender === 'M' ? 'Male' : 'Female'}</div>
                        </div>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={productId} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #F5F3FF 0%, #fff 100%)',
                      borderRadius: 14, padding: '14px 16px', border: '1px solid #E7E1FF',
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#101129', fontFamily: 'Poppins, sans-serif' }}>
                        {item.name} — select {needed} patient{needed !== 1 ? 's' : ''} for this order
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 18 }}>
                      <div
                        role="button"
                        tabIndex={0}
                        aria-pressed={showProfileList}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMemberListFocus(p => ({ ...p, [productId]: 'profile' })) } }}
                        onClick={() => setMemberListFocus(p => ({ ...p, [productId]: 'profile' }))}
                        style={{
                          flex: 1, minHeight: 72, borderRadius: 20,
                          outline: showProfileList ? '2px solid #8B5CF6' : '1px solid #E7E1FF',
                          outlineOffset: '-1px', background: '#fff', boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
                          display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', cursor: 'pointer',
                        }}
                      >
                        <img src={profileIcon} alt="" width={40} height={40} style={{ borderRadius: '50%' }} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif' }}>For Myself</div>
                          <div style={{ fontSize: 12, color: '#828282', fontFamily: 'Inter, sans-serif' }}>
                            Your profile only
                          </div>
                        </div>
                      </div>
                      <div
                        role="button"
                        tabIndex={0}
                        aria-pressed={showFamilyList}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMemberListFocus(p => ({ ...p, [productId]: 'family' })) } }}
                        onClick={() => setMemberListFocus(p => ({ ...p, [productId]: 'family' }))}
                        style={{
                          flex: 1, minHeight: 72, borderRadius: 20,
                          outline: showFamilyList ? '2px solid #8B5CF6' : '1px solid #E7E1FF',
                          outlineOffset: '-1px', background: '#fff', boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)',
                          display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', cursor: 'pointer',
                        }}
                      >
                        <img src={familyIcon} alt="" width={40} height={40} style={{ borderRadius: '50%' }} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif' }}>For Family</div>
                          <div style={{ fontSize: 12, color: '#828282', fontFamily: 'Inter, sans-serif' }}>
                            Family members list
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 15, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif' }}>
                          Selected <span style={{ fontSize: 12, color: '#828282', fontWeight: 400 }}>({memberIds.length}/{needed})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setMemberModalProductId(productId)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: 32,
                            padding: '0 14px',
                            borderRadius: 56,
                            outline: '1px solid #8B5CF6',
                            outlineOffset: '-1px',
                            border: 'none',
                            background: 'transparent',
                            fontSize: 13,
                            fontFamily: 'Inter, sans-serif',
                            color: '#101129',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          Add New +
                        </button>
                      </div>

                      {showProfileList && (
                        <>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your profile</div>
                          {selfList.length === 0 ? (
                            <p style={{ fontSize: 13, color: '#828282', fontFamily: 'Inter, sans-serif', margin: 0 }}>No self profile yet. Use Add New + with relation Self, or switch to For Family.</p>
                          ) : (
                            selfList.map(renderMemberRow)
                          )}
                        </>
                      )}

                      {showFamilyList && (
                        <>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Family members</div>
                          {familyList.length === 0 ? (
                            <p style={{ fontSize: 13, color: '#828282', fontFamily: 'Inter, sans-serif', margin: 0 }}>No family members yet. Use Add New +, or switch to For Myself.</p>
                          ) : (
                            familyList.map(renderMemberRow)
                          )}
                        </>
                      )}
                    </div>

                    <div style={{ height: 1, background: '#F3F4F6', margin: '8px 0' }} />
                  </div>
                )
              })}

              {/* Per-product address section (one product group = one address) */}
              {items.filter(i => i.thyrocareProductId).map(item => {
                const pid = item.thyrocareProductId!
                const selectedAddressId = addressMap[pid] ?? null
                const serviceability = serviceabilityMap[pid] ?? { checking: false, serviceable: null as boolean | null, message: undefined as string | undefined }
                return (
                  <div key={`addr-${pid}`} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif' }}>
                        {item.name} — Collection Address
                      </span>
                      <button
                        onClick={() => setShowAddressModal(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: 32,
                          padding: '0 14px',
                          borderRadius: 56,
                          outline: '1px solid #8B5CF6',
                          outlineOffset: '-1px',
                          border: 'none',
                          background: 'transparent',
                          fontSize: 13,
                          fontFamily: 'Inter, sans-serif',
                          color: '#101129',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        Add New +
                      </button>
                    </div>
                    {addresses.map(addr => (
                      <div key={`${pid}-${addr.address_id}`} onClick={() => selectProductAddress(pid, addr.address_id)}
                        style={{
                          background: '#fff', boxShadow: '0px 4px 27.3px rgba(0,0,0,0.05)', borderRadius: 20,
                          outline: selectedAddressId === addr.address_id ? '1px solid #8B5CF6' : '1px solid #E7E1FF',
                          outlineOffset: '-1px', padding: '14px 16px', cursor: 'pointer',
                        }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <input type="radio" checked={selectedAddressId === addr.address_id} readOnly style={{ width: 18, height: 18, accentColor: '#8B5CF6', flexShrink: 0, marginTop: 3 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif' }}>{addr.address_label}</div>
                            <div style={{ fontSize: 12, color: '#828282', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
                              {addr.street_address}{addr.landmark ? `, ${addr.landmark}` : ''}<br />
                              {addr.city}, {addr.state} - {addr.postal_code}
                            </div>
                            {selectedAddressId === addr.address_id && (
                              <div style={{ marginTop: 6 }}>
                                {serviceability.checking && (
                                  <span style={{ fontSize: 12, color: '#828282', fontFamily: 'Inter, sans-serif' }}>Checking serviceability...</span>
                                )}
                                {!serviceability.checking && serviceability.serviceable === true && (
                                  <span style={{ fontSize: 12, color: '#059669', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>✓ Home collection available at this pincode</span>
                                )}
                                {!serviceability.checking && serviceability.serviceable === false && (
                                  <span style={{ fontSize: 12, color: '#DC2626', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                                    ✗ Home collection not available at pincode {addr.postal_code}
                                    {serviceability.message ? ` — ${serviceability.message}` : ''}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </>
          )}
        </div>

        <div className="checkout-summary" style={{ flex: '0 1 380px', width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {upsertError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#DC2626', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
              {upsertError}
            </div>
          )}
          <OrderSummaryCard
            itemCount={patientCount}
            subtotal={subtotal}
            savings={savings}
            total={displayTotal}
            onBack={() => navigate('/cart')}
            onContinue={handleContinue}
            continueDisabled={!canContinue || submitting}
            continueLabel={submitting ? 'Saving...' : 'Continue'}
          />
        </div>
      </div>

      {/* Add Member Modal */}
      {showMemberModal && (
        <div style={OVERLAY} onClick={() => setShowMemberModal(false)}>
          <div style={MODAL} onClick={e => e.stopPropagation()}>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#161616', fontFamily: 'Poppins, sans-serif' }}>Add New Member</span>
            <div><label style={LABEL}>Full Name *</label><input style={INPUT} value={newMember.name} onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))} placeholder="Enter name" /></div>
            <div><label style={LABEL}>Relation *</label>
              <select style={INPUT} value={newMember.relation} onChange={e => setNewMember(p => ({ ...p, relation: e.target.value }))}>
                {(members.some(isSelfMember)
                  ? ['Spouse', 'Child', 'Parent', 'Sibling', 'Other']
                  : ['Self', 'Spouse', 'Child', 'Parent', 'Sibling', 'Other']
                ).map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}><label style={LABEL}>Age *</label><input style={INPUT} type="number" value={newMember.age} onChange={e => setNewMember(p => ({ ...p, age: e.target.value }))} placeholder="Age" /></div>
              <div style={{ flex: 1 }}><label style={LABEL}>Gender *</label>
                <button
                  type="button"
                  onClick={() => setShowGenderModal(true)}
                  style={{
                    ...INPUT,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                  aria-haspopup="dialog"
                  aria-expanded={showGenderModal}
                >
                  <span>{genderLabel(newMember.gender)}</span>
                  <span aria-hidden style={{ color: '#828282' }}>▾</span>
                </button>
              </div>
            </div>
            <div><label style={LABEL}>Date of Birth *</label><input style={INPUT} type="date" value={newMember.dob} max={new Date().toISOString().split('T')[0]} onChange={e => setNewMember(p => ({ ...p, dob: e.target.value }))} /></div>
            <div><label style={LABEL}>Mobile *</label><input style={INPUT} value={newMember.mobile} onChange={e => setNewMember(p => ({ ...p, mobile: e.target.value }))} placeholder="+91 XXXXXXXXXX" /></div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowMemberModal(false)} style={{ flex: 1, height: 44, borderRadius: 8, border: 'none', outline: '1px solid #E7E1FF', background: 'transparent', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: 14 }}>Cancel</button>
              <button onClick={handleSaveMember} disabled={savingMember} style={{ flex: 1, height: 44, borderRadius: 8, border: 'none', background: '#8B5CF6', color: '#fff', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: 14, fontWeight: 500 }}>{savingMember ? 'Saving...' : 'Save Member'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Gender Modal (Figma node 281:2597) */}
      {showGenderModal && (
        <div style={OVERLAY} onClick={() => setShowGenderModal(false)}>
          <div
            role="dialog"
            aria-label="Gender"
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: '9px 11px 19px',
              width: 360,
              maxWidth: 'calc(100vw - 32px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 21,
              boxSizing: 'border-box',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                background: '#E7E1FF',
                border: '1px solid #E7E1FF',
                borderRadius: 10,
                height: 67,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 27,
                  top: 26,
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: 20,
                  fontWeight: 500,
                  lineHeight: '26px',
                  color: '#101129',
                }}
              >
                Gender
              </span>
            </div>

            <div style={{ paddingInline: 25, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <button
                type="button"
                onClick={() => selectGender('M')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: 20,
                  fontWeight: 500,
                  lineHeight: '26px',
                  color: '#101129',
                }}
              >
                Male
              </button>
              <div style={{ height: 1, width: 235, background: '#8B5CF6' }} />
              <button
                type="button"
                onClick={() => selectGender('F')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: 20,
                  fontWeight: 500,
                  lineHeight: '26px',
                  color: '#828282',
                }}
              >
                Female
              </button>
            </div>
          </div>
        </div>
      )}

      <AddAddressModal
        open={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSaved={saved => {
          setAddresses(prev => [...prev, saved])
          setShowAddressModal(false)
        }}
      />
    </div>
  )
}
