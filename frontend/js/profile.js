document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;
    
    const form = document.getElementById('combined-settings-form');
    const nameInput = document.getElementById('profile-name');
    const phoneInput = document.getElementById('profile-phone');
    const emailInput = document.getElementById('profile-email');
    const addressInput = document.getElementById('profile-address');
    const cityInput = document.getElementById('profile-city');
    const postalInput = document.getElementById('profile-postal');
    
    const langSelect = document.getElementById('pref-language');
    const currSelect = document.getElementById('pref-currency');
    const orderNotif = document.getElementById('pref-notif-orders');
    const promoNotif = document.getElementById('pref-notif-promos');
    
    const submitBtn = document.getElementById('save-all-btn');

    // Load initial data
    async function loadData() {
        // STEP 1: Immediately load from localStorage cache for instant display
        const cachedUser = localStorage.getItem('buybibz_user'); // Fixed: use underscore not hyphen
        if (cachedUser) {
            try {
                const user = JSON.parse(cachedUser);
                // Display all cached fields immediately to prevent flash
                if (user.full_name) nameInput.value = user.full_name;
                if (user.email) emailInput.value = user.email;
                if (user.phone) phoneInput.value = user.phone;
                if (user.address) addressInput.value = user.address;
                if (user.city) cityInput.value = user.city;
                if (user.postal_code) postalInput.value = user.postal_code;
            } catch (e) {
                console.error('Failed to parse cached user:', e);
            }
        }

        // Load localStorage preferences immediately
        const prefs = JSON.parse(localStorage.getItem('buybibz-prefs') || '{}');
        if (prefs.language) langSelect.value = prefs.language;
        if (prefs.currency) currSelect.value = prefs.currency;
        if (prefs.notifOrders !== undefined) orderNotif.checked = prefs.notifOrders;
        if (prefs.notifPromos !== undefined) promoNotif.checked = prefs.notifPromos;

        // Show subtle loading state for fields not in cache
        const fieldsToLoad = [phoneInput, addressInput, cityInput, postalInput].filter(f => !f.value);
        fieldsToLoad.forEach(field => {
            field.style.opacity = '0.5';
            field.disabled = true;
        });

        // STEP 2: Load full profile from API in background and update if different
        try {
            const data = await api.getProfile();
            if (data && data.user) {
                const user = data.user;
                nameInput.value = user.full_name || '';
                phoneInput.value = user.phone || '';
                emailInput.value = user.email || '';
                addressInput.value = user.address || '';
                cityInput.value = user.city || '';
                postalInput.value = user.postal_code || '';
                
                // Remove loading state
                fieldsToLoad.forEach(field => {
                    field.style.opacity = '1';
                    field.disabled = false;
                });
                
                // Update localStorage cache with latest data (use underscore)
                const cachedUserStr = localStorage.getItem('buybibz_user');
                if (cachedUserStr) {
                    try {
                        const userObj = JSON.parse(cachedUserStr);
                        userObj.full_name = user.full_name;
                        userObj.phone = user.phone;
                        userObj.address = user.address;
                        userObj.city = user.city;
                        userObj.postal_code = user.postal_code;
                        localStorage.setItem('buybibz_user', JSON.stringify(userObj));
                    } catch (e) {
                        console.error('Failed to update cached user:', e);
                    }
                }
            }
        } catch (err) {
            // Re-enable fields even on error
            fieldsToLoad.forEach(field => {
                field.style.opacity = '1';
                field.disabled = false;
            });
            showToast(typeof i18n !== 'undefined' ? i18n.t('profile.load_error') : 'Failed to load profile details', 'error');
        }
    }

    // Handle single form submission for both API and local storage
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        submitBtn.disabled = true;
        submitBtn.textContent = typeof i18n !== 'undefined' ? i18n.t('profile.saving') : 'Saving...';
        
        // 1. Save to API
        const payload = {
            full_name: nameInput.value.trim(),
            phone: phoneInput.value.trim(),
            address: addressInput.value.trim(),
            city: cityInput.value.trim(),
            postal_code: postalInput.value.trim()
        };
        
        let apiSuccess = false;
        try {
            const updatedProfile = await api.updateProfile(payload);
            apiSuccess = true;
            
            // Update local storage user data with FULL profile for instant display on next load
            const userStr = localStorage.getItem('buybibz_user'); // Fixed: use underscore
            if (userStr && updatedProfile.profile) {
                const userObj = JSON.parse(userStr);
                // Store all profile fields in localStorage cache
                userObj.full_name = updatedProfile.profile.full_name;
                userObj.phone = updatedProfile.profile.phone;
                userObj.address = updatedProfile.profile.address;
                userObj.city = updatedProfile.profile.city;
                userObj.postal_code = updatedProfile.profile.postal_code;
                localStorage.setItem('buybibz_user', JSON.stringify(userObj)); // Fixed: use underscore
                
                if (typeof renderNavbar === 'function') {
                    renderNavbar();
                }
            }
        } catch (err) {
            showToast(err.message || (typeof i18n !== 'undefined' ? i18n.t('profile.update_error') : 'Failed to update profile details'), 'error');
        }

        // 2. Save Preferences to LocalStorage
        const prefs = {
            language: langSelect.value,
            currency: currSelect.value,
            notifOrders: orderNotif.checked,
            notifPromos: promoNotif.checked
        };
        localStorage.setItem('buybibz-prefs', JSON.stringify(prefs));

        // 3. Feedback and Apply Language immediately
        if (typeof i18n !== 'undefined' && i18n.getLang() !== langSelect.value) {
            i18n.setLang(langSelect.value);
            if (typeof renderNavbar === 'function') renderNavbar();
            if (typeof renderFooter === 'function') renderFooter();
        }

        submitBtn.disabled = false;
        submitBtn.textContent = typeof i18n !== 'undefined' ? i18n.t('profile.save') : 'Save Changes';

        if (apiSuccess) {
            showToast(typeof i18n !== 'undefined' ? i18n.t('profile.saved') : 'Settings saved successfully!', 'success');
        }
    });

    loadData();
});
