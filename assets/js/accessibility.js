// ═══════════════════════════════════════════════════
//  js/accessibility.js – Acessibilidade via teclado
//  - Tab/Enter/Setas para navegação e ativação
//  - Fase 1: Selecionar Dado → Selecionar Destino
//  - Anéis de foco visuais
// ═══════════════════════════════════════════════════

const A11y = {
  keyboardMode: false,
  selectedPacketId: null,
  selectedPacketType: null,
  lastFocused: null,

  init() {
    this.injectStyles();
    this.createLiveRegion();
    this.bindGlobalKeyboard();
    this.refresh();
  },

  injectStyles() {
    if (document.getElementById('a11y-keyboard-style')) return;

    const style = document.createElement('style');
    style.id = 'a11y-keyboard-style';
    style.textContent = `
      :root {
        --a11y-focus: #ffd700;
        --a11y-focus-bg: rgba(255, 215, 0, .12);
      }

      body.keyboard-mode button:focus,
      body.keyboard-mode [role="button"]:focus,
      body.keyboard-mode [tabindex]:focus,
      body.keyboard-mode .data-bin:focus,
      body.keyboard-mode .data-packet-wrapper:focus,
      body.keyboard-mode .threat-node:focus,
      body.keyboard-mode #boss-entity:focus {
        outline: 4px solid var(--a11y-focus) !important;
        outline-offset: 5px !important;
        box-shadow:
          0 0 0 2px rgba(0,0,0,.85),
          0 0 24px rgba(255,215,0,.78) !important;
        border-radius: 16px !important;
      }

      body.keyboard-mode .data-packet-wrapper.a11y-selected,
      body.keyboard-mode .data-packet-card.a11y-selected {
        outline: 4px solid #69ff47 !important;
        outline-offset: 7px !important;
        box-shadow:
          0 0 0 2px rgba(0,0,0,.9),
          0 0 28px rgba(105,255,71,.9) !important;
        transform: scale(1.08);
      }

      body.keyboard-mode .data-bin.a11y-drop-target {
        outline: 4px dashed var(--a11y-focus) !important;
        outline-offset: 6px !important;
        box-shadow:
          0 0 0 2px rgba(0,0,0,.85),
          0 0 24px rgba(255,215,0,.75),
          inset 0 0 20px rgba(255,215,0,.14) !important;
      }

      .a11y-help {
        position: absolute;
        left: 50%;
        top: 38px;
        transform: translateX(-50%);
        z-index: 20;
        padding: 6px 12px;
        border-radius: 10px;
        border: 1px solid rgba(255,215,0,.35);
        background: rgba(3, 6, 15, .76);
        color: #ffd700;
        font-size: 10px;
        text-align: center;
        pointer-events: none;
        white-space: nowrap;
        backdrop-filter: blur(8px);
      }

      .a11y-sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }

      @media (max-width: 768px) {
        .a11y-help {
          top: 62px;
          max-width: 92vw;
          white-space: normal;
          font-size: 9px;
        }
      }
    `;

    document.head.appendChild(style);
  },

  createLiveRegion() {
    if (document.getElementById('aria-live-region')) return;

    const region = document.createElement('div');
    region.id = 'aria-live-region';
    region.className = 'a11y-sr-only';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    document.body.appendChild(region);
  },

  announce(message, priority = 'polite') {
    const region = document.getElementById('aria-live-region');
    if (!region) return;

    region.setAttribute('aria-live', priority);
    region.textContent = '';

    setTimeout(() => {
      region.textContent = message;
    }, 20);
  },

  bindGlobalKeyboard() {
    document.addEventListener('keydown', (event) => {
      const key = event.key;

      if (['Tab', 'Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        this.enableKeyboardMode();
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        const moved = this.moveFocusByArrow(key);
        if (moved) event.preventDefault();
      }

      if (key === 'Escape') {
        this.clearPacketSelection();
      }
    }, true);

    document.addEventListener('mousedown', () => this.disableKeyboardMode(), true);
    document.addEventListener('touchstart', () => this.disableKeyboardMode(), true);

    document.addEventListener('focusin', (event) => {
      this.lastFocused = event.target;
    });
  },

  enableKeyboardMode() {
    this.keyboardMode = true;
    document.body.classList.add('keyboard-mode');
  },

  disableKeyboardMode() {
    this.keyboardMode = false;
    document.body.classList.remove('keyboard-mode');
  },

  refresh() {
    this.makeStaticControlsAccessible();

    setTimeout(() => {
      this.makeStaticControlsAccessible();
    }, 100);
  },

  makeStaticControlsAccessible() {
    document.querySelectorAll('button').forEach((btn) => {
      if (!btn.hasAttribute('tabindex')) btn.setAttribute('tabindex', '0');
    });

    document.querySelectorAll('.btn').forEach((btn) => {
      if (btn.tagName !== 'BUTTON') {
        btn.setAttribute('role', 'button');
        btn.setAttribute('tabindex', '0');
      }
    });
  },

  getFocusableElements() {
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[href]',
      '[role="button"][tabindex="0"]',
      '[data-a11y-interactive="true"][tabindex="0"]',
      '[tabindex="0"]'
    ].join(',');

    return Array.from(document.querySelectorAll(selector))
      .filter((el) => this.isVisible(el) && !el.closest('.hidden'));
  },

  isVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      style.opacity !== '0'
    );
  },

  moveFocusByArrow(key) {
    const current = document.activeElement;
    const items = this.getFocusableElements();

    if (!items.length) return false;

    if (!current || current === document.body || !items.includes(current)) {
      items[0].focus();
      return true;
    }

    const currentRect = current.getBoundingClientRect();
    const cx = currentRect.left + currentRect.width / 2;
    const cy = currentRect.top + currentRect.height / 2;

    const dir = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 }
    }[key];

    let best = null;
    let bestScore = Infinity;

    items.forEach((el) => {
      if (el === current) return;

      const rect = el.getBoundingClientRect();
      const ex = rect.left + rect.width / 2;
      const ey = rect.top + rect.height / 2;
      const dx = ex - cx;
      const dy = ey - cy;

      if (dir.x && Math.sign(dx) !== dir.x) return;
      if (dir.y && Math.sign(dy) !== dir.y) return;

      const primary = dir.x ? Math.abs(dx) : Math.abs(dy);
      const secondary = dir.x ? Math.abs(dy) : Math.abs(dx);

      const score = primary + secondary * 2.2;

      if (score < bestScore) {
        best = el;
        bestScore = score;
      }
    });

    if (best) {
      best.focus();
      return true;
    }

    return false;
  },

  createHelpText(parent, text) {
    if (!parent || parent.querySelector('.a11y-help')) return;

    const help = document.createElement('div');
    help.className = 'a11y-help';
    help.textContent = text;
    parent.appendChild(help);
  },

  selectPacket(id, type, label) {
    this.enableKeyboardMode();
    this.selectedPacketId = id;
    this.selectedPacketType = type;

    document.querySelectorAll('.data-packet-wrapper, .data-packet-card').forEach(el => {
      el.classList.toggle('a11y-selected', Number(el.dataset.pktId) === Number(id));
    });

    document.querySelectorAll('.data-bin').forEach((bin) => {
      bin.classList.add('a11y-drop-target');
    });

    this.announce(`Dado ${label || type} selecionado. Agora escolha um contêiner com Tab ou setas e pressione Enter.`, 'assertive');
  },

  clearPacketSelection() {
    this.selectedPacketId = null;
    this.selectedPacketType = null;

    document.querySelectorAll('.a11y-selected').forEach(el => el.classList.remove('a11y-selected'));
    document.querySelectorAll('.a11y-drop-target').forEach(el => el.classList.remove('a11y-drop-target'));

    this.announce('Seleção cancelada.');
  },

  activateCurrent() {
    const el = document.activeElement;

    if (!el) return;

    if (el.matches('[data-pkt-id]')) {
      el.click();
      return;
    }

    if (el.matches('[data-bin]')) {
      el.click();
      return;
    }

    if (typeof el.click === 'function') el.click();
  }
};

window.A11y = A11y;

window.addEventListener('DOMContentLoaded', () => {
  A11y.init();
});
