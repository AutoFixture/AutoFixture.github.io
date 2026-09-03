<script setup lang="ts">
const { repoUrl, formattedStarCount } = useGitHubStars()

const accessibleLabel = computed(() => {
  if (!formattedStarCount.value) return 'GitHub'
  return `GitHub, ${formattedStarCount.value} stars`
})
</script>

<template>
  <UButton
    color="neutral"
    variant="ghost"
    :to="repoUrl"
    target="_blank"
    icon="i-lucide-github"
    :aria-label="accessibleLabel"
    class="tabular-nums"
  >
    {{ formattedStarCount }}
  </UButton>
</template>
