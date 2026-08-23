import type { MetadataRoute } from 'next'

// Public portfolio landing (/) is indexable; the private app is not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/home', '/money', '/body', '/work', '/calendar', '/admin', '/review', '/login', '/api/'],
    },
  }
}
