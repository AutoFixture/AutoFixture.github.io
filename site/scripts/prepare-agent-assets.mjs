/**
 * Prepare agent-facing static assets before `nuxt generate`:
 * - Mirror guide markdown to public/docs-markdown/ (URL-aligned paths)
 * - Write public/sitemap.xml (guides, docs-markdown, API routes when present)
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
const routesJsonPath = path.join(publicDir, 'api-meta', 'routes.json')

const SITE_ORIGIN = 'https://autofixture.com'

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

/**
 * @returns {{ htmlPaths: string[], markdownPaths: string[] }}
 */
function mirrorDocsMarkdown() {
  removeIfExists(docsMarkdownDir)
  ensureDir(docsMarkdownDir)

  /** @type {string[]} */
  const htmlPaths = []
  /** @type {string[]} */
  const markdownPaths = []

  const files = walkMarkdownFiles(contentDocs)
  for (const rel of files) {
    const publicRel = toPublicDocsRel(rel)
    const dest = path.join(docsMarkdownDir, publicRel)
    ensureDir(path.dirname(dest))
    fs.copyFileSync(path.join(contentDocs, rel), dest)

    const withoutExt = publicRel.replace(/\.md$/i, '')
    htmlPaths.push(`/docs/${withoutExt}`)
    markdownPaths.push(`/docs-markdown/${publicRel.replace(/\\/g, '/')}`)
  }

  htmlPaths.sort()
  markdownPaths.sort()
  return { htmlPaths, markdownPaths }
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

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * @param {string[]} locs
 */
function writeSitemap(locs) {
  const unique = [...new Set(locs)]
  unique.sort()

  const body = unique
    .map(
      (loc) => `  <url>
    <loc>${escapeXml(`${SITE_ORIGIN}${loc}`)}</loc>
  </url>`,
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`

  fs.writeFileSync(sitemapPath, xml, 'utf8')
  return unique.length
}

function main() {
  if (!fs.existsSync(contentDocs)) {
    console.error(`Missing content docs at ${contentDocs}`)
    process.exit(1)
  }

  const { htmlPaths, markdownPaths } = mirrorDocsMarkdown()
  const apiRoutes = readApiRoutes()

  const locs = [
    '/',
    '/llms.txt',
    '/robots.txt',
    '/api-catalog.json',
    ...htmlPaths,
    ...markdownPaths,
    ...apiRoutes,
  ]

  // Prefer catalog when prepare-api has run; omit if missing (local docs-only).
  if (!fs.existsSync(path.join(publicDir, 'api-catalog.json'))) {
    const i = locs.indexOf('/api-catalog.json')
    if (i >= 0) locs.splice(i, 1)
  }

  const count = writeSitemap(locs)

  console.log(
    `prepare-agent-assets: mirrored ${htmlPaths.length} guides → docs-markdown/; sitemap ${count} URLs` +
      (apiRoutes.length ? ` (incl. ${apiRoutes.length} API routes)` : ' (no api-meta/routes.json yet)'),
  )
}

main()
