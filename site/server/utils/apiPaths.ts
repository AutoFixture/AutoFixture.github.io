import { existsSync, readdirSync } from 'node:fs'
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

function resolveFile(dir: string, fileName: string) {
  const exact = join(dir, fileName)
  if (existsSync(exact)) return exact

  if (!existsSync(dir)) return exact

  const match = readdirSync(dir).find(entry => entry.toLowerCase() === fileName.toLowerCase())
  return match ? join(dir, match) : exact
}

export function apiMarkdownFile(packageId: string, versionSegment: string, slug: string) {
  const dir = join(process.cwd(), 'public', 'api-markdown', packageId, versionSegment)
  return resolveFile(dir, `${slug}.md`)
}

export function apiPageMetaFile(packageId: string, versionSegment: string, slug: string) {
  const dir = join(process.cwd(), 'public', 'api-meta', packageId, versionSegment, 'pages')
  return resolveFile(dir, `${slug}.json`)
}
