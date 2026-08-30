/**
 * BuyBIBZ — Mobile App-like Zoom Prevention
 * Disables pinch-to-zoom and gesture-based zooming on mobile browsers.
 */

(function disableZoom() {
    // 1. Prevent multi-touch pinch to zoom
    document.addEventListener('touchstart', function (event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, { passive: false });

    // 2. Prevent iOS Safari pinch gesture events
    document.addEventListener('gesturestart', function (event) {
        event.preventDefault();
    }, { passive: false });
})();
