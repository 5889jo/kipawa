import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { sitemapPaths } from './src/seoRoutes.js'

function seoAssetsPlugin(siteUrl: string | undefined): Plugin {
  const normalizedSiteUrl = siteUrl ? new URL(siteUrl) : null
  if (normalizedSiteUrl && (
    normalizedSiteUrl.protocol !== 'https:' ||
    normalizedSiteUrl.pathname !== '/' ||
    normalizedSiteUrl.search ||
    normalizedSiteUrl.hash
  )) {
    throw new Error('VITE_SITE_URL must be an HTTPS origin without a path, query, or fragment.')
  }

  return {
    name: 'kipawa-seo-assets',
    apply: 'build',
    transformIndexHtml(html) {
      if (!normalizedSiteUrl) return html
      const origin = normalizedSiteUrl.origin
      const canonical = `${origin}/`
      const socialImage = `${origin}/stats-background.png`
      return html
        .replace('</head>', `    <link rel="canonical" href="${canonical}" />\n    <meta property="og:url" content="${canonical}" />\n    <meta property="og:image" content="${socialImage}" />\n    <meta name="twitter:image" content="${socialImage}" />\n  </head>`)
    },
    generateBundle() {
      const robotsLines = [
        'User-agent: *',
        'Allow: /',
        'Disallow: /api/',
        'Disallow: /uploads/payment-proofs/'
      ]

      if (normalizedSiteUrl) {
        robotsLines.push(`Sitemap: ${normalizedSiteUrl.origin}/sitemap.xml`)
        const urlEntries = sitemapPaths
          .map((path) => `  <url><loc>${normalizedSiteUrl.origin}${path}</loc></url>`)
          .join('\n')
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>\n`
        })
      } else {
        this.warn('VITE_SITE_URL is not set; sitemap.xml was not generated. Set the public HTTPS origin before deployment.')
      }

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `${robotsLines.join('\n')}\n`
      })
    }
  }
}

const apiProxy = {
  '/api': {
    target: 'http://localhost:4000',
    changeOrigin: true
  },
  '/uploads': {
    target: 'http://localhost:4000',
    changeOrigin: true
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), seoAssetsPlugin(env.VITE_SITE_URL)],
    server: { proxy: apiProxy },
    preview: { proxy: apiProxy }
  }
})
