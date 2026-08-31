import fs from 'node:fs'
import path from 'node:path'
import { toVersionSegment } from './version.mjs'
import { writePageArtifacts, writeRoutesManifest, writeSlugIndex, buildPageIndex, resolvePagePath, annotateMemberHeadingIds } from './page-artifacts.mjs'

function walkDirs(dir) {
  /** @type {string[]} */
  const result = []
  if (!fs.existsSync(dir)) return result
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      result.push(full, ...walkDirs(full))
    }
  }
  return result
}

function parseDocFxToc(text) {
  const lines = text
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.startsWith('###'))

  /** @type {{ name: string, href?: string, items?: any[] }[]} */
  const root = []
  /** @type {{ indent: number, items: any[] }[]} */
  const listStack = [{ indent: -1, items: root }]
  /** @type {{ name: string, href?: string, items?: any[] } | null} */
  let currentNode = null

  for (const line of lines) {
    const indent = line.match(/^ */)[0].length
    const trimmed = line.trim()

    if (trimmed.startsWith('- name:')) {
      while (listStack.length > 1 && indent < listStack[listStack.length - 1].indent) {
        listStack.pop()
      }
      currentNode = { name: trimmed.slice('- name:'.length).trim() }
      listStack[listStack.length - 1].items.push(currentNode)
      continue
    }

    if (trimmed.startsWith('href:')) {
      if (currentNode) currentNode.href = trimmed.slice('href:'.length).trim()
      continue
    }

    if (trimmed === 'items:') {
      if (!currentNode) continue
      currentNode.items = []
      listStack.push({ indent, items: currentNode.items })
    }
  }

  return root
}

function hrefToPath(href, packageId, versionSegment, packageDir, pageIndex) {
  if (!href) return null
  const file = href.split('#')[0]
  if (!file.toLowerCase().endsWith('.md')) return null
  const slug = file
    .replace(/^\.\//, '')
    .replace(/\.md$/i, '')
    .toLowerCase()
  const hash = href.includes('#') ? href.slice(href.indexOf('#')) : ''
  return `${resolvePagePath(slug, packageId, versionSegment, packageDir, pageIndex)}${hash}`
}

/** DocFX section labels in toc.yml — grouping headers, not pages. */
const SECTION_LABELS = new Set(['Classes', 'Interfaces', 'Enums', 'Structs', 'Delegates'])

function groupDocFxSections(nodes) {
  /** @type {typeof nodes} */
  const result = []
  /** @type {typeof nodes[0] | null} */
  let section = null

  for (const node of nodes) {
    const isLabel = !node.href && !node.items?.length && SECTION_LABELS.has(node.name)
    if (isLabel) {
      section = { name: node.name, items: [] }
      result.push(section)
      continue
    }

    if (section) {
      section.items.push(node)
    } else {
      result.push(node)
    }
  }

  return result
}

function mapToc(nodes, packageId, versionSegment, packageDir, pageIndex) {
  return nodes.map((node) => {
    /** @type {{ title: string, path?: string, children?: any[] }} */
    const mapped = { title: node.name }
    const route = hrefToPath(node.href, packageId, versionSegment, packageDir, pageIndex)
    if (route) mapped.path = route
    const childNodes = node.items?.length ? groupDocFxSections(node.items) : []
    if (childNodes.length) {
      mapped.children = mapToc(childNodes, packageId, versionSegment, packageDir, pageIndex)
    }
    return mapped
  })
}

function repairBrokenMarkdownLinks(content) {
  return content.replace(
    /\[([^\]/\[]+)(\/api\/[^\s,\]\\]+)/g,
    '[$1]($2)',
  )
}

function rewriteMarkdownLinks(content, packageId, versionSegment, packageDir, pageIndex) {
  function linkFor(file, hash = '') {
    const slug = String(file).replace(/\.md$/i, '').toLowerCase()
    return `${resolvePagePath(slug, packageId, versionSegment, packageDir, pageIndex)}${hash || ''}`
  }

  return repairBrokenMarkdownLinks(content)
    .replace(
      /\]\((?:\.\/)?([^)\s#]+\.md)(#[^)\s]*)?\)/gi,
      (_match, file, hash = '') => `](${linkFor(file, hash)})`,
    )
    .replace(
      /\(([A-Za-z0-9_.-]+\.md)(#[^)\s]*)?\)/gi,
      (_match, file, hash = '') => `(${linkFor(file, hash)})`,
    )
    .replace(
      /<xref\b[^>]*\bhref="([^"]+)"[^>]*><\/xref>/gi,
      (_match, href) => {
        const name = String(href).split('.').pop() || href
        return `\`${name}\``
      },
    )
}

function readPackageMeta(dir) {
  const metaPath = path.join(dir, 'meta.json')
  if (!fs.existsSync(metaPath)) return null

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
  const packageId = String(meta.packageId || '').toLowerCase()
  const version = String(meta.version || '').trim()
  const versionSegment = String(meta.versionSegment || toVersionSegment(version)).trim()
  if (!packageId || !version || !versionSegment) return null

  return { packageId, version, versionSegment }
}

function processPackageDir(outRoot, dir, pageIndex) {
  const rel = path.relative(outRoot, dir).replace(/\\/g, '/')
  const parts = rel.split('/').filter(Boolean)
  if (parts.length !== 2) return false

  const meta = readPackageMeta(dir)
  if (!meta) return false

  const { packageId, versionSegment } = meta
  const tocPath = path.join(dir, 'toc.yml')
  if (!fs.existsSync(tocPath)) return false

  const toc = parseDocFxToc(fs.readFileSync(tocPath, 'utf8'))
  const mapped = [
    {
      title: 'Overview',
      path: `/api/${packageId}/${versionSegment}`,
    },
    ...mapToc(toc, packageId, versionSegment, dir, pageIndex),
  ]
  fs.writeFileSync(path.join(dir, 'toc.json'), `${JSON.stringify(mapped, null, 2)}\n`)

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.md')) continue
    const filePath = path.join(dir, entry.name)
    const original = fs.readFileSync(filePath, 'utf8')
    const updated = annotateMemberHeadingIds(
      rewriteMarkdownLinks(original, packageId, versionSegment, dir, pageIndex),
    ).replace(/See the \[table of contents\]\(\.\/toc\.yml\)\.\r?\n?/i, '')
    if (updated !== original) {
      fs.writeFileSync(filePath, updated)
    }
  }

  writePageArtifacts(dir, packageId, versionSegment)

  console.log(`Post-processed ${rel} (${mapped.length} top-level toc entries)`)
  return true
}

export function postprocessOut(outRoot) {
  if (!fs.existsSync(outRoot)) {
    throw new Error(`Missing ${outRoot}. Run: node api-gen/run.mjs generate`)
  }

  const pageIndex = buildPageIndex(outRoot)

  let count = 0
  for (const dir of [outRoot, ...walkDirs(outRoot)]) {
    if (processPackageDir(outRoot, dir, pageIndex)) count += 1
  }

  if (count === 0) {
    throw new Error('No package/version folders with meta.json and toc.yml found under api-gen/out')
  }

  writeRoutesManifest(outRoot, path.join(outRoot, 'routes.json'))
  writeSlugIndex(outRoot, path.join(outRoot, 'slug-index.json'))

  return count
}
