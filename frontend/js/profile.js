document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;
    
    const form = document.getElementById('combined-settings-form');
    const nameInput = document.getElementById('profile-name');
    const phoneInput = document.getElementById('profile-phone');
    const emailInput = document.getElementById('profile-email');
    const addressInput = document.getElementById('profile-address');
    const postalInput = document.getElementById('profile-postal');
    
    // Cambodia address picker fields
    const provinceInput = document.getElementById('profile_province');
    const provinceCode = document.getElementById('profile_province_code');
    const districtInput = document.getElementById('profile_district');
    const districtCode = document.getElementById('profile_district_code');
    const communeInput = document.getElementById('profile_commune');
    const communeCode = document.getElementById('profile_commune_code');
    const villageInput = document.getElementById('profile_village');
    
    const langSelect = document.getElementById('pref-language');
    const currSelect = document.getElementById('pref-currency');
    const orderNotif = document.getElementById('pref-notif-orders');
    const promoNotif = document.getElementById('pref-notif-promos');
    
    const submitBtn = document.getElementById('save-all-btn');
    
    // Initialize Cambodia address pickers
    let addressPickers = null;
    if (window.KHAddressUI) {
        addressPickers = initProfilePickers();
    }

    // Profile hero (avatar + name + email)
    const heroAvatar = document.getElementById('ph-avatar');
    const heroName = document.getElementById('ph-name');
    const heroEmail = document.getElementById('ph-email');
    function updateHero(user) {
        if (!user || !heroAvatar) return;
        const displayName = user.full_name || user.email?.split('@')[0] || 'User';
        heroName.textContent = displayName;
        heroEmail.textContent = user.email || '';
        heroAvatar.textContent = displayName.charAt(0).toUpperCase();
    }
    
    // Initialize Cambodia address pickers for profile page
    function initProfilePickers() {
        if (!window.KHAddressUI || !window.KH_ADDRESS) return null;
        const provinces = window.KH_ADDRESS.provinces;
        
        if (!provinceInput || !districtInput || !communeInput) return null;
        
        const setDisabled = (input, disabled) => {
            input.disabled = disabled;
            if (disabled) { 
                input.value = ''; 
                input.placeholder = typeof i18n !== 'undefined' ? i18n.t('checkout.combo_placeholder', 'Select or type to search') : 'Select or type to search'; 
            }
        };
        
        function resetDistrict() {
            districtCode.value = '';
            setDisabled(districtInput, true);
            resetCommune();
        }
        function resetCommune() {
            communeCode.value = '';
            setDisabled(communeInput, true);
            resetVillage();
        }
        function resetVillage() {
            villageInput.value = '';
            villageInput.disabled = true;
            villageInput.placeholder = typeof i18n !== 'undefined' ? i18n.t('checkout.combo_placeholder', 'Select or type to search') : 'Select or type to search';
        }
        resetDistrict();
        
        const TYPE_EN = {
            'ខណ្ឌ': 'Khan',
            'ស្រុក': 'Srok',
            'ក្រុង': 'Krong',
            'ឃុំ': 'Khum',
            'សង្កាត់': 'Sangkat',
        };
        
        function labelEn(node) {
            const prefix = TYPE_EN[node[3]];
            return prefix ? `${prefix} ${node[1]}` : node[1];
        }
        
        function labelKm(node) {
            return node[3] ? `${node[3]} ${node[2]}` : node[2];
        }
        
        const provOpts = provinces.map(p => ({ en: p[1], km: labelKm(p), node: p }));
        
        window.KHAddressUI.combo(provinceInput, {
            getOptions: () => provOpts,
            onType: () => { provinceCode.value = ''; resetDistrict(); },
            onSelect: (item) => {
                provinceCode.value = item.node[0];
                provinceInput.value = item.node[1];
                districtCode.value = '';
                setDisabled(districtInput, false);
                resetCommune();
                districtInput.focus();
            },
        });
        
        window.KHAddressUI.combo(districtInput, {
            getOptions: () => {
                const p = provinces.find(x => x[0] === provinceCode.value);
                return p ? p[4].map(d => ({ en: labelEn(d), km: labelKm(d), node: d })) : [];
            },
            onType: () => { districtCode.value = ''; resetCommune(); },
            onSelect: (item) => {
                districtCode.value = item.node[0];
                districtInput.value = item.en;
                communeCode.value = '';
                setDisabled(communeInput, false);
                resetVillage();
                communeInput.focus();
            },
        });
        
        window.KHAddressUI.combo(communeInput, {
            getOptions: () => {
                const p = provinces.find(x => x[0] === provinceCode.value);
                const d = p && p[4].find(x => x[0] === districtCode.value);
                return d ? d[4].map(c => ({ en: labelEn(c), km: labelKm(c), node: c })) : [];
            },
            onType: () => { communeCode.value = ''; resetVillage(); },
            onSelect: (item) => {
                communeCode.value = item.node[0];
                communeInput.value = item.en;
                villageInput.disabled = false;
                villageInput.value = '';
                villageInput.placeholder = typeof i18n !== 'undefined' ? i18n.t('checkout.village_placeholder', 'Type to search your village') : 'Type to search your village';
                villageInput.focus();
                window.KHAddressUI.ensureVillagesLoaded().catch(() => {});
            },
        });
        
        window.KHAddressUI.combo(villageInput, {
            getOptions: () => {
                if (!window.KH_VILLAGES || !communeCode.value) return [];
                return (window.KH_VILLAGES[communeCode.value] || []).map(v => ({ en: v[0], km: v[1] }));
            },
            onType: () => window.KHAddressUI.ensureVillagesLoaded().catch(() => {}),
            onSelect: (item) => { villageInput.value = item.en; },
            emptyText: typeof i18n !== 'undefined' ? i18n.t('checkout.loading_villages', 'Loading villages...') : 'Loading villages...',
        });
        
        return {
            preselect(cityText) {
                if (!cityText || provinceCode.value) return false;
                const q = cityText.trim().toLowerCase();
                const p = provinces.find(x => x[1].toLowerCase().includes(q) || x[2].includes(cityText.trim()));
                if (p) {
                    provinceCode.value = p[0];
                    provinceInput.value = p[1];
                    districtCode.value = '';
                    setDisabled(districtInput, false);
                    return true;
                }
                return false;
            },
            isValid: () => !!provinceCode.value && !!districtCode.value && !!communeCode.value,
            getFullAddress() {
                if (!this.isValid()) return '';
                const parts = [provinceInput.value, districtInput.value, communeInput.value];
                if (villageInput.value) parts.push(villageInput.value);
                return parts.join(', ');
            }
        };
    }

    // Load initial data
    async function loadData() {
        console.log('Loading profile data...');
        
        // STEP 1: Immediately load from localStorage cache for instant display
        const cachedUser = localStorage.getItem('buybibz_user'); // Fixed: use underscore not hyphen
        console.log('Cached user data:', cachedUser);
        
        if (cachedUser) {
            try {
                const user = JSON.parse(cachedUser);
                console.log('Parsed cached user:', user);
                updateHero(user);
                // Display all cached fields immediately to prevent flash
                if (user.full_name) nameInput.value = user.full_name;
                if (user.email) emailInput.value = user.email;
                if (user.phone) phoneInput.value = user.phone;
                if (user.address) addressInput.value = user.address;
                if (user.postal_code) postalInput.value = user.postal_code;
                
                // Load Cambodia address fields from cache if available
                if (user.province && provinceInput) {
                    provinceInput.value = user.province;
                    if (user.province_code && provinceCode) provinceCode.value = user.province_code;
                    if (districtInput) districtInput.disabled = false;
                }
                if (user.district && districtInput) {
                    districtInput.value = user.district;
                    if (user.district_code && districtCode) districtCode.value = user.district_code;
                    if (communeInput) communeInput.disabled = false;
                }
                if (user.commune && communeInput) {
                    communeInput.value = user.commune;
                    if (user.commune_code && communeCode) communeCode.value = user.commune_code;
                    if (villageInput) villageInput.disabled = false;
                }
                if (user.village && villageInput) {
                    villageInput.value = user.village;
                }
                
                // Preselect province from legacy city field if available
                if (user.city && addressPickers && !user.province) {
                    addressPickers.preselect(user.city);
                }
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
        const fieldsToLoad = [phoneInput, addressInput, postalInput].filter(f => !f.value);
        fieldsToLoad.forEach(field => {
            field.style.opacity = '0.5';
            field.disabled = true;
        });

        // STEP 2: Load full profile from API in background and update if different
        try {
            const data = await api.getProfile();
            console.log('API profile data:', data);
            
            if (data && data.user) {
                const user = data.user;
                console.log('User from API:', user);
                updateHero(user);
                nameInput.value = user.full_name || '';
                phoneInput.value = user.phone || '';
                emailInput.value = user.email || '';
                addressInput.value = user.address || '';
                postalInput.value = user.postal_code || '';
                
                // Load Cambodia address fields from API if available
                if (user.province && provinceInput) {
                    provinceInput.value = user.province;
                    if (user.province_code && provinceCode) provinceCode.value = user.province_code;
                    if (districtInput) districtInput.disabled = false;
                }
                if (user.district && districtInput) {
                    districtInput.value = user.district;
                    if (user.district_code && districtCode) districtCode.value = user.district_code;
                    if (communeInput) communeInput.disabled = false;
                }
                if (user.commune && communeInput) {
                    communeInput.value = user.commune;
                    if (user.commune_code && communeCode) communeCode.value = user.commune_code;
                    if (villageInput) villageInput.disabled = false;
                }
                if (user.village && villageInput) {
                    villageInput.value = user.village;
                }
                
                // Preselect province from legacy city field if available
                if (user.city && addressPickers && !user.province) {
                    addressPickers.preselect(user.city);
                }
                
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
                        // Cache Cambodia address fields
                        if (user.province) userObj.province = user.province;
                        if (user.province_code) userObj.province_code = user.province_code;
                        if (user.district) userObj.district = user.district;
                        if (user.district_code) userObj.district_code = user.district_code;
                        if (user.commune) userObj.commune = user.commune;
                        if (user.commune_code) userObj.commune_code = user.commune_code;
                        if (user.village) userObj.village = user.village;
                        localStorage.setItem('buybibz_user', JSON.stringify(userObj));
                        console.log('Updated localStorage cache with API data');
                    } catch (e) {
                        console.error('Failed to update cached user:', e);
                    }
                }
            }
        } catch (err) {
            console.error('Error loading profile from API:', err);
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
        
        // Validate phone number (still required)
        if (!phoneInput.value.trim()) {
            showToast(typeof i18n !== 'undefined' ? i18n.t('profile.phone_required') : 'Phone number is required', 'warning');
            phoneInput.focus();
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = typeof i18n !== 'undefined' ? i18n.t('profile.saving') : 'Saving...';
        
        // 1. Save to API
        const payload = {
            full_name: nameInput.value.trim(),
            phone: phoneInput.value.trim(),
            address: addressInput.value.trim(),
            city: provinceInput.value.trim(), // Use province as city for backward compatibility
            postal_code: postalInput.value.trim()
        };
        
        // Add Cambodia-specific address fields if address pickers are available and have values
        // Only include these if the database migration has been run
        if (addressPickers) {
            if (provinceInput.value.trim()) {
                payload.province = provinceInput.value.trim();
                if (provinceCode.value) payload.province_code = provinceCode.value;
            }
            if (districtInput.value.trim()) {
                payload.district = districtInput.value.trim();
                if (districtCode.value) payload.district_code = districtCode.value;
            }
            if (communeInput.value.trim()) {
                payload.commune = communeInput.value.trim();
                if (communeCode.value) payload.commune_code = communeCode.value;
            }
            if (villageInput.value.trim()) {
                payload.village = villageInput.value.trim();
            }
        }
        
        let apiSuccess = false;
        try {
            console.log('Saving profile with payload:', payload);
            const updatedProfile = await api.updateProfile(payload);
            console.log('Profile save response:', updatedProfile);
            apiSuccess = true;

            // Refresh the hero directly from the payload so it always
            // reflects the save, independent of the storage cache
            updateHero({ full_name: payload.full_name, email: heroEmail.textContent });

            // Update local storage user data with FULL profile for instant display on next load
            const userStr = localStorage.getItem('buybibz_user'); // Fixed: use underscore
            if (userStr) {
                try {
                    const userObj = JSON.parse(userStr);
                    // Store all profile fields in localStorage cache
                    userObj.full_name = payload.full_name;
                    userObj.phone = payload.phone;
                    userObj.address = payload.address;
                    userObj.city = payload.city;
                    userObj.postal_code = payload.postal_code;
                    // Cache Cambodia address fields
                    if (payload.province) userObj.province = payload.province;
                    if (payload.province_code) userObj.province_code = payload.province_code;
                    if (payload.district) userObj.district = payload.district;
                    if (payload.district_code) userObj.district_code = payload.district_code;
                    if (payload.commune) userObj.commune = payload.commune;
                    if (payload.commune_code) userObj.commune_code = payload.commune_code;
                    if (payload.village) userObj.village = payload.village;
                    localStorage.setItem('buybibz_user', JSON.stringify(userObj)); // Fixed: use underscore
                    updateHero(userObj);

                    if (typeof renderNavbar === 'function') {
                        renderNavbar();
                    }
                } catch (e) {
                    console.error('Failed to update cached user after save:', e);
                }
            } else {
                // Create new cache if it doesn't exist
                try {
                    const user = api.getUser();
                    if (user) {
                        const newUserObj = {
                            ...user,
                            full_name: payload.full_name,
                            phone: payload.phone,
                            address: payload.address,
                            city: payload.city,
                            postal_code: payload.postal_code,
                        };
                        // Cache Cambodia address fields
                        if (payload.province) newUserObj.province = payload.province;
                        if (payload.province_code) newUserObj.province_code = payload.province_code;
                        if (payload.district) newUserObj.district = payload.district;
                        if (payload.district_code) newUserObj.district_code = payload.district_code;
                        if (payload.commune) newUserObj.commune = payload.commune;
                        if (payload.commune_code) newUserObj.commune_code = payload.commune_code;
                        if (payload.village) newUserObj.village = payload.village;
                        localStorage.setItem('buybibz_user', JSON.stringify(newUserObj));
                        updateHero(newUserObj);

                        if (typeof renderNavbar === 'function') {
                            renderNavbar();
                        }
                    }
                } catch (e) {
                    console.error('Failed to create cached user after save:', e);
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
