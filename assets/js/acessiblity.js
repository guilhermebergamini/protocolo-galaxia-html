// ═══════════════════════════════════════════════════
//  js/accessibility.js  
// ═══════════════════════════════════════════════════=

const A11y = {
  selectedPacketId: null,

  // ── Criar painel fixo na tela de jogo ─────────────
  createPanel() {
    if (document.getElementById('one-finger-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'one-finger-panel';
    panel.setAttribute('role', 'toolbar');
    panel.setAttribute('aria-label', 'Ações de acessibilidade — modo 1 dedo');
    panel.style.cssText = `
      display:none;position:fixed;bottom:16px;left:50%;transform:translateX(-50%);
      z-index:950;flex-direction:column;align-items:center;gap:6px;
      pointer-events:none;
    `;
    panel.innerHTML = `
      <div style="color:#00e5ffaa;font-size:9px;letter-spacing:2px;font-weight:700">
        ♿ MODO 1 DEDO <span id="of-shortcut-hint" style="opacity:.5"></span>
      </div>
      <div id="of-actions" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;pointer-events:auto;max-width:94vw"></div>
    `;
    document.body.appendChild(panel);
  },

  // ── Atualizar lista de ações ───────────────────────
  // actions: [{ icon, label, onTap, highlight? }]
  setActions(actions) {
    const row = document.getElementById('of-actions');
    const panel = document.getElementById('one-finger-panel');
    const hint  = document.getElementById('of-shortcut-hint');
    if (!row || !panel) return;

    row.innerHTML = '';
    if (!actions || !actions.length) { panel.style.display = 'none'; return; }

    actions.forEach((act, i) => {
      const btn = document.createElement('button');
      btn.className = 'btn of-btn';
      btn.setAttribute('aria-label', act.label);
      btn.setAttribute('tabindex', '0');
      btn.dataset.shortcut = String(i + 1);
      btn.style.cssText = `
        background:${act.highlight ? 'rgba(0,229,255,.18)' : 'rgba(8,18,42,.9)'};
        border:2px solid ${act.highlight ? '#00e5ff' : 'rgba(0,229,255,.25)'};
        color:${act.highlight ? '#00e5ff' : '#7799bb'};
        border-radius:16px;padding:10px 14px;font-size:12px;font-weight:700;
        min-width:70px;cursor:pointer;backdrop-filter:blur(12px);
        box-shadow:${act.highlight ? '0 0 18px #00e5ff33' : 'none'};
        transition:all .15s;
      `;
      btn.innerHTML = `<span style="font-size:22px;display:block;margin-bottom:4px">${act.icon}</span>${act.label}`;
      btn.addEventListener('click', () => act.onTap());
      btn.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); act.onTap(); }});
      row.appendChild(btn);
    });

    if (hint) hint.textContent = actions.length > 1 ? `· teclas 1–${Math.min(actions.length,9)}` : '';
    panel.style.display = 'flex';
  },

  clearActions() {
    this.selectedPacketId = null;
    const row   = document.getElementById('of-actions');
    const panel = document.getElementById('one-finger-panel');
    if (row)   row.innerHTML = '';
    if (panel) panel.style.display = 'none';
  },

  // ── ARIA live region (leitores de tela) ────────────
  announce(msg, priority = 'polite') {
    const r = document.getElementById('aria-live-region');
    if (!r) return;
    r.setAttribute('aria-live', priority);
    r.textContent = '';
    requestAnimationFrame(() => { r.textContent = msg; });
  },

  // ── Atalhos numéricos de teclado ───────────────────
  initKeyboard() {
    document.addEventListener('keydown', e => {
      if (!Settings.oneFingerMode) return;
      const n = parseInt(e.key);
      if (n >= 1 && n <= 9) {
        const btn = document.querySelector(`.of-btn[data-shortcut="${n}"]`);
        if (btn) { btn.click(); }
      }
    });
  },
};

// ─────────────────────────────────────────────────────
//  Funções de integração chamadas pelos modos de jogo
// ─────────────────────────────────────────────────────

// Classify: após tocar em um pacote, mostra destinos possíveis
function ofClassifySelectPacket(pkt, onDrop) {
  if (!Settings.oneFingerMode) return;
  A11y.selectedPacketId = pkt.id;
  A11y.announce(`Pacote ${pkt.type} selecionado. Escolha o destino.`, 'assertive');

  const actions = PACKET_TYPES.map(tp => ({
    icon:      tp.emoji,
    label:     tp.label,
    highlight: tp.type === pkt.type, // destaca o correto (somente se scanner ativo)
    onTap:     () => {
      A11y.clearActions();
      A11y.announce(`Enviado para ${tp.label}`, 'assertive');
      onDrop(pkt.id, tp.type);
    },
  }));

  actions.push({
    icon: '✖️', label: 'Cancelar', highlight: false,
    onTap: () => { A11y.clearActions(); A11y.announce('Seleção cancelada'); },
  });

  A11y.setActions(actions);
}

// Defense: lista ameaças vivas como botões
function ofDefenseRefresh(threats, onKill) {
  if (!Settings.oneFingerMode) return;
  const alive = threats.filter(t => t.alive).slice(0, 6);
  if (!alive.length) { A11y.clearActions(); return; }

  A11y.setActions(alive.map(th => ({
    icon:      th.emoji,
    label:     th.name,
    highlight: true,
    onTap:     () => {
      A11y.announce(`${th.name} destruído!`, 'assertive');
      onKill(th.uid);
    },
  })));
}

// Mission: mostra TCP / UDP
function ofMissionActions(onTCP, onUDP) {
  if (!Settings.oneFingerMode) return;
  A11y.setActions([
    { icon:'📦', label:'TCP', highlight:true,  onTap: onTCP },
    { icon:'⚡', label:'UDP', highlight:false, onTap: onUDP },
  ]);
}

// Boss: botão de disparar
function ofBossActions(onFire) {
  if (!Settings.oneFingerMode) return;
  A11y.setActions([
    { icon:'🔫', label:'Atirar!', highlight:true, onTap: onFire },
  ]);
}