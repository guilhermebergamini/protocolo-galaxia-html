// ═══════════════════════════════════════════════════
//  js/settings.js  –  Configurações persistentes
// ═══════════════════════════════════════════════════

const Settings = {
    // Áudio
    musicVolume:   0.5,   // 0.0 – 1.0
    sfxVolume:     0.8,
    musicMuted:    false,
    sfxMuted:      false,
  
    // Acessibilidade
    highContrast:  false,
    fontSize:      'normal',   // 'small' | 'normal' | 'large' | 'xlarge'
    oneFingerMode: false,      // modo 1 dedo ativo
  
    // ── Carregar do localStorage ──
    load() {
      try {
        const saved = JSON.parse(localStorage.getItem('galaxia_settings') || '{}');
        Object.assign(this, saved);
      } catch { /* ignora */ }
      this.apply();
    },
  
    // ── Salvar no localStorage ──
    save() {
      try {
        const { musicVolume, sfxVolume, musicMuted, sfxMuted,
                highContrast, fontSize, oneFingerMode } = this;
        localStorage.setItem('galaxia_settings', JSON.stringify(
          { musicVolume, sfxVolume, musicMuted, sfxMuted,
            highContrast, fontSize, oneFingerMode }
        ));
      } catch { /* ignora */ }
      this.apply();
    },
  
    // ── Aplicar no DOM ──
    apply() {
      const root = document.documentElement;
  
      // Alto contraste
      document.body.classList.toggle('high-contrast', this.highContrast);
  
      // Tamanho de fonte
      const sizeMap = { small: '12px', normal: '14px', large: '16px', xlarge: '19px' };
      root.style.setProperty('--base-font', sizeMap[this.fontSize] || '14px');
  
      // Modo 1 dedo
      document.body.classList.toggle('one-finger-mode', this.oneFingerMode);
  
      // Painel de 1 dedo
      const ofPanel = document.getElementById('one-finger-panel');
      if (ofPanel) ofPanel.style.display = this.oneFingerMode ? 'flex' : 'none';
    },
  };