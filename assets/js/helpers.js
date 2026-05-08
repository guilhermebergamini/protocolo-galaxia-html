// ═══════════════════════════════════════════════════
//  js/helpers.js  –  Funções utilitárias puras
// ═══════════════════════════════════════════════════=

const getRnd   = arr => arr[Math.floor(Math.random() * arr.length)];
const randInt  = (a,b) => Math.floor(Math.random() * (b - a + 1)) + a;
const clamp    = (v,a,b) => Math.max(a, Math.min(b, v));
const tstamp   = () => new Date().toLocaleTimeString();
const dist2D   = (a,b) => Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2);

/** Cria/atualiza um elemento; retorna o elemento. */
function el(tag, props = {}, ...children) {
  const e = document.createElement(tag);
  Object.entries(props).forEach(([k,v]) => {
    if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k === 'cls') e.className = v;
    else if (k === 'dataset') Object.entries(v).forEach(([dk,dv]) => e.dataset[dk] = dv);
    else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
    else e[k] = v;
  });
  children.flat().forEach(c => {
    if (c == null) return;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return e;
}

/** Mostra uma partícula/explosão visual em (x, y). */
function spawnParticle(x, y, emoji, color) {
  const p = document.createElement('div');
  p.textContent = emoji;
  p.style.cssText = `
    position:fixed; left:${x}px; top:${y}px;
    font-size:24px; pointer-events:none; z-index:900;
    filter:drop-shadow(0 0 8px ${color});
    animation:pop .7s ease-out forwards;
    transform:translate(-50%,-50%);
  `;
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 700);
}
