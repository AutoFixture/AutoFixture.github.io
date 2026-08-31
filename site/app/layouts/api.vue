<script setup lang="ts">
const { apiPackageId, apiVersion } = useApiContext()
const { navigation } = useApiNavigation(apiPackageId, apiVersion)
const { hasMultiplePackages } = useApiCatalog()
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

          <div class="mb-4 space-y-3">
            <ApiPackageSelect v-if="hasMultiplePackages" />
            <ApiVersionSelect />
          </div>

          <p class="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
            API
          </p>

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
