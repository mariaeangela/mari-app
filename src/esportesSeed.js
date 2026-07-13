// Sessão "Esportes" do Explorar — conteúdo de referência (regras, torneios,
// calendário) por esporte + um bloco "Acontecendo agora" que a Mari pede pra
// atualizar quando quiser. Só peça "atualiza os esportes" que eu revejo o AGORA
// (e a data abaixo) com o que está rolando na semana.
//
// Última atualização do "Acontecendo agora": 13 jul 2026.
export const ESPORTES_ATUALIZADO = '13 jul 2026';

export const ESPORTES = [
  {
    id: 'futebol', nome: 'Futebol', emoji: '⚽', cor: '#2e9e6b',
    escopo: 'só os grandes campeonatos',
    regras: [
      '11 contra 11, dois tempos de 45 min (+ acréscimos); vence quem faz mais gols.',
      'Impedimento: atacante à frente do penúltimo defensor no momento do passe.',
      'Faltas geram tiro livre ou pênalti; cartão amarelo (advertência) e vermelho (expulsão).',
      'Mata-mata empatado: prorrogação de 2×15 min e, persistindo, pênaltis.',
      'VAR revisa gols, pênaltis, vermelhos diretos e erro de identidade.',
    ],
    torneios: [
      { nome: 'Copa do Mundo FIFA', nota: 'seleções, de 4 em 4 anos — o maior de todos' },
      { nome: 'Champions League (UEFA)', nota: 'elite dos clubes europeus' },
      { nome: 'Libertadores (CONMEBOL)', nota: 'elite dos clubes sul-americanos' },
      { nome: 'Brasileirão Série A', nota: 'pontos corridos, 20 clubes' },
      { nome: 'Premier League · La Liga', nota: 'ligas nacionais mais fortes da Europa' },
      { nome: 'Copa América · Eurocopa', nota: 'seleções, continentais' },
    ],
    calendario: [
      'Copa do Mundo 2026: jun–jul, nos EUA, México e Canadá (48 seleções, formato novo).',
      'Champions/ligas europeias: agosto a maio.',
      'Brasileirão + Libertadores: abril a dezembro.',
    ],
  },
  {
    id: 'tenis', nome: 'Tênis', emoji: '🎾', cor: '#b6d43a',
    escopo: 'circuito ATP (masc.) e WTA (fem.)',
    regras: [
      'Pontuação por game: 15, 30, 40, game (vantagem se der 40–40 / “deuce”).',
      'Set: primeiro a 6 games com 2 de diferença; 6–6 vai a tie-break.',
      'Masculino nos Slams: melhor de 5 sets; o resto e o feminino: melhor de 3.',
      'Saque tem duas tentativas; bola pode quicar uma vez antes da devolução.',
      'Superfícies mudam o jogo: saibro (lento), grama (rápido) e quadra dura.',
    ],
    torneios: [
      { nome: 'Australian Open', nota: 'Grand Slam · quadra dura · janeiro' },
      { nome: 'Roland Garros', nota: 'Grand Slam · saibro · maio–junho' },
      { nome: 'Wimbledon', nota: 'Grand Slam · grama · junho–julho' },
      { nome: 'US Open', nota: 'Grand Slam · quadra dura · ago–set' },
      { nome: 'Masters 1000 / WTA 1000', nota: 'os maiores fora dos Slams' },
      { nome: 'ATP Finals · WTA Finals', nota: 'os 8 melhores do ano, em novembro' },
    ],
    calendario: [
      'Temporada quase o ano todo: começa na Austrália (jan) e fecha nas Finals (nov).',
      'Sequência dos Slams: Austrália → Roland Garros → Wimbledon → US Open.',
      'Grama (jun–jul) é curta; depois vem a série americana em quadra dura até o US Open.',
    ],
  },
  {
    id: 'ginastica', nome: 'Ginástica', emoji: '🤸', cor: '#c2548f',
    escopo: 'artística e rítmica (ambas olímpicas)',
    regras: [
      'Nota = Dificuldade (D, o valor dos elementos) + Execução (E, parte de 10 tira erros).',
      'Artística feminina: solo, trave, salto e barras assimétricas.',
      'Artística masculina: solo, cavalo, argolas, salto, barras paralelas e fixa.',
      'Rítmica: arco, bola, maças e fita, com música (individual e conjunto).',
      'Penaliza queda, passo fora do praticável, tempo e falhas de execução.',
    ],
    torneios: [
      { nome: 'Jogos Olímpicos', nota: 'o ápice, de 4 em 4 anos' },
      { nome: 'Campeonato Mundial (FIG)', nota: 'anual, exceto em ano olímpico' },
      { nome: 'Copa do Mundo FIG', nota: 'série de etapas ao longo do ano' },
      { nome: 'Pan-Americano · Continentais', nota: 'classificatórios regionais' },
    ],
    calendario: [
      'Copas do Mundo (etapas): concentradas entre março e julho.',
      'Mundial: costuma ser em outubro/novembro.',
      'Olimpíadas: próxima em 2028 (Los Angeles).',
    ],
  },
  {
    id: 'natacao', nome: 'Natação', emoji: '🏊', cor: '#4f9dd4',
    escopo: 'piscina (olímpica de 50 m e curta de 25 m)',
    regras: [
      'Quatro estilos: livre (crawl), costas, peito e borboleta.',
      'Medley combina os quatro estilos numa mesma prova (individual ou revezamento).',
      'Provas de 50 m a 1500 m; vence quem toca a borda primeiro.',
      'Saída antecipada = desclassificação; viradas e toques têm regras por estilo.',
      'Piscina de 25 m (“curta”) tem recordes próprios — mais viradas, tempos menores.',
    ],
    torneios: [
      { nome: 'Jogos Olímpicos', nota: 'piscina de 50 m, de 4 em 4 anos' },
      { nome: 'Mundial (World Aquatics)', nota: 'piscina de 50 m' },
      { nome: 'Mundial de piscina curta (25 m)', nota: 'versão de inverno' },
      { nome: 'Copa do Mundo (World Cup)', nota: 'circuito de etapas' },
    ],
    calendario: [
      'Temporada gira em torno do grande evento do ano (Mundial ou Olimpíada), no meio do ano.',
      'Etapas da Copa do Mundo: outono do hemisfério norte (out–nov).',
      'Mundial de piscina curta (25 m): dezembro.',
    ],
  },
  {
    id: 'skate', nome: 'Skate', emoji: '🛹', cor: '#f2a93b',
    escopo: 'street e park',
    regras: [
      'Street: pista com corrimãos, escadas e bordas; nota por manobras em obstáculos.',
      'Park: pista curva (bowl) com rampas; foca em altura, fluidez e combinações.',
      'Juízes dão nota por dificuldade, execução, variedade e consistência.',
      'Formato típico: voltas cronometradas + tentativas de manobra (“best trick”).',
      'Cair ou não completar a manobra derruba a nota da tentativa.',
    ],
    torneios: [
      { nome: 'Jogos Olímpicos', nota: 'street e park, desde Tóquio 2020' },
      { nome: 'SLS — Street League', nota: 'principal circuito de street' },
      { nome: 'X Games', nota: 'o clássico dos esportes radicais' },
      { nome: 'World Skate (Mundial)', nota: 'entidade que rege e classifica' },
    ],
    calendario: [
      'SLS 2026: Sydney (fev), EUA (abr–mai), Rio (ago), França (out), Tóquio (nov).',
      'X Games: Aspen (jan, inverno), Sacramento (jun), Japão (jul), New Orleans (jul).',
      'Olimpíadas: próxima em 2028 (Los Angeles).',
    ],
  },
  {
    id: 'basquete', nome: 'Basquete', emoji: '🏀', cor: '#e57b3a',
    escopo: 'NBA, Europa e seleções',
    regras: [
      '5 contra 5; cesta normal vale 2 pontos, de fora da linha vale 3, lance livre vale 1.',
      'NBA: 4 quartos de 12 min (FIBA: 4 de 10 min).',
      'Ataque tem 24 s para arremessar; regras de garrafão e passos.',
      'Faltas acumulam; excesso dá lances livres ao adversário.',
      'Empate no fim vai para a prorrogação (5 min), quantas forem necessárias.',
    ],
    torneios: [
      { nome: 'NBA', nota: 'a liga dos EUA — a mais forte do mundo' },
      { nome: 'EuroLeague', nota: 'elite dos clubes europeus' },
      { nome: 'NBB', nota: 'liga nacional do Brasil' },
      { nome: 'Copa do Mundo FIBA · Olimpíadas', nota: 'seleções' },
    ],
    calendario: [
      'NBA: temporada de outubro a junho (Finais em junho); depois vem o offseason.',
      'Julho na NBA: Summer League, draft e mercado de troca/contratações.',
      'NBB: outubro a maio.',
    ],
  },
  {
    id: 'volei', nome: 'Vôlei', emoji: '🏐', cor: '#3f6fb0',
    escopo: 'quadra (6×6)',
    regras: [
      '6 contra 6; cada equipe pode dar até 3 toques antes de mandar a bola de volta.',
      'Set vai até 25 pontos (com 2 de diferença); o 5º set decisivo vai a 15.',
      'Partida é melhor de 5 sets — quem faz 3 vence.',
      'Rally point: todo rali vale ponto, independentemente de quem sacou.',
      'Rodízio de posições a cada ponto reconquistado no saque; líbero é o defensor especialista.',
    ],
    torneios: [
      { nome: 'Liga das Nações (VNL)', nota: 'seleções, todo ano, no meio do ano' },
      { nome: 'Campeonato Mundial', nota: 'seleções' },
      { nome: 'Superliga', nota: 'liga nacional do Brasil (clubes)' },
      { nome: 'Olimpíadas', nota: 'seleções, de 4 em 4 anos' },
    ],
    calendario: [
      'VNL: fase preliminar em junho; fases finais em julho.',
      'Superliga (Brasil): novembro a abril.',
      'Mundial de clubes e seleções: variam conforme o ano.',
    ],
  },
];

// "Acontecendo agora" — o que dá pra assistir nesta semana (13 jul 2026).
// Peça "atualiza os esportes" que eu revejo esta lista.
export const ESPORTES_AGORA = [
  {
    esporte: 'futebol', emoji: '⚽', titulo: 'Copa do Mundo 2026 — reta final',
    destaque: true,
    quando: 'FINAL: dom 19/jul, 17h (Brasília) · MetLife Stadium, Nova Jersey',
    nota: 'Semifinais nesta semana; é a decisão do maior torneio do mundo, nos EUA/México/Canadá.',
  },
  {
    esporte: 'basquete', emoji: '🏀', titulo: 'NBA Summer League — Las Vegas',
    quando: '9 a 19/jul · rolando agora',
    nota: 'Vitrine das novidades da NBA (calouros e jovens) durante o offseason.',
  },
  {
    esporte: 'volei', emoji: '🏐', titulo: 'Liga das Nações (VNL) — rumo às finais',
    quando: 'Final feminina: Macau, 22–26/jul · masculina: Ningbo, 29/jul–2/ago',
    nota: 'Fase preliminar fechando agora; o Brasil costuma brigar pelo título.',
  },
  {
    esporte: 'tenis', emoji: '🎾', titulo: 'Pós-Wimbledon → série americana',
    quando: 'Wimbledon terminou 12/jul · próximo: quadra dura rumo ao US Open (ago–set)',
    nota: 'Fim da temporada de grama; começa a preparação em quadra dura nos EUA.',
  },
  {
    esporte: 'skate', emoji: '🛹', titulo: 'X Games New Orleans',
    quando: '24 a 26/jul',
    nota: 'Próxima grande parada do skate; antes teve a etapa do Japão (4–5/jul).',
  },
];
