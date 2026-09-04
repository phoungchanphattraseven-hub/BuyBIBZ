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
            'common.back': 'Back',
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
            'auth.remember_me': 'Remember me',
            'auth.or': 'or',
            'auth.terms': 'By signing in, you agree to our Terms of Service and Privacy Policy.',

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
            'profile.required_for_checkout': 'Required for checkout',
            'profile.order_updates_desc': 'Shipping and delivery status',
            'profile.promotions_desc': 'Deals, sales and new arrivals',
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

            // Product badges / labels
            'product.free_shipping': 'Free shipping',
            'product.out_of_stock': 'Out of stock',
            'product.choose_options': 'Choose product options',
            'product.no_reviews': 'No reviews yet. Be the first to review this product!',
            'product.write_review': 'Write a Review',
            'product.based_on_reviews': 'Based on {n} reviews',
            'product.based_on_one_review': 'Based on 1 review',
            'product.be_first_review': 'Be the first to share your experience.',
            'product.view_all_reviews': 'View all reviews',
            'product.show_more_reviews': 'Show more reviews',
            'product.reviews_showing': 'Showing {a} of {b} reviews',
            'product.delete_review': 'Delete review',
            'product.delete_confirm': 'Confirm?',
            'product.review_deleted': 'Review deleted',
            'product.rating_label': 'Rating',
            'product.your_review': 'Your Review',
            'product.review_placeholder': 'Share your experience with this product...',
            'product.submit_review': 'Submit Review',
            'product.customer_reviews': 'Customer Reviews',
            'product.available': 'available · Ready to ship',
            'product.add_to_cart_btn': 'Add to Cart',

            // Products page
            'products.all_categories': 'All Categories',
            'products.all_prices': 'All Prices',
            'products.under_50': 'Under $50',
            'products.50_100': '$50 — $100',
            'products.100_250': '$100 — $250',
            'products.250_plus': '$250+',
            'products.newest': 'Newest',
            'products.price_low': 'Price: Low to High',
            'products.price_high': 'Price: High to Low',
            'products.top_rated': 'Top Rated',
            'products.filters': 'Filters',
            'products.sort_by': 'Sort By',
            'products.categories': 'Categories',
            'products.price_range': 'Price Range',
            'products.show_products': 'Show Products',
            'products.reset_all': 'Reset All',
            'products.filters_refinements': 'Filters & Refinements',
            'products.all_products': 'All Products',
            'products.premium_collection': 'Discover our premium collection',
            'products.clear_all': 'Clear All',

            // Cart page
            'cart.page_subtitle': 'Review your items before checkout',
            'cart.items': 'items',
            'cart.intl_shipping': 'International Shipping',
            'cart.transaction_fee': 'Transaction Fee (3%)',
            'cart.tax': 'Tax',
            'cart.tax_calculated': 'Calculated at checkout',
            'cart.proceed_checkout': 'Proceed to Checkout',
            'cart.clear_cart': 'Clear Cart',
            'cart.continue_shopping': 'Continue Shopping',
            'cart.remove_title': 'Remove Item',
            'cart.remove_confirm': 'Remove this item from your cart?',
            'cart.clear_title': 'Clear Cart',
            'cart.clear_confirm': 'Are you sure you want to clear your entire cart?',
            'cart.cancel': 'Cancel',
            'cart.item_removed': 'Item removed',
            'cart.cart_cleared': 'Cart cleared',

            // Checkout page
            'checkout.subtitle': 'Complete your order securely',
            'checkout.shipping_details': 'Shipping Details',
            'checkout.delivery_address': 'Delivery Address',
            'checkout.edit': 'Edit',
            'checkout.order_notes': 'Order Notes (Optional)',
            'checkout.notes_placeholder': 'Special instructions for delivery...',
            'checkout.payment_method': 'Payment Method',
            'checkout.cod': 'Cash on Delivery (COD)',
            'checkout.cod_available': 'Available',
            'checkout.cod_desc': 'Pay with cash when your order is delivered',
            'checkout.khqr': 'KHQR (Bakong)',
            'checkout.khqr_instant': 'Instant',
            'checkout.khqr_desc': 'Scan QR code with any Cambodian banking app',
            'checkout.full_name': 'Full Name',
            'checkout.phone': 'Phone Number',
            'checkout.street': 'Street Address',
            'checkout.city': 'City',
            'checkout.postal': 'Postal/Zip Code',
            'checkout.intl_shipping': 'International Shipping',
            'checkout.processing_btn': 'Processing...',
            'checkout.scan_to_pay': 'Scan to Pay',
            'checkout.scan_desc': 'Scan with any Cambodian bank app',
            'checkout.delivery_to': 'Delivery to:',
            'checkout.after_payment': 'After payment, your order will be processed and delivered soon.',
            'checkout.view_orders': 'View My Orders',
            'checkout.continue_shopping': 'Continue Shopping',
            'checkout.order_confirmed': 'Order Confirmed!',
            'checkout.thank_you': 'Thank you for shopping with BuyBIBZ.',
            'checkout.order_placed': 'has been placed successfully.',
            'checkout.empty_cart_warning': 'Your cart is empty',

            // Orders page
            'orders.subtitle': 'Track and view your past orders',
            'orders.order_uid': 'Order UID',
            'orders.items': 'item',
            'orders.items_plural': 'items',
            'orders.shipping_details': 'Shipping Details',
            'orders.print_receipt': 'Print Receipt',
            'orders.copy': 'Copy',
            'orders.start_shopping': 'Start Shopping',
            'orders.placed': 'Placed',
            'orders.processing': 'Processing',
            'orders.shipped': 'Shipped',
            'orders.delivered': 'Delivered',
            'orders.cancelled': 'Cancelled',
            'orders.status_pending': 'We have received your order and are preparing to process it.',
            'orders.status_processing': 'Your order is being processed and packaged.',
            'orders.status_shipped': 'Your order has been shipped and is on the way!',
            'orders.status_delivered': 'Your order has been delivered. Thank you for shopping with us!',
            'orders.status_cancelled': 'This order has been cancelled.',
            'orders.status_default': 'Order placed.',
            'orders.subtotal': 'Subtotal',
            'orders.intl_shipping': 'International Shipping',
            'orders.free': 'Free',
            'orders.total': 'Total',
            'orders.uid_copied': 'Order UID copied',
            'orders.uid_copy_error': 'Unable to copy the order UID',
            'orders.load_error': 'Failed to load orders',
            'orders.items_label': 'Items',
            'orders.notes': 'Notes',
            'orders.product_id': 'Product ID',
            'orders.deleted_product': 'Product no longer available',

            // Auth page
            'auth.or': 'or',
            'auth.terms': 'By signing in, you agree to our Terms of Service and Privacy Policy.',
            'auth.register_tab_label': 'Create Account',

            // About page
            'about.title': 'About BuyBIBZ',
            'about.subtitle': 'Your trusted online marketplace for quality products at great prices',
            'about.story_title': 'Our Story',
            'about.story_1': 'Founded in 2024, BuyBIBZ started with a simple mission: to make online shopping accessible, affordable, and enjoyable for everyone. We believe that great products shouldn\'t come with complicated processes or inflated prices.',
            'about.story_2': 'Today, we\'re proud to serve thousands of customers across Cambodia and beyond, offering a carefully curated selection of products ranging from electronics to home goods, all backed by our commitment to quality and customer satisfaction.',
            'about.quality_title': 'Quality First',
            'about.quality_desc': 'Every product is carefully selected and tested to ensure it meets our high standards.',
            'about.delivery_title': 'Fast Delivery',
            'about.delivery_desc': 'Quick and reliable shipping to get your orders to you as soon as possible.',
            'about.customer_title': 'Customer Focus',
            'about.customer_desc': 'Your satisfaction is our priority. We\'re here to help every step of the way.',
            'about.happy_customers': 'Happy Customers',
            'about.products': 'Products',
            'about.categories': 'Categories',
            'about.satisfaction': 'Satisfaction Rate',
            'about.cta_title': 'Ready to Start Shopping?',
            'about.cta_desc': 'Discover amazing products at unbeatable prices',
            'about.browse_products': 'Browse Products',
            'about.contact_us': 'Contact Us',

            // Customer Service page
            'cs.title': 'Customer Service',
            'cs.subtitle': 'We\'re here to help! Get in touch with us for any questions or concerns.',
            'cs.call_title': 'Call Us',
            'cs.call_hours': 'Mon-Sat: 8:00 AM - 8:00 PM<br>Sunday: 9:00 AM - 6:00 PM',
            'cs.email_title': 'Email Us',
            'cs.email_hours': 'We\'ll respond within 24 hours<br>on business days',
            'cs.chat_title': 'Live Chat',
            'cs.chat_desc': 'Chat with our support team<br>for instant help',
            'cs.chat_btn': 'Start Chat',
            'cs.chat_soon': 'Live chat coming soon!',
            'cs.faq_title': 'Frequently Asked Questions',
            'cs.faq_1_q': 'How do I track my order?',
            'cs.faq_1_a': 'You can track your order by logging into your account and visiting the Orders page. You\'ll see real-time updates on your order status and delivery progress.',
            'cs.faq_2_q': 'What payment methods do you accept?',
            'cs.faq_2_a': 'We currently accept Cash on Delivery (COD) and KHQR (Bakong) payments. More payment options will be available soon.',
            'cs.faq_3_q': 'What is your return policy?',
            'cs.faq_3_a': 'We offer a 7-day return policy for most items. Products must be unused and in original packaging. Contact our customer service team to initiate a return.',
            'cs.faq_4_q': 'How long does delivery take?',
            'cs.faq_4_a': 'Delivery typically takes 2-5 business days depending on your location. Phnom Penh orders usually arrive within 1-2 days.',
            'cs.faq_5_q': 'Do you offer international shipping?',
            'cs.faq_5_a': 'Currently, we only ship within Cambodia. International shipping options are being evaluated for the future.',
            'cs.faq_6_q': 'How can I cancel my order?',
            'cs.faq_6_a': 'Orders can be cancelled within 1 hour of placement. After that, please contact customer service for assistance. Once shipped, orders cannot be cancelled but can be returned.',
            'cs.contact_title': 'Send Us a Message',
            'cs.contact_desc': 'Can\'t find what you\'re looking for? Send us a message and we\'ll get back to you soon.',
            'cs.name': 'Name',
            'cs.email': 'Email',
            'cs.subject': 'Subject',
            'cs.message': 'Message',
            'cs.send_btn': 'Send Message',
            'cs.sent': 'Message sent successfully! We\'ll get back to you soon.',

            // Mobile bottom nav
            'mobile_nav.home': 'Home',
            'mobile_nav.shop': 'Shop',
            'mobile_nav.cart': 'Cart',
            'mobile_nav.orders': 'Orders',
            'mobile_nav.profile': 'Profile',
            'mobile_nav.sign_in': 'Sign In',
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
            'common.back': 'ត្រឡប់ក្រោយ',
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
            'auth.remember_me': 'ចងចាំខ្ញុំ',
            'auth.or': 'ឬ',
            'auth.terms': 'ដោយចុះឈ្មោះ អ្នកយល់ព្រមតាមលក្ខខណ្ឌសេវាកម្ម និងគោលការណ៍ឯកជនភាពរបស់យើង។',

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
            'profile.required_for_checkout': 'ត្រូវការសម្រាប់ការទូទាត់',
            'profile.order_updates_desc': 'ស្ថានភាពដឹកជញ្ជូន និងការបរិច្ចាក',
            'profile.promotions_desc': 'បញ្ចុះតម្លៃ និងផលិតផលថ្មី',
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

            // Product badges / labels
            'product.free_shipping': 'ដឹកជញ្ជូនឥតគិតថ្លៃ',
            'product.out_of_stock': 'អស់ពីស្តុក',
            'product.choose_options': 'ជ្រើសរើសជម្រើសផលិតផល',
            'product.no_reviews': 'មិនទាន់មានការពិនិត្យទេ។ សូមក្លាយជាអ្នកដំបូងដែលពិនិត្យផលិតផលនេះ!',
            'product.write_review': 'សរសេរការពិនិត្យ',
            'product.based_on_reviews': 'ផ្អែកលើការពិនិត្យ {n}',
            'product.based_on_one_review': 'ផ្អែកលើការពិនិត្យ 1',
            'product.be_first_review': 'សូមក្លាយជាអ្នកដំបូងដែលចែករំលែកបទពិសោធន៍របស់អ្នក។',
            'product.view_all_reviews': 'មើលការពិនិត្យទាំងអស់',
            'product.show_more_reviews': 'បង្ហាញការពិនិត្យបន្ថែម',
            'product.reviews_showing': 'បង្ហាញ {a} ក្នុងចំណោម {b} ការពិនិត្យ',
            'product.delete_review': 'លុបការពិនិត្យ',
            'product.delete_confirm': 'បញ្ជាក់?',
            'product.review_deleted': 'ការពិនិត្យត្រូវបានលុប',
            'product.rating_label': 'ការវាយតម្លៃ',
            'product.your_review': 'ការពិនិត្យរបស់អ្នក',
            'product.review_placeholder': 'ចែករំលែកបទពិសោធន៍របស់អ្នកជាមួយផលិតផលនេះ...',
            'product.submit_review': 'បញ្ជូនការពិនិត្យ',
            'product.customer_reviews': 'ការពិនិត្យពីអតិថិជន',
            'product.available': 'មានក្នុងស្តុក · រួចរាល់សម្រាប់ដឹក',
            'product.add_to_cart_btn': 'បន្ថែមទៅកន្ត្រក',

            // Products page
            'products.all_categories': 'ប្រភេទទាំងអស់',
            'products.all_prices': 'តម្លៃទាំងអស់',
            'products.under_50': 'តិចជាង $50',
            'products.50_100': '$50 — $100',
            'products.100_250': '$100 — $250',
            'products.250_plus': '$250+',
            'products.newest': 'ថ្មីបំផុត',
            'products.price_low': 'តម្លៃ: ទាបទៅខ្ពស់',
            'products.price_high': 'តម្លៃ: ខ្ពស់ទៅទាប',
            'products.top_rated': 'វាយតម្លៃខ្ពស់',
            'products.filters': 'តម្រង',
            'products.sort_by': 'តម្រៀបតាម',
            'products.categories': 'ប្រភេទ',
            'products.price_range': 'ចន្លោះតម្លៃ',
            'products.show_products': 'បង្ហាញផលិតផល',
            'products.reset_all': 'កំណត់ឡើងវិញ',
            'products.filters_refinements': 'តម្រង និងការចំណាត់ថ្នាក់',
            'products.all_products': 'ផលិតផលទាំងអស់',
            'products.premium_collection': 'ស្វែងរកបណ្ដុំផលិតផលប្រណីតរបស់យើង',
            'products.clear_all': 'លុបទាំងអស់',

            // Cart page
            'cart.page_subtitle': 'ពិនិត្យមើលទំនិញរបស់អ្នកមុនពេលទូទាត់',
            'cart.items': 'ទំនិញ',
            'cart.intl_shipping': 'ការដឹកជញ្ជូនអន្តរជាតិ',
            'cart.transaction_fee': 'ថ្លៃសេវាប្រតិបត្តិការ (3%)',
            'cart.tax': 'ពន្ធ',
            'cart.tax_calculated': 'គណនានៅពេលទូទាត់',
            'cart.proceed_checkout': 'បន្តទៅការទូទាត់',
            'cart.clear_cart': 'លុបកន្ត្រក',
            'cart.continue_shopping': 'បន្តទិញទំនិញ',
            'cart.remove_title': 'លុបទំនិញ',
            'cart.remove_confirm': 'លុបទំនិញនេះចេញពីកន្ត្រករបស់អ្នក?',
            'cart.clear_title': 'លុបកន្ត្រក',
            'cart.clear_confirm': 'តើអ្នកប្រាកដថាចង់លុបកន្ត្រករបស់អ្នកទាំងមូលទេ?',
            'cart.cancel': 'បោះបង់',
            'cart.item_removed': 'បានលុបទំនិញ',
            'cart.cart_cleared': 'បានលុបកន្ត្រក',

            // Checkout page
            'checkout.subtitle': 'បញ្ចប់ការបញ្ជាទិញរបស់អ្នកដោយសុវត្ថិភាព',
            'checkout.shipping_details': 'ព័ត៌មានការដឹកជញ្ជូន',
            'checkout.delivery_address': 'អាសយដ្ឋានដឹកជញ្ជូន',
            'checkout.edit': 'កែប្រែ',
            'checkout.order_notes': 'កំណត់ចំណាំការបញ្ជាទិញ (ស្រេចចិត្ត)',
            'checkout.notes_placeholder': 'ការណែនាំពិសេសសម្រាប់ការដឹកជញ្ជូន...',
            'checkout.payment_method': 'វិធីបង់ប្រាក់',
            'checkout.cod': 'បង់ប្រាក់នៅពេលទទួលទំនិញ (COD)',
            'checkout.cod_available': 'មាន',
            'checkout.cod_desc': 'បង់ជាសាច់ប្រាក់នៅពេលទទួលការបញ្ជាទិញ',
            'checkout.khqr': 'KHQR (Bakong)',
            'checkout.khqr_instant': 'រហ័ស',
            'checkout.khqr_desc': 'ស្កែន QR ជាមួយកម្មវិធីធនាគារកម្ពុជា',
            'checkout.full_name': 'ឈ្មោះពេញ',
            'checkout.phone': 'លេខទូរស័ព្ទ',
            'checkout.street': 'អាសយដ្ឋាន',
            'checkout.city': 'ទីក្រុង',
            'checkout.postal': 'លេខកូដប្រៃសណីយ៍',
            'checkout.intl_shipping': 'ការដឹកជញ្ជូនអន្តរជាតិ',
            'checkout.processing_btn': 'កំពុងដំណើរការ...',
            'checkout.scan_to_pay': 'ស្កែនដើម្បីបង់ប្រាក់',
            'checkout.scan_desc': 'ស្កែនជាមួយកម្មវិធីធនាគារកម្ពុជា',
            'checkout.delivery_to': 'ដឹកជញ្ជូនទៅ:',
            'checkout.after_payment': 'បន្ទាប់ពីការបង់ប្រាក់ ការបញ្ជាទិញរបស់អ្នកនឹងត្រូវបានដំណើរការ។',
            'checkout.view_orders': 'មើលការបញ្ជាទិញ',
            'checkout.continue_shopping': 'បន្តទិញទំនិញ',
            'checkout.order_confirmed': 'ការបញ្ជាទិញបានបញ្ជាក់!',
            'checkout.thank_you': 'អរគុណសម្រាប់ការទិញទំនិញនៅ BuyBIBZ។',
            'checkout.order_placed': 'ត្រូវបានដាក់ដោយជោគជ័យ។',
            'checkout.empty_cart_warning': 'កន្ត្រករបស់អ្នកទទេ',

            // Orders page
            'orders.subtitle': 'តាមដាន និងមើលការបញ្ជាទិញរបស់អ្នក',
            'orders.order_uid': 'លេខបញ្ជាទិញ',
            'orders.items': 'ទំនិញ',
            'orders.items_plural': 'ទំនិញ',
            'orders.shipping_details': 'ព័ត៌មានការដឹកជញ្ជូន',
            'orders.print_receipt': 'បោះពុម្ពវិក្កយបត្រ',
            'orders.copy': 'ចម្លង',
            'orders.start_shopping': 'ចាប់ផ្តើមទិញទំនិញ',
            'orders.placed': 'បានដាក់',
            'orders.processing': 'កំពុងដំណើរការ',
            'orders.shipped': 'បានដឹក',
            'orders.delivered': 'បានដឹកជញ្ជូន',
            'orders.cancelled': 'បានលុបចោល',
            'orders.status_pending': 'យើងបានទទួលការបញ្ជាទិញរបស់អ្នក ហើយកំពុងរៀបចំដំណើរការ។',
            'orders.status_processing': 'ការបញ្ជាទិញរបស់អ្នកកំពុងត្រូវបានដំណើរការ និងខ្ចប់។',
            'orders.status_shipped': 'ការបញ្ជាទិញរបស់អ្នកត្រូវបានដឹកហើយ!',
            'orders.status_delivered': 'ការបញ្ជាទិញរបស់អ្នកត្រូវបានដឹកដល់ហើយ។ អរគុណសម្រាប់ការទិញ!',
            'orders.status_cancelled': 'ការបញ្ជាទិញនេះត្រូវបានលុបចោល។',
            'orders.status_default': 'ការបញ្ជាទិញបានដាក់។',
            'orders.subtotal': 'សរុបរង',
            'orders.intl_shipping': 'ការដឹកជញ្ជូនអន្តរជាតិ',
            'orders.free': 'ឥតគិតថ្លៃ',
            'orders.total': 'សរុប',
            'orders.uid_copied': 'បានចម្លងលេខបញ្ជាទិញ',
            'orders.uid_copy_error': 'មិនអាចចម្លងលេខបញ្ជាទិញបានទេ',
            'orders.load_error': 'មិនអាចផ្ទុកការបញ្ជាទិញបានទេ',
            'orders.items_label': 'ទំនិញ',
            'orders.notes': 'កំណត់ចំណាំ',
            'orders.product_id': 'លេខផលិតផល',
            'orders.deleted_product': 'ផលិតផលលែងមានទៀតហើយ',

            // Auth page
            'auth.or': 'ឬ',
            'auth.terms': 'តាមរយៈការចូល អ្នកយល់ព្រមនឹងលក្ខខណ្ឌប្រើប្រាស់ និងគោលការណ៍ឯកជនភាព។',
            'auth.register_tab_label': 'បង្កើតគណនី',

            // About page
            'about.title': 'អំពី BuyBIBZ',
            'about.subtitle': 'ទីផ្សារអនឡាញដែលអ្នកទុកចិត្តបានសម្រាប់ផលិតផលប្រណីតក្នុងតម្លៃសមរម្យ',
            'about.story_title': 'រឿងរ៉ាវរបស់យើង',
            'about.story_1': 'បង្កើតឡើងក្នុងឆ្នាំ 2024 BuyBIBZ ចាប់ផ្តើមជាមួយបេសកកម្មសាមញ្ញ: ធ្វើឱ្យការទិញទំនិញអនឡាញអាចចូលដំណើរការបាន មានតម្លៃសមរម្យ និងគួរឱ្យរំភើប។',
            'about.story_2': 'ថ្ងៃនេះ យើងภาcudorgue ដោយបម្រើអតិថិជនរាប់ពាន់នាក់នៅទូទាំងកម្ពុជា ដោយផ្តល់ជូននូវការជ្រើសរើសផលិតផលពីអេឡិចត្រូនិករហូតដល់ទំនិញប្រើប្រាស់ក្នុងផ្ទះ។',
            'about.quality_title': 'គុណភាពជាមុន',
            'about.quality_desc': 'ផលិតផលគ្រប់ប្រភេទត្រូវបានជ្រើសរើសដោយប្រុងប្រយ័ត្ន ដើម្បីធានាថាវាបំពេញតម្រូវការខ្ពស់របស់យើង។',
            'about.delivery_title': 'ការដឹកជញ្ជូនរហ័ស',
            'about.delivery_desc': 'ការដឹកជញ្ជូនរហ័ស និងគួរឱ្យទុកចិត្ត ដើម្បីទទួលបានការបញ្ជាទិញរបស់អ្នកឱ្យបានឆាប់។',
            'about.customer_title': 'ផ្ដោតលើអតិថិជន',
            'about.customer_desc': 'ការពេញចិត្តរបស់អ្នកជាអាទិភាពរបស់យើង។ យើងនៅទីនេះដើម្បីជួយរៀងរាល់ជំហាន។',
            'about.happy_customers': 'អតិថិជនពេញចិត្ត',
            'about.products': 'ផលិតផល',
            'about.categories': 'ប្រភេទ',
            'about.satisfaction': 'អត្រាការពេញចិត្ត',
            'about.cta_title': 'រួចរាល់ចាប់ផ្តើមទិញទំនិញ?',
            'about.cta_desc': 'ស្វែងរកផលិតផលដ៏ល្អក្នុងតម្លៃដ៏ប្រណីត',
            'about.browse_products': 'រកមើលផលិតផល',
            'about.contact_us': 'ទាក់ទងយើង',

            // Customer Service page
            'cs.title': 'សេវាអតិថិជន',
            'cs.subtitle': 'យើងនៅទីនេះដើម្បីជួយ! ទាក់ទងមកយើងសម្រាប់សំណួរ ឬការព្រួយបារម្ភ។',
            'cs.call_title': 'ទូរស័ព្ទមកយើង',
            'cs.call_hours': 'ច័ន្ទ-សៅរ៍: ម៉ោង 8:00 - 20:00<br>អាទិត្យ: ម៉ោង 9:00 - 18:00',
            'cs.email_title': 'ផ្ញើអ៊ីមែលមកយើង',
            'cs.email_hours': 'យើងនឹងឆ្លើយតបក្នុង 24 ម៉ោង<br>ក្នុងថ្ងៃធ្វើការ',
            'cs.chat_title': 'ជជែកផ្ទាល់',
            'cs.chat_desc': 'ជជែកជាមួយក្រុមគាំទ្ររបស់យើង<br>សម្រាប់ជំនួយភ្លាមៗ',
            'cs.chat_btn': 'ចាប់ផ្តើមជជែក',
            'cs.chat_soon': 'ការជជែកផ្ទាល់នឹងមាននៅឆាប់ៗ!',
            'cs.faq_title': 'សំណួរញឹកញាប់',
            'cs.faq_1_q': 'តើខ្ញុំតាមដានការបញ្ជាទិញរបស់ខ្ញុំដោយរបៀបណា?',
            'cs.faq_1_a': 'អ្នកអាចតាមដានការបញ្ជាទិញដោយចូលគណនី ហើយចូលទៅទំព័រការបញ្ជាទិញ។',
            'cs.faq_2_q': 'តើអ្នកទទួលការបង់ប្រាក់វិធីណា?',
            'cs.faq_2_a': 'បច្ចុប្បន្ន យើងទទួលការបង់ប្រាក់នៅពេលទទួលទំនិញ (COD) និង KHQR (Bakong)។',
            'cs.faq_3_q': 'តើគោលការណ៍ប្រគល់ទំនិញវិញរបស់អ្នករបៀបណា?',
            'cs.faq_3_a': 'យើងផ្តល់ជូននូវគោលការណ៍ប្រគល់ទំនិញវិញក្នុងរយៈពេល 7 ថ្ងៃ សម្រាប់ទំនិញភាគច្រើន។',
            'cs.faq_4_q': 'តើការដឹកជញ្ជូនចំណាយពេលប៉ុន្មាន?',
            'cs.faq_4_a': 'ការដឹកជញ្ជូនចំណាយពេល 2-5 ថ្ងៃធ្វើការ អាស្រ័យលើទីតាំងរបស់អ្នក។',
            'cs.faq_5_q': 'តើអ្នកផ្តល់ការដឹកជញ្ជូនអន្តរជាតិទេ?',
            'cs.faq_5_a': 'បច្ចុប្បន្ន យើងដឹកជញ្ជូនតែក្នុងប្រទេសកម្ពុជាប៉ុណ្ណោះ។',
            'cs.faq_6_q': 'តើខ្ញុំអាចលុបការបញ្ជាទិញបានដោយរបៀបណា?',
            'cs.faq_6_a': 'ការបញ្ជាទិញអាចត្រូវបានលុបក្នុងរយៈពេល 1 ម៉ោងបន្ទាប់ពីការដាក់ order។',
            'cs.contact_title': 'ផ្ញើសារមកយើង',
            'cs.contact_desc': 'រកមិនឃើញអ្វីដែលអ្នកត្រូវការ? ផ្ញើសារមកយើង ហើយយើងនឹងទំនាក់ទំនងមកអ្នក។',
            'cs.name': 'ឈ្មោះ',
            'cs.email': 'អ៊ីមែល',
            'cs.subject': 'ប្រធានបទ',
            'cs.message': 'សារ',
            'cs.send_btn': 'ផ្ញើសារ',
            'cs.sent': 'ផ្ញើសារដោយជោគជ័យ! យើងនឹងទំនាក់ទំនងមកអ្នក។',

            // Mobile bottom nav
            'mobile_nav.home': 'ទំព័រដើម',
            'mobile_nav.shop': 'ហាង',
            'mobile_nav.cart': 'កន្ត្រក',
            'mobile_nav.orders': 'ការបញ្ជាទិញ',
            'mobile_nav.profile': 'គណនី',
            'mobile_nav.sign_in': 'ចូលគណនី',
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

        // Re-render navbar, footer, and mobile bottom nav (they contain dynamic translated text)
        if (typeof renderNavbar === 'function') renderNavbar();
        if (typeof renderFooter === 'function') renderFooter();

        // Re-render mobile bottom nav if it exists
        const existingBottomNav = document.querySelector('.mobile-bottom-nav');
        if (existingBottomNav) {
            existingBottomNav.remove();
            if (typeof renderMobileBottomNav === 'function') renderMobileBottomNav();
        }

        // Re-render offcanvas menu if open
        const existingMenu = document.getElementById('offcanvas-menu');
        if (existingMenu) {
            existingMenu.remove();
            document.getElementById('offcanvas-backdrop')?.remove();
            document.body.style.overflow = '';
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
