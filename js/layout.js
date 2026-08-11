/**
 * Injects the shared header and footer into #header / #footer.
 * Runs on DOMContentLoaded so the navbar paints immediately.
 */
(function () {
  'use strict';

  var BIZ = {
    name: 'Dadobaa Oils (OPC) Private Limited',
    phoneDisplay: '+91 98201 75000',
    phoneHref: 'tel:+919820175000',
    email: 'dadobaa.oils@gmail.com',
    address: 'Govandi, Mumbai 400088',
    maps: 'https://maps.app.goo.gl/wuixdATZgGjNWyZy6',
    whatsappCatalogue: 'https://wa.me/c/919820175000',
    jiomart: 'https://www.jiomart.com/groceries/b/dadobaa-oils/14875',
    facebook: 'https://www.facebook.com/dadobaaoils/',
    instagram: 'https://www.instagram.com/dadobaa_wood_pressed_oils/'
  };

  // Marks the current page's nav link so users know where they are.
  function currentPage() {
    var path = window.location.pathname.split('/').pop();
    return path === '' ? 'index.html' : path;
  }

  function navLink(href, label, page) {
    // Anchor links (index.html#products) never take the active state.
    var isActive = href.indexOf('#') === -1 && href.split('/').pop() === page;
    return '<a href="' + href + '" class="nav-item nav-link' + (isActive ? ' active' : '') + '"' +
           (isActive ? ' aria-current="page"' : '') + '>' + label + '</a>';
  }

  function headerHtml() {
    var page = currentPage();
    return '' +
    '<div class="container-fluid fixed-top px-0">' +
      '<div class="top-bar row gx-0 align-items-center d-none d-lg-flex">' +
        '<div class="col-lg-6 px-5 text-start">' +
          '<small><svg class="icon me-2" aria-hidden="true"><use href="#i-geo-alt"></use></svg>' + BIZ.address + '</small>' +
          '<small class="ms-4"><svg class="icon me-2" aria-hidden="true"><use href="#i-envelope"></use></svg>' +
            '<a class="text-body" href="mailto:' + BIZ.email + '">' + BIZ.email + '</a></small>' +
        '</div>' +
        '<div class="col-lg-6 px-5 text-end">' +
          '<small><svg class="icon me-2" aria-hidden="true"><use href="#i-telephone"></use></svg>' +
            '<a class="text-body" href="' + BIZ.phoneHref + '">' + BIZ.phoneDisplay + '</a></small>' +
          '<small class="ms-4">Follow us:</small>' +
          '<a class="text-body ms-3" href="' + BIZ.facebook + '" target="_blank" rel="noopener" aria-label="Dadobaa on Facebook"><svg class="icon " aria-hidden="true"><use href="#i-facebook"></use></svg></a>' +
          '<a class="text-body ms-3" href="' + BIZ.instagram + '" target="_blank" rel="noopener" aria-label="Dadobaa on Instagram"><svg class="icon " aria-hidden="true"><use href="#i-instagram"></use></svg></a>' +
        '</div>' +
      '</div>' +

      '<nav class="navbar navbar-expand-lg navbar-light py-lg-0 px-lg-5">' +
        '<a href="/index.html" class="navbar-brand ms-4 ms-lg-0" aria-label="Dadobaa Oils home">' +
          '<picture>' +
            '<source type="image/avif" srcset="/img/Brand-logo.avif">' +
            '<source type="image/webp" srcset="/img/Brand-logo.webp">' +
            '<img src="/img/Brand-logo.jpeg" class="brand-logo" alt="Dadobaa Oils" width="240" height="66">' +
          '</picture>' +
        '</a>' +
        '<button type="button" class="navbar-toggler me-4" data-bs-toggle="collapse" data-bs-target="#navbarCollapse"' +
          ' aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation">' +
          '<span class="navbar-toggler-icon"></span>' +
        '</button>' +
        '<div class="collapse navbar-collapse" id="navbarCollapse">' +
          '<div class="navbar-nav ms-auto p-4 p-lg-0">' +
            navLink('/index.html', 'Home', page) +
            navLink('/index.html#products', 'Products', page) +
            navLink('/about.html', 'Our Process', page) +
            navLink('/contact.html', 'Contact', page) +
          '</div>' +
          '<div class="d-none d-lg-flex ms-3">' +
            '<a class="btn btn-primary rounded-pill px-4" href="' + BIZ.whatsappCatalogue + '" target="_blank" rel="noopener">' +
              '<svg class="icon me-2" aria-hidden="true"><use href="#i-whatsapp"></use></svg>Order' +
            '</a>' +
          '</div>' +
          '<div class="d-lg-none px-4 pb-4">' +
            '<a class="btn btn-primary rounded-pill w-100" href="' + BIZ.whatsappCatalogue + '" target="_blank" rel="noopener">' +
              '<svg class="icon me-2" aria-hidden="true"><use href="#i-whatsapp"></use></svg>Order on WhatsApp' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</nav>' +
    '</div>';
  }

  function footerHtml() {
    var year = new Date().getFullYear();
    return '' +
    '<div class="container-fluid bg-dark footer mt-5 pt-5">' +
      '<div class="container py-5">' +
        '<div class="row g-5">' +
          '<div class="col-lg-5 col-md-6">' +
            '<picture>' +
              '<source type="image/avif" srcset="/img/Brand-logo.avif">' +
              '<source type="image/webp" srcset="/img/Brand-logo.webp">' +
              '<img src="/img/Brand-logo.jpeg" class="brand-logo mb-3" alt="Dadobaa Oils" width="240" height="66" loading="lazy">' +
            '</picture>' +
            '<p>Experience the essence of purity with Dadobaa wood pressed oils — 100% natural, chemical free and preservative free, straight from the ancestral wisdom of our great grandfathers.</p>' +
            '<div class="d-flex pt-2">' +
              '<a class="btn btn-square btn-outline-light rounded-circle me-2" href="' + BIZ.facebook + '" target="_blank" rel="noopener" aria-label="Dadobaa on Facebook"><svg class="icon " aria-hidden="true"><use href="#i-facebook"></use></svg></a>' +
              '<a class="btn btn-square btn-outline-light rounded-circle me-2" href="' + BIZ.instagram + '" target="_blank" rel="noopener" aria-label="Dadobaa on Instagram"><svg class="icon " aria-hidden="true"><use href="#i-instagram"></use></svg></a>' +
              '<a class="btn btn-square btn-outline-light rounded-circle" href="' + BIZ.whatsappCatalogue + '" target="_blank" rel="noopener" aria-label="Dadobaa on WhatsApp"><svg class="icon " aria-hidden="true"><use href="#i-whatsapp"></use></svg></a>' +
            '</div>' +
          '</div>' +

          '<div class="col-lg-3 col-md-6">' +
            '<h2 class="h5 text-light mb-4">Explore</h2>' +
            '<a class="btn btn-link" href="/index.html">Home</a>' +
            '<a class="btn btn-link" href="/index.html#products">All Products</a>' +
            '<a class="btn btn-link" href="/cold-pressed-oil-mumbai.html">Cold Pressed Oil in Mumbai</a>' +
            '<a class="btn btn-link" href="/about.html">Our Process</a>' +
            '<a class="btn btn-link" href="/contact.html">Contact Us</a>' +
          '</div>' +

          '<div class="col-lg-4 col-md-6">' +
            '<h2 class="h5 text-light mb-4">Get in touch</h2>' +
            '<p><svg class="icon me-3" aria-hidden="true"><use href="#i-geo-alt"></use></svg>' +
              '<a class="footer-link" href="' + BIZ.maps + '" target="_blank" rel="noopener">' + BIZ.address + '</a></p>' +
            '<p><svg class="icon me-3" aria-hidden="true"><use href="#i-telephone"></use></svg>' +
              '<a class="footer-link" href="' + BIZ.phoneHref + '">' + BIZ.phoneDisplay + '</a></p>' +
            '<p><svg class="icon me-3" aria-hidden="true"><use href="#i-envelope"></use></svg>' +
              '<a class="footer-link" href="mailto:' + BIZ.email + '">' + BIZ.email + '</a></p>' +
            '<p class="mb-0"><svg class="icon me-3" aria-hidden="true"><use href="#i-shop"></use></svg>' +
              'Also on <a class="footer-link" href="' + BIZ.jiomart + '" target="_blank" rel="noopener">JioMart</a></p>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="container-fluid copyright">' +
        '<div class="container">' +
          '<div class="row">' +
            '<div class="col-12 text-center">' +
              '&copy; ' + year + ' <a href="https://dadobaa.in">' + BIZ.name + '</a>. All rights reserved.' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function init() {
    var header = document.getElementById('header');
    var footer = document.getElementById('footer');
    if (header) header.innerHTML = headerHtml();
    if (footer) footer.innerHTML = footerHtml();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
