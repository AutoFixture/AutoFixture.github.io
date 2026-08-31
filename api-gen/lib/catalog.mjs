import fs from 'node:fs'
import path from 'node:path'
import { toVersionSegment } from './version.mjs'
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

function compareVersions(left, right) {
  const leftParts = left.split(/[.-]/).map((part) => Number.parseInt(part, 10) || 0)
  const rightParts = right.split(/[.-]/).map((part) => Number.parseInt(part, 10) || 0)
  const length = Math.max(leftParts.length, rightParts.length)

  for (let index = 0; index < length; index += 1) {
    const delta = (leftParts[index] ?? 0) - (rightParts[index] ?? 0)
    if (delta !== 0) return delta
  }

  return 0
}

export function buildApiCatalog(outRoot) {
  /** @type {Map<string, any>} */
  const packages = new Map()

  for (const metaPath of walkMetaFiles(outRoot)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
    const packageId = String(meta.packageId || '').toLowerCase()
    const version = String(meta.version || '').trim()
    const versionSegment = String(meta.versionSegment || toVersionSegment(version)).trim()
    if (!packageId || !version || !versionSegment) continue

    const entry = packages.get(packageId) ?? {
      id: packageId,
      name: String(meta.package || packageId),
      nugetId: String(meta.nugetId || meta.package || packageId),
      primary: false,
      versions: [],
    }

    entry.primary = entry.primary || Boolean(meta.primary)
    entry.name = String(meta.package || entry.name)
    entry.nugetId = String(meta.nugetId || meta.package || entry.nugetId)

    entry.versions.push({
      version,
      versionSegment,
      line: meta.line ? String(meta.line) : undefined,
    })
    packages.set(packageId, entry)
  }

  for (const pkg of packages.values()) {
    pkg.versions.sort((a, b) => compareVersions(b.version, a.version))
    const latest = pkg.versions[0]
    if (latest) {
      pkg.defaultVersion = latest.version
      pkg.defaultVersionSegment = latest.versionSegment
      pkg.versions = pkg.versions.map((item, index) => ({
        ...item,
        isLatest: index === 0,
      }))
    }
  }

  const packageList = [...packages.values()].sort((a, b) => a.name.localeCompare(b.name))
  const primary = packageList.find((entry) => entry.primary) ?? packageList[0]
  const defaultPath = primary?.defaultVersionSegment
    ? `/api/${primary.id}/${primary.defaultVersionSegment}`
    : '/api'

  return {
    defaultPath,
    packages: packageList,
  }
}

export function writeApiCatalog(outRoot, catalogPath) {
  const catalog = buildApiCatalog(outRoot)
  fs.mkdirSync(path.dirname(catalogPath), { recursive: true })
  fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`)
  console.log(`Wrote ${catalogPath} (${catalog.packages.length} package(s))`)
  return catalog
}
