import { readFile } from 'node:fs/promises'
import type { ApiPageMeta, ApiRenderResponse } from '~/types/api-page'
import { apiMarkdownFile, apiPageMetaFile, parseApiRoutePath } from './apiPaths'
import { renderApiMarkdown } from './renderApiMarkdown'

export async function loadApiPage(path: string): Promise<ApiRenderResponse | null> {
  const parsed = parseApiRoutePath(path)
  if (!parsed) return null

  const { packageId, versionSegment, slug, pagePath } = parsed

  let markdown: string
  let meta: ApiPageMeta

  try {
    markdown = await readFile(apiMarkdownFile(packageId, versionSegment, slug), 'utf8')
    meta = JSON.parse(await readFile(apiPageMetaFile(packageId, versionSegment, slug), 'utf8')) as ApiPageMeta
  } catch {
    return null
  }

  if (meta.path !== pagePath) return null

  const html = await renderApiMarkdown(markdown)

  return {
    ...meta,
    html,
  }
}
