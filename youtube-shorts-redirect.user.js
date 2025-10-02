// ==UserScript==
// @name         YouTube Shorts Redirect
// @namespace    https://github.com/ergosteur/misc-userscripts
// @author       ergosteur
// @version      0.1.1
// @description  Redirects YouTube Shorts links to the standard watch page.
// @author       You
// @match        https://www.youtube.com/shorts/*
// @grant        none
// @run-at       document-start
// @downloadURL  https://github.com/ergosteur/misc-userscripts/raw/refs/heads/main/youtube-shorts-redirect.user.js
// @updateURL    https://github.com/ergosteur/misc-userscripts/raw/refs/heads/main/youtube-shorts-redirect.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Get the current URL
    const currentUrl = window.location.href;

    // Check if the URL matches the Shorts pattern (e.g., https://www.youtube.com/shorts/v1de0id)
    if (currentUrl.includes('youtube.com/shorts/')) {
        // Extract the video ID, which is the part after the last '/'
        const videoId = currentUrl.substring(currentUrl.lastIndexOf('/') + 1);

        // Construct the new URL in the standard watch format
        const newUrl = 'https://www.youtube.com/watch?v=' + videoId;

        // Redirect the browser to the new URL
        window.location.replace(newUrl);
    }
})();