import { join } from 'node:path'

const API_PATH_RE = /^\/api\/([^/]+)\/([^/]+)(?:\/(.*))?$/i

export function parseApiRoutePath(path: string) {
  const normalized = path.toLowerCase().replace(/\/$/, '')
  const match = normalized.match(API_PATH_RE)
  if (!match) return null

  const packageId = match[1]!.toLowerCase()
  const versionSegment = match[2]!
  const slug = match[3]?.replace(/\/$/, '') || 'index'

  return {
    packageId,
    versionSegment,
    slug,
    pagePath: slug === 'index'
      ? `/api/${packageId}/${versionSegment}`
      : `/api/${packageId}/${versionSegment}/${slug}`,
  }
}

export function apiMarkdownFile(packageId: string, versionSegment: string, slug: string) {
  return join(process.cwd(), 'public', 'api-markdown', packageId, versionSegment, `${slug}.md`)
}

export function apiPageMetaFile(packageId: string, versionSegment: string, slug: string) {
  return join(process.cwd(), 'public', 'api-meta', packageId, versionSegment, 'pages', `${slug}.json`)
}
