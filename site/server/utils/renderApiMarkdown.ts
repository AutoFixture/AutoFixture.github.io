import MarkdownIt from 'markdown-it'
import { getCodeHighlighter, normalizeLang, SHIKI_THEMES } from './highlightCode'

/** Private-use placeholders so markdown-it html_inline does not eat C# generics. */
const LT = '\uE000'
const GT = '\uE001'

const HTML_TAG_RE =
  /^<\/?(?:a|abbr|b|br|code|div|em|h[1-6]|hr|i|img|li|ol|p|pre|span|strong|sub|sup|table|tbody|td|th|thead|tr|ul)(?:\s[\s\S]*)?>$/i

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

/** DocFX escapes >, (, ) in signatures; undo so generics read as Create<T>(). */
export function unescapeDocFxMarkdown(markdown: string) {
  return markdown
    .replace(/\\>/g, '>')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
}

/**
 * Keep DocFX / intentional HTML tags; rewrite C# generics like Create&lt;T&gt;()
 * so markdown-it with html:true does not treat them as tags.
 * Fenced and inline code are left untouched for Shiki / default code rendering.
 */
export function protectNonHtmlAngleBrackets(markdown: string) {
  const slots: string[] = []
  const park = (match: string) => {
    const index = slots.length
    slots.push(match)
    return `\0SLOT${index}\0`
  }

  let text = markdown.replace(/```[\s\S]*?```/g, park)
  text = text.replace(/`[^`\n]+`/g, park)

  text = text.replace(/<[^>\n]+>/g, (match) => {
    if (HTML_TAG_RE.test(match)) return match
    return match.replaceAll('<', LT).replaceAll('>', GT)
  })

  return text.replace(/\0SLOT(\d+)\0/g, (_, index: string) => slots[Number(index)]!)
}

export function restoreProtectedAngleBrackets(html: string) {
  return html.replaceAll(LT, '&lt;').replaceAll(GT, '&gt;')
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

  const prepared = protectNonHtmlAngleBrackets(
    unescapeDocFxMarkdown(stripFrontmatter(markdown)),
  )
  const html = md.render(prepared)
  return restoreProtectedAngleBrackets(normalizeHeadingAnchors(html))
}
