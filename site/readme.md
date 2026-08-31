# Site

Nuxt Content app for AutoFixture docs.

## Setup

```bash
just site-install
just prepare-api    # generate + copy API markdown into content/api
just site-dev
```

## Routes

| Path | Content |
|------|---------|
| `/` | Home |
| `/docs/**` | Guides (Getting Started section; docs layout) |
| `/api/{package}/{line}/**` | Generated API reference |

On API pages, the header banner shows the docs line (`v5`) and the concrete package version from `index.md` frontmatter.
