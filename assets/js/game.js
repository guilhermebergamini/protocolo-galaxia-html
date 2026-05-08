// ═══════════════════════════════════════════════════
//  js/game.js  –  Motor principal do jogo
// ═══════════════════════════════════════════════════=

const Game = {
  // Estado local dos modos
  mode: null,
  // Classify
  packets: [], draggingId: null, dragPos: {x:0,y:0},
  classifiedCnt: 0, totalPkts: 0,
  // Mission
  mission: null, beaming: false,
  // Defense
  threats: [], cryptoOn: false, defTimer: 0, defDuration: 0,
  spawned: 0, noSecs: 0,
  // Boss flag
  isBoss: false,

  // ── Iniciar / Reiniciar ────────────────────────
  start() {
    State.clearAll();
    State.reset();
    scoreSent = false; // permite envio numa nova partida
    this.mode = null; this.isBoss = false;
    this.packets = []; this.threats = [];
    this.mission = null; this.beaming = false;
    // Reseta visual da tela de game over para o padrão
    const icon = document.getElementById('go-title-icon');
    const text = document.getElementById('go-title-text');
    if (icon) icon.textContent = '💥';
    if (text) { text.textContent = 'GAME OVER'; text.style.color = '#ff4444'; }
    UI.buildStars();
    UI.refreshHUD();
    showScreen('game');
    State.addLog('🛰️ Estação espacial inicializada!', 'success');
    setTimeout(() => this.nextRound(), 500);
  },

  // ── Game Over ──────────────────────────────────
  gameOver() {
    State.clearAll();
    Boss.active = false;
    State.highScore = Math.max(State.highScore, State.score);
    State.addLog('💀 Game Over!', 'error');

    const finalScore = calcFinalScore();
    sendFinalScore({ score: finalScore, difficulty: getPlatformDifficulty() });

    document.getElementById('go-score').textContent     = State.score;
    document.getElementById('go-highscore').textContent = State.highScore;
    document.getElementById('go-level').textContent     = State.level;
    document.getElementById('go-rounds').textContent    = State.round;
    document.getElementById('go-phase').textContent     = `${State.phase}/${TOTAL_PHASES}`;
    const keys = Object.keys(State.encyclopedia);
    document.getElementById('go-encyc').textContent = keys.length ? keys.join(', ') : 'nenhuma';
    document.getElementById('go-record').classList.toggle('hidden', State.score === 0 || State.score < State.highScore);
    showScreen('gameover');
  },

  // ── Vitória (completou todas as fases) ────────
  victory() {
    State.clearAll();
    Boss.active = false;
    State.highScore = Math.max(State.highScore, State.score);
    State.addLog('🏆 VITÓRIA! Todas as fases concluídas!', 'success');

    const finalScore = calcFinalScore();
    sendFinalScore({ score: finalScore, difficulty: getPlatformDifficulty() });

    // Reutiliza a tela de game over com visual de vitória
    document.getElementById('go-title-icon').textContent  = '🏆';
    document.getElementById('go-title-text').textContent  = 'MISSÃO COMPLETA!';
    document.getElementById('go-title-text').style.color  = '#ffd700';
    document.getElementById('go-score').textContent       = State.score;
    document.getElementById('go-highscore').textContent   = State.highScore;
    document.getElementById('go-level').textContent       = State.level;
    document.getElementById('go-rounds').textContent      = State.round;
    document.getElementById('go-phase').textContent       = `${TOTAL_PHASES}/${TOTAL_PHASES}`;
    const keys = Object.keys(State.encyclopedia);
    document.getElementById('go-encyc').textContent = keys.length ? keys.join(', ') : 'nenhuma';
    document.getElementById('go-record').classList.remove('hidden');
    document.getElementById('go-record').textContent = `✅ Score enviado: ${finalScore}/100`;
    showScreen('gameover');
  },

  // ── Próxima rodada ─────────────────────────────
  nextRound() {
    State.clearDefense();
    this.isBoss = false;

    const phaseCfg = getCurrentPhase();

    // ── Verifica se chegou na boss round desta fase ──
    if (phaseCfg.hasBoss && State.roundInPhase >= phaseCfg.rounds - 1) {
      // É o boss da fase
      State.round++;
      State.roundInPhase++;
      this.mode = 'defense';
      this.isBoss = true;
      this._setModeLabel('defense', true);
      UI.refreshHUD();
      State.addLog(`👾 BOSS da Fase ${State.phase}!`, 'warn');
      Boss.start(State.phase, () => this._onBossDefeated());
      return;
    }

    // ── Fase sem boss: avança ao completar todas as rodadas ──
    if (!phaseCfg.hasBoss && State.roundInPhase >= phaseCfg.rounds) {
      this._onBossDefeated(); // reutiliza a lógica de avanço de fase
      return;
    }

    // ── Rodada normal ──
    State.round++;
    State.roundInPhase++;

    // Level sobe junto com a fase para manter compatibilidade com boss/dificuldade
    State.level = State.phase;
    UI.refreshHUD();

    const mode = pickMode(phaseCfg);
    this.mode = mode;
    this._setModeLabel(mode, false);
    State.addLog(`── Fase ${State.phase}/${TOTAL_PHASES} · Rodada ${State.roundInPhase}/${phaseCfg.rounds} · ${mode}`, 'info');

    if (mode === 'classify') this._startClassify();
    else if (mode === 'mission') this._startMission();
    else this._startDefense();
  },

  // ── Após boss derrotado / fase sem boss concluída ──
  _onBossDefeated() {
    // Bônus de fase concluída
    State.earnScore(50);
    State.earnCoins(30);
    State.showToast(`🏆 Fase ${State.phase} concluída! +50pts`, true);
    State.addLog(`🏆 Fase ${State.phase} concluída!`, 'success');

    // Verifica se era a última fase
    if (State.phase >= TOTAL_PHASES) {
      setTimeout(() => this.victory(), 1000);
      return;
    }

    // Avança para próxima fase
    State.phase++;
    State.roundInPhase = 0;
    State.scoreAtPhaseStart = State.score;
    State.level = State.phase;
    UI.refreshHUD();
    UI.showPhaseTransition(State.phase, PHASES[State.phase - 1].name, () => {
      setTimeout(() => this.nextRound(), 400);
    });
  },

  _setModeLabel(mode, isBoss) {
    const label = document.getElementById('mode-label');
    if (!label) return;
    const cfgs = {
      classify: { c:'#00e5ff', l:'📦  CLASSIFICAÇÃO DE DADOS' },
      mission:  { c:'#ff6ec7', l:'🚀  MISSÃO DE ENVIO' },
      defense:  { c:'#ff4444', l:'🛡️  DEFESA CIBERNÉTICA' },
    };
    const cfg = cfgs[mode] || cfgs.defense;
    label.style.background = cfg.c + '0a';
    label.style.borderBottom = `1px solid ${cfg.c}28`;
    label.innerHTML = `<span class="mono" style="color:${cfg.c};font-size:10px;letter-spacing:2px">${cfg.l}</span>`;
  },

  // ══════════════════════════════════════════════
  //  MODO CLASSIFY
  // ══════════════════════════════════════════════
  _startClassify() {
    const phaseCfg = getCurrentPhase();
    const cnt = phaseCfg.classify.packetCount;
    this.totalPkts = cnt; this.classifiedCnt = 0;
    this.packets = Array.from({length:cnt},(_,i) => {
      const tp = getRnd(PACKET_TYPES);
      return { id:i, value:getRnd(tp.examples), type:tp.type,
               x:6+Math.random()*55, y:14+i*(62/cnt), done:false, shake:false };
    });
    State.addLog(`📦 ${cnt} pacotes chegaram!`, 'info');
    this._renderClassify();
  },

  _renderClassify() {
    const container = document.getElementById('mode-container');
    const dots = Array.from({length:this.totalPkts},(_,i) => {
      const done = this.packets[i]?.done;
      return `<div style="width:18px;height:18px;border-radius:50%;background:${done?'#69ff47':'rgba(255,255,255,.1)'};border:1.5px solid ${done?'#69ff47':'rgba(255,255,255,.2)'};display:flex;align-items:center;justify-content:center;font-size:9px;transition:all .3s">${done?'✓':''}</div>`;
    }).join('');

    const bins = PACKET_TYPES.map(tp => `
      <div data-bin="${tp.type}" style="width:108px;padding:13px 8px;text-align:center;background:${tp.bg};border:2px solid ${tp.color}40;border-radius:14px;transition:all .2s;cursor:default">
        <div style="font-size:30px">${tp.emoji}</div>
        <div style="color:${tp.color};font-size:13px;font-weight:700;margin-top:4px">${tp.label}</div>
        <div class="mono" style="color:${tp.color}88;font-size:9px;margin-top:2px">${tp.type}</div>
      </div>`).join('');

    container.innerHTML = `
      <div id="classify-area" style="flex:1;position:relative;overflow:hidden">
        <div style="position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:8;display:flex;gap:7px">${dots}</div>
        <div style="position:absolute;top:36px;left:50%;transform:translateX(-50%);z-index:8;background:#00e5ff08;border:1px solid #00e5ff18;border-radius:8px;padding:4px 14px;font-size:11px;color:#5599bb;white-space:nowrap">
          Arraste os pacotes para o contêiner correto ↓
        </div>
        <div id="packets-layer" style="position:absolute;inset:0;z-index:6"></div>
        <div id="bins-row" style="position:absolute;bottom:14px;left:50%;transform:translateX(-50%);z-index:7;display:flex;gap:12px">${bins}</div>
      </div>`;

    this._renderPackets();
    this._attachDragEvents();
  },

  _renderPackets() {
    const layer = document.getElementById('packets-layer');
    if (!layer) return;
    layer.innerHTML = '';
    this.packets.filter(p => !p.done).forEach(pkt => {
      const tp = PACKET_TYPES.find(t => t.type === pkt.type);
      const isDrag = this.draggingId === pkt.id;
      const p = document.createElement('div');
      p.dataset.pktId = pkt.id;
      p.style.cssText = `
        position:absolute;
        left:${isDrag ? this.dragPos.x-44+'px' : pkt.x+'%'};
        top:${isDrag ? this.dragPos.y-35+'px' : pkt.y+'%'};
        z-index:${isDrag ? 100 : 6};
        cursor:${isDrag ? 'grabbing' : 'grab'};
        transition:${isDrag ? 'none' : 'all .28s'};
        animation:${pkt.shake ? 'shake .4s' : isDrag ? 'none' : `packetBob ${2.5+pkt.id*.3}s ease-in-out infinite`};
        user-select:none;
      `;
      p.innerHTML = `
        <div style="background:${isDrag ? tp.color+'28' : tp.bg};border:2px solid ${isDrag ? tp.color : tp.color+'55'};border-radius:14px;padding:10px 18px;box-shadow:${isDrag ? `0 0 24px ${tp.glow},0 10px 36px #000c` : `0 0 10px ${tp.glow}55`};display:flex;flex-direction:column;align-items:center;gap:3px;min-width:82px;transform:${isDrag?'scale(1.18) rotate(-4deg)':'scale(1)'};transition:transform .15s">
          <span style="font-size:22px">${tp.emoji}</span>
          <span class="mono" style="color:#fff;font-size:16px;font-weight:700">${pkt.value}</span>
          ${State.effects.scanner ? `<span style="color:${tp.color};font-size:8px;letter-spacing:1px">${tp.type}</span>` : ''}
        </div>`;

      p.addEventListener('mousedown',  e => this._onPktDown(e, pkt.id));
      p.addEventListener('touchstart', e => { e.preventDefault(); this._onPktDown(e, pkt.id); }, {passive:false});
      layer.appendChild(p);
    });
  },

  _attachDragEvents() {
    const area = document.getElementById('classify-area');
    if (!area) return;
    area.addEventListener('mousemove',  e => this._onMove(e));
    area.addEventListener('mouseup',    e => this._onUp(e));
    area.addEventListener('touchmove',  e => { e.preventDefault(); this._onMove(e); }, {passive:false});
    area.addEventListener('touchend',   e => this._onUp(e));
  },

  _onPktDown(e, id) {
    e.preventDefault?.();
    this.draggingId = id;
    const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    this.dragPos = {x:cx, y:cy};
    this._renderPackets();
  },

  _onMove(e) {
    if (this.draggingId === null) return;
    const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    this.dragPos = {x:cx, y:cy};
    this._renderPackets();
    // Bin highlight
    const bins = document.querySelectorAll('[data-bin]');
    let near = null, bestD = 9999;
    bins.forEach(b => {
      const r = b.getBoundingClientRect();
      const dx = cx-(r.left+r.width/2), dy = cy-(r.top+r.height/2);
      const d = Math.sqrt(dx*dx+dy*dy);
      if (d < bestD) { bestD=d; near=b.dataset.bin; }
    });
    bins.forEach(b => {
      const active = bestD < 100 && b.dataset.bin === near;
      const tp = PACKET_TYPES.find(t => t.type === b.dataset.bin);
      b.style.background    = active ? tp.color+'22' : tp.bg;
      b.style.border        = `2px solid ${active ? tp.color : tp.color+'40'}`;
      b.style.transform     = active ? 'scale(1.09) translateY(-4px)' : 'scale(1)';
      b.style.boxShadow     = active ? `0 0 28px ${tp.glow},inset 0 0 18px ${tp.color}14` : 'none';
      // "SOLTE AQUI" text
      let hint = b.querySelector('.bin-hint');
      if (active) {
        if (!hint) { hint = document.createElement('div'); hint.className='bin-hint'; hint.style.cssText=`font-size:9px;color:${tp.color};margin-top:3px;animation:pulse .6s infinite`; hint.textContent='SOLTE AQUI!'; b.appendChild(hint); }
      } else { if(hint) hint.remove(); }
    });
  },

  _onUp(e) {
    if (this.draggingId === null) return;
    const cx = e.clientX ?? e.changedTouches?.[0]?.clientX ?? 0;
    const cy = e.clientY ?? e.changedTouches?.[0]?.clientY ?? 0;
    const pkt = this.packets.find(p => p.id === this.draggingId);
    const id = this.draggingId;
    this.draggingId = null;
    if (!pkt || pkt.done) { this._renderPackets(); return; }

    let dropped = null;
    document.querySelectorAll('[data-bin]').forEach(b => {
      const r = b.getBoundingClientRect();
      if (cx>=r.left && cx<=r.right && cy>=r.top && cy<=r.bottom) dropped=b.dataset.bin;
    });

    if (!dropped) { this._renderPackets(); return; }

    if (dropped === pkt.type) {
      State.earnScore(25); State.earnCoins(6);
      // Encyclopedia discovery
      if (!State.encyclopedia[pkt.type]) {
        State.encyclopedia[pkt.type] = true;
        UI.refreshHUD();
        setTimeout(() => UI.showEncycPopup(pkt.type), 300);
        State.addLog(`📖 Descoberto: ${pkt.type}!`, 'success');
      }
      State.streak++;
      if (State.streak % 3 === 0) { State.earnCoins(12); State.showToast(`🔥 Combo x${State.streak}! +12💰`, true); }
      State.addLog(`✅ "${pkt.value}" → ${dropped}`, 'success');
      State.showToast(`✅ ${dropped} correto! +25pts`, true);
      spawnParticle(cx, cy, '✅', '#69ff47');
      this.packets = this.packets.map(p => p.id===id ? {...p,done:true} : p);
      this.classifiedCnt++;
      if (this.classifiedCnt >= this.totalPkts) {
        setTimeout(() => this.nextRound(), 700);
      } else { this._renderClassify(); }
    } else {
      const phaseCfg = getCurrentPhase();
      State.takeDmg(phaseCfg.classify.wrongDmg, () => this.gameOver());
      State.streak = 0; UI.refreshHUD();
      State.addLog(`❌ "${pkt.value}" NÃO é ${dropped}! Era ${pkt.type}`, 'error');
      State.showToast(`❌ Era ${pkt.type}!`, false);
      spawnParticle(cx, cy, '❌', '#ff4444');
      this.packets = this.packets.map(p => p.id===id ? {...p,shake:true} : p);
      this._renderPackets();
      setTimeout(() => {
        this.packets = this.packets.map(p => p.id===id ? {...p,shake:false} : p);
        this._renderPackets();
      }, 500);
    }
  },

  // ══════════════════════════════════════════════
  //  MODO MISSION
  // ══════════════════════════════════════════════
  _startMission() {
    const m = getRnd(MISSIONS);
    const pl = PLANETS.find(p => p.id === m.planet);
    this.mission = {...m, planet:pl};
    this.beaming = false;
    State.addLog(`🚀 Missão: "${m.cargo}" → ${pl.name}`, 'info');
    this._renderMission();
  },

  _renderMission() {
    const m = this.mission;
    const planetDots = PLANETS.map(p => {
      const isT = p.id === m.planet.id;
      const glowColor = m.protocol === 'TCP' ? '#00e5ff' : '#ff6ec7';
      return `<div style="position:absolute;left:${p.x}%;top:${p.y}%;transform:translate(-50%,-50%);text-align:center;z-index:4;opacity:${isT?1:.35};transition:all .4s">
        <div style="font-size:${isT?46:30}px;${isT?`animation:float 2s ease-in-out infinite;filter:drop-shadow(0 0 16px ${glowColor})`:''}">
          ${p.emoji}
        </div>
        <div style="color:${isT?'#cce8ff':'#334455'};font-size:${isT?10:8}px;margin-top:2px">${p.name}</div>
      </div>`;
    }).join('');

    document.getElementById('mode-container').innerHTML = `
      <div style="flex:1;position:relative;overflow:hidden">
        <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,#081830 0%,#03060f 100%)"></div>
        <!-- Station -->
        <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:5;text-align:center;animation:float 3s ease-in-out infinite">
          <div style="font-size:56px;filter:drop-shadow(0 0 18px #00e5ff55)">🛰️</div>
          <div class="mono" style="color:#00e5ff44;font-size:8px;letter-spacing:3px;margin-top:2px">ESTAÇÃO</div>
        </div>
        <!-- Planets -->
        ${planetDots}
        <!-- Beam SVG -->
        <svg id="beam-svg" class="${this.beaming?'':'hidden'}" style="position:absolute;inset:0;width:100%;height:100%;z-index:3;pointer-events:none">
          <defs><marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#00e5ff"/></marker></defs>
          <line id="beam-line" x1="50%" y1="50%" x2="${m.planet.x}%" y2="${m.planet.y}%"
            stroke="#00e5ff" stroke-width="2.5" stroke-dasharray="14 6"
            style="animation:beamDash 1s linear infinite;stroke-dashoffset:120"/>
          <circle id="beam-circle" cx="${m.planet.x}%" cy="${m.planet.y}%" r="22"
            fill="none" stroke="#00e5ff" stroke-width="2" opacity=".4"
            style="animation:pulse 1s ease-in-out infinite"/>
        </svg>
        <!-- Mission card -->
        <div style="position:absolute;bottom:18px;left:50%;transform:translateX(-50%);z-index:10;background:rgba(5,12,32,.92);border:1px solid #00e5ff28;border-radius:20px;padding:18px 24px;text-align:center;max-width:400px;width:92%;backdrop-filter:blur(14px)">
          <div style="color:#4477aa;font-size:10px;letter-spacing:3px;margin-bottom:8px">MISSÃO ATIVA</div>
          <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:6px">
            <span style="font-size:30px">${m.icon}</span>
            <div>
              <div style="font-size:17px;font-weight:800">${m.cargo}</div>
              <div style="color:#7799bb;font-size:12px">→ ${m.planet.emoji} ${m.planet.name}</div>
            </div>
          </div>
          <div style="color:#ffd700;font-size:11px;padding:5px 10px;background:#ffd70010;border-radius:8px;margin-bottom:14px">💡 ${m.planet.desc}</div>
          <div id="mission-btns" style="display:flex;gap:10px;justify-content:center">
            <button class="btn" id="btn-tcp" style="background:#00e5ff14;border:2px solid #00e5ff44;color:#00e5ff;padding:13px 24px;font-size:16px;min-width:125px">
              📦 TCP<div style="font-size:9px;opacity:.65;margin-top:2px">Confirmação garantida</div>
            </button>
            <button class="btn" id="btn-udp" style="background:#ff6ec714;border:2px solid #ff6ec744;color:#ff6ec7;padding:13px 24px;font-size:16px;min-width:125px">
              ⚡ UDP<div style="font-size:9px;opacity:.65;margin-top:2px">Envio instantâneo</div>
            </button>
          </div>
          <div id="mission-sending" class="hidden" style="color:#7799bb;font-size:13px;animation:pulse 1s infinite">📡 Transmitindo…</div>
        </div>
      </div>`;

    document.getElementById('btn-tcp').onclick = () => this._sendPacket('TCP');
    document.getElementById('btn-udp').onclick = () => this._sendPacket('UDP');
  },

  _sendPacket(proto) {
    if (this.beaming) return;
    this.beaming = true;
    const ok = proto === this.mission.protocol;
    const color = ok ? '#69ff47' : '#ff4444';
    // Show beam
    const svg = document.getElementById('beam-svg');
    const line = document.getElementById('beam-line');
    const circle = document.getElementById('beam-circle');
    if (svg) svg.classList.remove('hidden');
    if (line) line.style.stroke = color;
    if (circle) circle.style.stroke = color;
    document.getElementById('mission-btns').classList.add('hidden');
    document.getElementById('mission-sending').classList.remove('hidden');
    setTimeout(() => {
      if (ok) {
        State.earnScore(this.mission.points); State.earnCoins(10); State.streak++;
        State.addLog(`✅ ${proto} correto! +${this.mission.points}pts`, 'success');
        State.showToast(`✅ ${proto} era o certo!`, true);
      } else {
        State.takeDmg(15, () => this.gameOver()); State.streak = 0; UI.refreshHUD();
        State.addLog(`❌ Era ${this.mission.protocol}! ${this.mission.planet.desc}`, 'error');
        State.showToast(`❌ Era ${this.mission.protocol}!`, false);
      }
      setTimeout(() => this.nextRound(), 1200);
    }, 1300);
  },

  // ══════════════════════════════════════════════
  //  MODO DEFENSE
  // ══════════════════════════════════════════════
  _startDefense() {
    const phaseCfg = getCurrentPhase();
    const defCfg   = phaseCfg.defense;
    this.defDuration = defCfg.duration;
    this.defTimer    = this.defDuration;
    this.threats = []; this.cryptoOn = !!State.effects.cryptokey;
    this.spawned = 0; this.noSecs = 0;
    State.addLog('⚠️ Defesa ativada!', 'warn');
    this._renderDefense();

    const maxSpawn   = defCfg.maxSpawn;
    const spawnDelay = defCfg.spawnDelay;

    State.timers.threatSpawn = setInterval(() => {
      if (this.spawned >= maxSpawn) { clearInterval(State.timers.threatSpawn); return; }
      this.spawned++;
      const th = getRnd(THREATS);
      const fromLeft = Math.random() < .5;
      this.threats.push({...th, uid:Date.now()+Math.random(),
        x:fromLeft?2:98, y:randInt(12,82), dir:fromLeft?1:-1, alive:true, exploding:false});
      this._updateThreatsDom();
    }, spawnDelay);

    State.timers.defCountdown = setInterval(() => {
      this.defTimer--;
      this._updateDefTimer();
      if (this.defTimer <= 0) this._endDefense();
    }, 1000);

    State.timers.noThreatRef = setInterval(() => {
      if (this.threats.filter(t => t.alive).length === 0 && this.spawned >= maxSpawn) {
        this.noSecs++;
        this._updateNoThreatLabel();
        if (this.noSecs >= 5) { clearInterval(State.timers.noThreatRef); this._endDefense(); }
      } else { this.noSecs = 0; this._updateNoThreatLabel(); }
    }, 1000);

    State.timers.moveInterval = setInterval(() => {
      this.threats = this.threats.map(th => {
        if (!th.alive || th.exploding) return th;
        const nx = th.x + th.dir * th.speed * 0.22;
        if (nx > 42 && nx < 58) {
          State.takeDmg(th.dmg, () => this.gameOver());
          State.addLog(`💥 ${th.name} atingiu a base! -${th.dmg}`, 'error');
          return {...th, alive:false};
        }
        return {...th, x:nx};
      }).filter(t => t.alive);
      this._updateThreatsDom();
    }, 80);
  },

  _renderDefense() {
    document.getElementById('mode-container').innerHTML = `
      <div id="defense-area" style="flex:1;position:relative;overflow:hidden;background:radial-gradient(ellipse at 50% 50%,#0a0622,#03060f)">
        <div style="position:absolute;top:0;left:0;right:0;height:4px;background:#111;z-index:10">
          <div id="def-timer-bar" style="height:100%;background:#69ff47;border-radius:2px;transition:width 1s linear;width:100%"></div>
        </div>
        <div style="position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:9;display:flex;gap:18px;align-items:center">
          <span id="def-timer-label" class="mono" style="color:#7799aa;font-size:12px">⏱️ ${this.defTimer}s</span>
          <span id="def-threat-count" class="mono" style="color:#69ff47;font-size:12px">⚡ 0</span>
          <span id="def-nothreat-label" class="mono" style="color:#ffd700;font-size:11px;display:none"></span>
        </div>
        <div style="position:absolute;top:34px;left:50%;transform:translateX(-50%);z-index:9;background:#ff444410;border:1px solid #ff444422;border-radius:8px;padding:4px 14px;font-size:10px;color:#ff9999;white-space:nowrap">
          ⚠️ Clique/toque nas ameaças! ${State.round % 10 === 9 ? '⚡ BOSS NA PRÓXIMA!' : ''}
        </div>
        <!-- Station -->
        <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:6;text-align:center">
          <div style="font-size:62px;filter:drop-shadow(0 0 22px #00e5ff66);animation:float 2.5s ease-in-out infinite">🛸</div>
          <div class="mono" style="color:#00e5ff33;font-size:8px;letter-spacing:3px">BASE</div>
          <div id="shield-ring" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:96px;height:96px;border-radius:50%;border:1.5px solid #00e5ff33;box-shadow:0 0 22px #00e5ff33,inset 0 0 18px #00e5ff14;animation:pulse 1.8s ease-in-out infinite;pointer-events:none;display:${(this.cryptoOn||State.effects.autofire)?'block':'none'}"></div>
        </div>
        <!-- Threats layer -->
        <div id="threats-layer" style="position:absolute;inset:0;z-index:8;pointer-events:none"></div>
        <!-- Controls -->
        <div style="position:absolute;bottom:16px;left:50%;transform:translateX(-50%);z-index:10;display:flex;gap:10px">
          <div class="card" style="padding:12px 14px;text-align:center;min-width:110px;opacity:.8">
            <div style="font-size:22px">🔥</div>
            <div style="color:#ff6b00;font-size:11px;font-weight:700">Firewall</div>
            <div style="color:#555;font-size:9px">Clique nas ameaças!</div>
            <div style="color:${State.effects.autofire?'#69ff47':'#444'};font-size:9px">${State.effects.autofire?'✅ Auto':'Manual'}</div>
          </div>
          <button class="btn" id="crypto-btn" style="background:${this.cryptoOn?'#00e5ff14':'rgba(255,255,255,.04)'};border:2px solid ${this.cryptoOn?'#00e5ff55':'rgba(255,255,255,.12)'};color:${this.cryptoOn?'#00e5ff':'#445566'};padding:12px 14px;min-width:110px">
            <div style="font-size:22px">🔐</div>
            <div style="font-size:11px;font-weight:700">Criptografia</div>
            <div style="font-size:9px">${this.cryptoOn?'✅ Ativa':'Toque p/ ativar'}</div>
          </button>
        </div>
      </div>`;

    document.getElementById('crypto-btn').onclick = () => {
      this.cryptoOn = !this.cryptoOn;
      const ring = document.getElementById('shield-ring');
      if (ring) ring.style.display = (this.cryptoOn || State.effects.autofire) ? 'block' : 'none';
      const btn = document.getElementById('crypto-btn');
      if (btn) {
        btn.style.background = this.cryptoOn ? '#00e5ff14' : 'rgba(255,255,255,.04)';
        btn.style.border = `2px solid ${this.cryptoOn ? '#00e5ff55' : 'rgba(255,255,255,.12)'}`;
        btn.style.color  = this.cryptoOn ? '#00e5ff' : '#445566';
        btn.innerHTML = `<div style="font-size:22px">🔐</div><div style="font-size:11px;font-weight:700">Criptografia</div><div style="font-size:9px">${this.cryptoOn?'✅ Ativa':'Toque p/ ativar'}</div>`;
      }
    };
  },

  _updateThreatsDom() {
    const layer = document.getElementById('threats-layer');
    if (!layer) return;
    const count = document.getElementById('def-threat-count');
    if (count) count.textContent = '⚡ ' + this.threats.filter(t=>t.alive).length;
    layer.style.pointerEvents = 'auto';

    // Reconcile DOM: only create/remove nodes as needed, never wipe all at once
    const alive = this.threats.filter(t => t.alive);
    const aliveUids = new Set(alive.map(t => String(t.uid)));

    // Remove nodes for threats that are gone
    Array.from(layer.children).forEach(el => {
      if (!aliveUids.has(el.dataset.uid)) el.remove();
    });

    alive.forEach(th => {
      const uidStr = String(th.uid);
      let d = layer.querySelector(`[data-uid="${uidStr}"]`);

      if (!d) {
        // First time we see this threat — create the node
        d = document.createElement('div');
        d.dataset.uid = uidStr;
        d.style.cssText = `position:absolute;left:${th.x}%;top:${th.y}%;transform:translate(-50%,-50%);z-index:8;cursor:crosshair;animation:threatIn .3s ease-out;transition:left .08s linear,top .08s linear`;
        d.innerHTML = `<div style="background:${th.color}18;border:2px solid ${th.color}77;border-radius:12px;padding:8px 12px;text-align:center;box-shadow:0 0 18px ${th.color}44">
          <div style="font-size:26px">${th.emoji}</div>
          <div class="mono" style="font-size:8px;color:${th.color};margin-top:2px">${th.name}</div>
          <div style="font-size:8px;color:#666">-${th.dmg}❤️</div>
        </div>`;
        d.addEventListener('click', e => { e.stopPropagation(); this._clickThreat(th.uid, e); });
        d.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); this._clickThreat(th.uid, e.touches[0]); }, {passive:false});
        layer.appendChild(d);
      } else if (th.exploding) {
        // Switch to explode animation once, without recreating the element
        if (d.dataset.exploding !== '1') {
          d.dataset.exploding = '1';
          d.style.animation = 'explodeOut .45s ease-out forwards';
          d.style.pointerEvents = 'none';
        }
      } else {
        // Just update position — no animation reset
        d.style.left = th.x + '%';
        d.style.top  = th.y + '%';
      }
    });
  },

  _clickThreat(uid, e) {
    const th = this.threats.find(t => t.uid === uid);
    if (!th || !th.alive) return;
    State.earnScore(20); State.earnCoins(4);
    State.addLog(`💥 ${th.name} destruído!`, 'success');
    spawnParticle(e.clientX, e.clientY, '💥', th.color);
    this.threats = this.threats.map(t => t.uid===uid ? {...t,alive:false,exploding:true} : t);
    this._updateThreatsDom();
    setTimeout(() => {
      this.threats = this.threats.filter(t => t.uid !== uid);
      this._updateThreatsDom();
    }, 450);
  },

  _updateDefTimer() {
    const bar = document.getElementById('def-timer-bar');
    const lbl = document.getElementById('def-timer-label');
    if (bar) bar.style.width = (this.defTimer / this.defDuration * 100) + '%';
    if (bar) bar.style.background = this.defTimer > 15 ? '#69ff47' : this.defTimer > 7 ? '#ffd700' : '#ff4444';
    if (lbl) { lbl.textContent = `⏱️ ${this.defTimer}s`; lbl.style.color = this.defTimer < 8 ? '#ff5555' : '#7799aa'; }
  },

  _updateNoThreatLabel() {
    const lbl = document.getElementById('def-nothreat-label');
    if (!lbl) return;
    if (this.noSecs > 0) {
      lbl.style.display = 'inline';
      lbl.textContent = `🏁 Fim em ${5 - this.noSecs}s…`;
    } else { lbl.style.display = 'none'; }
  },

  _endDefense() {
    State.clearDefense();
    this.threats = []; this.noSecs = 0;
    State.addLog('🏁 Defesa concluída!', 'success');
    setTimeout(() => this.nextRound(), 600);
  },

  // ══════════════════════════════════════════════
  //  SHOP
  // ══════════════════════════════════════════════
  buyItem(item) {
    if (State.coins < item.cost) { State.showToast('💸 Moedas insuficientes!', false); return; }
    State.coins -= item.cost;
    State.addLog(`🛒 Comprou: ${item.name}`, 'success');
    State.showToast(`✅ ${item.name}!`, true);
    if (item.id === 'shield') { State.energy = Math.min(100, State.energy + 25); UI.refreshHUD(); return; }
    if (item.id === 'autofire')  { State.effects.autofire  = true; setTimeout(()=>{State.effects.autofire =false;UI.refreshHUD();},30000); }
    else if (item.id === 'cryptokey') { State.effects.cryptokey = true; setTimeout(()=>{State.effects.cryptokey=false;UI.refreshHUD();},30000); }
    else if (item.id === 'x2coins')   { State.effects.x2coins   = true; setTimeout(()=>{State.effects.x2coins  =false;UI.refreshHUD();},60000); }
    else State.effects[item.id] = true;
    UI.refreshHUD();
  },
};
