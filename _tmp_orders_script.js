
        document.addEventListener('DOMContentLoaded', () => {
            if (!requireAuth()) return;

            // Show timeout fallback if orders never load after 12s
            const skeletonTimeout = setTimeout(() => {
                const skeleton = document.getElementById('orders-skeleton');
                if (skeleton) {
                    skeleton.innerHTML = `
                        <div style="text-align:center;padding:var(--space-4xl);background:var(--bg-glass);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);">
                            <div style="font-size:2.5rem;margin-bottom:var(--space-md);opacity:0.4;">⏱️</div>
                            <h3 style="margin-bottom:var(--space-sm);">Taking too long</h3>
                            <p class="text-secondary" style="margin-bottom:var(--space-xl);">The server is not responding. Please check your connection or try again.</p>
                            <button class="btn btn-primary" onclick="location.reload()">Retry</button>
                        </div>`;
                }
            }, 12000);

            loadOrders().finally(() => clearTimeout(skeletonTimeout));
        });

        // Store orders for print lookup — avoids embedding JSON in onclick attributes
        const _ordersCache = new Map();

        async function loadOrders() {
            const container = document.getElementById('orders-list');
            const _t = typeof i18n !== 'undefined' ? i18n.t.bind(i18n) : (k) => k;

            try {
                const data = await api.getOrders();

                // Clear skeleton — we have a response now
                container.innerHTML = '';

                // Cache orders by ID for print lookup
                (data.orders || []).forEach(o => _ordersCache.set(o.id, o));

                if (!data.orders || data.orders.length === 0) {
                    container.innerHTML = `
                        <div style="text-align: center; padding: var(--space-4xl); background: var(--bg-glass); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg);">
                            <div style="font-size: 3rem; margin-bottom: var(--space-md); opacity: 0.5;">📦</div>
                            <h2 style="margin-bottom: var(--space-sm);">${_t('orders.no_orders')}</h2>
                            <p class="text-secondary" style="margin-bottom: var(--space-xl);">${_t('orders.no_orders_desc')}</p>
                            <a href="products.html" class="btn btn-primary">${_t('orders.start_shopping')}</a>
                        </div>
                    `;
                    return;
                }
                
                container.innerHTML = '';
                data.orders.forEach(order => {
                    const items = order.order_items || [];
                    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
                    const orderUid = order.order_uid || '#' + order.id;
                    const shortOrderUid = order.order_uid
                        ? order.order_uid.slice(0, 8) + '…' + order.order_uid.slice(-4)
                        : orderUid;

                    // ── Build items HTML safely (no nested template literals) ──
                    let itemsHtml = '';
                    items.forEach(item => {
                        const imgSrc = (item.selected_options || {})._selected_image
                            || item.product_image
                            || 'https://via.placeholder.com/100?text=Img';
                        const visibleOpts = Object.entries(item.selected_options || {})
                            .filter(([k]) => k !== '_selected_image');
                        let optsHtml = '';
                        visibleOpts.forEach(([k, v]) => {
                            const cleanK = toEnglishProductText(k.replace(/_/g, ' '));
                            const cleanV = toEnglishProductText(v, 'Standard');
                            const vWords = cleanV.split(' ');
                            const shortV = vWords.length > 4 ? vWords.slice(-3).join(' ') : cleanV;
                            optsHtml += '<div style="color:var(--text-secondary);font-size:var(--font-xs);margin-top:2px;text-transform:capitalize;">'
                                + cleanK + ': ' + shortV + '</div>';
                        });
                        const nameHtml = item.product_id
                            ? '<a href="product-detail.html?id=' + item.product_id + '" style="color:var(--text-primary);font-weight:600;display:block;margin-bottom:2px;">' + item.product_name + '</a>'
                            : '<span style="color:var(--text-primary);font-weight:600;display:block;margin-bottom:2px;">' + item.product_name + '</span>';
                        itemsHtml += '<div class="order-item">'
                            + '<div class="order-item-image"><img src="' + imgSrc + '" alt="' + item.product_name.replace(/"/g, '&quot;') + '"></div>'
                            + '<div style="flex:1;">'
                            + nameHtml
                            + '<div style="color:var(--text-tertiary);font-size:var(--font-xs);">' + formatPrice(item.price) + ' × ' + item.quantity + '</div>'
                            + optsHtml
                            + '</div>'
                            + '<div style="font-weight:700;">' + formatPrice(item.subtotal) + '</div>'
                            + '</div>';
                    });

                    // ── Notes block ──
                    const notesHtml = order.notes
                        ? '<div style="margin-top:var(--space-md);padding-top:var(--space-md);border-top:1px solid var(--border-default);">'
                          + '<div style="font-size:var(--font-xs);color:var(--text-tertiary);margin-bottom:4px;">' + _t('orders.notes') + '</div>'
                          + '<div style="font-size:var(--font-sm);font-style:italic;">' + order.notes + '</div>'
                          + '</div>'
                        : '';

                    const shippingFeePos = order.shipping_fee > 0 ? '' : 'color:var(--status-success);';
                    const shippingFeeVal = order.shipping_fee > 0 ? formatPrice(order.shipping_fee) : _t('orders.free');

                    const html = '<div class="order-card">'
                        // Header
                        + '<div class="order-card-header" data-toggle-order="' + order.id + '">'
                        +   '<div class="order-card-identity">'
                        +     '<span class="order-eyebrow">' + _t('orders.order_uid') + '</span>'
                        +     '<div class="order-uid-row">'
                        +       '<code class="order-uid" title="' + orderUid + '">' + shortOrderUid + '</code>'
                        +       '<button class="order-copy-btn" type="button" data-copy-uid="' + orderUid + '" aria-label="Copy order UID">'
                        +         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
                        +       '</button>'
                        +     '</div>'
                        +     '<div class="order-date">' + formatDate(order.created_at) + ' • ' + itemCount + ' ' + (itemCount !== 1 ? _t('orders.items_plural') : _t('orders.items')) + '</div>'
                        +   '</div>'
                        +   '<div class="order-card-summary">'
                        +     '<div class="order-total">' + formatPrice(order.total) + '</div>'
                        +     renderStatusBadge(order.status)
                        +     '<span class="order-expand-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span>'
                        +   '</div>'
                        + '</div>'
                        // Body
                        + '<div class="order-card-body" id="order-details-' + order.id + '">'
                        +   '<div class="order-uid-detail">'
                        +     '<span>' + _t('orders.order_uid') + '</span>'
                        +     '<code>' + orderUid + '</code>'
                        +     '<button type="button" data-copy-uid="' + orderUid + '">' + _t('orders.copy') + '</button>'
                        +   '</div>'
                        +   renderOrderTracker(order.status)
                        +   '<div class="order-details-grid">'
                        +     '<div>'
                        +       '<h4 style="font-size:var(--font-sm);color:var(--text-secondary);margin-bottom:var(--space-md);text-transform:uppercase;letter-spacing:0.05em;">' + _t('orders.items_label') + '</h4>'
                        +       itemsHtml
                        +     '</div>'
                        +     '<div style="background:var(--bg-tertiary);padding:var(--space-lg);border-radius:var(--radius-md);display:flex;flex-direction:column;justify-content:space-between;min-height:240px;">'
                        +       '<div>'
                        +         '<h4 style="font-size:var(--font-sm);color:var(--text-secondary);margin-bottom:var(--space-md);text-transform:uppercase;letter-spacing:0.05em;">' + _t('orders.shipping_details') + '</h4>'
                        +         '<div style="font-size:var(--font-sm);line-height:1.6;">'
                        +           '<div style="font-weight:600;color:var(--text-primary);">' + order.shipping_name + '</div>'
                        +           '<div>' + order.shipping_address + '</div>'
                        +           '<div>' + order.shipping_city + (order.shipping_postal ? ', ' + order.shipping_postal : '') + '</div>'
                        +           (order.shipping_phone ? '<div style="margin-top:var(--space-xs);color:var(--text-tertiary);">&#128222; ' + order.shipping_phone + '</div>' : '')
                        +         '</div>'
                        +         notesHtml
                        +         '<div style="margin-top:var(--space-md);padding-top:var(--space-md);border-top:1px solid var(--border-default);">'
                        +           '<div style="display:flex;justify-content:space-between;font-size:var(--font-xs);color:var(--text-tertiary);margin-bottom:4px;">'
                        +             '<span>' + _t('orders.subtotal') + '</span>'
                        +             '<span>' + formatPrice((order.total || 0) - (order.shipping_fee || 0)) + '</span>'
                        +           '</div>'
                        +           '<div style="display:flex;justify-content:space-between;font-size:var(--font-xs);margin-bottom:4px;' + shippingFeePos + '">'
                        +             '<span>' + _t('orders.intl_shipping') + '</span>'
                        +             '<span>' + shippingFeeVal + '</span>'
                        +           '</div>'
                        +           '<div style="display:flex;justify-content:space-between;font-size:var(--font-sm);font-weight:700;color:var(--text-brand);border-top:1px solid var(--border-subtle);padding-top:4px;margin-top:4px;">'
                        +             '<span>' + _t('orders.total') + '</span>'
                        +             '<span>' + formatPrice(order.total) + '</span>'
                        +           '</div>'
                        +         '</div>'
                        +       '</div>'
                        +       '<button class="btn btn-secondary btn-sm" data-print-order="' + order.id + '" style="margin-top:var(--space-lg);width:100%;display:flex;align-items:center;justify-content:center;gap:8px;">'
                        +         '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>'
                        +         _t('orders.print_receipt')
                        +       '</button>'
                        +     '</div>'
                        +   '</div>'
                        + '</div>'
                        + '</div>';

                    container.insertAdjacentHTML('beforeend', html);
                });

                // ── Event delegation — no inline onclick needed ──
                container.addEventListener('click', e => {
                    // Toggle order details
                    const header = e.target.closest('[data-toggle-order]');
                    if (header) { toggleOrderDetails(parseInt(header.dataset.toggleOrder)); return; }
                    // Copy UID
                    const copyBtn = e.target.closest('[data-copy-uid]');
                    if (copyBtn) { e.stopPropagation(); copyOrderUid(copyBtn.dataset.copyUid); return; }
                    // Print receipt
                    const printBtn = e.target.closest('[data-print-order]');
                    if (printBtn) { printReceipt(parseInt(printBtn.dataset.printOrder)); return; }
                }, { once: false });
                
            } catch (err) {
                container.innerHTML = `<p class="text-secondary">${_t('orders.load_error')}: ${err.message}</p>`;
            }
        }

        function toggleOrderDetails(orderId) {
            const body = document.getElementById(`order-details-${orderId}`);
            if (body.classList.contains('show')) {
                body.classList.remove('show');
            } else {
                body.classList.add('show');
            }
        }

        async function copyOrderUid(orderUid) {
            const _t = typeof i18n !== 'undefined' ? i18n.t.bind(i18n) : (k) => k;
            try {
                await navigator.clipboard.writeText(orderUid);
                showToast(_t('orders.uid_copied'), 'success');
            } catch {
                showToast(_t('orders.uid_copy_error'), 'error');
            }
        }

        function renderOrderTracker(status) {
            const _t = typeof i18n !== 'undefined' ? i18n.t.bind(i18n) : (k) => k;
            let statusText = '';
            let pPercent = '0%';

            if (status === 'cancelled') {
                statusText = _t('orders.status_cancelled');
                return `
                    <div class="order-tracker cancelled">
                        <div class="tracker-steps" style="max-width: 300px; margin: 0 auto;">
                            <div class="tracker-progress-wrapper">
                                <div class="tracker-progress-bar" style="--progress: 100%;"></div>
                            </div>
                            <div class="tracker-step completed">
                                <div class="step-icon">✓</div>
                                <div class="step-label">${_t('orders.placed')}</div>
                            </div>
                            <div class="tracker-step active">
                                <div class="step-icon">✕</div>
                                <div class="step-label">${_t('orders.cancelled')}</div>
                            </div>
                        </div>
                        <div class="tracker-description" style="color: var(--status-error); font-weight: 600;">
                            ${statusText}
                        </div>
                    </div>
                `;
            }

            let s1 = '', s2 = '', s3 = '', s4 = '';
            let icon1 = '1', icon2 = '2', icon3 = '3', icon4 = '4';

            switch (status) {
                case 'pending':
                    s1 = 'active'; icon1 = '&#x1F6D2;'; pPercent = '0%';
                    statusText = _t('orders.status_pending');
                    break;
                case 'processing':
                    s1 = 'completed'; icon1 = '&#10003;'; s2 = 'active'; icon2 = '&#x2699;'; pPercent = '33.33%';
                    statusText = _t('orders.status_processing');
                    break;
                case 'shipped':
                    s1 = 'completed'; icon1 = '✓'; s2 = 'completed'; icon2 = '✓';
                    s3 = 'active'; icon3 = '🚚'; pPercent = '66.66%';
                    statusText = _t('orders.status_shipped');
                    break;
                case 'delivered':
                    s1 = 'completed'; icon1 = '✓'; s2 = 'completed'; icon2 = '✓';
                    s3 = 'completed'; icon3 = '✓'; s4 = 'completed'; icon4 = '🎁'; pPercent = '100%';
                    statusText = _t('orders.status_delivered');
                    break;
                default:
                    s1 = 'active'; icon1 = '🛒'; pPercent = '0%';
                    statusText = _t('orders.status_default');
            }

            return `
                <div class="order-tracker">
                    <div class="tracker-steps">
                        <div class="tracker-progress-wrapper">
                            <div class="tracker-progress-bar" style="--progress: ${pPercent};"></div>
                        </div>
                        <div class="tracker-step ${s1}">
                            <div class="step-icon">${icon1}</div>
                            <div class="step-label">${_t('orders.placed')}</div>
                        </div>
                        <div class="tracker-step ${s2}">
                            <div class="step-icon">${icon2}</div>
                            <div class="step-label">${_t('orders.processing')}</div>
                        </div>
                        <div class="tracker-step ${s3}">
                            <div class="step-icon">${icon3}</div>
                            <div class="step-label">${_t('orders.shipped')}</div>
                        </div>
                        <div class="tracker-step ${s4}">
                            <div class="step-icon">${icon4}</div>
                            <div class="step-label">${_t('orders.delivered')}</div>
                        </div>
                    </div>
                    <div class="tracker-description">
                        ${statusText}
                    </div>
                </div>
            `;
        }

        function printReceipt(orderId) {
            const _t = typeof i18n !== 'undefined' ? i18n.t.bind(i18n) : (k) => k;
            const order = _ordersCache.get(orderId);
            if (!order) { showToast('Order data not available', 'error'); return; }
            const items = order.order_items || [];
            const printWindow = window.open('', '_blank', 'width=800,height=900');
            
            const itemsHtml = items.map(item => `
                <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                        <div style="font-weight: 600; color: #111;">${item.product_name}</div>
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center; color: #555;">
                        ${formatPrice(item.price)}
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center; color: #555;">
                        ${item.quantity}
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 600; color: #111;">
                        ${formatPrice(item.subtotal)}
                    </td>
                </tr>
            `).join('');

            // Build receipt using string parts — NO closing HTML tags in JS source
            // (</style>, </head>, </body>, </html> inside a <script> block terminate it early)
            const closeTag = (tag) => '</' + tag + '>';

            const receiptHtml = '<!DOCTYPE html>'
                + '<html><head>'
                + '<title>' + _t('orders.print_receipt') + ' - ' + (order.order_uid || order.id) + closeTag('title')
                + '<style>'
                + 'body{font-family:Helvetica Neue,Helvetica,Arial,sans-serif;color:#333;margin:0;padding:40px;line-height:1.6;background:#fff}'
                + '.invoice-box{max-width:800px;margin:auto}'
                + '.logo{font-size:28px;font-weight:800;color:#1B8C3D;letter-spacing:-0.5px}'
                + '.invoice-title{font-size:24px;font-weight:700;text-align:right;color:#111;text-transform:uppercase}'
                + '.section-title{font-size:12px;font-weight:700;color:#888;text-transform:uppercase;margin-bottom:10px;letter-spacing:0.5px}'
                + '.info-text{font-size:14px;color:#555}'
                + '.info-text strong{color:#111}'
                + 'table{width:100%;border-collapse:collapse}'
                + '.items-table th{border-bottom:2px solid #1B8C3D;padding-bottom:8px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;font-weight:700}'
                + '.totals-table{width:320px;margin-left:auto;margin-bottom:40px}'
                + '.totals-table td{padding:8px 0;font-size:14px}'
                + '.grand-total td{border-top:2px solid #eee;font-size:18px;font-weight:700;color:#1B8C3D;padding-top:12px}'
                + '.receipt-footer{border-top:1px solid #eee;padding-top:20px;text-align:center;font-size:12px;color:#888;margin-top:50px}'
                + '@media print{body{padding:0}.no-print{display:none}}'
                + closeTag('style')
                + closeTag('head')
                + '<body><div class="invoice-box">'
                // Header
                + '<table style="margin-bottom:40px"><tr>'
                + '<td><div class="logo">BuyBIBZ</div><div style="font-size:12px;color:#888;margin-top:4px;">Premium E-Commerce Marketplace</div></td>'
                + '<td class="invoice-title">' + _t('orders.print_receipt')
                + '<div style="font-size:13px;font-weight:normal;color:#555;margin-top:6px;text-transform:none;">'
                + _t('orders.order_uid') + ': <strong>' + (order.order_uid || order.id) + '</strong><br>'
                + formatDate(order.created_at)
                + '</div></td>'
                + '</tr></table>'
                // Shipping
                + '<table style="margin-bottom:40px"><tr>'
                + '<td style="width:50%;vertical-align:top">'
                + '<div class="section-title">' + _t('checkout.shipping_details') + '</div>'
                + '<div class="info-text"><strong>' + order.shipping_name + '</strong><br>'
                + order.shipping_address + '<br>'
                + order.shipping_city + (order.shipping_postal ? ', ' + order.shipping_postal : '') + '<br>'
                + (order.shipping_phone ? '&#128222; ' + order.shipping_phone : '')
                + (order.notes ? '<br><br><em>' + _t('orders.notes') + ': ' + order.notes + '</em>' : '')
                + '</div></td>'
                + '<td style="width:50%;text-align:right;vertical-align:top">'
                + '<div class="section-title">' + _t('checkout.payment_method') + '</div>'
                + '<strong style="color:#1B8C3D">' + order.status.toUpperCase() + '</strong>'
                + '</td></tr></table>'
                // Items
                + '<table class="items-table" style="margin-bottom:30px"><thead><tr>'
                + '<th style="width:55%">' + _t('orders.items_label') + '</th>'
                + '<th style="width:15%;text-align:center">Price</th>'
                + '<th style="width:15%;text-align:center">Qty</th>'
                + '<th style="width:15%;text-align:right">' + _t('orders.total') + '</th>'
                + '</tr></thead><tbody>'
                + itemsHtml
                + '</tbody></table>'
                // Totals
                + '<table class="totals-table"><tr>'
                + '<td style="color:#888">' + _t('orders.subtotal') + '</td>'
                + '<td style="text-align:right;font-weight:600;color:#111">' + formatPrice((order.total || 0) - (order.shipping_fee || 0)) + '</td>'
                + '</tr><tr>'
                + '<td style="color:#888">' + _t('orders.intl_shipping') + '</td>'
                + '<td style="text-align:right;font-weight:600;color:#111">' + (order.shipping_fee > 0 ? formatPrice(order.shipping_fee) : _t('orders.free')) + '</td>'
                + '</tr><tr class="grand-total">'
                + '<td>' + _t('orders.total') + '</td>'
                + '<td style="text-align:right">' + formatPrice(order.total) + '</td>'
                + '</tr></table>'
                + '<div class="receipt-footer">Thank you for shopping with BuyBIBZ!<br>support@buybibz.com</div>'
                + '</div>' + closeTag('body') + closeTag('html');

            printWindow.document.write(receiptHtml);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    