import { createHighlighter, type Highlighter } from 'shiki'

/** Same theme keys as Nuxt Content / @nuxtjs/mdc (defaultColor: false). */
export const SHIKI_THEME_LIGHT = 'light-plus'
export const SHIKI_THEME_DARK = 'dark-plus'

export const SHIKI_THEMES = {
  // Include `light` so we override Nuxt UI's MDC default (material-theme-lighter).
  light: SHIKI_THEME_LIGHT,
  default: SHIKI_THEME_LIGHT,
  dark: SHIKI_THEME_DARK,
} as const

export const SHIKI_LANGS = [
  'csharp',
  'json',
  'js',
  'ts',
  'html',
  'css',
  'vue',
  'shell',
  'bash',
  'xml',
  'yaml',
  'md',
  'text',
] as const

export type ShikiLang = (typeof SHIKI_LANGS)[number]

let highlighterPromise: Promise<Highlighter> | null = null

async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [SHIKI_THEME_LIGHT, SHIKI_THEME_DARK],
      langs: [...SHIKI_LANGS],
    })
  }
  return highlighterPromise
}

export function normalizeLang(lang: string): ShikiLang {
  const value = lang.trim().toLowerCase()
  if (value === 'cs') return 'csharp'
  if (value === 'csproj') return 'xml'
  return SHIKI_LANGS.includes(value as ShikiLang) ? (value as ShikiLang) : 'text'
}

export async function getCodeHighlighter() {
  return getHighlighter()
}

export async function highlightCode(code: string, lang = 'text') {
  const highlighter = await getHighlighter()
  return highlighter.codeToHtml(code.trimEnd(), {
    lang: normalizeLang(lang),
    themes: { ...SHIKI_THEMES },
    defaultColor: false,
  })
}
