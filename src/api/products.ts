import { api } from './client'
import type { TestCardProps } from '../types'

export interface ThyrocareProduct {
  id: number
  thyrocare_id: string
  /** Display name from DB/view layer (preferred for UI). */
  product_name?: string
  /** Fallback name (legacy). */
  name: string
  type: string
  no_of_tests_included: number
  listing_price: number
  selling_price: number
  discount_percentage: number
  beneficiaries_min: number
  beneficiaries_max: number
  is_fasting_required: boolean | null
  about: string | null
  short_description: string | null
  /**
   * Long-form, structured "About" sections (may be string or array, depending on backend serializer).
   * Prefer these over client-generated bullets when present.
   */
  what_this_test_checks?: string | string[] | null
  who_should_take_this_test?: string | string[] | null
  why_doctors_recommend?: string | string[] | null
  category: string | null
  parameters?: { id: number; name: string; group_name?: string | null }[]
  is_home_collectible?: boolean | null
  is_active?: boolean
  updated_at?: string | null
  created_at?: string | null
  /** Actual Thyrocare price (used as UI selling price). */
  thyrocare_price?: number | null
  /** Thyrocare listing/MRP (used as UI strike-off price). */
  thyrocare_listing_price?: number | null
}

const PAGE_SIZE = 100
const MAX_PAGES = 50
const DEFAULT_DISCOUNT_PERCENT = 40

/** Lowercase, collapse spaces; underscores ↔ spaces so UI matches API slugs. */
function normalizeCategoryKey(c: string): string {
  return c.trim().toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ')
}

/** Build API category keys that should match a UI section label. */
function categoryMatchTargets(uiCategory: string): Set<string> {
  const t = normalizeCategoryKey(uiCategory)
  const set = new Set<string>([t])

  if (t === 'popular packages') {
    set.add('package')
    set.add('popular package')
    set.add('packages')
    set.add('pp')
    // `normalizeCategoryKey` maps `_` → space but leaves `-` intact; keep hyphen / glued variants.
    set.add('popular-packages')
    set.add('popularpackages')
  }

  if (t === 'essential tests') {
    set.add('essential test')
    set.add('essential_tests')
    set.add('essential tests > 25-50')
  }

  if (t === 'organ health') {
    for (const c of ['heart', 'liver', 'kidney', 'bone', 'gut', 'hormones', 'vitamins',
      'blood', 'blood & cbc', 'blood & cbc', 'thyroid', 'minerals', 'nutrients',
      'iron & anaemia', 'allergy', 'check your vitals > infection & fever',
      'infection & fever', 'general wellness', 'comprehensive wellness']) {
      set.add(c)
    }
  }

  if (t === "men's health") {
    for (const c of [
      // Older patterns
      '25/men', '25-50/men', '50/men', '50/male', 'under25/men',
      // New API slugs
      'under25men', '25-50men', '50+men',
      // Common variants seen in the wild
      'under 25 men', '25-50 men', '50+ men', '50 plus men',
    ]) {
      set.add(c)
    }
  }

  if (t === "women's health") {
    for (const c of [
      // Older patterns
      '25/women', '25-50/women', '50/women', 'under25/women',
      'package/25-50women', 'package/under25women',
      // New API slugs
      'under25women', '25-50women', '50+women',
      // Common variants
      'under 25 women', '25-50 women', '50+ women', '50 plus women',
    ]) {
      set.add(c)
    }
  }

  return set
}

function parseProductsPage(payload: unknown): { items: ThyrocareProduct[]; hasMore: boolean } {
  if (Array.isArray(payload)) {
    return { items: payload as ThyrocareProduct[], hasMore: false }
  }
  if (payload != null && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    if (Array.isArray(o.data)) {
      return {
        items: o.data as ThyrocareProduct[],
        hasMore: o.has_more === true,
      }
    }
    for (const key of ['products', 'items', 'results', 'payload']) {
      const v = o[key]
      if (Array.isArray(v)) return { items: v as ThyrocareProduct[], hasMore: false }
    }
  }
  return { items: [], hasMore: false }
}

/**
 * Fetches all catalog pages. API returns paginated `{ data, has_more, page, page_size }`
 * (default page_size 20); we request page_size=100 and walk pages until `has_more` is false.
 */
export async function fetchProducts(): Promise<ThyrocareProduct[]> {
  const all: ThyrocareProduct[] = []
  let page = 1
  for (;;) {
    const body = await api.get<unknown>(`/thyrocare/products?page_size=${PAGE_SIZE}&page=${page}`)
    const { items, hasMore } = parseProductsPage(body)
    all.push(...items)
    if (!hasMore || items.length === 0 || page >= MAX_PAGES) break
    page += 1
  }
  return all
}

function asNumberId(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && /^\d+$/.test(v.trim())) return Number(v.trim())
  return null
}

/** Pick first nested object that looks like a product row. */
function unwrapProductPayload(payload: unknown): Record<string, unknown> | null {
  if (payload == null || typeof payload !== 'object') return null
  let cur: unknown = payload
  for (let depth = 0; depth < 4; depth++) {
    if (cur == null || typeof cur !== 'object') return null
    const o = cur as Record<string, unknown>
    const id = asNumberId(o.id)
    if (id != null && typeof o.name === 'string') return o
    const next =
      o.data ?? o.product ?? o.payload ?? o.result ?? o.item
    if (next != null && typeof next === 'object') {
      cur = next
      continue
    }
    return null
  }
  return null
}

/**
 * Normalize `parameters` from list/detail responses (field names and shapes vary by endpoint).
 * The Test detail "Parameters" tab renders each item's `name`.
 */
function normalizeParametersFromRow(row: Record<string, unknown>): NonNullable<ThyrocareProduct['parameters']> {
  const raw =
    row.parameters
    ?? row.tests
    ?? row.test_parameters
    ?? row.parameters_list
    ?? row.parameter_list
  if (!Array.isArray(raw)) return []

  const out: NonNullable<ThyrocareProduct['parameters']> = []
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i]
    if (typeof item === 'string') {
      const name = item.trim()
      if (name) out.push({ id: i + 1, name, group_name: null })
      continue
    }
    if (item == null || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const id = asNumberId(o.id ?? o.parameter_id ?? o.test_id) ?? i + 1
    const name = String(o.name ?? o.parameter_name ?? o.test_name ?? o.title ?? '').trim()
    if (!name) continue
    const gn = o.group_name ?? o.group ?? o.category
    const group_name = gn == null || gn === '' ? null : String(gn)
    out.push({ id, name, group_name })
  }
  return out
}

/** Single product from `GET /thyrocare/products/:id` (full parameters, about, etc.). */
function asSingleProduct(payload: unknown): ThyrocareProduct | null {
  const row = unwrapProductPayload(payload)
  if (!row) return null
  const params = normalizeParametersFromRow(row)
  return { ...(row as object), parameters: params } as unknown as ThyrocareProduct
}

export async function fetchProductById(id: number): Promise<ThyrocareProduct> {
  const body = await api.get<unknown>(`/thyrocare/products/${id}`)
  const p = asSingleProduct(body)
  if (!p) throw new Error('Invalid product response')
  return p
}

function cardProductType(t: string): 'Single' | 'Package' {
  const u = (t || '').toUpperCase()
  if (u === 'MSKU' || u === 'OFFER') return 'Package'
  return 'Single'
}

export function toTestCard(p: ThyrocareProduct): TestCardProps {
  // Pricing rule (as per backend schema):
  // - Actual price shown in UI = `thyrocare_price`
  // - Strike-off price shown in UI = `thyrocare_listing_price`
  const actual = Number(p.thyrocare_price ?? 0) || 0
  const strike = Number(p.thyrocare_listing_price ?? 0) || 0
  const discount =
    Number.isFinite(Number(p.discount_percentage))
      ? `${Math.round(Number(p.discount_percentage))}% OFF`
      : `${DEFAULT_DISCOUNT_PERCENT}% OFF`

  return {
    thyrocareProductId: p.id,
    maxBeneficiaries: p.beneficiaries_max,
    name: String(p.product_name ?? p.name ?? '').trim() || String(p.name ?? '').trim(),
    description: p.short_description ?? p.about ?? `${p.no_of_tests_included} tests included`,
    price: String(Math.round(actual)),
    originalPrice: String(Math.round(strike)),
    offerPercent: discount,
    tests: p.no_of_tests_included,
    fasting: p.is_fasting_required ? 'Fasting Required' : 'No Fasting Required',
    type: cardProductType(p.type),
  }
}

export function filterByCategory(products: ThyrocareProduct[], category: string): ThyrocareProduct[] {
  if (!Array.isArray(products)) return []
  const targets = categoryMatchTargets(category)
  const uiKey = normalizeCategoryKey(category)
  return products.filter(p => {
    if (p.category == null || p.category === '') return false
    const k = normalizeCategoryKey(p.category)
    if (targets.has(k)) return true
    // Compound paths like `package/popular_packages` or prefixes/suffixes around the slug
    if (uiKey === 'popular packages') {
      if (/\bpopular\s+packages\b/.test(k)) return true
      const compact = k.replace(/[\s/|>]+/g, '')
      if (compact.includes('popularpackages')) return true
      // Path segments (do not use full `targets`: it includes bare `package`, which is too broad)
      const popularSeg = new Set(['popular packages', 'popular package', 'popular-packages', 'popularpackages'])
      const segments = k.split(/\s*\/\s*/).map(s => normalizeCategoryKey(s)).filter(Boolean)
      if (segments.some(s => popularSeg.has(s))) return true
    }
    return false
  })
}

const ORGAN_ID_TO_LABELS: Record<string, string[]> = {
  heart: ['Heart'],
  liver: ['Liver'],
  bone: ['Bone'],
  kidney: ['Kidney'],
  gut: ['Gut'],
  hormones: ['Hormones', 'Hormone'],
  vitamins: ['Vitamins', 'Vitamin'],
}

/** Match API `category` to organ tiles (exact normalized match on known labels). */
export function filterByOrganId(products: ThyrocareProduct[], organId: string): ThyrocareProduct[] {
  if (!Array.isArray(products)) return []
  const labels = ORGAN_ID_TO_LABELS[organId]
  if (!labels) return []
  const keys = new Set(labels.map(l => normalizeCategoryKey(l)))
  return products.filter(p => {
    if (p.category == null || p.category === '') return false
    return keys.has(normalizeCategoryKey(p.category))
  })
}

/** UI condition pill → substrings / normalized keys to match `product.category`. */
const CONDITION_ALIASES: Record<string, string[]> = {
  STD: ['std', 'sexually transmitted', 'sti', 'venereal'],
  'Monsoon Fever': ['monsoon', 'monsoon fever', 'dengue', 'viral fever', 'chikungunya'],
  Allergy: ['allergy', 'allergies', 'allergic', 'allergen', 'ige', 'immunoglobulin e'],
  Cancer: ['cancer', 'oncology', 'tumor', 'tumour'],
}

export function filterByConditionLabel(products: ThyrocareProduct[], uiLabel: string): ThyrocareProduct[] {
  if (!Array.isArray(products)) return []
  const needles = new Set<string>([normalizeCategoryKey(uiLabel)])
  for (const a of CONDITION_ALIASES[uiLabel] ?? []) needles.add(normalizeCategoryKey(a))
  return products.filter(p => {
    if (p.category == null || p.category === '') return false
    const k = normalizeCategoryKey(p.category)
    for (const n of needles) {
      if (!n) continue
      if (k === n || k.includes(n) || n.includes(k)) return true
    }
    return false
  })
}

export type ComprehensiveAgeBand = 'under25' | '25_50' | '50plus'
export type ComprehensiveGender = 'women' | 'men'

function isWomenCategoryString(cat: string): boolean {
  // Categories may appear as `25-50women`, `under25women`, `50+women`, `25/women`, etc.
  // Avoid `\b` because digits are "word characters" and break boundaries.
  return /(^|[^a-z])women($|[^a-z])/i.test(cat) || /(^|[^a-z])woman($|[^a-z])/i.test(cat)
}

function isMenCategoryString(cat: string): boolean {
  if (isWomenCategoryString(cat)) return false
  // Categories may appear as `25-50men`, `under25men`, `50+men`, `25/men`, etc.
  return /(^|[^a-z])men($|[^a-z])/i.test(cat)
    || /(^|[^a-z])man($|[^a-z])/i.test(cat)
    || /(^|[^a-z])male($|[^a-z])/i.test(cat)
}

/**
 * Age-relevant segment extracted from `product.category`.
 * Handles:
 * - `25-50/men` → `25-50` (age in first segment)
 * - `package/25-50women` → `25-50women` (combined slug in last segment; first is only a bucket)
 * - `25-50men` → whole string
 * Also normalizes unicode dash characters to ASCII `-` so `25–50men` still matches.
 */
function categoryAgeSegment(cat: string): string {
  let s = cat.trim().toLowerCase()
  s = s.replace(/[\u2010-\u2015\u2212]/g, '-')
  // API sometimes uses `25_50men` / `25_50_women` — treat `_` like `-` for age parsing.
  s = s.replace(/_/g, '-')
  const slash = s.indexOf('/')
  if (slash < 0) return s

  const parts = s.split('/').map(p => p.trim()).filter(Boolean)
  if (parts.length < 2) return parts[0] ?? s

  const first = parts[0]
  const last = parts[parts.length - 1]

  const lastHasGender = isWomenCategoryString(last) || isMenCategoryString(last)
  const lastHasAgeMarker =
    /\d/.test(last)
    || last.includes('under')
    || last.includes('25-50')
    || last.includes('+')
    || last.includes('plus')

  if (lastHasGender && lastHasAgeMarker) return last

  if (
    ageBandMatchesSegment(first, 'under25')
    || ageBandMatchesSegment(first, '25_50')
    || ageBandMatchesSegment(first, '50plus')
  ) {
    return first
  }

  return last
}

function ageBandMatchesSegment(segment: string, age: ComprehensiveAgeBand): boolean {
  if (age === 'under25') {
    return (segment.includes('under') && segment.includes('25'))
      || segment === 'u25'
      || segment.startsWith('under25')
  }
  if (age === '25_50') {
    if (segment.includes('25-50') || segment.includes('2550') || segment.includes('25_50')) return true
    const n = parseInt(segment, 10)
    if (!Number.isNaN(n) && n >= 25 && n < 50) return true
    return segment === '25' || segment === '30' || segment === '35' || segment === '40' || segment === '45'
  }
  if (age === '50plus') {
    if (segment.includes('50') && (segment.includes('plus') || segment.includes('+'))) return true
    const n = parseInt(segment, 10)
    return !Number.isNaN(n) && n >= 50
  }
  return false
}

/**
 * Derive gender + age band from Thyrocare category strings commonly used for comprehensive packs.
 * Examples seen:
 * - `25/women`, `25-50/men`, `50/women`, `under25/men`
 * - `package/under25women`, `package/25-50women`
 */
export function comprehensiveSubcategoryFromProductCategory(
  category: string | null | undefined,
): { gender: ComprehensiveGender; age: ComprehensiveAgeBand } | null {
  const c = (category ?? '').trim()
  if (!c) return null
  const lower = c.toLowerCase()

  const gender: ComprehensiveGender | null =
    isWomenCategoryString(lower) ? 'women' : (isMenCategoryString(lower) ? 'men' : null)
  if (!gender) return null

  const seg = categoryAgeSegment(lower)
  const age: ComprehensiveAgeBand | null =
    ageBandMatchesSegment(seg, 'under25') ? 'under25'
      : ageBandMatchesSegment(seg, '25_50') ? '25_50'
        : ageBandMatchesSegment(seg, '50plus') ? '50plus'
          : null
  if (!age) return null

  return { gender, age }
}

/** Gender + age-band packages (API patterns like `25/women`, `under25/men`). */
export function filterComprehensive(
  products: ThyrocareProduct[],
  gender: 'women' | 'men',
  age: ComprehensiveAgeBand,
): ThyrocareProduct[] {
  if (!Array.isArray(products)) return []
  return products.filter(p => {
    if (p.category == null || p.category === '') return false
    const c = p.category
    if (gender === 'women' && !isWomenCategoryString(c)) return false
    if (gender === 'men' && !isMenCategoryString(c)) return false
    const seg = categoryAgeSegment(c)
    // Backend quirk: women's "under 25" packages are sometimes categorized as `25/women`.
    if (gender === 'women' && age === 'under25' && seg === '25') return true
    // Backend quirk: men's "under 25" packages are sometimes categorized as `25/men`.
    if (gender === 'men' && age === 'under25' && seg === '25') return true
    return ageBandMatchesSegment(seg, age)
  })
}
