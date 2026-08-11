// ============================================================
// DIAGONAL — CONTEÚDO CURADO v3
// Imagens via Wikimedia Commons (domínio público)
// ============================================================


// Fatos históricos por dia do ano (mês-dia como chave)

export function getTodayDefaultFact(now) {
  const facts = [
    "a palavra 'livro' vem do latim 'liber', que era a camada interna da casca da árvore onde os romanos escreviam.",
    "o azul ultramarino usado por Vermeer em suas pinturas custava mais caro que ouro — era lapislázuli moído importado do Afeganistão.",
    "Frida Kahlo e Diego Rivera se casaram duas vezes — divorciaram em 1939 e voltaram a casar em 1940.",
    "a Biblioteca de Alexandria tinha uma regra: todo navio que entrasse no porto do Egito devia entregar seus livros para serem copiados.",
    "Shakespeare inventou mais de 1.700 palavras que usamos até hoje, incluindo 'bedroom', 'lonely' e 'generous'.",
    "o primeiro romance da história foi escrito por uma mulher japonesa: Murasaki Shikibu, por volta do ano 1000.",
    "Beethoven compôs algumas de suas obras mais complexas já completamente surdo — ele sentia as vibrações pelo chão.",
    "o Louvre foi originalmente uma fortaleza medieval antes de virar palácio e depois museu.",
    "a Torre Eiffel cresce 15 centímetros no verão por causa da dilatação térmica do metal.",
  ];
  const day = Math.floor(Date.now() / 86400000);
  return facts[day % facts.length];
}

export const SEASON_THEMES = {
  spring: {
    name: 'Primavera',
    emoji: '🌸',
    greeting_bg: 'linear-gradient(160deg, #fff0f5 0%, #fdf6ff 50%, #f0fff4 100%)',
    accent: '#d4508a',
    accentLight: '#fce4ec',
    text: '#2d1020',
    sub: '#a06080',
    decoration: ['#f8bbd0','#e1bee7','#c8e6c9','#f3e5f5'],
    tagline: 'edição primavera',
  },
  summer: {
    name: 'Verão',
    emoji: '☀️',
    greeting_bg: 'linear-gradient(160deg, #fffde7 0%, #fff8e1 50%, #fff3e0 100%)',
    accent: '#e65100',
    accentLight: '#ffe0b2',
    text: '#1a0a00',
    sub: '#8d4e00',
    decoration: ['#ffcc02','#ffab40','#ff7043','#ffd54f'],
    tagline: 'edição verão',
  },
  autumn: {
    name: 'Outono',
    emoji: '🍂',
    greeting_bg: 'linear-gradient(160deg, #fbe9e7 0%, #fff8e1 50%, #efebe9 100%)',
    accent: '#bf360c',
    accentLight: '#ffccbc',
    text: '#1a0800',
    sub: '#8d3b00',
    decoration: ['#d84315','#e64a19','#bf360c','#ff7043'],
    tagline: 'edição outono',
  },
  winter: {
    name: 'Inverno',
    emoji: '❄️',
    greeting_bg: 'linear-gradient(160deg, #e3f2fd 0%, #f3e5f5 50%, #e8eaf6 100%)',
    accent: '#1565c0',
    accentLight: '#bbdefb',
    text: '#0a0f2a',
    sub: '#304878',
    decoration: ['#90caf9','#b39ddb','#80cbc4','#ce93d8'],
    tagline: 'edição inverno',
  },
};

export function getSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 12 || m <= 2) return 'summer';
  if (m >= 3 && m <= 5) return 'autumn';
  if (m >= 6 && m <= 8) return 'winter';
  return 'spring';
}

export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function getDayName() {
  const days = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
  return days[new Date().getDay()];
}

// Paletas expressivas por tipo de card
// 5 categorias consolidadas (era 18). Veja CATEGORY_SOURCES para o mapeamento.
export const CONTENT_TYPES = [
  { id: "texto",  label: "Texto",          emoji: "📖" },
  { id: "cartas", label: "Cartas",         emoji: "✉️" },
  { id: "imagem", label: "Imagem",         emoji: "🎨" },
  { id: "cena",   label: "Cena",           emoji: "🎬" },
  { id: "mito",   label: "Mito & Sagrado", emoji: "🏺" },
  { id: "mundo",  label: "Mundo",          emoji: "🌍" },
];

export const CARD_PALETTES = {
  // 5 categorias consolidadas
  texto:      { bg: '#f6f3ea', accent: '#7f671a', text: '#4a3d18', sub: '#8d7835', border: '#e6e1d1', tag: '#f6f3ea' },
  cartas:     { bg: '#f6eef0', accent: '#a8516a', text: '#5b2c3a', sub: '#a86678', border: '#e6d5da', tag: '#f6eef0' },
  imagem:     { bg: '#f1eaf6', accent: '#862acb', text: '#41205b', sub: '#965cc1', border: '#ddd1e6', tag: '#f1eaf6' },
  cena:       { bg: '#eaf2f6', accent: '#1f7398', text: '#20485b', sub: '#3b7d9b', border: '#d1dfe6', tag: '#eaf2f6' },
  mito:       { bg: '#f6efea', accent: '#98592a', text: '#5a3920', sub: '#9d6a43', border: '#e6dad1', tag: '#f6efea' },
  mundo:      { bg: '#eaf5f4', accent: '#2f746d', text: '#2c4e4b', sub: '#4c7f7b', border: '#d2e4e3', tag: '#eaf5f4' },
  // paletas antigas (mantidas p/ Salvos antigos)
  artwork:    { bg: '#f1eaf6', accent: '#862acb', text: '#41205b', sub: '#965cc1', border: '#ddd1e6', tag: '#f1eaf6' },
  cultura:    { bg: '#f6eaf2', accent: '#ba2690', text: '#5b204a', sub: '#bc4e9c', border: '#e6d1e0', tag: '#f6eaf2' },
  photography:{ bg: '#ecf0f3', accent: '#3e6c98', text: '#2c3e4e', sub: '#5c7b99', border: '#d6dbe1', tag: '#ecf0f3' },
  film:       { bg: '#eaf2f6', accent: '#1f7398', text: '#20485b', sub: '#3b7d9b', border: '#d1dfe6', tag: '#eaf2f6' },
  concept:    { bg: '#eaf6ea', accent: '#2c772c', text: '#265526', sub: '#458745', border: '#d1e6d1', tag: '#eaf6ea' },
  city:       { bg: '#f6edea', accent: '#b24624', text: '#5b2e20', sub: '#b15e43', border: '#e6d6d1', tag: '#f6edea' },
  letter:     { bg: '#f6f3ea', accent: '#7f671a', text: '#5b4d20', sub: '#8d7835', border: '#e6e1d1', tag: '#f6f3ea' },
  movement:   { bg: '#eaf4f6', accent: '#24757f', text: '#215359', sub: '#3e858e', border: '#d1e4e6', tag: '#eaf4f6' },
  artist:     { bg: '#f6eaee', accent: '#c12a5d', text: '#5b2034', sub: '#bc4e73', border: '#e6d1d8', tag: '#f6eaee' },
  music:      { bg: '#f6f1ea', accent: '#90621d', text: '#5b4320', sub: '#946f38', border: '#e6ddd1', tag: '#f6f1ea' },
  connection: { bg: '#ebf5eb', accent: '#327b35', text: '#2c4e2d', sub: '#508653', border: '#d3e3d4', tag: '#ebf5eb' },
  chess:      { bg: '#f6f2ea', accent: '#81672c', text: '#564724', sub: '#897443', border: '#e6e0d1', tag: '#f6f2ea' },
  context:    { bg: '#f4eaf6', accent: '#9844a7', text: '#4a2b50', sub: '#975fa0', border: '#e2d1e5', tag: '#f4eaf6' },
  now:        { bg: '#eaf5f4', accent: '#2f746d', text: '#2c4e4b', sub: '#4c7f7b', border: '#d2e4e3', tag: '#eaf5f4' },
  philosophy: { bg: '#eaebf6', accent: '#2a37cb', text: '#20255b', sub: '#5c65c1', border: '#d1d2e6', tag: '#eaebf6' },
  health:     { bg: '#eaf6f2', accent: '#22775f', text: '#215949', sub: '#3b8671', border: '#d1e6e0', tag: '#eaf6f2' },
  bible:      { bg: '#f6f1ea', accent: '#876331', text: '#554125', sub: '#8e7148', border: '#e6ddd1', tag: '#f6f1ea' },
  religion:   { bg: '#f6eaec', accent: '#b93c52', text: '#57232c', sub: '#b15868', border: '#e6d1d4', tag: '#f6eaec' },
  mythology:  { bg: '#f6efea', accent: '#98592a', text: '#5a3920', sub: '#9d6a43', border: '#e6dad1', tag: '#f6efea' },
};

export function getEditionPeriod() {
  // Nova edição às 6h e às 14h, todos os dias
  const now = new Date();
  const dayNum = Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000);
  const h = now.getHours();
  if (h < 6) return dayNum * 2 - 1;      // madrugada: edição da tarde anterior
  if (h < 14) return dayNum * 2;          // manhã (6h-14h)
  return dayNum * 2 + 1;                   // tarde/noite (14h-6h)
}

// ---- Carregadores das frases e fatos (chegam depois da tela) ----
// O conteúdo pesado mora em `frasesEfatos.js` e só é baixado quando alguém pede.
// Devolvem promessa; quem chama mostra a tela primeiro e preenche quando chegar.
export async function carregarFraseDoDia() {
  const m = await import('./frasesEfatos.js');
  return m.getTodayQuote();
}
export async function carregarFatoDoDia() {
  const m = await import('./frasesEfatos.js');
  return m.getTodayFact();
}
