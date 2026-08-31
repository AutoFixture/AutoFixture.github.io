<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const navigation = inject<Ref<ContentNavigationItem[] | undefined> | ComputedRef<ContentNavigationItem[]>>(
  'docsNavigation',
  ref([]),
)
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UPageAside>
          <UContentSearchButton
            :collapsed="false"
            class="mb-4 w-full"
          />

          <UContentNavigation
            :navigation="navigation"
            highlight
          />
        </UPageAside>
      </template>

      <slot />
    </UPage>
  </UContainer>
</template>
