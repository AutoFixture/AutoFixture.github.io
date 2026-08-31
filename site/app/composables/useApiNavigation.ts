import type { ContentNavigationItem } from '@nuxt/content'
import type { ApiTocNode } from '~/types/api-toc'

function mapTocToNavigation(nodes: ApiTocNode[]): ContentNavigationItem[] {
  return nodes.map((node) => {
    const item: ContentNavigationItem = {
      title: node.title,
      path: node.path,
    }
    if (node.children?.length) {
      item.children = mapTocToNavigation(node.children)
    }
    return item
  })
}

async function loadApiToc(packageId: string, versionSegment: string): Promise<ApiTocNode[]> {
  if (import.meta.server) {
    const { readFile } = await import('node:fs/promises')
    const { join } = await import('node:path')
    const file = join(process.cwd(), 'public', 'api-meta', packageId, versionSegment, 'toc.json')
    return JSON.parse(await readFile(file, 'utf8')) as ApiTocNode[]
  }

  return $fetch<ApiTocNode[]>(`/api-meta/${packageId}/${versionSegment}/toc.json`)
}

export function useApiNavigation(
  packageId: MaybeRefOrGetter<string | null>,
  versionSegment: MaybeRefOrGetter<string | null>,
) {
  const packageIdRef = toRef(packageId)
  const versionSegmentRef = toRef(versionSegment)

  const { data: toc } = useAsyncData(
    () => {
      const id = packageIdRef.value
      const version = versionSegmentRef.value
      return id && version ? `api-nav-${id}-${version}` : 'api-nav-empty'
    },
    () => {
      const id = packageIdRef.value
      const version = versionSegmentRef.value
      if (!id || !version) {
        return Promise.resolve([] as ApiTocNode[])
      }
      return loadApiToc(id, version)
    },
    { watch: [packageIdRef, versionSegmentRef] },
  )

  const navigation = computed(() => mapTocToNavigation(toc.value ?? []))

  return { toc, navigation }
}
