/* ============================================
   Open Web Blog - Home Page
   ============================================ */
(function() {
  'use strict';

  const ROUTES = {};
  let SITE = { name:'Open Web Blog', titleSuffix:'博客', docDir:'../page' };
  let NAV = [];
  let activeFilter = 'all';
  let themeColor = '#4AA26F';

  // === Dynamic Theme Color from config ===
  function applyThemeColor(hex) {
    if (!hex) return;
    themeColor = hex;
    const root = document.documentElement;
    root.style.setProperty('--owb-primary', hex);
    // Derive light/dark tones using simple luminance math
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    const lum = 0.299*r + 0.587*g + 0.114*b;
    const isLight = document.documentElement.getAttribute('data-theme') !== 'dark';
    // Primary: slightly darker for light, lighter for dark
    const factor = isLight ? 0.75 : 1.4;
    const pr = Math.min(255, Math.round(r * factor));
    const pg = Math.min(255, Math.round(g * factor));
    const pb = Math.min(255, Math.round(b * factor));
    const primaryHex = '#' + [pr,pg,pb].map(v => v.toString(16).padStart(2,'0')).join('');
    root.style.setProperty('--md-sys-color-primary', primaryHex);
    // Container: very light tint
    const cr = Math.round(r + (255-r)*0.75), cg = Math.round(g + (255-g)*0.75), cb = Math.round(b + (255-b)*0.75);
    root.style.setProperty('--md-sys-color-primary-container', '#'+[cr,cg,cb].map(v=>v.toString(16).padStart(2,'0')).join(''));
    root.style.setProperty('--md-sys-color-surface-tint', primaryHex);
  }

  async function loadConfig() {
    try {
      const resp = await fetch('config.json');
      if (!resp.ok) return;
      const cfg = await resp.json();
      if (cfg.site) {
        Object.assign(SITE, cfg.site);
        if (cfg.site.themeColor) applyThemeColor(cfg.site.themeColor);
      }
      if (cfg.nav && Array.isArray(cfg.nav)) {
        NAV = cfg.nav;
        const nr = {};
        function processNav(items, parentRoute) {
          items.forEach(item => {
            const tag = (item.title || item.file || '').toLowerCase();
            const autoSlug = tag.replace(/[\u4e00-\u9fff]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || tag.replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');
            const route = item.route || (parentRoute ? parentRoute + '/' : '/') + autoSlug;
            item.route = route;
            const slug = route.split('/').pop();
            let file = item.file;
            if (!file) file = route === '/' ? 'README.md' : route.replace(/^\//, '') + '.md';
            nr[route] = { file, title: item.title, icon: item.icon || 'book', date: item.date || '', excerpt: item.excerpt || '', tags: item.tags || [] };
            if (item.children) processNav(item.children, route);
          });
        }
        processNav(cfg.nav);
        Object.assign(ROUTES, nr);
      }
    } catch (e) { console.warn('config.json load failed:', e.message); }
  }

  const $ = (sel) => document.querySelector(sel);
  const postList = $('#postList');
  const themeToggle = $('#themeToggle');
  const themeIcon = $('#themeIcon');
  const scrollTopBtn = $('#scrollTop');
  const heroPostCount = $('#postCount');
  const heroTagCount = $('#tagCount');
  const heroTotalWords = $('#totalWords');
  const topicCardsWrapper = $('.topic-cards-wrapper');
  const tagFilterList = $('#tagFilterList');
  const sectionTitleText = $('#sectionTitleText');
  const filteredCount = $('#filteredCount');

  // === Theme ===
  function getPreferredTheme() {
    const stored = localStorage.getItem('owb-theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('owb-theme', theme);
    const isDark = theme === 'dark';
    if (themeIcon) themeIcon.innerHTML = isDark
      ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
      : '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
  }
  function toggleTheme() {
    const html = document.documentElement;
    html.classList.add('transitioning');
    setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    if (themeColor) setTimeout(() => applyThemeColor(themeColor), 50);
    setTimeout(() => html.classList.remove('transitioning'), 300);
  }
  setTheme(getPreferredTheme());
  themeToggle.addEventListener('click', toggleTheme);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('owb-theme')) setTheme(e.matches ? 'dark' : 'light');
  });

  // === Scroll ===
  window.addEventListener('scroll', () => { scrollTopBtn.classList.toggle('visible', window.scrollY > 300); }, { passive: true });
  scrollTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  // === Render Home Page ===
  function renderHomePage(filterTag) {
    if (!filterTag) filterTag = activeFilter || 'all';
    activeFilter = filterTag;

    const allPosts = NAV.filter(item => !item.children);
    const tagCounts = {};
    allPosts.forEach(p => {
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
      }
    });
    const allTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);
    const posts = filterTag === 'all' ? allPosts : allPosts.filter(p => p.tags && p.tags.includes(filterTag));

    if (heroPostCount) heroPostCount.textContent = allPosts.length;
    if (heroTagCount) heroTagCount.textContent = allTags.length > 0 ? allTags.length : allPosts.length;
    if (heroTotalWords) heroTotalWords.textContent = allPosts.length * 200 + '+';

    // Topic Cards
    if (topicCardsWrapper) {
      const topicIcons = {
        'all': '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
        '前端': '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/>',
        'JavaScript': '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
        '设计': '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>',
        '技巧': '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
        '博客': '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h6"/><path d="M8 11h8"/>',
        '随笔': '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
      };
      const topTags = allTags.slice(0, 4);
      const topicHTML = topTags.map(tag => {
        const icon = topicIcons[tag] || topicIcons['all'];
        const count = tagCounts[tag];
        return `<a class="topic-card${filterTag === tag ? ' active' : ''}" data-tag="${tag}" href="#">
          <span class="topic-card__icon"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${icon}</svg></span>
          <span class="topic-card__label">${tag} <small style="opacity:0.6">${count}</small></span>
        </a>`;
      }).join('');

      topicCardsWrapper.innerHTML = `
        <a class="topic-card topic-card--all${filterTag === 'all' ? ' active' : ''}" data-tag="all" href="#">
          <span class="topic-card__icon"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${topicIcons['all']}</svg></span>
          <span class="topic-card__label">全部文章 <small style="opacity:0.6">${allPosts.length}</small></span>
        </a>${topicHTML}`;
    }

    // Tag Pills
    if (tagFilterList) {
      tagFilterList.innerHTML = `
        <span class="tag-pill${filterTag === 'all' ? ' active' : ''}" data-tag="all">全部<span class="tag-pill__count">${allPosts.length}</span></span>
        ${allTags.map(tag => `<span class="tag-pill${filterTag === tag ? ' active' : ''}" data-tag="${tag}">${tag}<span class="tag-pill__count">${tagCounts[tag]}</span></span>`).join('')}`;
    }

    if (sectionTitleText) sectionTitleText.textContent = filterTag === 'all' ? '最新文章' : `# ${filterTag}`;
    if (filteredCount) filteredCount.textContent = `共 ${posts.length} 篇`;

    // Post List
    if (posts.length === 0) {
      postList.innerHTML = `<div class="empty-state">
        <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        <h3>暂无此分类的文章</h3><p>尝试选择其他标签查看</p>
      </div>`;
      return;
    }

    postList.innerHTML = posts.map(post => {
      const tagsHtml = post.tags && post.tags.length
        ? post.tags.map(t => `<span class="post-card__tag">${t}</span>`).join('')
        : '';
      return `
        <a class="post-card" href="page.html#${post.route}">
          <div class="post-card__title">${post.title}</div>
          <div class="post-card__excerpt">${post.excerpt || '点击阅读全文...'}</div>
          <div class="post-card__meta">
            ${post.date ? `<span class="post-card__meta-item">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${post.date}
            </span>` : ''}
            <span class="post-card__meta-item">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              阅读文章
            </span>
            ${tagsHtml ? `<span style="display:flex;gap:6px;flex-wrap:wrap">${tagsHtml}</span>` : ''}
            <span class="post-card__read-btn">
              阅读<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </span>
          </div>
        </a>`;
    }).join('');
  }

  // === Filter Handlers ===
  function bindFilterHandlers() {
    if (topicCardsWrapper && !topicCardsWrapper._bound) {
      topicCardsWrapper._bound = true;
      topicCardsWrapper.addEventListener('click', (e) => {
        const card = e.target.closest('.topic-card');
        if (!card) return;
        e.preventDefault();
        renderHomePage(card.dataset.tag);
      });
    }
    if (tagFilterList && !tagFilterList._bound) {
      tagFilterList._bound = true;
      tagFilterList.addEventListener('click', (e) => {
        const pill = e.target.closest('.tag-pill');
        if (!pill) return;
        renderHomePage(pill.dataset.tag);
      });
    }
  }

  async function init() {
    await loadConfig();
    bindFilterHandlers();
    renderHomePage();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
