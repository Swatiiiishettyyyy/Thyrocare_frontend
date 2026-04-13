import { api } from './client'
import type { TestCardProps } from '../types'

export interface ThyrocareProduct {
  id: number
  thyrocare_id: string
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
  category: string | null
  parameters?: { id: number; name: string; group_name?: string | null }[]
  is_home_collectible?: boolean | null
  is_active?: boolean
  updated_at?: string | null
  created_at?: string | null
}

const PAGE_SIZE = 100
const MAX_PAGES = 50

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
    for (const c of ['25/men', '25-50/men', '50/men', '50/male']) {
      set.add(c)
    }
  }

  if (t === "women's health") {
    for (const c of ['25/women', '25-50/women', '50/women',
      'package/25-50women', 'package/under25women']) {
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

/** Single product from `GET /thyrocare/products/:id` (full parameters, about, etc.). */
function asSingleProduct(payload: unknown): ThyrocareProduct | null {
  const row = unwrapProductPayload(payload)
  if (!row) return null
  return row as unknown as ThyrocareProduct
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
  const discount = p.discount_percentage > 0
    ? `${Math.round(p.discount_percentage)}% OFF`
    : p.listing_price > p.selling_price
      ? `${Math.round(((p.listing_price - p.selling_price) / p.listing_price) * 100)}% OFF`
      : ''

  return {
    thyrocareProductId: p.id,
    maxBeneficiaries: p.beneficiaries_max,
    name: p.name,
    description: p.short_description ?? p.about ?? `${p.no_of_tests_included} tests included`,
    price: String(Math.round(p.selling_price)),
    originalPrice: String(Math.round(p.listing_price)),
    offerPercent: discount,
    tests: p.no_of_tests_included,
    fasting: p.is_fasting_required ? 'Fasting Required' : 'No Fasting Required',
    type: cardProductType(p.type),
  }
}

export function filterByCategory(products: ThyrocareProduct[], category: string): ThyrocareProduct[] {
  if (!Array.isArray(products)) return []
  const targets = categoryMatchTargets(category)
  return products.filter(p => {
    if (p.category == null || p.category === '') return false
    return targets.has(normalizeCategoryKey(p.category))
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
  Allergy: ['allergy', 'allergies', 'allergic', 'ige', 'igg', 'histamine'],
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

function isWomenCategoryString(cat: string): boolean {
  return /\bwomen\b/i.test(cat) || /\bwoman\b/i.test(cat)
}

function isMenCategoryString(cat: string): boolean {
  if (isWomenCategoryString(cat)) return false
  return /\/men\b/i.test(cat) || /\bmen\b/i.test(cat) || /\bman\b/i.test(cat)
}

/** Age segment: part before `/` in `25/women`, or whole string. */
function categoryAgeSegment(cat: string): string {
  const i = cat.indexOf('/')
  const raw = (i >= 0 ? cat.slice(0, i) : cat).trim().toLowerCase()
  return raw
}

function ageBandMatchesSegment(segment: string, age: ComprehensiveAgeBand): boolean {
  if (age === 'under25') {
    return (segment.includes('under') && segment.includes('25'))
      || segment === 'u25'
      || segment.startsWith('under25')
  }
  if (age === '25_50') {
    if (segment.includes('25-50') || segment.includes('2550')) return true
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
