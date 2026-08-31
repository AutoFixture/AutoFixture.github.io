<script setup lang="ts">
const props = withDefaults(defineProps<{
  code: string
  lang?: string
  label?: string
}>(), {
  lang: 'text',
})

const { data } = await useAsyncData(
  () => `landing-code-${props.lang}-${props.code}`,
  () => $fetch<{ html: string }>('/api/highlight-code', {
    method: 'POST',
    body: { code: props.code, lang: props.lang },
  }),
)
</script>

<template>
  <div class="landing-code overflow-hidden rounded-lg border border-default bg-muted/40 text-left">
    <div
      v-if="label"
      class="border-b border-default px-4 py-2 text-xs font-medium text-muted"
    >
      {{ label }}
    </div>
    <div
      v-if="data?.html"
      class="landing-code__body"
      v-html="data.html"
    />
  </div>
</template>
