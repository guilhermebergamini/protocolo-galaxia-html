// ═══════════════════════════════════════════════════
//  js/state.js  –  Estado global do jogo + helpers
// ═══════════════════════════════════════════════════=

const State = {
  // Métricas
  score:        0,
  coins:        30,
  energy:       100,
  level:        1,
  round:        0,
  streak:       0,
  highScore:    0,

  // Sistema de fases
  phase:        1,          // fase atual (1–10)
  roundInPhase: 0,          // rodadas concluídas dentro da fase atual
  scoreAtPhaseStart: 0,     // score acumulado antes da fase começar (para normalização)
  maxScore:     0,          // maior score já atingido (para highscore 0-100)

  // Efeitos ativos da shop
  effects: {},

  // Log de eventos
  log: [],

  // Enciclopédia
  encyclopedia: {},

  // ── Timers ──
  timers: {
    threatSpawn:   null,
    defCountdown:  null,
    moveInterval:  null,
    noThreatRef:   null,
    bossLoop:      null,
    projLoop:      null,
    playerLoop:    null,
    toastTimer:    null,
    autoShootLoop: null,
  },

  // ── Resetar para nova partida ──
  reset() {
    this.score              = 0;
    this.coins              = 30;
    this.energy             = 100;
    this.level              = 1;
    this.round              = 0;
    this.streak             = 0;
    this.phase              = 1;
    this.roundInPhase       = 0;
    this.scoreAtPhaseStart  = 0;
    this.effects            = {};
    this.log                = [];
    this.encyclopedia       = {};
  },

  // ── Log ──
  addLog(msg, type = 'info') {
    this.log.unshift({ msg, type, t: tstamp() });
    if (this.log.length > 80) this.log.pop();
    UI.refreshLog();
  },

  // ── Toast ──
  showToast(msg, good = true) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.cssText = `
      position:fixed;top:16%;left:50%;transform:translateX(-50%);
      background:${good ? '#00e5ff0d' : '#ff44440d'};
      border:1.5px solid ${good ? '#00e5ff55' : '#ff444455'};
      border-radius:14px;padding:11px 26px;
      color:${good ? '#00e5ff' : '#ff7070'};
      font-size:14px;font-weight:700;z-index:800;
      animation:slideDown .22s ease-out;
      backdrop-filter:blur(12px);text-align:center;max-width:350px;
      pointer-events:none;
    `;
    toast.classList.remove('hidden');
    clearTimeout(this.timers.toastTimer);
    this.timers.toastTimer = setTimeout(() => toast.classList.add('hidden'), 2200);
  },

  // ── Pontos / Moedas ──
  earnScore(n) {
    const bonus = this.effects.turbo ? 15 : 0;
    this.score += n + bonus;
    UI.refreshHUD();
  },
  earnCoins(n) {
    const mult = this.effects.x2coins ? 2 : 1;
    this.coins += n * mult;
    UI.refreshHUD();
  },

  // ── Dano ──
  takeDmg(n, onDeath) {
    this.energy = Math.max(0, this.energy - n);
    UI.refreshHUD();
    if (this.energy <= 0 && onDeath) setTimeout(onDeath, 200);
  },

  // ── Limpar timers ──
  clearAll() {
    Object.keys(this.timers).forEach(k => {
      clearInterval(this.timers[k]);
      clearTimeout(this.timers[k]);
      this.timers[k] = null;
    });
  },
  clearDefense() {
    ['threatSpawn','defCountdown','moveInterval','noThreatRef'].forEach(k => {
      clearInterval(this.timers[k]);
      clearTimeout(this.timers[k]);
      this.timers[k] = null;
    });
  },
  clearBoss() {
    ['bossLoop','projLoop','playerLoop','autoShootLoop'].forEach(k => {
      clearInterval(this.timers[k]);
      clearTimeout(this.timers[k]);
      this.timers[k] = null;
    });
  },
};
