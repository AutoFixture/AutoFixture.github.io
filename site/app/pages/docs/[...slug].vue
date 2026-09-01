<script setup lang="ts">
definePageMeta({
  layout: 'docs',
})

const route = useRoute()
const docsPath = computed(() => route.path.replace(/\/$/, '') || '/')

const { data: page } = await useAsyncData(
  () => `docs:${docsPath.value}`,
  () => queryCollection('docs').path(docsPath.value).first(),
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const { data: surround } = await useAsyncData(
  () => `docs:${docsPath.value}-surround`,
  () => queryCollectionItemSurroundings('docs', docsPath.value),
)

usePageSeo({
  title: () => page.value?.title,
  description: () => page.value?.description,
})

const tocLinks = computed(() => page.value?.body?.toc?.links ?? [])
</script>

<template>
  <UPage v-if="page">
    <UPageHeader
      :title="page.title"
      :description="page.description"
    />

    <UPageBody>
      <ContentRenderer
        v-if="page.body"
        :value="page"
      />

      <USeparator
        v-if="surround?.filter(Boolean).length"
        class="my-8"
      />

      <UContentSurround
        v-if="surround?.filter(Boolean).length"
        :surround="surround"
      />
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
