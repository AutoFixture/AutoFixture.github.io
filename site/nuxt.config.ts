import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function readDefaultApiPath() {
  try {
    const catalogPath = join(process.cwd(), 'public/api-catalog.json')
    const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as { defaultPath?: string }
    return catalog.defaultPath ?? '/api/autofixture/5-0-0-rc-1'
  } catch {
    return '/api/autofixture/5-0-0-rc-1'
  }
}

function readApiPrerenderRoutes() {
  try {
    const routesPath = join(process.cwd(), 'public/api-meta/routes.json')
    return JSON.parse(readFileSync(routesPath, 'utf8')) as string[]
  } catch {
    return []
  }
}

export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxt/fonts',
  ],
  css: ['~/assets/css/main.css'],
  fonts: {
    families: [
      { name: 'Public Sans', provider: 'google', weights: [400, 500, 600, 700] },
      { name: 'Plus Jakarta Sans', provider: 'google', weights: [600, 700] },
    ],
  },
  app: {
    head: {
      title: 'AutoFixture',
      meta: [
        {
          name: 'description',
          content: 'AutoFixture makes unit tests more productive by creating anonymous test data for .NET.',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
    },
  },
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', ...readApiPrerenderRoutes()],
    },
  },
  routeRules: {
    '/docs': { redirect: '/docs/get-started/introduction' },
    '/docs/get-started': { redirect: '/docs/get-started/introduction' },
    '/docs/integrations': { redirect: '/docs/integrations/overview' },
    '/docs/integrations/custom-autodata-attribute': { redirect: '/docs/integrations/xunit3#custom-autodata-attribute' },
    '/docs/advanced': { redirect: '/docs/advanced/overview' },
    '/docs/fundamentals/specimen-pipeline': { redirect: '/docs/advanced/specimen-pipeline' },
    '/docs/fundamentals/specimen-builder-graphs': { redirect: '/docs/advanced/specimen-builders-and-specifications' },
    '/docs/extensions/kernel': { redirect: '/docs/advanced/specimen-builders-and-specifications' },
    '/docs/advanced/kernel': { redirect: '/docs/advanced/specimen-builders-and-specifications' },
    '/docs/fundamentals/stable-vs-random': { redirect: '/docs/fundamentals/customizations' },
    '/docs/how-to/arrays-lists': { redirect: '/docs/how-to/collections' },
    '/docs/how-to/set-property': { redirect: '/docs/fundamentals/build-dsl' },
    '/docs/how-to/exclude-property': { redirect: '/docs/fundamentals/build-dsl' },
    '/docs/how-to/commerce-graphs': { redirect: '/docs/how-to/collections' },
    '/docs/how-to/create-many': { redirect: '/docs/how-to/collections#createmany' },
    '/docs/how-to/choose-constructor': { redirect: '/docs/fundamentals/customizations' },
    '/docs/how-to/fixture-subclass': { redirect: '/docs/fundamentals/customizations-catalog' },
    '/docs/how-to/value-objects': { redirect: '/docs/fundamentals/fixture-and-create' },
    '/docs/intro': { redirect: '/docs/get-started/introduction' },
    '/api': { redirect: readDefaultApiPath() },
    '/api/autofixture-xunit3/**': { redirect: '/api/xunit3/**' },
  },
  content: {
    build: {
      markdown: {
        highlight: {
          // Must set `light` too — @nuxt/ui defaults it to material-theme-lighter.
          theme: {
            light: 'light-plus',
            default: 'light-plus',
            dark: 'dark-plus',
          },
          langs: [
            'csharp',
            'xml',
            'bash',
            'shell',
            'json',
            'yaml',
            'md',
            'js',
            'ts',
            'html',
            'css',
            'vue',
          ],
        },
      },
    },
  },
  // Explicit MDC override (Nuxt UI registers highlight defaults on @nuxtjs/mdc).
  mdc: {
    highlight: {
      theme: {
        light: 'light-plus',
        default: 'light-plus',
        dark: 'dark-plus',
      },
    },
  },
  compatibilityDate: '2025-08-01',
})
