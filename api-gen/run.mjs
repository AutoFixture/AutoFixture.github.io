import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postprocessOut } from './lib/postprocess.mjs'
import { writeApiCatalog } from './lib/catalog.mjs'
import { toVersionSegment } from './lib/version.mjs'
import { ensureNuGetPackage, nugetIdForPackage, resolveAssemblyFile } from './lib/nuget.mjs'

const apiGenRoot = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(apiGenRoot, '..')
const outRoot = path.join(apiGenRoot, 'out')
const packagesCacheRoot = path.join(apiGenRoot, 'packages-cache')
const packagesPath = path.join(apiGenRoot, 'packages.json')
const docfxPath = path.join(apiGenRoot, 'docfx.json')
const siteApiMarkdown = path.join(repoRoot, 'site/public/api-markdown')
const siteApiMeta = path.join(repoRoot, 'site/public/api-meta')
const siteApiCatalog = path.join(repoRoot, 'site/public/api-catalog.json')

function loadPackages() {
  return JSON.parse(fs.readFileSync(packagesPath, 'utf8')).packages
}

function writeDocfxConfig(pkg, versionSegment, libDir, assemblyFile) {
  const metadataEntry = {
    src: [
      {
        files: [assemblyFile],
        src: path.relative(apiGenRoot, libDir).replace(/\\/g, '/'),
      },
    ],
    dest: `out/${pkg.id}/${versionSegment}`,
    outputFormat: 'markdown',
    namespaceLayout: 'flattened',
    memberLayout: 'samePage',
  }

  fs.writeFileSync(docfxPath, `${JSON.stringify({ metadata: [metadataEntry] }, null, 2)}\n`)
}

function writePackageMeta(pkg, version, versionSegment, outDir) {
  fs.mkdirSync(outDir, { recursive: true })

  const meta = {
    package: pkg.name,
    packageId: pkg.id,
    line: pkg.line,
    version,
    versionSegment,
    primary: Boolean(pkg.primary),
    nugetId: nugetIdForPackage(pkg),
  }

  fs.writeFileSync(path.join(outDir, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`)

  const index = [
    `# ${pkg.name}`,
    '',
    `API reference for **${pkg.name}** \`${version}\`.`,
    '',
  ].join('\n')

  fs.writeFileSync(path.join(outDir, 'index.md'), index)
  console.log(`Wrote meta for ${pkg.id}/${versionSegment}`)
}

function resolveDocfxCommand() {
  const home = process.env.HOME || process.env.USERPROFILE || ''
  const candidates = [
    'docfx',
    home ? path.join(home, '.dotnet/tools/docfx') : null,
    home ? path.join(home, '.dotnet/tools/docfx.exe') : null,
  ].filter(Boolean)

  for (const candidate of candidates) {
    try {
      execSync(`"${candidate}" --version`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      })
      return candidate
    } catch {
      // try next candidate
    }
  }

  throw new Error(
    [
      'DocFX not found.',
      '',
      'Install (requires .NET SDK):',
      '  dotnet tool install -g docfx',
      '',
      'On Linux/WSL, add dotnet tools to PATH (add to ~/.bashrc to persist):',
      '  export PATH="$PATH:$HOME/.dotnet/tools"',
      '',
      'Verify:',
      '  docfx --version',
      '',
      'Then rerun:',
      '  node api-gen/run.mjs prepare',
    ].join('\n'),
  )
}

function runDocfxMetadata() {
  const docfx = resolveDocfxCommand()
  execSync(`"${docfx}" metadata docfx.json`, { cwd: apiGenRoot, stdio: 'inherit' })
}

async function generatePackage(pkg) {
  if (!pkg.version) {
    throw new Error(`Package ${pkg.id} (${pkg.line}) is missing a pinned version`)
  }

  const version = String(pkg.version).replace(/^v/, '')
  const versionSegment = toVersionSegment(version)
  const outDir = path.join(outRoot, pkg.id, versionSegment)
  const { libDir } = await ensureNuGetPackage(packagesCacheRoot, pkg)
  const assemblyFile = resolveAssemblyFile(libDir, pkg)

  console.log(`Using ${path.join(path.relative(apiGenRoot, libDir), assemblyFile)}`)
  writeDocfxConfig(pkg, versionSegment, libDir, assemblyFile)
  runDocfxMetadata()
  writePackageMeta(pkg, version, versionSegment, outDir)
}

async function generateAll() {
  const packages = loadPackages()
  if (!packages.length) {
    throw new Error('No packages configured in api-gen/packages.json')
  }

  removeIfExists(outRoot)

  for (const pkg of packages) {
    console.log(`Generating ${pkg.id} ${pkg.line} (${pkg.version})...`)
    await generatePackage(pkg)
  }

  postprocessOut(outRoot)
}

function copyDirectoryContents(source, destination) {
  fs.mkdirSync(destination, { recursive: true })
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name)
    const to = path.join(destination, entry.name)
    if (entry.isDirectory()) {
      copyDirectoryContents(from, to)
    } else {
      fs.copyFileSync(from, to)
    }
  }
}

function removeIfExists(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true })
  }
}

function walkFiles(root, fileName) {
  /** @type {string[]} */
  const files = []
  if (!fs.existsSync(root)) return files

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkFiles(full, fileName))
    } else if (entry.name === fileName) {
      files.push(full)
    }
  }

  return files
}

function syncPackageDir(sourceDir, markdownDir, metaDir) {
  fs.mkdirSync(markdownDir, { recursive: true })
  fs.mkdirSync(metaDir, { recursive: true })

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue

    const from = path.join(sourceDir, entry.name)
    if (entry.name.toLowerCase().endsWith('.md')) {
      // URLs and loaders use lowercase slugs; keep filenames lowercase for Linux CI.
      fs.copyFileSync(from, path.join(markdownDir, entry.name.toLowerCase()))
      continue
    }

    if (entry.name === 'meta.json' || entry.name === 'toc.json' || entry.name === 'search.json') {
      fs.copyFileSync(from, path.join(metaDir, entry.name))
    }
  }

  const pagesSource = path.join(sourceDir, 'pages')
  if (fs.existsSync(pagesSource)) {
    copyDirectoryContents(pagesSource, path.join(metaDir, 'pages'))
  }
}

function syncAll() {
  if (!fs.existsSync(outRoot)) {
    throw new Error(`Missing ${outRoot}. Run: node api-gen/run.mjs generate`)
  }

  if (!walkFiles(outRoot, 'toc.json').length) {
    postprocessOut(outRoot)
  }

  removeIfExists(siteApiMarkdown)
  removeIfExists(siteApiMeta)

  for (const metaPath of walkFiles(outRoot, 'meta.json')) {
    const sourceDir = path.dirname(metaPath)
    const rel = path.relative(outRoot, sourceDir).replace(/\\/g, '/')
    syncPackageDir(
      sourceDir,
      path.join(siteApiMarkdown, rel),
      path.join(siteApiMeta, rel),
    )
  }

  const routesSource = path.join(outRoot, 'routes.json')
  if (fs.existsSync(routesSource)) {
    fs.mkdirSync(siteApiMeta, { recursive: true })
    fs.copyFileSync(routesSource, path.join(siteApiMeta, 'routes.json'))
  }

  const slugIndexSource = path.join(outRoot, 'slug-index.json')
  if (fs.existsSync(slugIndexSource)) {
    fs.mkdirSync(siteApiMeta, { recursive: true })
    fs.copyFileSync(slugIndexSource, path.join(siteApiMeta, 'slug-index.json'))
  }

  writeApiCatalog(outRoot, siteApiCatalog)
  console.log(`Synced markdown -> ${path.relative(repoRoot, siteApiMarkdown)}`)
  console.log(`Synced meta/search/pages -> ${path.relative(repoRoot, siteApiMeta)}`)
}

function cleanAll() {
  removeIfExists(outRoot)
  removeIfExists(packagesCacheRoot)
  removeIfExists(siteApiMarkdown)
  removeIfExists(siteApiMeta)
  removeIfExists(siteApiCatalog)
  // Legacy path from an earlier Content-based sync; safe no-op if absent
  removeIfExists(path.join(repoRoot, 'site/content/api'))
  console.log('Removed generated API output')
}

const command = process.argv[2] || 'prepare'

try {
  switch (command) {
    case 'generate':
      await generateAll()
      break
    case 'sync':
      syncAll()
      break
    case 'prepare':
      await generateAll()
      syncAll()
      break
    case 'postprocess':
      postprocessOut(outRoot)
      break
    case 'clean':
      cleanAll()
      break
    default:
      console.error(`Unknown command: ${command}`)
      console.error('Usage: node api-gen/run.mjs [generate|sync|prepare|postprocess|clean]')
      process.exit(1)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
