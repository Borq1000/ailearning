import type { MetadataRoute } from 'next'
import { listCourses, readyLessons } from '@/lib/course/registry'
import { SITE } from '@/lib/site'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['/', '/glossary', ...listCourses().flatMap((c) => [`/courses/${c.id}`, ...readyLessons(c).map((l) => `/courses/${c.id}/${l.slug}`)])]
  return pages.map((path) => ({ url: new URL(path, SITE.url).toString() }))
}
