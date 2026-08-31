<script setup lang="ts">
const { currentPackage, apiVersion, navigateToVersion } = useApiContext()

const items = computed(() =>
  (currentPackage.value?.versions ?? []).map((entry) => ({
    label: entry.isLatest ? `${entry.version} (latest)` : entry.version,
    value: entry.versionSegment,
  })),
)

function resolveVersionSegment(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'value' in value) {
    const segment = (value as { value?: unknown }).value
    return typeof segment === 'string' ? segment : undefined
  }
  return undefined
}

const selectedVersion = computed({
  get: () => apiVersion.value ?? undefined,
  set: (value: unknown) => {
    const versionSegment = resolveVersionSegment(value)
    if (!versionSegment || versionSegment === apiVersion.value) return
    navigateToVersion(versionSegment)
  },
})
</script>

<template>
  <UFormField label="Version">
    <USelectMenu
      v-model="selectedVersion"
      :items="items"
      value-key="value"
      label-key="label"
      :disabled="!items.length"
      placeholder="Select version"
      class="w-full"
    />
  </UFormField>
</template>
