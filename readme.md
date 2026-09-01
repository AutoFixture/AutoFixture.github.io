# AutoFixture documentation

Nuxt Content site for guides + DocFX-generated API reference rendered outside Nuxt Content.

| Folder | Purpose |
|--------|---------|
| `api-gen/` | DocFX metadata → markdown and search/nav artifacts |
| `site/` | Nuxt app (docs in Content; API from static markdown + server render) |

## Generate API markdown

```bash
node api-gen/run.mjs prepare   # generate + copy into site/public/api-markdown and api-meta
just site-install
just site-dev                  # start dev server (stop it first if you just ran prepare)
```

Or via just: `just prepare-api`

API content is generated locally and not committed. Run `prepare` before starting the dev server.

For a full static build, run `prepare-api` before `site-generate` so the agent sitemap includes API routes. See [site/readme.md](./site/readme.md) for `/llms.txt`, docs-markdown mirroring, and sitemap details.

Needs [DocFX](https://dotnet.github.io/docfx/), [Node.js](https://nodejs.org/), and optionally [just](https://github.com/casey/just#installation).

## CI / deploy

- **CI** (PRs to `master`): build only — `.github/workflows/ci.yml`
- **Deploy** (push to `master` or manual): build + GitHub Pages — `.github/workflows/deploy.yml`

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full runbook (Pages setup, rollback, DNS, troubleshooting).

Custom domain: `site/public/CNAME` → `autofixture.com`.
