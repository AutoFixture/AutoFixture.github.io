/**
 * Normalize and format docs frontmatter `updated` (YYYY-MM-DD or Date).
 */

export type DocsUpdatedDate = {
  /** Calendar date as YYYY-MM-DD (UTC). */
  iso: string
  /** Human-readable label, e.g. "March 15, 2026". */
  label: string
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Return YYYY-MM-DD for a valid calendar date, or undefined. */
export function toDocsUpdatedIso(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getUTCFullYear()}-${pad2(value.getUTCMonth() + 1)}-${pad2(value.getUTCDate())}`
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
    if (!match) {
      return undefined
    }
    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])
    const probe = new Date(Date.UTC(year, month - 1, day))
    if (
      probe.getUTCFullYear() !== year
      || probe.getUTCMonth() !== month - 1
      || probe.getUTCDate() !== day
    ) {
      return undefined
    }
    return trimmed
  }

  return undefined
}

/**
 * Format an `updated` value for display and `<time datetime>`.
 * Uses the en-US long date style (month day, year).
 */
export function formatDocsUpdatedDate(value: unknown): DocsUpdatedDate | undefined {
  const iso = toDocsUpdatedIso(value)
  if (!iso) {
    return undefined
  }

  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(year!, month! - 1, day!))
  const label = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date)

  return { iso, label }
}
