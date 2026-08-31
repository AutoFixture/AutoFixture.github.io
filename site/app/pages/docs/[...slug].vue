<script setup lang="ts">
definePageMeta({
  layout: 'docs',
})

const route = useRoute()

const { data: page } = await useAsyncData(route.path, () =>
  queryCollection('docs').path(route.path).first(),
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const { data: surround } = await useAsyncData(`${route.path}-surround`, () =>
  queryCollectionItemSurroundings('docs', route.path),
)

useSeoMeta({
  title: page.value.title,
  description: page.value.description,
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
