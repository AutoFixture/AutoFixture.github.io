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
| `/sitemap.xml` | Generated URL list (guides, docs-markdown, API); includes `lastmod` when set |
| `/feed.xml` | Atom feed of guides that declare `updated` |

API markdown is generated into `public/api-markdown` (not Nuxt Content). On API pages, the header shows the package and version from the API catalog.

## Agent assets

`scripts/prepare-agent-assets.mjs` (also `npm run prepare-agent-assets` / `pregenerate`):

1. Mirrors `content/docs/**/*.md` → `public/docs-markdown/` with Nuxt-style paths (numeric prefixes stripped).
2. Writes `public/sitemap.xml` from those guides plus `public/api-meta/routes.json` when present (`lastmod` from frontmatter `updated`).
3. Writes `public/feed.xml` (Atom) for guides that set `updated`.

Committed: `public/llms.txt`, `public/robots.txt`.
Generated (gitignored): `public/docs-markdown/`, `public/sitemap.xml`, `public/feed.xml`.

Keep `llms.txt` in sync when you add major guide sections.

## Article freshness (`updated`)

Set `updated` in page frontmatter to a calendar day (`YYYY-MM-DD`). The docs page shows an "Updated …" line under the header, Open Graph gets `article:modified_time`, the sitemap gets `lastmod`, and the Atom feed includes the article.

```yaml
---
title: Build DSL
description: Use Build, With, Without, and OmitAutoProperties…
updated: 2026-09-08
---
```

Bump `updated` when you make a meaningful content change. Omit it when the day is unknown — the UI simply hides the line.

Sidebar `badge: Updated` stays optional and explicit; it is not derived from `updated`.

## Sidebar badges

Set an optional `badge` in page frontmatter to show a label next to the article in the docs sidebar (desktop and mobile). Badges are explicit — nothing is inferred from dates or git.

String shortcuts:

| Value | Style |
|-------|--------|
| `New` | primary / subtle |
| `Updated` | info / subtle |
| `Preview` | warning / subtle |
| any other string | neutral / outline |

```yaml
---
title: TUnit
badge: New
---
```

Or pass a Nuxt UI badge object for full control:

```yaml
---
title: Example
badge:
  label: Beta
  color: warning
  variant: subtle
---
```
