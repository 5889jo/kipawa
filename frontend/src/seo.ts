import type { Language } from './language.js'

export { sitemapPaths } from './seoRoutes.js'

export type SeoMetadata = {
  title: string
  description: string
  robots: string
  canonicalUrl: string | null
  language: Language
  siteName: string
  openGraphType: 'website' | 'article'
}

type SeoContent = {
  title: string
  description: string
}

type DynamicSeoContent = {
  title: string
  description?: string | null
}

const pageContent: Record<string, Record<Language, SeoContent>> = {
  '/': {
    en: {
      title: 'VETA Kipawa ICT Centre | Practical Vocational Training in Tanzania',
      description: 'Explore practical ICT, electrical, electronics and mechatronics training at VETA Kipawa ICT Centre in Dar es Salaam, Tanzania.'
    },
    sw: {
      title: 'Kituo cha TEHAMA cha VETA Kipawa | Mafunzo ya Ufundi Stadi',
      description: 'Gundua mafunzo ya vitendo ya TEHAMA, umeme, vifaa vya kielektroniki na mechatronics katika Kituo cha TEHAMA cha VETA Kipawa, Dar es Salaam.'
    }
  },
  '/about': {
    en: {
      title: 'About VETA Kipawa ICT Centre',
      description: 'Learn about VETA Kipawa ICT Centre, its role in vocational education and training, its mission, team and partners.'
    },
    sw: {
      title: 'Kuhusu Kituo cha TEHAMA cha VETA Kipawa',
      description: 'Fahamu kuhusu Kituo cha TEHAMA cha VETA Kipawa, jukumu lake katika elimu na mafunzo ya ufundi stadi, dira, timu na washirika wake.'
    }
  },
  '/labs': {
    en: {
      title: 'Training Labs at VETA Kipawa',
      description: 'Explore practical ICT, computer, electrical, electronics and mechatronics learning spaces at VETA Kipawa ICT Centre.'
    },
    sw: {
      title: 'Maabara za Mafunzo VETA Kipawa',
      description: 'Gundua maeneo ya mafunzo ya vitendo ya TEHAMA, kompyuta, umeme, vifaa vya kielektroniki na mechatronics VETA Kipawa.'
    }
  },
  '/team': {
    en: {
      title: 'Our Team | VETA Kipawa ICT Centre',
      description: 'Meet the leadership and staff supporting learning and vocational training at VETA Kipawa ICT Centre.'
    },
    sw: {
      title: 'Timu Yetu | Kituo cha TEHAMA cha VETA Kipawa',
      description: 'Wafahamu viongozi na wafanyakazi wanaosaidia mafunzo katika Kituo cha TEHAMA cha VETA Kipawa.'
    }
  },
  '/long-courses': {
    en: {
      title: 'Long Courses and Programmes | VETA Kipawa',
      description: 'Browse long courses and vocational programmes at VETA Kipawa ICT Centre. Find programme details and the appropriate application route.'
    },
    sw: {
      title: 'Kozi Ndefu na Programu | VETA Kipawa',
      description: 'Vinjari kozi ndefu na programu za ufundi stadi katika Kituo cha TEHAMA cha VETA Kipawa. Pata maelezo na njia sahihi ya maombi.'
    }
  },
  '/short-courses': {
    en: {
      title: 'Short Courses and Intakes | VETA Kipawa',
      description: 'Find short-course training at VETA Kipawa ICT Centre, review current course details and check upcoming intakes.'
    },
    sw: {
      title: 'Kozi Fupi na Udahili | VETA Kipawa',
      description: 'Pata mafunzo ya kozi fupi katika Kituo cha TEHAMA cha VETA Kipawa, soma maelezo ya kozi na angalia udahili ujao.'
    }
  },
  '/news': {
    en: {
      title: 'News and Announcements | VETA Kipawa',
      description: 'Read news, announcements and updates about learning, training and activities at VETA Kipawa ICT Centre.'
    },
    sw: {
      title: 'Habari na Matangazo | VETA Kipawa',
      description: 'Soma habari, matangazo na taarifa kuhusu masomo, mafunzo na shughuli za Kituo cha TEHAMA cha VETA Kipawa.'
    }
  },
  '/publications': {
    en: {
      title: 'Publications and Downloads | VETA Kipawa',
      description: 'Browse publications, reports and downloadable learning resources from VETA Kipawa ICT Centre.'
    },
    sw: {
      title: 'Machapisho na Nyaraka | VETA Kipawa',
      description: 'Vinjari machapisho, ripoti na nyenzo za kujifunzia zinazopakuliwa kutoka Kituo cha TEHAMA cha VETA Kipawa.'
    }
  },
  '/contact': {
    en: {
      title: 'Contact VETA Kipawa ICT Centre',
      description: 'Contact VETA Kipawa ICT Centre in Dar es Salaam for information about courses, training and centre services.'
    },
    sw: {
      title: 'Wasiliana na Kituo cha TEHAMA cha VETA Kipawa',
      description: 'Wasiliana na Kituo cha TEHAMA cha VETA Kipawa, Dar es Salaam, kwa taarifa kuhusu kozi, mafunzo na huduma za kituo.'
    }
  },
  '/faq': {
    en: {
      title: 'Frequently Asked Questions | VETA Kipawa',
      description: 'Find answers about courses, course requests, applications and how to contact VETA Kipawa ICT Centre.'
    },
    sw: {
      title: 'Maswali Yanayoulizwa Mara kwa Mara | VETA Kipawa',
      description: 'Pata majibu kuhusu kozi, maombi ya nafasi, udahili na jinsi ya kuwasiliana na Kituo cha TEHAMA cha VETA Kipawa.'
    }
  },
  '/sitemap': {
    en: {
      title: 'Website Directory | VETA Kipawa ICT Centre',
      description: 'Browse the main pages and information available on the VETA Kipawa ICT Centre website.'
    },
    sw: {
      title: 'Ramani ya Tovuti | Kituo cha TEHAMA cha VETA Kipawa',
      description: 'Vinjari kurasa kuu na taarifa zinazopatikana kwenye tovuti ya Kituo cha TEHAMA cha VETA Kipawa.'
    }
  },
  '/privacy': {
    en: {
      title: 'Privacy Policy | VETA Kipawa ICT Centre',
      description: 'Read the privacy information for the VETA Kipawa ICT Centre website.'
    },
    sw: {
      title: 'Sera ya Faragha | Kituo cha TEHAMA cha VETA Kipawa',
      description: 'Soma taarifa za faragha za tovuti ya Kituo cha TEHAMA cha VETA Kipawa.'
    }
  },
  '/terms': {
    en: {
      title: 'Terms and Conditions | VETA Kipawa ICT Centre',
      description: 'Read the terms and conditions for using the VETA Kipawa ICT Centre website.'
    },
    sw: {
      title: 'Vigezo na Masharti | Kituo cha TEHAMA cha VETA Kipawa',
      description: 'Soma vigezo na masharti ya kutumia tovuti ya Kituo cha TEHAMA cha VETA Kipawa.'
    }
  },
  '/disclaimer': {
    en: {
      title: 'Disclaimer | VETA Kipawa ICT Centre',
      description: 'Read the website information and disclaimer for VETA Kipawa ICT Centre.'
    },
    sw: {
      title: 'Kanusho | Kituo cha TEHAMA cha VETA Kipawa',
      description: 'Soma taarifa za tovuti na kanusho la Kituo cha TEHAMA cha VETA Kipawa.'
    }
  },
  '/copyright': {
    en: {
      title: 'Copyright Information | VETA Kipawa ICT Centre',
      description: 'Read copyright and reuse information for content published by VETA Kipawa ICT Centre.'
    },
    sw: {
      title: 'Taarifa za Hakimiliki | Kituo cha TEHAMA cha VETA Kipawa',
      description: 'Soma taarifa za hakimiliki na matumizi ya maudhui yaliyochapishwa na Kituo cha TEHAMA cha VETA Kipawa.'
    }
  }
}

export function resolveCanonicalOrigin(configuredSiteUrl: string | undefined, runtimeOrigin: string) {
  const value = configuredSiteUrl?.trim()
  if (!value) return new URL(runtimeOrigin).origin

  const url = new URL(value)
  const isLocalDevelopmentHost = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  if ((url.protocol !== 'https:' && !(isLocalDevelopmentHost && url.protocol === 'http:')) ||
      url.pathname !== '/' || url.search || url.hash) {
    throw new Error('VITE_SITE_URL must be an HTTPS origin without a path, query, or fragment.')
  }

  return url.origin
}

export function resolveSeoMetadata({
  pathname,
  language,
  siteName,
  canonicalOrigin,
  course,
  article
}: {
  pathname: string
  language: Language
  siteName: string
  canonicalOrigin: string
  course?: DynamicSeoContent
  article?: DynamicSeoContent
}): SeoMetadata {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/'
  const content = pageContent[normalizedPath]?.[language]
  const isArticle = normalizedPath.startsWith('/news/')
  const isCourse = normalizedPath.startsWith('/courses/')

  if (normalizedPath === '/reset-password') {
    return {
      title: `${language === 'sw' ? 'Weka upya nenosiri' : 'Reset password'} | ${siteName}`,
      description: language === 'sw' ? 'Weka upya nenosiri la akaunti yako.' : 'Reset your account password.',
      robots: 'noindex, nofollow',
      canonicalUrl: null,
      language,
      siteName,
      openGraphType: 'website'
    }
  }

  if (isArticle && article) {
    const description = article.description?.trim() || (language === 'sw'
      ? 'Soma habari na matangazo kutoka Kituo cha TEHAMA cha VETA Kipawa.'
      : 'Read this news story and announcement from VETA Kipawa ICT Centre.')
    return {
      title: `${article.title} | ${language === 'sw' ? 'Habari' : 'News'} | ${siteName}`,
      description: description.slice(0, 180),
      robots: 'index, follow, max-image-preview:large',
      canonicalUrl: new URL(normalizedPath, canonicalOrigin).href,
      language,
      siteName,
      openGraphType: 'article'
    }
  }

  if (isCourse && course) {
    const description = course.description?.trim() || (language === 'sw'
      ? `Pata maelezo kuhusu kozi ya ${course.title} katika Kituo cha TEHAMA cha VETA Kipawa.`
      : `Find course information for ${course.title} at VETA Kipawa ICT Centre.`)
    return {
      title: `${course.title} | ${language === 'sw' ? 'Kozi za VETA Kipawa' : 'VETA Kipawa Courses'}`,
      description: description.slice(0, 180),
      robots: 'index, follow, max-image-preview:large',
      canonicalUrl: new URL(normalizedPath, canonicalOrigin).href,
      language,
      siteName,
      openGraphType: 'website'
    }
  }

  if (content) {
    return {
      title: content.title,
      description: content.description,
      robots: 'index, follow, max-image-preview:large',
      canonicalUrl: new URL(normalizedPath, canonicalOrigin).href,
      language,
      siteName,
      openGraphType: 'website'
    }
  }

  return {
    title: `${language === 'sw' ? 'Ukurasa haujapatikana' : 'Page not found'} | ${siteName}`,
    description: language === 'sw'
      ? 'Ukurasa uliotafuta haupatikani. Vinjari tovuti ya Kituo cha TEHAMA cha VETA Kipawa.'
      : 'The page you requested could not be found. Browse the VETA Kipawa ICT Centre website.',
    robots: 'noindex, nofollow',
    canonicalUrl: null,
    language,
    siteName,
    openGraphType: 'website'
  }
}

export function applySeoMetadata(metadata: SeoMetadata, canonicalOrigin: string) {
  const ensureMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
    let element = document.head.querySelector<HTMLMetaElement>(selector)
    if (!element) {
      element = document.createElement('meta')
      element.setAttribute(attribute, key)
      document.head.append(element)
    }
    element.content = content
  }

  document.title = metadata.title
  document.documentElement.lang = metadata.language
  ensureMeta('meta[name="description"]', 'name', 'description', metadata.description)
  ensureMeta('meta[name="robots"]', 'name', 'robots', metadata.robots)
  ensureMeta('meta[name="googlebot"]', 'name', 'googlebot', metadata.robots)
  ensureMeta('meta[property="og:type"]', 'property', 'og:type', metadata.openGraphType)
  ensureMeta('meta[property="og:site_name"]', 'property', 'og:site_name', metadata.siteName)
  ensureMeta('meta[property="og:title"]', 'property', 'og:title', metadata.title)
  ensureMeta('meta[property="og:description"]', 'property', 'og:description', metadata.description)
  ensureMeta('meta[property="og:locale"]', 'property', 'og:locale', metadata.language === 'sw' ? 'sw_TZ' : 'en_TZ')
  ensureMeta('meta[property="og:image"]', 'property', 'og:image', new URL('/stats-background.png', canonicalOrigin).href)
  ensureMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
  ensureMeta('meta[name="twitter:title"]', 'name', 'twitter:title', metadata.title)
  ensureMeta('meta[name="twitter:description"]', 'name', 'twitter:description', metadata.description)
  ensureMeta('meta[name="twitter:image"]', 'name', 'twitter:image', new URL('/stats-background.png', canonicalOrigin).href)

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (metadata.canonicalUrl) {
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.append(canonical)
    }
    canonical.href = metadata.canonicalUrl
    ensureMeta('meta[property="og:url"]', 'property', 'og:url', metadata.canonicalUrl)
  } else {
    canonical?.remove()
    document.head.querySelector('meta[property="og:url"]')?.remove()
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: metadata.title,
    description: metadata.description,
    inLanguage: metadata.language === 'sw' ? 'sw-TZ' : 'en-TZ',
    ...(metadata.canonicalUrl ? { url: metadata.canonicalUrl } : {}),
    isPartOf: {
      '@type': 'WebSite',
      name: metadata.siteName,
      url: `${canonicalOrigin}/`
    }
  }
  let structuredDataScript = document.head.querySelector<HTMLScriptElement>('#page-seo-structured-data')
  if (!structuredDataScript) {
    structuredDataScript = document.createElement('script')
    structuredDataScript.id = 'page-seo-structured-data'
    structuredDataScript.type = 'application/ld+json'
    document.head.append(structuredDataScript)
  }
  structuredDataScript.textContent = JSON.stringify(structuredData)
}
