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
    const _t = typeof i18n !== 'undefined' ? i18n.t.bind(i18n) : (k) => k;

    if (loginTab && registerTab) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
            if (title) title.textContent = _t('auth.welcome_back');
            if (subtitle) subtitle.textContent = _t('auth.sign_in_subtitle');
        });

        registerTab.addEventListener('click', () => {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
            if (title) title.textContent = _t('auth.create_account_title');
            if (subtitle) subtitle.textContent = _t('auth.create_account_subtitle');
        });
    }

    // Apply initial translations to auth title/subtitle
    if (title) title.textContent = _t('auth.welcome_back');
    if (subtitle) subtitle.textContent = _t('auth.sign_in_subtitle');

    // Password toggle functionality
    initPasswordToggles();

    // Remember me functionality
    initRememberMe();

    // Login form
    const loginFormEl = document.getElementById('login-form-el');
    if (loginFormEl) {
        loginFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginFormEl.querySelector('button[type="submit"]');
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            btn.disabled = true;
            btn.textContent = _t('auth.signing_in');

            try {
                await api.login(email, password);
                showToast(_t('auth.welcome_msg'), 'success');
                setTimeout(() => {
                    const redirect = new URLSearchParams(window.location.search).get('redirect') || 'index.html';
                    window.location.href = redirect;
                }, 500);
            } catch (err) {
                showToast(err.message, 'error');
                btn.disabled = false;
                btn.textContent = _t('auth.sign_in_btn');
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
                showToast(_t('auth.password_mismatch'), 'error');
                return;
            }

            if (password.length < 6) {
                showToast(_t('auth.password_short'), 'error');
                return;
            }

            btn.disabled = true;
            btn.textContent = _t('auth.creating');

            try {
                await api.register(email, password, name);
                showToast(_t('auth.created_msg'), 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
            } catch (err) {
                showToast(err.message, 'error');
                btn.disabled = false;
                btn.textContent = _t('auth.create_btn');
            }
        });
    }
}

// Redirect if already logged in
function redirectIfLoggedIn() {
    if (api.isLoggedIn()) {
        const isSubfolder = window.location.pathname.includes('/admin/');
        const prefix = isSubfolder ? '../' : '';
        window.location.href = `${prefix}index.html`;
    }
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!api.isLoggedIn()) {
        const isSubfolder = window.location.pathname.includes('/admin/');
        if (isSubfolder) {
            window.location.href = 'login.html';
        } else {
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            window.location.href = `auth.html?redirect=${encodeURIComponent(currentPage)}`;
        }
        return false;
    }
    return true;
}

// Require admin role
function requireAdmin() {
    if (!requireAuth()) return false;
    if (!api.isAdmin()) {
        showToast('Admin access required', 'error');
        const isSubfolder = window.location.pathname.includes('/admin/');
        if (isSubfolder) {
            window.location.href = 'login.html';
        } else {
            window.location.href = 'index.html';
        }
        return false;
    }
    return true;
}

// Password toggle functionality
function initPasswordToggles() {
    const toggleButtons = document.querySelectorAll('.password-toggle');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const wrapper = button.closest('.password-input-wrapper');
            const input = wrapper.querySelector('input[type="password"], input[type="text"]');
            const eyeIcon = button.querySelector('.eye-icon');
            const eyeOffIcon = button.querySelector('.eye-off-icon');
            
            if (input.type === 'password') {
                input.type = 'text';
                eyeIcon.style.display = 'none';
                eyeOffIcon.style.display = 'block';
            } else {
                input.type = 'password';
                eyeIcon.style.display = 'block';
                eyeOffIcon.style.display = 'none';
            }
        });
    });
}

// Remember me functionality
function initRememberMe() {
    const rememberMeCheckbox = document.getElementById('remember-me');
    const emailInput = document.getElementById('login-email');
    
    if (!rememberMeCheckbox || !emailInput) return;
    
    // Load saved email if exists
    const savedEmail = localStorage.getItem('buybibz-remembered-email');
    if (savedEmail) {
        emailInput.value = savedEmail;
        rememberMeCheckbox.checked = true;
    }
    
    // Update remember me on login
    const loginFormEl = document.getElementById('login-form-el');
    if (loginFormEl) {
        const originalSubmit = loginFormEl.onsubmit;
        loginFormEl.addEventListener('submit', (e) => {
            if (rememberMeCheckbox.checked) {
                localStorage.setItem('buybibz-remembered-email', emailInput.value);
            } else {
                localStorage.removeItem('buybibz-remembered-email');
            }
        });
    }
}
