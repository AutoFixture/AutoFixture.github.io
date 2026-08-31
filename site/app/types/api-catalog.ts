export type ApiCatalogVersion = {
  version: string
  versionSegment: string
  line?: string
  isLatest?: boolean
}

export type ApiCatalogPackage = {
  id: string
  name: string
  nugetId?: string
  primary?: boolean
  defaultVersion: string
  defaultVersionSegment: string
  versions: ApiCatalogVersion[]
}

export type ApiCatalog = {
  defaultPath: string
  packages: ApiCatalogPackage[]
}
