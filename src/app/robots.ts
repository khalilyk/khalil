import type { MetadataRoute } from 'next'

// Public portfolio landing (/) is indexable; the private app is not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/personal', '/body', '/calendar', '/admin', '/review', '/api/'],
    },
  }
}
