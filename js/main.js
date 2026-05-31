/**
 * 二次元动漫毛玻璃个人门户与后台管理系统 - 核心逻辑控制器
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================================================
  // 1. 梦幻二次元背景特效初始化 (落樱与闪烁群星)
  // ==========================================================================
  
  function initAnimeBackdrop() {
    const starContainer = document.querySelector('.star-container');
    const sakuraContainer = document.querySelector('.sakura-container');

    // 随机渲染 40 颗闪烁星星
    for (let i = 0; i < 40; i++) {
      const star = document.createElement('div');
      star.className = 'twinkle-star';
      const size = Math.random() * 3 + 1; // 1px - 4px
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDelay = `${Math.random() * 5}s`;
      star.style.animationDuration = `${Math.random() * 4 + 2}s`;
      starContainer.appendChild(star);
    }

    // 动态渲染 25 片缓缓飘落的樱花瓣
    for (let i = 0; i < 25; i++) {
      const petal = document.createElement('div');
      petal.className = 'sakura-petal';
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.top = `${Math.random() * -10}%`;
      
      const size = Math.random() * 12 + 6; // 6px - 18px
      petal.style.width = `${size}px`;
      petal.style.height = `${size}px`;
      
      petal.style.animationDelay = `${Math.random() * 10}s`;
      petal.style.animationDuration = `${Math.random() * 8 + 8}s`; // 8s - 16s 飘落时间
      sakuraContainer.appendChild(petal);
    }
  }
  
  initAnimeBackdrop();

  // ==========================================================================
  // 2. 数据仓库同步系统 (LocalStorage CRUD)
  // ==========================================================================

  let websites = [];
  const STORAGE_KEY = 'anime_websites_portal_data';
  const CONTACT_INFO_KEY = 'portalContactInfo';
  const PASSWORD_OVERRIDE_KEY = 'adminPasswordHashOverride';
  const CATEGORIES_KEY = 'portalCategories';
  const SITE_SETTINGS_KEY = 'portalSiteSettings';
  const API_URL = '/api/data';
  let _adminPassword = null;
  let _adminLoggedIn = false;

  const DEFAULT_SITE_SETTINGS = {
    siteName: '流光星野',
    authorName: '星野流光',
    authorTag: '🎨 独立开发者',
    motto: '在星夜与代码的交界处，记录下属于自己的每一朵极光与落樱。',
    avatarUrl: '',
    copyrightName: '草丛'
  };
  let ADMIN_PASSWORD_HASH = localStorage.getItem(PASSWORD_OVERRIDE_KEY) || (window.SITE_CONFIG || {}).adminPasswordHash || '';

  // 默认分类（与原始数据的 category ID 对应）
  const DEFAULT_CATEGORIES = [
    { id: 'blog', name: '技术博客' },
    { id: 'code', name: '开源仓库' },
    { id: 'art', name: '艺术空间' },
    { id: 'game', name: '游戏世界' }
  ];

  function loadCategories() {
    const saved = localStorage.getItem(CATEGORIES_KEY);
    const exportedDefault = (window.PORTAL_EXPORT && window.PORTAL_EXPORT.categories) || null;
    try { return saved ? JSON.parse(saved) : (exportedDefault || [...DEFAULT_CATEGORIES]); }
    catch { return exportedDefault || [...DEFAULT_CATEGORIES]; }
  }

  function saveCategories(cats) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats));
  }

  function loadSiteSettings() {
    const saved = localStorage.getItem(SITE_SETTINGS_KEY);
    const exportedDefault = (window.PORTAL_EXPORT && window.PORTAL_EXPORT.siteSettings) || null;
    try { return saved ? JSON.parse(saved) : (exportedDefault || { ...DEFAULT_SITE_SETTINGS }); }
    catch { return exportedDefault || { ...DEFAULT_SITE_SETTINGS }; }
  }

  function saveSiteSettings(s) {
    localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(s));
  }

  function applySiteSettings(s) {
    const name = s.siteName || DEFAULT_SITE_SETTINGS.siteName;
    if (window.location.pathname.includes('/admin')) {
      document.title = document.title.replace(/[|｜]\s*[^|｜]+$/, '| ' + name);
    } else {
      document.title = document.title.replace(/^[^|｜]+/, name + ' ');
    }

    const logoTitle = document.getElementById('site-name-display');
    if (logoTitle) logoTitle.textContent = name;

    const authorName = document.getElementById('author-name-display');
    if (authorName) authorName.textContent = s.authorName || DEFAULT_SITE_SETTINGS.authorName;

    const authorTag = document.getElementById('author-tag-display');
    if (authorTag) authorTag.textContent = s.authorTag || DEFAULT_SITE_SETTINGS.authorTag;

    const mottoEl = document.getElementById('author-motto-display');
    if (mottoEl) mottoEl.textContent = '💫 "' + (s.motto || DEFAULT_SITE_SETTINGS.motto) + '"';

    const footerCopy = document.getElementById('footer-copy-display');
    if (footerCopy) {
      const name = s.copyrightName || DEFAULT_SITE_SETTINGS.copyrightName;
      footerCopy.textContent = `© ${new Date().getFullYear()} ${name}. All Rights Reserved.`;
    }

    const footerDev = document.getElementById('footer-dev-name');
    if (footerDev) footerDev.textContent = ' ' + (s.copyrightName || DEFAULT_SITE_SETTINGS.copyrightName);

    const avatarImg = document.getElementById('avatar-img');
    const avatarSvg = document.getElementById('avatar-svg');
    if (s.avatarUrl && isSafeURL(s.avatarUrl)) {
      if (avatarImg) { avatarImg.src = s.avatarUrl; avatarImg.style.display = ''; }
      if (avatarSvg) avatarSvg.style.display = 'none';
    } else {
      if (avatarImg) avatarImg.style.display = 'none';
      if (avatarSvg) avatarSvg.style.display = '';
    }
  }

  let categories = loadCategories();

  function getCategoryName(id) {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : id;
  }

  // 渲染前台筛选标签
  function renderFilterTabs() {
    const container = document.getElementById('portal-filter-tabs');
    if (!container) return;
    container.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = 'portal-filter-tab' + (currentCategory === 'all' ? ' active' : '');
    allBtn.dataset.category = 'all';
    allBtn.setAttribute('role', 'tab');
    allBtn.setAttribute('aria-selected', currentCategory === 'all' ? 'true' : 'false');
    allBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg> 全部`;
    container.appendChild(allBtn);

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'portal-filter-tab' + (currentCategory === cat.id ? ' active' : '');
      btn.dataset.category = cat.id;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', currentCategory === cat.id ? 'true' : 'false');
      btn.textContent = cat.name;
      container.appendChild(btn);
    });

    container.querySelectorAll('.portal-filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.portal-filter-tab').forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        currentCategory = tab.dataset.category;
        renderPortalCards();
      });
    });
  }

  // 填充后台分类下拉框
  function populateCategoryDropdowns() {
    const adminSelect = document.getElementById('admin-category-select');
    if (adminSelect) {
      const cur = adminSelect.value;
      adminSelect.innerHTML = '<option value="all">全部分类</option>' +
        categories.map(c => `<option value="${escapeHTML(c.id)}">${escapeHTML(c.name)}</option>`).join('');
      if (cur) adminSelect.value = cur;
    }
    const formSelect = document.getElementById('form-site-category');
    if (formSelect) {
      const cur = formSelect.value;
      formSelect.innerHTML = categories.map(c =>
        `<option value="${escapeHTML(c.id)}">${escapeHTML(c.name)}</option>`
      ).join('');
      if (cur) formSelect.value = cur;
    }
  }

  async function hashPassword(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function escapeHTML(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isSafeURL(url) {
    try {
      const u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

  // 自定义确认弹窗（替代原生 confirm）
  let _confirmCleanup = null;
  function showConfirm(message, onConfirm, options = {}) {
    const overlay = document.getElementById('custom-confirm-overlay');
    if (!overlay) { if (confirm(message)) onConfirm(); return; }
    // 清理上一次未关闭的监听器，防止重复叠加
    if (_confirmCleanup) { _confirmCleanup(); _confirmCleanup = null; }
    const msgEl = document.getElementById('custom-confirm-message');
    const titleEl = document.getElementById('custom-confirm-title');
    const okBtn = document.getElementById('custom-confirm-ok');
    const cancelBtn = document.getElementById('custom-confirm-cancel');
    titleEl.textContent = options.title || '确认操作';
    msgEl.textContent = message;
    okBtn.textContent = options.okText || '确定';
    overlay.classList.add('active');
    function cleanup() {
      overlay.classList.remove('active');
      okBtn.removeEventListener('click', handleOk);
      cancelBtn.removeEventListener('click', handleCancel);
      overlay.removeEventListener('click', handleOverlay);
      _confirmCleanup = null;
    }
    function handleOk() { cleanup(); onConfirm(); }
    function handleCancel() { cleanup(); }
    function handleOverlay(e) { if (e.target === overlay) cleanup(); }
    okBtn.addEventListener('click', handleOk);
    cancelBtn.addEventListener('click', handleCancel);
    overlay.addEventListener('click', handleOverlay);
    _confirmCleanup = cleanup;
  }

  // 全局 Toast 通知（替代原生 alert）
  let _toastTimer = null;
  function showToast(message, type = 'success') {
    const toast = document.getElementById('custom-toast');
    if (!toast) { alert(message); return; }
    const msgEl = document.getElementById('custom-toast-message');
    const iconEl = document.getElementById('custom-toast-icon');
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    if (msgEl) msgEl.textContent = message;
    if (iconEl) iconEl.textContent = icons[type] || '✓';
    toast.className = `custom-toast ${type} active`;
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => toast.classList.remove('active'), 3500);
  }

  // 联系方式默认值
  const DEFAULT_CONTACT_INFO = {
    githubUrl: 'https://github.com',
    email: 'admin@example.com',
    wechatId: 'Hoshino_Sakura',
    wechatNote: '请备注合作说明哦~',
    qqGroup: '987654321'
  };

  function loadContactInfo() {
    const saved = localStorage.getItem(CONTACT_INFO_KEY);
    const exportedDefault = (window.PORTAL_EXPORT && window.PORTAL_EXPORT.contactInfo) || null;
    try { return saved ? JSON.parse(saved) : (exportedDefault || { ...DEFAULT_CONTACT_INFO }); }
    catch { return exportedDefault || { ...DEFAULT_CONTACT_INFO }; }
  }

  function applyContactInfoToDOM(info) {
    const navGithub = document.getElementById('nav-github-link');
    const navEmail = document.getElementById('nav-email-link');
    const socialGithub = document.getElementById('social-github-btn');
    const socialEmail = document.getElementById('social-email-btn');

    const safeGithub = isSafeURL(info.githubUrl) ? info.githubUrl : DEFAULT_CONTACT_INFO.githubUrl;
    if (navGithub) navGithub.href = safeGithub;
    if (navEmail) navEmail.href = `mailto:${info.email || DEFAULT_CONTACT_INFO.email}`;
    if (socialGithub) socialGithub.href = safeGithub;
    if (socialEmail) socialEmail.href = `mailto:${info.email || DEFAULT_CONTACT_INFO.email}`;
  }

  // 全局函数供 onclick 使用
  window.showWechatInfo = function() {
    const info = loadContactInfo();
    showToast(`微信：${info.wechatId}（${info.wechatNote}）`, 'info');
  };
  window.showQQInfo = function() {
    const info = loadContactInfo();
    showToast(`QQ群：${info.qqGroup}`, 'info');
  };

  applyContactInfoToDOM(loadContactInfo());
  applySiteSettings(loadSiteSettings());

  function loadData() {
    const localData = localStorage.getItem(STORAGE_KEY);
    const exportedWebsites = (window.PORTAL_EXPORT && window.PORTAL_EXPORT.websites) || null;
    const fallback = exportedWebsites || [...initialWebsitesData];
    if (localData) {
      try {
        websites = JSON.parse(localData);
      } catch (e) {
        console.error("加载本地存储失败，读取导出配置", e);
        websites = fallback;
      }
    } else {
      websites = fallback;
      saveData();
    }
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(websites));
  }

  loadData();

  async function syncToWorker() {
    if (!_adminPassword) return;
    try {
      const r = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${_adminPassword}` },
        body: JSON.stringify({
          websites,
          categories,
          contactInfo: loadContactInfo(),
          siteSettings: loadSiteSettings()
        })
      });
      if (!r.ok) {
        if (r.status === 401) showToast('云端同步失败：认证过期，请重新登录。', 'error');
        else showToast('云端同步失败，数据已保存到本地。', 'error');
      }
    } catch {
      showToast('网络异常，数据已保存在本地，联网后重试。', 'error');
    }
  }

  async function fetchAndApplyWorkerData() {
    try {
      const r = await fetch(API_URL, { cache: 'no-cache' });
      if (!r.ok) return;
      const data = await r.json();
      if (!data) return;
      let changed = false;
      if (Array.isArray(data.websites)) { websites = data.websites; saveData(); changed = true; }
      if (Array.isArray(data.categories)) { categories = data.categories; saveCategories(categories); changed = true; }
      if (data.contactInfo && typeof data.contactInfo === 'object') {
        localStorage.setItem(CONTACT_INFO_KEY, JSON.stringify(data.contactInfo));
        applyContactInfoToDOM(data.contactInfo);
      }
      if (data.siteSettings && typeof data.siteSettings === 'object') {
        localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(data.siteSettings));
        applySiteSettings(data.siteSettings);
      }
      if (changed) {
        renderFilterTabs();
        renderPortalCards();
        if (isAdminPage && _adminLoggedIn) { populateCategoryDropdowns(); renderAdminTable(); }
      }
    } catch { /* 离线或 KV 尚未配置，静默使用本地缓存 */ }
  }

  // ==========================================================================
  // 3. 前端展示门户渲染与交互 (Frontend Portal Controller)
  // ==========================================================================

  const portalGrid = document.getElementById('portal-grid');
  const searchInput = document.getElementById('portal-search-input');
  const emptyState = document.getElementById('empty-state');

  let currentCategory = 'all';
  let searchQuery = '';

  // 动态创建 Lucide 图标的简单 SVG 映射器 (免去载入巨大库，保证绝对秒开)
  const iconSVGMap = {
    'book-open': '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    'code': '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    'palette': '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/><circle cx="7.5" cy="10.5" r="1.5"/><circle cx="11.5" cy="7.5" r="1.5"/><circle cx="16.5" cy="9.5" r="1.5"/><circle cx="15.5" cy="14.5" r="1.5"/></svg>',
    'gamepad-2': '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="15" x2="15.01" y1="13" y2="13"/><line x1="18" x2="18.01" y1="11" y2="11"/><rect width="20" height="12" x="2" y="6" rx="3"/></svg>',
    'book': '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/></svg>',
    'folder': '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>'
  };

  function getSVGIcon(key) {
    if (iconSVGMap[key]) return iconSVGMap[key];
    const safe = escapeHTML(String(key || '🌐').slice(0, 8));
    return `<span class="icon-emoji-display">${safe}</span>`;
  }

  function renderPortalCards() {
    if (!portalGrid) return;
    portalGrid.innerHTML = '';

    // 联合筛选数据
    const filtered = websites.filter(site => {
      const matchesCategory = currentCategory === 'all' || site.category === currentCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query ||
        site.name.toLowerCase().includes(query) ||
        site.description.toLowerCase().includes(query) ||
        (site.tags || []).some(t => t.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      if (emptyState) emptyState.style.display = 'flex';
      return;
    } else {
      if (emptyState) emptyState.style.display = 'none';
    }

    filtered.forEach((site, index) => {
      const card = document.createElement('article');
      card.className = 'portal-card';
      card.style.animationDelay = `${index * 0.08}s`;

      const cardMeta = `
        <div class="card-meta-row">
          <span class="card-category-tag">${escapeHTML(getCategoryName(site.category) || site.categoryName || '')}</span>
          <div class="card-status ${escapeHTML(site.status)}">
            <span class="card-status-dot"></span>
            <span>${escapeHTML(site.statusText)}</span>
          </div>
        </div>
      `;

      const cardBody = `
        <div>
          <div class="card-title-row">
            <div class="card-icon-box">${getSVGIcon(site.icon)}</div>
            <h3 class="portal-card-title">${escapeHTML(site.name)}</h3>
          </div>
          <p class="portal-card-desc">${escapeHTML(site.description)}</p>
        </div>
      `;

      const tagsHTML = (site.tags || []).slice(0, 3).map(t => `<span class="card-tag-badge">${escapeHTML(t)}</span>`).join('');
      const cardFooter = `
        <div class="card-bottom-row">
          <div class="card-tag-badges">${tagsHTML}</div>
          <button class="card-arrow-btn" aria-label="查看详情">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>
      `;

      card.innerHTML = cardMeta + cardBody + cardFooter;

      // 绑定鼠标滑动霓虹跟随光晕特效
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      });

      // 绑定卡片点击展示详情弹窗事件
      card.addEventListener('click', () => {
        openDetailModal(site);
      });

      portalGrid.appendChild(card);
    });
  }

  // 前台搜索事件监听
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderPortalCards();
    });
  }

  // 动态渲染筛选标签并绑定事件
  renderFilterTabs();
  renderPortalCards();
  fetchAndApplyWorkerData();

  // ==========================================================================
  // 4. 前端详情弹窗逻辑 (Details Modal Control)
  // ==========================================================================

  const modalOverlay = document.getElementById('modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalGlowBg = document.getElementById('modal-glow-bg');
  const modalTitle = document.getElementById('modal-title');
  const modalStatus = document.getElementById('modal-status');
  const modalDescription = document.getElementById('modal-description');
  const modalFeaturesList = document.getElementById('modal-features-list');
  const modalFeaturesSection = document.getElementById('modal-features-section');
  const modalBtnSecondary = document.getElementById('modal-btn-secondary');
  const modalBtnPrimary = document.getElementById('modal-btn-primary');

  function openDetailModal(site) {
    modalGlowBg.style.background = site.bgGradient;
    modalTitle.textContent = site.name;
    modalStatus.className = `card-status ${escapeHTML(site.status)}`;
    modalStatus.innerHTML = `<span class="card-status-dot"></span><span>${escapeHTML(site.statusText)}</span>`;
    modalDescription.textContent = site.detailedDescription;

    const features = (site.features || []).filter(Boolean);
    if (modalFeaturesSection) modalFeaturesSection.style.display = features.length > 0 ? '' : 'none';
    modalFeaturesList.innerHTML = '';
    features.forEach(feat => {
      const li = document.createElement('li');
      li.className = 'feature-item';
      li.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${escapeHTML(feat)}</span>
      `;
      modalFeaturesList.appendChild(li);
    });

    modalBtnPrimary.href = isSafeURL(site.url) ? site.url : '#';
    
    // 一键复制地址交互
    modalBtnSecondary.onclick = (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(site.url).then(() => {
        const originalText = modalBtnSecondary.innerHTML;
        modalBtnSecondary.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> 复制成功`;
        modalBtnSecondary.style.borderColor = 'var(--color-online)';
        modalBtnSecondary.style.color = 'var(--color-online)';
        setTimeout(() => {
          modalBtnSecondary.innerHTML = originalText;
          modalBtnSecondary.style.borderColor = '';
          modalBtnSecondary.style.color = '';
        }, 2000);
      }).catch(() => {
        showToast('复制失败，请手动复制链接。', 'error');
      });
    };

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDetailModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeDetailModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeDetailModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const confirmOverlay = document.getElementById('custom-confirm-overlay');
    if (confirmOverlay && confirmOverlay.classList.contains('active')) {
      confirmOverlay.classList.remove('active');
      return;
    }
    if (modalOverlay && modalOverlay.classList.contains('active')) closeDetailModal();
  });

  // ==========================================================================
  // 5. 登录系统（仅在 /admin 页面运行）
  // ==========================================================================

  const isAdminPage = !!document.querySelector('.admin-wrapper');
  const adminWrapper = document.querySelector('.admin-wrapper');

  if (isAdminPage) {
    const loginOverlay = document.getElementById('login-overlay');
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('admin-password');
    const loginErrorMsg = document.getElementById('login-error-msg');

    // 失败计数和锁定时间持久化到 sessionStorage，防止刷新绕过
    let loginFailCount = parseInt(sessionStorage.getItem('_loginFails') || '0', 10);
    let loginLockedUntil = parseInt(sessionStorage.getItem('_loginLock') || '0', 10);

    function setLoginError(msg) {
      if (loginErrorMsg) loginErrorMsg.textContent = msg;
    }

    function doLogin(password) {
      _adminPassword = password;
      _adminLoggedIn = true;
      sessionStorage.setItem('_adminSession', password);
      sessionStorage.setItem('_loginFails', '0');
      sessionStorage.removeItem('_loginLock');
      loginFailCount = 0;
      loginLockedUntil = 0;
      loginOverlay.classList.remove('active');
      if (passwordInput) passwordInput.value = '';
      setLoginError('');
      adminWrapper.style.display = 'flex';
      setTimeout(() => adminWrapper.classList.add('active'), 20);
      initAdminDashboard();
    }

    // 自动恢复上次 session（刷新不掉线）
    (async () => {
      const saved = sessionStorage.getItem('_adminSession');
      if (!saved) return;
      const h = await hashPassword(saved);
      if (h === ADMIN_PASSWORD_HASH) {
        doLogin(saved);
      } else {
        sessionStorage.removeItem('_adminSession');
      }
    })();

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 检查是否处于锁定期
        if (Date.now() < loginLockedUntil) {
          const remaining = Math.ceil((loginLockedUntil - Date.now()) / 1000);
          setLoginError(`已锁定，请 ${remaining} 秒后重试。`);
          return;
        }

        const enteredPassword = passwordInput.value;
        const hash = await hashPassword(enteredPassword);

        if (hash === ADMIN_PASSWORD_HASH) {
          doLogin(enteredPassword);
        } else {
          loginFailCount++;
          sessionStorage.setItem('_loginFails', String(loginFailCount));

          if (loginFailCount >= 5) {
            loginLockedUntil = Date.now() + 30 * 1000;
            sessionStorage.setItem('_loginLock', String(loginLockedUntil));
            loginFailCount = 0;
            sessionStorage.setItem('_loginFails', '0');
            setLoginError('错误次数过多，已锁定 30 秒。');
          } else {
            const left = 5 - loginFailCount;
            setLoginError(`密码错误，还可尝试 ${left} 次。`);
          }

          passwordInput.style.borderColor = 'var(--color-maintain)';
          passwordInput.style.animation = 'shake 0.4s ease';
          setTimeout(() => { passwordInput.style.animation = ''; }, 400);
        }
      });
    }
  }

  // 移动端汉堡菜单切换侧边栏
  const adminMenuToggle = document.getElementById('admin-menu-toggle');
  const adminSidebar = document.querySelector('.admin-sidebar');
  const adminSidebarBackdrop = document.getElementById('admin-sidebar-backdrop');

  function openMobileSidebar() {
    if (adminSidebar) adminSidebar.classList.add('mobile-active');
    if (adminSidebarBackdrop) adminSidebarBackdrop.classList.add('active');
  }
  function closeMobileSidebar() {
    if (adminSidebar) adminSidebar.classList.remove('mobile-active');
    if (adminSidebarBackdrop) adminSidebarBackdrop.classList.remove('active');
  }

  if (adminMenuToggle) {
    adminMenuToggle.addEventListener('click', () => {
      adminSidebar.classList.contains('mobile-active') ? closeMobileSidebar() : openMobileSidebar();
    });
  }
  if (adminSidebarBackdrop) {
    adminSidebarBackdrop.addEventListener('click', closeMobileSidebar);
  }

  // 退出登录 → 跳回首页
  const sidebarLogoutBtn = document.getElementById('sidebar-logout');
  if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('_adminSession');
      sessionStorage.removeItem('_loginFails');
      sessionStorage.removeItem('_loginLock');
      _adminPassword = null;
      _adminLoggedIn = false;
      window.location.href = '/';
    });
  }

  // ==========================================================================
  // 6. 全屏平铺式后台管理面板核心控制 (Admin Dashboard Panel)
  // ==========================================================================

  const adminTableBody = document.getElementById('admin-table-body');
  const adminSearchInput = document.getElementById('admin-search-input');
  const adminCategorySelect = document.getElementById('admin-category-select');
  const adminSplitBox = document.getElementById('admin-split-box');
  const sidebarWebsitesBtn = document.getElementById('sidebar-websites');
  const sidebarAddNewBtn = document.getElementById('sidebar-add-new');
  const sidebarCategoriesBtn = document.getElementById('sidebar-categories');
  const sidebarContactInfoBtn = document.getElementById('sidebar-contact-info');
  const sidebarChangePasswordBtn = document.getElementById('sidebar-change-password');
  const sidebarSiteSettingsBtn = document.getElementById('sidebar-site-settings');
  const adminCategoriesSection = document.getElementById('admin-categories-section');
  const adminContactSection = document.getElementById('admin-contact-info-section');
  const adminChangePasswordSection = document.getElementById('admin-change-password-section');
  const adminSiteSettingsSection = document.getElementById('admin-site-settings-section');
  const adminViewportTitle = document.querySelector('.admin-viewport-title');
  const adminHeaderActions = document.querySelector('.admin-header-actions');

  const ALL_SIDEBAR_BTNS = [sidebarWebsitesBtn, sidebarAddNewBtn, sidebarCategoriesBtn, sidebarContactInfoBtn, sidebarChangePasswordBtn, sidebarSiteSettingsBtn];

  function showAdminSection(section) {
    adminSplitBox.style.display = 'none';
    if (adminCategoriesSection) adminCategoriesSection.style.display = 'none';
    if (adminContactSection) adminContactSection.style.display = 'none';
    if (adminChangePasswordSection) adminChangePasswordSection.style.display = 'none';
    if (adminSiteSettingsSection) adminSiteSettingsSection.style.display = 'none';
    ALL_SIDEBAR_BTNS.forEach(b => b && b.classList.remove('active'));
    if (adminHeaderActions) adminHeaderActions.style.display = 'none';

    if (section === 'websites') {
      adminSplitBox.style.display = 'flex';
      if (adminViewportTitle) adminViewportTitle.textContent = '网站管理';
      if (adminHeaderActions) adminHeaderActions.style.display = 'flex';
      if (sidebarWebsitesBtn) sidebarWebsitesBtn.classList.add('active');
    } else if (section === 'categories') {
      if (adminCategoriesSection) adminCategoriesSection.style.display = 'flex';
      if (adminViewportTitle) adminViewportTitle.textContent = '分类管理';
      if (sidebarCategoriesBtn) sidebarCategoriesBtn.classList.add('active');
      renderCategoriesList();
    } else if (section === 'contact-info') {
      if (adminContactSection) adminContactSection.style.display = 'flex';
      if (adminViewportTitle) adminViewportTitle.textContent = '联系方式';
      if (sidebarContactInfoBtn) sidebarContactInfoBtn.classList.add('active');
      loadContactInfoIntoForm();
    } else if (section === 'change-password') {
      if (adminChangePasswordSection) adminChangePasswordSection.style.display = 'flex';
      if (adminViewportTitle) adminViewportTitle.textContent = '修改密码';
      if (sidebarChangePasswordBtn) sidebarChangePasswordBtn.classList.add('active');
      const cpResult = document.getElementById('cp-result');
      if (cpResult) { cpResult.className = 'admin-panel-result'; cpResult.textContent = ''; }
      document.getElementById('change-password-form').reset();
      refreshPasswordOverrideStatus();
    } else if (section === 'site-settings') {
      if (adminSiteSettingsSection) adminSiteSettingsSection.style.display = 'flex';
      if (adminViewportTitle) adminViewportTitle.textContent = '基础设置';
      if (sidebarSiteSettingsBtn) sidebarSiteSettingsBtn.classList.add('active');
      loadSiteSettingsIntoForm();
    }
  }

  if (sidebarCategoriesBtn) {
    sidebarCategoriesBtn.addEventListener('click', () => {
      closeMobileSidebar();
      closeAdminEditPanel();
      showAdminSection('categories');
    });
  }

  if (sidebarContactInfoBtn) {
    sidebarContactInfoBtn.addEventListener('click', () => {
      closeMobileSidebar();
      closeAdminEditPanel();
      showAdminSection('contact-info');
    });
  }

  if (sidebarChangePasswordBtn) {
    sidebarChangePasswordBtn.addEventListener('click', () => {
      closeMobileSidebar();
      closeAdminEditPanel();
      showAdminSection('change-password');
    });
  }

  if (sidebarSiteSettingsBtn) {
    sidebarSiteSettingsBtn.addEventListener('click', () => {
      closeMobileSidebar();
      closeAdminEditPanel();
      showAdminSection('site-settings');
    });
  }

  function loadSiteSettingsIntoForm() {
    const s = loadSiteSettings();
    const f = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    f('ss-site-name', s.siteName);
    f('ss-author-name', s.authorName);
    f('ss-author-tag', s.authorTag);
    f('ss-motto', s.motto);
    f('ss-avatar-url', s.avatarUrl);
    f('ss-copyright', s.copyrightName);
  }

  const siteSettingsForm = document.getElementById('site-settings-form');
  if (siteSettingsForm) {
    siteSettingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const g = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
      const settings = {
        siteName: g('ss-site-name') || DEFAULT_SITE_SETTINGS.siteName,
        authorName: g('ss-author-name') || DEFAULT_SITE_SETTINGS.authorName,
        authorTag: g('ss-author-tag') || DEFAULT_SITE_SETTINGS.authorTag,
        motto: g('ss-motto') || DEFAULT_SITE_SETTINGS.motto,
        avatarUrl: g('ss-avatar-url'),
        copyrightName: g('ss-copyright') || DEFAULT_SITE_SETTINGS.copyrightName
      };
      saveSiteSettings(settings);
      applySiteSettings(settings);
      syncToWorker();
      showToast('基础设置已保存！');
    });
  }

  // 后台分页及检索状态
  let adminSearchQuery = '';
  let adminCurrentCategory = 'all';
  let adminCurrentPage = 1;
  const adminItemsPerPage = 6; // 每页显示 6 条，防止无限下拉

  function initAdminDashboard() {
    adminCurrentPage = 1;
    populateCategoryDropdowns();
    showAdminSection('websites');
    renderAdminTable();
  }

  function getFilteredAdminData() {
    return websites.filter(site => {
      const matchesCategory = adminCurrentCategory === 'all' || site.category === adminCurrentCategory;
      const query = adminSearchQuery.toLowerCase().trim();
      return matchesCategory && (!query || 
        site.name.toLowerCase().includes(query) ||
        site.url.toLowerCase().includes(query)
      );
    });
  }

  function renderAdminTable() {
    adminTableBody.innerHTML = '';
    const filtered = getFilteredAdminData();
    
    // 计算分页
    const totalPages = Math.ceil(filtered.length / adminItemsPerPage) || 1;
    if (adminCurrentPage > totalPages) adminCurrentPage = totalPages;

    const startIdx = (adminCurrentPage - 1) * adminItemsPerPage;
    const paginatedData = filtered.slice(startIdx, startIdx + adminItemsPerPage);

    if (paginatedData.length === 0) {
      adminTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">暂无网站数据</td></tr>';
      updatePaginationControls(1, 1);
      return;
    }

    paginatedData.forEach(site => {
      const tr = document.createElement('tr');
      const safeHref = isSafeURL(site.url) ? escapeHTML(site.url) : '#';
      tr.innerHTML = `
        <td style="width: 60px; text-align: center;">
          <div class="card-icon-box" style="width: 32px; height: 32px; margin: 0 auto;">${getSVGIcon(site.icon)}</div>
        </td>
        <td class="table-site-name">${escapeHTML(site.name)}</td>
        <td><a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="table-url-link">${escapeHTML(site.url)}</a></td>
        <td>
          <div class="card-status ${escapeHTML(site.status)}" style="background: transparent; border: none; padding: 0;">
            <span class="card-status-dot"></span>
            <span>${escapeHTML(site.statusText)}</span>
          </div>
        </td>
        <td style="width: 100px;">
          <div class="table-action-btn-row">
            <button class="table-action-btn edit-trigger" data-id="${site.id}" title="并排编辑">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button class="table-action-btn delete delete-trigger" data-id="${site.id}" title="删除节点">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </button>
          </div>
        </td>
      `;

      // 绑定编辑事件 (开启并排联动分栏，零遮挡操作)
      tr.querySelector('.edit-trigger').addEventListener('click', (e) => {
        e.stopPropagation();
        openAdminEditPanel(site);
      });

      // 绑定删除事件
      tr.querySelector('.delete-trigger').addEventListener('click', (e) => {
        e.stopPropagation();
        showConfirm(`确认要删除网站「${site.name}」吗？此操作不可逆。`, () => {
          deleteWebsite(site.id);
        }, { title: '删除确认', okText: '确认删除' });
      });

      adminTableBody.appendChild(tr);
    });

    updatePaginationControls(adminCurrentPage, totalPages);
  }

  // 后台检索与下拉过滤事件
  if (adminSearchInput) {
    adminSearchInput.addEventListener('input', (e) => {
      adminSearchQuery = e.target.value;
      adminCurrentPage = 1;
      renderAdminTable();
    });
  }

  if (adminCategorySelect) {
    adminCategorySelect.addEventListener('change', (e) => {
      adminCurrentCategory = e.target.value;
      adminCurrentPage = 1;
      renderAdminTable();
    });
  }

  // 分页器逻辑
  const prevPageBtn = document.getElementById('prev-page-btn');
  const nextPageBtn = document.getElementById('next-page-btn');
  const paginationInfo = document.getElementById('pagination-info');

  function updatePaginationControls(current, total) {
    if (prevPageBtn) prevPageBtn.disabled = current <= 1;
    if (nextPageBtn) nextPageBtn.disabled = current >= total;
    if (paginationInfo) paginationInfo.textContent = `第 ${current} / ${total} 页`;
  }

  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
      if (adminCurrentPage > 1) {
        adminCurrentPage--;
        renderAdminTable();
      }
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
      const filtered = getFilteredAdminData();
      const totalPages = Math.ceil(filtered.length / adminItemsPerPage);
      if (adminCurrentPage < totalPages) {
        adminCurrentPage++;
        renderAdminTable();
      }
    });
  }

  // ==========================================================================
  // 7. 并排无遮挡编辑与数据同步系统 (Side-by-Side Edit & LocalStorage sync)
  // ==========================================================================

  const editCloseBtn = document.getElementById('edit-close-btn');
  const editPanelTitle = document.getElementById('edit-panel-title');
  const editSiteForm = document.getElementById('edit-site-form');
  
  const formSiteId = document.getElementById('form-site-id');
  const formSiteName = document.getElementById('form-site-name');
  const formSiteUrl = document.getElementById('form-site-url');
  const formSiteCategory = document.getElementById('form-site-category');
  const formSiteIcon = document.getElementById('form-site-icon');
  const formSiteStatus = document.getElementById('form-site-status');
  const formSiteDesc = document.getElementById('form-site-desc');
  const formSiteDetail = document.getElementById('form-site-detail');
  const formSiteFeatures = document.getElementById('form-site-features');
  
  const tagEditorBox = document.getElementById('tag-editor-box');
  const newTagInput = document.getElementById('new-tag-input');
  
  let currentEditingTags = [];

  function openAdminEditPanel(site) {
    // 填充表单数据
    formSiteId.value = site.id;
    formSiteName.value = site.name;
    formSiteUrl.value = site.url;
    formSiteCategory.value = site.category;
    formSiteIcon.value = site.icon;
    formSiteStatus.value = site.status;
    formSiteDesc.value = site.description;
    formSiteDetail.value = site.detailedDescription;
    if (formSiteFeatures) formSiteFeatures.value = (site.features || []).join('\n');
    
    // 标题文字微调整
    editPanelTitle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> 编辑网站：${escapeHTML(site.name)}`;
    
    // 初始化标签数组与编辑器渲染
    currentEditingTags = [...(site.tags || [])];
    renderInteractiveTags(false);

    // 激活并排弹性收缩联动分栏 (左表收至60%，右表单展开40%，绝不发生层级遮挡)
    adminSplitBox.classList.add('edit-active');
  }

  function renderInteractiveTags(autoFocus = false) {
    tagEditorBox.innerHTML = '';
    currentEditingTags.forEach((tag, idx) => {
      const tagBadge = document.createElement('span');
      tagBadge.className = 'editor-tag-badge';
      tagBadge.innerHTML = `
        <span>${escapeHTML(tag)}</span>
        <span class="tag-delete-cross" data-idx="${idx}">&times;</span>
      `;

      // 绑定标签点击删除逻辑
      tagBadge.querySelector('.tag-delete-cross').addEventListener('click', () => {
        currentEditingTags.splice(idx, 1);
        renderInteractiveTags(false);
      });

      tagEditorBox.appendChild(tagBadge);
    });

    // 重新附加上输入框
    tagEditorBox.appendChild(newTagInput);
    if (autoFocus) newTagInput.focus();
  }

  // 标签框回车添加逻辑
  if (newTagInput) {
    newTagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const tagValue = newTagInput.value.trim();
        if (tagValue && !currentEditingTags.includes(tagValue)) {
          currentEditingTags.push(tagValue);
          newTagInput.value = '';
          renderInteractiveTags(true);
        }
      }
    });
  }

  function closeAdminEditPanel() {
    adminSplitBox.classList.remove('edit-active');
    editSiteForm.reset();
    formSiteId.value = '';
    currentEditingTags = [];
  }

  if (editCloseBtn) editCloseBtn.addEventListener('click', closeAdminEditPanel);

  document.querySelectorAll('.icon-preset').forEach(el => {
    el.addEventListener('click', () => { if (formSiteIcon) formSiteIcon.value = el.dataset.emoji; });
  });

  // 侧边栏按钮切换功能逻辑
  if (sidebarWebsitesBtn) {
    sidebarWebsitesBtn.addEventListener('click', () => {
      closeAdminEditPanel();
      closeMobileSidebar();
      showAdminSection('websites');
    });
  }

  // 侧栏一键”新添节点”表单调起 (同样采用联动分栏模式)
  if (sidebarAddNewBtn) {
    sidebarAddNewBtn.addEventListener('click', () => {
      showAdminSection('websites');
      closeMobileSidebar();
      
      // 初始化空数据表单
      formSiteId.value = 'new';
      formSiteName.value = '';
      formSiteUrl.value = '';
      formSiteCategory.value = categories.length > 0 ? categories[0].id : '';
      formSiteIcon.value = '🌐';
      formSiteStatus.value = 'online';
      formSiteDesc.value = '';
      formSiteDetail.value = '';
      if (formSiteFeatures) formSiteFeatures.value = '';
      
      editPanelTitle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg> 添加新网站`;
      currentEditingTags = ["Vite", "Cloudflare"];
      renderInteractiveTags(false);

      // 打开并排栏
      adminSplitBox.classList.add('edit-active');
    });
  }

  // 提交修改/添加逻辑
  if (editSiteForm) {
    editSiteForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const idVal = formSiteId.value;
      const siteName = formSiteName.value.trim();
      const siteUrl = formSiteUrl.value.trim();
      const siteCategory = formSiteCategory.value;
      const siteIcon = formSiteIcon.value.trim() || '🌐';
      const siteStatus = formSiteStatus.value;
      const siteDesc = formSiteDesc.value.trim();
      const siteDetail = formSiteDetail.value.trim();
      const siteFeatures = formSiteFeatures
        ? formSiteFeatures.value.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 5)
        : [];

      if (!siteName || !siteUrl) {
        showToast('请输入网站名称与链接！', 'error');
        return;
      }

      if (!isSafeURL(siteUrl)) {
        showToast('请输入有效的 HTTP 或 HTTPS 链接地址！', 'error');
        return;
      }

      // 获取状态显示文字
      const statusTextMap = {
        'online': '运行中',
        'beta': '公测中',
        'maintain': '维护中',
        'coming': '筹备中'
      };

      // 获取随机的漂亮毛玻璃渐变以作弹窗高光
      const gradients = [
        "linear-gradient(135deg, rgba(200, 182, 255, 0.25) 0%, rgba(255, 179, 198, 0.25) 100%)",
        "linear-gradient(135deg, rgba(179, 229, 252, 0.25) 0%, rgba(200, 182, 255, 0.25) 100%)",
        "linear-gradient(135deg, rgba(255, 202, 212, 0.25) 0%, rgba(255, 230, 240, 0.25) 100%)",
        "linear-gradient(135deg, rgba(255, 202, 212, 0.25) 0%, rgba(179, 229, 252, 0.25) 100%)"
      ];
      const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

      // 从当前分类配置里取名称
      const categoryNameMap = Object.fromEntries(categories.map(c => [c.id, c.name]));

      if (idVal === 'new') {
        // 创建新网站
        const newSite = {
          id: Date.now(), // 随机唯一ID
          name: siteName,
          url: siteUrl,
          description: siteDesc,
          detailedDescription: siteDetail || siteDesc,
          category: siteCategory,
          categoryName: categoryNameMap[siteCategory] || '实用工具',
          icon: siteIcon,
          tags: currentEditingTags.length > 0 ? currentEditingTags : ["Web"],
          status: siteStatus,
          statusText: statusTextMap[siteStatus],
          bgGradient: randomGradient,
          features: siteFeatures.length > 0 ? siteFeatures : ['一键极速加载访问']
        };
        websites.push(newSite);
      } else {
        // 编辑已有网站
        const targetId = parseInt(idVal, 10);
        const siteIdx = websites.findIndex(s => s.id === targetId);
        if (siteIdx !== -1) {
          websites[siteIdx] = {
            ...websites[siteIdx],
            name: siteName,
            url: siteUrl,
            description: siteDesc,
            detailedDescription: siteDetail || siteDesc,
            category: siteCategory,
            categoryName: categoryNameMap[siteCategory] || '实用工具',
            icon: siteIcon,
            tags: currentEditingTags,
            status: siteStatus,
            statusText: statusTextMap[siteStatus],
            features: siteFeatures.length > 0 ? siteFeatures : (websites[siteIdx].features || [])
          };
        }
      }

      saveData();
      syncToWorker();
      closeAdminEditPanel();
      renderAdminTable();

      // 重置侧边栏高亮
      showAdminSection('websites');

      showToast('保存成功！');
    });
  }

  // 删除网站节点
  function deleteWebsite(id) {
    websites = websites.filter(s => s.id !== id);
    saveData();
    syncToWorker();
    renderAdminTable();
    closeAdminEditPanel();
    showToast('已删除！');
  }

  // ==========================================================================
  // 8. 分类管理系统
  // ==========================================================================

  function renderCategoriesList() {
    const listEl = document.getElementById('categories-list');
    if (!listEl) return;
    if (categories.length === 0) {
      listEl.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem;padding:0.5rem 0;">暂无分类，添加后前台筛选栏会自动更新。</p>';
      return;
    }
    listEl.innerHTML = '';
    categories.forEach((cat, idx) => {
      const item = document.createElement('div');
      item.className = 'category-item';
      item.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <span class="category-item-index">${idx + 1}</span>
          <span class="category-item-name">${escapeHTML(cat.name)}</span>
          <span class="category-item-id">ID: ${escapeHTML(cat.id)}</span>
        </div>
        <button class="table-action-btn delete cat-delete-btn" data-idx="${idx}" title="删除此分类">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      `;
      item.querySelector('.cat-delete-btn').addEventListener('click', () => {
        showConfirm(`确认删除分类「${cat.name}」吗？该分类下的网站不会被删除，仍在「全部」中显示。`, () => {
          categories.splice(idx, 1);
          saveCategories(categories);
          syncToWorker();
          renderCategoriesList();
          populateCategoryDropdowns();
          renderFilterTabs();
        }, { title: '删除分类', okText: '确认删除' });
      });
      listEl.appendChild(item);
    });
  }

  const addCategoryForm = document.getElementById('add-category-form');
  if (addCategoryForm) {
    addCategoryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('new-category-name');
      const name = nameInput.value.trim();
      if (!name) return;
      // 自动生成英文 ID（时间戳，保证唯一）
      const id = 'cat_' + Date.now();
      categories.push({ id, name });
      saveCategories(categories);
      syncToWorker();
      nameInput.value = '';
      renderCategoriesList();
      populateCategoryDropdowns();
      renderFilterTabs();
    });
  }

  // ==========================================================================
  // 9. 联系方式管理系统
  // ==========================================================================

  function loadContactInfoIntoForm() {
    const info = loadContactInfo();
    const f = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    f('ci-github', info.githubUrl);
    f('ci-email', info.email);
    f('ci-wechat', info.wechatId);
    f('ci-wechat-note', info.wechatNote);
    f('ci-qq', info.qqGroup);
  }

  const contactInfoForm = document.getElementById('contact-info-form');
  if (contactInfoForm) {
    contactInfoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const info = {
        githubUrl: document.getElementById('ci-github').value.trim() || DEFAULT_CONTACT_INFO.githubUrl,
        email: document.getElementById('ci-email').value.trim() || DEFAULT_CONTACT_INFO.email,
        wechatId: document.getElementById('ci-wechat').value.trim() || DEFAULT_CONTACT_INFO.wechatId,
        wechatNote: document.getElementById('ci-wechat-note').value.trim() || DEFAULT_CONTACT_INFO.wechatNote,
        qqGroup: document.getElementById('ci-qq').value.trim() || DEFAULT_CONTACT_INFO.qqGroup
      };
      localStorage.setItem(CONTACT_INFO_KEY, JSON.stringify(info));
      applyContactInfoToDOM(info);
      syncToWorker();
      showToast('联系方式已保存！');
    });
  }

  // ==========================================================================
  // 9. 修改密码系统
  // ==========================================================================

  function refreshPasswordOverrideStatus() {
    const statusEl = document.getElementById('cp-override-status');
    const clearBtn = document.getElementById('cp-clear-override');
    const hasOverride = !!localStorage.getItem(PASSWORD_OVERRIDE_KEY);
    if (!statusEl) return;
    if (hasOverride) {
      statusEl.textContent = '当前使用：本地覆盖密码（优先于 CF 配置）';
      statusEl.style.cssText = 'font-size:0.8rem;color:var(--color-lavender);margin-bottom:1rem;padding:0.5rem 0.75rem;background:rgba(200,182,255,0.08);border:1px solid rgba(200,182,255,0.2);border-radius:8px;';
      if (clearBtn) clearBtn.style.display = 'flex';
    } else {
      statusEl.textContent = '当前使用：CF 部署配置（config.js 中的哈希）';
      statusEl.style.cssText = 'font-size:0.8rem;color:var(--text-muted);margin-bottom:1rem;padding:0.5rem 0.75rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;';
      if (clearBtn) clearBtn.style.display = 'none';
    }
  }

  const clearOverrideBtn = document.getElementById('cp-clear-override');
  if (clearOverrideBtn) {
    clearOverrideBtn.addEventListener('click', () => {
      localStorage.removeItem(PASSWORD_OVERRIDE_KEY);
      ADMIN_PASSWORD_HASH = (window.SITE_CONFIG || {}).adminPasswordHash || '';
      refreshPasswordOverrideStatus();
      const cpResult = document.getElementById('cp-result');
      cpResult.textContent = '已清除本地覆盖，现在使用 CF 部署的密码。';
      cpResult.className = 'admin-panel-result success';
    });
  }

  const changePasswordForm = document.getElementById('change-password-form');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cpResult = document.getElementById('cp-result');
      const currentVal = document.getElementById('cp-current').value;
      const newVal = document.getElementById('cp-new').value;
      const confirmVal = document.getElementById('cp-confirm').value;

      const showResult = (msg, type) => {
        cpResult.textContent = msg;
        cpResult.className = `admin-panel-result ${type}`;
      };

      if (!currentVal || !newVal || !confirmVal) {
        showResult('请填写所有密码字段。', 'error'); return;
      }
      if (newVal !== confirmVal) {
        showResult('两次输入的新密码不一致，请检查。', 'error'); return;
      }
      if (newVal.length < 6) {
        showResult('新密码至少需要 6 位，建议使用更强的密码。', 'error'); return;
      }

      const currentHash = await hashPassword(currentVal);
      if (currentHash !== ADMIN_PASSWORD_HASH) {
        showResult('当前密码错误，无法修改。', 'error'); return;
      }

      const newHash = await hashPassword(newVal);
      localStorage.setItem(PASSWORD_OVERRIDE_KEY, newHash);
      ADMIN_PASSWORD_HASH = newHash;
      changePasswordForm.reset();
      refreshPasswordOverrideStatus();
      showResult('密码修改成功！新密码已保存到当前浏览器。', 'success');
    });
  }

  // ==========================================================================
  // 10. 数据备份与恢复（KV JSON 下载 / 上传）
  // ==========================================================================

  const sidebarBackupBtn = document.getElementById('sidebar-backup');
  const sidebarRestoreBtn = document.getElementById('sidebar-restore');
  const restoreFileInput = document.getElementById('restore-file-input');

  if (sidebarBackupBtn) {
    sidebarBackupBtn.addEventListener('click', async () => {
      closeMobileSidebar();
      try {
        showToast('正在从云端拉取最新数据…', 'info');
        const r = await fetch(API_URL, { cache: 'no-cache' });
        if (!r.ok) { showToast('拉取失败，请稍后重试。', 'error'); return; }
        const data = await r.json();
        if (!data) { showToast('云端暂无数据。', 'error'); return; }
        const payload = JSON.stringify({ ...data, backupAt: new Date().toISOString() }, null, 2);
        const date = new Date().toISOString().slice(0, 10);
        const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `portal-backup-${date}.json`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        showToast('备份已下载！', 'success');
      } catch { showToast('网络异常，备份失败。', 'error'); }
    });
  }

  if (sidebarRestoreBtn && restoreFileInput) {
    sidebarRestoreBtn.addEventListener('click', () => {
      closeMobileSidebar();
      restoreFileInput.value = '';
      restoreFileInput.click();
    });

    restoreFileInput.addEventListener('change', () => {
      const file = restoreFileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        let data;
        try { data = JSON.parse(e.target.result); }
        catch { showToast('文件格式错误，请选择有效的 JSON 备份文件。', 'error'); return; }

        if (!data || typeof data !== 'object' || !Array.isArray(data.websites)) {
          showToast('备份文件内容无效（缺少 websites 字段）。', 'error'); return;
        }

        showConfirm(
          `确认将云端数据恢复为此备份？当前云端内容将被覆盖，操作不可撤销。`,
          async () => {
            if (!_adminPassword) { showToast('请先登录再执行恢复操作。', 'error'); return; }
            try {
              const r = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${_adminPassword}` },
                body: JSON.stringify({
                  websites:     Array.isArray(data.websites)    ? data.websites    : [],
                  categories:   Array.isArray(data.categories)  ? data.categories  : [],
                  contactInfo:  data.contactInfo  || {},
                  siteSettings: data.siteSettings || {}
                })
              });
              if (r.ok) {
                showToast('恢复成功！正在重新加载数据…', 'success');
                setTimeout(() => window.location.reload(), 1500);
              } else {
                showToast(r.status === 401 ? '认证失败，请重新登录。' : '恢复失败，请稍后重试。', 'error');
              }
            } catch { showToast('网络异常，恢复失败。', 'error'); }
          },
          { title: '确认恢复数据', okText: '确认覆盖' }
        );
      };
      reader.readAsText(file);
    });
  }

});
