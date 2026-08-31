<script setup lang="ts">
const { packages, status } = useApiCatalog()
const { apiPackageId, navigateToPackage } = useApiContext()

const items = computed(() =>
  packages.value.map((entry) => ({
    label: entry.name,
    value: entry.id,
  })),
)

const selectedPackageId = computed({
  get: () => apiPackageId.value ?? undefined,
  set: (packageId: string | undefined) => {
    if (!packageId || packageId === apiPackageId.value) return
    navigateToPackage(packageId)
  },
})
</script>

<template>
  <UFormField label="Package">
    <USelectMenu
      v-model="selectedPackageId"
      :items="items"
      value-key="value"
      label-key="label"
      :loading="status === 'pending'"
      :disabled="!items.length"
      placeholder="Select package"
      class="w-full"
    />
  </UFormField>
</template>
