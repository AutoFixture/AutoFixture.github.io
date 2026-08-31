import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: {
        include: '*.md',
      },
    }),
    docs: defineCollection({
      type: 'page',
      source: {
        include: 'docs/**/{*.md,.navigation.yml}',
        prefix: '/docs',
      },
      schema: z.object({
        description: z.string().optional(),
      }),
    }),
  },
})
