// ==UserScript==
// @name         Extract Links from Twitter/X (Configurable Pattern)
// @namespace    https://github.com/ergosteur/misc-userscripts
// @author       ergosteur
// @version      1.6
// @description  Scroll Twitter/X, handle lazy loading, extract links matching a pattern (default: drive.google.com)
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        none
// @downloadURL  https://github.com/ergosteur/misc-userscripts/raw/refs/heads/main/lazyload-twitter-link-collector.user.js
// ==/UserScript==

(function() {
    'use strict';

    const found = new Set();

    // 🔧 Default pattern (can be changed in overlay)
    let linkPattern = "drive.google.com";

    function extractLinks() {
        document.querySelectorAll('a[href^="https://t.co/"]').forEach(a => {
            const text = a.textContent || "";
            if (text.includes(linkPattern)) {
                if (!found.has(a.href)) {
                    found.add(a.href);
                    console.log("Found:", a.href, "->", text.trim());
                }
            }
        });
    }

    async function autoScrollAndExtract() {
        let lastHeight = 0;
        while (true) {
            extractLinks();
            window.scrollTo(0, document.body.scrollHeight);
            await new Promise(r => setTimeout(r, 1500));
            let newHeight = document.body.scrollHeight;
            if (newHeight === lastHeight) break;
            lastHeight = newHeight;
        }
        showResults([...found]);
    }

    function showResults(links) {
        // Remove previous overlay if it exists
        const oldBox = document.getElementById("extract-box");
        if (oldBox) oldBox.remove();

        const container = document.createElement("div");
        container.id = "extract-box";
        container.style.position = "fixed";
        container.style.top = "60px";
        container.style.right = "20px";
        container.style.width = "420px";
        container.style.zIndex = "999999";
        container.style.background = "white";
        container.style.border = "2px solid black";
        container.style.padding = "10px";
        container.style.fontSize = "12px";

        // Pattern input
        const patternLabel = document.createElement("div");
        patternLabel.innerText = "Link pattern:";
        patternLabel.style.marginBottom = "4px";

        const patternInput = document.createElement("input");
        patternInput.type = "text";
        patternInput.value = linkPattern;
        patternInput.style.width = "100%";
        patternInput.style.marginBottom = "8px";
        patternInput.onchange = () => {
            linkPattern = patternInput.value.trim();
            alert(`🔍 Pattern updated to: ${linkPattern}`);
        };

        // Textarea for results
        const box = document.createElement("textarea");
        box.value = links.join("\n");
        box.style.width = "100%";
        box.style.height = "200px";
        box.style.marginBottom = "8px";

        // Download button
        const downloadBtn = document.createElement("button");
        downloadBtn.innerText = "⬇ Download .txt";
        downloadBtn.style.background = "#1da1f2";
        downloadBtn.style.color = "white";
        downloadBtn.style.border = "none";
        downloadBtn.style.padding = "6px 10px";
        downloadBtn.style.borderRadius = "4px";
        downloadBtn.style.cursor = "pointer";
        downloadBtn.style.marginRight = "8px";

        downloadBtn.onclick = () => {
            const blob = new Blob([links.join("\n")], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "extracted_links.txt";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };

        // Close button
        const closeBtn = document.createElement("button");
        closeBtn.innerText = "❌ Close";
        closeBtn.style.background = "#aaa";
        closeBtn.style.color = "white";
        closeBtn.style.border = "none";
        closeBtn.style.padding = "6px 10px";
        closeBtn.style.borderRadius = "4px";
        closeBtn.style.cursor = "pointer";

        closeBtn.onclick = () => container.remove();

        container.appendChild(patternLabel);
        container.appendChild(patternInput);
        container.appendChild(box);
        container.appendChild(downloadBtn);
        container.appendChild(closeBtn);

        document.body.appendChild(container);

        alert(`✅ Extracted ${links.length} links (pattern: ${linkPattern}). See the overlay box (top-right).`);
    }

    function addButton() {
        if (document.getElementById("extract-btn")) return; // already added
        const btn = document.createElement("button");
        btn.id = "extract-btn";
        btn.innerText = "Extract Links";
        btn.style.position = "fixed";
        btn.style.top = "20px";
        btn.style.right = "20px";
        btn.style.zIndex = "999999";
        btn.style.background = "#1da1f2";
        btn.style.color = "white";
        btn.style.border = "none";
        btn.style.padding = "8px 12px";
        btn.style.borderRadius = "4px";
        btn.style.cursor = "pointer";
        btn.style.fontSize = "14px";
        btn.onclick = autoScrollAndExtract;
        document.body.appendChild(btn);
    }

    // Keep checking every 2s in case SPA reloads
    setInterval(addButton, 2000);
})();