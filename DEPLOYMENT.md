# Deployment runbook

How we build and publish https://autofixture.com from this repo using **GitHub Pages + GitHub Actions** (Option A).

## Architecture (short)

| Stage | What happens |
|-------|----------------|
| API gen | `node api-gen/run.mjs prepare` downloads pinned NuGet packages, runs DocFX, writes markdown + meta into `site/public/` (not committed) |
| Site | `npm run generate` in `site/` prerenders docs + API routes to `site/.output/public` |
| Host | `actions/upload-pages-artifact` + `actions/deploy-pages` publish that folder |

Custom domain: `site/public/CNAME` → `autofixture.com` (must be in the uploaded artifact root).

## Workflows

| Workflow | File | When | Purpose |
|----------|------|------|---------|
| **CI** | `.github/workflows/ci.yml` | Pull requests to `master` | Same build as production; no deploy |
| **Deploy** | `.github/workflows/deploy.yml` | Push to `master`, or manual `workflow_dispatch` | Build + publish to Pages |

Shared build steps live in `.github/actions/build-site/`.

## One-time repo setup

Do this once (org admin / repo admin):

1. Open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions** (not “Deploy from a branch”).
3. Confirm custom domain is **`autofixture.com`** (already set in Pages; keep `CNAME` files in sync).
4. After the first successful Actions deploy and DNS is correct, enable **Enforce HTTPS**.
5. Optional: under **Environments → github-pages**, require reviewers if you want a human gate before production publishes.

No deploy secrets are required for public NuGet + public Pages.

## Everyday deploy

1. Open a PR → **CI** must pass (build only).
2. Merge to **`master`** → **Deploy** runs automatically.
3. Check the Actions run, then open https://autofixture.com (or the `page_url` from the deploy job).

Manual republish (same commit, no code change):

```bash
gh workflow run Deploy --repo AutoFixture/AutoFixture.github.io
```

Or: Actions → **Deploy** → **Run workflow**.

## Local parity

Approximate what CI does:

```bash
# Needs: Node 22+, .NET SDK 8+, DocFX (`dotnet tool install -g docfx`)
node api-gen/run.mjs prepare
npm ci --prefix site
npm run generate --prefix site
# Static output: site/.output/public
```

Or with just:

```bash
just prepare-api
just site-install
just site-generate
```

Preview the static output:

```bash
npx --prefix site serve site/.output/public
```

## Rollback

GitHub Pages keeps recent deployments. Options:

1. **Re-run** a previous successful **Deploy** workflow run (Actions → that run → Re-run all jobs), if the commit still matches what you want.
2. **Revert** the bad commit on `master` and push (triggers a new good deploy).
3. Checkout an older commit and use **workflow_dispatch** only if you temporarily point the workflow at that ref (prefer revert for clarity).

## Updating API package versions

Versions are pinned in `api-gen/packages.json`. To refresh API docs after a NuGet release:

1. Edit versions in `api-gen/packages.json`.
2. Run `node api-gen/run.mjs prepare` locally and spot-check.
3. PR → merge → Deploy regenerates API in CI (no generated files in git).

## DNS / domain notes

- **Canonical:** `autofixture.com` → GitHub Pages (`A`/`AAAA` + `www` CNAME to `autofixture.github.io`).
- **Aliases:** `autofixture.io`, `.net`, `.org` → permanent redirect to `https://autofixture.com/` (Namecheap URL Redirect is HTTP-only; HTTPS redirects planned via Cloudflare DNS later).
- One custom domain per Pages site. Keep both `CNAME` (repo root) and `site/public/CNAME` equal to `autofixture.com` so Actions deploys do not overwrite Pages back to an old domain.

## Troubleshooting

| Symptom | Likely cause | What to try |
|---------|--------------|-------------|
| Deploy fails: Pages source | Still on “Deploy from a branch” | Switch Source to **GitHub Actions** |
| 403 on deploy | Missing `pages: write` / `id-token: write` | Check `deploy.yml` permissions |
| Missing / wrong domain | `CNAME` not in artifact or still `.io` | Ensure `site/public/CNAME` is `autofixture.com` |
| DocFX not found | Tool not on PATH | Composite action installs DocFX and adds `~/.dotnet/tools` |
| Slow builds | Cold NuGet cache | Wait for `api-gen/packages-cache` cache hit on next run |
| API page empty after client nav | Server route not available on static host | Prefer full page load / prerendered routes; open an issue if a route was not prerendered |
| HTTPS cert pending | New custom domain | Wait for Let’s Encrypt; then Enforce HTTPS |

## Go-live checklist (first Actions deploy)

- [ ] Pages source set to **GitHub Actions**
- [ ] Pages custom domain is **`autofixture.com`** + Enforce HTTPS
- [ ] `CNAME` and `site/public/CNAME` are `autofixture.com`
- [ ] PR CI green on a test PR
- [ ] Merge to `master` (or `workflow_dispatch`) succeeds
- [ ] https://autofixture.com serves the Nuxt site (not the old Jekyll site)
- [ ] Spot-check `/docs/...` and a few `/api/...` deep links
- [ ] Confirm `.io` / `.net` / `.org` redirect to `.com` (HTTPS via Cloudflare later if needed)
