const DEFAULT_DESCRIPTION =
  'AutoFixture makes unit tests more productive by creating anonymous test data for .NET.'

const DEFAULT_OG_IMAGE = '/og-image.png'
const OG_IMAGE_WIDTH = '1200'
const OG_IMAGE_HEIGHT = '630'

/** Crawlers such as Telegram and Teams often read only the first ~16 KB of HTML. */
const seoTagPriority = -5

type PageSeoOptions = {
  title?: MaybeRefOrGetter<string | undefined>
  description?: MaybeRefOrGetter<string | undefined>
  image?: MaybeRefOrGetter<string | undefined>
  /** Article last-updated day as YYYY-MM-DD (adds Open Graph modified_time). */
  modifiedTime?: MaybeRefOrGetter<string | undefined>
}

export function usePageSeo(options: PageSeoOptions = {}) {
  const route = useRoute()
  const { public: { siteUrl } } = useRuntimeConfig()

  const title = computed(() => formatDocumentTitle(toValue(options.title)))
  const description = computed(() => toValue(options.description) ?? DEFAULT_DESCRIPTION)
  const image = computed(() => `${siteUrl}${toValue(options.image) ?? DEFAULT_OG_IMAGE}`)
  const url = computed(() => `${siteUrl}${route.path}`)
  const modifiedTime = computed(() => {
    const day = toValue(options.modifiedTime)
    return day ? `${day}T00:00:00.000Z` : undefined
  })

  useHead({
    title,
    meta: computed(() => {
      const tags = [
        { name: 'description', content: description.value, tagPriority: seoTagPriority },
        { property: 'og:site_name', content: 'AutoFixture', tagPriority: seoTagPriority },
        { property: 'og:type', content: 'website', tagPriority: seoTagPriority },
        { property: 'og:title', content: title.value, tagPriority: seoTagPriority },
        { property: 'og:description', content: description.value, tagPriority: seoTagPriority },
        { property: 'og:image', content: image.value, tagPriority: seoTagPriority },
        { property: 'og:image:width', content: OG_IMAGE_WIDTH, tagPriority: seoTagPriority },
        { property: 'og:image:height', content: OG_IMAGE_HEIGHT, tagPriority: seoTagPriority },
        { property: 'og:url', content: url.value, tagPriority: seoTagPriority },
        { name: 'twitter:card', content: 'summary_large_image', tagPriority: seoTagPriority },
        { name: 'twitter:title', content: title.value, tagPriority: seoTagPriority },
        { name: 'twitter:description', content: description.value, tagPriority: seoTagPriority },
        { name: 'twitter:image', content: image.value, tagPriority: seoTagPriority },
      ]

      if (modifiedTime.value) {
        tags.push(
          { property: 'article:modified_time', content: modifiedTime.value, tagPriority: seoTagPriority },
          { property: 'og:updated_time', content: modifiedTime.value, tagPriority: seoTagPriority },
        )
      }

      return tags
    }),
  })
}
