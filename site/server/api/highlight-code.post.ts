export default defineEventHandler(async (event) => {
  const body = await readBody<{ code?: string, lang?: string }>(event)

  if (!body?.code) {
    throw createError({ statusCode: 400, statusMessage: 'Missing code' })
  }

  return {
    html: await highlightCode(body.code, body.lang ?? 'text'),
  }
})
