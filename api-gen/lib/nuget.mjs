import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const NUGET_PACKAGE_URL = 'https://www.nuget.org/api/v2/package'

export function nugetIdForPackage(pkg) {
  return pkg.nugetId || pkg.name
}

export function packageCacheDir(cacheRoot, pkg) {
  const nugetId = nugetIdForPackage(pkg)
  return path.join(cacheRoot, nugetId, pkg.version)
}

export function libDirForPackage(packageDir, targetFramework) {
  return path.join(packageDir, 'lib', targetFramework)
}

function listTargetFrameworks(packageDir) {
  const libRoot = path.join(packageDir, 'lib')
  if (!fs.existsSync(libRoot)) return []

  return fs.readdirSync(libRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
}

function extractNupkg(nupkgPath, destination) {
  fs.mkdirSync(destination, { recursive: true })
  execSync(`tar -xf "${nupkgPath}" -C "${destination}"`, { stdio: 'inherit' })
}

export async function ensureNuGetPackage(cacheRoot, pkg) {
  const nugetId = nugetIdForPackage(pkg)
  const packageDir = packageCacheDir(cacheRoot, pkg)
  const targetFramework = pkg.targetFramework || 'netstandard2.0'
  let libDir = libDirForPackage(packageDir, targetFramework)

  if (fs.existsSync(libDir)) {
    return { packageDir, libDir, nugetId }
  }

  const extractedMarker = path.join(packageDir, '.extracted')
  const nupkgPath = path.join(packageDir, `${nugetId}.${pkg.version}.nupkg`)

  fs.mkdirSync(packageDir, { recursive: true })

  if (!fs.existsSync(nupkgPath)) {
    const url = `${NUGET_PACKAGE_URL}/${nugetId}/${pkg.version}`
    console.log(`Downloading ${nugetId} ${pkg.version}...`)
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to download ${nugetId} ${pkg.version}: HTTP ${response.status}`)
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    fs.writeFileSync(nupkgPath, buffer)
  }

  if (!fs.existsSync(extractedMarker)) {
    console.log(`Extracting ${path.basename(nupkgPath)}...`)
    extractNupkg(nupkgPath, packageDir)
    fs.writeFileSync(extractedMarker, '')
  }

  libDir = libDirForPackage(packageDir, targetFramework)
  if (!fs.existsSync(libDir)) {
    const available = listTargetFrameworks(packageDir)
    throw new Error(
      `Target framework ${targetFramework} not found for ${nugetId} ${pkg.version}. Available: ${available.join(', ') || 'none'}`,
    )
  }

  return { packageDir, libDir, nugetId }
}

export function resolveAssemblyFile(libDir, pkg) {
  const nugetId = nugetIdForPackage(pkg)

  /** @type {string[]} */
  const preferredNames = []
  if (pkg.assemblyName) preferredNames.push(`${pkg.assemblyName}.dll`)
  preferredNames.push(`${nugetId}.dll`)

  for (const fileName of preferredNames) {
    const exact = path.join(libDir, fileName)
    if (fs.existsSync(exact)) return fileName

    const match = fs.readdirSync(libDir).find(
      (entry) => entry.toLowerCase() === fileName.toLowerCase(),
    )
    if (match) return match
  }

  const dlls = fs.readdirSync(libDir).filter((entry) => entry.toLowerCase().endsWith('.dll'))
  if (dlls.length === 1) return dlls[0]

  throw new Error(
    `Could not resolve assembly in ${libDir}. Set assemblyName in packages.json. Found: ${dlls.join(', ') || 'none'}`,
  )
}
