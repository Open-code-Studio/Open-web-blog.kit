/* ============================================
   Open Web Blog - Article Page with Sidebar
   ============================================ */
(function() {
  'use strict';

  const ROUTES = {};
  let SITE = { name:'Open Web Blog', titleSuffix:'博客', docDir:'../page' };
  let NAV = [];
  let themeColor = '#4AA26F';
  const DEFAULT_ROUTE = '/';

  function applyThemeColor(hex) {
    if (!hex) return;
    themeColor = hex;
    const root = document.documentElement;
    root.style.setProperty('--owb-primary', hex);
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    const isLight = document.documentElement.getAttribute('data-theme') !== 'dark';
    const factor = isLight ? 0.75 : 1.4;
    const pr = Math.min(255, Math.round(r * factor));
    const pg = Math.min(255, Math.round(g * factor));
    const pb = Math.min(255, Math.round(b * factor));
    root.style.setProperty('--md-sys-color-primary', '#'+[pr,pg,pb].map(v=>v.toString(16).padStart(2,'0')).join(''));
    const cr = Math.round(r+(255-r)*0.75), cg = Math.round(g+(255-g)*0.75), cb = Math.round(b+(255-b)*0.75);
    root.style.setProperty('--md-sys-color-primary-container', '#'+[cr,cg,cb].map(v=>v.toString(16).padStart(2,'0')).join(''));
    root.style.setProperty('--md-sys-color-surface-tint', '#'+[pr,pg,pb].map(v=>v.toString(16).padStart(2,'0')).join(''));
  }

  const ICONS = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h6"/><path d="M8 11h8"/>',
    code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    tags: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  };
  function iconSVG(name) { return ICONS[name] || ICONS.book; }

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
            nr[route] = { file, title: item.title, icon: item.icon || 'book', date: item.date || '', tags: item.tags || [] };
            if (item.children) processNav(item.children, route);
          });
        }
        processNav(cfg.nav);
        Object.assign(ROUTES, nr);
      }
    } catch (e) { console.warn('config.json load failed:', e.message); }
  }

  function renderSidebar() {
    if (!NAV.length) return;
    function buildHTML(items, depth) {
      return items.map(item => {
        const hasKids = item.children && item.children.length;
        const route = hasKids ? null : item.route;
        const pad = depth * 16;
        let html = '';
        if (hasKids) {
          html += `<li class="nav-category" style="padding-left:${pad}px;font-size:11px;font-weight:600;color:var(--md-sys-color-on-surface-variant);padding-top:12px;padding-bottom:4px;text-transform:uppercase;letter-spacing:0.05em;">${item.title}</li>`;
          html += buildHTML(item.children, depth + 1);
        } else {
          html += `<li class="nav-item" data-route="#${route}" style="padding-left:${pad}px;">
            <a href="#${route}" class="nav-link">
              <svg viewBox="0 0 24 24" width="20" height="20" class="nav-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconSVG(item.icon || 'book')}</svg>
              <span class="nav-label">${item.title}</span>
            </a>
          </li>`;
        }
        return html;
      }).join('');
    }
    navList.innerHTML = buildHTML(NAV, 0);
  }

  const $ = (sel) => document.querySelector(sel);
  const docTitle = $('#docTitle');
  const docBody = $('#docBody');
  const docMeta = $('#docMeta');
  const navList = $('#navList');
  const sidebar = $('#sidebar');
  const drawerOverlay = $('#drawerOverlay');
  const menuToggle = $('#menuToggle');
  const themeToggle = $('#themeToggle');
  const themeIcon = $('#themeIcon');
  const scrollTopBtn = $('#scrollTop');
  const tocList = $('#tocList');
  const tocSidebar = $('#tocSidebar');

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
    themeIcon.innerHTML = isDark
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
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('owb-theme')) setTheme(e.matches ? 'dark' : 'light');
  });
  themeToggle.addEventListener('click', toggleTheme);

  // === Sidebar ===
  function openDrawer() { sidebar.classList.add('open'); drawerOverlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
  function closeDrawer() { sidebar.classList.remove('open'); drawerOverlay.classList.remove('active'); document.body.style.overflow = ''; }
  menuToggle.addEventListener('click', () => { sidebar.classList.contains('open') ? closeDrawer() : openDrawer(); });
  drawerOverlay.addEventListener('click', closeDrawer);
  navList.addEventListener('click', (e) => { if (window.innerWidth <= 768) closeDrawer(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sidebar.classList.contains('open')) closeDrawer(); });

  // === Scroll ===
  window.addEventListener('scroll', () => { scrollTopBtn.classList.toggle('visible', window.scrollY > 300); }, { passive: true });
  scrollTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  function updateActiveNav(route) {
    navList.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.route === '#' + route);
    });
  }

  // === TOC ===
  function generateTOC(contentElement) {
    tocList.innerHTML = '';
    const headings = contentElement.querySelectorAll('h2, h3');
    if (!headings.length) { if (tocSidebar) tocSidebar.style.display = 'none'; return; }
    if (tocSidebar) tocSidebar.style.display = 'block';
    headings.forEach((heading, i) => {
      if (!heading.id) heading.id = `s-${i}`;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${heading.id}`; a.textContent = heading.textContent;
      a.className = heading.tagName === 'H3' ? 'toc-h3' : 'toc-h2';
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const el = document.getElementById(heading.id);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); history.replaceState(null, '', `#${heading.id}`); }
      });
      li.appendChild(a); tocList.appendChild(li);
    });
  }

  function escapeHtml(text) { const d = document.createElement('div'); d.textContent = text; return d.innerHTML; }

  function getReadingTime(text) {
    const words = text.replace(/[^\u4e00-\u9fff\w]/g, ' ').split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 300));
    return `${minutes} 分钟阅读`;
  }

  function preprocessMarkdown(md) {
    md = md.replace(/<!--\s*#(?:BEGIN|END)\s+\w+\s*-->/g, '');
    md = md.replace(/<!--\s*#PROPERTY.*?-->/g, '');
    md = md.replace(/<div align="center">[\s\S]*?<\/div>/g, '');
    md = md.replace(/\n{3,}/g, '\n\n');
    return md.trim();
  }

  // === Load Article ===
  async function loadArticle(route) {
    const config = ROUTES[route];
    if (!config) return;

    docTitle.textContent = config.title;
    document.title = `${config.title} - ${SITE.titleSuffix}`;
    docBody.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>加载文章中...</p></div>';
    docMeta.innerHTML = '';
    tocList.innerHTML = '';
    if (tocSidebar) tocSidebar.style.display = 'none';
    updateActiveNav(route);

    try {
      const response = await fetch(`${SITE.docDir}/${config.file}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const rawText = await response.text();

      let md = preprocessMarkdown(rawText);
      const renderer = new marked.Renderer();
      renderer.heading = function({ text, depth }) {
        const slug = text.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-+|-+$/g, '');
        return `<h${depth} id="${slug}"><a class="heading-anchor" href="#${slug}" aria-hidden="true">#</a>${text}</h${depth}>`;
      };
      renderer.code = function({ text, lang }) {
        const language = lang || '';
        const validLang = language && hljs.getLanguage(language) ? language : '';
        const highlighted = validLang ? hljs.highlight(text, { language: validLang }).value : escapeHtml(text);
        return `<pre data-language="${language}"><code class="hljs${validLang?' language-'+validLang:''}">${highlighted}</code></pre>`;
      };
      renderer.link = function({ href, tokens }) {
        const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
        return `<a href="${href}"${isExternal?' target="_blank" rel="noopener noreferrer"':''}>${this.parser.parseInline(tokens)}</a>`;
      };
      marked.use({ renderer, breaks: true, gfm: true });
      docBody.innerHTML = marked.parse(md);
      generateTOC(docBody);

      const readingTime = getReadingTime(rawText);
      const dateStr = config.date || new Date().toISOString().split('T')[0];
      const tagsHtml = config.tags && config.tags.length
        ? config.tags.map(t => `<span class="post-card__tag">${t}</span>`).join('')
        : '';
      docMeta.innerHTML = `
        <span class="doc-meta-item">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          ${dateStr}
        </span>
        <span class="doc-meta-item">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${readingTime}
        </span>
        ${tagsHtml}
      `;
      window.scrollTo({ top: 0 });
    } catch (err) {
      docMeta.innerHTML = '';
      docBody.innerHTML = `<div class="loading-state"><p>加载失败: ${err.message}</p></div>`;
    }
  }

  // === Router ===
  function handleRoute() {
    const hash = window.location.hash.slice(1);
    if (hash && hash.startsWith('/')) {
      // Skip extension routes — handled by extensions.js
      if (hash.startsWith('/ext/')) return;
      loadArticle(hash);
    } else if (!hash) {
      // No hash = default first article
      const first = NAV.filter(i => !i.children)[0];
      if (first) window.location.hash = '#' + first.route;
    }
  }
  window.addEventListener('hashchange', handleRoute);

  async function init() {
    await loadConfig();
    renderSidebar();
    if (window.location.hash && window.location.hash !== '#') handleRoute();
    else {
      const first = NAV.filter(i => !i.children)[0];
      if (first) window.location.hash = '#' + first.route;
    }
  }

  function waitForDeps() {
    if (typeof marked !== 'undefined' && typeof hljs !== 'undefined') init();
    else setTimeout(waitForDeps, 100);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', waitForDeps);
  else waitForDeps();
})();
