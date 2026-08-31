export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/api/')) return

  const normalized = to.path.toLowerCase().replace(/\/$/, '')
  if (to.path === normalized) return

  return navigateTo(
    { path: normalized, hash: to.hash, query: to.query },
    { replace: true },
  )
})
