import type { MyReportRow, ReportLinkContext } from './api/orders'

export type StashedReportNav = {
  reportLinkContext?: ReportLinkContext
  reportTryIds?: string[]
  report?: MyReportRow | null
}

const PREFIX = 'nucleotide:report-nav:'

/** Persist report navigation hints (refresh / lost Router state). Paired with `lk` query param. */
export function stashReportNavigation(key: string, payload: StashedReportNav): void {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify({ ...payload, _ts: Date.now() }))
  } catch {
    /* quota / private mode */
  }
}

export function peekReportNavigation(key: string): StashedReportNav | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + key)
    if (!raw) return null
    const o = JSON.parse(raw) as StashedReportNav & { _ts?: number }
    const { _ts: _ignored, ...rest } = o
    void _ignored
    return rest
  } catch {
    return null
  }
}

export function consumeReportNavigation(key: string): void {
  try {
    sessionStorage.removeItem(PREFIX + key)
  } catch {
    /* ignore */
  }
}

export function newReportNavigationKey(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
