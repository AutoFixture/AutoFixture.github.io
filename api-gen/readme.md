# API markdown generator

Uses DocFX `metadata` with `outputFormat: markdown` against NuGet package assemblies. All automation is Node.js (`api-gen/run.mjs`).

## Prerequisites

- [.NET SDK](https://dotnet.microsoft.com/download) (for DocFX)
- [DocFX](https://dotnet.github.io/docfx/): `dotnet tool install -g docfx`
- Node.js
- [just](https://github.com/casey/just#installation) (optional wrapper)

On **Linux/WSL**, dotnet global tools are not always on `PATH`. Add this to `~/.bashrc`:

```bash
export PATH="$PATH:$HOME/.dotnet/tools"
```

Then verify: `docfx --version`

## Commands (from repo root)

```bash
node api-gen/run.mjs prepare   # generate + sync into site/public/
just prepare-api               # same via just
just clean-api                 # delete generated output and NuGet cache
```

Output layout after sync:

| Path | Contents |
|------|----------|
| `site/public/api-markdown/{packageId}/{version}/` | Raw DocFX markdown (`.md`) |
| `site/public/api-meta/{packageId}/{version}/` | `toc.json`, `search.json`, `pages/{slug}.json` |
| `site/public/api-meta/routes.json` | All API routes for prerender |
| `site/public/api-catalog.json` | Package/version picker data |

Configure packages in `api-gen/packages.json`. Each entry is one package version (same `id` groups versions in the UI). Generated routes use `/api/{packageId}/{versionSegment}/...`.

Packages are downloaded from nuget.org into `api-gen/packages-cache/` and DocFX reads the `.dll` plus companion `.xml` documentation file from the chosen target framework folder.

Required fields per package:

| Field | Purpose |
|-------|---------|
| `id` | URL slug |
| `name` | Display name |
| `nugetId` | NuGet package id (defaults to `name`) |
| `version` | Pinned NuGet version |
| `line` | UI grouping (`v4` / `v5`) |
| `targetFramework` | TFM folder under `lib/` (for example `netstandard2.0`, `net8.0`, `net452`) |
| `assemblyName` | Optional when the DLL name differs from the NuGet id |

Currently generated packages (URL slug → NuGet name):

| Slug | NuGet package | v5 | v4 |
|------|---------------|----|----|
| `autofixture` | AutoFixture | yes | yes |
| `xunit3` | AutoFixture.Xunit3 | yes | — |
| `nunit4` | AutoFixture.NUnit4 | yes | — |
| `xunit` | AutoFixture.xUnit | — | yes |
| `xunit2` | AutoFixture.xUnit2 | — | yes |
| `nunit2` | AutoFixture.NUnit2 | — | yes |
| `nunit3` | AutoFixture.NUnit3 | — | yes |
| `automoq` | AutoFixture.AutoMoq | yes | yes |
| `autonsubstitute` | AutoFixture.AutoNSubstitute | yes | yes |
| `autofakeiteasy` | AutoFixture.AutoFakeItEasy | yes | yes |
| `seedextensions` | AutoFixture.SeedExtensions | yes | yes |
| `idioms` | AutoFixture.Idioms | yes | yes |
| `idioms-fscheck` | AutoFixture.Idioms.FsCheck | — | yes |
| `autofoq` | AutoFixture.AutoFoq | — | yes |
| `autorhinomocks` | AutoFixture.AutoRhinoMocks | — | yes |

v5 is pinned to `5.0.0-rc.1`; v4 is pinned to `4.18.1`.
