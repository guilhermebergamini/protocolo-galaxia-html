// ═══════════════════════════════════════════════════
//  js/boss.js  –  Lógica do Boss Fight
// ═══════════════════════════════════════════════════=

const Boss = {
  data: null,
  hp: 0,
  pos: { x: 75, y: 45 },
  playerPos: { x: 18, y: 50 },
  projectiles: [],
  active: false,
  angle: 0,
  atkIdx: 0,
  keysDown: {},
  onEnd: null,
  _onKeyDown: null,
  _onKeyUp: null,
  ammo: 10,
  maxAmmo: 10,
  reloadTime: 1500,
  cooldown: 0,
  fireRate: 300,
  isReloading: false,

  start(lv, onEnd) {
    State.clearBoss();
    this.ammo = 10;
    this.maxAmmo = 10;
    this.isReloading = false;
    this.cooldown = 0;
    this.data = BOSSES[Math.floor((lv - 1) / 3) % BOSSES.length];
    this.hp = this.data.maxHp;
    this.pos = { x: 75, y: 45 };
    this.playerPos = { x: 18, y: 50 };
    this.projectiles = [];
    this.active = true;
    this.angle = 0;
    this.atkIdx = 0;
    this.keysDown = {};
    this.onEnd = onEnd;

    State.addLog(`👾 BOSS: ${this.data.name} apareceu!`, 'warn');
    State.showToast(`👾 BOSS: ${this.data.name}!`, false);

    // Keyboard
    this._onKeyDown = e => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this.shoot();
      }

      this.keysDown[e.key.toLowerCase()] = true;

      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    this._onKeyUp = e => { this.keysDown[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);

    // Player movement loop (30fps)
    State.timers.playerLoop = setInterval(() => {
      if (!this.active) return;
      const spd = 0.6, k = this.keysDown;
      let { x, y } = this.playerPos;
      if (k['w'] || k['arrowup']) y = clamp(y - spd, 5, 90);
      if (k['s'] || k['arrowdown']) y = clamp(y + spd, 5, 90);
      const autoShootEnabled = window.Settings?.data?.autoShoot;

      if (!autoShootEnabled) {
        if (k['a'] || k['arrowleft']) x = clamp(x - spd, 2, 55);
        if (k['d'] || k['arrowright']) x = clamp(x + spd, 2, 55);
      }

      this.playerPos = { x, y };
      this._renderPlayer();
    }, 30);

    // Boss sway
    State.timers.bossLoop = setInterval(() => {
      if (!this.active) return;
      this.angle += 0.02;
      this.pos = { x: 72 + Math.sin(this.angle) * 8, y: 45 + Math.cos(this.angle * 0.7) * 15 };
      this._renderBoss();
    }, 50);

    // Auto shoot accessibility
    if (window.Settings?.data?.autoShoot) {
      State.timers.autoShootLoop = setInterval(() => {
        if (this.active) this.shoot();
      }, 500);
    }

    // Projectile + collision loop (20fps)
    State.timers.projLoop = setInterval(() => {
      if (!this.active) return;
      this._tickProjectiles();
    }, 50);

    // Attack cycle
    setTimeout(() => this._fireAttack(lv), 2000);

    // 90s timeout
    setTimeout(() => { if (this.active) this.end(false); }, 90000);

    // Build the arena DOM
    this._buildArena();
  },

  _spawnAttack(type) {
    const bp = this.pos, id = () => Date.now() + Math.random();
    const color = this.data.color;
    const projs = [];

    if (type === 'spread' || type === 'burst') {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        projs.push({ id: id(), x: bp.x, y: bp.y, vx: Math.cos(a) * .9, vy: Math.sin(a) * .9, color, emoji: '💜' });
      }
    } else if (type === 'laser' || type === 'diagonal') {
      for (let i = 0; i < 8; i++) {
        projs.push({ id: id(), x: bp.x, y: 30 + i * 5, vx: -1.4, vy: 0, color, emoji: '🔴' });
        projs.push({ id: id(), x: bp.x, y: bp.y, vx: -1.2, vy: (i - 3) * .3, color, emoji: '🟣' });
      }
    } else if (type === 'spiral' || type === 'storm') {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + Date.now() * .001;
        projs.push({ id: id(), x: bp.x, y: bp.y, vx: Math.cos(a) * 1.1, vy: Math.sin(a) * .8, color, emoji: '🌀' });
      }
    } else if (type === 'chase' || type === 'homing') {
      const pp = this.playerPos, dx = pp.x - bp.x, dy = pp.y - bp.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      for (let i = 0; i < 3; i++)
        projs.push({ id: id(), x: bp.x, y: bp.y, vx: (dx / len) * 1 + (i - 1) * .3, vy: (dy / len) * 1 + (i - 1) * .3, color, emoji: '🎯' });
    } else if (type === 'wall') {
      for (let i = 0; i < 10; i++)
        projs.push({ id: id(), x: 90, y: i * 10, vx: -1.1, vy: 0, color, emoji: '🟩' });
    }
    this.projectiles = [...this.projectiles, ...projs].slice(-80);
  },

  _fireAttack(lv) {
    if (!this.active) return;
    const atk = this.data.attacks[this.atkIdx % this.data.attacks.length];
    this.atkIdx++;
    this._showWarning(atk);
    State.addLog(`⚡ Boss ataca: ${atk.desc}`, 'warn');
    setTimeout(() => {
      this._hideWarning();
      this._spawnAttack(atk.type);
      const delay = Math.max(2000, 3500 - lv * 100);
      setTimeout(() => this._fireAttack(lv), delay);
    }, 1200);
  },

  _tickProjectiles() {
    const arena = document.getElementById('boss-arena');
    if (!arena) return;

    this.projectiles = this.projectiles
      .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy }))
      .filter(p => p.x > -10 && p.x < 110 && p.y > -10 && p.y < 110)
      .filter(p => {

        // 🟥 PROJÉTIL DO PLAYER → ACERTA BOSS
        if (p.fromPlayer) {
          const hitBoss =
            Math.abs(p.x - this.pos.x) < 5 &&
            Math.abs(p.y - this.pos.y) < 5;

          if (hitBoss) {
            this.damage(p.damage);
            State.addLog(`🎯 Acertou boss! -${p.damage}hp`, 'success');
          }

          return !hitBoss;
        }

        // 🟪 PROJÉTIL DO BOSS → ACERTA PLAYER
        const pp = this.playerPos;
        const hitPlayer =
          Math.abs(p.x - pp.x) < 4 &&
          Math.abs(p.y - pp.y) < 4;

        if (hitPlayer) {
          State.takeDmg(p.damage || 15, () => Game.gameOver());
          State.addLog(`💥 Você levou dano!`, 'error');
        }

        return !hitPlayer;
      });

    this._renderProjectiles();
  },

  damage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this._updateBossHP();
    if (this.hp <= 0) this.end(true);
  },

  end(won) {
    this.active = false;
    State.clearBoss();
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.keysDown = {};
    this.projectiles = [];
    if (won) {
      const reward = this.data?.reward || 150;
      State.earnScore(reward); State.earnCoins(30);
      State.addLog(`🏆 Boss derrotado! +${reward}pts`, 'success');
      State.showToast(`🏆 Boss derrotado! +${reward}pts`, true);
    } else {
      State.addLog('⏱️ Boss fugiu…', 'warn');
      State.showToast('⏱️ Boss escapou…', false);
    }
    if (this.onEnd) setTimeout(this.onEnd, 1500);
  },

  // ── DOM rendering ──────────────────────────────
  _buildArena() {
    const container = document.getElementById('mode-container');
    container.innerHTML = `
    <div id="ammo-ui" style="
  position:absolute;
  bottom:20px;
  left:50%;
  transform:translateX(-50%);
  color:#00e5ff;
  font-size:12px;
">
  🔫 <span id="ammo-count"></span>
</div>
      <div id="boss-arena" style="flex:1;position:relative;overflow:hidden;background:radial-gradient(ellipse at 70% 45%,${this.data.color}18 0%,#040212 60%)">
        <!-- HP bar -->
        <div style="position:absolute;top:0;left:0;right:0;height:8px;background:#111;z-index:10">
          <div id="boss-hp-bar" style="height:100%;background:linear-gradient(90deg,${this.data.color},${this.data.color}88);border-radius:2px;transition:width .3s;box-shadow:0 0 12px ${this.data.color}88;width:100%"></div>
        </div>
        <!-- Info -->
        <div style="position:absolute;top:12px;left:50%;transform:translateX(-50%);z-index:9;display:flex;gap:14px;align-items:center">
          <span style="color:${this.data.color};font-weight:800;font-size:13px">${this.data.emoji} ${this.data.name}</span>
          <span id="boss-hp-text" class="mono" style="color:#ff4444;font-size:12px">❤️ ${this.hp}/${this.data.maxHp}</span>
        </div>
        <!-- Warning -->
        <div id="boss-warning" class="hidden" style="position:absolute;top:18%;left:50%;transform:translateX(-50%);z-index:20;background:${this.data.color}18;border:2px solid ${this.data.color}88;border-radius:14px;padding:10px 24px;text-align:center;backdrop-filter:blur(8px)"></div>
        <!-- Instruction -->
        <div style="position:absolute;top:50px;left:50%;transform:translateX(-50%);z-index:9;background:#ff444410;border:1px solid #ff444422;border-radius:8px;padding:4px 14px;font-size:10px;color:#ff9999;white-space:nowrap">
          ⚠️ Teclado: ↑↓ movem · Espaço/Enter atira · Tab foca no boss!
        </div>
        <!-- Boss entity -->
        <div id="boss-entity" data-a11y-interactive="true" role="button" tabindex="0" aria-label="Boss ${this.data.name}. Pressione Enter ou Espaço para atirar." style="position:absolute;left:75%;top:45%;transform:translate(-50%,-50%);z-index:8;cursor:crosshair;animation:bossFloat 2s ease-in-out infinite;filter:drop-shadow(0 0 28px ${this.data.color})" onclick="Boss.shoot();spawnParticle(event.clientX,event.clientY,'💥','${this.data.color}');State.addLog('🎯 Boss atingido!','success')">
          <div style="text-align:center">
            <div style="font-size:60px">${this.data.emoji}</div>
            <div class="mono" style="color:${this.data.color};font-size:9px;margin-top:2px">${this.data.name}</div>
            <div style="color:#888;font-size:8px">CLIQUE PARA ATACAR!</div>
          </div>
        </div>
        <!-- Projectiles container -->
        <div id="proj-container" style="position:absolute;inset:0;pointer-events:none;z-index:7"></div>
        <!-- Player ship -->
        <div id="player-ship" style="position:absolute;left:18%;top:50%;transform:translate(-50%,-50%);z-index:9;filter:drop-shadow(0 0 12px #00e5ff88);transition:left .03s,top .03s">
          <div style="font-size:38px;transform:rotate(90deg)">🚀</div>
        </div>
        <!-- WASD hint -->
        <div style="position:absolute;bottom:18px;left:16px;z-index:11">
          <div style="background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:8px 12px">
            <div style="color:#7799bb;font-size:9px;margin-bottom:5px">MOVER NAVE</div>
            <div style="display:grid;grid-template-columns:repeat(3,22px);gap:2px;place-items:center">
              <div></div><div style="width:22px;height:22px;background:#00e5ff18;border:1px solid #00e5ff44;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#00e5ff;font-size:10px;font-weight:700">W</div><div></div>
              <div style="width:22px;height:22px;background:#00e5ff18;border:1px solid #00e5ff44;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#00e5ff;font-size:10px;font-weight:700">A</div>
              <div style="width:22px;height:22px;background:#00e5ff18;border:1px solid #00e5ff44;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#00e5ff;font-size:10px;font-weight:700">S</div>
              <div style="width:22px;height:22px;background:#00e5ff18;border:1px solid #00e5ff44;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#00e5ff;font-size:10px;font-weight:700">D</div>
            </div>
            <div style="color:#445566;font-size:8px;margin-top:4px">ou setas ↑↓←→</div>
          </div>
        </div>
        <!-- Mobile attack btn -->
        <button class="btn" tabindex="0" aria-label="Atacar boss" onclick="Boss.shoot();spawnParticle(event.clientX,event.clientY,'🔫','#00e5ff')" style="position:absolute;bottom:18px;right:18px;z-index:12;background:${this.data.color}22;border:2px solid ${this.data.color}88;color:${this.data.color};font-size:14px;padding:14px 20px;border-radius:16px">
          🔫 Atacar Boss
        </button>
      </div>
    `;
    const bossEntity = document.getElementById('boss-entity');

    if (bossEntity) {
      bossEntity.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.shoot();

          const r = bossEntity.getBoundingClientRect();
          spawnParticle(r.left + r.width / 2, r.top + r.height / 2, '💥', this.data.color);
        }
      });
    }

    if (window.A11y) {
      A11y.createHelpText(
        document.getElementById('boss-arena'),
        'Teclado: setas/WASD movem · Espaço/Enter atira · Tab navega'
      );
    }

    document.getElementById('mode-label').innerHTML = `<span class="mono" style="color:#ff00ff;font-size:10px;letter-spacing:2px">👾 BOSS: ${this.data.name}  —  ↑↓ / WASD para mover · Espaço/Enter para atirar</span>`;
  },

  _renderBoss() {
    const e = document.getElementById('boss-entity');
    if (e) { e.style.left = this.pos.x + '%'; e.style.top = this.pos.y + '%'; }
  },

  _renderPlayer() {
    const e = document.getElementById('player-ship');
    if (e) { e.style.left = this.playerPos.x + '%'; e.style.top = this.playerPos.y + '%'; }
  },

  _renderProjectiles() {
    const container = document.getElementById('proj-container');
    if (!container) return;
    container.innerHTML = '';
    this.projectiles.forEach(p => {
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;left:${p.x}%;top:${p.y}%;transform:translate(-50%,-50%);font-size:16px;filter:drop-shadow(0 0 5px ${p.color})`;
      d.textContent = p.emoji;
      container.appendChild(d);
    });
  },

  _updateBossHP() {
    const bar = document.getElementById('boss-hp-bar');
    const txt = document.getElementById('boss-hp-text');
    if (bar) bar.style.width = (this.hp / this.data.maxHp * 100) + '%';
    if (txt) txt.textContent = `❤️ ${this.hp}/${this.data.maxHp}`;
  },
  
  _updateAmmoUI() {
    const el = document.getElementById('ammo-count');
    if (el) el.textContent = `${this.ammo}/${this.maxAmmo}`;
  },

  _showWarning(atk) {
    const w = document.getElementById('boss-warning');
    if (!w) return;
    w.innerHTML = `<div style="font-size:24px">${atk.emoji}</div><div style="color:${this.data.color};font-size:14px;font-weight:700">ATAQUE: ${atk.desc}</div><div style="color:#aaa;font-size:11px;margin-top:3px">ESQUIVE! Use WASD / ↑↓←→</div>`;
    w.classList.remove('hidden');
    w.style.animation = 'slideDown .3s ease-out';
  },

  _hideWarning() {
    const w = document.getElementById('boss-warning');
    if (w) w.classList.add('hidden');
  },

  reload() {
    if (this.isReloading) return;

    this.isReloading = true;
    State.addLog('🔄 Recarregando...', 'warn');

    setTimeout(() => {
      this.ammo = this.maxAmmo;
      this.isReloading = false;
      State.addLog('🔫 Munição recarregada!', 'success');
    }, this.reloadTime);
  },

  shoot() {
    if (!this.active) return;

    // cooldown
    if (Date.now() < this.cooldown) return;

    // sem munição → recarrega
    if (this.ammo <= 0) {
      this.reload();
      return;
    }

    this.cooldown = Date.now() + this.fireRate;
    this.ammo--;

    // cria projétil indo pro boss
    const dx = this.pos.x - this.playerPos.x;
    const dy = this.pos.y - this.playerPos.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;

    this.projectiles.push({
      id: Date.now() + Math.random(),
      x: this.playerPos.x,
      y: this.playerPos.y,
      vx: (dx / len) * 2,
      vy: (dy / len) * 2,
      fromPlayer: true,
      emoji: '🔵',
      color: '#00e5ff',
      damage: 15
    });
  }

};
