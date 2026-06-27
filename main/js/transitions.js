/* ============================================
   Page Transitions - Smooth Navigation
   ============================================ */
(function() {
  'use strict';

  const EXIT_DURATION = 280; // ms, slightly longer than CSS exit to ensure completion
  const STAGGER_BASE = 80;   // ms base delay between stagger items

  // Page order for determining slide direction
  const PAGE_ORDER = ['index.html', 'page.html', 'moment.html', 'link.html', 'about.html'];

  // Check if this is a fresh page load (not bfcache restore)
  let isFreshLoad = true;

  // Get current page filename
  function currentPageName() {
    const path = window.location.pathname;
    const name = path.split('/').pop() || 'index.html';
    // Normalize: remove trailing slash etc
    return name || 'index.html';
  }

  // Determine slide direction by comparing previous and current page positions
  function getSlideDirection() {
    const prev = sessionStorage.getItem('__prevPage');
    const curr = currentPageName();
    if (!prev) return 'right'; // first visit or direct URL access, default slide from right
    const prevIdx = PAGE_ORDER.indexOf(prev);
    const currIdx = PAGE_ORDER.indexOf(curr);
    if (prevIdx === -1 || currIdx === -1) return 'right';
    return currIdx > prevIdx ? 'right' : 'left';
  }

  // === Entrance: run on page load ===
  function runEntrance() {
    // Remove any stale exit state
    document.body.classList.remove('is-exiting');
    document.documentElement.classList.add('smooth-scroll');

    // Position nav slider immediately (before other animations)
    positionNavSlider();

    // Determine and set slide direction
    const direction = getSlideDirection();
    const enteringEl = document.body.classList.contains('page-entering') ? document.body : document.body;
    enteringEl.classList.add('page-entering');
    enteringEl.setAttribute('data-slide', direction);

    // Clear prevPage after reading (avoid stale on refresh)
    sessionStorage.removeItem('__prevPage');
    sessionStorage.removeItem('__navActiveIdx');

    // After entrance animation, start staggering content
    const contentDelay = 120;
    setTimeout(() => {
      staggerContent();
    }, contentDelay);

    // Clean up entrance class (keep data-slide for potential reuse)
    setTimeout(() => {
      document.body.classList.remove('page-entering');
      document.body.classList.remove('is-entering');
    }, 700);
  }

  // === Nav Slider: animated pill indicator ===
  function positionNavSlider() {
    const linksContainer = document.querySelector('.floating-nav__links');
    const slider = document.querySelector('.nav-slider');
    if (!linksContainer || !slider) return;

    const activeLink = linksContainer.querySelector('.floating-nav__link.active');
    const allLinks = linksContainer.querySelectorAll('.floating-nav__link');
    if (!activeLink || !allLinks.length) {
      slider.classList.add('ready');
      return;
    }

    // Target: where the slider should end up
    const targetLeft = activeLink.offsetLeft;
    const targetWidth = activeLink.offsetWidth;

    // Start: where the slider should begin (from previous page's active link)
    const storedIdx = sessionStorage.getItem('__navActiveIdx');
    const prevIdx = storedIdx !== null ? parseInt(storedIdx, 10) : null;
    let startLeft = targetLeft;
    let startWidth = targetWidth;
    let hasPrev = false;

    if (prevIdx !== null && prevIdx >= 0 && prevIdx < allLinks.length) {
      const prevLink = allLinks[prevIdx];
      if (prevLink && prevLink !== activeLink) {
        startLeft = prevLink.offsetLeft;
        startWidth = prevLink.offsetWidth;
        hasPrev = true;
      }
    }

    // Position at start (no transition)
    slider.style.transition = 'none';
    slider.style.left = startLeft + 'px';
    slider.style.width = startWidth + 'px';

    // Make visible now that it's positioned
    slider.classList.add('ready');

    if (hasPrev) {
      // Force reflow to apply the start position
      slider.offsetHeight;

      // Animate to target
      slider.style.transition = 'left 0.35s cubic-bezier(0.05, 0.7, 0.1, 1), width 0.35s cubic-bezier(0.05, 0.7, 0.1, 1)';
      slider.style.left = targetLeft + 'px';
      slider.style.width = targetWidth + 'px';
    } else {
      // No previous position: just place at target with a quick fade in
      setTimeout(() => {
        slider.style.transition = 'left 0.35s cubic-bezier(0.05, 0.7, 0.1, 1), width 0.35s cubic-bezier(0.05, 0.7, 0.1, 1)';
        slider.style.left = targetLeft + 'px';
        slider.style.width = targetWidth + 'px';
      }, 10);
    }
  }

  // Track already animated items to avoid re-animation
  let animatedSet = new WeakSet();
  let staggerIndex = 0;

  // Stagger selectors: structural containers first, then content cards
  const STAGGER_SELECTORS = [
    '.blog-hero',
    '.blog-hero__icon',
    '.blog-hero__title',
    '.blog-hero__subtitle',
    '.blog-hero__stats',
    '.topic-cards-section',
    '.tag-filter-section',
    '.blog-posts-section__header',
    '.page-title',
    '.page-desc',
    '.doc-header',
    '.doc-article',
    '.topic-card',
    '.tag-pill',
    '.post-card',
    '.link-card',
    '.about-card',
    '.moment-item',
    '.moment-card',
  ];

  // === Stagger: fade in sections/cards one by one ===
  function staggerContent(container) {
    const scope = container || document;
    const newItems = [];

    STAGGER_SELECTORS.forEach(selector => {
      const els = scope.querySelectorAll(selector);
      els.forEach(el => {
        if (animatedSet.has(el)) return;
        animatedSet.add(el);
        if (!el.classList.contains('stagger-item')) {
          el.classList.add('stagger-item');
        }
        newItems.push(el);
      });
    });

    // Animate new items with stagger delay
    newItems.forEach((el, i) => {
      const delay = (staggerIndex + i) * STAGGER_BASE;
      setTimeout(() => {
        el.classList.add('visible');
      }, delay);
    });

    staggerIndex += newItems.length;
    return newItems.length;
  }

  // Watch for dynamically added content and auto-stagger
  function observeDynamicContent() {
    const target = document.querySelector('.main-content') || document.body;
    const observer = new MutationObserver((mutations) => {
      let hasNew = false;
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            // Check if the added node or its children match stagger selectors
            const matches = STAGGER_SELECTORS.some(s => node.matches?.(s) || node.querySelector?.(s));
            if (matches) hasNew = true;
          }
        });
      });
      if (hasNew) {
        setTimeout(() => staggerContent(), 50);
      }
    });
    observer.observe(target, { childList: true, subtree: true });
  }

  // Public re-stagger for manual trigger after dynamic rendering
  window.__reStagger = function() {
    animatedSet = new WeakSet();
    staggerIndex = 0;
    staggerContent();
  };

  // === Exit: intercept navigation, animate out, then go ===
  function handleNavClick(e) {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Only handle internal navigation (not external links, not hash-only)
    if (href.startsWith('http') || href.startsWith('//') || href.startsWith('#')) {
      // For hash links on the same page, smooth scroll
      if (href.startsWith('#') && href.length > 1) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          history.pushState(null, '', href);
        }
      }
      return;
    }

    // Skip if it's a download or has target="_blank"
    if (link.hasAttribute('download') || link.getAttribute('target') === '_blank') return;

    // Skip if linking to the same page (just the current filename)
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (href === currentPage || href === './' + currentPage) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Intercept: prevent default, animate out, then navigate
    e.preventDefault();

    // Store current page for direction detection on the next page
    sessionStorage.setItem('__prevPage', currentPageName());

    // Store active nav link index for slider animation
    const activeNavLink = document.querySelector('.floating-nav__link.active');
    if (activeNavLink) {
      const allNavLinks = document.querySelectorAll('.floating-nav__link');
      const idx = Array.from(allNavLinks).indexOf(activeNavLink);
      if (idx >= 0) sessionStorage.setItem('__navActiveIdx', idx);
    }

    document.body.classList.add('is-exiting');

    setTimeout(() => {
      window.location.href = href;
    }, EXIT_DURATION);
  }

  // === Handle browser back/forward ===
  function handlePageShow(e) {
    if (e.persisted) {
      // bfcache restore: re-run entrance
      isFreshLoad = true;
      runEntrance();
    }
  }

  // === Init ===
  function init() {
    // Bind navigation interception
    document.addEventListener('click', handleNavClick);

    // Handle bfcache
    window.addEventListener('pageshow', handlePageShow);

    // Watch for dynamically rendered content
    observeDynamicContent();

    // Run entrance animation
    if (isFreshLoad) {
      runEntrance();
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
