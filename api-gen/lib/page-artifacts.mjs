import fs from 'node:fs'
import path from 'node:path'

const HEADING_RE = /^(#{1,6})\s+(.*)$/

/** DocFX member sub-headings — repeated under each member; excluded from sidebar TOC. */
export const MEMBER_SUBSECTION_LABELS = new Set([
  'Parameters',
  'Returns',
  'Remarks',
  'Property Value',
  'See Also',
  'Type Parameters',
  'Exceptions',
  'Examples',
  'Field Value',
  'Event Type',
  'Derived',
])

function stripHtml(value) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/\\([\\`*_{}[\]()#+\-.!])/g, '$1')
    .trim()
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function stripFrontmatter(markdown) {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
}

function parseHeadingLine(line) {
  const match = line.match(HEADING_RE)
  if (!match) return null

  const depth = match[1].length
  const raw = match[2]
  const idMatch = raw.match(/<a\s+id="([^"]+)"/i)
  const text = stripHtml(raw)

  return {
    depth,
    id: idMatch?.[1] ?? slugify(text),
    text,
  }
}

function buildTocTree(headings) {
  /** @type {{ id: string, text: string, depth: number, children?: { id: string, text: string, depth: number, children?: unknown[] }[] }[]} */
  const root = []

  /** @type {{ depth: number, children: typeof root }[]} */
  const stack = [{ depth: 0, children: root }]

  for (const heading of headings) {
    if (!shouldIncludeInToc(heading)) continue

    const node = { id: heading.id, text: heading.text, depth: heading.depth }

    while (stack.length > 1 && stack[stack.length - 1].depth >= heading.depth) {
      stack.pop()
    }

    stack[stack.length - 1].children.push(node)

    if (heading.depth < 4) {
      node.children = []
      stack.push({ depth: heading.depth, children: node.children })
    }
  }

  for (const node of walkTocNodes(root)) {
    if (!node.children?.length) {
      delete node.children
    }
  }

  return root
}

function shouldIncludeInToc(heading) {
  if (heading.depth < 2 || heading.depth > 4 || !heading.text) return false
  if (heading.depth === 4 && MEMBER_SUBSECTION_LABELS.has(heading.text)) return false
  return true
}

/**
 * Adds unique anchor ids to repeated member sub-headings (Parameters, Returns, …).
 * @param {string} markdown
 */
export function annotateMemberHeadingIds(markdown) {
  const lines = markdown.split(/\r?\n/)
  /** @type {string | null} */
  let memberId = null

  return lines.map((line) => {
    const match = line.match(HEADING_RE)
    if (!match) return line

    const depth = match[1].length
    const raw = match[2]

    if (depth === 2) {
      memberId = null
      return line
    }

    if (depth === 3) {
      memberId = raw.match(/<a\s+id="([^"]+)"/i)?.[1] ?? null
      return line
    }

    if (depth === 4 && memberId) {
      const text = stripHtml(raw)
      if (MEMBER_SUBSECTION_LABELS.has(text) && !/<a\s+id="/i.test(raw)) {
        return `#### <a id="${memberId}-${slugify(text)}"></a> ${text}`
      }
    }

    return line
  }).join('\n')
}

function* walkTocNodes(nodes) {
  for (const node of nodes) {
    yield node
    if (node.children?.length) {
      yield* walkTocNodes(node.children)
    }
  }
}

function splitSections(markdown) {
  const lines = markdown.split(/\r?\n/)
  /** @type {{ heading: ReturnType<typeof parseHeadingLine> | null, lines: string[] }[]} */
  const sections = [{ heading: null, lines: [] }]

  for (const line of lines) {
    const heading = parseHeadingLine(line)
    if (heading) {
      sections.push({ heading, lines: [line] })
      continue
    }
    sections[sections.length - 1].lines.push(line)
  }

  return sections
}

function plainTextFromLines(lines) {
  return stripHtml(
    lines
      .join('\n')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim(),
  )
}

/**
 * @param {string} markdown
 * @param {string} pagePath
 */
export function extractPageArtifacts(markdown, pagePath) {
  const body = stripFrontmatter(markdown)
  const lines = body.split(/\r?\n/)
  const headings = lines.map(parseHeadingLine).filter(Boolean)
  const pageHeading = headings.find((heading) => heading.depth === 1)
  const title = pageHeading?.text || pagePath.split('/').pop() || 'API'

  return {
    title,
    tocLinks: buildTocTree(headings),
    searchSections: buildSearchSections(body, pagePath, title),
  }
}

/**
 * @param {string} markdown
 * @param {string} pagePath
 * @param {string} pageTitle
 */
function buildSearchSections(markdown, pagePath, pageTitle) {
  /** @type {{ id: string, title: string, content: string, titles: string[], level: number }[]} */
  const sections = []
  const parts = splitSections(markdown)
  const pageText = plainTextFromLines(parts.flatMap((part) => part.lines))

  sections.push({
    id: pagePath,
    title: pageTitle,
    content: pageText.slice(0, 240),
    titles: [],
    level: 1,
  })

  /** @type {string[]} */
  const ancestors = []

  for (const part of parts) {
    if (!part.heading || part.heading.depth < 2) continue

    ancestors[part.heading.depth - 2] = part.heading.text
    ancestors.length = part.heading.depth - 1

    const content = plainTextFromLines(part.lines.slice(1))
    if (!content) continue

    sections.push({
      id: `${pagePath}#${part.heading.id}`,
      title: part.heading.text,
      content: content.slice(0, 240),
      titles: ancestors.slice(0, -1).filter(Boolean),
      level: part.heading.depth,
    })
  }

  return sections
}

/**
 * @param {string} packageDir
 * @param {string} packageId
 * @param {string} versionSegment
 */
export function writePageArtifacts(packageDir, packageId, versionSegment) {
  /** @type {{ id: string, title: string, content: string, titles: string[], level: number }[]} */
  const searchSections = []

  const pagesDir = path.join(packageDir, 'pages')
  fs.mkdirSync(pagesDir, { recursive: true })

  for (const entry of fs.readdirSync(packageDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.md')) continue

    const slug = entry.name.replace(/\.md$/i, '').toLowerCase()
    const markdown = fs.readFileSync(path.join(packageDir, entry.name), 'utf8')
    const pagePath = slug === 'index'
      ? `/api/${packageId}/${versionSegment}`
      : `/api/${packageId}/${versionSegment}/${slug}`

    const artifacts = extractPageArtifacts(markdown, pagePath)
    fs.writeFileSync(
      path.join(pagesDir, `${slug}.json`),
      `${JSON.stringify({ path: pagePath, title: artifacts.title, tocLinks: artifacts.tocLinks }, null, 2)}\n`,
    )

    searchSections.push(...artifacts.searchSections)
  }

  fs.writeFileSync(
    path.join(packageDir, 'search.json'),
    `${JSON.stringify(searchSections, null, 2)}\n`,
  )
}

/**
 * @param {string} outRoot
 */
export function buildPageIndex(outRoot) {
  /** @type {Map<string, { packageId: string, versionSegment: string, path: string, primary: boolean }[]>} */
  const index = new Map()

  for (const metaPath of walkMetaFiles(outRoot)) {
    const packageDir = path.dirname(metaPath)
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
    const packageId = String(meta.packageId || '').toLowerCase()
    const versionSegment = String(meta.versionSegment || '').trim()
    if (!packageId || !versionSegment) continue

    const primary = Boolean(meta.primary)

    for (const entry of fs.readdirSync(packageDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.md')) continue
      const slug = entry.name.replace(/\.md$/i, '').toLowerCase()
      if (slug === 'index') continue

      const pagePath = `/api/${packageId}/${versionSegment}/${slug}`
      const list = index.get(slug) ?? []
      list.push({ packageId, versionSegment, path: pagePath, primary })
      index.set(slug, list)
    }
  }

  return index
}

/**
 * @param {string} slug
 * @param {string} packageId
 * @param {string} versionSegment
 * @param {string} packageDir
 * @param {ReturnType<typeof buildPageIndex>} pageIndex
 */
export function resolvePagePath(slug, packageId, versionSegment, packageDir, pageIndex) {
  const localFile = path.join(packageDir, `${slug}.md`)
  if (fs.existsSync(localFile)) {
    return `/api/${packageId}/${versionSegment}/${slug}`
  }

  const candidates = pageIndex.get(slug) ?? []
  if (!candidates.length) {
    return `/api/${packageId}/${versionSegment}/${slug}`
  }

  const preferred = candidates.find((entry) => entry.primary)
    ?? candidates.find((entry) => entry.packageId === packageId)
    ?? candidates[0]

  return preferred.path
}

/**
 * @param {string} outRoot
 * @param {string} indexPath
 */
export function writeSlugIndex(outRoot, indexPath) {
  /** @type {Record<string, string>} */
  const slugIndex = {}
  const pageIndex = buildPageIndex(outRoot)

  for (const [slug, candidates] of pageIndex.entries()) {
    const preferred = candidates.find((entry) => entry.primary) ?? candidates[0]
    slugIndex[slug] = preferred.path
  }

  fs.mkdirSync(path.dirname(indexPath), { recursive: true })
  fs.writeFileSync(indexPath, `${JSON.stringify(slugIndex, null, 2)}\n`)
}

/**
 * @param {string} outRoot
 * @param {string} routesPath
 */
export function writeRoutesManifest(outRoot, routesPath) {
  /** @type {string[]} */
  const routes = []

  for (const metaPath of walkMetaFiles(outRoot)) {
    const packageDir = path.dirname(metaPath)
    const rel = path.relative(outRoot, packageDir).replace(/\\/g, '/')
    const [packageId, versionSegment] = rel.split('/')
    if (!packageId || !versionSegment) continue

    routes.push(`/api/${packageId}/${versionSegment}`)

    for (const entry of fs.readdirSync(packageDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.md')) continue
      const slug = entry.name.replace(/\.md$/i, '').toLowerCase()
      if (slug === 'index') continue
      routes.push(`/api/${packageId}/${versionSegment}/${slug}`)
    }
  }

  fs.mkdirSync(path.dirname(routesPath), { recursive: true })
  fs.writeFileSync(routesPath, `${JSON.stringify([...new Set(routes)].sort(), null, 2)}\n`)
}

function walkMetaFiles(root) {
  /** @type {string[]} */
  const files = []
  if (!fs.existsSync(root)) return files

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkMetaFiles(full))
      continue
    }
    if (entry.name === 'meta.json') {
      files.push(full)
    }
  }

  return files
}
