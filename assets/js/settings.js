//Settings.js - Gerencia as configurações de acessibilidade do jogo, como tamanho da fonte, modo de cor e volume da música.

// ═══════════════════════════════════════════════════
//  js/settings.js  –  Configurações de acessibilidade
// ═══════════════════════════════════════════════════=
window.Settings = {
  data: {
    fontScale: 1,
    colorMode: 'normal',
    volume: 0.4,
    autoShoot: true
  },

  fontObserver: null,

  init() {
    this.load();
    this.createModal();
    this.injectButtons();
    this.apply();
    this.observeFontChanges();
  },

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem('pgalaxy-settings'));
      if (saved) this.data = { ...this.data, ...saved };
    } catch (e) {}
  },

  save() {
    localStorage.setItem('pgalaxy-settings', JSON.stringify(this.data));
  },

  apply() {
    this.applyGlobalFontSize();
    this.applyColorMode();
    this.applyVolume();
    this.save();
  },

  applyGlobalFontSize() {
    const scale = Number(this.data.fontScale) || 1;

    document.documentElement.style.setProperty('--font-scale', scale);

    const elements = document.querySelectorAll('body *');

    elements.forEach((el) => {
      if (
        el.closest('#settings-modal') ||
        el.classList.contains('settings-btn') ||
        el.tagName === 'SCRIPT' ||
        el.tagName === 'STYLE'
      ) {
        return;
      }

      const computed = window.getComputedStyle(el);
      const computedFont = parseFloat(computed.fontSize);

      if (!computedFont || Number.isNaN(computedFont)) return;

      if (!el.dataset.baseFontSize) {
        el.dataset.baseFontSize = computedFont;
      }

      const baseFontSize = parseFloat(el.dataset.baseFontSize);

      el.style.setProperty(
        'font-size',
        `${baseFontSize * scale}px`,
        'important'
      );
    });
  },

  observeFontChanges() {
    if (this.fontObserver) this.fontObserver.disconnect();

    this.fontObserver = new MutationObserver(() => {
      clearTimeout(this._fontTimeout);

      this._fontTimeout = setTimeout(() => {
        this.applyGlobalFontSize();
      }, 50);
    });

    this.fontObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  },

  applyColorMode() {
    document.body.classList.remove(
      'daltonism-protanopia',
      'daltonism-deuteranopia',
      'daltonism-tritanopia'
    );

    if (this.data.colorMode !== 'normal') {
      document.body.classList.add('daltonism-' + this.data.colorMode);
    }
  },

  applyVolume() {
    const bgm = document.getElementById('bg-music');

    if (bgm) {
      bgm.volume = Number(this.data.volume);
    }
  },

  injectButtons() {
    document.querySelectorAll('.settings-btn').forEach(btn => btn.remove());

    document.querySelectorAll('.screen').forEach(screen => {
      const btn = document.createElement('button');
      btn.className = 'settings-btn';
      btn.type = 'button';
      btn.innerHTML = '⚙️';
      btn.setAttribute('aria-label', 'Abrir configurações de acessibilidade');
      btn.onclick = () => this.open();

      screen.appendChild(btn);
    });
  },

  createModal() {
    if (document.getElementById('settings-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'settings-modal';
    modal.className = 'hidden';

    modal.innerHTML = `
      <div class="settings-box" role="dialog" aria-modal="true" aria-label="Configurações de acessibilidade">
        <div class="settings-header">
          <h2>⚙️ Acessibilidade</h2>
          <button id="close-settings" type="button" aria-label="Fechar configurações">✕</button>
        </div>

        <label for="font-scale">🔠 Tamanho da Fonte</label>
        <input
          id="font-scale"
          type="range"
          min="0.8"
          max="1.8"
          step="0.1"
          value="${this.data.fontScale}"
        />

        <label for="color-mode">🎨 Daltonismo</label>
        <select id="color-mode">
          <option value="normal">Normal</option>
          <option value="protanopia">Protanopia</option>
          <option value="deuteranopia">Deuteranopia</option>
          <option value="tritanopia">Tritanopia</option>
        </select>

        <label for="music-volume">🔊 Volume da Música</label>
        <input
          id="music-volume"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value="${this.data.volume}"
        />

        <label class="toggle-row" for="auto-shoot">
          <span>🚀 Auto tiro no Boss</span>
          <input id="auto-shoot" type="checkbox" ${this.data.autoShoot ? 'checked' : ''} />
        </label>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('close-settings').onclick = () => this.close();

    document.getElementById('font-scale').oninput = (e) => {
      this.data.fontScale = Number(e.target.value);
      this.apply();
    };

    document.getElementById('color-mode').value = this.data.colorMode;

    document.getElementById('color-mode').onchange = (e) => {
      this.data.colorMode = e.target.value;
      this.apply();
    };

    document.getElementById('music-volume').oninput = (e) => {
      this.data.volume = Number(e.target.value);
      this.apply();
    };

    document.getElementById('auto-shoot').onchange = (e) => {
      this.data.autoShoot = e.target.checked;
      this.apply();
    };
  },

  open() {
    document.getElementById('settings-modal').classList.remove('hidden');
  },

  close() {
    document.getElementById('settings-modal').classList.add('hidden');
  }
};

window.addEventListener('DOMContentLoaded', () => {
  Settings.init();
});
