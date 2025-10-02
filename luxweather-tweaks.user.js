// ==UserScript==
// @name         LuxWeather Frame & Scale Toggle (Settings Integration)
// @namespace    https://github.com/ergosteur/misc-userscripts
// @author       ergosteur
// @version      1.8.1
// @description  Toggle CRT frame and scaling (Off, Default, 4:3, 16:9, Stretch) via settings panel with localStorage + keyboard shortcuts
// @match        https://luxweather.com/*
// @run-at       document-idle
// @downloadURL  https://github.com/ergosteur/misc-userscripts/raw/refs/heads/main/luxweather-tweaks.user.js
// @updateURL    https://github.com/ergosteur/misc-userscripts/raw/refs/heads/main/luxweather-tweaks.user.js
// ==/UserScript==

(function () {
  const LS_KEY_FRAME = 'luxweather-frame-on';
  const LS_KEY_SCALE = 'luxweather-scale-mode';

  let frameOn = localStorage.getItem(LS_KEY_FRAME) !== 'false';
  let scaleMode = parseInt(localStorage.getItem(LS_KEY_SCALE) || '0');

  const style = document.createElement('style');
  style.innerHTML = `
    .no-frame .tv--kitty::after,
    .no-frame .tv--regular::after,
    .no-frame .tv--apple::after {
      background-image: none !important;
    }

    .scale-default .tv {
      --width: 360;
      --height: 270;
    }
    .scale-default .tv--kitty .tv-screen,
    .scale-default .tv--regular .tv-screen,
    .scale-default .tv--apple .tv-screen {
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: calc((360 / var(--width)) * 100%);
      height: calc((270 / var(--height)) * 100%);
    }

    .scale-fit .tv,
    .scale-stretch .tv {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 100vw !important;
      height: 100vh !important;
      margin: 0 !important;
      padding: 0 !important;
      background: none !important;
    }

    .scale-fit .tv-screen,
    .scale-stretch .tv-screen {
      position: relative !important;
      background: none !important;
      top: unset !important;
      left: unset !important;
      transform: none !important;
    }

    .scale-fit .tv-screen {
      width: 100vw;
      height: auto;
    }

    .scale-4-3 .tv-screen {
      aspect-ratio: 4 / 3;
      max-height: 100vh;
      max-width: calc(100vh * (4 / 3));
    }

    .scale-16-9 .tv-screen {
      aspect-ratio: 16 / 9;
      max-height: 100vh;
      max-width: calc(100vh * (16 / 9));
    }

    .scale-stretch .tv-screen {
      width: 100vw !important;
      height: 100vh !important;
      object-fit: fill !important;
    }
  `;
  document.head.appendChild(style);

  function applyState() {
    document.body.classList.toggle('no-frame', !frameOn);

    document.body.classList.remove(
      'scale-default',
      'scale-fit',
      'scale-4-3',
      'scale-16-9',
      'scale-stretch'
    );

    switch (scaleMode) {
      case 1:
        document.body.classList.add('scale-default'); break;
      case 2:
        document.body.classList.add('scale-fit', 'scale-4-3'); break;
      case 3:
        document.body.classList.add('scale-fit', 'scale-16-9'); break;
      case 4:
        document.body.classList.add('scale-stretch'); break;
    }

    localStorage.setItem(LS_KEY_FRAME, frameOn);
    localStorage.setItem(LS_KEY_SCALE, scaleMode);
  }

  function injectSettingsToggles() {
    const settings = document.getElementById('settings_menu');
    if (!settings || settings.querySelector('#toggle_frame')) return;

    const group = document.createElement('div');
    group.className = 'settings_group';
    group.innerHTML = `
      <div class="settings_label">Custom Display</div>
      <div class="settings_options">
        <label><input type="checkbox" id="toggle_frame"> Bezel</label>
        <br>
        <label>Scale:
          <select id="toggle_scale">
            <option value="0">Off</option>
            <option value="1">Default</option>
            <option value="2">Fit 4:3</option>
            <option value="3">Fit 16:9</option>
            <option value="4">Stretch</option>
          </select>
        </label>
      </div>
    `;
    settings.appendChild(group);

    const frameCheckbox = document.getElementById('toggle_frame');
    const scaleSelect = document.getElementById('toggle_scale');

    frameCheckbox.checked = frameOn;
    scaleSelect.value = scaleMode;

    frameCheckbox.addEventListener('change', () => {
      frameOn = frameCheckbox.checked;
      applyState();
    });

    scaleSelect.addEventListener('change', () => {
      scaleMode = parseInt(scaleSelect.value);
      applyState();
    });
  }

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.altKey && e.key === 'f') {
      frameOn = !frameOn;
      applyState();
    } else if (e.altKey && e.key === 's') {
      scaleMode = (scaleMode + 1) % 5;
      applyState();
    }
  });

  applyState();

  const observeSettings = new MutationObserver(() => {
    setTimeout(injectSettingsToggles, 50);
});

  const interval = setInterval(() => {
    const settings = document.getElementById('settings_menu');
    if (settings) {
      clearInterval(interval);
      injectSettingsToggles();
      observeSettings.observe(document.body, { childList: true, subtree: true });
    }
  }, 300);
})();
