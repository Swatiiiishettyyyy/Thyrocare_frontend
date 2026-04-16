import { useState, useEffect } from 'react'
import profileIcon from '../assets/figma/checkout-pages/profile.svg'
import familyIcon from '../assets/figma/checkout-pages/family.svg'
import selectIcon from '../assets/figma/checkout-pages/select.svg'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components'
import { CheckoutStepper } from '../components/CheckoutStepper'
import { OrderSummaryCard } from '../components/OrderSummaryCard'
import type { CartItem } from '../types'
import { fetchMembers, saveMember } from '../api/member'
import { fetchAddresses, saveThyrocareAddress } from '../api/address'
import {
  fetchActiveGroups,
  fetchPriceBreakup,
  checkPincodeServiceability,
  getCheckoutPriceSummary,
  checkoutPricingSnapshotKey,
  ensureThyrocareCartGroup,
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

  const [members, setMembers] = useState<Member[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  // per-product: selected patient member_ids (any mix of self + family; length must === cart quantity)
  const [memberMap, setMemberMap] = useState<Record<number, number[]>>({})
  /** Which list is visible: profile only vs family only (selections in `memberMap` are kept when toggling) */
  const [memberListFocus, setMemberListFocus] = useState<Record<number, 'profile' | 'family'>>({})
  // single shared address for all products
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [serviceability, setServiceability] = useState<{ checking: boolean; serviceable: boolean | null; message?: string }>({ checking: false, serviceable: null })
  const [upsertError, setUpsertError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // member modal — tracks which productId triggered it
  const [memberModalProductId, setMemberModalProductId] = useState<number | null>(null)
  const [newMember, setNewMember] = useState({ name: '', relation: 'Spouse', age: '', gender: 'M', dob: '', mobile: '' })
  const [savingMember, setSavingMember] = useState(false)
  const [showGenderModal, setShowGenderModal] = useState(false)

  // single address modal
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [newAddress, setNewAddress] = useState({ address_label: 'Home', street_address: '', landmark: '', locality: '', city: '', state: '', postal_code: '', country: 'India' })
  const [savingAddress, setSavingAddress] = useState(false)
  const [pincodeCheck, setPincodeCheck] = useState<{ checking: boolean; serviceable: boolean | null; message?: string }>({ checking: false, serviceable: null })

  const { subtotal, savings, total: displayTotal } = getCheckoutPriceSummary(items, {
    thyrocarePricing: session.thyrocarePricing,
    netPayableAmount: session.netPayableAmount,
    groups: session.groups,
    pricingSnapshotKey: session.pricingSnapshotKey,
  })

  useEffect(() => {
    async function init() {
      try {
        const [m, a, activeGroups] = await Promise.all([fetchMembers(), fetchAddresses(), fetchActiveGroups()])
        setMembers(m)
        setAddresses(a)
        const mMap: Record<number, number[]> = {}
        let sharedAddr: number | null = null
        for (const g of activeGroups) {
          mMap[g.thyrocare_product_id] = g.member_ids
          if (!sharedAddr && g.address_id) sharedAddr = g.address_id
          onUpsertGroup(g)
        }
        for (const item of items) {
          if (!item.thyrocareProductId) continue
          const pid = item.thyrocareProductId
          if (!mMap[pid]) {
            const sg = session.groups.find(g => g.thyrocare_product_id === pid)
            mMap[pid] = sg?.member_ids ?? []
            if (!sharedAddr && sg?.address_id) sharedAddr = sg.address_id
          }
        }
        setMemberMap(mMap)
        setSelectedAddressId(sharedAddr)
      } catch {
        const mMap: Record<number, number[]> = {}
        for (const item of items) {
          if (!item.thyrocareProductId) continue
          const pid = item.thyrocareProductId
          const sg = session.groups.find(g => g.thyrocare_product_id === pid)
          mMap[pid] = sg?.member_ids ?? []
        }
        setMemberMap(mMap)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-select Self only when this line needs exactly 1 patient and nothing chosen yet
  useEffect(() => {
    if (loading || members.length === 0) return
    setMemberMap(prev => {
      let next = { ...prev }
      let changed = false
      for (const item of items) {
        if (!item.thyrocareProductId || item.quantity !== 1) continue
        const pid = item.thyrocareProductId
        const cur = next[pid] ?? []
        if (cur.length > 0) continue
        const selfMember = members.find(isSelfMember)
        if (selfMember) {
          next = { ...next, [pid]: [selfMember.member_id] }
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [loading, members, items])

  function setProductMembers(productId: number, memberIds: number[]) {
    setMemberMap(prev => ({ ...prev, [productId]: memberIds }))
  }
  async function selectAddress(addressId: number) {
    setSelectedAddressId(addressId)
    const addr = addresses.find(a => a.address_id === addressId)
    if (!addr?.postal_code || addr.postal_code.length !== 6) return
    setServiceability({ checking: true, serviceable: null })
    try {
      const result = await checkPincodeServiceability(addr.postal_code)
      setServiceability({ checking: false, serviceable: result.serviceable, message: result.message })
    } catch {
      setServiceability({
        checking: false,
        serviceable: false,
        message: 'Could not verify pincode. Check your connection and try again.',
      })
    }
  }

  const canContinue = selectedAddressId !== null &&
    serviceability.serviceable === true &&
    !serviceability.checking &&
    items.every(item => {
    if (!item.thyrocareProductId) return false
    const memberIds = memberMap[item.thyrocareProductId] ?? []
    return memberIds.length === item.quantity
  })

  async function handleContinue() {
    if (!canContinue || submitting) return
    setSubmitting(true)
    setUpsertError(null)
    try {
      // parallel upsert for all products
      const results = await Promise.all(
        items
          .filter(item => item.thyrocareProductId)
          .map(async item => {
            const pid = item.thyrocareProductId!
            const memberIds = memberMap[pid] ?? []
            if (!selectedAddressId) return null
            const existingGroup = session.groups.find(g => g.thyrocare_product_id === pid)

            const groupId = await ensureThyrocareCartGroup(
              pid,
              memberIds,
              selectedAddressId,
              existingGroup?.group_id ?? null,
            )

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
            onUpsertGroup(updated)
            return updated
          })
      )

      const updatedGroups = results.filter(Boolean) as CartGroup[]
      const groupIds = updatedGroups.map(g => g.group_id).filter(Boolean)

      if (groupIds.length === 0) {
        setUpsertError('Could not save cart groups. Please try again.')
        setSubmitting(false)
        return
      }

      try {
        const pricing = await fetchPriceBreakup(groupIds)
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
          netPayableAmount: pricing.net_payable_amount,
          thyrocarePricing: pricing,
          pricingSnapshotKey: checkoutPricingSnapshotKey(nextGroups, nextItems),
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

  async function handlePincodeChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 6)
    setNewAddress(p => ({ ...p, postal_code: digits }))
    if (digits.length === 6) {
      setPincodeCheck({ checking: true, serviceable: null })
      try {
        const result = await checkPincodeServiceability(digits)
        setPincodeCheck({ checking: false, serviceable: result.serviceable, message: result.message })
      } catch {
        setPincodeCheck({
          checking: false,
          serviceable: false,
          message: 'Could not verify pincode. Try again.',
        })
      }
    } else {
      setPincodeCheck({ checking: false, serviceable: null })
    }
  }

  async function handleSaveAddress() {
    if (!newAddress.street_address || !newAddress.city || !newAddress.state || !newAddress.postal_code || !newAddress.locality) return
    if (pincodeCheck.serviceable !== true || pincodeCheck.checking) return
    setSavingAddress(true)
    try {
      const payload: Address = {
        address_id: 0,
        address_label: newAddress.address_label,
        street_address: newAddress.street_address,
        landmark: newAddress.landmark,
        locality: newAddress.locality,
        city: newAddress.city,
        state: newAddress.state,
        postal_code: newAddress.postal_code,
        country: newAddress.country,
        save_for_future: true,
      }
      const saved = await saveThyrocareAddress(payload)
      setAddresses(prev => [...prev, saved])
      setSelectedAddressId(saved.address_id)
      setServiceability({ checking: false, serviceable: true })
      setShowAddressModal(false)
      setNewAddress({ address_label: 'Home', street_address: '', landmark: '', locality: '', city: '', state: '', postal_code: '', country: 'India' })
      setPincodeCheck({ checking: false, serviceable: null })
    } catch (err: any) {
      const msg = err?.data?.message ?? 'Failed to save address. Please try again.'
      // backend may reject due to unserviceable pincode
      const isServiceability = msg.toLowerCase().includes('pincode') || msg.toLowerCase().includes('serve')
      if (isServiceability) {
        setPincodeCheck({ checking: false, serviceable: false, message: msg })
      } else {
        setPincodeCheck(prev => ({ ...prev, message: msg }))
      }
    } finally {
      setSavingAddress(false)
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 15, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif' }}>
                          Selected <span style={{ fontSize: 12, color: '#828282', fontWeight: 400 }}>({memberIds.length}/{needed})</span>
                        </span>
                        <button type="button" onClick={() => setMemberModalProductId(productId)} style={{ padding: '4px 14px', borderRadius: 56, outline: '1px solid #8B5CF6', outlineOffset: '-1px', border: 'none', background: 'transparent', fontSize: 13, fontFamily: 'Inter, sans-serif', color: '#101129', cursor: 'pointer' }}>Add New +</button>
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

              {/* Shared address section — one for all products */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 15, fontWeight: 500, color: '#161616', fontFamily: 'Poppins, sans-serif' }}>Collection Address</span>
                  <button onClick={() => setShowAddressModal(true)} style={{ padding: '4px 14px', borderRadius: 56, outline: '1px solid #8B5CF6', outlineOffset: '-1px', border: 'none', background: 'transparent', fontSize: 13, fontFamily: 'Inter, sans-serif', color: '#101129', cursor: 'pointer' }}>Add New +</button>
                </div>
                {addresses.map(addr => (
                  <div key={addr.address_id} onClick={() => selectAddress(addr.address_id)}
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
            itemCount={items.length}
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

      {/* Add Address Modal */}
      {showAddressModal && (
        <div style={OVERLAY} onClick={() => setShowAddressModal(false)}>
          <div style={MODAL} onClick={e => e.stopPropagation()}>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#161616', fontFamily: 'Poppins, sans-serif' }}>Add New Address</span>
            <div><label style={LABEL}>Label</label>
              <select style={INPUT} value={newAddress.address_label} onChange={e => setNewAddress(p => ({ ...p, address_label: e.target.value }))}>
                {['Home', 'Work', 'Other'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div><label style={LABEL}>Street Address *</label><input style={INPUT} value={newAddress.street_address} onChange={e => setNewAddress(p => ({ ...p, street_address: e.target.value }))} placeholder="Flat/House No, Street" /></div>
            <div><label style={LABEL}>Landmark</label><input style={INPUT} value={newAddress.landmark} onChange={e => setNewAddress(p => ({ ...p, landmark: e.target.value }))} placeholder="Near..." /></div>
            <div><label style={LABEL}>Locality *</label><input style={INPUT} value={newAddress.locality} onChange={e => setNewAddress(p => ({ ...p, locality: e.target.value }))} placeholder="Area / Locality" /></div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}><label style={LABEL}>City *</label><input style={INPUT} value={newAddress.city} onChange={e => setNewAddress(p => ({ ...p, city: e.target.value }))} placeholder="City" /></div>
              <div style={{ flex: 1 }}><label style={LABEL}>State *</label><input style={INPUT} value={newAddress.state} onChange={e => setNewAddress(p => ({ ...p, state: e.target.value }))} placeholder="State" /></div>
            </div>
            <div>
              <label style={LABEL}>Pincode *</label>
              <input style={{ ...INPUT, borderColor: pincodeCheck.serviceable === false ? '#DC2626' : '#E7E1FF' }}
                value={newAddress.postal_code}
                onChange={e => handlePincodeChange(e.target.value)}
                placeholder="6-digit pincode"
                maxLength={6}
              />
              {pincodeCheck.checking && (
                <span style={{ fontSize: 12, color: '#828282', fontFamily: 'Inter, sans-serif', marginTop: 4, display: 'block' }}>Checking serviceability...</span>
              )}
              {!pincodeCheck.checking && pincodeCheck.serviceable === true && (
                <span style={{ fontSize: 12, color: '#059669', fontFamily: 'Inter, sans-serif', marginTop: 4, display: 'block' }}>✓ Home collection available</span>
              )}
              {!pincodeCheck.checking && pincodeCheck.serviceable === false && (
                <span style={{ fontSize: 12, color: '#DC2626', fontFamily: 'Inter, sans-serif', marginTop: 4, display: 'block' }}>
                  ✗ {pincodeCheck.message ?? 'Home collection not available at this pincode'}
                </span>
              )}
              {!pincodeCheck.checking && pincodeCheck.serviceable !== false && pincodeCheck.message && (
                <span style={{ fontSize: 12, color: '#DC2626', fontFamily: 'Inter, sans-serif', marginTop: 4, display: 'block' }}>
                  ✗ {pincodeCheck.message}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setShowAddressModal(false); setPincodeCheck({ checking: false, serviceable: null }) }} style={{ flex: 1, height: 44, borderRadius: 8, border: 'none', outline: '1px solid #E7E1FF', background: 'transparent', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: 14 }}>Cancel</button>
              <button
                onClick={handleSaveAddress}
                disabled={savingAddress || pincodeCheck.checking || pincodeCheck.serviceable !== true}
                style={{ flex: 1, height: 44, borderRadius: 8, border: 'none', background: (savingAddress || pincodeCheck.checking || pincodeCheck.serviceable !== true) ? '#E7E1FF' : '#8B5CF6', color: (savingAddress || pincodeCheck.checking || pincodeCheck.serviceable !== true) ? '#828282' : '#fff', cursor: (savingAddress || pincodeCheck.checking || pincodeCheck.serviceable !== true) ? 'not-allowed' : 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: 14, fontWeight: 500 }}>
                {savingAddress ? 'Saving...' : pincodeCheck.checking ? 'Checking...' : pincodeCheck.serviceable !== true ? 'Verify pincode first' : 'Save Address'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
