export default defineNuxtPlugin(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const prefersDark = ref(media.matches)

  function syncPrefersDark(event?: MediaQueryListEvent) {
    prefersDark.value = event?.matches ?? media.matches
  }

  media.addEventListener('change', syncPrefersDark)

  useHead({
    link: computed(() => [
      {
        key: 'app-favicon',
        rel: 'icon',
        type: 'image/svg+xml',
        href: faviconHref(prefersDark.value ? 'dark' : 'light'),
      },
    ]),
  })
})
