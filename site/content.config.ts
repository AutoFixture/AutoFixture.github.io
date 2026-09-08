import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const badgeObjectSchema = z.object({
  label: z.union([z.string(), z.number()]).optional(),
  color: z.string().optional(),
  variant: z.string().optional(),
  size: z.string().optional(),
})

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
        /**
         * Last meaningful content update (calendar day).
         * Prefer `YYYY-MM-DD` in frontmatter; YAML dates are also accepted.
         */
        updated: z.union([z.string(), z.date()]).optional(),
        /** Sidebar badge — string shortcut (`New`, `Updated`, `Preview`) or Nuxt UI BadgeProps. */
        badge: z.union([z.string(), z.number(), badgeObjectSchema]).optional(),
      }),
    }),
  },
})
