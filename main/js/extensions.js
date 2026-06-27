/* ============================================
   Extension System Loader
   Loads enabled extensions: CSS, pages, scripts
   ============================================ */
(function() {
  'use strict';

  const EXPAND_DIR = '../expand';
  const EXT_PAGE_PREFIX = '/ext/';

  // Store loaded extension data
  window.__EXTENSIONS = {
    loaded: [],
    pages: {},    // { 'ext-id/file': { title, extId, file, ... } }
    styles: []    // list of injected <link> elements
  };

  // Generic SVG icons for extension pages
  const EXT_ICONS = {
    code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h6"/><path d="M8 11h8"/>',
    puzzle: '<path d="M20.5 10.5l-2-2 2-2"/><path d="M3.5 13.5l2 2-2 2"/><path d="M12 2l2 2-2 2"/><path d="M12 22l2-2-2-2"/><circle cx="12" cy="12" r="1"/>',
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'
  };

  function iconSVG(name) {
    return EXT_ICONS[name] || EXT_ICONS.puzzle;
  }

  // === Fetch master config ===
  async function loadMasterConfig() {
    try {
      const resp = await fetch(`${EXPAND_DIR}/config.json`);
      if (!resp.ok) return null;
      return await resp.json();
    } catch (e) {
      console.warn('[Extensions] Cannot load expand/config.json:', e.message);
      return null;
    }
  }

  // === Fetch individual extension config ===
  async function loadExtConfig(extId) {
    try {
      const resp = await fetch(`${EXPAND_DIR}/${extId}/config.json`);
      if (!resp.ok) return null;
      return await resp.json();
    } catch (e) {
      console.warn(`[Extensions] Cannot load ${extId}/config.json:`, e.message);
      return null;
    }
  }

  // === Inject CSS file ===
  function injectCSS(extId, cssFile) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${EXPAND_DIR}/${extId}/${cssFile}`;
    link.setAttribute('data-ext', extId);
    link.onerror = () => console.warn(`[Extensions] Cannot load ${extId}/${cssFile}`);
    document.head.appendChild(link);
    window.__EXTENSIONS.styles.push(link);
  }

  // === Inject JS file ===
  function injectScript(extId, jsFile) {
    const script = document.createElement('script');
    script.src = `${EXPAND_DIR}/${extId}/${jsFile}`;
    script.setAttribute('data-ext', extId);
    script.defer = true;
    script.onerror = () => console.warn(`[Extensions] Cannot load ${extId}/${jsFile}`);
    document.body.appendChild(script);
  }

  // === Register extension pages for routing ===
  function registerPages(extId, extConfig) {
    if (!extConfig.pages || !extConfig.pages.length) return;

    extConfig.pages.forEach(page => {
      const routeKey = `${extId}/${page.file}`;
      const route = `${EXT_PAGE_PREFIX}${routeKey}`;
      window.__EXTENSIONS.pages[routeKey] = {
        route: route,
        extId: extId,
        file: page.file,
        title: page.title || extConfig.name,
        navTitle: page.navTitle || page.title || extConfig.name,
        icon: page.icon || 'puzzle',
        date: page.date || '',
        tags: page.tags || [],
        excerpt: page.excerpt || ''
      };
    });
  }

  // === Add extension nav links to floating nav ===
  function addNavLinks() {
    const linksContainer = document.querySelector('.floating-nav__links');
    if (!linksContainer) return;

    const pages = Object.values(window.__EXTENSIONS.pages);
    if (!pages.length) return;

    pages.forEach(page => {
      // Check if already added
      if (linksContainer.querySelector(`[data-ext-nav="${page.extId}"]`)) return;

      const a = document.createElement('a');
      a.href = `page.html#${page.route}`;
      a.className = 'floating-nav__link';
      a.setAttribute('data-ext-nav', page.extId);
      a.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconSVG(page.icon)}</svg>
        ${page.navTitle}
      `;
      linksContainer.appendChild(a);
    });
  }

  // === Add extension items to sidebar (page.html) ===
  function addSidebarItems() {
    const navList = document.getElementById('navList');
    if (!navList) return;

    const pages = Object.values(window.__EXTENSIONS.pages);
    if (!pages.length) return;

    // Add extension section label
    const label = document.createElement('div');
    label.className = 'sidebar__section-label';
    label.textContent = '扩展';
    label.setAttribute('data-ext-section', '');
    navList.appendChild(label);

    pages.forEach(page => {
      const li = document.createElement('li');
      li.className = 'nav-item';
      li.setAttribute('data-route', `#${page.route}`);
      li.innerHTML = `
        <a href="#${page.route}" class="nav-link">
          <svg viewBox="0 0 24 24" width="20" height="20" class="nav-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconSVG(page.icon)}</svg>
          <span class="nav-label">${page.navTitle}</span>
        </a>
      `;
      navList.appendChild(li);
    });
  }

  // === Handle extension page route ===
  function handleExtRoute(route) {
    // route format: /ext/ext-id/file.html
    const parts = route.replace(EXT_PAGE_PREFIX, '').split('/');
    if (parts.length < 2) return false;

    const extId = parts[0];
    const fileName = parts.slice(1).join('/');
    const routeKey = `${extId}/${fileName}`;
    const page = window.__EXTENSIONS.pages[routeKey];
    if (!page) return false;

    loadExtPage(page);
    return true;
  }

  // === Load and render extension page ===
  async function loadExtPage(page) {
    const docTitle = document.getElementById('docTitle');
    const docBody = document.getElementById('docBody');
    const docMeta = document.getElementById('docMeta');
    const tocSidebar = document.getElementById('tocSidebar');

    // Update title
    if (docTitle) docTitle.textContent = page.title;
    document.title = `${page.title} - 博客`;

    // Update meta
    if (docMeta) {
      const tagsHtml = page.tags && page.tags.length
        ? page.tags.map(t => `<span class="post-card__tag">${t}</span>`).join('')
        : '';
      docMeta.innerHTML = `
        <span class="doc-meta-item">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          ${page.date || ''}
        </span>
        <span class="doc-meta-item">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
          扩展
        </span>
        ${tagsHtml}
      `;
    }

    // Hide TOC
    if (tocSidebar) tocSidebar.style.display = 'none';

    // Show loading
    if (docBody) docBody.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>加载扩展页面...</p></div>';

    // Fetch extension page HTML
    try {
      const url = `${EXPAND_DIR}/${page.extId}/${page.file}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const html = await resp.text();
      if (docBody) docBody.innerHTML = html;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (docBody) docBody.innerHTML = `<div class="loading-state"><p>加载扩展页面失败: ${err.message}</p></div>`;
    }
  }

  // === Update active nav state ===
  function updateActiveNav(route) {
    // Clear all active states in floating nav
    document.querySelectorAll('.floating-nav__link').forEach(link => {
      link.classList.remove('active');
    });

    // If it's an extension route, activate the matching ext nav link
    const pages = Object.values(window.__EXTENSIONS.pages);
    const activePage = pages.find(p => p.route === route);
    if (activePage) {
      const extNavLink = document.querySelector(`[data-ext-nav="${activePage.extId}"]`);
      if (extNavLink) extNavLink.classList.add('active');
    }
  }

  // === Watch for hash changes to handle extension routes ===
  function watchRouting() {
    function checkRoute() {
      const hash = window.location.hash.slice(1);
      if (hash && hash.startsWith(EXT_PAGE_PREFIX)) {
        updateActiveNav(hash);
        handleExtRoute(hash);
      }
    }

    window.addEventListener('hashchange', checkRoute);
    // Initial check
    if (window.location.hash) checkRoute();
  }

  // === Main loader ===
  async function loadExtensions() {
    const masterConfig = await loadMasterConfig();
    if (!masterConfig || !masterConfig.extensions) {
      console.log('[Extensions] No extensions configured.');
      return;
    }

    const extensions = masterConfig.extensions;
    const enabledIds = Object.keys(extensions).filter(id => extensions[id].enabled);

    if (!enabledIds.length) {
      console.log('[Extensions] No extensions enabled.');
      return;
    }

    console.log(`[Extensions] Loading ${enabledIds.length} extension(s)...`);

    for (const extId of enabledIds) {
      const extConfig = await loadExtConfig(extId);
      if (!extConfig) continue;

      console.log(`[Extensions] ✓ ${extConfig.name || extId} v${extConfig.version || '?'}`);

      // Inject CSS files
      const cssFiles = extConfig.css || [];
      cssFiles.forEach(cssFile => injectCSS(extId, cssFile));

      // Inject JS files
      const jsFiles = extConfig.scripts || [];
      jsFiles.forEach(jsFile => injectScript(extId, jsFile));

      // Register pages
      registerPages(extId, extConfig);

      // Track loaded extension
      window.__EXTENSIONS.loaded.push({
        id: extId,
        config: extConfig
      });
    }

    // Add nav items and sidebar items
    addNavLinks();
    addSidebarItems();

    console.log(`[Extensions] Loaded ${window.__EXTENSIONS.loaded.length} extension(s).`);
  }

  // === Init ===
  async function init() {
    await loadExtensions();

    // Watch for routing on page.html
    watchRouting();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
