// ═══════════════════════════════════════════════════
//  js/main.js  –  Bootstrap, roteamento de telas,
//                 vinculação de eventos globais
// ═══════════════════════════════════════════════════=

// ── Roteador de telas ──────────────────────────────
const SCREENS = ['menu','game','shop','gameover','debug'];

function showScreen(name) {
  SCREENS.forEach(s => {
    const el = document.getElementById('screen-' + s);
    if (el) el.classList.toggle('hidden', s !== name);
  });

  if (window.A11y) {
    setTimeout(() => {
      A11y.refresh();

      const screen = document.getElementById('screen-' + name);
      const first = screen?.querySelector('button:not([disabled]), [role="button"][tabindex="0"], [tabindex="0"]');

      if (A11y.keyboardMode && first) first.focus();
    }, 80);
  }
}

// ── Construir a shop ───────────────────────────────
function buildShop() {
  const grid = document.getElementById('shop-grid');
  grid.innerHTML = '';
  SHOP_ITEMS.forEach(item => {
    const active = State.effects[item.id];
    const canBuy = State.coins >= item.cost;
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = `padding:18px;display:flex;flex-direction:column;gap:10px;opacity:${canBuy?1:.55};border:1px solid ${active?'rgba(105,255,71,.27)':'rgba(255,255,255,.1)'}`;
    card.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center">
        <span style="font-size:38px">${item.icon}</span>
        <div>
          <div style="font-weight:700;font-size:15px">${item.name}</div>
          <div style="font-size:11px;color:#8aa8cc">${item.desc}</div>
          ${active ? '<div style="font-size:10px;color:#69ff47;margin-top:2px">✅ Ativo!</div>' : ''}
        </div>
      </div>
      <button class="btn" style="background:${canBuy?'linear-gradient(135deg,#ffd700,#e08800)':'#2a2a3a'};color:${canBuy?'#07100a':'#555'};padding:10px;font-size:14px;font-weight:800;${canBuy?'':'cursor:not-allowed'}">
        💰 ${item.cost} moedas
      </button>`;
    const btn = card.querySelector('button');
    if (canBuy) btn.addEventListener('click', () => {
      Game.buyItem(item);
      buildShop(); // re-render
    });
    grid.appendChild(card);
  });
  document.getElementById('shop-coins').textContent = State.coins;
}

// ── Construir painel de debug ──────────────────────
function buildDebug() {
  // State
  const stateEl = document.getElementById('debug-state');
  const stateData = [
    ['score',        State.score],
    ['coins',        State.coins],
    ['energy',       State.energy],
    ['phase',        `${State.phase}/${TOTAL_PHASES}`],
    ['roundInPhase', `${State.roundInPhase}/${getCurrentPhase().rounds}`],
    ['level',        State.level],
    ['round',        State.round],
    ['mode',         Game.mode || '—'],
    ['streak',       State.streak],
    ['isBoss',       Boss.active],
    ['bossHp',       Boss.hp],
    ['threats',      Game.threats?.filter(t=>t.alive).length || 0],
    ['projectiles',  Boss.projectiles?.length || 0],
    ['playerPos',    Boss.active ? `${Boss.playerPos.x.toFixed(1)},${Boss.playerPos.y.toFixed(1)}` : '—'],
    ['defTimer',     Game.defTimer],
    ['noThreatSecs', Game.noSecs],
    ['encyc',        Object.keys(State.encyclopedia).join(',') || '—'],
  ];
  stateEl.innerHTML = stateData.map(([k,v]) =>
    `<div><span style="color:#336633">${k}: </span><span style="color:#00ff00">${String(v)}</span></div>`
  ).join('');

  // Inject buttons
  const injectEl = document.getElementById('debug-inject');
  const injectBtns = [
    ['➕+100pts',    () => { State.score += 100; UI.refreshHUD(); State.addLog('+100 pts injetado','info'); }],
    ['💰+50',        () => { State.coins += 50;  UI.refreshHUD(); State.addLog('+50 moedas injetadas','info'); }],
    ['🔋Max HP',     () => { State.energy = 100; UI.refreshHUD(); State.addLog('Energia cheia','info'); }],
    ['💀Zero HP',    () => { State.energy = 0;   UI.refreshHUD(); Game.gameOver(); }],
    ['⬆️+Fase',      () => { Game._onBossDefeated(); },],
    ['📦Classify',   () => { showScreen('game'); Game.mode='classify'; Game._startClassify(); }],
    ['🚀Mission',    () => { showScreen('game'); Game.mode='mission';  Game._startMission(); }],
    ['🛡️Defense',   () => { showScreen('game'); Game.mode='defense';  Game._startDefense(); }],
    ['👾Boss',       () => {
      showScreen('game');
      State.round++;
      Game.mode='defense'; Game.isBoss=true;
      Game._setModeLabel('defense',true);
      Boss.start(State.level, () => Game._onBossDefeated());
    }],
    ['📖 Integer',  () => { State.encyclopedia['Integer']=true; UI.refreshHUD(); UI.showEncycPopup('Integer'); }],
    ['📖 String',   () => { State.encyclopedia['String'] =true; UI.refreshHUD(); UI.showEncycPopup('String');  }],
    ['📖 Boolean',  () => { State.encyclopedia['Boolean']=true; UI.refreshHUD(); UI.showEncycPopup('Boolean'); }],
  ];
  injectEl.innerHTML = '';
  injectBtns.forEach(([label, fn]) => {
    const b = document.createElement('button');
    b.className = 'btn';
    b.textContent = label;
    b.style.cssText = 'background:rgba(255,110,199,.07);border:1px solid rgba(255,110,199,.16);color:#ff6ec7;font-size:9px;padding:4px 8px';
    b.addEventListener('click', () => { fn(); buildDebug(); UI.refreshLog(); });
    injectEl.appendChild(b);
  });
}

// ── Vincular eventos ───────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Estrelas no menu
  UI.buildStars();

  // Menu → iniciar
  document.getElementById('btn-start').addEventListener('click', () => Game.start());

  // Game → shop
  document.getElementById('btn-shop').addEventListener('click', () => {
    buildShop();
    showScreen('shop');
  });

  // Game → debug
  document.getElementById('btn-debug').addEventListener('click', () => {
    buildDebug();
    showScreen('debug');
  });

  // Game → enciclopédia
  document.getElementById('btn-encyc').addEventListener('click', () => UI.showEncycBrowser());

  // Shop → voltar
  document.getElementById('btn-shop-back').addEventListener('click', () => showScreen('game'));

  // Debug → voltar
  document.getElementById('btn-debug-back').addEventListener('click', () => showScreen('game'));
  document.getElementById('btn-clear-log').addEventListener('click', () => {
    State.log = [];
    UI.refreshLog();
  });

  // Game Over → reiniciar / menu
  document.getElementById('btn-restart').addEventListener('click', () => Game.start());
  document.getElementById('btn-to-menu').addEventListener('click', () => {
    showScreen('menu');
    const hs = document.getElementById('menu-highscore');
    const hsVal = document.getElementById('menu-hs-val');
    if (State.highScore > 0) {
      hs.style.display = 'block';
      hsVal.textContent = State.highScore;
    }
  });

  // Modal fechar com ESC ou clique fora
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) UI.hideModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') UI.hideModal();
  });

  // Auto-atualizar debug state a cada 500ms quando na tela
  setInterval(() => {
    if (!document.getElementById('screen-debug').classList.contains('hidden'))
      buildDebug();
  }, 500);
});
