<script setup lang="ts">
const props = defineProps({
  markOnly: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <svg
    v-if="props.markOnly"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    fill="none"
    role="img"
    aria-label="AutoFixture"
    class="h-6 w-6 shrink-0"
  >
    <path
      fill="var(--ui-primary)"
      d="M18.5 0L29.5 0 36 17 24 17 20 27 26.5 27.25 23 38.25 16 38.25 12 48 0 48 18.5 0Z"
    />
    <path
      fill="currentColor"
      d="M25.5 19L36.75 19 48 48 28.5 48 25.25 38.25 32 38.25Z"
    />
  </svg>
  <svg
    v-else
    xmlns="http://www.w3.org/2000/svg"
    width="285"
    height="48"
    viewBox="0 0 285 48"
    fill="none"
    role="img"
    aria-label="AutoFixture"
    class="h-6 w-auto shrink-0"
  >
    <g transform="translate(0 6) scale(0.75)">
      <path
        fill="var(--ui-primary)"
        d="M18.5 0L29.5 0 36 17 24 17 20 27 26.5 27.25 23 38.25 16 38.25 12 48 0 48 18.5 0Z"
      />
      <path
        fill="currentColor"
        d="M25.5 19L36.75 19 48 48 28.5 48 25.25 38.25 32 38.25Z"
      />
    </g>
    <text
      x="48"
      y="42"
      dominant-baseline="alphabetic"
      font-family="Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
      font-size="40"
      font-weight="700"
      letter-spacing="-0.03em"
    >
      <tspan fill="currentColor">Auto</tspan><tspan fill="var(--ui-primary)">Fixture</tspan>
    </text>
  </svg>
</template>
