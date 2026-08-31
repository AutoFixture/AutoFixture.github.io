import { existsSync } from 'node:fs'
import { apiMarkdownFile, parseApiRoutePath } from '../utils/apiPaths'
import { readApiSlugIndex } from '../utils/apiSlugIndex'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const path = url.pathname.toLowerCase().replace(/\/$/, '')
  const parsed = parseApiRoutePath(path)

  if (!parsed || parsed.slug === 'index') return

  if (existsSync(apiMarkdownFile(parsed.packageId, parsed.versionSegment, parsed.slug))) {
    return
  }

  const slugIndex = await readApiSlugIndex()
  const canonical = slugIndex[parsed.slug]

  if (!canonical || canonical === path) return

  return sendRedirect(event, `${canonical}${url.hash}`, 302)
})
