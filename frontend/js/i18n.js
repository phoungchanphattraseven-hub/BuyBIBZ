/**
 * BuyBIBZ — Internationalization (i18n) Module
 * Supports English (en) and Khmer (km)
 * Loaded before app.js so translations are available everywhere.
 */

const i18n = (() => {

    // ── Translation dictionaries ────────────────────────────────
    const translations = {
        en: {
            // Navbar
            'nav.home': 'Home',
            'nav.shop': 'Shop',
            'nav.about': 'About',
            'nav.support': 'Support',
            'nav.admin': 'Admin',
            'nav.search_placeholder': 'Search products...',
            'nav.profile': 'Profile Settings',
            'nav.orders': 'My Orders',
            'nav.admin_panel': 'Admin Panel',
            'nav.sign_out': 'Sign Out',
            'nav.sign_in': 'Sign In',
            'nav.menu': 'Menu',
            'nav.cart': 'Cart',

            // Hero
            'hero.badge': 'New Collection Available',
            'hero.title_1': 'Shop The Future',
            'hero.title_2': 'With',
            'hero.desc': 'Discover curated premium products across electronics, fashion, and lifestyle — all in one beautifully crafted marketplace.',
            'hero.shop_now': 'Shop Now',
            'hero.explore': 'Explore Featured',
            'hero.products': 'Products',
            'hero.categories': 'Categories',
            'hero.support': 'Support',

            // Sections
            'section.featured': 'Featured Products',
            'section.featured_desc': 'Hand-picked premium items just for you',
            'section.categories': 'Shop By Category',
            'section.categories_desc': 'Find exactly what you\'re looking for',
            'section.newsletter': 'Stay In The Loop',
            'section.newsletter_desc': 'Get exclusive deals, new arrivals, and insider updates delivered to your inbox.',
            'section.newsletter_placeholder': 'Enter your email',
            'section.newsletter_btn': 'Subscribe',
            'section.view_all': 'View All Products →',

            // Footer
            'footer.desc': 'E-Commerce Reimagined. Discover premium products with a seamless shopping experience built for the modern world.',
            'footer.shop': 'Shop',
            'footer.all_products': 'All Products',
            'footer.featured': 'Featured',
            'footer.new_arrivals': 'New Arrivals',
            'footer.best_deals': 'Best Deals',
            'footer.account': 'Account',
            'footer.sign_in': 'Sign In',
            'footer.my_cart': 'My Cart',
            'footer.order_history': 'Order History',
            'footer.support': 'Support',
            'footer.contact': 'Contact Us',
            'footer.faq': 'FAQ',
            'footer.shipping': 'Shipping Info',
            'footer.returns': 'Returns Policy',
            'footer.copyright': `© ${new Date().getFullYear()} BuyBIBZ. All rights reserved.`,
            'footer.tagline': 'Built for better shopping',

            // Product Card
            'product.add_to_cart': 'Add to cart',
            'product.featured': 'Featured',
            'product.no_featured': 'No featured products yet.',

            // Auth
            'auth.welcome_back': 'Welcome Back',
            'auth.sign_in_subtitle': 'Sign in to continue shopping at BuyBIBZ',
            'auth.create_account_title': 'Create your account',
            'auth.create_account_subtitle': 'A few details and you are ready to shop.',
            'auth.login_tab': 'Sign In',
            'auth.register_tab': 'Register',
            'auth.email': 'Email Address',
            'auth.password': 'Password',
            'auth.full_name': 'Full Name',
            'auth.confirm_password': 'Confirm Password',
            'auth.sign_in_btn': 'Sign In',
            'auth.create_btn': 'Create Account',
            'auth.signing_in': 'Signing in...',
            'auth.creating': 'Creating account...',
            'auth.welcome_msg': 'Welcome back!',
            'auth.created_msg': 'Account created! Welcome to BuyBIBZ!',
            'auth.password_mismatch': 'Passwords do not match',
            'auth.password_short': 'Password must be at least 6 characters',
            'auth.admin_required': 'Admin access required',

            // Profile / Settings
            'profile.title': 'Settings',
            'profile.personal': 'Personal Information',
            'profile.name': 'Name',
            'profile.phone': 'Phone',
            'profile.email': 'Email',
            'profile.shipping': 'Shipping Address',
            'profile.street': 'Street',
            'profile.city': 'City',
            'profile.postal': 'Postal Code',
            'profile.regional': 'Regional',
            'profile.language': 'Language',
            'profile.currency': 'Currency',
            'profile.notifications': 'Notifications',
            'profile.order_updates': 'Order Updates',
            'profile.promotions': 'Promotions',
            'profile.save': 'Save Changes',
            'profile.saving': 'Saving...',
            'profile.saved': 'Settings saved successfully!',
            'profile.load_error': 'Failed to load profile details',
            'profile.update_error': 'Failed to update profile details',

            // Cart
            'cart.title': 'Shopping Cart',
            'cart.empty': 'Your cart is empty',
            'cart.empty_desc': 'Looks like you haven\'t added anything to your cart yet.',
            'cart.start_shopping': 'Start Shopping',
            'cart.order_summary': 'Order Summary',
            'cart.subtotal': 'Subtotal',
            'cart.shipping': 'Shipping',
            'cart.free': 'Free',
            'cart.total': 'Total',
            'cart.checkout': 'Proceed to Checkout',
            'cart.remove': 'Remove',
            'cart.added': 'Added to cart!',
            'cart.sign_in_required': 'Please sign in to add items to cart',

            // Orders
            'orders.title': 'My Orders',
            'orders.no_orders': 'No orders yet',
            'orders.no_orders_desc': 'Once you place an order, it will appear here.',

            // Checkout
            'checkout.title': 'Checkout',
            'checkout.shipping_info': 'Shipping Information',
            'checkout.place_order': 'Place Order',
            'checkout.processing': 'Processing...',

            // Common
            'common.loading': 'Loading...',
            'common.error': 'Something went wrong',
            'common.signed_out': 'Signed out successfully',
            'common.light_mode': 'Light mode',
            'common.dark_mode': 'Dark mode',
            'common.switch_light': 'Switch to light mode',
            'common.switch_dark': 'Switch to dark mode',
        },

        km: {
            // Navbar
            'nav.home': 'ទំព័រដើម',
            'nav.shop': 'ហាង',
            'nav.about': 'អំពីយើង',
            'nav.support': 'ជំនួយ',
            'nav.admin': 'អ្នកគ្រប់គ្រង',
            'nav.search_placeholder': 'ស្វែងរកផលិតផល...',
            'nav.profile': 'កំណត់គណនី',
            'nav.orders': 'ការបញ្ជាទិញរបស់ខ្ញុំ',
            'nav.admin_panel': 'ផ្ទាំងគ្រប់គ្រង',
            'nav.sign_out': 'ចេញពីគណនី',
            'nav.sign_in': 'ចូលគណនី',
            'nav.menu': 'បញ្ជី',
            'nav.cart': 'កន្ត្រក',

            // Hero
            'hero.badge': 'បណ្ដុំផលិតផលថ្មី',
            'hero.title_1': 'ទិញទំនិញអនាគត',
            'hero.title_2': 'ជាមួយ',
            'hero.desc': 'ស្វែងយល់ពីផលិតផលប្រណីតដែលបានជ្រើសរើសក្នុងផ្នែកអេឡិចត្រូនិច ម៉ូដ និងរបៀបរស់នៅ — ទាំងអស់នៅក្នុងទីផ្សារតែមួយ។',
            'hero.shop_now': 'ទិញឥឡូវ',
            'hero.explore': 'ស្វែងរកផលិតផលពិសេស',
            'hero.products': 'ផលិតផល',
            'hero.categories': 'ប្រភេទ',
            'hero.support': 'ជំនួយ',

            // Sections
            'section.featured': 'ផលិតផលពិសេស',
            'section.featured_desc': 'ផលិតផលប្រណីតដែលជ្រើសរើសពិសេសសម្រាប់អ្នក',
            'section.categories': 'ទិញតាមប្រភេទ',
            'section.categories_desc': 'ស្វែងរកអ្វីដែលអ្នកត្រូវការ',
            'section.newsletter': 'ទទួលព័ត៌មានថ្មីៗ',
            'section.newsletter_desc': 'ទទួលបានការផ្តល់ជូនពិសេស ផលិតផលថ្មី និងព័ត៌មានផ្ទាល់ខ្លួនផ្ញើដល់អ៊ីមែលរបស់អ្នក។',
            'section.newsletter_placeholder': 'បញ្ចូលអ៊ីមែលរបស់អ្នក',
            'section.newsletter_btn': 'ចុះឈ្មោះ',
            'section.view_all': 'មើលផលិតផលទាំងអស់ →',

            // Footer
            'footer.desc': 'ពាណិជ្ជកម្មអេឡិចត្រូនិចថ្មី។ ស្វែងយល់ពីផលិតផលប្រណីតជាមួយបទពិសោធន៍ទិញទំនិញដ៏ល្អឥតខ្ចោះ។',
            'footer.shop': 'ហាង',
            'footer.all_products': 'ផលិតផលទាំងអស់',
            'footer.featured': 'ផលិតផលពិសេស',
            'footer.new_arrivals': 'ផលិតផលថ្មី',
            'footer.best_deals': 'ការផ្តល់ជូនល្អបំផុត',
            'footer.account': 'គណនី',
            'footer.sign_in': 'ចូលគណនី',
            'footer.my_cart': 'កន្ត្រករបស់ខ្ញុំ',
            'footer.order_history': 'ប្រវត្តិការបញ្ជាទិញ',
            'footer.support': 'ជំនួយ',
            'footer.contact': 'ទាក់ទងយើង',
            'footer.faq': 'សំណួរញឹកញាប់',
            'footer.shipping': 'ព័ត៌មានដឹកជញ្ជូន',
            'footer.returns': 'គោលការណ៍ប្រគល់វិញ',
            'footer.copyright': `© ${new Date().getFullYear()} BuyBIBZ។ រក្សាសិទ្ធិគ្រប់យ៉ាង។`,
            'footer.tagline': 'បង្កើតសម្រាប់ការទិញទំនិញកាន់តែប្រសើរ',

            // Product Card
            'product.add_to_cart': 'បន្ថែមទៅកន្ត្រក',
            'product.featured': 'ពិសេស',
            'product.no_featured': 'មិនទាន់មានផលិតផលពិសេសទេ។',

            // Auth
            'auth.welcome_back': 'សូមស្វាគមន៍',
            'auth.sign_in_subtitle': 'ចូលគណនីដើម្បីបន្តទិញទំនិញនៅ BuyBIBZ',
            'auth.create_account_title': 'បង្កើតគណនីរបស់អ្នក',
            'auth.create_account_subtitle': 'ព័ត៌មានមួយចំនួន រួចហើយអ្នកអាចចាប់ផ្តើមទិញ។',
            'auth.login_tab': 'ចូលគណនី',
            'auth.register_tab': 'ចុះឈ្មោះ',
            'auth.email': 'អាសយដ្ឋានអ៊ីមែល',
            'auth.password': 'ពាក្យសម្ងាត់',
            'auth.full_name': 'ឈ្មោះពេញ',
            'auth.confirm_password': 'បញ្ជាក់ពាក្យសម្ងាត់',
            'auth.sign_in_btn': 'ចូលគណនី',
            'auth.create_btn': 'បង្កើតគណនី',
            'auth.signing_in': 'កំពុងចូល...',
            'auth.creating': 'កំពុងបង្កើតគណនី...',
            'auth.welcome_msg': 'សូមស្វាគមន៍មកវិញ!',
            'auth.created_msg': 'គណនីត្រូវបានបង្កើត! សូមស្វាគមន៍មកកាន់ BuyBIBZ!',
            'auth.password_mismatch': 'ពាក្យសម្ងាត់មិនត្រូវគ្នា',
            'auth.password_short': 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ',
            'auth.admin_required': 'ត្រូវការសិទ្ធិអ្នកគ្រប់គ្រង',

            // Profile / Settings
            'profile.title': 'ការកំណត់',
            'profile.personal': 'ព័ត៌មានផ្ទាល់ខ្លួន',
            'profile.name': 'ឈ្មោះ',
            'profile.phone': 'ទូរស័ព្ទ',
            'profile.email': 'អ៊ីមែល',
            'profile.shipping': 'អាសយដ្ឋានដឹកជញ្ជូន',
            'profile.street': 'ផ្លូវ',
            'profile.city': 'ទីក្រុង',
            'profile.postal': 'លេខកូដប្រៃសណីយ៍',
            'profile.regional': 'តំបន់',
            'profile.language': 'ភាសា',
            'profile.currency': 'រូបិយប័ណ្ណ',
            'profile.notifications': 'ការជូនដំណឹង',
            'profile.order_updates': 'បច្ចុប្បន្នភាពការបញ្ជាទិញ',
            'profile.promotions': 'ការផ្សព្វផ្សាយ',
            'profile.save': 'រក្សាទុកការផ្លាស់ប្តូរ',
            'profile.saving': 'កំពុងរក្សាទុក...',
            'profile.saved': 'ការកំណត់ត្រូវបានរក្សាទុកដោយជោគជ័យ!',
            'profile.load_error': 'មិនអាចផ្ទុកព័ត៌មានគណនីបានទេ',
            'profile.update_error': 'មិនអាចធ្វើបច្ចុប្បន្នភាពព័ត៌មានគណនីបានទេ',

            // Cart
            'cart.title': 'កន្ត្រកទិញទំនិញ',
            'cart.empty': 'កន្ត្រករបស់អ្នកទទេ',
            'cart.empty_desc': 'ហាក់ដូចជាអ្នកមិនទាន់បានបន្ថែមអ្វីទៅក្នុងកន្ត្រកទេ។',
            'cart.start_shopping': 'ចាប់ផ្តើមទិញទំនិញ',
            'cart.order_summary': 'សង្ខេបការបញ្ជាទិញ',
            'cart.subtotal': 'សរុបរង',
            'cart.shipping': 'ការដឹកជញ្ជូន',
            'cart.free': 'ឥតគិតថ្លៃ',
            'cart.total': 'សរុប',
            'cart.checkout': 'បន្តទៅការទូទាត់',
            'cart.remove': 'លុប',
            'cart.added': 'បានបន្ថែមទៅកន្ត្រក!',
            'cart.sign_in_required': 'សូមចូលគណនីដើម្បីបន្ថែមផលិតផលទៅកន្ត្រក',

            // Orders
            'orders.title': 'ការបញ្ជាទិញរបស់ខ្ញុំ',
            'orders.no_orders': 'មិនទាន់មានការបញ្ជាទិញទេ',
            'orders.no_orders_desc': 'នៅពេលអ្នកធ្វើការបញ្ជាទិញ វានឹងបង្ហាញនៅទីនេះ។',

            // Checkout
            'checkout.title': 'ការទូទាត់',
            'checkout.shipping_info': 'ព័ត៌មានដឹកជញ្ជូន',
            'checkout.place_order': 'បញ្ជាទិញ',
            'checkout.processing': 'កំពុងដំណើរការ...',

            // Common
            'common.loading': 'កំពុងផ្ទុក...',
            'common.error': 'មានបញ្ហាកើតឡើង',
            'common.signed_out': 'បានចេញពីគណនីដោយជោគជ័យ',
            'common.light_mode': 'របៀបភ្លឺ',
            'common.dark_mode': 'របៀបងងឹត',
            'common.switch_light': 'ប្តូរទៅរបៀបភ្លឺ',
            'common.switch_dark': 'ប្តូរទៅរបៀបងងឹត',
        }
    };

    // ── State ───────────────────────────────────────────────────
    let currentLang = 'en';

    // ── Public API ──────────────────────────────────────────────

    /**
     * Get translation for a key. Falls back to English if missing.
     */
    function t(key) {
        return translations[currentLang]?.[key]
            || translations.en[key]
            || key;
    }

    /**
     * Get current language code
     */
    function getLang() {
        return currentLang;
    }

    /**
     * Set language and persist
     */
    function setLang(lang) {
        if (!translations[lang]) lang = 'en';
        currentLang = lang;

        // Persist in prefs
        let prefs = {};
        try {
            const prefsVal = localStorage.getItem('buybibz-prefs');
            if (prefsVal) prefs = JSON.parse(prefsVal);
        } catch (e) {
            console.error("Failed to parse buybibz-prefs:", e);
        }
        prefs.language = lang;
        localStorage.setItem('buybibz-prefs', JSON.stringify(prefs));

        // Update <html lang>
        document.documentElement.lang = lang;

        // Add Khmer font if needed
        if (lang === 'km') {
            if (!document.getElementById('khmer-font-link')) {
                const link = document.createElement('link');
                link.id = 'khmer-font-link';
                link.rel = 'stylesheet';
                link.href = 'https://fonts.googleapis.com/css2?family=Battambang:wght@300;400;700;900&family=Noto+Sans+Khmer:wght@300;400;500;600;700;800;900&display=swap';
                document.head.appendChild(link);
            }
            document.documentElement.style.setProperty('--font-family-km', "'Noto Sans Khmer', 'Battambang', sans-serif");
            document.body.style.fontFamily = "var(--font-family-km)";
        } else {
            document.body.style.fontFamily = '';
        }

        // Translate all data-i18n elements on the page
        applyTranslations();
    }

    /**
     * Scan the DOM for [data-i18n] attributes and translate text/placeholders
     */
    function applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translated = t(key);
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translated;
            } else {
                el.textContent = translated;
            }
        });

        // Also translate data-i18n-placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
        });

        // Also translate data-i18n-title
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            el.title = t(el.getAttribute('data-i18n-title'));
        });
    }

    /**
     * Initialize — read saved preference
     */
    function init() {
        let prefs = {};
        try {
            const prefsVal = localStorage.getItem('buybibz-prefs');
            if (prefsVal) prefs = JSON.parse(prefsVal);
        } catch (e) {
            console.error("Failed to parse buybibz-prefs:", e);
        }
        const saved = prefs.language || 'en';
        currentLang = translations[saved] ? saved : 'en';
        
        document.documentElement.lang = currentLang;

        // Load Khmer font early if needed
        if (currentLang === 'km') {
            if (!document.getElementById('khmer-font-link')) {
                const link = document.createElement('link');
                link.id = 'khmer-font-link';
                link.rel = 'stylesheet';
                link.href = 'https://fonts.googleapis.com/css2?family=Battambang:wght@300;400;700;900&family=Noto+Sans+Khmer:wght@300;400;500;600;700;800;900&display=swap';
                document.head.appendChild(link);
            }
            document.documentElement.style.setProperty('--font-family-km', "'Noto Sans Khmer', 'Battambang', sans-serif");
            document.body.style.fontFamily = "var(--font-family-km)";
        }
    }

    // Auto-initialize on load
    init();

    return { t, getLang, setLang, applyTranslations, init };
})();
