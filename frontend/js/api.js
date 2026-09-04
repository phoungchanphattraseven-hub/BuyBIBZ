/**
 * BuyBIBZ — API Client
 * Central fetch wrapper with JWT authentication
 */

// Auto-detect API base URL
const API_BASE = (() => {
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Development: backend always runs on port 8000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://127.0.0.1:8000';
    }
    
    // Production: use same origin
    return window.location.origin;
})();

class ApiClient {
    constructor() {
        this.baseUrl = API_BASE;
    }

    getToken() {
        try {
            const sessionVal = localStorage.getItem('buybibz_session');
            if (!sessionVal || sessionVal === 'undefined') return null;
            const session = JSON.parse(sessionVal);
            return session?.access_token || null;
        } catch (e) {
            console.error("Failed to parse buybibz_session:", e);
            localStorage.removeItem('buybibz_session');
            return null;
        }
    }

    getUser() {
        try {
            const userVal = localStorage.getItem('buybibz_user');
            if (!userVal || userVal === 'undefined') return null;
            return JSON.parse(userVal);
        } catch (e) {
            console.error("Failed to parse buybibz_user:", e);
            localStorage.removeItem('buybibz_user');
            return null;
        }
    }

    isLoggedIn() {
        return !!this.getToken();
    }

    isAdmin() {
        const user = this.getUser();
        return user?.role === 'admin';
    }

    setSession(session, user) {
        localStorage.setItem('buybibz_session', JSON.stringify(session));
        localStorage.setItem('buybibz_user', JSON.stringify(user));
    }

    clearSession() {
        localStorage.removeItem('buybibz_session');
        localStorage.removeItem('buybibz_user');
    }

    // ── Token refresh ─────────────────────────
    // Supabase access tokens expire (~1 hour). When expired or about to
    // expire, exchange the stored refresh token for a new session so users
    // stay logged in instead of being signed out on the next 401.

    async refreshTokens() {
        // Dedupe concurrent refreshes into a single request
        if (this._refreshPromise) return this._refreshPromise;
        this._refreshPromise = (async () => {
            try {
                const sessionVal = localStorage.getItem('buybibz_session');
                if (!sessionVal || sessionVal === 'undefined') return false;
                const session = JSON.parse(sessionVal);
                const refreshToken = session?.refresh_token;
                if (!refreshToken) return false;

                const res = await fetch(`${this.baseUrl}/api/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: refreshToken }),
                });
                if (!res.ok) return false;

                const data = await res.json();
                if (!data?.session?.access_token) return false;

                // Preserve any extra fields, overwrite tokens + expiry
                const newSession = { ...session, ...data.session };
                localStorage.setItem('buybibz_session', JSON.stringify(newSession));
                return true;
            } catch (e) {
                return false;
            } finally {
                this._refreshPromise = null;
            }
        })();
        return this._refreshPromise;
    }

    // Returns true if a proactive refresh was needed but failed
    async ensureFreshToken(endpoint) {
        if (endpoint.startsWith('/api/auth/')) return false;
        try {
            const sessionVal = localStorage.getItem('buybibz_session');
            if (!sessionVal || sessionVal === 'undefined') return false;
            const session = JSON.parse(sessionVal);
            const exp = session?.expires_at;
            if (!exp) return false;
            const expMs = exp < 1e12 ? exp * 1000 : exp; // seconds → ms
            if (Date.now() >= expMs - 60000) {
                return !(await this.refreshTokens());
            }
        } catch (e) {}
        return false;
    }

    handleAuthFailure() {
        this.clearSession();
        const isSubfolder = window.location.pathname.includes('/admin/');
        const prefix = isSubfolder ? '../' : '';
        const protectedPages = ['cart.html', 'profile.html', 'checkout.html', 'orders.html', 'admin.html'];
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        if (isSubfolder) {
            window.location.href = 'login.html';
        } else if (protectedPages.includes(currentPage)) {
            window.location.href = `auth.html?redirect=${encodeURIComponent(currentPage)}`;
        } else if (typeof renderNavbar === 'function') {
            renderNavbar();
        }
    }

    async request(endpoint, options = {}, timeoutMs = 10000) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        // Proactively refresh an expired/near-expiry token before sending
        const proactiveFailed = await this.ensureFreshToken(endpoint);
        if (proactiveFailed) {
            this.handleAuthFailure();
            throw new Error('Your session has expired. Please log in again.');
        }

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                signal: controller.signal,
            });
            clearTimeout(timer);

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired mid-session: try one refresh + retry
                    if (!options._retried && !endpoint.startsWith('/api/auth/')) {
                        const refreshed = await this.refreshTokens();
                        if (refreshed) {
                            return this.request(endpoint, { ...options, _retried: true }, timeoutMs);
                        }
                    }
                    this.handleAuthFailure();
                }
                throw new Error(data.detail || `Request failed (${response.status})`);
            }

            return data;
        } catch (error) {
            clearTimeout(timer);
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please check your connection and try again.');
            }
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Cannot connect to server. Make sure the backend is running.');
            }
            throw error;
        }
    }

    // GET
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    // POST
    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    // PUT
    async put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }

    // DELETE
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // ── Auth ────────────────────────────────
    async register(email, password, fullName) {
        const data = await this.post('/api/auth/register', {
            email, password, full_name: fullName,
        });
        if (data.session) {
            this.setSession(data.session, data.user);
        }
        return data;
    }

    async login(email, password) {
        const data = await this.post('/api/auth/login', { email, password });
        if (data.session) {
            this.setSession(data.session, data.user);
        }
        return data;
    }

    async logout() {
        // Always clear the local session, even if the API call fails
        // (e.g. token already expired)
        try {
            await this.post('/api/auth/logout', {});
        } catch (e) {}
        this.clearSession();
    }

    async getMe() {
        return this.get('/api/auth/me');
    }
    
    async getProfile() {
        return this.get('/api/auth/me');
    }
    
    async updateProfile(data) {
        return this.put('/api/auth/me', data);
    }

    // ── Products ────────────────────────────
    async getProducts(params = {}) {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                query.set(key, value);
            }
        });
        return this.get(`/api/products?${query.toString()}`);
    }

    async getProduct(id) {
        return this.get(`/api/products/${id}`);
    }

    async createProduct(product) {
        return this.post('/api/products', product);
    }

    async updateProduct(id, product) {
        return this.put(`/api/products/${id}`, product);
    }

    async deleteProduct(id) {
        return this.delete(`/api/products/${id}`);
    }

    async saveProductImages(productId, images) {
        return this.post(`/api/products/${productId}/images`, { images });
    }

    // ── Categories ──────────────────────────
    async getCategories() {
        return this.get('/api/categories');
    }

    // ── Cart ────────────────────────────────
    async getCart() {
        return this.get('/api/cart');
    }

    async addToCart(productId, quantity = 1, selectedOptions = {}) {
        return this.post('/api/cart', {
            product_id: productId,
            quantity,
            selected_options: selectedOptions,
        });
    }

    async updateCartItem(itemId, quantity) {
        return this.put(`/api/cart/${itemId}`, { quantity });
    }

    async removeCartItem(itemId) {
        return this.delete(`/api/cart/${itemId}`);
    }

    async clearCart() {
        return this.delete('/api/cart');
    }

    // ── Orders ──────────────────────────────
    async createOrder(orderData) {
        return this.post('/api/orders', orderData);
    }

    async getOrders() {
        return this.get('/api/orders');
    }

    async getOrder(id) {
        return this.get(`/api/orders/${id}`);
    }

    async updateOrderStatus(id, status) {
        return this.put(`/api/orders/${id}/status`, { status });
    }

    // ── Reviews ─────────────────────────────
    async getReviews(productId) {
        return this.get(`/api/reviews/${productId}`);
    }

    async createReview(productId, rating, comment) {
        return this.post('/api/reviews', {
            product_id: productId, rating, comment,
        });
    }

    async deleteReview(reviewId) {
        return this.delete(`/api/reviews/${reviewId}`);
    }

    // ── Admin ───────────────────────────────
    async getDashboard() {
        return this.get('/api/admin/dashboard');
    }

    async getAdminOrders() {
        return this.get('/api/admin/orders');
    }

    async getAdminProducts() {
        return this.get('/api/admin/products');
    }
    // ── Taobao Import ────────────────────────────────────────
    async previewTaobaoProduct(item) {
        return this.post('/api/products/import-taobao/preview', { item });
    }

    async importTaobaoProduct(item, categoryId = null) {
        return this.post('/api/products/import-taobao', { item, category_id: categoryId });
    }

    async bulkImportTaobao(items, categoryId = null) {
        return this.post('/api/products/import-taobao/bulk', {
            items,
            category_id: categoryId,
            concurrency: 2,
        });
    }

    // ── CJ Dropshipping (Free) ────────────────────────────────
    async cjSearch(keyword, page = 1, size = 20) {
        return this.get(`/api/products/cj/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`);
    }

    async cjGetDetail(pid) {
        return this.get(`/api/products/cj/detail/${encodeURIComponent(pid)}`);
    }

    async cjImportProduct(pid, categoryId = null) {
        return this.post('/api/products/cj/import', { pid, category_id: categoryId });
    }

    async cjBulkImport(pids, categoryId = null) {
        return this.post('/api/products/cj/import-bulk', { pids, category_id: categoryId });
    }
}

// Global instance
const api = new ApiClient();
