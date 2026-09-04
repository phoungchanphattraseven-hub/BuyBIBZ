/**
 * BuyBIBZ — Cambodia address cascading picker
 * Searchable combobox for Province → District → Commune → Village,
 * backed by KH_ADDRESS (kh-address-data.js) and KH_VILLAGES
 * (kh-villages-data.js, lazy-loaded after a commune is chosen).
 *
 * Node format in KH_ADDRESS: [code, english, khmer, typeKh, children?]
 * Village format in KH_VILLAGES[communeCode]: [english, khmer]
 */
(function () {
    'use strict';

    const TYPE_EN = {
        'ខណ្ឌ': 'Khan',
        'ស្រុក': 'Srok',
        'ក្រុង': 'Krong',
        'ឃុំ': 'Khum',
        'សង្កាត់': 'Sangkat',
    };

    const t = (key, fallback) => (typeof i18n !== 'undefined' ? i18n.t(key) : fallback);

    // Display label: "Srok Mongkol Borei" / "ស្រុកមង្គលបូរី"
    function labelEn(node) {
        const prefix = TYPE_EN[node[3]];
        return prefix ? `${prefix} ${node[1]}` : node[1];
    }

    function labelKm(node) {
        return node[3] ? `${node[3]} ${node[2]}` : node[2];
    }

    let villagesPromise = null;
    function ensureVillagesLoaded() {
        if (window.KH_VILLAGES) return Promise.resolve();
        if (villagesPromise) return villagesPromise;
        villagesPromise = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'js/kh-villages-data.js';
            s.onload = () => resolve();
            s.onerror = () => { villagesPromise = null; reject(new Error('load failed')); };
            document.head.appendChild(s);
        });
        return villagesPromise;
    }

    /**
     * Attach a searchable dropdown to an input.
     * opts: {
     *   getOptions(): [{en, km, data}]  — current suggestion list
     *   onSelect(item): called when a suggestion is chosen
     *   onType(): called on manual input (cascade reset hook)
     *   emptyText: message when list is empty
     * }
     */
    function combo(input, opts) {
        const wrapper = input.closest('.kh-combo-group');
        if (!wrapper) return;
        if (getComputedStyle(wrapper).position === 'static') wrapper.style.position = 'relative';

        const list = document.createElement('div');
        list.className = 'kh-combo-list';
        list.setAttribute('role', 'listbox');
        wrapper.appendChild(list);

        let items = [];
        let activeIndex = -1;

        input.setAttribute('autocomplete', 'off');
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-expanded', 'false');

        function hide() {
            list.classList.remove('open');
            input.setAttribute('aria-expanded', 'false');
            activeIndex = -1;
        }

        function render(filterText) {
            const all = opts.getOptions() || [];
            const q = (filterText || '').trim().toLowerCase();
            const qKm = (filterText || '').trim();
            items = !q ? all.slice(0, 80) : all.filter(it =>
                it.en.toLowerCase().includes(q) || (it.km && qKm && it.km.includes(qKm))
            ).slice(0, 80);

            if (!items.length) {
                list.innerHTML = `<div class="kh-combo-empty">${opts.emptyText || t('checkout.no_matches', 'No matches found')}</div>`;
            } else {
                list.innerHTML = items.map((it, i) => `
                    <div class="kh-combo-item" role="option" data-i="${i}">
                        <span class="en">${it.en}</span>
                        ${it.km && it.km !== it.en ? `<span class="km">${it.km}</span>` : ''}
                    </div>
                `).join('');
            }
            list.classList.add('open');
            input.setAttribute('aria-expanded', 'true');
        }

        function choose(i) {
            const item = items[i];
            if (!item) return;
            input.value = item.en;
            hide();
            opts.onSelect(item);
        }

        input.addEventListener('focus', () => {
            if (input.disabled) return;
            render(input.value);
        });
        input.addEventListener('input', () => {
            if (input.disabled) return;
            render(input.value);
            if (opts.onType) opts.onType();
        });
        input.addEventListener('keydown', (e) => {
            if (!list.classList.contains('open')) {
                if (e.key === 'ArrowDown' && !input.disabled) { render(input.value); e.preventDefault(); }
                return;
            }
            const nodes = list.querySelectorAll('.kh-combo-item');
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                activeIndex = Math.min(activeIndex + 1, items.length - 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                activeIndex = Math.max(activeIndex - 1, 0);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (activeIndex >= 0) choose(activeIndex);
                return;
            } else if (e.key === 'Escape') {
                hide();
                return;
            } else {
                return;
            }
            nodes.forEach(n => n.classList.remove('active'));
            if (nodes[activeIndex]) {
                nodes[activeIndex].classList.add('active');
                nodes[activeIndex].scrollIntoView({ block: 'nearest' });
            }
        });
        // pointerdown fires before the input's blur, so clicks register
        list.addEventListener('pointerdown', (e) => {
            const item = e.target.closest('.kh-combo-item');
            if (!item) return;
            e.preventDefault();
            choose(parseInt(item.dataset.i, 10));
        });
        input.addEventListener('blur', () => setTimeout(hide, 120));
    }

    /**
     * Wire the full cascade into a form.
     * Expects inputs: #shipping_province, #shipping_district, #shipping_commune,
     * #shipping_village and hidden code inputs #shipping_province_code, etc.
     */
    function initCheckoutPickers() {
        if (!window.KH_ADDRESS) return;
        const provinces = window.KH_ADDRESS.provinces;

        const el = (id) => document.getElementById(id);
        const provInput = el('shipping_province'), provCode = el('shipping_province_code');
        const distInput = el('shipping_district'), distCode = el('shipping_district_code');
        const comInput = el('shipping_commune'), comCode = el('shipping_commune_code');
        const vilInput = el('shipping_village');
        if (!provInput || !distInput || !comInput) return;

        const setDisabled = (input, disabled) => {
            input.disabled = disabled;
            if (disabled) { input.value = ''; input.placeholder = t('checkout.combo_placeholder', 'Select or type to search'); }
        };

        function resetDistrict() {
            distCode.value = '';
            setDisabled(distInput, true);
            resetCommune();
        }
        function resetCommune() {
            comCode.value = '';
            setDisabled(comInput, true);
            resetVillage();
        }
        function resetVillage() {
            vilInput.value = '';
            vilInput.disabled = true;
            vilInput.placeholder = t('checkout.combo_placeholder', 'Select or type to search');
        }
        resetDistrict();

        const provOpts = provinces.map(p => ({ en: p[1], km: labelKm(p), node: p }));

        combo(provInput, {
            getOptions: () => provOpts,
            onType: () => { provCode.value = ''; resetDistrict(); },
            onSelect: (item) => {
                provCode.value = item.node[0];
                provInput.value = item.node[1];
                distCode.value = '';
                setDisabled(distInput, false);
                resetCommune();
                distInput.focus();
            },
        });

        combo(distInput, {
            getOptions: () => {
                const p = provinces.find(x => x[0] === provCode.value);
                return p ? p[4].map(d => ({ en: labelEn(d), km: labelKm(d), node: d })) : [];
            },
            onType: () => { distCode.value = ''; resetCommune(); },
            onSelect: (item) => {
                distCode.value = item.node[0];
                distInput.value = item.en;
                comCode.value = '';
                setDisabled(comInput, false);
                resetVillage();
                comInput.focus();
            },
        });

        combo(comInput, {
            getOptions: () => {
                const p = provinces.find(x => x[0] === provCode.value);
                const d = p && p[4].find(x => x[0] === distCode.value);
                return d ? d[4].map(c => ({ en: labelEn(c), km: labelKm(c), node: c })) : [];
            },
            onType: () => { comCode.value = ''; resetVillage(); },
            onSelect: (item) => {
                comCode.value = item.node[0];
                comInput.value = item.en;
                vilInput.disabled = false;
                vilInput.value = '';
                vilInput.placeholder = t('checkout.village_placeholder', 'Type to search your village');
                vilInput.focus();
                // Lazy-load the village dataset on first use
                ensureVillagesLoaded().catch(() => {});
            },
        });

        combo(vilInput, {
            getOptions: () => {
                if (!window.KH_VILLAGES || !comCode.value) return [];
                return (window.KH_VILLAGES[comCode.value] || []).map(v => ({ en: v[0], km: v[1] }));
            },
            onType: () => ensureVillagesLoaded().catch(() => {}),
            onSelect: (item) => { vilInput.value = item.en; },
            emptyText: t('checkout.loading_villages', 'Loading villages...'),
        });

        // Best-effort preselect from a legacy free-text city value (e.g. "Phnom Penh")
        return {
            preselect(cityText) {
                if (!cityText || provCode.value) return false;
                const q = cityText.trim().toLowerCase();
                const p = provinces.find(x => x[1].toLowerCase().includes(q) || x[2].includes(cityText.trim()));
                if (p) {
                    provCode.value = p[0];
                    provInput.value = p[1];
                    distCode.value = '';
                    setDisabled(distInput, false);
                    return true;
                }
                return false;
            },
            isValid: () => !!provCode.value && !!distCode.value && !!comCode.value,
        };
    }

    window.KHAddressUI = { combo, initCheckoutPickers, ensureVillagesLoaded };
})();
