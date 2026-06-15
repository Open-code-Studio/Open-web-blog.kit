/* ============================================
   Shared Theme Toggle (link.html, about.html)
   ============================================ */
(function() {
  'use strict';
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  if (!themeToggle || !themeIcon) return;

  let themeColor = '#4AA26F';

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
  themeToggle.addEventListener('click', toggleTheme);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('owb-theme')) setTheme(e.matches ? 'dark' : 'light');
  });

  // Load themeColor from config.json
  fetch('config.json').then(r => r.json()).then(cfg => {
    if (cfg.site && cfg.site.themeColor) applyThemeColor(cfg.site.themeColor);
  }).catch(() => {});
})();
