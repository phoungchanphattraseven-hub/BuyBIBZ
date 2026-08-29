/**
 * BuyBIBZ - PWA Install Prompt
 * Shows "Add to Home Screen" prompt that can be dismissed but reappears on refresh
 */

let deferredPrompt;
const PROMPT_DISMISSED_KEY = 'buybibz_install_dismissed';
const PROMPT_INSTALLED_KEY = 'buybibz_pwa_installed';

// Check if already dismissed in this session
let dismissedThisSession = false;

// Check if currently running as PWA
function isRunningAsPWA() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
}

// Clear installed flag if app was uninstalled
function checkUninstallStatus() {
    if (localStorage.getItem(PROMPT_INSTALLED_KEY) === 'true' && !isRunningAsPWA()) {
        // App was installed but now not running as PWA - user likely uninstalled
        console.log('App was uninstalled, clearing installed flag');
        localStorage.removeItem(PROMPT_INSTALLED_KEY);
    }
}

// Run uninstall check on load
checkUninstallStatus();

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Don't show if already installed or dismissed this session
    if (isPWAInstalled() || dismissedThisSession) {
        return;
    }
    
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
    // Check if app is running in standalone mode
    if (isRunningAsPWA()) {
        return true;
    }
    
    // Check if user has already installed (and hasn't uninstalled)
    if (localStorage.getItem(PROMPT_INSTALLED_KEY) === 'true') {
        return true;
    }
    
    return false;
}

// Create and show install prompt
function showInstallPrompt() {
    // Don't show if prompt doesn't exist or already dismissed
    if (!deferredPrompt || dismissedThisSession) {
        return;
    }
    
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
    if (!deferredPrompt) {
        return;
    }
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to install prompt: ${outcome}`);
    
    if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        localStorage.setItem(PROMPT_INSTALLED_KEY, 'true');
    }
    
    // Hide the prompt
    hideInstallPrompt();
    
    // Clear the deferredPrompt
    deferredPrompt = null;
}

// Handle dismiss button click
function handleDismiss() {
    dismissedThisSession = true;
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
    
    // Don't show if already running as PWA or dismissed this session
    if (isStandalone || dismissedThisSession || isPWAInstalled()) {
        return;
    }
    
    // For iOS or mobile devices without beforeinstallprompt
    if (isMobile) {
        setTimeout(() => {
            // Check if deferredPrompt was triggered (Android Chrome)
            if (deferredPrompt) {
                // Native prompt is available, don't show fallback
                return;
            }
            
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
                                <div class="pwa-prompt-title">Install BuyBIBZ</div>
                                <div class="pwa-prompt-message">
                                    Tap 
                                    <svg style="display: inline; width: 16px; height: 16px; vertical-align: middle; margin: 0 2px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" fill="currentColor">
                                        <path d="M25 2L25 35L25 2z"/>
                                        <path d="M15 15L25 2 35 15z"/>
                                        <path d="M6 42L6 48 44 48 44 42 38 42 38 45 12 45 12 42z"/>
                                    </svg>
                                    then "Add to Home Screen"
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
                                <div class="pwa-prompt-title">Install BuyBIBZ</div>
                                <div class="pwa-prompt-message">
                                    Open menu (⋮) and tap "Add to Home screen" or "Install app"
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
