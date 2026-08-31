import { createHighlighter, type Highlighter } from 'shiki'

const SHIKI_LIGHT_THEME = 'light-plus'
const SHIKI_DARK_THEME = 'dark-plus'

const LANGS = ['csharp', 'json', 'js', 'ts', 'html', 'css', 'vue', 'shell', 'bash', 'xml', 'yaml', 'md', 'text'] as const

let highlighterPromise: Promise<Highlighter> | null = null

async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [SHIKI_LIGHT_THEME, SHIKI_DARK_THEME],
      langs: [...LANGS],
    })
  }
  return highlighterPromise
}

function normalizeLang(lang: string) {
  const value = lang.trim().toLowerCase()
  if (value === 'cs') return 'csharp'
  if (value === 'csproj') return 'xml'
  return LANGS.includes(value as typeof LANGS[number]) ? value : 'text'
}

export async function getCodeHighlighter() {
  return getHighlighter()
}

export { normalizeLang }

export async function highlightCode(code: string, lang = 'text') {
  const highlighter = await getHighlighter()
  return highlighter.codeToHtml(code.trimEnd(), {
    lang: normalizeLang(lang),
    themes: {
      light: SHIKI_LIGHT_THEME,
      dark: SHIKI_DARK_THEME,
    },
  })
}
