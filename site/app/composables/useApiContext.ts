import type { ApiCatalogPackage } from '~/types/api-catalog'

export function useApiContext() {
  const route = useRoute()
  const { findPackage } = useApiCatalog()

  const apiPackageId = computed(() =>
    route.path.match(/^\/api\/([^/]+)\/([^/]+)/i)?.[1]?.toLowerCase() ?? null,
  )

  const apiVersion = computed(() =>
    route.path.match(/^\/api\/([^/]+)\/([^/]+)/i)?.[2] ?? null,
  )

  const currentPackage = computed(() => findPackage(apiPackageId.value))

  const typeSlugPath = computed(() => {
    if (!apiPackageId.value || !apiVersion.value) return ''
    const prefix = `/api/${apiPackageId.value}/${apiVersion.value}`
    if (route.path === prefix || route.path === `${prefix}/`) return ''
    return route.path.slice(prefix.length)
  })

  function pathFor(packageEntry: ApiCatalogPackage, versionSegment: string): string {
    return `/api/${packageEntry.id}/${versionSegment}${typeSlugPath.value}`
  }

  function navigateToPackage(packageId: string) {
    const packageEntry = findPackage(packageId)
    if (!packageEntry) return
    return navigateTo(`/api/${packageEntry.id}/${packageEntry.defaultVersionSegment}`)
  }

  function navigateToVersion(versionSegment: string) {
    const packageEntry = currentPackage.value
    if (!packageEntry) return

    const currentLine = packageEntry.versions.find((entry) => entry.versionSegment === apiVersion.value)?.line
    const targetLine = packageEntry.versions.find((entry) => entry.versionSegment === versionSegment)?.line
    const keepTypeSlug = currentLine && targetLine && currentLine === targetLine

    const path = keepTypeSlug
      ? pathFor(packageEntry, versionSegment)
      : `/api/${packageEntry.id}/${versionSegment}`

    return navigateTo(path)
  }

  return {
    apiPackageId,
    apiVersion,
    currentPackage,
    typeSlugPath,
    navigateToPackage,
    navigateToVersion,
  }
}
