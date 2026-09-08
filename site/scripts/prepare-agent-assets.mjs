/**
 * Prepare agent-facing static assets before `nuxt generate`:
 * - Mirror guide markdown to public/docs-markdown/ (URL-aligned paths)
 * - Write public/sitemap.xml (guides, docs-markdown, API routes when present)
 * - Write public/feed.xml (Atom) from guides that declare `updated`
 *
 * Run from site/: node scripts/prepare-agent-assets.mjs
 * Or via npm pregenerate / just site-generate.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const siteRoot = path.resolve(__dirname, '..')
const contentDocs = path.join(siteRoot, 'content', 'docs')
const publicDir = path.join(siteRoot, 'public')
const docsMarkdownDir = path.join(publicDir, 'docs-markdown')
const sitemapPath = path.join(publicDir, 'sitemap.xml')
const feedPath = path.join(publicDir, 'feed.xml')
const routesJsonPath = path.join(publicDir, 'api-meta', 'routes.json')

const SITE_ORIGIN = 'https://autofixture.com'
const FEED_TITLE = 'AutoFixture documentation'
const FEED_ID = `${SITE_ORIGIN}/`

/** Strip Nuxt Content-style numeric prefixes: "1.get-started" → "get-started" */
function stripNumericPrefix(segment) {
  return segment.replace(/^\d+\./, '')
}

/**
 * Map content-relative path to public docs path without leading slash.
 * e.g. "1.get-started/1.introduction.md" → "get-started/introduction.md"
 */
function toPublicDocsRel(relFromDocs) {
  const parts = relFromDocs.split(/[/\\]/).filter(Boolean)
  const mapped = parts.map((part, index) => {
    if (index === parts.length - 1 && part.toLowerCase().endsWith('.md')) {
      const base = part.slice(0, -3)
      return `${stripNumericPrefix(base)}.md`
    }
    return stripNumericPrefix(part)
  })
  return mapped.join('/')
}

function walkMarkdownFiles(dir, base = dir) {
  /** @type {string[]} */
  const files = []
  if (!fs.existsSync(dir)) return files

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(full, base))
      continue
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(path.relative(base, full))
    }
  }
  return files
}

function removeIfExists(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true })
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * @param {string} raw
 * @returns {Record<string, string>}
 */
function parseSimpleFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)
  if (!match) return {}

  /** @type {Record<string, string>} */
  const fields = {}
  for (const line of match[1].split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('-')) continue
    // Skip nested object lines (badge:, indented keys)
    if (/^\s/.test(line) || trimmed.endsWith(':')) continue
    const sep = trimmed.indexOf(':')
    if (sep <= 0) continue
    const key = trimmed.slice(0, sep).trim()
    let value = trimmed.slice(sep + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    fields[key] = value
  }
  return fields
}

/** @param {string} value */
function toUpdatedIso(value) {
  if (!value) return undefined
  const trimmed = value.trim()
  // YAML may emit 2026-09-08 or 2026-09-08T00:00:00.000Z
  const day = trimmed.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return undefined
  return day
}

/**
 * @typedef {{
 *   htmlPath: string
 *   markdownPath: string
 *   title?: string
 *   description?: string
 *   updated?: string
 * }} GuideAsset
 */

/**
 * @returns {GuideAsset[]}
 */
function mirrorDocsMarkdown() {
  removeIfExists(docsMarkdownDir)
  ensureDir(docsMarkdownDir)

  /** @type {GuideAsset[]} */
  const guides = []

  const files = walkMarkdownFiles(contentDocs)
  for (const rel of files) {
    const sourcePath = path.join(contentDocs, rel)
    const raw = fs.readFileSync(sourcePath, 'utf8')
    const frontmatter = parseSimpleFrontmatter(raw)
    const publicRel = toPublicDocsRel(rel)
    const dest = path.join(docsMarkdownDir, publicRel)
    ensureDir(path.dirname(dest))
    fs.copyFileSync(sourcePath, dest)

    const withoutExt = publicRel.replace(/\.md$/i, '').replace(/\\/g, '/')
    guides.push({
      htmlPath: `/docs/${withoutExt}`,
      markdownPath: `/docs-markdown/${publicRel.replace(/\\/g, '/')}`,
      title: frontmatter.title,
      description: frontmatter.description,
      updated: toUpdatedIso(frontmatter.updated),
    })
  }

  guides.sort((a, b) => a.htmlPath.localeCompare(b.htmlPath))
  return guides
}

function readApiRoutes() {
  if (!fs.existsSync(routesJsonPath)) return []
  try {
    const data = JSON.parse(fs.readFileSync(routesJsonPath, 'utf8'))
    if (!Array.isArray(data)) return []
    return data.filter((r) => typeof r === 'string' && r.startsWith('/'))
  } catch {
    return []
  }
}

/**
 * @param {{ loc: string, lastmod?: string }[]} entries
 */
function writeSitemap(entries) {
  const byLoc = new Map()
  for (const entry of entries) {
    const existing = byLoc.get(entry.loc)
    if (!existing || (entry.lastmod && (!existing.lastmod || entry.lastmod > existing.lastmod))) {
      byLoc.set(entry.loc, entry)
    }
  }

  const unique = [...byLoc.values()].sort((a, b) => a.loc.localeCompare(b.loc))

  const body = unique
    .map((entry) => {
      const lines = [`    <loc>${escapeXml(`${SITE_ORIGIN}${entry.loc}`)}</loc>`]
      if (entry.lastmod) {
        lines.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`)
      }
      return `  <url>\n${lines.join('\n')}\n  </url>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`

  fs.writeFileSync(sitemapPath, xml, 'utf8')
  return unique.length
}

/**
 * @param {GuideAsset[]} guides
 */
function writeAtomFeed(guides) {
  const withDates = guides
    .filter((g) => g.updated && g.title)
    .sort((a, b) => {
      const byDate = b.updated.localeCompare(a.updated)
      if (byDate !== 0) return byDate
      return a.htmlPath.localeCompare(b.htmlPath)
    })

  const feedUpdated = withDates[0]?.updated
    ?? new Date().toISOString().slice(0, 10)

  const entries = withDates
    .map((guide) => {
      const link = `${SITE_ORIGIN}${guide.htmlPath}`
      const summary = guide.description
        ? `\n    <summary>${escapeXml(guide.description)}</summary>`
        : ''
      return `  <entry>
    <title>${escapeXml(guide.title)}</title>
    <link href="${escapeXml(link)}" rel="alternate" type="text/html"/>
    <id>${escapeXml(link)}</id>
    <updated>${escapeXml(guide.updated)}T00:00:00Z</updated>${summary}
  </entry>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(FEED_TITLE)}</title>
  <link href="${escapeXml(SITE_ORIGIN)}/" rel="alternate" type="text/html"/>
  <link href="${escapeXml(`${SITE_ORIGIN}/feed.xml`)}" rel="self" type="application/atom+xml"/>
  <id>${escapeXml(FEED_ID)}</id>
  <updated>${escapeXml(feedUpdated)}T00:00:00Z</updated>
${entries}
</feed>
`

  fs.writeFileSync(feedPath, xml, 'utf8')
  return withDates.length
}

function main() {
  if (!fs.existsSync(contentDocs)) {
    console.error(`Missing content docs at ${contentDocs}`)
    process.exit(1)
  }

  const guides = mirrorDocsMarkdown()
  const apiRoutes = readApiRoutes()

  /** @type {{ loc: string, lastmod?: string }[]} */
  const sitemapEntries = [
    { loc: '/' },
    { loc: '/llms.txt' },
    { loc: '/robots.txt' },
    { loc: '/feed.xml' },
    { loc: '/api-catalog.json' },
  ]

  for (const guide of guides) {
    sitemapEntries.push({ loc: guide.htmlPath, lastmod: guide.updated })
    sitemapEntries.push({ loc: guide.markdownPath, lastmod: guide.updated })
  }

  for (const route of apiRoutes) {
    sitemapEntries.push({ loc: route })
  }

  // Prefer catalog when prepare-api has run; omit if missing (local docs-only).
  if (!fs.existsSync(path.join(publicDir, 'api-catalog.json'))) {
    const i = sitemapEntries.findIndex((e) => e.loc === '/api-catalog.json')
    if (i >= 0) sitemapEntries.splice(i, 1)
  }

  const sitemapCount = writeSitemap(sitemapEntries)
  const feedCount = writeAtomFeed(guides)

  console.log(
    `prepare-agent-assets: mirrored ${guides.length} guides → docs-markdown/; sitemap ${sitemapCount} URLs; atom ${feedCount} entries` +
      (apiRoutes.length ? ` (incl. ${apiRoutes.length} API routes)` : ' (no api-meta/routes.json yet)'),
  )
}

main()
