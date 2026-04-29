// ═══════════════════════════════════════════════════
//  js/tutorial.js  –  Tutorial interativo
// ═══════════════════════════════════════════════════

const Tutorial = {
    active: false,
    step:   0,
  
    // Passos do tutorial — cada um é uma tela explicativa
    steps: [
      {
        icon: '🛰️',
        title: 'Bem-vindo ao Protocolo Galáxia!',
        text: 'Você é o operador de uma estação espacial que gerencia o tráfego de dados do sistema solar. Sua missão é garantir que os dados cheguem aos destinos corretos e proteger a base de ataques cibernéticos.',
        highlight: null,
      },
      {
        icon: '🌌',
        title: '10 Fases para Completar',
        text: 'O jogo tem 10 fases progressivas. Cada fase fica mais desafiadora: mais pacotes para classificar, mais ameaças para destruir e bosses mais poderosos. Complete todas as fases para vencer!',
        highlight: null,
      },
      {
        icon: '📦',
        title: 'Modo Classificação',
        text: 'Pacotes de dados aparecem na tela com um tipo (Integer, String, Boolean…). Você deve arrastá-los — ou no modo 1 dedo, tocá-los e depois tocar no destino correto — para as caixas certas. Cada acerto dá pontos; cada erro consome energia!',
        highlight: null,
      },
      {
        icon: '🚀',
        title: 'Modo Missão',
        text: 'Um planeta precisa receber dados. Você verá as características da missão e deve escolher o protocolo correto: TCP (confiável, com confirmação) ou UDP (rápido, sem garantia). Escolha errado e perde energia!',
        highlight: null,
      },
      {
        icon: '🛡️',
        title: 'Modo Defesa',
        text: 'Malwares, vírus e worms avançam em direção à sua base. Toque neles para destruí-los antes que cheguem! Use a Criptografia para criar um escudo e o Firewall para queimá-los. Se chegarem à base, você perde energia!',
        highlight: null,
      },
      {
        icon: '👾',
        title: 'Boss de Fase',
        text: 'A última rodada de cada fase (exceto a primeira) é um Boss! Ele é mais resistente e ataca com projéteis. Use o canhão para destruí-lo movendo o cursor/dedo e clicando para atirar. Derrote o Boss para avançar de fase!',
        highlight: null,
      },
      {
        icon: '⚡',
        title: 'Energia e Game Over',
        text: 'Sua barra de energia (mostrada no topo) é sua vida. Erros de classificação, missões erradas e ameaças que chegam à base consomem energia. Se chegar a zero, o jogo termina. Compre escudos na loja para recuperar energia!',
        highlight: null,
      },
      {
        icon: '🛒',
        title: 'A Loja',
        text: 'Ganhe moedas destruindo ameaças e completando rodadas. Use-as na Loja (🛒) para comprar: Escudo (+25% energia), Disparo Automático (destrói ameaças sozinho), Criptografia (escudo de 30s) e Multiplicador de moedas (2x por 60s).',
        highlight: null,
      },
      {
        icon: '♿',
        title: 'Modo 1 Dedo',
        text: 'Ative o Modo 1 Dedo nas configurações (⚙️) para jogar tudo com apenas um toque. No modo Classificação, toque em um pacote para selecioná-lo, depois toque no destino. Na Defesa, toque nas ameaças para destruí-las. No Boss, toque em qualquer lugar para atirar!',
        highlight: null,
      },
      {
        icon: '🎯',
        title: 'Pronto para jogar!',
        text: 'Você está pronto! Lembre-se: quanto mais fases completar com energia alta, maior será sua pontuação final (0 a 100). Boa sorte, Operador — a galáxia conta com você!',
        highlight: null,
      },
    ],
  
    // ── Abrir tutorial ──
    open(fromSettings = false) {
      this.active    = true;
      this.step      = 0;
      this.fromSettings = fromSettings;
      this._render();
      document.getElementById('screen-tutorial').classList.remove('hidden');
    },
  
    // ── Fechar tutorial ──
    close() {
      this.active = false;
      document.getElementById('screen-tutorial').classList.add('hidden');
      if (this.fromSettings) showScreen('settings');
    },
  
    // ── Avançar passo ──
    next() {
      if (this.step < this.steps.length - 1) {
        this.step++;
        this._render();
      } else {
        this.close();
      }
    },
  
    // ── Voltar passo ──
    prev() {
      if (this.step > 0) {
        this.step--;
        this._render();
      }
    },
  
    // ── Renderizar passo atual ──
    _render() {
      const s    = this.steps[this.step];
      const tot  = this.steps.length;
      const cur  = this.step + 1;
      const isLast = this.step === tot - 1;
  
      // Ícone e conteúdo
      document.getElementById('tut-icon').textContent  = s.icon;
      document.getElementById('tut-title').textContent = s.title;
      document.getElementById('tut-text').textContent  = s.text;
  
      // Pontos de progresso
      const dots = document.getElementById('tut-dots');
      dots.innerHTML = '';
      for (let i = 0; i < tot; i++) {
        const d = document.createElement('div');
        d.style.cssText = `width:${i===this.step?22:8}px;height:8px;border-radius:4px;background:${i===this.step?'#00e5ff':i<this.step?'#00e5ff55':'rgba(255,255,255,.15)'};transition:all .3s`;
        dots.appendChild(d);
      }
  
      // Botões
      document.getElementById('tut-btn-prev').style.visibility = this.step > 0 ? 'visible' : 'hidden';
      document.getElementById('tut-btn-next').textContent = isLast ? '✅ Entendido!' : 'Próximo →';
      document.getElementById('tut-counter').textContent  = `${cur} / ${tot}`;
    },
  };