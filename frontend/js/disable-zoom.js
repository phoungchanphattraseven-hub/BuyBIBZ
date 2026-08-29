/**
 * BuyBIBZ - Disable Zoom
 * Prevents all zoom methods to create native app-like experience
 */

(function() {
    'use strict';

    // Detect if device is mobile (not just touch-capable)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Only apply touch restrictions on actual mobile devices, not desktop with touch
    if (isMobile) {
        // Prevent pinch zoom
        document.addEventListener('touchstart', function(event) {
            if (event.touches.length > 1) {
                event.preventDefault();
            }
        }, { passive: false });

        // Prevent double-tap zoom
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // Prevent gesturestart, gesturechange, gestureend (iOS)
        document.addEventListener('gesturestart', function(event) {
            event.preventDefault();
        }, false);

        document.addEventListener('gesturechange', function(event) {
            event.preventDefault();
        }, false);

        document.addEventListener('gestureend', function(event) {
            event.preventDefault();
        }, false);

        // Force scale to 1 on orientation change
        window.addEventListener('orientationchange', function() {
            document.body.scrollTop = 0;
            const viewport = document.querySelector('meta[name=viewport]');
            if (viewport) {
                viewport.setAttribute('content', 
                    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
            }
        });

        // Prevent context menu on long press
        document.addEventListener('contextmenu', function(event) {
            event.preventDefault();
        }, false);
    }

    // Prevent zoom via keyboard shortcuts on all devices
    document.addEventListener('keydown', function(event) {
        if ((event.ctrlKey || event.metaKey) && 
            (event.key === '+' || event.key === '-' || event.key === '=' || event.key === '0')) {
            event.preventDefault();
        }
    }, false);

})();
