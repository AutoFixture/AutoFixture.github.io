import type { ContentNavigationItem } from '@nuxt/content'
import type { BadgeProps } from '@nuxt/ui'

/** Known string shortcuts → consistent Nuxt UI badge styles. */
const BADGE_PRESETS: Record<string, BadgeProps> = {
  new: { label: 'New', color: 'primary', variant: 'subtle' },
  updated: { label: 'Updated', color: 'info', variant: 'subtle' },
  preview: { label: 'Preview', color: 'warning', variant: 'subtle' },
}

function isBadgeObject(value: unknown): value is BadgeProps {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Normalize a docs frontmatter `badge` value for UContentNavigation.
 * Strings use presets when known; other strings become a neutral outline badge.
 * Objects are passed through as BadgeProps.
 */
export function resolveDocsNavigationBadge(badge: unknown): BadgeProps | undefined {
  if (badge === undefined || badge === null || badge === false) {
    return undefined
  }

  if (typeof badge === 'string' || typeof badge === 'number') {
    const key = String(badge).trim().toLowerCase()
    if (!key) {
      return undefined
    }

    return BADGE_PRESETS[key] ?? {
      label: String(badge).trim(),
      color: 'neutral',
      variant: 'outline',
    }
  }

  if (isBadgeObject(badge)) {
    return badge
  }

  return undefined
}

/** Recursively attach resolved badges onto a Content navigation tree. */
export function mapDocsNavigationBadges(
  items: ContentNavigationItem[] | undefined,
): ContentNavigationItem[] {
  if (!items?.length) {
    return []
  }

  return items.map((item) => {
    const badge = resolveDocsNavigationBadge(
      (item as ContentNavigationItem & { badge?: unknown }).badge,
    )

    return {
      ...item,
      ...(badge !== undefined ? { badge } : {}),
      children: item.children?.length
        ? mapDocsNavigationBadges(item.children)
        : item.children,
    }
  })
}
