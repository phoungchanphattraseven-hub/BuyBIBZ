/**
 * BuyBIBZ — API Client
 * Central fetch wrapper with JWT authentication
 */

// Auto-detect API base URL
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : window.location.origin;

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

    async request(endpoint, options = {}, timeoutMs = 10000) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

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
                    this.clearSession();
                    const isSubfolder = window.location.pathname.includes('/admin/');
                    const prefix = isSubfolder ? '../' : '';
                    const protectedPages = ['cart.html', 'profile.html', 'checkout.html', 'orders.html', 'admin.html'];
                    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
                    if (isSubfolder) {
                        window.location.href = 'login.html';
                        return;
                    } else if (protectedPages.includes(currentPage)) {
                        window.location.href = `auth.html?redirect=${encodeURIComponent(currentPage)}`;
                        return;
                    } else if (typeof renderNavbar === 'function') {
                        renderNavbar();
                    }
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
        await this.post('/api/auth/logout', {});
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
