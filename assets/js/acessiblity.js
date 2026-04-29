// ═══════════════════════════════════════════════════
//  js/accessibility.js  –  Modo 1 Dedo + ARIA
// ═══════════════════════════════════════════════════

const A11y = {
    // Estado do modo 1 dedo no jogo atual
    selectedPacketId: null,   // pacote selecionado no classify
    panelActions:     [],     // ações disponíveis no momento
  
    // ── Criar painel flutuante de 1 dedo ──────────────
    createPanel() {
      if (document.getElementById('one-finger-panel')) return;
  
      const panel = document.createElement('div');
      panel.id = 'one-finger-panel';
      panel.setAttribute('role', 'toolbar');
      panel.setAttribute('aria-label', 'Ações do modo 1 dedo');
      panel.style.cssText = `
        display: none;
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 900;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        pointer-events: none;
      `;
  
      const label = document.createElement('div');
      label.id = 'of-label';
      label.style.cssText = 'color:#00e5ff88;font-size:10px;letter-spacing:2px;margin-bottom:2px';
      label.textContent = '♿ MODO 1 DEDO';
  
      const btnsRow = document.createElement('div');
      btnsRow.id = 'of-actions';
      btnsRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center;pointer-events:auto';
  
      panel.appendChild(label);
      panel.appendChild(btnsRow);
      document.body.appendChild(panel);
    },
  
    // ── Atualizar ações do painel ──────────────────────
    // actions: [ { label, icon, key, onTap, highlight } ]
    setActions(actions) {
      if (!Settings.oneFingerMode) return;
      this.panelActions = actions;
      const row = document.getElementById('of-actions');
      if (!row) return;
      row.innerHTML = '';
      actions.forEach((act, i) => {
        const btn = document.createElement('button');
        btn.className = 'btn of-action-btn';
        btn.setAttribute('aria-label', act.label);
        btn.setAttribute('tabindex', '0');
        btn.dataset.key = act.key || '';
        btn.style.cssText = `
          background: ${act.highlight ? 'rgba(0,229,255,.18)' : 'rgba(10,20,50,.85)'};
          border: 2px solid ${act.highlight ? '#00e5ff' : 'rgba(0,229,255,.3)'};
          color: ${act.highlight ? '#00e5ff' : '#7799bb'};
          border-radius: 14px;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 700;
          min-width: 80px;
          cursor: pointer;
          backdrop-filter: blur(10px);
          box-shadow: ${act.highlight ? '0 0 16px #00e5ff44' : 'none'};
          transition: all .18s;
        `;
        btn.innerHTML = `<span style="font-size:20px;display:block;margin-bottom:3px">${act.icon}</span>${act.label}`;
        btn.addEventListener('click', () => {
          act.onTap();
        });
        // Atalho teclado numérico (1-9)
        btn.dataset.shortcut = String(i + 1);
        row.appendChild(btn);
      });
  
      // Mostrar dica de atalho de teclado
      const label = document.getElementById('of-label');
      if (label && actions.length > 0) {
        label.textContent = '♿ 1 DEDO  ·  teclas 1–' + Math.min(actions.length, 9);
      }
  
      const panel = document.getElementById('one-finger-panel');
      if (panel) panel.style.display = actions.length > 0 ? 'flex' : 'none';
    },
  
    // ── Limpar ações ──────────────────────────────────
    clearActions() {
      this.selectedPacketId = null;
      const row = document.getElementById('of-actions');
      if (row) row.innerHTML = '';
      const panel = document.getElementById('one-finger-panel');
      if (panel) panel.style.display = 'none';
    },
  
    // ── Keyboard shortcuts 1-9 para ações ──────────────
    initKeyboard() {
      document.addEventListener('keydown', e => {
        // Atalhos numéricos para ações do painel de 1 dedo
        if (Settings.oneFingerMode && e.key >= '1' && e.key <= '9') {
          const idx = parseInt(e.key) - 1;
          const btns = document.querySelectorAll('.of-action-btn');
          if (btns[idx]) { btns[idx].click(); return; }
        }
  
        // Navegação por teclado nos modais (ESC já tratado em main.js)
        if (e.key === 'Tab') {
          // Foco visível gerenciado pelo CSS :focus-visible
        }
      });
    },
  
    // ── ARIA: anunciar para leitores de tela ──────────
    announce(msg, priority = 'polite') {
      const live = document.getElementById('aria-live-region');
      if (!live) return;
      live.setAttribute('aria-live', priority);
      live.textContent = '';
      requestAnimationFrame(() => { live.textContent = msg; });
    },
  };
  
  // ── Integração com o modo Classify ────────────────────
  // Chamado pelo game.js quando monta as opções de classificação
  // para mostrar botões de seleção no painel 1 dedo
  function ofClassifySelectPacket(pkt, bins, onDrop) {
    if (!Settings.oneFingerMode) return;
  
    A11y.selectedPacketId = pkt.id;
    A11y.announce(`Pacote ${pkt.type} selecionado. Escolha o destino.`, 'assertive');
  
    const actions = bins.map(bin => ({
      icon:      bin.icon || '📂',
      label:     bin.label,
      highlight: false,
      onTap:     () => {
        A11y.announce(`Enviado para ${bin.label}`, 'assertive');
        A11y.clearActions();
        onDrop(pkt.id, bin.type);
      },
    }));
  
    // Adiciona botão de cancelar
    actions.push({
      icon:  '✖️',
      label: 'Cancelar',
      highlight: false,
      onTap: () => { A11y.clearActions(); A11y.announce('Seleção cancelada'); },
    });
  
    A11y.setActions(actions);
  }
  
  // ── Integração com Defesa ──────────────────────────────
  // Chamado quando há ameaças vivas para mostrar botões de ataque
  function ofDefenseShowThreats(threats, onKill) {
    if (!Settings.oneFingerMode) return;
    if (!threats || threats.length === 0) { A11y.clearActions(); return; }
  
    const actions = threats.slice(0, 5).map(th => ({
      icon:      th.emoji,
      label:     th.name,
      highlight: true,
      onTap:     () => {
        A11y.announce(`${th.name} destruído!`, 'assertive');
        onKill(th.uid);
      },
    }));
  
    A11y.setActions(actions);
  }
  
  // ── Integração com Missão ──────────────────────────────
  function ofMissionShowOptions(onTCP, onUDP) {
    if (!Settings.oneFingerMode) return;
    A11y.setActions([
      { icon: '📡', label: 'TCP', highlight: true,  onTap: onTCP },
      { icon: '⚡', label: 'UDP', highlight: false, onTap: onUDP },
    ]);
  }
  
  // ── Integração com Boss ────────────────────────────────
  function ofBossShowFire(onFire) {
    if (!Settings.oneFingerMode) return;
    A11y.setActions([
      { icon: '🔥', label: 'Atirar!', highlight: true, onTap: onFire },
    ]);
  }