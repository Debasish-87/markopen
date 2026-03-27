const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://markopen.in';
const today = new Date().toISOString().split('T')[0];

const routes = [
  { path: '/',           priority: '1.0', changefreq: 'daily' },
  { path: '/#favorites', priority: '0.7', changefreq: 'weekly' },
  { path: '/#about',     priority: '0.5', changefreq: 'monthly' },
  { path: '/#privacy',   priority: '0.3', changefreq: 'monthly' },
  { path: '/#terms',     priority: '0.3', changefreq: 'monthly' },
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(r => `  <url>
    <loc>${BASE_URL}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

const outDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(outDir)) {
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemap);
  console.log('✅ sitemap.xml generated at dist/sitemap.xml');
} else {
  console.log('⚠️  dist/ not found, skipping sitemap generation');
}
