// ==UserScript==
// @name         Expand t.co links (live replace, Location header fixed)
// @namespace    ergosteur
// @version      0.7
// @description  Expand t.co shortlinks into final URLs by parsing Location header
// @match        https://twitter.com/*
// @match        https://x.com/*
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    function showTextareaDialog(title, callback) {
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.background = "rgba(0,0,0,0.7)";
        overlay.style.zIndex = 999999;

        const box = document.createElement("div");
        box.style.position = "absolute";
        box.style.top = "50%";
        box.style.left = "50%";
        box.style.transform = "translate(-50%, -50%)";
        box.style.background = "#fff";
        box.style.padding = "20px";
        box.style.borderRadius = "8px";
        box.style.maxWidth = "600px";
        box.style.width = "80%";
        box.style.display = "flex";
        box.style.flexDirection = "column";

        const label = document.createElement("div");
        label.textContent = title;
        label.style.marginBottom = "8px";

        const textarea = document.createElement("textarea");
        textarea.style.width = "100%";
        textarea.style.height = "300px";
        textarea.style.whiteSpace = "pre";

        const controls = document.createElement("div");
        controls.style.marginTop = "8px";
        controls.style.display = "flex";
        controls.style.justifyContent = "space-between";
        controls.style.alignItems = "center";

        const button = document.createElement("button");
        button.textContent = "Expand";

        const status = document.createElement("div");
        status.textContent = "Ready.";

        controls.appendChild(button);
        controls.appendChild(status);

        box.appendChild(label);
        box.appendChild(textarea);
        box.appendChild(controls);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        button.onclick = () => {
            const val = textarea.value.trim();
            if (!val) {
                overlay.remove();
                return;
            }
            callback(textarea, status);
        };
    }

    function expandOne(link) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: "GET",          // GET is safer than HEAD for t.co
                url: link,
                redirect: "manual",     // we want the Location header
                onload: (resp) => {
                    let out = link;

                    // responseHeaders is a string in Tampermonkey
                    const headers = resp.responseHeaders.split(/\r?\n/);
                    const locLine = headers.find(h => /^location:/i.test(h));
                    if (locLine) {
                        out = locLine.split(/:\s*/i)[1].trim();
                    }

                    resolve(out);
                },
                onerror: () => resolve(link)
            });
        });
    }

    async function expandLinks() {
        showTextareaDialog("Paste t.co links (one per line):", async (textarea, status) => {
            let lines = textarea.value.split(/\r?\n/);
            const total = lines.length;

            for (let i = 0; i < total; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                status.textContent = `Expanding ${i + 1}/${total}...`;
                const full = await expandOne(line);

                lines[i] = full;
                textarea.value = lines.join("\n");

                textarea.scrollTop = textarea.scrollHeight; // auto-scroll
            }

            status.textContent = `Done! Expanded ${total} links.`;

            const blob = new Blob([lines.join("\n")], {type: "text/plain"});
            const url = URL.createObjectURL(blob);

            const dl = document.createElement("a");
            dl.href = url;
            dl.download = "expanded_links.txt";
            dl.textContent = "⬇ Download results";
            dl.style.marginLeft = "10px";

            status.appendChild(dl);
        });
    }

    GM_registerMenuCommand("Expand t.co Links", expandLinks);
})();