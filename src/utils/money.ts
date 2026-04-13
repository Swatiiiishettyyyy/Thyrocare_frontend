export function parseMoney(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string') return 0
  const s = value.trim()
  if (!s) return 0

  // Supports strings like: "₹1,499", "1499.00", "INR 1499", "1 499"
  const cleaned = s.replace(/[\s,]/g, '').replace(/[^0-9.-]/g, '')
  if (!cleaned) return 0
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}

