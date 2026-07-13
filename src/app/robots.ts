import type { MetadataRoute } from 'next'

// Private app — block all crawlers from every path.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', disallow: '/' },
  }
}
