import type { ApiSearchSection } from '~/types/api-page'

export function useApiSearchSections(
  packageId: MaybeRefOrGetter<string | null>,
  versionSegment: MaybeRefOrGetter<string | null>,
) {
  const packageIdRef = toRef(packageId)
  const versionSegmentRef = toRef(versionSegment)
  const { open } = useContentSearch()

  const searchUrl = computed(() => {
    const id = packageIdRef.value
    const version = versionSegmentRef.value
    return id && version ? `/api-meta/${id}/${version}/search.json` : null
  })

  const searchCacheKey = computed(() => {
    const url = searchUrl.value
    return url ? `api-search-${url}` : 'api-search-empty'
  })

  async function loadSearchSections() {
    const url = searchUrl.value
    if (!url) {
      return []
    }

    const sections = await $fetch<ApiSearchSection[]>(url)
    return sections.map((section) => ({
      id: section.id,
      title: section.title,
      content: section.content,
      titles: section.titles,
      level: section.level,
    }))
  }

  const { data: files, status, execute } = useLazyAsyncData(
    searchCacheKey,
    loadSearchSections,
    { server: false, immediate: false, watch: [searchUrl] },
  )

  watch([open, searchUrl], ([isOpen, url]) => {
    if (isOpen && url) {
      execute()
    }
  })

  return { files, status }
}
