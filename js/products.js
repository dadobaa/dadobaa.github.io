/**
 * Renders the product catalogue from json/products.json.
 * Runs on DOMContentLoaded so the grid paints without waiting for images/video.
 */
(function () {
  'use strict';

  var CATALOGUE = '/json/products.json';
  var IMG_DIR = '/img/products/';
  var SITE = 'https://dadobaa.in';

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Filenames contain characters (apostrophes, parentheses) that must be encoded in a URL.
  function imgPath(name, ext, width) {
    return IMG_DIR + encodeURIComponent(name) + (width ? '-' + width : '') + '.' + ext;
  }

  // Cards are ~50vw on phones, 33vw on tablets, 25vw on desktop.
  var CARD_SIZES = '(max-width: 575px) 50vw, (max-width: 991px) 33vw, 25vw';

  function srcset(name, ext) {
    return imgPath(name, ext, 400) + ' 400w, ' + imgPath(name, ext) + ' 800w';
  }

  function productCard(p, eager) {
    var alt = esc(p.name) + ' - Dadobaa';
    var loading = eager ? 'eager' : 'lazy';
    var priority = eager ? ' fetchpriority="high"' : '';

    return '' +
      '<div class="col-xl-3 col-lg-4 col-md-6 col-6 mb-4">' +
        '<article class="product-item h-100 d-flex flex-column">' +
          '<div class="position-relative bg-light overflow-hidden product-media">' +
            '<picture>' +
              '<source type="image/avif" sizes="' + CARD_SIZES + '" srcset="' + srcset(p.image, 'avif') + '">' +
              '<source type="image/webp" sizes="' + CARD_SIZES + '" srcset="' + srcset(p.image, 'webp') + '">' +
              '<img class="img-fluid w-100" src="' + imgPath(p.image, 'jpg') + '"' +
                   ' alt="' + alt + '" loading="' + loading + '" decoding="async"' + priority +
                   ' width="800" height="800">' +
            '</picture>' +
          '</div>' +
          '<div class="text-center p-3 flex-grow-1 d-flex flex-column">' +
            '<h3 class="h6 mb-1 product-title">' + esc(p.name) + '</h3>' +
            '<span class="d-block text-muted x-small mb-2">' + esc(p.weight) + '</span>' +
            '<span class="d-block text-primary fw-bold mt-auto product-price">₹' + esc(p.price) + '</span>' +
          '</div>' +
          '<div class="d-flex border-top">' +
            '<small class="w-100 text-center py-2">' +
              '<a class="text-body product-order" href="' + esc(p.whatsappLink) + '"' +
                 ' target="_blank" rel="noopener"' +
                 ' data-product="' + esc(p.name) + '" data-price="' + esc(p.price) + '">' +
                '<svg class="icon text-primary me-2" aria-hidden="true"><use href="#i-bag"></use></svg>Order Now' +
              '</a>' +
            '</small>' +
          '</div>' +
        '</article>' +
      '</div>';
  }

  function render(categories) {
    var tabList = document.getElementById('tabs-li');
    var tabContent = document.getElementById('tab-content');
    if (!tabContent) return;

    var tabsHtml = '';
    var panesHtml = '';
    var cardIndex = 0;

    categories.forEach(function (cat, i) {
      var active = i === 0;
      var paneId = 'cat-' + cat.id;

      tabsHtml +=
        '<li class="nav-item me-2 mb-2" role="presentation">' +
          '<button class="btn btn-outline-primary border-2' + (active ? ' active' : '') + '"' +
            ' data-bs-toggle="pill" data-bs-target="#' + paneId + '" type="button" role="tab"' +
            ' aria-controls="' + paneId + '" aria-selected="' + active + '">' +
            esc(cat.name) +
          '</button>' +
        '</li>';

      var cards = cat.products.map(function (p) {
        // First row of the first tab is above the fold on most screens.
        var eager = active && cardIndex++ < 4;
        return productCard(p, eager);
      }).join('');

      panesHtml +=
        '<div class="tab-pane fade' + (active ? ' show active' : '') + ' p-0" id="' + paneId + '" role="tabpanel">' +
          (cat.blurb ? '<p class="text-muted mb-4 category-blurb">' + esc(cat.blurb) + '</p>' : '') +
          '<div class="row g-4">' + cards + '</div>' +
        '</div>';
    });

    if (tabList) tabList.innerHTML = tabsHtml;
    tabContent.innerHTML = panesHtml;
  }

  /** Product structured data so Google can show prices in search results. */
  function injectStructuredData(categories) {
    var items = [];
    var position = 1;

    categories.forEach(function (cat) {
      cat.products.forEach(function (p) {
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
            offers: {
              '@type': 'Offer',
              price: p.price,
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
              url: p.whatsappLink,
              seller: { '@type': 'Organization', name: 'Dadobaa' }
            }
          }
        });
      });
    });

    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Dadobaa Wood Pressed Oils & Natural Products',
      numberOfItems: items.length,
      itemListElement: items
    });
    document.head.appendChild(script);
  }

  /** Fire a GA4 event when someone taps through to WhatsApp — the real conversion. */
  function trackOrderClicks() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest && e.target.closest('.product-order');
      if (!link || typeof window.gtag !== 'function') return;
      window.gtag('event', 'select_item', {
        item_list_name: 'Product Grid',
        items: [{
          item_name: link.getAttribute('data-product'),
          price: Number(link.getAttribute('data-price')) || undefined,
          currency: 'INR'
        }]
      });
    });
  }

  function init() {
    fetch(CATALOGUE)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        var categories = data.categories || [];
        render(categories);
        injectStructuredData(categories);
        trackOrderClicks();
      })
      .catch(function (err) {
        console.error('Could not load product catalogue:', err);
        var tabContent = document.getElementById('tab-content');
        if (tabContent) {
          tabContent.innerHTML =
            '<p class="text-center text-muted py-5">' +
            'Our catalogue could not load. Please ' +
            '<a href="https://wa.me/c/919820175000" target="_blank" rel="noopener">message us on WhatsApp</a>' +
            ' and we will help you order.</p>';
        }
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
