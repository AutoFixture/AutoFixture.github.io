<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const { data: docsNavigationRaw } = await useAsyncData('docs-navigation', () =>
  queryCollectionNavigation('docs'),
)

/** Collection root ("Docs") is not useful in the sidebar — expose its children as top level. */
const docsNavigation = computed(() => {
  const items = docsNavigationRaw.value ?? []
  if (items.length === 1 && items[0]?.children?.length) {
    return items[0].children
  }
  return items
})

provide('docsNavigation', docsNavigation)

const isApiRoute = computed(() => route.path.startsWith('/api/'))

const { apiPackageId, apiVersion, currentPackage } = useApiContext()
const { navigation: apiNavigation } = useApiNavigation(apiPackageId, apiVersion)
const { files: apiSearchFiles, status: apiSearchStatus } = useApiSearchSections(apiPackageId, apiVersion)

const { data: docsSearchFiles } = useLazyAsyncData(
  'docs-search',
  () => queryCollectionSearchSections('docs', { ignoredTags: ['style'] }),
  { server: false },
)

const searchFiles = computed(() =>
  isApiRoute.value ? (apiSearchFiles.value ?? []) : docsSearchFiles.value,
)

const searchNavigation = computed(() =>
  isApiRoute.value ? apiNavigation.value : docsNavigation.value,
)

const { open: searchOpen } = useContentSearch()

const searchLoading = computed(() =>
  searchOpen.value
  && isApiRoute.value
  && apiSearchStatus.value !== 'success'
  && apiSearchStatus.value !== 'error',
)

const searchPlaceholder = computed(() => {
  if (!isApiRoute.value) return undefined
  const packageName = currentPackage.value?.name ?? 'API'
  return `Search ${packageName} API…`
})

const { defaultApiPath } = useApiCatalog()

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Documentation',
    to: '/docs',
    icon: 'i-lucide-book-open',
    active: route.path.startsWith('/docs'),
  },
  {
    label: 'API',
    to: defaultApiPath(),
    icon: 'i-lucide-code-xml',
    active: route.path.startsWith('/api'),
  },
])

const menuOpen = ref(false)

const mobileItems = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Documentation',
    to: '/docs',
    icon: 'i-lucide-book-open',
    active: route.path.startsWith('/docs'),
  },
  {
    label: 'API',
    to: defaultApiPath(),
    icon: 'i-lucide-code-xml',
    active: route.path.startsWith('/api'),
  },
  {
    label: 'GitHub',
    to: 'https://github.com/AutoFixture',
    icon: 'i-lucide-github',
    target: '_blank',
  },
])

const mobileDocsNav = computed(
  () => docsNavigation.value as ContentNavigationItem[],
)
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator color="var(--ui-primary)" />

    <ClientOnly>
      <LazyUContentSearch
        :files="searchFiles"
        :navigation="searchNavigation"
        :placeholder="searchPlaceholder"
        :loading="searchLoading"
        :fuse="{ resultLimit: 42 }"
        shortcut="meta_k"
      />
    </ClientOnly>

    <UHeader
      v-model:open="menuOpen"
      title="AutoFixture"
    >
      <template #title>
        <AppLogo
          v-if="menuOpen"
          mark-only
        />
        <AppLogo
          v-else
          class="hidden lg:inline-flex"
        />
        <AppLogo
          v-if="!menuOpen"
          mark-only
          class="lg:hidden"
        />
      </template>

      <UNavigationMenu :items="items" />

      <template #right>
        <UContentSearchButton class="lg:hidden" />

        <UContentSearchButton
          :collapsed="false"
          class="hidden lg:flex"
        />

        <UColorModeButton />

        <UButton
          color="neutral"
          variant="ghost"
          to="https://github.com/AutoFixture"
          target="_blank"
          icon="i-lucide-github"
          aria-label="GitHub"
          class="hidden sm:inline-flex"
        />
      </template>

      <template #body>
        <UNavigationMenu
          :items="mobileItems"
          orientation="vertical"
          class="-mx-2.5"
        />

        <USeparator
          v-if="route.path.startsWith('/docs') && mobileDocsNav.length"
          class="my-4"
        />

        <UContentNavigation
          v-if="route.path.startsWith('/docs') && mobileDocsNav.length"
          :navigation="mobileDocsNav"
          highlight
        />
      </template>
    </UHeader>

    <UMain>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          Copyright © 2026 ·
          <a
            href="https://github.com/AutoFixture/AutoFixture/blob/master/LICENCE.txt"
            target="_blank"
            rel="noopener noreferrer"
            class="text-muted underline-offset-2 hover:underline"
          >
            MIT License
          </a>
        </p>
      </template>
      <template #right>
        <UButton
          to="https://github.com/AutoFixture"
          target="_blank"
          color="neutral"
          variant="ghost"
          icon="i-lucide-github"
          aria-label="GitHub"
        />
      </template>
    </UFooter>
  </UApp>
</template>
