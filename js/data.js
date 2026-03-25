// ═══════════════════════════════════════════════════
//  js/data.js  –  Dados estáticos do jogo
// ═══════════════════════════════════════════════════

const PACKET_TYPES = [
  {
    type: "Integer", label: "Inteiro", color: "#00e5ff",
    glow: "#00e5ff55", emoji: "🔢", bg: "#00e5ff14",
    examples: ["42","7","-3","100","256","0","999","-15","88","3"],
  },
  {
    type: "String", label: "Texto", color: "#ff6ec7",
    glow: "#ff6ec755", emoji: "📝", bg: "#ff6ec714",
    examples: ["Marte","Missão","Terra","Olá","Nebulosa","Cometa","Saturno","Lua","Cosmos","Base"],
  },
  {
    type: "Boolean", label: "Lógico", color: "#69ff47",
    glow: "#69ff4755", emoji: "⚡", bg: "#69ff4714",
    examples: ["Sim","Não","True","False","Ativo","Inativo","Ligado","Ok","Erro","Stand-by"],
  },
];

const ENCYCLOPEDIA = {
  Integer: {
    title: "Integer — Número Inteiro", icon: "🔢", color: "#00e5ff",
    desc: "Um Integer é um número inteiro, sem casas decimais. Pode ser positivo, negativo ou zero.",
    examples: ["42","-7","0","1000"],
    realWorld: "Usamos Integer para contar itens, representar idades, pontuações de jogos ou quantidades de pacotes enviados.",
    code: "int score = 42;\nint lives = 3;\nint x = -15;",
  },
  String: {
    title: "String — Texto", icon: "📝", color: "#ff6ec7",
    desc: 'Uma String é qualquer sequência de caracteres — letras, palavras, frases. Sempre fica entre aspas ("...").',
    examples: ['"Olá Mundo"','"Marte"','"Missão Espacial"'],
    realWorld: "Usamos String para nomes, mensagens, endereços, títulos — qualquer informação textual.",
    code: 'String planet = "Marte";\nString msg = "Missão iniciada";\nString nome = "Astronauta";',
  },
  Boolean: {
    title: "Boolean — Verdadeiro ou Falso", icon: "⚡", color: "#69ff47",
    desc: "Um Boolean só pode ter dois valores: verdadeiro (true) ou falso (false). É como um interruptor: ligado ou desligado.",
    examples: ["true","false","Sim/Não","Ativo/Inativo"],
    realWorld: "Usamos Boolean para verificar se algo está ativo, se uma missão foi concluída, se o firewall está ligado.",
    code: "boolean firewall = true;\nboolean missionDone = false;\nboolean shieldOn = true;",
  },
};

const PLANETS = [
  { id:"mars",    name:"Marte",   emoji:"🔴", x:78, y:22, protocol:"TCP", desc:"Base científica – precisa de 100% precisão!" },
  { id:"saturn",  name:"Saturno", emoji:"🪐", x:85, y:65, protocol:"UDP", desc:"Estação de entretenimento – streaming!" },
  { id:"moon",    name:"Lua",     emoji:"🌕", x:60, y:78, protocol:"TCP", desc:"Hospital lunar – vidas dependem disso!" },
  { id:"jupiter", name:"Júpiter", emoji:"🟠", x:20, y:72, protocol:"UDP", desc:"Rádio espacial – música ao vivo!" },
  { id:"venus",   name:"Vênus",   emoji:"🌟", x:15, y:25, protocol:"TCP", desc:"Arquivo legal – documentos oficiais!" },
];

const MISSIONS = [
  { planet:"mars",    cargo:"Relatório Científico", icon:"🧪", protocol:"TCP", points:60 },
  { planet:"saturn",  cargo:"Streaming HD",          icon:"🎬", protocol:"UDP", points:40 },
  { planet:"moon",    cargo:"Dados Médicos",          icon:"🏥", protocol:"TCP", points:80 },
  { planet:"jupiter", cargo:"Transmissão Musical",   icon:"🎵", protocol:"UDP", points:40 },
  { planet:"venus",   cargo:"Contrato Galáctico",    icon:"📜", protocol:"TCP", points:70 },
  { planet:"mars",    cargo:"Vídeo ao Vivo",          icon:"📹", protocol:"UDP", points:45 },
];

const THREATS = [
  { id:"pirate",   name:"Nave Pirata",       emoji:"🏴‍☠️", color:"#ff4444", speed:0.9, dmg:20 },
  { id:"virus",    name:"Vírus Cibernético", emoji:"🦠",   color:"#ff6b00", speed:1.2, dmg:15 },
  { id:"malware",  name:"Malware",            emoji:"🐛",   color:"#cc44ff", speed:0.7, dmg:25 },
  { id:"asteroid", name:"Asteroide-Vírus",   emoji:"☄️",   color:"#ff9900", speed:1.5, dmg:10 },
];

const BOSSES = [
  {
    id:"overlord", name:"Senhor dos Vírus", emoji:"👾", color:"#ff00ff",
    maxHp:200, dmg:30, speed:0.4,
    attacks:[
      {type:"spread",  desc:"Chuva de projéteis em leque",    emoji:"💜"},
      {type:"laser",   desc:"Laser horizontal varrendo tela", emoji:"🟣"},
      {type:"spiral",  desc:"Espiral giratória de vírus",     emoji:"🌀"},
    ],
    reward:150,
  },
  {
    id:"darknet", name:"DarkNet Supremo", emoji:"🕳️", color:"#00ff88",
    maxHp:300, dmg:25, speed:0.3,
    attacks:[
      {type:"burst",  desc:"Explosão radial de malware",       emoji:"💚"},
      {type:"chase",  desc:"Vírus teleguiado que te persegue", emoji:"🔴"},
      {type:"wall",   desc:"Parede de bytes corrompidos",      emoji:"🟩"},
    ],
    reward:200,
  },
  {
    id:"rootkit", name:"ROOTKIT-X9", emoji:"🤖", color:"#ffaa00",
    maxHp:400, dmg:20, speed:0.5,
    attacks:[
      {type:"diagonal", desc:"Tiros diagonais cruzados",         emoji:"🟡"},
      {type:"homing",   desc:"Míssil inteligente",               emoji:"🎯"},
      {type:"storm",    desc:"Tempestade de dados corrompidos",  emoji:"🌪️"},
    ],
    reward:300,
  },
];

const SHOP_ITEMS = [
  {id:"shield",    name:"Escudo Quântico",       icon:"🛡️", desc:"Recupera 25 de energia",      cost:60 },
  {id:"autofire",  name:"Firewall Automático",   icon:"🔥", desc:"Dispara sozinho por 30s",      cost:100},
  {id:"cryptokey", name:"Chave de Criptografia", icon:"🔑", desc:"Criptografia grátis por 30s",  cost:90 },
  {id:"turbo",     name:"Turbo Envio",            icon:"⚡", desc:"+15 pts em cada missão",       cost:80 },
  {id:"scanner",   name:"Scanner de Dados",       icon:"🔭", desc:"Revela tipo do pacote",        cost:70 },
  {id:"x2coins",   name:"Multiplicador 2x",       icon:"💰", desc:"Dobra moedas por 60s",         cost:150},
];
