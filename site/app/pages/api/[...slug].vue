<script setup lang="ts">
definePageMeta({
  layout: 'api',
  middleware: ['api-normalize'],
})

const route = useRoute()
const { findPackage, status } = useApiCatalog()

const apiPackageId = route.path.match(/^\/api\/([^/]+)\/([^/]+)/i)?.[1]?.toLowerCase() ?? null
const apiVersionSegment = route.path.match(/^\/api\/([^/]+)\/([^/]+)/i)?.[2] ?? null

if (!apiPackageId || !apiVersionSegment) {
  throw createError({ statusCode: 404, statusMessage: 'API page not found', fatal: true })
}

if (/^v\d+$/i.test(apiVersionSegment) || apiVersionSegment.includes('.')) {
  if (status.value === 'pending') {
    await until(status).toMatch((value) => value === 'success' || value === 'error')
  }
  const packageEntry = findPackage(apiPackageId)
  if (packageEntry) {
    const targetSegment = apiVersionSegment.includes('.')
      ? apiVersionSegment.replace(/\./g, '-')
      : packageEntry.defaultVersionSegment
    await navigateTo(
      route.fullPath.replace(
        `/api/${apiPackageId}/${apiVersionSegment}`,
        `/api/${apiPackageId}/${targetSegment}`,
      ),
      { redirectCode: 301 },
    )
  }
}

const normalizedPath = computed(() => route.path.toLowerCase().replace(/\/$/, ''))

const { data: page } = await useApiPage(normalizedPath)

if (!page.value && import.meta.client) {
  const slug = normalizedPath.value.split('/').pop()?.toLowerCase()
  if (slug) {
    const response = await fetch('/api-meta/slug-index.json')
    if (response.ok) {
      const slugIndex = await response.json() as Record<string, string>
      const canonical = slugIndex[slug]
      if (canonical && canonical !== normalizedPath.value) {
        await navigateTo(`${canonical}${route.hash}`, { replace: true })
      }
    }
  }
}

if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'API page not found',
    message: 'This type is not in the selected package. Open the package overview or pick another package.',
    fatal: true,
  })
}

const pageTitle = computed(() => page.value?.title ?? 'API')
const tocLinks = computed(() => page.value?.tocLinks ?? [])

useSeoMeta({
  title: () => pageTitle.value,
})
</script>

<template>
  <UPage v-if="page">
    <UPageBody>
      <ApiPageContent :html="page.html" />
    </UPageBody>

    <template
      v-if="tocLinks.length"
      #right
    >
      <UContentToc
        title="On this page"
        highlight
        highlight-variant="circuit"
        :links="tocLinks"
      />
    </template>
  </UPage>
</template>
