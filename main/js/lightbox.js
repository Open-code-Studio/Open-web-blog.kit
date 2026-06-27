/* ============================================
   Lightbox — Click image to open img.html viewer
   ============================================ */
(function() {
  'use strict';

  const VIEWER_PAGE = 'img.html';
  const REF_KEY = '__imgViewerRef';

  // Resolve relative image path to server-root-absolute path
  function resolveSrc(img) {
    const src = img.getAttribute('src') || img.currentSrc || '';
    if (!src) return '';

    // Already absolute URL
    if (src.startsWith('http')) return src;

    // Already root-relative
    if (src.startsWith('/')) return src;

    // Resolve relative to current page
    const a = document.createElement('a');
    a.href = src;
    return a.href; // Returns full absolute URL
  }

  // Attach click handlers to all images in a container
  function bindImages(container) {
    if (!container) return;
    container.addEventListener('click', function(e) {
      const img = e.target.closest('img');
      if (!img) return;

      // Only handle content images, skip icons/svgs
      if (img.tagName !== 'IMG') return;
      if (img.closest('nav') || img.closest('button')) return;
      if (img.classList.contains('icon-button')) return;

      const src = resolveSrc(img);
      if (!src) return;

      e.preventDefault();
      e.stopPropagation();

      // Store referrer
      sessionStorage.setItem(REF_KEY, window.location.href);

      // Navigate to viewer
      window.location.href = VIEWER_PAGE + '#src=' + encodeURIComponent(src);
    });
  }

  // Apply to known image containers
  function init() {
    // Moment page images
    const list = document.getElementById('momentsPageList');
    if (list) bindImages(list);

    // Homepage moment images (in momentsWrapper)
    const wrapper = document.getElementById('momentsWrapper');
    if (wrapper) bindImages(wrapper);

    // Article content images
    const docBody = document.getElementById('docBody');
    if (docBody) bindImages(docBody);

    // Also watch for dynamically added content
    const main = document.querySelector('.main-content');
    if (main) bindImages(main);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
