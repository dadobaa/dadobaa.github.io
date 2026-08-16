#!/usr/bin/env node
/**
 * Renders json/products.json into index.html as STATIC HTML.
 *
 *   npm run build:catalogue
 *
 * Why this exists: the catalogue used to be fetched and injected by JavaScript
 * on page load. Googlebot can render JS, but client-side content and
 * client-side JSON-LD are indexed less reliably than markup that is already in
 * the HTML — and a crawler that does not run JS saw an empty product grid.
 * Baking it in makes all 28 products and their Product schema visible in the
 * raw HTML. Prices are currently hidden — see SHOW_PRICES below.
 *
 * Run this after every edit to json/products.json, and commit the result.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://dadobaa.in';
const IMG = '/img/products/';
const CARD_SIZES = '(max-width: 575px) 50vw, (max-width: 991px) 33vw, 25vw';

// Prices are hidden site-wide. Flip to true to show them again — that restores
// the visible price, the Offer price in structured data and the GA value.
// Note: Google requires structured data to match visible content, so the price
// is removed from BOTH places together. Never show one without the other.
const SHOW_PRICES = false;

/**
 * Serialise JSON-LD safely for embedding in a <script> tag.
 *
 * JSON.stringify does not escape "<", so a product name containing "</script>"
 * would close the schema block early and let the rest of the value run as HTML.
 * Escaping these three characters as \u sequences keeps the JSON valid and
 * makes that impossible.
 */
function jsonLd(obj) {
  return JSON.stringify(obj, null, 2)
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Product filenames contain apostrophes and parentheses; they must be URL-encoded.
const imgPath = (name, ext, w) => IMG + encodeURIComponent(name) + (w ? '-' + w : '') + '.' + ext;
const srcset = (name, ext) => `${imgPath(name, ext, 400)} 400w, ${imgPath(name, ext)} 800w`;

function card(p, eager) {
  const alt = `${esc(p.name)} - Dadobaa`;
  return `
          <div class="col-xl-3 col-lg-4 col-md-6 col-6 mb-4">
            <article class="product-item h-100 d-flex flex-column">
              <div class="position-relative bg-light overflow-hidden product-media">
                <picture>
                  <source type="image/avif" sizes="${CARD_SIZES}" srcset="${srcset(p.image, 'avif')}">
                  <source type="image/webp" sizes="${CARD_SIZES}" srcset="${srcset(p.image, 'webp')}">
                  <img class="img-fluid w-100" src="${imgPath(p.image, 'jpg')}" alt="${alt}"
                       loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager ? ' fetchpriority="high"' : ''}
                       width="800" height="800">
                </picture>
              </div>
              <div class="text-center p-3 flex-grow-1 d-flex flex-column">
                <h3 class="h6 mb-1 product-title"><a class="text-body text-decoration-none" href="/products/${p.slug}.html">${esc(p.name)}</a></h3>
                <span class="d-block text-muted x-small mb-2">${esc(p.weight)}</span>
                ${SHOW_PRICES ? `<span class="d-block text-primary fw-bold mt-auto product-price">₹${esc(p.price)}</span>` : ''}
              </div>
              <div class="d-flex border-top">
                <small class="w-100 text-center py-2">
                  <a class="text-body product-order" href="${esc(p.whatsappLink)}" target="_blank" rel="noopener"
                     data-product="${esc(p.name)}"${SHOW_PRICES ? ` data-price="${esc(p.price)}"` : ''}>
                    <svg class="icon text-primary me-2" aria-hidden="true"><use href="#i-bag"></use></svg>Order Now
                  </a>
                </small>
              </div>
            </article>
          </div>`;
}

function build(categories) {
  let tabs = '';
  let panes = '';
  let n = 0;

  categories.forEach((cat, i) => {
    const active = i === 0;
    const id = 'cat-' + cat.id;

    tabs += `
                        <li class="nav-item me-2 mb-2" role="presentation">
                            <button class="btn btn-outline-primary border-2${active ? ' active' : ''}" data-bs-toggle="pill"
                                    data-bs-target="#${id}" type="button" role="tab" aria-controls="${id}"
                                    aria-selected="${active}">${esc(cat.name)}</button>
                        </li>`;

    const cards = cat.products.map(p => card(p, active && n++ < 4)).join('');
    panes += `
                    <div class="tab-pane fade${active ? ' show active' : ''} p-0" id="${id}" role="tabpanel">
                        ${cat.blurb ? `<p class="text-muted mb-4 category-blurb">${esc(cat.blurb)}</p>` : ''}
                        <div class="row g-4">${cards}
                        </div>
                    </div>`;
  });

  return { tabs, panes };
}

function schema(categories) {
  let position = 1;
  const items = [];
  categories.forEach(cat => cat.products.forEach(p => {
    items.push({
      '@type': 'ListItem',
      position: position++,
      item: {
        '@type': 'Product',
        name: p.name,
        description: p.desc || p.name,
        image: SITE + imgPath(p.image, 'jpg'),
        category: cat.name,
        brand: { '@type': 'Brand', name: 'Dadobaa' },
        offers: Object.assign({
          '@type': 'Offer',
          availability: 'https://schema.org/InStock',
          url: SITE + '/products/' + p.slug + '.html',
          seller: { '@type': 'Organization', name: 'Dadobaa Oils' }
        }, SHOW_PRICES ? { price: p.price, priceCurrency: 'INR' } : {})
      }
    });
  }));

  return jsonLd({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Dadobaa Cold Pressed & Wood Pressed Oils, Ghee and Dry Fruits',
    numberOfItems: items.length,
    itemListElement: items
  }, null, 2);
}

function replaceBlock(html, marker, content, file) {
  const re = new RegExp(`(<!-- ${marker}:START -->)[\\s\\S]*?(<!-- ${marker}:END -->)`);
  if (!re.test(html)) {
    console.error(`  ERROR: marker ${marker} not found in ${file}`);
    process.exit(1);
  }
  return html.replace(re, `$1${content}\n                    $2`);
}

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'json/products.json'), 'utf8'));
const categories = data.categories || [];
const { tabs, panes } = build(categories);

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
html = replaceBlock(html, 'CATALOGUE:TABS', tabs, 'index.html');
html = replaceBlock(html, 'CATALOGUE:PANES', panes, 'index.html');
html = replaceBlock(html, 'CATALOGUE:SCHEMA',
  `\n    <script type="application/ld+json">\n${schema(categories)}\n    </script>`, 'index.html');
fs.writeFileSync(path.join(ROOT, 'index.html'), html);

const total = categories.reduce((s, c) => s + c.products.length, 0);
console.log(`  built ${total} products across ${categories.length} categories into index.html`);
