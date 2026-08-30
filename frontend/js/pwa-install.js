/**
 * BuyBIBZ - PWA Install Prompt
 * Smart install prompt that respects user dismissals:
 * - Persists dismissal in localStorage with a 7-day cooldown
 * - Stops showing permanently after 3 dismissals
 * - Only shows on the 2nd+ page visit (not on first visit)
 */

let deferredPrompt;
const PROMPT_DISMISSED_KEY = 'buybibz_install_dismissed';
const PROMPT_INSTALLED_KEY = 'buybibz_pwa_installed';
const PROMPT_DISMISS_COUNT_KEY = 'buybibz_dismiss_count';
const PROMPT_VISIT_COUNT_KEY = 'buybibz_visit_count';
const DISMISS_COOLDOWN_DAYS = 7;
const MAX_DISMISSALS = 3;

// Track visits - increment on each page load
(function trackVisit() {
    const visits = parseInt(localStorage.getItem(PROMPT_VISIT_COUNT_KEY) || '0', 10);
    localStorage.setItem(PROMPT_VISIT_COUNT_KEY, String(visits + 1));
})();

// Check if currently running as PWA
function isRunningAsPWA() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
}

// Clear installed flag if app was uninstalled
function checkUninstallStatus() {
    if (localStorage.getItem(PROMPT_INSTALLED_KEY) === 'true' && !isRunningAsPWA()) {
        console.log('App was uninstalled, clearing installed flag');
        localStorage.removeItem(PROMPT_INSTALLED_KEY);
    }
}

// Run uninstall check on load
checkUninstallStatus();

/**
 * Determine whether the install prompt should be shown right now.
 * Returns false if:
 *  - Already installed / running as PWA
 *  - User dismissed it and the cooldown hasn't expired
 *  - User has dismissed it MAX_DISMISSALS times (permanent opt-out)
 *  - This is the user's first ever visit
 */
function shouldShowPrompt() {
    // Already installed
    if (isPWAInstalled()) return false;

    // First visit – don't nag newcomers
    const visits = parseInt(localStorage.getItem(PROMPT_VISIT_COUNT_KEY) || '0', 10);
    if (visits <= 1) return false;

    // Permanently opted out after too many dismissals
    const dismissCount = parseInt(localStorage.getItem(PROMPT_DISMISS_COUNT_KEY) || '0', 10);
    if (dismissCount >= MAX_DISMISSALS) return false;

    // Still within cooldown period
    const dismissedAt = localStorage.getItem(PROMPT_DISMISSED_KEY);
    if (dismissedAt) {
        const dismissDate = new Date(dismissedAt);
        const now = new Date();
        const daysSinceDismiss = (now - dismissDate) / (1000 * 60 * 60 * 24);
        if (daysSinceDismiss < DISMISS_COOLDOWN_DAYS) return false;
    }

    return true;
}

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    if (!shouldShowPrompt()) return;
    
    // Show the install prompt after a short delay
    setTimeout(() => {
        showInstallPrompt();
    }, 2000);
});

// Listen for app installed event
window.addEventListener('appinstalled', () => {
    console.log('BuyBIBZ PWA was installed');
    localStorage.setItem(PROMPT_INSTALLED_KEY, 'true');
    hideInstallPrompt();
    deferredPrompt = null;
});

// Check if PWA is already installed
function isPWAInstalled() {
    if (isRunningAsPWA()) return true;
    if (localStorage.getItem(PROMPT_INSTALLED_KEY) === 'true') return true;
    return false;
}

// Create and show install prompt
function showInstallPrompt() {
    if (!deferredPrompt || !shouldShowPrompt()) return;
    
    // Create prompt HTML
    const promptHTML = `
        <div id="pwa-install-prompt" class="pwa-install-prompt">
            <div class="pwa-prompt-content">
                <div class="pwa-prompt-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                </div>
                <div class="pwa-prompt-text">
                    <div class="pwa-prompt-title">Install BuyBIBZ</div>
                    <div class="pwa-prompt-message">Add to your home screen for quick access and offline support</div>
                </div>
                <div class="pwa-prompt-actions">
                    <button id="pwa-install-btn" class="pwa-btn pwa-btn-install">Install</button>
                    <button id="pwa-dismiss-btn" class="pwa-btn pwa-btn-dismiss">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add to page
    document.body.insertAdjacentHTML('beforeend', promptHTML);
    
    // Animate in
    setTimeout(() => {
        const prompt = document.getElementById('pwa-install-prompt');
        if (prompt) {
            prompt.classList.add('show');
        }
    }, 100);
    
    // Add event listeners
    document.getElementById('pwa-install-btn')?.addEventListener('click', handleInstall);
    document.getElementById('pwa-dismiss-btn')?.addEventListener('click', handleDismiss);
}

// Handle install button click
async function handleInstall() {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to install prompt: ${outcome}`);
    
    if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        localStorage.setItem(PROMPT_INSTALLED_KEY, 'true');
    }
    
    hideInstallPrompt();
    deferredPrompt = null;
}

// Handle dismiss button click – persist to localStorage
function handleDismiss() {
    // Save the timestamp of this dismissal
    localStorage.setItem(PROMPT_DISMISSED_KEY, new Date().toISOString());

    // Increment dismiss counter
    const count = parseInt(localStorage.getItem(PROMPT_DISMISS_COUNT_KEY) || '0', 10);
    localStorage.setItem(PROMPT_DISMISS_COUNT_KEY, String(count + 1));

    hideInstallPrompt();
}

// Hide and remove install prompt
function hideInstallPrompt() {
    const prompt = document.getElementById('pwa-install-prompt');
    if (prompt) {
        prompt.classList.remove('show');
        setTimeout(() => {
            prompt.remove();
        }, 300);
    }
}

// For iOS - show instructions since iOS doesn't support beforeinstallprompt
// Also for Android devices that don't trigger beforeinstallprompt
function showMobileFallback() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const isMobile = isIOS || isAndroid || /Mobile|Tablet/.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone === true || isRunningAsPWA();
    
    // Use the same smart check
    if (isStandalone || !shouldShowPrompt()) return;
    
    // For iOS or mobile devices without beforeinstallprompt
    if (isMobile) {
        setTimeout(() => {
            // Check if deferredPrompt was triggered (Android Chrome)
            if (deferredPrompt) return;
            
            let instructionsHTML = '';
            
            if (isIOS) {
                // iOS-specific instructions
                instructionsHTML = `
                    <div id="pwa-install-prompt" class="pwa-install-prompt pwa-ios-prompt">
                        <div class="pwa-prompt-content">
                            <div class="pwa-prompt-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                                    <line x1="12" y1="18" x2="12.01" y2="18"></line>
                                </svg>
                            </div>
                            <div class="pwa-prompt-text">
                                <div class="pwa-prompt-title">Install BuyBIBZ App</div>
                                <div class="pwa-prompt-message">
                                    1. Tap the Share button in Safari<br>
                                    2. Scroll and tap "Add to Home Screen"<br>
                                    3. Tap "Add" to install
                                </div>
                            </div>
                            <button id="pwa-dismiss-btn" class="pwa-btn pwa-btn-dismiss">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                `;
            } else if (isAndroid) {
                // Android fallback (browser that doesn't support beforeinstallprompt)
                instructionsHTML = `
                    <div id="pwa-install-prompt" class="pwa-install-prompt">
                        <div class="pwa-prompt-content">
                            <div class="pwa-prompt-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                            </div>
                            <div class="pwa-prompt-text">
                                <div class="pwa-prompt-title">Install BuyBIBZ App</div>
                                <div class="pwa-prompt-message">
                                    1. Tap menu (⋮) in your browser<br>
                                    2. Select "Install app" or "Add to Home screen"<br>
                                    3. Tap "Install" to add
                                </div>
                            </div>
                            <button id="pwa-dismiss-btn" class="pwa-btn pwa-btn-dismiss">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                `;
            } else {
                // Other mobile devices
                instructionsHTML = `
                    <div id="pwa-install-prompt" class="pwa-install-prompt">
                        <div class="pwa-prompt-content">
                            <div class="pwa-prompt-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                                </svg>
                            </div>
                            <div class="pwa-prompt-text">
                                <div class="pwa-prompt-title">Install BuyBIBZ</div>
                                <div class="pwa-prompt-message">
                                    Add to your home screen for quick access
                                </div>
                            </div>
                            <button id="pwa-dismiss-btn" class="pwa-btn pwa-btn-dismiss">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                `;
            }
            
            document.body.insertAdjacentHTML('beforeend', instructionsHTML);
            
            setTimeout(() => {
                const prompt = document.getElementById('pwa-install-prompt');
                if (prompt) {
                    prompt.classList.add('show');
                }
            }, 100);
            
            document.getElementById('pwa-dismiss-btn')?.addEventListener('click', handleDismiss);
        }, 2000);
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        showMobileFallback();
    });
} else {
    showMobileFallback();
}
