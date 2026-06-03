// São Paulo seasons: Summer Dec-Feb, Autumn Mar-May, Winter Jun-Aug, Spring Sep-Nov
export function getSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 12 || month <= 2) return 'summer';
  if (month >= 3 && month <= 5) return 'autumn';
  if (month >= 6 && month <= 8) return 'winter';
  return 'spring';
}

export const SEASONS = {
  spring: {
    name: 'Primavera',
    emoji: '🌸',
    bg: '#fdf6f0',
    surface: '#fff9f5',
    card: '#ffffff',
    accent: '#c4607a',
    accentSoft: '#f5d6de',
    accentMid: '#e8a0b0',
    text: '#2d1f23',
    textMid: '#7a5560',
    textLight: '#b89aa0',
    border: '#f0dde3',
    gradient: 'linear-gradient(135deg, #fdf0f3 0%, #fdf6f0 50%, #f5f0fd 100%)',
    headerBg: 'rgba(253,246,240,0.92)',
  },
  summer: {
    name: 'Verão',
    emoji: '☀️',
    bg: '#fffbf0',
    surface: '#fff8e8',
    card: '#ffffff',
    accent: '#d4820a',
    accentSoft: '#fdecc8',
    accentMid: '#f5c878',
    text: '#2a1f0a',
    textMid: '#7a5a20',
    textLight: '#b89a60',
    border: '#f5e8c8',
    gradient: 'linear-gradient(135deg, #fffbf0 0%, #fdf5e0 50%, #fff8f0 100%)',
    headerBg: 'rgba(255,251,240,0.92)',
  },
  autumn: {
    name: 'Outono',
    emoji: '🍂',
    bg: '#faf5f0',
    surface: '#f8f0e8',
    card: '#ffffff',
    accent: '#a0522d',
    accentSoft: '#f0ddd0',
    accentMid: '#d4a080',
    text: '#2a1a0f',
    textMid: '#7a4a30',
    textLight: '#b08060',
    border: '#ecddd0',
    gradient: 'linear-gradient(135deg, #faf5f0 0%, #f8ede0 50%, #faf0e8 100%)',
    headerBg: 'rgba(250,245,240,0.92)',
  },
  winter: {
    name: 'Inverno',
    emoji: '❄️',
    bg: '#f0f4f8',
    surface: '#e8f0f8',
    card: '#ffffff',
    accent: '#3a6a9a',
    accentSoft: '#d0e4f5',
    accentMid: '#80aad4',
    text: '#0f1f2a',
    textMid: '#3a5570',
    textLight: '#7a9ab8',
    border: '#d0dce8',
    gradient: 'linear-gradient(135deg, #f0f4f8 0%, #e8eef8 50%, #f0f4fc 100%)',
    headerBg: 'rgba(240,244,248,0.92)',
  }
};

export const USER_PROFILE = {
  books: [
    'A Amiga Genial (Elena Ferrante)', 'Olhai os Lírios do Campo (Erico Verissimo)',
    'A Insustentável Leveza do Ser (Milan Kundera)', 'Harry Potter (J.K. Rowling)',
    'As Brasas (Sándor Márai)', 'Memórias Póstumas de Brás Cubas (Machado de Assis)',
    'Capitães da Areia (Jorge Amado)', 'Vidas Secas (Graciliano Ramos)',
    'As Intermitências da Morte (Saramago)', 'A Vegetariana (Han Kang)',
    'Crônica de uma Morte Anunciada (García Márquez)', 'Noites Brancas (Dostoiévski)',
    'O Cortiço (Aluísio Azevedo)', 'Meu Ano de Descanso e Relaxamento (Ottessa Moshfegh)',
    'O Pequeno Príncipe', 'As Vantagens de Ser Invisível',
  ],
  films: [
    'Retrato de uma Jovem em Chamas', 'Incêndios', 'Trilogia Before (Linklater)',
    'Aftersun', 'Past Lives', 'Parasite', 'La La Land', 'Moonrise Kingdom',
    'Mamma Mia', 'Lady Bird', 'Marriage Story', 'The Father', 'Black Swan',
    'Amelie', 'Boyhood', 'Sound of Metal', 'Pina', 'Cold War',
  ],
  artists: ['Adriana Varejão', 'Pina Bausch', 'Marina Abramovic'],
  music: ['Taylor Swift', 'Harry Styles', 'Olivia Dean', 'Rubel', 'Cícero'],
  cities: [
    'Praga', 'Budapeste', 'Paris', 'Londres', 'Roma', 'Veneza', 'Barcelona',
    'Madrid', 'Lisboa', 'Milão', 'Buenos Aires', 'Cusco', 'Lima', 'Bangkok',
    'Chiang Mai', 'Doha', 'Machu Picchu', 'Sevilha', 'Florença', 'Bruxelas',
    'Ouro Preto', 'Tiradentes', 'Inhotim', 'Salvador', 'Rio de Janeiro',
    'Paraty', 'Bariloche', 'Verona', 'Nápoles', 'Pompeia',
  ],
};

export const CONTENT_TYPES = [
  { id: 'artwork', label: 'Obra do Dia', emoji: '🎨' },
  { id: 'film', label: 'Cinema', emoji: '🎬' },
  { id: 'artist', label: 'Artista', emoji: '✨' },
  { id: 'city', label: 'Cidade', emoji: '📍' },
  { id: 'music', label: 'Música', emoji: '🎵' },
  { id: 'connection', label: 'Conexões', emoji: '📖' },
  { id: 'concept', label: 'Conceito', emoji: '🧠' },
  { id: 'chess', label: 'Xadrez', emoji: '♟️' },
  { id: 'context', label: 'Contexto', emoji: '🌍' },
  { id: 'letter', label: 'Cartas', emoji: '💌' },
  { id: 'movement', label: 'Movimentos', emoji: '🏛️' },
  { id: 'now', label: 'Agora', emoji: '⭐' },
];
