/**
 * BuyBIBZ — App Utilities
 * Shared functions: navbar, toast, cart badge, scroll animations
 */

// ── Theme ───────────────────────────────────────────────────
// Keep the customer's preference across the storefront. Light is the calm,
// intentionally-designed first-visit experience; the explicit toggle persists.
function getPreferredTheme() {
    const savedTheme = localStorage.getItem('buybibz-theme');
    if (savedTheme) return savedTheme;
    return 'light';
}

function setTheme(theme) {
    const next = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    localStorage.setItem('buybibz-theme', next);
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
        themeColor.setAttribute('content', next === 'dark' ? '#101713' : '#fcfdfb');
    }
    const statusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (statusBar) {
        statusBar.setAttribute('content', next === 'dark' ? 'black-translucent' : 'default');
    }
    const button = document.getElementById('theme-toggle');
    if (button) {
        const isDark = next === 'dark';
        button.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        button.setAttribute('title', isDark ? 'Light mode' : 'Dark mode');
        button.innerHTML = isDark
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }
}

function toggleTheme() {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
}

setTheme(getPreferredTheme());

// ── Interface icons ─────────────────────────────────────────
// A small inline SVG set keeps the UI crisp and avoids emoji rendering changes
// between operating systems and browsers.
function icon(name, className = 'ui-icon') {
    const paths = {
        check: '<path d="m5 12 4 4L19 6"/>',
        close: '<path d="M18 6 6 18M6 6l12 12"/>',
        alert: '<path d="M10.3 3.4 2.1 17.2A2 2 0 0 0 3.8 20h16.4a2 2 0 0 0 1.7-2.8L13.7 3.4a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
        info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
        package: '<path d="m21 8-9 5-9-5 9-5 9 5Z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>',
        cart: '<circle cx="8" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M2 3h2l2.4 11.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 1.9-1.5L21 7H6"/>',
        settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-2.8 2.8-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1.1 1.7v.2h-4v-.2a1.8 1.8 0 0 0-1.1-1.7 1.8 1.8 0 0 0-2 .4l-.1.1-2.8-2.8.1-.1a1.8 1.8 0 0 0 .4-2A1.8 1.8 0 0 0 2.7 14h-.2v-4h.2A1.8 1.8 0 0 0 4.4 9a1.8 1.8 0 0 0-.4-2l-.1-.1 2.8-2.8.1.1a1.8 1.8 0 0 0 2 .4A1.8 1.8 0 0 0 10 2.9v-.2h4v.2a1.8 1.8 0 0 0 1.1 1.7 1.8 1.8 0 0 0 2-.4l.1-.1L20 7l-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.7 1.1h.2v4h-.2a1.8 1.8 0 0 0-1.8.8Z"/>',
        logout: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-6"/>',
        search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
        phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
        dollar: '<circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.6-.6-1.6-1-3-1-1.7 0-3 1-3 2.3 0 3.5 6 1.7 6 5.1 0 1.3-1.3 2.2-3 2.2-1.4 0-2.5-.4-3.2-1.1M12 5.5v13"/>',
        tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1"/>',
        users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
        edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
        trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5"/>',
        plus: '<path d="M12 5v14M5 12h14"/>',
        star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
        monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
        home: '<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9Z"/><path d="M9 21v-6h6v6"/>',
        book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
        activity: '<path d="M3 12h4l3-7 4 14 3-7h4"/>'
    };
    return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.package}</svg>`;
}

function categoryIcon(category) {
    const name = `${category?.name || ''} ${category?.description || ''}`.toLowerCase();
    if (/electronic|tech|phone|computer/.test(name)) return icon('monitor', 'category-svg');
    if (/home|furniture|kitchen/.test(name)) return icon('home', 'category-svg');
    if (/book|stationery/.test(name)) return icon('book', 'category-svg');
    if (/sport|fitness/.test(name)) return icon('activity', 'category-svg');
    return icon('package', 'category-svg');
}

// ── Toast System ────────────────────────────────────────────
function showToast(message, type = 'info', duration = 4000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = { success: 'check', error: 'close', warning: 'alert', info: 'info' };

    toast.innerHTML = `
        ${icon(icons[type] || icons.info, 'toast-icon')}
        <span class="toast-message">${message}</span>
        <button class="toast-close" aria-label="Dismiss notification" onclick="this.parentElement.classList.add('removing'); setTimeout(() => this.parentElement.remove(), 300);">${icon('close')}</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ── Star Rating HTML ────────────────────────────────────────
function renderStars(rating, count = null) {
    let html = '<div class="stars">';
    for (let i = 1; i <= 5; i++) {
        html += i <= Math.round(rating)
            ? '<span class="star">★</span>'
            : '<span class="star star-empty">★</span>';
    }
    html += '</div>';
    if (count !== null) {
        html += `<span class="rating-count">(${count})</span>`;
    }
    return html;
}

// ── Imported product text ───────────────────────────────────
// Imported catalog data can contain raw Taobao SKU labels. Keep a small
// client-side safety net for products already saved before server-side
// normalization was added, so customer pages never expose Chinese text.
function toEnglishProductText(value, fallback = '') {
    if (value === null || value === undefined) return fallback;

    const replacements = {
        '机械轴': 'Mechanical Switch', '无线': 'Wireless', '有线': 'Wired',
        '蓝牙': 'Bluetooth', '三模': 'Tri-Mode', '红轴': 'Red Switch',
        '青轴': 'Blue Switch', '茶轴': 'Brown Switch', '黑轴': 'Black Switch',
        '银轴': 'Silver Switch', '黄轴': 'Yellow Switch', '磁轴': 'Magnetic Switch',
        '灰木磁轴': 'Greystone Magnetic', '线性轴': 'Linear Switch',
        '段落轴': 'Tactile Switch', '触发轴': 'RT Switch',
        '白色': 'White', '黑色': 'Black', '灰色': 'Grey', '银色': 'Silver',
        '金色': 'Gold', '蓝色': 'Blue', '红色': 'Red', '绿色': 'Green',
        '粉色': 'Pink', '紫色': 'Purple', '橙色': 'Orange',
        '透明': 'Clear', '白透': 'White Clear', '黑透': 'Black Clear',
        '锻碳纹': 'Carbon Fiber', '折影': 'Shadow', '黑雾': 'Dark Fog',
        '侧刻': 'Side Print', '正刻': 'Top Print',
        '标准版': 'Standard Edition', '标配': 'Standard',
        '豪华版': 'Deluxe Edition', '旗舰版': 'Flagship Edition',
        '套餐类型': 'Bundle Type', '颜色分类': 'Color', '规格': 'Spec',
        '版本': 'Version', '套装': 'Bundle', '单件': 'Single',
        '国行': 'CN Version', '国际版': 'International',
        '中国大陆': 'CN', '全网通': 'All-Network',
        '存储容量': 'Storage', '运行内存': 'RAM',
        '包邮': '', '爆款': '', '秒杀': '', '新款': '', '现货': '',
        '旗舰店': '', '专卖店': '', '顺丰': '',
    };

    let text = String(value);
    Object.entries(replacements)
        .sort(([a], [b]) => b.length - a.length)
        .forEach(([chinese, english]) => { text = text.replaceAll(chinese, ` ${english} `); });

    // Remove untranslated CJK fragments rather than showing source-market text.
    text = text
        .replace(/[\u3400-\u4dbf\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+/g, ' ')
        .replace(/[【】〔〕（）]/g, ' ')
        .split('/')
        .map(part => part.replace(/^[\s\-–—|]+|[\s\-–—|]+$/g, '').trim())
        .filter(Boolean)
        .join(' / ')
        .replace(/\s+/g, ' ')
        .trim();

    return text || fallback;
}

// ── Format Price ────────────────────────────────────────────
function formatPrice(price) {
    let prefs = {};
    try {
        const prefsVal = localStorage.getItem('buybibz-prefs');
        if (prefsVal) prefs = JSON.parse(prefsVal);
    } catch (e) {
        console.error("Failed to parse buybibz-prefs:", e);
    }
    const currency = prefs.currency || 'USD';
    const locale = (typeof i18n !== 'undefined' && i18n.getLang() === 'km') ? 'km-KH' : 'en-US';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
    }).format(price);
}

// ── Format Date ─────────────────────────────────────────────
function formatDate(dateStr) {
    const locale = (typeof i18n !== 'undefined' && i18n.getLang() === 'km') ? 'km-KH' : 'en-US';
    return new Date(dateStr).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

// ── Cart Badge Update ───────────────────────────────────────
async function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;

    if (!api.isLoggedIn()) {
        badge.style.display = 'none';
        return;
    }

    try {
        const data = await api.getCart();
        if (data.count > 0) {
            badge.textContent = data.count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    } catch {
        badge.style.display = 'none';
    }
}

// ── Add to Cart (shared) ────────────────────────────────────
async function addToCart(productId, quantity = 1, selectedOptions = {}) {
    return addToCartWithPrice(productId, quantity, selectedOptions, null);
}

async function addToCartWithPrice(productId, quantity = 1, selectedOptions = {}, unitPrice = null) {
    if (!api.isLoggedIn()) {
        showToast(typeof i18n !== 'undefined' ? i18n.t('cart.sign_in_required') : 'Please sign in to add items to cart', 'warning');
        window.location.href = `auth.html?redirect=${encodeURIComponent(window.location.pathname.split('/').pop())}`;
        return;
    }

    // Show success immediately (optimistic)
    showToast(typeof i18n !== 'undefined' ? i18n.t('cart.added') : 'Added to cart!', 'success');

    // Update badge optimistically
    const badge = document.getElementById('cart-badge');
    if (badge) {
        const currentCount = parseInt(badge.textContent) || 0;
        badge.textContent = currentCount + quantity;
        badge.style.display = 'flex';
    }

    try {
        const body = { product_id: productId, quantity, selected_options: selectedOptions };
        if (unitPrice !== null && !isNaN(unitPrice) && unitPrice > 0) {
            body.unit_price = unitPrice;
        }
        await api.request('/api/cart', { method: 'POST', body: JSON.stringify(body) });
        updateCartBadge();
    } catch (err) {
        if (badge) {
            const currentCount = parseInt(badge.textContent) || 0;
            const revertedCount = Math.max(0, currentCount - quantity);
            badge.textContent = revertedCount;
            badge.style.display = revertedCount > 0 ? 'flex' : 'none';
        }
        showToast(err.message, 'error');
    }
}

// ── Render Navbar ───────────────────────────────────────────
function renderNavbar() {
    const nav = document.getElementById('navbar');
    if (!nav) return;

    const user = api.getUser();
    const isLoggedIn = api.isLoggedIn();
    const isAdmin = api.isAdmin();

    const isSubfolder = window.location.pathname.includes('/admin/');
    const prefix = isSubfolder ? '../' : '';
    const currentPage = isSubfolder ? 'admin' : (window.location.pathname.split('/').pop() || 'index.html');
    const isActiveAdmin = isSubfolder || currentPage === 'admin.html' || currentPage === 'admin';

    const _t = typeof i18n !== 'undefined' ? i18n.t.bind(i18n) : (k) => k;

    nav.innerHTML = `
        <div class="container">
            <a href="${prefix}index.html" class="nav-brand">
                <img src="${prefix}../logo/logo.jpg" alt="BuyBIBZ">
                <span class="brand-wordmark">BuyBIBZ</span>
            </a>

            <nav class="nav-links" id="nav-links">
                <a href="${prefix}index.html" class="${currentPage === 'index.html' ? 'active' : ''}" data-i18n="nav.home">${_t('nav.home')}</a>
                <a href="${prefix}products.html" class="${currentPage === 'products.html' ? 'active' : ''}" data-i18n="nav.shop">${_t('nav.shop')}</a>
                <a href="${prefix}about.html" class="${currentPage === 'about.html' ? 'active' : ''}" data-i18n="nav.about">${_t('nav.about')}</a>
                <a href="${prefix}customer-service.html" class="${currentPage === 'customer-service.html' ? 'active' : ''}" data-i18n="nav.support">${_t('nav.support')}</a>
                ${isAdmin ? `<a href="${prefix}admin/index.html" class="${isActiveAdmin ? 'active' : ''}" data-i18n="nav.admin">${_t('nav.admin')}</a>` : ''}
            </nav>

            <div class="nav-actions">
                <a href="${prefix}cart.html" class="nav-icon-btn" id="cart-icon-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                    <span class="cart-badge" id="cart-badge" style="display: none;">0</span>
                </a>

                <button class="nav-icon-btn theme-toggle" id="theme-toggle" type="button" onclick="toggleTheme()"></button>

                ${isLoggedIn ? `
                    <div class="nav-user-menu">
                        <button class="nav-user-btn">
                            <div class="nav-user-avatar">${(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}</div>
                            <span style="font-size: 0.85rem; font-weight: 600;">${user?.full_name || user?.email?.split('@')[0] || 'User'}</span>
                        </button>
                        <div class="nav-user-dropdown">
                            <a href="${prefix}profile.html">${icon('users')} <span data-i18n="nav.profile">${_t('nav.profile')}</span></a>
                            <a href="${prefix}orders.html">${icon('package')} <span data-i18n="nav.orders">${_t('nav.orders')}</span></a>
                            ${isAdmin ? `<a href="${prefix}admin/index.html">${icon('settings')} <span data-i18n="nav.admin_panel">${_t('nav.admin_panel')}</span></a>` : ''}
                            <div class="divider"></div>
                            <button onclick="handleLogout()">${icon('logout')} <span data-i18n="nav.sign_out">${_t('nav.sign_out')}</span></button>
                        </div>
                    </div>
                ` : `
                    <a href="${prefix}auth.html" class="nav-auth-btn nav-login-btn" data-i18n="nav.sign_in">${_t('nav.sign_in')}</a>
                `}

                <button class="nav-mobile-toggle" id="mobile-toggle" onclick="toggleMobileNav()">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </div>
    `;

    setTheme(document.documentElement.dataset.theme || getPreferredTheme());

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 20);
    });

    // Update cart badge
    updateCartBadge();
}

function toggleMobileNav() {
    const toggle = document.getElementById('mobile-toggle');
    let backdrop = document.getElementById('offcanvas-backdrop');
    let menu = document.getElementById('offcanvas-menu');

    // If the drawer doesn't exist yet, create it
    if (!menu) {
        const _t = typeof i18n !== 'undefined' ? i18n.t.bind(i18n) : (k) => k;
        const user = api.getUser();
        const isLoggedIn = api.isLoggedIn();
        const isAdmin = api.isAdmin();
        
        const isSubfolder = window.location.pathname.includes('/admin/');
        const prefix = isSubfolder ? '../' : '';
        const currentPage = isSubfolder ? 'admin' : (window.location.pathname.split('/').pop() || 'index.html');
        const isActiveAdmin = isSubfolder || currentPage === 'admin.html' || currentPage === 'admin';

        // Backdrop
        backdrop = document.createElement('div');
        backdrop.className = 'offcanvas-backdrop';
        backdrop.id = 'offcanvas-backdrop';
        backdrop.addEventListener('click', toggleMobileNav);
        document.body.appendChild(backdrop);

        // Menu
        menu = document.createElement('div');
        menu.className = 'offcanvas-menu';
        menu.id = 'offcanvas-menu';
        menu.innerHTML = `
            <div class="offcanvas-header">
                <h3 data-i18n="nav.menu">${_t('nav.menu')}</h3>
                <div style="display:flex;align-items:center;gap:8px;">
                    <button class="nav-icon-btn theme-toggle" type="button" onclick="toggleTheme()" style="width:36px;height:36px;" title="Toggle theme"></button>
                    <button class="offcanvas-close" onclick="toggleMobileNav()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                </div>
            </div>
            <div class="offcanvas-body">
                <a href="${prefix}index.html" class="offcanvas-link ${currentPage === 'index.html' ? 'active' : ''}">
                    ${icon('home')} <span data-i18n="nav.home">${_t('nav.home')}</span>
                </a>
                <a href="${prefix}products.html" class="offcanvas-link ${currentPage === 'products.html' ? 'active' : ''}">
                    ${icon('tag')} <span data-i18n="nav.shop">${_t('nav.shop')}</span>
                </a>
                <a href="${prefix}about.html" class="offcanvas-link ${currentPage === 'about.html' ? 'active' : ''}">
                    ${icon('info')} <span data-i18n="nav.about">${_t('nav.about')}</span>
                </a>
                <a href="${prefix}customer-service.html" class="offcanvas-link ${currentPage === 'customer-service.html' ? 'active' : ''}">
                    ${icon('phone')} <span data-i18n="nav.support">${_t('nav.support')}</span>
                </a>
                <a href="${prefix}cart.html" class="offcanvas-link ${currentPage === 'cart.html' ? 'active' : ''}">
                    ${icon('cart')} <span data-i18n="nav.cart">${_t('nav.cart')}</span>
                </a>
                ${isLoggedIn ? `
                    <div class="offcanvas-divider"></div>
                    <a href="${prefix}profile.html" class="offcanvas-link ${currentPage === 'profile.html' ? 'active' : ''}">
                        ${icon('users')} <span data-i18n="nav.profile">${_t('nav.profile')}</span>
                    </a>
                    <a href="${prefix}orders.html" class="offcanvas-link ${currentPage === 'orders.html' ? 'active' : ''}">
                        ${icon('package')} <span data-i18n="nav.orders">${_t('nav.orders')}</span>
                    </a>
                    ${isAdmin ? `
                        <a href="${prefix}admin/index.html" class="offcanvas-link ${isActiveAdmin ? 'active' : ''}">
                            ${icon('settings')} <span data-i18n="nav.admin_panel">${_t('nav.admin_panel')}</span>
                        </a>
                    ` : ''}
                ` : ''}
            </div>
            <div class="offcanvas-footer">
                ${isLoggedIn ? `
                    <button class="btn btn-outline" onclick="handleLogout()">
                        ${icon('logout')} <span data-i18n="nav.sign_out">${_t('nav.sign_out')}</span>
                    </button>
                ` : `
                    <a href="${prefix}auth.html" class="btn btn-primary" data-i18n="nav.sign_in">${_t('nav.sign_in')}</a>
                `}
            </div>
        `;
        document.body.appendChild(menu);

        // Open with a tiny delay so the CSS transition fires
        requestAnimationFrame(() => {
            backdrop.classList.add('active');
            menu.classList.add('open');
            toggle?.classList.add('is-open');
            document.body.style.overflow = 'hidden';
            // Initialize theme toggle icon inside drawer
            setTheme(document.documentElement.dataset.theme || getPreferredTheme());
        });
    } else {
        // Toggle existing drawer
        const isOpen = menu.classList.contains('open');
        if (isOpen) {
            menu.classList.remove('open');
            backdrop?.classList.remove('active');
            toggle?.classList.remove('is-open');
            document.body.style.overflow = '';
            // Remove from DOM after transition
            setTimeout(() => {
                backdrop?.remove();
                menu?.remove();
            }, 350);
        } else {
            backdrop?.classList.add('active');
            menu.classList.add('open');
            toggle?.classList.add('is-open');
            document.body.style.overflow = 'hidden';
        }
    }
}

async function handleLogout() {
    const isSubfolder = window.location.pathname.includes('/admin/');
    const prefix = isSubfolder ? '../' : '';
    try {
        await api.logout();
        showToast(typeof i18n !== 'undefined' ? i18n.t('common.signed_out') : 'Signed out successfully', 'info');
        setTimeout(() => window.location.href = `${prefix}index.html`, 500);
    } catch (err) {
        // Clear session anyway
        api.clearSession();
        window.location.href = `${prefix}index.html`;
    }
}

// ── Render Footer ───────────────────────────────────────────
function renderFooter() {
    const footer = document.getElementById('footer');
    if (!footer) return;

    const isSubfolder = window.location.pathname.includes('/admin/');
    const prefix = isSubfolder ? '../' : '';
    const _t = typeof i18n !== 'undefined' ? i18n.t.bind(i18n) : (k) => k;

    footer.innerHTML = `
        <div class="container">
            <div class="footer-grid">
                <div>
                    <div class="footer-brand">
                        <img src="${prefix}../logo/logo.jpg" alt="BuyBIBZ">
                        <span class="brand-wordmark">BuyBIBZ</span>
                    </div>
                    <p class="footer-desc" data-i18n="footer.desc">${_t('footer.desc')}</p>
                    <div class="footer-social">
                        <a href="#" aria-label="Twitter">${icon('close')}</a>
                        <a href="#" aria-label="Instagram">${icon('activity')}</a>
                        <a href="#" aria-label="Facebook">${icon('users')}</a>
                        <a href="#" aria-label="LinkedIn">${icon('info')}</a>
                    </div>
                </div>
                <div class="footer-col">
                    <h4 data-i18n="footer.shop">${_t('footer.shop')}</h4>
                    <a href="${prefix}products.html" data-i18n="footer.all_products">${_t('footer.all_products')}</a>
                    <a href="${prefix}products.html?featured=true" data-i18n="footer.featured">${_t('footer.featured')}</a>
                    <a href="${prefix}products.html?sort=newest" data-i18n="footer.new_arrivals">${_t('footer.new_arrivals')}</a>
                    <a href="${prefix}products.html?sort=price_asc" data-i18n="footer.best_deals">${_t('footer.best_deals')}</a>
                </div>
                <div class="footer-col">
                    <h4 data-i18n="footer.account">${_t('footer.account')}</h4>
                    <a href="${prefix}auth.html" data-i18n="footer.sign_in">${_t('footer.sign_in')}</a>
                    <a href="${prefix}cart.html" data-i18n="footer.my_cart">${_t('footer.my_cart')}</a>
                    <a href="${prefix}orders.html" data-i18n="footer.order_history">${_t('footer.order_history')}</a>
                </div>
                <div class="footer-col">
                    <h4 data-i18n="footer.support">${_t('footer.support')}</h4>
                    <a href="#" data-i18n="footer.contact">${_t('footer.contact')}</a>
                    <a href="#" data-i18n="footer.faq">${_t('footer.faq')}</a>
                    <a href="#" data-i18n="footer.shipping">${_t('footer.shipping')}</a>
                    <a href="#" data-i18n="footer.returns">${_t('footer.returns')}</a>
                </div>
            </div>
            <div class="footer-bottom">
                <span data-i18n="footer.copyright">${_t('footer.copyright')}</span>
                <span data-i18n="footer.tagline">${_t('footer.tagline')}</span>
            </div>
        </div>
    `;
}

// ── Product Card HTML ───────────────────────────────────────
function renderProductCard(product) {
    const isSubfolder = window.location.pathname.includes('/admin/');
    const prefix = isSubfolder ? '../' : '';
    const category = product.categories || product.category;
    const categoryName = category?.name || '';
    const discount = product.compare_price
        ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
        : 0;
    const hasFreeShipping = product.attributes?.free_shipping === true;
    const isOutOfStock = !product.stock || product.stock <= 0;
    // Any attribute with multiple options requires the customer to choose on the product page first
    const needsVariantSelection = Object.values(product.attributes || {}).some(v => Array.isArray(v) && v.length > 1);
    const _t = typeof i18n !== 'undefined' ? i18n.t.bind(i18n) : (k) => k;

    return `
        <div class="product-card${isOutOfStock ? ' product-card-oos' : ''}" onclick="window.location.href='${prefix}product-detail.html?id=${product.id}'">
            <div class="product-card-image">
                <img src="${product.image_url || 'https://via.placeholder.com/400x400?text=No+Image'}" alt="${product.name}" loading="lazy"${isOutOfStock ? ' style="opacity:0.6;"' : ''}>
                ${!isOutOfStock && discount > 0 ? `<span class="product-card-badge badge-sale">-${discount}%</span>` : ''}
                ${product.is_featured && !isOutOfStock ? `<span class="product-card-badge badge-featured">${_t('product.featured')}</span>` : ''}
                ${hasFreeShipping ? `<span class="product-card-badge badge-shipping"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg> ${_t('product.free_shipping')}</span>` : ''}
                ${isOutOfStock ? `<span class="product-card-badge badge-oos">${_t('product.out_of_stock')}</span>` : ''}
            </div>
            <div class="product-card-body">
                ${categoryName ? `<div class="product-card-category">${categoryName}</div>` : ''}
                <div class="product-card-name">${product.name}</div>
                <div class="product-card-rating">
                    ${renderStars(product.rating_avg || 0, product.rating_count || 0)}
                </div>
                <div class="product-card-footer">
                    <div class="product-card-price">
                        <span class="price-current">${formatPrice(product.price)}</span>
                        ${product.compare_price ? `<span class="price-compare">${formatPrice(product.compare_price)}</span>` : ''}
                    </div>
                    ${isOutOfStock
                        ? `<button class="product-card-add-btn product-card-add-btn-oos" disabled title="${_t('product.out_of_stock')}" style="opacity:0.4;cursor:not-allowed;background:var(--text-tertiary);">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                           </button>`
                        : `<button class="product-card-add-btn" onclick="event.stopPropagation(); ${needsVariantSelection ? `window.location.href='${prefix}product-detail.html?id=${product.id}'` : `addToCart(${product.id})`}" title="${needsVariantSelection ? _t('product.choose_options') : _t('product.add_to_cart')}">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                           </button>`
                    }
                </div>
            </div>
        </div>
    `;
}

// ── Scroll Animations ───────────────────────────────────────
function initScrollAnimations() {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

// ── Status Badge HTML ───────────────────────────────────────
function renderStatusBadge(status) {
    return `<span class="status-badge status-${status}">${status}</span>`;
}

// ── DOM Ready ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    renderNavbar();
    renderFooter();
    renderMobileBottomNav();
    initScrollAnimations();
    // Apply translations to static data-i18n elements after render
    if (typeof i18n !== 'undefined') {
        i18n.applyTranslations();
    }
});

// ── Render Mobile Bottom Navigation ─────────────────────────
function renderMobileBottomNav() {
    // Only render on mobile screens
    if (window.innerWidth > 768) return;
    
    // Check if already exists
    if (document.querySelector('.mobile-bottom-nav')) return;
    
    const isSubfolder = window.location.pathname.includes('/admin/');
    const prefix = isSubfolder ? '../' : '';
    const currentPage = isSubfolder ? 'admin' : (window.location.pathname.split('/').pop() || 'index.html');
    const isLoggedIn = api.isLoggedIn();
    
    const _t = typeof i18n !== 'undefined' ? i18n.t.bind(i18n) : (k) => k;
    const bottomNav = document.createElement('nav');
    bottomNav.className = 'mobile-bottom-nav';
    bottomNav.innerHTML = `
        <a href="${prefix}index.html" class="mobile-bottom-nav-item ${currentPage === 'index.html' ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span data-i18n="mobile_nav.home">${_t('mobile_nav.home')}</span>
        </a>
        
        <a href="${prefix}products.html" class="mobile-bottom-nav-item ${currentPage === 'products.html' ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="8" cy="21" r="1"/>
                <circle cx="19" cy="21" r="1"/>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
            </svg>
            <span data-i18n="mobile_nav.shop">${_t('mobile_nav.shop')}</span>
        </a>
        
        <a href="${prefix}cart.html" class="mobile-bottom-nav-item ${currentPage === 'cart.html' ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" x2="21" y1="6" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span data-i18n="mobile_nav.cart">${_t('mobile_nav.cart')}</span>
            <span class="mobile-bottom-nav-badge" id="mobile-cart-count" style="display: none;">0</span>
        </a>
        
        ${isLoggedIn ? `
            <a href="${prefix}orders.html" class="mobile-bottom-nav-item ${currentPage === 'orders.html' ? 'active' : ''}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m7.5 4.27 9 5.15"/>
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                    <path d="m3.3 7 8.7 5 8.7-5"/>
                    <path d="M12 22V12"/>
                </svg>
                <span data-i18n="mobile_nav.orders">${_t('mobile_nav.orders')}</span>
            </a>
            
            <a href="${prefix}profile.html" class="mobile-bottom-nav-item ${currentPage === 'profile.html' ? 'active' : ''}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
                <span data-i18n="mobile_nav.profile">${_t('mobile_nav.profile')}</span>
            </a>
        ` : `
            <a href="${prefix}auth.html" class="mobile-bottom-nav-item ${currentPage === 'auth.html' ? 'active' : ''}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
                <span data-i18n="mobile_nav.sign_in">${_t('mobile_nav.sign_in')}</span>
            </a>
        `}
    `;
    
    document.body.appendChild(bottomNav);
    
    // Update mobile cart badge
    updateMobileCartBadge();
}

// ── Update Mobile Cart Badge ────────────────────────────────
async function updateMobileCartBadge() {
    const badge = document.getElementById('mobile-cart-count');
    if (!badge) return;

    if (!api.isLoggedIn()) {
        badge.style.display = 'none';
        return;
    }

    try {
        const data = await api.getCart();
        if (data.count > 0) {
            badge.textContent = data.count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    } catch {
        badge.style.display = 'none';
    }
}

// Update both cart badges
const originalUpdateCartBadge = updateCartBadge;
updateCartBadge = async function() {
    await originalUpdateCartBadge();
    await updateMobileCartBadge();
};

// Re-render bottom nav on window resize
window.addEventListener('resize', () => {
    const bottomNav = document.querySelector('.mobile-bottom-nav');
    if (window.innerWidth > 768 && bottomNav) {
        bottomNav.remove();
        document.body.style.paddingBottom = '';
    } else if (window.innerWidth <= 768 && !bottomNav) {
        renderMobileBottomNav();
    }
});
