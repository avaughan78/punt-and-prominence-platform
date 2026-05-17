export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export function generatePuntCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'PNT-'
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function formatGBP(amount: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function stateLabel(state: string): string {
  const labels: Record<string, string> = {
    in_progress:  'Awaiting posts',
    needs_review: 'Needs review',
    up_to_date:   'Up to date',
    closed:       'Closed',
  }
  return labels[state] ?? state
}

export function stateColor(state: string): string {
  const colors: Record<string, string> = {
    in_progress:  '#F5B800',
    needs_review: '#C084FC',
    up_to_date:   '#22c55e',
    closed:       '#94a3b8',
  }
  return colors[state] ?? '#6b7280'
}

export function normalizeUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`
  return null
}

export function isValidUrl(value: string): boolean {
  const normalized = normalizeUrl(value)
  if (!normalized) return false
  try {
    new URL(normalized)
    return true
  } catch {
    return false
  }
}
