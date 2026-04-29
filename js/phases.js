// ═══════════════════════════════════════════════════
//  js/phases.js  –  Sistema de 10 Fases + Dificuldade
// ═══════════════════════════════════════════════════

// Cada fase define quantas rodadas ela tem e os parâmetros
// de dificuldade aplicados durante aquela fase.
// O boss ocorre sempre na ÚLTIMA rodada de cada fase (exceto fase 1).

const PHASES = [
  // Fase 1 — Iniciante: só classificação, sem boss, bem tranquilo
  {
    phase:        1,
    name:         'Inicialização',
    rounds:       3,
    hasBoss:      false,
    classify: {
      packetCount:  3,          // pacotes por rodada
      wrongDmg:     8,          // dano por erro
    },
    mission: {
      enabled:      false,
    },
    defense: {
      enabled:      false,
    },
    modeWeights: { classify: 1, mission: 0, defense: 0 },
  },
  // Fase 2 — Primeiros passos: classify + mission aparecem
  {
    phase:        2,
    name:         'Primeiras Transmissões',
    rounds:       4,
    hasBoss:      true,
    classify: {
      packetCount:  3,
      wrongDmg:     8,
    },
    mission: {
      enabled:      true,
    },
    defense: {
      enabled:      false,
      duration:     20,
      maxSpawn:     4,
      spawnDelay:   1400,
    },
    modeWeights: { classify: 0.7, mission: 0.3, defense: 0 },
  },
  // Fase 3 — Ameaças chegam
  {
    phase:        3,
    name:         'Primeiras Ameaças',
    rounds:       4,
    hasBoss:      true,
    classify: {
      packetCount:  4,
      wrongDmg:     10,
    },
    mission: {
      enabled:      true,
    },
    defense: {
      enabled:      true,
      duration:     22,
      maxSpawn:     5,
      spawnDelay:   1300,
    },
    modeWeights: { classify: 0.5, mission: 0.3, defense: 0.2 },
  },
  // Fase 4 — Equilíbrio
  {
    phase:        4,
    name:         'Equilíbrio de Forças',
    rounds:       5,
    hasBoss:      true,
    classify: {
      packetCount:  4,
      wrongDmg:     10,
    },
    mission: {
      enabled:      true,
    },
    defense: {
      enabled:      true,
      duration:     24,
      maxSpawn:     6,
      spawnDelay:   1200,
    },
    modeWeights: { classify: 0.4, mission: 0.3, defense: 0.3 },
  },
  // Fase 5 — Meio do jogo, dificuldade sobe
  {
    phase:        5,
    name:         'Ponto Crítico',
    rounds:       5,
    hasBoss:      true,
    classify: {
      packetCount:  5,
      wrongDmg:     12,
    },
    mission: {
      enabled:      true,
    },
    defense: {
      enabled:      true,
      duration:     26,
      maxSpawn:     7,
      spawnDelay:   1100,
    },
    modeWeights: { classify: 0.35, mission: 0.32, defense: 0.33 },
  },
  // Fase 6 — Pressão aumenta
  {
    phase:        6,
    name:         'Zona de Pressão',
    rounds:       5,
    hasBoss:      true,
    classify: {
      packetCount:  5,
      wrongDmg:     13,
    },
    mission: {
      enabled:      true,
    },
    defense: {
      enabled:      true,
      duration:     26,
      maxSpawn:     8,
      spawnDelay:   1000,
    },
    modeWeights: { classify: 0.3, mission: 0.32, defense: 0.38 },
  },
  // Fase 7 — Difícil
  {
    phase:        7,
    name:         'Território Inimigo',
    rounds:       6,
    hasBoss:      true,
    classify: {
      packetCount:  5,
      wrongDmg:     14,
    },
    mission: {
      enabled:      true,
    },
    defense: {
      enabled:      true,
      duration:     28,
      maxSpawn:     9,
      spawnDelay:   900,
    },
    modeWeights: { classify: 0.28, mission: 0.30, defense: 0.42 },
  },
  // Fase 8 — Muito difícil
  {
    phase:        8,
    name:         'Tempestade de Dados',
    rounds:       6,
    hasBoss:      true,
    classify: {
      packetCount:  6,
      wrongDmg:     15,
    },
    mission: {
      enabled:      true,
    },
    defense: {
      enabled:      true,
      duration:     30,
      maxSpawn:     10,
      spawnDelay:   800,
    },
    modeWeights: { classify: 0.25, mission: 0.28, defense: 0.47 },
  },
  // Fase 9 — Penúltima, quase no limite
  {
    phase:        9,
    name:         'Núcleo do Perigo',
    rounds:       6,
    hasBoss:      true,
    classify: {
      packetCount:  6,
      wrongDmg:     15,
    },
    mission: {
      enabled:      true,
    },
    defense: {
      enabled:      true,
      duration:     30,
      maxSpawn:     11,
      spawnDelay:   750,
    },
    modeWeights: { classify: 0.22, mission: 0.26, defense: 0.52 },
  },
  // Fase 10 — Boss final épico
  {
    phase:        10,
    name:         'Confronto Final',
    rounds:       7,
    hasBoss:      true,
    classify: {
      packetCount:  6,
      wrongDmg:     15,
    },
    mission: {
      enabled:      true,
    },
    defense: {
      enabled:      true,
      duration:     32,
      maxSpawn:     12,
      spawnDelay:   700,
    },
    modeWeights: { classify: 0.20, mission: 0.25, defense: 0.55 },
  },
];

const TOTAL_PHASES = PHASES.length; // 10

// ── Retorna o config da fase atual ─────────────────
function getCurrentPhase() {
  const idx = Math.min(State.phase - 1, TOTAL_PHASES - 1);
  return PHASES[idx];
}

// ── Calcula pontuação normalizada 0–100 ─────────────
// Baseada em: energia restante, fases completadas, score acumulado
// Score máximo teórico por fase = soma de pontos possíveis por rodada
function calcFinalScore() {
  const phasesCompleted = State.phase - 1; // fases totalmente concluídas
  const phaseProgress   = State.roundInPhase / (getCurrentPhase().rounds);

  // Porcentagem de progresso no jogo (0 a 1)
  const progressRatio = (phasesCompleted + phaseProgress) / TOTAL_PHASES;

  // Bônus de energia: até 15 pontos extras se terminar com vida alta
  const energyBonus = (State.energy / 100) * 15;

  // Score bruto normalizado: progresso (85 pts máx) + energia (15 pts)
  const raw = progressRatio * 85 + energyBonus;
  return Math.round(Math.max(0, Math.min(100, raw)));
}

// ── Escolhe modo com base nos pesos da fase ─────────
function pickMode(phaseCfg) {
  const w = phaseCfg.modeWeights;
  const r = Math.random();
  if (!phaseCfg.defense.enabled) {
    return r < w.classify / (w.classify + w.mission) ? 'classify' : 'mission';
  }
  if (!phaseCfg.mission.enabled) return 'classify';
  if (r < w.classify) return 'classify';
  if (r < w.classify + w.mission) return 'mission';
  return 'defense';
}

// ── Verifica se é a última rodada da fase (boss) ────
function isLastRoundOfPhase(phaseCfg) {
  return phaseCfg.hasBoss && State.roundInPhase >= phaseCfg.rounds - 1;
}
