/** Strip trailing slashes (GitHub Pages directory URLs) and normalize API casing. */
export default defineNuxtRouteMiddleware((to) => {
  let normalized = to.path

  if (normalized.startsWith('/api/')) {
    normalized = normalized.toLowerCase()
  }

  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }

  if (normalized === to.path) return

  return navigateTo(
    { path: normalized, hash: to.hash, query: to.query },
    { replace: true },
  )
})
