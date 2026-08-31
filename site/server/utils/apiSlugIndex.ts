import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

let slugIndexPromise: Promise<Record<string, string>> | null = null

export async function readApiSlugIndex(): Promise<Record<string, string>> {
  if (!slugIndexPromise) {
    slugIndexPromise = readFile(join(process.cwd(), 'public/api-meta/slug-index.json'), 'utf8')
      .then((content) => JSON.parse(content) as Record<string, string>)
      .catch(() => ({}))
  }
  return slugIndexPromise
}
