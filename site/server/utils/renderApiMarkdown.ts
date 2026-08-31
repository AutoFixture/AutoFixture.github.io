import MarkdownIt from 'markdown-it'
import { getCodeHighlighter, normalizeLang, SHIKI_THEMES } from './highlightCode'

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/\\([\\`*_{}[\]()#+\-.!])/g, '$1')
    .trim()
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function headingId(content: string) {
  const idMatch = content.match(/<a\s+id="([^"]+)"/i)
  if (idMatch?.[1]) return idMatch[1]
  const text = stripHtml(content)
  return text ? slugify(text) : ''
}

function configureHeadingIds(md: MarkdownIt) {
  const defaultHeadingOpen = md.renderer.rules.heading_open

  md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]!
    const inlineToken = tokens[idx + 1]

    if (inlineToken?.type === 'inline') {
      const id = headingId(inlineToken.content)
      if (id) {
        token.attrSet('id', id)
      }
    }

    return defaultHeadingOpen
      ? defaultHeadingOpen(tokens, idx, options, env, self)
      : self.renderToken(tokens, idx, options)
  }
}

function normalizeHeadingAnchors(html: string) {
  return html.replace(
    /<(h[1-6])\s+id="([^"]+)">\s*<a\s+id="\2"><\/a>\s*/gi,
    '<$1 id="$2">',
  )
}

function stripFrontmatter(markdown: string) {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
}

export async function renderApiMarkdown(markdown: string) {
  const highlighter = await getCodeHighlighter()
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: false,
  })

  configureHeadingIds(md)

  md.renderer.rules.fence = (tokens, idx) => {
    const token = tokens[idx]!
    const lang = normalizeLang(token.info || 'text')
    const code = token.content.replace(/\n$/, '')
    const html = highlighter.codeToHtml(code, {
      lang,
      themes: { ...SHIKI_THEMES },
      defaultColor: false,
    })

    return `<div class="api-code-block">${html}</div>`
  }

  md.renderer.rules.table_open = () => '<div class="api-table-wrap"><table>'
  md.renderer.rules.table_close = () => '</table></div>'

  return normalizeHeadingAnchors(md.render(stripFrontmatter(markdown)))
}
