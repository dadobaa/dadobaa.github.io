#!/usr/bin/env node
/**
 * Generates one indexable page per product at /products/<slug>.html
 *
 *   npm run build:products
 *
 * Why: the catalogue lived entirely on the homepage, so no product had its own
 * URL. That blocked three things at once — per-product organic ranking, a
 * destination for any earned link, and Google Merchant Center (which requires a
 * `link` per item). Each generated page carries its own title, meta
 * description, H1, Product + Offer schema with a real canonical URL, and a
 * breadcrumb.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://dadobaa.in';
const OUT_DIR = path.join(ROOT, 'products');

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function slugify(name) {
  return name.toLowerCase()
    .replace(/\(|\)/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const imgPath = (n, ext, w) => '/img/products/' + encodeURIComponent(n) + (w ? '-' + w : '') + '.' + ext;

// Pull the icon sprite out of index.html so it stays in one place.
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const sprite = (indexHtml.match(/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" style="display:none"[\s\S]*?<\/svg>/) || [''])[0];
if (!sprite) { console.error('  ERROR: icon sprite not found in index.html'); process.exit(1); }

const GTAG = `    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', 'G-XXXXXXXXXX');
        (function () {
            var loaded = false;
            function loadGtag() {
                if (loaded) return;
                loaded = true;
                var s = document.createElement('script');
                s.async = true;
                s.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';
                document.head.appendChild(s);
            }
            window.addEventListener('load', function () {
                ['pointerdown', 'keydown', 'touchstart'].forEach(function (evt) {
                    window.addEventListener(evt, loadGtag, { once: true, passive: true });
                });
                setTimeout(loadGtag, 2000);
            });
        })();
    </script>`;

function page(p, cat, siblings) {
  const url = `${SITE}/products/${p.slug}.html`;
  const title = `${p.name} ${p.weight} | Buy Online | Dadobaa Oils`.slice(0, 70);
  const desc = `${p.desc} ₹${p.price} for ${p.weight}. Pressed in small batches in Mumbai and delivered across India. Order on WhatsApp.`.slice(0, 300);
  const img = SITE + imgPath(p.image, 'jpg');

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.desc,
    image: [SITE + imgPath(p.image, 'jpg')],
    sku: 'DAD-' + p.id,
    category: cat.name,
    brand: { '@type': 'Brand', name: 'Dadobaa' },
    offers: {
      '@type': 'Offer',
      url: url,
      price: p.price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'Dadobaa Oils', '@id': SITE + '/#organization' }
    }
  };

  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: cat.name, item: SITE + '/#products' },
      { '@type': 'ListItem', position: 3, name: p.name, item: url }
    ]
  };

  const related = siblings.slice(0, 4).map(s => `
                        <li class="mb-2"><a href="${s.slug}.html">${esc(s.name)} — ₹${s.price}</a></li>`).join('');

  return `<!DOCTYPE html>
<html lang="en-IN">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>${esc(title)}</title>
    <meta name="description" content="${esc(desc)}">
    <link rel="canonical" href="${url}">

    <meta property="og:type" content="product">
    <meta property="og:site_name" content="Dadobaa Oils">
    <meta property="og:title" content="${esc(p.name)} ${esc(p.weight)} | Dadobaa Oils">
    <meta property="og:description" content="${esc(p.desc)}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${img}">
    <meta property="og:image:alt" content="${esc(p.name)}">
    <meta property="og:locale" content="en_IN">
    <meta property="product:price:amount" content="${p.price}">
    <meta property="product:price:currency" content="INR">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(p.name)} ${esc(p.weight)} | Dadobaa Oils">
    <meta name="twitter:description" content="${esc(p.desc)}">
    <meta name="twitter:image" content="${img}">
    <meta name="theme-color" content="#3CB815">

    <link rel="icon" href="/img/Brand-logo-sm.jpeg">
    <link rel="apple-touch-icon" href="/img/Brand-logo-sm.jpeg">

    <link rel="preload" href="/fonts/OpenSans-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/fonts/Lora-latin.woff2" as="font" type="font/woff2" crossorigin>

    <link rel="stylesheet" href="/css/fonts.css">
    <link rel="stylesheet" href="/css/bootstrap.min.css">
    <link rel="stylesheet" href="/css/style.css">

    <script defer src="/js/layout.js"></script>
    <script defer src="/js/main.js"></script>

    <!-- Google Analytics 4 — replace G-XXXXXXXXXX with your Measurement ID. -->
${GTAG}

    <script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
    </script>

    <script type="application/ld+json">
${JSON.stringify(crumbs, null, 2)}
    </script>
</head>

<body>
    ${sprite}

    <header id="header"></header>

    <main>
        <section class="container-xxl py-5 product-page">
            <div class="container">
                <nav aria-label="breadcrumb" class="pt-5">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item"><a href="/index.html">Home</a></li>
                        <li class="breadcrumb-item"><a href="/index.html#products">${esc(cat.name)}</a></li>
                        <li class="breadcrumb-item active" aria-current="page">${esc(p.name)}</li>
                    </ol>
                </nav>

                <div class="row g-5 align-items-start">
                    <div class="col-lg-6">
                        <div class="bg-light rounded overflow-hidden">
                            <picture>
                                <source type="image/avif" srcset="${imgPath(p.image, 'avif')}">
                                <source type="image/webp" srcset="${imgPath(p.image, 'webp')}">
                                <img class="img-fluid w-100" src="${imgPath(p.image, 'jpg')}"
                                     alt="${esc(p.name)} from Dadobaa Oils" width="800" height="800" fetchpriority="high">
                            </picture>
                        </div>
                    </div>

                    <div class="col-lg-6">
                        <h1 class="display-6 mb-2">${esc(p.name)}</h1>
                        <p class="text-muted mb-3">${esc(p.weight)}</p>
                        <p class="display-6 text-primary fw-bold mb-4">₹${p.price}</p>

                        <p class="lead">${esc(p.desc)}</p>

                        <p><svg class="icon text-primary me-3" aria-hidden="true"><use href="#i-check-circle-fill"></use></svg>Unrefined — no bleaching, no deodorising, no chemical refining</p>
                        <p><svg class="icon text-primary me-3" aria-hidden="true"><use href="#i-check-circle-fill"></use></svg>Pressed in small batches in Govandi, Mumbai</p>
                        <p class="mb-4"><svg class="icon text-primary me-3" aria-hidden="true"><use href="#i-check-circle-fill"></use></svg>Delivered across Mumbai and shipped pan-India</p>

                        <a class="btn btn-primary rounded-pill py-3 px-5 me-2 mb-2 product-order"
                           href="${esc(p.whatsappLink)}" target="_blank" rel="noopener"
                           data-product="${esc(p.name)}" data-price="${p.price}">
                            <svg class="icon me-2" aria-hidden="true"><use href="#i-whatsapp"></use></svg>Order on WhatsApp
                        </a>
                        <a class="btn btn-outline-primary rounded-pill py-3 px-5 mb-2" href="tel:+919820175000">
                            <svg class="icon me-2" aria-hidden="true"><use href="#i-telephone"></use></svg>Call to order
                        </a>
                    </div>
                </div>

                <div class="row g-5 mt-4">
                    <div class="col-lg-7">
                        <h2 class="h4 mb-3">What to expect</h2>
                        <p>This is unrefined oil, so it behaves differently from the refined oil sold in supermarkets. It smells and tastes of the seed it came from, and sediment settling at the bottom of the bottle is normal rather than a fault.</p>
                        <p>Keep it in a cool, dark place with the cap closed tightly. There are no preservatives in it, so use it within a few months of opening.</p>
                        <p class="mb-0"><a href="/about.html">Read how we press it</a> or <a href="/cold-pressed-oil-mumbai.html">see our Mumbai pressing unit</a>.</p>
                    </div>
                    <div class="col-lg-5">
                        <h2 class="h4 mb-3">More in ${esc(cat.name)}</h2>
                        <ul class="list-unstyled">${related}
                        </ul>
                        <a href="/index.html#products" class="btn btn-outline-primary rounded-pill py-2 px-4 mt-2">All products</a>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer id="footer"></footer>

    <a href="#" class="btn btn-lg btn-primary btn-lg-square rounded-circle back-to-top" aria-label="Back to top">
        <svg class="icon" aria-hidden="true"><use href="#i-arrow-up"></use></svg>
    </a>
</body>

</html>
`;
}

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'json/products.json'), 'utf8'));
fs.mkdirSync(OUT_DIR, { recursive: true });

// Assign slugs first so cross-links can resolve.
data.categories.forEach(cat => cat.products.forEach(p => { p.slug = p.slug || slugify(p.name); }));

const written = [];
data.categories.forEach(cat => {
  cat.products.forEach(p => {
    const siblings = cat.products.filter(s => s.id !== p.id);
    fs.writeFileSync(path.join(OUT_DIR, p.slug + '.html'), page(p, cat, siblings));
    written.push(p.slug);
  });
});

// Persist slugs so the homepage cards can link to these pages.
fs.writeFileSync(path.join(ROOT, 'json/products.json'), JSON.stringify(data, null, 2) + '\n');

console.log(`  wrote ${written.length} product pages to /products/`);
