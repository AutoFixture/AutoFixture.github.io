export type ApiPageTocLink = {
  id: string
  text: string
  depth: number
  children?: ApiPageTocLink[]
}

export type ApiPageMeta = {
  path: string
  title: string
  tocLinks: ApiPageTocLink[]
}

export type ApiSearchSection = {
  id: string
  title: string
  content: string
  titles: string[]
  level: number
}

export type ApiRenderResponse = ApiPageMeta & {
  html: string
}
