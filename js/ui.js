// ═══════════════════════════════════════════════════
//  js/ui.js  –  Renderização de HUD, estrelas, modais
// ═══════════════════════════════════════════════════

const UI = {

  // ── Estrelas de fundo ──────────────────────────
  buildStars() {
    document.querySelectorAll('.stars-container').forEach(container => {
      container.innerHTML = '';
      for (let i = 0; i < 110; i++) {
        const s = document.createElement('div');
        const x = Math.random() * 100, y = Math.random() * 100;
        const size = Math.random() * 2.2 + 0.3;
        const opacity = Math.random() * 0.6 + 0.15;
        const dur = Math.random() * 4 + 2, del = Math.random() * 6;
        s.style.cssText = `
          position:absolute;left:${x}%;top:${y}%;
          width:${size}px;height:${size}px;border-radius:50%;
          background:#fff;opacity:${opacity};pointer-events:none;
          animation:twinkle ${dur}s ease-in-out ${del}s infinite;
        `;
        container.appendChild(s);
      }
    });
  },

  // ── HUD ───────────────────────────────────────
  refreshHUD() {
    const s = State;
    const set = (id, val) => { const e = document.getElementById(id); if(e) e.textContent = val; };
    set('hud-score',  s.score);
    set('hud-coins',  s.coins);
    set('hud-energy', s.energy + '%');
    set('hud-level',  'Nv' + s.level);
    set('hud-encyc',  Object.keys(s.encyclopedia).length + '/3');

    // Barra de energia
    const bar = document.getElementById('energy-bar');
    if (bar) {
      bar.style.width = s.energy + '%';
      bar.style.background = s.energy > 50 ? '#69ff47' : s.energy > 25 ? '#ffd700' : '#ff4444';
    }
    // Energia label cor
    const elbl = document.getElementById('hud-energy');
    if (elbl) elbl.style.color = s.energy > 50 ? '#69ff47' : s.energy > 25 ? '#ffd700' : '#ff4444';

    // Streak
    const stk = document.getElementById('hud-streak');
    if (stk) {
      stk.textContent = s.streak >= 3 ? '🔥×' + s.streak : '';
      stk.style.display = s.streak >= 3 ? 'inline' : 'none';
    }
    // Boss next warning — agora baseado na última rodada da fase
    const bossWarn = document.getElementById('hud-boss-warn');
    if (bossWarn) {
      const phaseCfg = getCurrentPhase();
      const show = phaseCfg.hasBoss && s.roundInPhase === phaseCfg.rounds - 2;
      bossWarn.style.display = show ? 'inline' : 'none';
    }
    // Effects badges
    const badges = document.getElementById('hud-effects');
    if (badges) {
      badges.innerHTML = '';
      Object.keys(s.effects).filter(k => s.effects[k]).forEach(k => {
        const b = document.createElement('span');
        b.textContent = k;
        b.style.cssText = 'background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:5px;padding:1px 7px;font-size:9px;color:#aac4dd;margin-right:4px;';
        badges.appendChild(b);
      });
    }

    // Barra de progresso de fases
    const phaseFill  = document.getElementById('hud-phase-fill');
    const phaseLabel = document.getElementById('hud-phase-label');
    const phaseCfg   = getCurrentPhase();
    if (phaseFill && phaseLabel) {
      const pct = Math.round((s.roundInPhase / phaseCfg.rounds) * 100);
      phaseFill.style.width = pct + '%';
      phaseLabel.textContent = `Fase ${s.phase}/${TOTAL_PHASES}`;
    }
  },

  // ── Transição entre fases ──────────────────────
  showPhaseTransition(phase, name, onDone) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:999;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      background:rgba(3,6,15,.92);backdrop-filter:blur(18px);
      animation:slideUp .5s ease-out;
    `;
    overlay.innerHTML = `
      <div style="text-align:center">
        <div style="font-size:13px;color:#00e5ff88;letter-spacing:6px;margin-bottom:10px">FASE ${phase - 1} CONCLUÍDA</div>
        <div style="font-size:52px;margin-bottom:14px">🌌</div>
        <div style="font-size:28px;font-weight:800;color:#00e5ff;letter-spacing:3px;margin-bottom:6px">FASE ${phase}</div>
        <div style="font-size:16px;color:#7799bb;margin-bottom:28px">${name}</div>
        <div id="phase-progress-dots" style="display:flex;gap:8px;justify-content:center;margin-bottom:24px">
          ${Array.from({length: TOTAL_PHASES}, (_, i) => {
            const done = i < phase - 1;
            const cur  = i === phase - 1;
            return `<div style="width:${cur?18:10}px;height:10px;border-radius:5px;background:${done?'#00e5ff':cur?'#ffd700':'rgba(255,255,255,.12)'};transition:all .4s"></div>`;
          }).join('')}
        </div>
        <div style="color:#334455;font-size:12px;animation:pulse 1s infinite">preparando missão…</div>
      </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => {
      overlay.style.animation = 'none';
      overlay.style.opacity   = '0';
      overlay.style.transition = 'opacity .4s';
      setTimeout(() => { overlay.remove(); onDone(); }, 420);
    }, 2200);
  },

  // ── Log no painel debug ───────────────────────
  refreshLog() {
    const container = document.getElementById('debug-log');
    if (!container) return;
    container.innerHTML = '';
    if (!State.log.length) {
      container.innerHTML = '<span style="color:#224422;font-size:10px">sem eventos…</span>';
      return;
    }
    State.log.forEach(e => {
      const d = document.createElement('div');
      d.style.cssText = `font-size:10px;padding:2.5px 0;border-bottom:1px solid rgba(0,255,0,.04);
        color:${e.type==='error'?'#ff5555':e.type==='success'?'#55ff55':e.type==='warn'?'#ffdd44':'#7799aa'};`;
      d.innerHTML = `<span style="color:#334433">[${e.t}]</span> ${e.msg}`;
      container.appendChild(d);
    });
  },

  // ── Modal genérico ────────────────────────────
  showModal(html) {
    const overlay = document.getElementById('modal-overlay');
    const box = document.getElementById('modal-box');
    box.innerHTML = html;
    overlay.classList.remove('hidden');
  },
  hideModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
  },

  // ── Enciclopédia popup ────────────────────────
  showEncycPopup(type) {
    const data = ENCYCLOPEDIA[type];
    if (!data) return;
    const exHtml = data.examples.map(ex =>
      `<span class="mono" style="background:${data.color}14;border:1px solid ${data.color}44;border-radius:8px;padding:3px 10px;font-size:12px;color:${data.color}">${ex}</span>`
    ).join(' ');
    UI.showModal(`
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-size:48px;margin-bottom:6px">${data.icon}</div>
        <div style="color:#aabbcc;font-size:10px;letter-spacing:4px;margin-bottom:4px">NOVA DESCOBERTA!</div>
        <h2 style="color:${data.color};font-size:20px;font-weight:900">${data.title}</h2>
      </div>
      <p style="color:#cce0ff;font-size:13px;line-height:1.7;margin-bottom:14px">${data.desc}</p>
      <div style="margin-bottom:14px">
        <div style="color:${data.color};font-size:11px;margin-bottom:6px;letter-spacing:2px">EXEMPLOS:</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${exHtml}</div>
      </div>
      <div style="background:rgba(255,255,255,.04);border-radius:10px;padding:10px 14px;margin-bottom:14px">
        <div style="color:#ffd700;font-size:11px;margin-bottom:4px">🌍 NO MUNDO REAL:</div>
        <p style="color:#a0c0dd;font-size:12px;line-height:1.6">${data.realWorld}</p>
      </div>
      <div style="background:#010e01;border-radius:10px;padding:10px 14px;margin-bottom:18px">
        <div style="color:#69ff47;font-size:11px;margin-bottom:6px">💻 CÓDIGO:</div>
        <pre class="mono" style="color:#a0ffb0;font-size:11px;line-height:1.8;white-space:pre-wrap">${data.code}</pre>
      </div>
      <button class="btn" onclick="UI.hideModal()" style="width:100%;background:linear-gradient(135deg,${data.color}22,${data.color}44);border:2px solid ${data.color};color:${data.color};font-size:15px;padding:12px;box-shadow:0 0 20px ${data.color}22">
        ✅ Adicionado à Enciclopédia!
      </button>
    `);
  },

  // ── Enciclopédia browser ──────────────────────
  showEncycBrowser() {
    const rows = PACKET_TYPES.map(tp => {
      const found = State.encyclopedia[tp.type];
      const data  = ENCYCLOPEDIA[tp.type];
      if (found) {
        return `<div class="card" style="padding:16px;margin-bottom:14px;border:1px solid ${tp.color}55">
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">
            <span style="font-size:30px">${data.icon}</span>
            <div>
              <div style="color:${tp.color};font-weight:800;font-size:15px">${data.title}</div>
              <div style="color:#7799aa;font-size:11px">✅ Descoberto!</div>
            </div>
          </div>
          <p style="color:#b0c8e0;font-size:12px;line-height:1.6;margin-bottom:8px">${data.desc}</p>
          <div style="background:#010e01;border-radius:8px;padding:8px 12px">
            <pre class="mono" style="color:#a0ffb0;font-size:10px;line-height:1.8">${data.code}</pre>
          </div>
        </div>`;
      } else {
        return `<div class="card" style="padding:16px;margin-bottom:14px;opacity:.4">
          <div style="display:flex;gap:10px;align-items:center">
            <span style="font-size:28px;filter:grayscale(1) opacity(.4)">❓</span>
            <div>
              <div style="color:#445566;font-size:14px">??? — Ainda não descoberto</div>
              <div style="color:#334455;font-size:11px">Classifique um pacote ${tp.label} para descobrir!</div>
            </div>
          </div>
        </div>`;
      }
    }).join('');

    UI.showModal(`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
        <h2 style="color:#ffd700;font-size:18px">📖 Enciclopédia de Variáveis</h2>
        <button class="btn" onclick="UI.hideModal()" style="background:rgba(255,255,255,.12);color:#aaa;font-size:13px;padding:6px 14px">✕ Fechar</button>
      </div>
      ${rows}
    `);
  },
};
