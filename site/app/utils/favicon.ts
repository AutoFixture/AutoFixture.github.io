export const FAVICON_VERSION = '2'

export type FaviconColorScheme = 'light' | 'dark'

export function faviconHref(colorScheme: FaviconColorScheme) {
  const fileName = colorScheme === 'dark' ? 'favicon-dark.svg' : 'favicon-light.svg'
  return `/${fileName}?v=${FAVICON_VERSION}`
}
