// Sessão "Esportes" do Explorar — conteúdo de referência por esporte:
// regras, e para cada competição O QUE É + QUANDO (datas de 2026) + ONDE ASSISTIR
// no Brasil. No topo, um bloco "Acontecendo agora" com o que dá pra ver na semana.
//
// A Mari pede pra atualizar quando quiser ("atualiza os esportes"): revejo o
// ESPORTES_AGORA, as datas das competições e a constante ESPORTES_ATUALIZADO.
// Última atualização do "Acontecendo agora": 13 jul 2026.
export const ESPORTES_ATUALIZADO = '13 jul 2026';

export const ESPORTES = [
  {
    id: 'futebol', nome: 'Futebol', emoji: '⚽', cor: '#2e9e6b',
    escopo: 'só os grandes campeonatos',
    regras: [
      '11 contra 11, dois tempos de 45 min (+ acréscimos); vence quem faz mais gols.',
      'Impedimento: atacante à frente do penúltimo defensor no momento do passe.',
      'Faltas geram tiro livre ou pênalti; amarelo adverte, vermelho expulsa.',
      'Mata-mata empatado: prorrogação de 2×15 min e, seguindo igual, pênaltis.',
      'VAR revisa gols, pênaltis, vermelhos diretos e erro de identidade.',
    ],
    competicoes: [
      { nome: 'Copa do Mundo FIFA', oque: 'O maior torneio de seleções, de 4 em 4 anos. Em 2026 são 48 seleções, nos EUA, México e Canadá.', quando: '11/jun a 19/jul/2026 · final 19/jul (Nova Jersey)', assistir: 'Globo, SporTV, SBT e CazéTV (grátis no YouTube)' },
      { nome: 'Champions League (UEFA)', oque: 'O mata-mata dos melhores clubes da Europa — o título de clubes mais cobiçado.', quando: 'Setembro a maio · final 30/mai (Budapeste, em 2026)', assistir: 'HBO Max e TNT Sports' },
      { nome: 'Libertadores (CONMEBOL)', oque: 'A “Champions” da América do Sul: os melhores clubes do continente.', quando: 'Fevereiro a novembro · final em nov', assistir: 'Globo (aberta/GE TV), ESPN/Disney+ e Paramount+' },
      { nome: 'Brasileirão Série A', oque: 'A liga nacional, por pontos corridos, com 20 clubes.', quando: 'Abril a dezembro', assistir: 'Globo/Record, Premiere, Prime Video e CazéTV' },
      { nome: 'Premier League e La Liga', oque: 'As ligas nacionais mais fortes da Europa (Inglaterra e Espanha).', quando: 'Agosto a maio', assistir: 'ESPN e Disney+' },
    ],
  },
  {
    id: 'tenis', nome: 'Tênis', emoji: '🎾', cor: '#b6d43a',
    escopo: 'circuito ATP (masc.) e WTA (fem.)',
    regras: [
      'Pontos do game: 15, 30, 40, game (vantagem no 40–40, o “deuce”).',
      'Set: primeiro a 6 games com 2 de diferença; 6–6 vai a tie-break.',
      'Nos Slams o masculino é melhor de 5 sets; o resto e o feminino, melhor de 3.',
      'Duas tentativas de saque; a bola pode quicar uma vez antes da devolução.',
      'A superfície muda o jogo: saibro (lento), grama (rápido) e quadra dura.',
    ],
    competicoes: [
      { nome: 'Australian Open', oque: 'O 1º Grand Slam do ano, em quadra dura, em Melbourne.', quando: '12/jan a 1/fev/2026', assistir: 'ESPN e Disney+' },
      { nome: 'Roland Garros', oque: 'Grand Slam no saibro, em Paris — o mais desgastante fisicamente.', quando: '24/mai a 7/jun/2026', assistir: 'ESPN e Disney+' },
      { nome: 'Wimbledon', oque: 'Grand Slam na grama, em Londres — o mais tradicional de todos.', quando: '29/jun a 12/jul/2026', assistir: 'ESPN e Disney+' },
      { nome: 'US Open', oque: 'O último Grand Slam do ano, em quadra dura, em Nova York.', quando: '31/ago a 13/set/2026', assistir: 'ESPN e Disney+' },
      { nome: 'ATP Finals e WTA Finals', oque: 'O torneio de encerramento, só com os 8 melhores do ano.', quando: 'Novembro/2026', assistir: 'ESPN e Disney+' },
    ],
  },
  {
    id: 'ginastica', nome: 'Ginástica', emoji: '🤸', cor: '#c2548f',
    escopo: 'artística e rítmica (ambas olímpicas)',
    regras: [
      'Nota = Dificuldade (D, valor dos elementos) + Execução (E, começa em 10 e tira erros).',
      'Artística feminina: solo, trave, salto e barras assimétricas.',
      'Artística masculina: solo, cavalo, argolas, salto, paralelas e barra fixa.',
      'Rítmica: arco, bola, maças e fita, com música (individual e conjunto).',
      'Penaliza queda, passo fora do praticável, tempo e falhas de execução.',
    ],
    competicoes: [
      { nome: 'Mundial de Ginástica Rítmica', oque: 'A principal competição da rítmica (arco, bola, maças e fita).', quando: '12 a 16/ago/2026 · Frankfurt (Alemanha)', assistir: 'SporTV e Globoplay' },
      { nome: 'Mundial de Ginástica Artística', oque: 'A principal competição da artística (solo, trave, barras, salto…).', quando: '17 a 25/out/2026 · Roterdã (Holanda)', assistir: 'SporTV e Globoplay' },
      { nome: 'Copa do Mundo FIG (etapas)', oque: 'Série de etapas pelo mundo que valem ranking ao longo do ano.', quando: 'Março a julho/2026', assistir: 'SporTV e canais da FIG' },
      { nome: 'Jogos Olímpicos', oque: 'O ápice da modalidade, de 4 em 4 anos.', quando: 'Próxima: 2028 (Los Angeles)', assistir: 'Globo e SporTV' },
    ],
  },
  {
    id: 'natacao', nome: 'Natação', emoji: '🏊', cor: '#4f9dd4',
    escopo: 'piscina (olímpica de 50 m e curta de 25 m)',
    regras: [
      'Quatro estilos: livre (crawl), costas, peito e borboleta.',
      'O medley combina os quatro estilos (prova individual ou revezamento).',
      'Provas de 50 m a 1500 m; vence quem toca a borda primeiro.',
      'Saída antecipada desclassifica; viradas e toques têm regra por estilo.',
      'Piscina de 25 m (“curta”) tem recordes próprios — mais viradas, tempos menores.',
    ],
    competicoes: [
      { nome: 'Mundial de piscina curta (25 m)', oque: 'O Mundial em piscina de 25 m — mais viradas e tempos mais rápidos.', quando: '1 a 6/dez/2026 · Pequim (Water Cube)', assistir: 'SporTV e Globoplay' },
      { nome: 'Mundial (World Aquatics, 50 m)', oque: 'O grande Mundial, disputado em piscina olímpica de 50 m.', quando: 'Meio do ano (varia por edição)', assistir: 'SporTV e Globoplay' },
      { nome: 'Copa do Mundo (World Cup)', oque: 'Circuito de etapas ao longo da temporada.', quando: 'Outubro a novembro', assistir: 'SporTV e World Aquatics' },
      { nome: 'Jogos Olímpicos', oque: 'Piscina de 50 m, de 4 em 4 anos.', quando: 'Próxima: 2028 (Los Angeles)', assistir: 'Globo e SporTV' },
    ],
  },
  {
    id: 'skate', nome: 'Skate', emoji: '🛹', cor: '#f2a93b',
    escopo: 'street e park',
    regras: [
      'Street: pista com corrimãos, escadas e bordas; nota por manobras nos obstáculos.',
      'Park: pista curva (bowl) com rampas; foca em altura, fluidez e combinações.',
      'Juízes dão nota por dificuldade, execução, variedade e consistência.',
      'Formato típico: voltas cronometradas + tentativas de manobra (“best trick”).',
      'Cair ou não completar a manobra derruba a nota da tentativa.',
    ],
    competicoes: [
      { nome: 'Mundial de Skate (World Skate)', oque: 'O Mundial de street — e o Brasil é potência (Rayssa Leal, Kelvin Hoefler).', quando: 'Julho/2026, em São Paulo', assistir: 'Globo e SporTV' },
      { nome: 'SLS — Street League', oque: 'O principal circuito profissional de street, com etapa no Brasil.', quando: 'SLS Rio: 9/ago/2026 (Maracanãzinho)', assistir: 'Rumble (grátis) e SporTV' },
      { nome: 'X Games', oque: 'O clássico dos esportes radicais (street e park).', quando: 'New Orleans: 24 a 26/jul/2026', assistir: 'ESPN e Disney+' },
      { nome: 'Jogos Olímpicos', oque: 'Street e park, no programa olímpico desde Tóquio 2020.', quando: 'Próxima: 2028 (Los Angeles)', assistir: 'Globo e SporTV' },
    ],
  },
  {
    id: 'basquete', nome: 'Basquete', emoji: '🏀', cor: '#e57b3a',
    escopo: 'NBA, Europa e seleções',
    regras: [
      '5 contra 5; cesta normal vale 2, de fora da linha vale 3, lance livre vale 1.',
      'NBA: 4 quartos de 12 min (na FIBA são 4 de 10 min).',
      'O ataque tem 24 s para arremessar; há regras de garrafão e de passos.',
      'Faltas acumulam; passando do limite, o adversário ganha lances livres.',
      'Empate no fim vai para a prorrogação (5 min), quantas forem necessárias.',
    ],
    competicoes: [
      { nome: 'NBA', oque: 'A liga dos EUA — a mais forte do mundo, com os melhores jogadores.', quando: 'Temporada out/2026 a abr/2027 · playoffs até jun', assistir: 'ESPN, Disney+ e Prime Video' },
      { nome: 'NBA Summer League', oque: 'A vitrine dos calouros e jovens no offseason, em Las Vegas.', quando: '9 a 19/jul/2026', assistir: 'ESPN e Disney+' },
      { nome: 'NBB', oque: 'A liga nacional de clubes do Brasil.', quando: 'Outubro a maio', assistir: 'SporTV, Band e YouTube (LNB)' },
      { nome: 'Copa do Mundo FIBA e Olimpíadas', oque: 'Os grandes torneios de seleções.', quando: 'Olimpíadas: 2028 (Los Angeles)', assistir: 'Globo e SporTV' },
    ],
  },
  {
    id: 'volei', nome: 'Vôlei', emoji: '🏐', cor: '#3f6fb0',
    escopo: 'quadra (6×6)',
    regras: [
      '6 contra 6; cada equipe pode dar até 3 toques antes de devolver a bola.',
      'O set vai até 25 pontos (com 2 de diferença); o 5º set decisivo vai a 15.',
      'A partida é melhor de 5 sets — quem faz 3 vence.',
      'Rally point: todo rali vale ponto, tenha sacado ou não.',
      'Rodízio de posições ao reconquistar o saque; o líbero é o defensor especialista.',
    ],
    competicoes: [
      { nome: 'Liga das Nações (VNL)', oque: 'O principal torneio anual de seleções; o Brasil sedia parte, em Brasília.', quando: 'Jun a ago/2026 · finais: fem. 22–26/jul (Macau), masc. 29/jul–2/ago (Ningbo)', assistir: 'SporTV, GE TV e VBTV' },
      { nome: 'Superliga', oque: 'A liga nacional de clubes do Brasil (masculina e feminina).', quando: 'Novembro a abril', assistir: 'SporTV e Globo' },
      { nome: 'Campeonato Mundial', oque: 'O Mundial de seleções.', quando: 'Edições específicas (calendário FIVB)', assistir: 'SporTV e VBTV' },
      { nome: 'Jogos Olímpicos', oque: 'Seleções, de 4 em 4 anos.', quando: 'Próxima: 2028 (Los Angeles)', assistir: 'Globo e SporTV' },
    ],
  },
];

// AGENDA dia a dia — cada jogo/sessão com data, horário (Brasília) e onde assistir.
// É isto que aparece no topo agrupado em Hoje / Amanhã / dia da semana.
// Peça "atualiza os esportes" que eu revejo os jogos dos próximos dias.
// (Datas de referência: 13 jul 2026. Confrontos da Copa já definidos até as semis;
//  final e 3º lugar dependem dos vencedores das semifinais.)
export const ESPORTES_AGENDA = [
  // Segunda 13/jul
  { data: '2026-07-13', hora: '', esporte: 'basquete', emoji: '🏀', titulo: 'NBA Summer League — rodada do dia', sub: 'Vários jogos · Las Vegas', assistir: 'ESPN e Disney+' },
  { data: '2026-07-13', hora: '', esporte: 'tenis', emoji: '🎾', titulo: 'ATP 250: Gstaad, Båstad e Umag', sub: 'Circuito no saibro (pós-Wimbledon) · a semana toda', assistir: 'ESPN e Disney+' },

  // Terça 14/jul
  { data: '2026-07-14', hora: '16:00', esporte: 'futebol', emoji: '⚽', titulo: 'França × Espanha', sub: 'Semifinal da Copa do Mundo · Dallas', assistir: 'Globo, SporTV, SBT e CazéTV', destaque: true },
  { data: '2026-07-14', hora: '20:00', esporte: 'basquete', emoji: '🏀', titulo: 'Utah Jazz × Golden State Warriors', sub: 'NBA Summer League · Las Vegas', assistir: 'ESPN' },
  { data: '2026-07-14', hora: '21:00', esporte: 'basquete', emoji: '🏀', titulo: 'Chicago Bulls × Washington Wizards', sub: 'NBA Summer League · Las Vegas', assistir: 'Prime Video' },

  // Quarta 15/jul
  { data: '2026-07-15', hora: '16:00', esporte: 'futebol', emoji: '⚽', titulo: 'Inglaterra × Argentina', sub: 'Semifinal da Copa do Mundo · Atlanta', assistir: 'Globo, SporTV, SBT e CazéTV', destaque: true },

  // Quinta 16/jul
  { data: '2026-07-16', hora: '21:00', esporte: 'basquete', emoji: '🏀', titulo: 'Utah Jazz × Atlanta Hawks', sub: 'NBA Summer League · Las Vegas', assistir: 'Prime Video' },
  { data: '2026-07-16', hora: '', esporte: 'basquete', emoji: '🏀', titulo: 'Chicago Bulls × San Antonio Spurs', sub: 'NBA Summer League · Las Vegas', assistir: 'ESPN' },
  { data: '2026-07-16', hora: '', esporte: 'tenis', emoji: '🎾', titulo: 'Ultimate Tennis Showdown — Rio', sub: 'Exibição em quadra dura · Rio de Janeiro', assistir: 'a confirmar' },

  // Sexta 17/jul
  { data: '2026-07-17', hora: '', esporte: 'basquete', emoji: '🏀', titulo: 'NBA Summer League — rodada do dia', sub: 'Fase de classificação · Las Vegas', assistir: 'ESPN e Disney+' },

  // Sábado 18/jul
  { data: '2026-07-18', hora: '18:00', esporte: 'futebol', emoji: '⚽', titulo: 'Disputa de 3º lugar', sub: 'Copa do Mundo · Hard Rock, Miami', assistir: 'Globo, SporTV, SBT e CazéTV', destaque: true },

  // Domingo 19/jul
  { data: '2026-07-19', hora: '16:00', esporte: 'futebol', emoji: '⚽', titulo: 'FINAL da Copa do Mundo 2026', sub: 'MetLife Stadium, Nova Jersey', assistir: 'Globo, SporTV, SBT e CazéTV', destaque: true },
  { data: '2026-07-19', hora: '', esporte: 'basquete', emoji: '🏀', titulo: 'NBA Summer League — FINAL', sub: 'Las Vegas', assistir: 'ESPN e Disney+' },

  // Quarta 22/jul
  { data: '2026-07-22', hora: '08:30', esporte: 'volei', emoji: '🏐', titulo: 'Brasil × Japão', sub: 'Quartas da VNL feminina · Macau', assistir: 'SporTV, GE TV e VBTV', destaque: true },
  { data: '2026-07-22', hora: '', esporte: 'volei', emoji: '🏐', titulo: 'EUA × China · Turquia × Canadá', sub: 'Quartas da VNL feminina · Macau', assistir: 'SporTV, GE TV e VBTV' },

  // Quinta 23/jul
  { data: '2026-07-23', hora: '', esporte: 'volei', emoji: '🏐', titulo: 'Quartas de final (restantes)', sub: 'VNL feminina · Macau', assistir: 'SporTV, GE TV e VBTV' },

  // Sexta 24/jul
  { data: '2026-07-24', hora: '', esporte: 'skate', emoji: '🛹', titulo: 'X Games New Orleans — dia 1', sub: 'Street e park', assistir: 'ESPN e Disney+' },

  // Sábado 25/jul
  { data: '2026-07-25', hora: '', esporte: 'volei', emoji: '🏐', titulo: 'Semifinais da VNL feminina', sub: 'Macau', assistir: 'SporTV, GE TV e VBTV' },
  { data: '2026-07-25', hora: '', esporte: 'skate', emoji: '🛹', titulo: 'X Games New Orleans — dia 2', sub: 'Street e park', assistir: 'ESPN e Disney+' },

  // Segunda 20/jul
  { data: '2026-07-20', hora: '', esporte: 'tenis', emoji: '🎾', titulo: 'ATP 500 de Hamburgo + Kitzbühel e Estoril', sub: 'Circuito no saibro · a semana toda', assistir: 'ESPN e Disney+' },

  // Domingo 26/jul
  { data: '2026-07-26', hora: '', esporte: 'volei', emoji: '🏐', titulo: 'FINAL da VNL feminina + 3º lugar', sub: 'Macau', assistir: 'SporTV, GE TV e VBTV', destaque: true },
  { data: '2026-07-26', hora: '', esporte: 'skate', emoji: '🛹', titulo: 'X Games New Orleans — finais', sub: 'Street e park', assistir: 'ESPN e Disney+' },

  // Segunda 27/jul
  { data: '2026-07-27', hora: '', esporte: 'tenis', emoji: '🎾', titulo: 'ATP 500 de Washington', sub: 'Quadra dura (EUA) · início da série rumo ao US Open', assistir: 'ESPN e Disney+' },
];

// "Mais pra frente" — a próxima data marcante de CADA esporte que não tem jogo
// nos próximos dias, pra nenhum ficar de fora. Peça "atualiza os esportes".
export const ESPORTES_PROXIMOS = [
  { esporte: 'futebol', emoji: '⚽', evento: 'Brasileirão volta após a Copa; Libertadores no mata-mata', quando: 'Fim de julho em diante', assistir: 'Premiere, Prime Video, Globo e CazéTV' },
  { esporte: 'volei', emoji: '🏐', evento: 'Finais da VNL masculina (Brasil na briga)', quando: '29/jul a 2/ago · Ningbo (China)', assistir: 'SporTV, GE TV e VBTV' },
  { esporte: 'skate', emoji: '🛹', evento: 'SLS Rio, com Rayssa Leal e Kelvin Hoefler', quando: '9/ago · Maracanãzinho (Rio)', assistir: 'Rumble (grátis) e SporTV' },
  { esporte: 'tenis', emoji: '🎾', evento: 'Masters do Canadá → Cincinnati → US Open', quando: 'Canadá 2/ago · Cincinnati 13/ago · US Open 31/ago', assistir: 'ESPN e Disney+' },
  { esporte: 'ginastica', emoji: '🤸', evento: 'Mundial de Ginástica Rítmica', quando: '12 a 16/ago · Frankfurt (Alemanha)', assistir: 'SporTV e Globoplay' },
  { esporte: 'basquete', emoji: '🏀', evento: 'Início da nova temporada da NBA (2026/27)', quando: 'A partir de outubro', assistir: 'ESPN, Disney+ e Prime Video' },
  { esporte: 'natacao', emoji: '🏊', evento: 'Mundial de piscina curta (25 m)', quando: '1 a 6/dez · Pequim (Water Cube)', assistir: 'SporTV e Globoplay' },
];
