import { api } from './client'

export interface Member {
  member_id: number
  name: string
  relation: string
  age: number
  gender: string
  dob?: string
  mobile?: string
  is_self?: boolean
}

interface MemberListResponse {
  status?: string
  data?: Member[]
  members?: Member[]
}

export async function fetchMembers(): Promise<Member[]> {
  const res = await api.get<MemberListResponse | Member[]>('/member/list')
  if (Array.isArray(res)) return res
  const list = (res as MemberListResponse).data ?? (res as MemberListResponse).members ?? []
  return list.map((m: any) => ({
    member_id: m.member_id,
    name: m.name,
    relation: m.relation,
    age: m.age ?? 0,
    gender: m.gender ?? 'M',
    dob: m.dob,
    mobile: m.mobile,
  }))
}

export async function saveMember(data: Member): Promise<Member> {
  const payload = {
    member_id: 0,
    name: data.name,
    relation: data.relation,
    age: data.age,
    gender: data.gender,
    dob: data.dob,
    mobile: data.mobile,
  }
  const res = await api.post<any>('/member/save', payload)
  const m = res.data ?? res
  return {
    member_id: m.member_id,
    name: m.name,
    relation: m.relation,
    age: m.age ?? data.age,
    gender: m.gender ?? data.gender,
    dob: m.dob ?? data.dob,
    mobile: m.mobile ?? data.mobile,
  }
}

// Re-exports from the full service layer for code that imports from here
export {
  getMemberList,
  getCurrentMember,
  selectMember,
  editMember,
  deleteMember,
  uploadPhoto,
  deletePhoto,
  memberService,
} from '../services/memberService'
export type { MemberProfile } from '../services/memberService'
