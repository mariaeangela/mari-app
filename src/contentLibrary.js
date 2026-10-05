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

// ---- Fundo da tela de entrada (set/2026) ----
// Pinturas e fotos antigas em DOMÍNIO PÚBLICO (Wikimedia Commons), uma por estação;
// viajando, a da cidade. Substituíram os círculos coloridos que flutuavam. `pos` é
// o recorte no celular (a tela é em pé e a maioria das obras é deitada).
const WM = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/';
export const ARTE_ESTACAO = {
  winter: { url: WM + '7/78/Claude_Monet_-_The_Magpie_-_Google_Art_Project.jpg/1280px-Claude_Monet_-_The_Magpie_-_Google_Art_Project.jpg',
    pos: '24% center', credito: 'Claude Monet, A pega (1869)' },
  spring: { url: WM + '6/68/Vincent_van_Gogh_-_Almond_blossom_-_Google_Art_Project.jpg/1280px-Vincent_van_Gogh_-_Almond_blossom_-_Google_Art_Project.jpg',
    pos: 'center', credito: 'Vincent van Gogh, Amendoeira em flor (1890)' },
  summer: { url: WM + '1/1b/Claude_Monet_-_Woman_with_a_Parasol_-_Madame_Monet_and_Her_Son_-_Google_Art_Project.jpg/1280px-Claude_Monet_-_Woman_with_a_Parasol_-_Madame_Monet_and_Her_Son_-_Google_Art_Project.jpg',
    pos: '50% 30%', credito: 'Claude Monet, Mulher com sombrinha (1875)' },
  autumn: { url: WM + '5/57/Levitan_Zolotaya_Osen.jpg/1280px-Levitan_Zolotaya_Osen.jpg',
    pos: '58% center', credito: 'Isaac Levitan, Outono dourado (1895)' },
};
// Cidades com imagens próprias — várias por cidade, e troca uma por DIA (a Mari
// pediu, set/2026: uma só cansava). São as da viagem que vem; as de NY e Chicago
// saíram em out/2026, depois da viagem. Fotos do Wikimedia Commons, com o nome de
// quem fez no crédito. Pra uma cidade nova, é só somar aqui; as outras ficam com
// a da estação.
const ARTE_CIDADE = [
  { cidade: 'Natal', re: /\bnatal\b/i, imagens: [
    { url: WM + '3/3c/Alex_Regis_Morro_do_Careca_Ponta_Negra_Natal_RN_%2839161823760%29.jpg/1280px-Alex_Regis_Morro_do_Careca_Ponta_Negra_Natal_RN_%2839161823760%29.jpg',
      pos: '30% center', credito: 'Ponta Negra e o Morro do Careca · foto de Alex Régis (MTur)' },
    { url: WM + '4/4e/Natal_-_Forte_dos_Reis_Magos.jpg/1280px-Natal_-_Forte_dos_Reis_Magos.jpg',
      pos: '40% center', credito: 'O Forte dos Reis Magos · foto de DlauriniJr (CC BY-SA 4.0)' },
    { url: WM + 'b/b7/Alex_Regis_Morro_do_Careca_Ponta_Negra_Natal_RN_%2840261556354%29.jpg/1280px-Alex_Regis_Morro_do_Careca_Ponta_Negra_Natal_RN_%2840261556354%29.jpg',
      pos: '35% center', credito: 'O Morro do Careca · foto de Alex Régis (MTur)' },
    { url: WM + '5/55/Dunas_de_Genipabu_-_RN.jpg/1280px-Dunas_de_Genipabu_-_RN.jpg',
      pos: 'center', credito: 'As dunas de Genipabu · foto de ReginaFaig (CC0)' },
    { url: WM + '1/1d/Ponte_Newton_Navarro_Natal_RN_BR.jpg/1280px-Ponte_Newton_Navarro_Natal_RN_BR.jpg',
      pos: '45% center', credito: 'A ponte Newton Navarro, sobre o rio Potengi · foto de Lisboaff (CC BY-SA 3.0)' },
    { url: WM + '0/06/Genipabu_2.jpg/1280px-Genipabu_2.jpg',
      pos: 'center', credito: 'Genipabu vista das dunas · foto de Fabricio Ferreira Silva (CC BY-SA 3.0)' },
  ] },
  { cidade: 'Pipa', re: /\bpipa\b|tibau do sul/i, imagens: [
    { url: WM + '3/3b/Humberto_Sales_Praia_do_Amor_Pipa_Tibau_do_Sul_RN_%2826690345177%29.jpg/1280px-Humberto_Sales_Praia_do_Amor_Pipa_Tibau_do_Sul_RN_%2826690345177%29.jpg',
      pos: 'center', credito: 'A Praia do Amor · foto de Humberto Sales (MTur)' },
    { url: WM + 'a/aa/Chapad%C3%A3o_de_Pipa.jpg/1280px-Chapad%C3%A3o_de_Pipa.jpg',
      pos: 'center', credito: 'O Chapadão · foto de Walter Britto Gaspar (CC BY-SA 4.0)' },
    { url: WM + '2/25/Baia_dos_Golfinhos_-_Pipa.jpg/1280px-Baia_dos_Golfinhos_-_Pipa.jpg',
      pos: 'center', credito: 'A Baía dos Golfinhos · foto de Gustavo Mitilene Cordeiro (CC BY-SA 4.0)' },
    { url: WM + '2/21/Humberto_Sales_Praia_do_Amor_Pipa_Tibau_do_Sul_RN_%2841558714051%29.jpg/1280px-Humberto_Sales_Praia_do_Amor_Pipa_Tibau_do_Sul_RN_%2841558714051%29.jpg',
      pos: '40% center', credito: 'A Praia do Amor vista do Chapadão · foto de Humberto Sales (MTur)' },
    { url: WM + 'd/db/Praia_dos_Golfinhos_-_Praia_de_Pipa_%28RN%29.JPG/1280px-Praia_dos_Golfinhos_-_Praia_de_Pipa_%28RN%29.JPG',
      pos: '70% center', credito: 'As falésias da Baía dos Golfinhos · foto de Fabiano Ferrari (CC BY-SA 3.0)' },
  ] },
];
// Qual imagem da cidade vale HOJE: gira pelo dia do ano (o mesmo o dia todo, em
// qualquer tela — entrada, bordas do computador).
const diaDoAno = (ymd) => {
  const [y, m, d] = String(ymd || '').split('-').map(Number);
  if (!y) return 0;
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000);
};
const imagemDoDia = (c, hoje) => ({ cidade: c.cidade, ...c.imagens[diaDoAno(hoje) % c.imagens.length] });
export const IMAGENS_DA_CIDADE = (nome) => ((ARTE_CIDADE.find(c => c.cidade === nome) || {}).imagens || []);

// A cidade que aparece PRIMEIRO no texto — e não a primeira desta lista.
// Deslocamento ("Natal → Pipa"): vale o destino, o que vem depois da seta.
function cidadeNoTexto(t) {
  const s = String(t || '');
  const trechos = s.includes('→') ? [s.slice(s.lastIndexOf('→')), s] : [s];
  for (const tr of trechos) {
    let melhor = null, pos = Infinity;
    for (const a of ARTE_CIDADE) { const i = tr.search(a.re); if (i >= 0 && i < pos) { pos = i; melhor = a; } }
    if (melhor) return melhor;
  }
  return null;
}
// Onde ela está HOJE: a programação de hoje diz; num dia sem pista, vale a do
// último dia que dizia (foi pra Pipa no dia 20 e o dia 22 está vazio: segue em
// Pipa). Antes de qualquer pista, a primeira cidade do cadastro da viagem.
function arteDaCidadeDeHoje(viagem, hoje) {
  const texto = (m) => [m.titulo, m.desc, m.maps].join(' ');
  const comDia = (viagem.mesas || []).filter(m => m && m.dia && !m.bucket);
  // dias anteriores, do mais recente pro mais antigo (e, no mesmo dia, do fim pro começo)
  const antes = comDia.map((m, i) => ({ m, i })).filter(x => x.m.dia < hoje)
    .sort((x, y) => y.m.dia.localeCompare(x.m.dia) || y.i - x.i).map(x => x.m);
  const textos = [
    ...comDia.filter(m => m.dia === hoje).map(texto),
    ...antes.map(texto),
    viagem.cidade || '',
  ];
  for (const t of textos) {
    const c = cidadeNoTexto(t);
    if (c) return imagemDoDia(c, hoje);
  }
  return null;
}
export function arteDaTelaDeEntrada(season, viagem, hoje) {
  return (viagem && arteDaCidadeDeHoje(viagem, hoje)) || ARTE_ESTACAO[season] || ARTE_ESTACAO.winter;
}
// A cidade em que ela está HOJE, numa viagem (a do dia, pela programação; senão a
// do cadastro da viagem). Usada na saudação da tela de entrada e da tela Hoje.
export function cidadeDoDia(viagem, hoje) {
  if (!viagem) return null;
  const c = arteDaCidadeDeHoje(viagem, hoje);
  return (c && c.cidade) || viagem.cidade;
}

// Estação no hemisfério SUL, pelas datas de virada de verdade (e não pelo mês
// cheio): 7 de setembro ainda é inverno aqui, a primavera só começa no dia 22.
// As viradas oscilam um dia de ano para ano; estas são as do calendário brasileiro.
export function getSeason(date = new Date()) {
  const md = (date.getMonth() + 1) * 100 + date.getDate();  // 907 = 7 de setembro
  if (md >= 1221 || md < 320) return 'summer';   // 21/12 → 19/03
  if (md < 621) return 'autumn';                 // 20/03 → 20/06
  if (md < 922) return 'winter';                 // 21/06 → 21/09
  return 'spring';                               // 22/09 → 20/12
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
