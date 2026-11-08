// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { applySeoMetadata, resolveCanonicalOrigin, resolveSeoMetadata, sitemapPaths } from './seo'

describe('SEO metadata', () => {
  const defaults = {
    siteName: 'VETA Kipawa ICT Centre',
    canonicalOrigin: 'https://kipawa.example',
    language: 'en' as const
  }

  it('creates localized metadata and normalized canonical URLs for public pages', () => {
    const metadata = resolveSeoMetadata({
      ...defaults,
      pathname: '/short-courses/',
      language: 'sw'
    })

    expect(metadata.title).toContain('Kozi Fupi')
    expect(metadata.canonicalUrl).toBe('https://kipawa.example/short-courses')
    expect(metadata.robots).toContain('index, follow')
  })

  it('uses live course and news content for detail pages', () => {
    const course = resolveSeoMetadata({
      ...defaults,
      pathname: '/courses/software-engineering',
      course: { title: 'Software Engineering', description: 'Practical software training.' }
    })
    const article = resolveSeoMetadata({
      ...defaults,
      pathname: '/news/skills-day',
      article: { title: 'Skills Day', description: 'A centre event.' }
    })

    expect(course.title).toContain('Software Engineering')
    expect(course.description).toBe('Practical software training.')
    expect(article.title).toContain('Skills Day')
    expect(article.description).toBe('A centre event.')
    expect(article.openGraphType).toBe('article')
  })

  it('marks unknown and account pages as noindex', () => {
    for (const pathname of ['/missing-page', '/login', '/dashboard', '/admin']) {
      expect(resolveSeoMetadata({ ...defaults, pathname }).robots).toBe('noindex, nofollow')
    }
  })

  it('uses the runtime origin if no public domain has been configured', () => {
    expect(resolveCanonicalOrigin(undefined, 'http://localhost:5173')).toBe('http://localhost:5173')
    expect(resolveCanonicalOrigin('https://kipawa.example/', 'http://localhost:5173')).toBe('https://kipawa.example')
  })

  it('keeps password reset pages out of search indexes and canonical links', () => {
    expect(resolveSeoMetadata({
      pathname: '/reset-password',
      language: 'en',
      siteName: 'VETA Kipawa',
      canonicalOrigin: 'https://kipawa.example'
    })).toMatchObject({
      title: 'Reset password | VETA Kipawa',
      robots: 'noindex, nofollow',
      canonicalUrl: null
    })
  })

  it('rejects invalid canonical URLs', () => {
    expect(() => resolveCanonicalOrigin('http://kipawa.example', 'https://localhost')).toThrow('VITE_SITE_URL')
    expect(() => resolveCanonicalOrigin('https://kipawa.example/path', 'https://localhost')).toThrow('VITE_SITE_URL')
  })

  it('updates page metadata and removes canonicals from noindex routes', () => {
    const publicPage = resolveSeoMetadata({ ...defaults, pathname: '/about' })
    applySeoMetadata(publicPage, defaults.canonicalOrigin)

    expect(document.title).toBe(publicPage.title)
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(publicPage.canonicalUrl)
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(publicPage.canonicalUrl)
    expect(JSON.parse(document.querySelector('#page-seo-structured-data')?.textContent ?? '{}').name).toBe(publicPage.title)

    const privatePage = resolveSeoMetadata({ ...defaults, pathname: '/admin' })
    applySeoMetadata(privatePage, defaults.canonicalOrigin)
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow')
    expect(document.querySelector('link[rel="canonical"]')).toBeNull()
  })

  it('lists only public pages in the sitemap', () => {
    expect(sitemapPaths).toContain('/short-courses')
    expect(sitemapPaths).not.toContain('/admin')
    expect(sitemapPaths).not.toContain('/dashboard')
    for (const pathname of sitemapPaths) {
      expect(resolveSeoMetadata({ ...defaults, pathname }).robots).toContain('index, follow')
    }
  })
})
