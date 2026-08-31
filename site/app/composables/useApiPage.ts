import type { ApiRenderResponse } from '~/types/api-page'

export function useApiPage(path: MaybeRefOrGetter<string>) {
  const pathRef = toRef(path)

  return useAsyncData(
    () => `api-page-${pathRef.value}`,
    async (): Promise<ApiRenderResponse | null> => {
      try {
        return await $fetch<ApiRenderResponse>('/api-render', {
          query: { path: pathRef.value },
        })
      } catch {
        return null
      }
    },
    { watch: [pathRef] },
  )
}
