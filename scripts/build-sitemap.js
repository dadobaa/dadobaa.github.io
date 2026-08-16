#!/usr/bin/env node
/**
 * Regenerates sitemap.xml from the pages that actually exist.
 *
 *   npm run build:sitemap
 *
 * Runs as part of `npm run build`, so adding or removing a product keeps the
 * sitemap correct without anyone having to remember to edit it.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://dadobaa.in';

// Fixed pages, with how important each one is relative to the others (0–1).
const STATIC = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/cold-pressed-oil-mumbai.html', priority: '0.9', changefreq: 'monthly' },
  { loc: '/about.html', priority: '0.8', changefreq: 'monthly' },
  { loc: '/contact.html', priority: '0.7', changefreq: 'monthly' }
];

const today = new Date().toISOString().slice(0, 10);

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'json/products.json'), 'utf8'));
const products = (data.categories || []).flatMap(c => c.products || []);

const urls = [
  ...STATIC,
  ...products
    // Only list a product if its page was actually generated.
    .filter(p => p.slug && fs.existsSync(path.join(ROOT, 'products', p.slug + '.html')))
    .map(p => ({ loc: `/products/${p.slug}.html`, priority: '0.7', changefreq: 'monthly' }))
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${SITE}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log(`  sitemap.xml rebuilt with ${urls.length} pages`);
