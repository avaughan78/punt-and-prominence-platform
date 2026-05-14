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

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    accepted: 'Accepted',
    posted: 'Post submitted',
    verified: 'Verified',
    active: 'Active',
    completed: 'Completed',
  }
  return labels[status] ?? status
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    accepted: '#F5B800',
    posted: '#C084FC',
    verified: '#22c55e',
  }
  return colors[status] ?? '#6b7280'
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
