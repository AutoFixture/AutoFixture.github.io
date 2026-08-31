import type { ApiCatalog, ApiCatalogPackage } from '~/types/api-catalog'

const emptyCatalog: ApiCatalog = {
  defaultPath: '/api/autofixture/5-0-0-rc-1',
  packages: [],
}

async function loadApiCatalog(): Promise<ApiCatalog> {
  if (import.meta.server) {
    try {
      const { readFile } = await import('node:fs/promises')
      const { join } = await import('node:path')
      const raw = await readFile(join(process.cwd(), 'public/api-catalog.json'), 'utf8')
      return JSON.parse(raw) as ApiCatalog
    } catch {
      return emptyCatalog
    }
  }

  const response = await fetch('/api-catalog.json')
  if (!response.ok) return emptyCatalog
  return response.json() as Promise<ApiCatalog>
}

export function useApiCatalog() {
  const { data: catalog, status } = useAsyncData('api-catalog', loadApiCatalog)

  const packages = computed(() => catalog.value?.packages ?? [])

  function findPackage(packageId: string | null | undefined): ApiCatalogPackage | undefined {
    if (!packageId) return undefined
    return packages.value.find((entry) => entry.id === packageId.toLowerCase())
  }

  function defaultApiPath(): string {
    if (catalog.value?.defaultPath) {
      return catalog.value.defaultPath
    }

    const main = packages.value.find((entry) => entry.primary) ?? packages.value[0]
    if (!main) return emptyCatalog.defaultPath
    return `/api/${main.id}/${main.defaultVersionSegment}`
  }

  const hasMultiplePackages = computed(() => packages.value.length > 1)

  return {
    catalog,
    status,
    packages,
    hasMultiplePackages,
    findPackage,
    defaultApiPath,
  }
}
