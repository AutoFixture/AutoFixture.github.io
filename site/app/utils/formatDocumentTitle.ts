const SITE_NAME = 'AutoFixture'

export function formatDocumentTitle(pageTitle?: string | null): string {
  if (!pageTitle || pageTitle === SITE_NAME) return SITE_NAME
  return `${pageTitle} · ${SITE_NAME}`
}
