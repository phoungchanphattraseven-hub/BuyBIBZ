/**
 * BuyBIBZ - Disable Zoom
 * Prevents all zoom methods to create native app-like experience
 */

(function() {
    'use strict';

    // Detect if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Prevent pinch zoom (mobile only)
    if (isTouch) {
        document.addEventListener('touchstart', function(event) {
            if (event.touches.length > 1) {
                event.preventDefault();
            }
        }, { passive: false });

        // Prevent double-tap zoom (mobile only)
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    // Prevent zoom via keyboard shortcuts (Ctrl+/Cmd+ and Ctrl-/Cmd-)
    document.addEventListener('keydown', function(event) {
        if ((event.ctrlKey || event.metaKey) && 
            (event.key === '+' || event.key === '-' || event.key === '=' || event.key === '0')) {
            event.preventDefault();
        }
    }, false);

    // Note: Mouse wheel zoom prevention removed to allow normal scrolling
    // Zoom via Ctrl+Wheel is already prevented by viewport meta tag with user-scalable=no

    // Prevent gesturestart, gesturechange, gestureend (iOS only)
    if (isMobile) {
        document.addEventListener('gesturestart', function(event) {
            event.preventDefault();
        }, false);

        document.addEventListener('gesturechange', function(event) {
            event.preventDefault();
        }, false);

        document.addEventListener('gestureend', function(event) {
            event.preventDefault();
        }, false);

        // Force scale to 1 on orientation change (mobile only)
        window.addEventListener('orientationchange', function() {
            document.body.scrollTop = 0;
            const viewport = document.querySelector('meta[name=viewport]');
            if (viewport) {
                viewport.setAttribute('content', 
                    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
            }
        });

        // Prevent context menu on long press (mobile only)
        document.addEventListener('contextmenu', function(event) {
            event.preventDefault();
        }, false);
    }

    // Disable text selection on touch (optional - makes it feel more app-like)
    // Uncomment if you want to prevent text selection
    /*
    document.addEventListener('selectstart', function(event) {
        if (event.target.tagName !== 'INPUT' && 
            event.target.tagName !== 'TEXTAREA') {
            event.preventDefault();
        }
    }, false);
    */

})();
