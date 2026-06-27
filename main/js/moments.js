/* ============================================
   Moments Loader & Renderer
   Fetches moment/config.json and renders cards
   ============================================ */
(function() {
  'use strict';

  const MOMENT_DIR = '../moment';
  const MAX_TEXT = 100;
  const MAX_IMAGES = 10;

  // Image load error fallback
  const FALLBACK_ICON = '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';

  const $ = (sel) => document.querySelector(sel);

  // === Render a single moment card ===
  function renderMomentCard(moment, index) {
    // Truncate text to MAX_TEXT
    let text = (moment.text || '').trim();
    if (text.length > MAX_TEXT) {
      text = text.slice(0, MAX_TEXT - 1) + '…';
    }

    // Images: support up to MAX_IMAGES, handle local and remote URLs
    const images = (moment.images || []).slice(0, MAX_IMAGES);
    let imagesHTML = '';

    if (images.length > 0) {
      // Determine grid class based on image count
      let gridClass;
      if (images.length === 1) gridClass = 'moment-card__images--1';
      else if (images.length === 2) gridClass = 'moment-card__images--2';
      else if (images.length === 3) gridClass = 'moment-card__images--3';
      else if (images.length === 4) gridClass = 'moment-card__images--4';
      else gridClass = 'moment-card__images--many';

      const imgsHTML = images.map(img => {
        // Support both relative paths (moment/images/xxx) and absolute URLs
        const src = img.startsWith('http') ? img : `${MOMENT_DIR}/images/${img}`;
        return `<img class="moment-card__img" src="${escapeHtml(src)}" alt="" loading="lazy">`;
      }).join('');

      imagesHTML = `<div class="moment-card__images ${gridClass}">${imgsHTML}</div>`;
    }

    return `
      <div class="moment-card">
        <div class="moment-card__text">${escapeHtml(text)}</div>
        ${imagesHTML}
        <div class="moment-card__footer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>${escapeHtml(moment.date || '')}</span>
        </div>
      </div>`;
  }

  // === Render the entire moments section ===
  function renderMoments(moments) {
    const section = $('#momentsSection');
    const wrapper = $('#momentsWrapper');
    const countEl = $('#momentsCount');
    const descEl = $('#momentsDesc');

    if (!section || !wrapper) return;

    if (!moments || !moments.length) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';

    if (countEl) countEl.textContent = `共 ${moments.length} 条`;
    if (descEl) descEl.style.display = 'none';

    // Sort by date descending
    const sorted = [...moments].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    wrapper.innerHTML = sorted.map((m, i) => renderMomentCard(m, i)).join('');

    // Delegate image error handling for homepage cards
    wrapper.addEventListener('error', function(e) {
      const img = e.target;
      if (img.classList && img.classList.contains('moment-card__img')) {
        const placeholder = document.createElement('div');
        placeholder.className = 'moment-card__img-placeholder';
        placeholder.innerHTML = FALLBACK_ICON;
        img.replaceWith(placeholder);
      }
    }, true);
  }

  // === Load moments from config ===
  async function loadMoments() {
    try {
      const resp = await fetch(`${MOMENT_DIR}/config.json`);
      if (!resp.ok) {
        console.log('[Moments] Config not found, moments disabled.');
        return;
      }
      const cfg = await resp.json();
      if (!cfg.enabled) {
        console.log('[Moments] Feature disabled in config.');
        return;
      }

      console.log(`[Moments] Loaded ${cfg.moments?.length || 0} moment(s).`);
      renderMoments(cfg.moments || []);
    } catch (e) {
      console.warn('[Moments] Load failed:', e.message);
    }
  }

  // === Init ===
  function init() {
    loadMoments();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // === Utility ===
  function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text || '';
    return d.innerHTML;
  }
})();
