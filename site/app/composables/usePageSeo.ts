const DEFAULT_DESCRIPTION =
  'AutoFixture makes unit tests more productive by creating anonymous test data for .NET.'

const DEFAULT_OG_IMAGE = '/og-image.png'

type PageSeoOptions = {
  title?: MaybeRefOrGetter<string | undefined>
  description?: MaybeRefOrGetter<string | undefined>
  image?: MaybeRefOrGetter<string | undefined>
}

export function usePageSeo(options: PageSeoOptions = {}) {
  const route = useRoute()
  const { public: { siteUrl } } = useRuntimeConfig()

  const title = computed(() => toValue(options.title) ?? 'AutoFixture')
  const description = computed(() => toValue(options.description) ?? DEFAULT_DESCRIPTION)
  const image = computed(() => `${siteUrl}${toValue(options.image) ?? DEFAULT_OG_IMAGE}`)
  const url = computed(() => `${siteUrl}${route.path}`)

  useHead({
    title,
    meta: computed(() => [
      { name: 'description', content: description.value },
      { property: 'og:title', content: title.value },
      { property: 'og:description', content: description.value },
      { property: 'og:image', content: image.value },
      { property: 'og:url', content: url.value },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'AutoFixture' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title.value },
      { name: 'twitter:description', content: description.value },
      { name: 'twitter:image', content: image.value },
    ]),
  })
}
