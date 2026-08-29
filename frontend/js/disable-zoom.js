/**
 * BuyBIBZ - Minimal Zoom Prevention
 * CSS handles most zoom prevention, this just handles keyboard shortcuts
 */

(function() {
    'use strict';

    // Only prevent keyboard zoom shortcuts
    // Everything else (touch, gestures, wheel) is handled by CSS and viewport meta
    document.addEventListener('keydown', function(event) {
        // Prevent Ctrl/Cmd + Plus/Minus/0 for zoom
        if ((event.ctrlKey || event.metaKey) && 
            (event.key === '+' || event.key === '-' || event.key === '=' || event.key === '0')) {
            event.preventDefault();
        }
    }, false);

    // That's it! Minimal and non-invasive
    // Scrolling works normally everywhere

})();
