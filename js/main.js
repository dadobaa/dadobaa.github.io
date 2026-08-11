/**
 * Site behaviour: sticky nav, scroll reveal, back-to-top, video player.
 * No jQuery. Replaces the old jQuery + WOW.js + Waypoints + Easing + OwlCarousel stack.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- sticky navbar shadow ---------- */
  function stickyNav() {
    var bar = document.querySelector('.fixed-top');
    if (!bar) return;

    var ticking = false;
    function update() {
      var scrolled = window.scrollY > 45;
      bar.classList.toggle('is-scrolled', scrolled);
      // On desktop the top contact bar slides away to reclaim vertical space.
      bar.style.top = (scrolled && window.innerWidth >= 992) ? '-45px' : '0';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  /* ---------- back to top ---------- */
  function backToTop() {
    var btn = document.querySelector('.back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', function () {
      btn.classList.toggle('is-visible', window.scrollY > 300);
    }, { passive: true });

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- scroll reveal (replaces WOW.js + animate.css) ---------- */
  function scrollReveal() {
    var targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) return;

    // Without IntersectionObserver, or with reduced motion, just show everything.
    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-revealed'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.05 });

    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- click-to-play video ---------- */
  function videoPlayer() {
    var video = document.getElementById('video');
    var toggle = document.getElementById('video-toggle');
    if (!video || !toggle) return;

    function syncIcon() {
      var playing = !video.paused && !video.ended;
      toggle.innerHTML =
        '<svg class="icon" aria-hidden="true"><use href="#i-' + (playing ? 'pause' : 'play') + '-fill"></use></svg>';
      toggle.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
      toggle.classList.toggle('is-playing', playing);
    }

    function togglePlay() {
      if (video.paused) {
        // play() rejects if the browser blocks it; don't leave the icon lying.
        var p = video.play();
        if (p && p.catch) p.catch(function () { syncIcon(); });
      } else {
        video.pause();
      }
    }

    toggle.addEventListener('click', togglePlay);
    video.addEventListener('click', togglePlay);
    ['play', 'pause', 'ended'].forEach(function (evt) {
      video.addEventListener(evt, syncIcon);
    });
    syncIcon();
  }

  /* ---------- testimonial scroller ---------- */
  function testimonials() {
    var track = document.querySelector('.testimonial-track');
    if (!track) return;

    document.querySelectorAll('[data-scroll-target]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = track.querySelector('.testimonial-item');
        var step = card ? card.offsetWidth + 24 : track.clientWidth * 0.8;
        var dir = btn.getAttribute('data-scroll-target') === 'next' ? 1 : -1;
        track.scrollBy({ left: step * dir, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });
  }

  /* ---------- collapse (mobile menu) ----------
     Replaces bootstrap.bundle.js. Bootstrap's CSS still supplies the
     .collapse / .show visual states; we only toggle the classes. */
  function collapseToggles() {
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest && e.target.closest('[data-bs-toggle="collapse"]');
      if (!trigger) return;
      e.preventDefault();

      var target = document.querySelector(trigger.getAttribute('data-bs-target'));
      if (!target) return;

      var open = target.classList.toggle('show');
      trigger.setAttribute('aria-expanded', String(open));
      trigger.classList.toggle('collapsed', !open);
    });

    // Tapping a link inside the open mobile menu should close it.
    document.addEventListener('click', function (e) {
      var link = e.target.closest && e.target.closest('.navbar-collapse.show a');
      if (!link) return;
      var panel = link.closest('.navbar-collapse');
      var trigger = document.querySelector('[data-bs-target="#' + panel.id + '"]');
      panel.classList.remove('show');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  }

  /* ---------- pill tabs (product categories) ---------- */
  function pillTabs() {
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest && e.target.closest('[data-bs-toggle="pill"]');
      if (!trigger) return;
      e.preventDefault();

      var pane = document.querySelector(trigger.getAttribute('data-bs-target'));
      if (!pane || trigger.classList.contains('active')) return;

      var nav = trigger.closest('.nav');
      var container = pane.parentElement;

      if (nav) {
        nav.querySelectorAll('[data-bs-toggle="pill"]').forEach(function (btn) {
          btn.classList.remove('active');
          btn.setAttribute('aria-selected', 'false');
        });
      }
      trigger.classList.add('active');
      trigger.setAttribute('aria-selected', 'true');

      container.querySelectorAll(':scope > .tab-pane').forEach(function (p) {
        p.classList.remove('show', 'active');
      });
      pane.classList.add('active');
      // .show on the next frame so the CSS opacity transition actually runs.
      window.requestAnimationFrame(function () {
        pane.classList.add('show');
        // Switching from a tall category to a short one can leave the reader
        // scrolled past the new content, staring at blank space.
        if (pane.getBoundingClientRect().bottom < window.innerHeight * 0.5) {
          if (nav) nav.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        }
      });
    });
  }

  /* ---------- hide the loading spinner ---------- */
  function hideSpinner() {
    var spinner = document.getElementById('spinner');
    if (spinner) spinner.classList.remove('show');
  }

  function init() {
    hideSpinner();
    stickyNav();
    backToTop();
    scrollReveal();
    videoPlayer();
    testimonials();
    collapseToggles();
    pillTabs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
