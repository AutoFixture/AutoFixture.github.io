import { loadApiPage } from '../utils/loadApiPage'

export default defineEventHandler(async (event) => {
  const path = String(getQuery(event).path || '')
  const page = await loadApiPage(path)

  if (!page) {
    throw createError({ statusCode: 404, statusMessage: 'API page not found' })
  }

  return page
})
