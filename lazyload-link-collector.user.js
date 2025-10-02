// ==UserScript==
// @name         Extract Links (Universal, Configurable Patterns)
// @namespace    https://github.com/ergosteur/misc-userscripts
// @author       ergosteur
// @version      2.9.1
// @description  Universal lazy-scroll link extractor with config, HUD, stop button, and Tampermonkey menu
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @downloadURL  https://github.com/ergosteur/misc-userscripts/raw/refs/heads/main/lazyload-link-collector.user.js
// ==/UserScript==

(function () {
  'use strict';

  const found = new Set();

  // 🔧 Defaults + persisted settings
  let hrefPattern = localStorage.hrefPattern || "https://t.co/";
  let textPattern = localStorage.textPattern || "drive.google.com";
  let useHrefPattern = localStorage.useHrefPattern !== "false"; // default true
  let useTextPattern = localStorage.useTextPattern !== "false"; // default true
  let maxScrolls = parseInt(localStorage.maxScrolls || "0", 10); // 0 = unlimited
  let autoShowButton = localStorage.autoShowButton === "true"; // default false

  // Scrolling behavior
  const STEP_FRACTION = 0.9;
  const SCROLL_DELAY_MS = 700;
  const SETTLE_DELAY_MS = 800;
  const STALL_LIMIT = 8;
  const HARD_CAP = 2000;

  // Progress HUD
  let progressEl = null;
  let stopFlag = false;

  function showProgress() {
    if (!progressEl) {
      progressEl = document.createElement("div");
      Object.assign(progressEl.style, {
        position: "fixed",
        top: "20px",
        left: "20px",
        zIndex: "1000000",
        background: "rgba(0,0,0,0.7)",
        color: "white",
        padding: "6px 10px",
        borderRadius: "4px",
        fontSize: "13px",
        fontFamily: "monospace",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      });

      const label = document.createElement("span");
      label.id = "progress-label";
      progressEl.appendChild(label);

      const stopBtn = document.createElement("button");
      stopBtn.innerText = "⏹ Stop";
      Object.assign(stopBtn.style, {
        background: "#d9534f",
        color: "white",
        border: "none",
        padding: "2px 6px",
        borderRadius: "3px",
        cursor: "pointer",
        fontSize: "12px"
      });
      stopBtn.onclick = () => { stopFlag = true; };
      progressEl.appendChild(stopBtn);

      document.body.appendChild(progressEl);
    }
  }

  function updateProgress(rounds) {
    const spinner = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"][rounds % 10];
    const label = document.getElementById("progress-label");
    if (label) {
      label.textContent = `${spinner} Rounds: ${rounds} | Links: ${found.size}`;
    }
  }

  function hideProgress() {
    if (progressEl) { progressEl.remove(); progressEl = null; }
  }

  function extractLinks() {
    document.querySelectorAll("a").forEach(a => {
      const href = a.href || "";
      const text = a.textContent || "";
      const hrefOk = !useHrefPattern || (hrefPattern && href.includes(hrefPattern));
      const textOk = !useTextPattern || (textPattern && text.includes(textPattern));
      if (hrefOk && textOk && href) {
        if (!found.has(href)) {
          found.add(href);
        }
      }
    });
  }

  async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function scrollToTopAndSettle() {
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    html.style.scrollBehavior = prev || "";
    const t0 = performance.now();
    while (window.scrollY !== 0 && performance.now() - t0 < 1500) {
      await wait(50);
    }
    await wait(SETTLE_DELAY_MS);
  }

  async function autoScrollAndExtract() {
    found.clear();
    stopFlag = false;

    await scrollToTopAndSettle();
    showProgress();

    const scroller = document.scrollingElement || document.documentElement;
    let lastHeight = scroller.scrollHeight;
    let lastFound = 0;
    let rounds = 0;
    let stall = 0;

    while (!stopFlag && rounds < HARD_CAP) {
      rounds++;
      const step = Math.max(64, Math.floor(window.innerHeight * STEP_FRACTION));
      window.scrollBy(0, step);
      await wait(SCROLL_DELAY_MS);

      extractLinks();
      updateProgress(rounds);

      const newHeight = scroller.scrollHeight;
      const atBottom = (scroller.scrollTop + window.innerHeight + 2) >= newHeight;
      const heightGrew = newHeight > lastHeight + 2;
      const foundGrew = found.size > lastFound;

      if (heightGrew || foundGrew || !atBottom) stall = 0;
      else stall++;

      lastHeight = newHeight;
      lastFound = found.size;

      if ((maxScrolls > 0 && rounds >= maxScrolls) || (atBottom && stall >= STALL_LIMIT)) {
        break;
      }
    }

    hideProgress();
    showOverlay([...found], false);
  }

  function showOverlay(links, configOnly = false) {
    const old = document.getElementById("extract-box");
    if (old) old.remove();

    const container = document.createElement("div");
    container.id = "extract-box";
    Object.assign(container.style, {
      position: "fixed",
      top: "60px",
      right: "20px",
      width: "480px",
      zIndex: "999999",
      background: "white",
      border: "2px solid black",
      padding: "10px",
      fontSize: "12px"
    });

    // Href config
    const hrefRow = document.createElement("div");
    const hrefChk = document.createElement("input");
    hrefChk.type = "checkbox";
    hrefChk.checked = useHrefPattern;
    hrefChk.onchange = () => {
      useHrefPattern = hrefChk.checked;
      localStorage.useHrefPattern = useHrefPattern;
    };
    const hrefLbl = document.createElement("label");
    hrefLbl.innerText = " Href pattern:";
    const hrefInp = document.createElement("input");
    hrefInp.type = "text";
    hrefInp.value = hrefPattern;
    Object.assign(hrefInp.style, { width: "70%", marginLeft: "6px" });
    hrefInp.onchange = () => {
      hrefPattern = hrefInp.value.trim();
      localStorage.hrefPattern = hrefPattern;
    };
    hrefRow.append(hrefChk, hrefLbl, hrefInp);

    // Text config
    const textRow = document.createElement("div");
    const textChk = document.createElement("input");
    textChk.type = "checkbox";
    textChk.checked = useTextPattern;
    textChk.onchange = () => {
      useTextPattern = textChk.checked;
      localStorage.useTextPattern = useTextPattern;
    };
    const textLbl = document.createElement("label");
    textLbl.innerText = " Text pattern:";
    const textInp = document.createElement("input");
    textInp.type = "text";
    textInp.value = textPattern;
    Object.assign(textInp.style, { width: "70%", marginLeft: "6px" });
    textInp.onchange = () => {
      textPattern = textInp.value.trim();
      localStorage.textPattern = textPattern;
    };
    textRow.append(textChk, textLbl, textInp);

    // Max scroll config
    const maxRow = document.createElement("div");
    const maxLbl = document.createElement("label");
    maxLbl.innerText = " Max scrolls (0 = unlimited):";
    const maxInp = document.createElement("input");
    maxInp.type = "number";
    maxInp.min = "0";
    maxInp.value = maxScrolls;
    Object.assign(maxInp.style, { width: "60px", marginLeft: "6px" });
    maxInp.onchange = () => {
      maxScrolls = parseInt(maxInp.value, 10) || 0;
      localStorage.maxScrolls = maxScrolls;
    };
    maxRow.append(maxLbl, maxInp);

    // Auto show button config
    const autoRow = document.createElement("div");
    const autoChk = document.createElement("input");
    autoChk.type = "checkbox";
    autoChk.checked = autoShowButton;
    autoChk.onchange = () => {
      autoShowButton = autoChk.checked;
      localStorage.autoShowButton = autoShowButton;
    };
    const autoLbl = document.createElement("label");
    autoLbl.innerText = " Show floating button automatically";
    autoRow.append(autoChk, autoLbl);

    container.append(hrefRow, textRow, maxRow, autoRow);

    if (!useHrefPattern && !useTextPattern) {
      const warn = document.createElement("div");
      warn.textContent = "⚠ Warning: Both filters are off. All links will be collected.";
      Object.assign(warn.style, { color: "red", margin: "6px 0" });
      container.appendChild(warn);
    }

    if (!configOnly) {
      const box = document.createElement("textarea");
      box.value = links.join("\n");
      Object.assign(box.style, { width: "100%", height: "200px", margin: "8px 0" });
      container.appendChild(box);

      const dl = document.createElement("button");
      dl.innerText = "⬇ Download .txt";
      Object.assign(dl.style, {
        background: "#1da1f2", color: "white", border: "none",
        padding: "6px 10px", borderRadius: "4px", cursor: "pointer", marginRight: "8px"
      });
      dl.onclick = () => {
        const blob = new Blob([links.join("\n")], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "extracted_links.txt";
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
      };
      container.appendChild(dl);
    }

    // Start + Close
    const start = document.createElement("button");
    start.innerText = "▶ Start";
    Object.assign(start.style, {
      background: "#1da1f2", color: "white", border: "none",
      padding: "6px 10px", borderRadius: "4px", cursor: "pointer", marginRight: "8px"
    });
    start.onclick = () => { container.remove(); autoScrollAndExtract(); };

    const close = document.createElement("button");
    close.innerText = "❌ Close";
    Object.assign(close.style, {
      background: "#aaa", color: "white", border: "none",
      padding: "6px 10px", borderRadius: "4px", cursor: "pointer"
    });
    close.onclick = () => container.remove();

    container.append(start, close);
    document.body.appendChild(container);

    if (!configOnly) {
      alert(`✅ Extracted ${links.length} links (href: ${useHrefPattern ? hrefPattern : "ANY"}, text: ${useTextPattern ? textPattern : "ANY"}).`);
    }
  }

  function addSplitButton() {
    if (document.getElementById("extract-btn")) return;

    const wrap = document.createElement("div");
    wrap.id = "extract-btn";
    Object.assign(wrap.style, {
      position: "fixed", top: "20px", right: "20px", zIndex: "999999",
      display: "flex", borderRadius: "4px", overflow: "hidden",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
    });

    const mainBtn = document.createElement("button");
    mainBtn.innerText = "Extract Links";
    Object.assign(mainBtn.style, {
      background: "#1da1f2", color: "white", border: "none",
      padding: "8px 12px", cursor: "pointer", fontSize: "14px", flex: "1"
    });
    mainBtn.onclick = autoScrollAndExtract;

    const cfgBtn = document.createElement("button");
    cfgBtn.innerText = "⛭";
    Object.assign(cfgBtn.style, {
      background: "#0d8ddb", color: "white", border: "none",
      padding: "8px 10px", cursor: "pointer", fontSize: "14px", width: "40px"
    });
    cfgBtn.onclick = () => showOverlay([], true);

    wrap.append(mainBtn, cfgBtn);
    document.body.appendChild(wrap);
  }

  // Tampermonkey menu items
  if (typeof GM_registerMenuCommand !== "undefined") {
    GM_registerMenuCommand("Show Button", addSplitButton);
    GM_registerMenuCommand("Extract Links", autoScrollAndExtract);
    GM_registerMenuCommand("Config", () => showOverlay([], true));
  }

  // Auto-show only if enabled
  if (autoShowButton) {
    setInterval(addSplitButton, 2000);
  }
})();