# AutoFixture documentation tasks
# Install: https://github.com/casey/just#installation

# List available recipes
default:
    @just --list

# Generate API markdown from configured packages
generate-api:
    node api-gen/run.mjs generate

# Copy generated API markdown into site/public/api-markdown
sync-api:
    node api-gen/run.mjs sync

# Generate API markdown and sync into site/public
prepare-api:
    node api-gen/run.mjs prepare

# Rewrite API markdown links and emit toc.json (safe to re-run on existing out/)
postprocess-api:
    node api-gen/run.mjs postprocess

# Install site dependencies
site-install:
    npm install --prefix site

# Run the Nuxt dev server
site-dev:
    npm run dev --prefix site

# Statically generate the site (same as CI; run prepare-api first)
site-generate:
    npm run generate --prefix site

# Prepare API docs and generate the static site (CI parity)
site-build: prepare-api site-install site-generate

# Remove generated markdown and cached NuGet packages
clean-api:
    node api-gen/run.mjs clean
