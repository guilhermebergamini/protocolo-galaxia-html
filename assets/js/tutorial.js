// ═══════════════════════════════════════════════════
//  js/tutorial.js  –  Tutorial interativo (10 passos)
// ═══════════════════════════════════════════════════

const Tutorial = {
  step: 0,
  fromSettings: false,

  steps: [
    { icon:'🛰️', title:'Bem-vindo ao Protocolo Galáxia!',
      text:'Você é o operador de uma estação espacial que gerencia o tráfego de dados do sistema solar. Proteja a base, classifique pacotes e complete as missões!',
      tip: null },
    { icon:'🌌', title:'10 Fases Progressivas',
      text:'O jogo tem 10 fases. Cada uma fica mais difícil: mais pacotes, mais ameaças e bosses mais poderosos. Complete todas as fases para ganhar pontuação máxima!',
      tip: '💡 Quanto mais fases completar com energia alta, maior sua nota final (0–100).' },
    { icon:'📦', title:'Classificação de Dados',
      text:'Pacotes aparecem com um tipo (Integer, String, Boolean…). Arraste-os para o contêiner correto. Acerto = pontos. Erro = perde energia!',
      tip: '♿ Modo 1 Dedo: toque no pacote para selecioná-lo, depois toque no destino.' },
    { icon:'🚀', title:'Missões de Envio',
      text:'Um planeta precisa receber dados. Escolha o protocolo certo: TCP (confiável, com confirmação) ou UDP (rápido, sem garantia). Leia a dica em amarelo!',
      tip: '♿ Modo 1 Dedo: toque em TCP ou UDP — os mesmos botões grandes na tela.' },
    { icon:'🛡️', title:'Defesa Cibernética',
      text:'Malwares avançam em direção à base. Toque neles para destruí-los! Use Criptografia (escudo) e Firewall. Se chegarem à base, você perde energia.',
      tip: '♿ Modo 1 Dedo: os botões no painel inferior listam as ameaças — toque para destruir.' },
    { icon:'👾', title:'Boss de Fase',
      text:'A última rodada de cada fase tem um Boss. Clique ou toque nele para atacar. Use WASD/setas — ou toque na arena — para esquivar dos projéteis.',
      tip: '♿ Modo 1 Dedo: botão "🔫 Atirar!" aparece no painel. Toque na arena para mover a nave.' },
    { icon:'⚡', title:'Energia e Vidas',
      text:'A barra de energia no topo é sua vida. Erros e ameaças a reduzem. Se zerar, é Game Over. Compre Escudo na Loja para recuperar +25% de energia!',
      tip: null },
    { icon:'🛒', title:'A Loja',
      text:'Ganhe moedas destruindo ameaças e completando rodadas. Compre: Escudo (+25% energia), Disparo Automático, Criptografia (30s) ou 2x Moedas (60s).',
      tip: null },
    { icon:'♿', title:'Modo 1 Dedo',
      text:'Nas Configurações (⚙️) ative o Modo 1 Dedo. Todo o jogo funcionará com um único toque — sem precisar arrastar. Ideal para qualquer tipo de deficiência motora.',
      tip: '💡 Atalhos: teclas 1–9 ativam as ações do painel inferior.' },
    { icon:'🎯', title:'Pronto para jogar!',
      text:'Você está pronto! Boa sorte, Operador — a galáxia conta com você. Use ⚙️ para acessar configurações e este tutorial a qualquer momento.',
      tip: null },
  ],

  open(fromSettings = false) {
    this.fromSettings = fromSettings;
    this.step = 0;
    this._render();
    showScreen('tutorial');
  },

  close() {
    showScreen(this.fromSettings ? 'settings' : 'menu');
  },

  next() {
    if (this.step < this.steps.length - 1) { this.step++; this._render(); }
    else this.close();
  },

  prev() {
    if (this.step > 0) { this.step--; this._render(); }
  },

  _render() {
    const s   = this.steps[this.step];
    const tot = this.steps.length;
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };

    set('tut-icon',    s.icon);
    set('tut-title',   s.title);
    set('tut-text',    s.text);

    const tipEl = document.getElementById('tut-tip');
    if (tipEl) {
      tipEl.textContent = s.tip || '';
      tipEl.style.display = s.tip ? 'block' : 'none';
    }

    // Dots
    const dots = document.getElementById('tut-dots');
    if (dots) {
      dots.innerHTML = '';
      for (let i = 0; i < tot; i++) {
        const d = document.createElement('div');
        const active = i === this.step;
        const done   = i < this.step;
        d.style.cssText = `width:${active?22:8}px;height:8px;border-radius:4px;
          background:${active?'#00e5ff':done?'#00e5ff55':'rgba(255,255,255,.15)'};transition:all .3s`;
        dots.appendChild(d);
      }
    }

    const btnPrev = document.getElementById('tut-btn-prev');
    const btnNext = document.getElementById('tut-btn-next');
    if (btnPrev) btnPrev.style.visibility = this.step > 0 ? 'visible' : 'hidden';
    if (btnNext) btnNext.textContent = this.step === tot-1 ? '✅ Entendido!' : 'Próximo →';

    const ctr = document.getElementById('tut-counter');
    if (ctr) ctr.textContent = `${this.step+1} / ${tot}`;
  },
};