# Site

Nuxt Content app for AutoFixture docs.

## Setup

```bash
just site-install
just prepare-api    # generate + copy API markdown into public/api-markdown
just site-dev
```

## Routes

| Path | Content |
|------|---------|
| `/` | Home |
| `/docs/**` | Guides (Get started section; docs layout) |
| `/api/{package}/{version}/**` | Generated API reference |

API markdown is generated into `public/api-markdown` (not Nuxt Content). On API pages, the header shows the package and version from the API catalog.
