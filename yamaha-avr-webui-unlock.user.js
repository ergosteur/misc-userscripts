// ==UserScript==
// @name         Yamaha AVR Full UI Unlock
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Unlocks the full web UI for the Yamaha RX-V573 by spoofing the model name to a high-end model.
// @match        http://rx-v573.local/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Intercept the setter for the g_Info object to modify it as soon as it's created.
    Object.defineProperty(window, 'g_Info', {
        get: function() {
            return window._g_Info_Original;
        },
        set: function(value) {
            console.log('Tampermonkey: Intercepted g_Info setter. Original modelName is:', value.modelName);

            // Set the modelName to a high-end model for any basic checks.
            //value.modelName = 'RX-V3073';

            // Override ALL model-checking functions to always return true.
            // This is the most reliable way to unlock everything.
            value.blnModelTypeHigh = function() { return false; };
            value.blnModelType3073 = function() { return false; };
            value.blnModelType820 = function() { return false; };
            value.blnModelType673 = function() { return false; };
            value.blnModelTypeUnder573 = function() { return true; };

            // This is the function you found that works. Override it for good measure.
            value.blnOnlyFriendlyNameAvail = function() { return false; };

            // Also override the HDMI and Zone checks to ensure the UI displays those controls.
            //value.m_blnHasHdmi = true;
            //value.m_blnZone2 = true;
            //value.m_blnZone3 = true;
            //value.m_blnZone4 = true;

            //console.log('Tampermonkey: All model type checks have been spoofed to return true.');

            // Store the modified object for the rest of the script to use.
            window._g_Info_Original = value;
        },
        configurable: true
    });
})();