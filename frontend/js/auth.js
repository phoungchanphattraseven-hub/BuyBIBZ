/**
 * BuyBIBZ — Auth Module
 * Handles login, register, and auth state UI
 */

function initAuth() {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');

    if (loginTab && registerTab) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
            if (title) title.textContent = 'Welcome Back';
            if (subtitle) subtitle.textContent = 'Sign in to continue shopping at BuyBIBZ';
        });

        registerTab.addEventListener('click', () => {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
            if (title) title.textContent = 'Create your account';
            if (subtitle) subtitle.textContent = 'A few details and you are ready to shop.';
        });
    }

    // Login form
    const loginFormEl = document.getElementById('login-form-el');
    if (loginFormEl) {
        loginFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginFormEl.querySelector('button[type="submit"]');
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            btn.disabled = true;
            btn.textContent = 'Signing in...';

            try {
                await api.login(email, password);
                showToast('Welcome back!', 'success');
                setTimeout(() => {
                    const redirect = new URLSearchParams(window.location.search).get('redirect') || 'index.html';
                    window.location.href = redirect;
                }, 500);
            } catch (err) {
                showToast(err.message, 'error');
                btn.disabled = false;
                btn.textContent = 'Sign In';
            }
        });
    }

    // Register form
    const registerFormEl = document.getElementById('register-form-el');
    if (registerFormEl) {
        registerFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = registerFormEl.querySelector('button[type="submit"]');
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;

            if (password !== confirmPassword) {
                showToast('Passwords do not match', 'error');
                return;
            }

            if (password.length < 6) {
                showToast('Password must be at least 6 characters', 'error');
                return;
            }

            btn.disabled = true;
            btn.textContent = 'Creating account...';

            try {
                await api.register(email, password, name);
                showToast('Account created! Welcome to BuyBIBZ!', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
            } catch (err) {
                showToast(err.message, 'error');
                btn.disabled = false;
                btn.textContent = 'Create Account';
            }
        });
    }
}

// Redirect if already logged in
function redirectIfLoggedIn() {
    if (api.isLoggedIn()) {
        window.location.href = 'index.html';
    }
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!api.isLoggedIn()) {
        window.location.href = `auth.html?redirect=${encodeURIComponent(window.location.pathname.split('/').pop())}`;
        return false;
    }
    return true;
}

// Require admin role
function requireAdmin() {
    if (!requireAuth()) return false;
    if (!api.isAdmin()) {
        showToast('Admin access required', 'error');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}
