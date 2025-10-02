// ==UserScript==
// @name         Apollo Cafe Image Upgrader
// @namespace    https://apollo.cafe/
// @version      1.0
// @description  Replace all imagedelivery.net URLs ending in /2x with /4x on apollo.cafe
// @match        https://apollo.cafe/*
// @match        http://apollo.cafe/*
// @icon         https://apollo.cafe/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to replace /2x -> /4x in all <img> tags
    function upgradeImages() {
        document.querySelectorAll('img[src*="imagedelivery.net"]').forEach(img => {
            img.src = img.src.replace(/\/2x$/, '/4x');
        });

        // Also replace inline HTML / CSS background URLs if needed
        document.querySelectorAll('[style*="imagedelivery.net"]').forEach(el => {
            el.style.backgroundImage = el.style.backgroundImage.replace(/\/2x(['"]?\)?$)/, '/4x$1');
        });
    }

    // Run once at page load
    upgradeImages();

    // Run again whenever DOM changes (for infinite scroll, SPA, etc.)
    const observer = new MutationObserver(() => upgradeImages());
    observer.observe(document.body, { childList: true, subtree: true });
})();
