import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
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
