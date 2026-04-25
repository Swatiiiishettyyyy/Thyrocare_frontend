import { api } from './client'

export type UploadedReportRow = Record<string, unknown>

export async function uploadExternalReport(file: File, memberId?: number, labName?: string): Promise<UploadedReportRow> {
  const form = new FormData()
  form.append('file', file)
  if (memberId != null && Number.isFinite(Number(memberId))) form.append('member_id', String(memberId))
  if (labName && labName.trim()) form.append('lab_name', labName.trim())

  const res = await api.post<any>('/upload/report', form as unknown)
  return (res?.data ?? res) as UploadedReportRow
}

export async function fetchUploadedReports(memberId?: number): Promise<UploadedReportRow[]> {
  const qs = memberId != null ? `?member_id=${encodeURIComponent(String(memberId))}` : ''
  const res = await api.get<any>(`/upload/reports/my-reports${qs}`)
  const raw = res?.data ?? res
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.data)) return raw.data
  return []
}

