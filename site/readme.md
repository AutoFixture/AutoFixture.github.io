# Site

Nuxt Content app for AutoFixture docs.

## Setup

```bash
just site-install
just prepare-api    # generate + copy API markdown into public/api-markdown
just site-dev
```

For a production-like static build, run `prepare-api` before `generate` so API routes are included in the sitemap:

```bash
just prepare-api
just site-generate   # runs prepare-agent-assets, then nuxt generate
```

## Routes

| Path | Content |
|------|---------|
| `/` | Home |
| `/docs/**` | Guides (docs layout) |
| `/docs-markdown/**` | Same guides as raw markdown (for LLM agents; generated at build) |
| `/api/{package}/{version}/**` | Generated API reference |
| `/api-markdown/**` | Raw API markdown (generated; not committed) |
| `/llms.txt` | Agent discovery index |
| `/robots.txt` | Crawler rules + sitemap pointer |
| `/sitemap.xml` | Generated URL list (guides, docs-markdown, API) |

API markdown is generated into `public/api-markdown` (not Nuxt Content). On API pages, the header shows the package and version from the API catalog.

## Agent assets

`scripts/prepare-agent-assets.mjs` (also `npm run prepare-agent-assets` / `pregenerate`):

1. Mirrors `content/docs/**/*.md` → `public/docs-markdown/` with Nuxt-style paths (numeric prefixes stripped).
2. Writes `public/sitemap.xml` from those guides plus `public/api-meta/routes.json` when present.

Committed: `public/llms.txt`, `public/robots.txt`.  
Generated (gitignored): `public/docs-markdown/`, `public/sitemap.xml`.

Keep `llms.txt` in sync when you add major guide sections.
