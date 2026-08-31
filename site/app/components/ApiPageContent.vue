<script setup lang="ts">
const props = defineProps<{
  html: string
}>()

const route = useRoute()
const articleRef = ref<HTMLElement | null>(null)

function scrollToHash() {
  const hash = route.hash
  if (!hash || !articleRef.value) return

  const id = decodeURIComponent(hash.slice(1))
  const target = articleRef.value.querySelector<HTMLElement>(`#${CSS.escape(id)}`)
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

watch(() => route.hash, () => nextTick(scrollToHash))
watch(() => props.html, () => nextTick(scrollToHash))

onMounted(() => nextTick(scrollToHash))
</script>

<template>
  <article
    ref="articleRef"
    class="prose-api"
    v-html="html"
  />
</template>
