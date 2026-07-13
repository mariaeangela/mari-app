// Sessão "Esportes" do Explorar.
// - ESPORTES: referência por esporte (regras + competições com o que é / quando / onde assistir).
//   Cada competição e cada evento tem `genero`: 'masc', 'fem' ou 'misto' (masc + fem).
// - ESPORTES_AGENDA: agenda dia a dia (jogo a jogo, horário de Brasília, onde assistir).
// - ESPORTES_PROXIMOS: "mais pra frente" — próxima data de cada esporte fora da janela.
//
// A Mari pede "atualiza os esportes" quando quiser: revejo a agenda dos próximos dias,
// as datas e a constante ESPORTES_ATUALIZADO.
export const ESPORTES_ATUALIZADO = '13 jul 2026';

export const ESPORTES = [
  {
    id: 'futebol', nome: 'Futebol', emoji: '⚽', cor: '#2e9e6b',
    escopo: 'grandes campeonatos · masculino e feminino',
    regras: [
      '11 contra 11, dois tempos de 45 min (+ acréscimos); vence quem faz mais gols.',
      'Impedimento: atacante à frente do penúltimo defensor no momento do passe.',
      'Faltas geram tiro livre ou pênalti; amarelo adverte, vermelho expulsa.',
      'Mata-mata empatado: prorrogação de 2×15 min e, seguindo igual, pênaltis.',
      'VAR revisa gols, pênaltis, vermelhos diretos e erro de identidade.',
    ],
    competicoes: [
      { nome: 'Copa do Mundo FIFA', genero: 'masc', oque: 'O maior torneio de seleções, de 4 em 4 anos. Em 2026 são 48 seleções, nos EUA, México e Canadá.', quando: '11/jun a 19/jul/2026 · final 19/jul (Nova Jersey)', assistir: 'Globo, SporTV, SBT e CazéTV' },
      { nome: 'Copa do Mundo Feminina', genero: 'fem', oque: 'O Mundial de seleções feminino — e a próxima edição é NO BRASIL, a primeira na América do Sul.', quando: 'Em 2027, no Brasil', assistir: 'Globo, SporTV e CazéTV' },
      { nome: 'Champions League (UEFA)', genero: 'masc', oque: 'O mata-mata dos melhores clubes da Europa — o título de clubes mais cobiçado. Há também a versão feminina.', quando: 'Setembro a maio · final 30/mai/2026 (Budapeste)', assistir: 'HBO Max e TNT Sports' },
      { nome: 'Libertadores (CONMEBOL)', genero: 'masc', oque: 'A “Champions” da América do Sul. Tem edição masculina e feminina.', quando: 'Fevereiro a novembro · final em nov', assistir: 'Globo (aberta/GE TV), ESPN/Disney+ e Paramount+' },
      { nome: 'Brasileirão (masculino e feminino)', genero: 'misto', oque: 'A liga nacional por pontos corridos — 20 clubes no masculino; o feminino cresce a cada ano.', quando: 'Masc.: abr–dez · Fem.: mar–set', assistir: 'Globo, Premiere, Prime Video, CazéTV e GE TV' },
      { nome: 'Premier League e La Liga', genero: 'masc', oque: 'As ligas nacionais mais fortes da Europa (Inglaterra e Espanha).', quando: 'Agosto a maio', assistir: 'ESPN e Disney+' },
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
      { nome: 'Australian Open', genero: 'misto', oque: 'O 1º Grand Slam do ano, em quadra dura, em Melbourne. Tem chave masculina e feminina.', quando: '12/jan a 1/fev/2026', assistir: 'ESPN e Disney+' },
      { nome: 'Roland Garros', genero: 'misto', oque: 'Grand Slam no saibro, em Paris — o mais desgastante fisicamente.', quando: '24/mai a 7/jun/2026', assistir: 'ESPN e Disney+' },
      { nome: 'Wimbledon', genero: 'misto', oque: 'Grand Slam na grama, em Londres — o mais tradicional de todos.', quando: '29/jun a 12/jul/2026', assistir: 'ESPN e Disney+' },
      { nome: 'US Open', genero: 'misto', oque: 'O último Grand Slam do ano, em quadra dura, em Nova York.', quando: '31/ago a 13/set/2026', assistir: 'ESPN e Disney+' },
      { nome: 'ATP Finals e WTA Finals', genero: 'misto', oque: 'Os torneios de encerramento, só com os 8 melhores do ano (um masculino, um feminino).', quando: 'Novembro/2026', assistir: 'ESPN e Disney+' },
    ],
  },
  {
    id: 'ginastica', nome: 'Ginástica', emoji: '🤸', cor: '#c2548f',
    escopo: 'artística e rítmica (olímpicas)',
    regras: [
      'Nota = Dificuldade (D, valor dos elementos) + Execução (E, começa em 10 e tira erros).',
      'Artística feminina: solo, trave, salto e barras assimétricas.',
      'Artística masculina: solo, cavalo, argolas, salto, paralelas e barra fixa.',
      'Rítmica (feminina): arco, bola, maças e fita, com música (individual e conjunto).',
      'Penaliza queda, passo fora do praticável, tempo e falhas de execução.',
    ],
    competicoes: [
      { nome: 'Mundial de Ginástica Rítmica', genero: 'fem', oque: 'A principal competição da rítmica — que no programa olímpico é só feminina (arco, bola, maças e fita).', quando: '12 a 16/ago/2026 · Frankfurt (Alemanha)', assistir: 'SporTV e Globoplay' },
      { nome: 'Mundial de Ginástica Artística', genero: 'misto', oque: 'A principal competição da artística, com disputa masculina e feminina.', quando: '17 a 25/out/2026 · Roterdã (Holanda)', assistir: 'SporTV e Globoplay' },
      { nome: 'Copa do Mundo FIG (etapas)', genero: 'misto', oque: 'Série de etapas pelo mundo que valem ranking ao longo do ano.', quando: 'Março a julho/2026', assistir: 'SporTV e canais da FIG' },
      { nome: 'Jogos Olímpicos', genero: 'misto', oque: 'O ápice da modalidade, de 4 em 4 anos.', quando: 'Próxima: 2028 (Los Angeles)', assistir: 'Globo e SporTV' },
    ],
  },
  {
    id: 'natacao', nome: 'Natação', emoji: '🏊', cor: '#4f9dd4',
    escopo: 'piscina · provas masculinas e femininas',
    regras: [
      'Quatro estilos: livre (crawl), costas, peito e borboleta.',
      'O medley combina os quatro estilos (prova individual ou revezamento).',
      'Provas de 50 m a 1500 m; vence quem toca a borda primeiro.',
      'Saída antecipada desclassifica; viradas e toques têm regra por estilo.',
      'Piscina de 25 m (“curta”) tem recordes próprios — mais viradas, tempos menores.',
    ],
    competicoes: [
      { nome: 'Mundial de piscina curta (25 m)', genero: 'misto', oque: 'O Mundial em piscina de 25 m — mais viradas e tempos mais rápidos. Provas masc. e fem.', quando: '1 a 6/dez/2026 · Pequim (Water Cube)', assistir: 'SporTV e Globoplay' },
      { nome: 'Mundial (World Aquatics, 50 m)', genero: 'misto', oque: 'O grande Mundial, disputado em piscina olímpica de 50 m.', quando: 'Meio do ano (varia por edição)', assistir: 'SporTV e Globoplay' },
      { nome: 'Copa do Mundo (World Cup)', genero: 'misto', oque: 'Circuito de etapas ao longo da temporada.', quando: 'Outubro a novembro', assistir: 'SporTV e World Aquatics' },
      { nome: 'Jogos Olímpicos', genero: 'misto', oque: 'Piscina de 50 m, de 4 em 4 anos.', quando: 'Próxima: 2028 (Los Angeles)', assistir: 'Globo e SporTV' },
    ],
  },
  {
    id: 'skate', nome: 'Skate', emoji: '🛹', cor: '#f2a93b',
    escopo: 'street e park · masculino e feminino',
    regras: [
      'Street: pista com corrimãos, escadas e bordas; nota por manobras nos obstáculos.',
      'Park: pista curva (bowl) com rampas; foca em altura, fluidez e combinações.',
      'Juízes dão nota por dificuldade, execução, variedade e consistência.',
      'Formato típico: voltas cronometradas + tentativas de manobra (“best trick”).',
      'Cair ou não completar a manobra derruba a nota da tentativa.',
    ],
    competicoes: [
      { nome: 'Mundial de Skate (World Skate)', genero: 'misto', oque: 'O Mundial de street — o Brasil é potência com Rayssa Leal (fem) e Kelvin Hoefler (masc).', quando: 'Julho/2026, em São Paulo', assistir: 'Globo e SporTV' },
      { nome: 'SLS — Street League', genero: 'misto', oque: 'O principal circuito profissional de street, com disputa masculina e feminina.', quando: 'SLS Rio: 9/ago/2026 (Maracanãzinho)', assistir: 'Rumble (grátis) e SporTV' },
      { nome: 'X Games', genero: 'misto', oque: 'O clássico dos esportes radicais (street e park), com categorias masc. e fem.', quando: 'New Orleans: 24 a 26/jul/2026', assistir: 'ESPN e Disney+' },
      { nome: 'Jogos Olímpicos', genero: 'misto', oque: 'Street e park, no programa olímpico desde Tóquio 2020.', quando: 'Próxima: 2028 (Los Angeles)', assistir: 'Globo e SporTV' },
    ],
  },
  {
    id: 'basquete', nome: 'Basquete', emoji: '🏀', cor: '#e57b3a',
    escopo: 'NBA/WNBA, Brasil e seleções',
    regras: [
      '5 contra 5; cesta normal vale 2, de fora da linha vale 3, lance livre vale 1.',
      'NBA: 4 quartos de 12 min (na FIBA são 4 de 10 min).',
      'O ataque tem 24 s para arremessar; há regras de garrafão e de passos.',
      'Faltas acumulam; passando do limite, o adversário ganha lances livres.',
      'Empate no fim vai para a prorrogação (5 min), quantas forem necessárias.',
    ],
    competicoes: [
      { nome: 'NBA', genero: 'masc', oque: 'A liga masculina dos EUA — a mais forte do mundo, com os melhores jogadores.', quando: 'Temporada out/2026 a abr/2027 · playoffs até jun', assistir: 'ESPN, Disney+ e Prime Video' },
      { nome: 'WNBA', genero: 'fem', oque: 'A liga feminina dos EUA — a principal do mundo. Tem as brasileiras Kamilla Cardoso e Damiris Dantas.', quando: 'Maio a outubro · All-Star em 25/jul/2026', assistir: 'ESPN, Disney+ e Prime Video' },
      { nome: 'NBB e LBF (Brasil)', genero: 'misto', oque: 'As ligas nacionais de clubes: NBB (masculino) e LBF (feminino).', quando: 'NBB: out–mai · LBF: mai–dez', assistir: 'SporTV, Band, ESPN e YouTube (LNB/LBF)' },
      { nome: 'Copa do Mundo FIBA e Olimpíadas', genero: 'misto', oque: 'Os grandes torneios de seleções (masculino e feminino).', quando: 'Olimpíadas: 2028 (Los Angeles)', assistir: 'Globo e SporTV' },
    ],
  },
  {
    id: 'volei', nome: 'Vôlei', emoji: '🏐', cor: '#3f6fb0',
    escopo: 'quadra (6×6) · masculino e feminino',
    regras: [
      '6 contra 6; cada equipe pode dar até 3 toques antes de devolver a bola.',
      'O set vai até 25 pontos (com 2 de diferença); o 5º set decisivo vai a 15.',
      'A partida é melhor de 5 sets — quem faz 3 vence.',
      'Rally point: todo rali vale ponto, tenha sacado ou não.',
      'Rodízio de posições ao reconquistar o saque; o líbero é o defensor especialista.',
    ],
    competicoes: [
      { nome: 'Liga das Nações (VNL)', genero: 'misto', oque: 'O principal torneio anual de seleções, com disputa masculina e feminina.', quando: 'Jun a ago/2026 · finais fem. 22–26/jul (Macau), masc. 29/jul–2/ago (Ningbo)', assistir: 'SporTV, GE TV e VBTV' },
      { nome: 'Superliga', genero: 'misto', oque: 'A liga nacional de clubes do Brasil, masculina e feminina.', quando: 'Novembro a abril', assistir: 'SporTV e Globo' },
      { nome: 'Campeonato Mundial', genero: 'misto', oque: 'O Mundial de seleções (masculino e feminino).', quando: 'Edições específicas (calendário FIVB)', assistir: 'SporTV e VBTV' },
      { nome: 'Jogos Olímpicos', genero: 'misto', oque: 'Seleções, de 4 em 4 anos.', quando: 'Próxima: 2028 (Los Angeles)', assistir: 'Globo e SporTV' },
    ],
  },
  {
    id: 'formula1', nome: 'Fórmula 1', emoji: '🏎️', cor: '#d43a3a',
    escopo: 'automobilismo · principal categoria',
    regras: [
      '24 GPs no ano; pontua do 1º ao 10º (25, 18, 15…) + 1 ponto pela volta mais rápida no top 10.',
      'Fim de semana: treinos livres, classificação (define o grid) e a corrida de domingo.',
      'Alguns fins de semana têm corrida sprint (mais curta, no sábado, com pontos extras).',
      'Dois títulos por ano: o de Pilotos e o de Construtores (as equipes).',
      'Pit stop com troca de pneus é obrigatório; o DRS ajuda nas ultrapassagens.',
      'Em 2026 entram carros e motores de nova geração (mais híbridos, combustível sustentável).',
    ],
    competicoes: [
      { nome: 'Mundial de Pilotos e Construtores', genero: 'masc', oque: 'O campeonato principal, com 24 GPs pelo mundo. A F1 é masculina; a categoria feminina de acesso é a F1 Academy.', quando: 'Março a dezembro/2026 · recesso de 27/jul a 21/ago', assistir: 'Band, BandSports e F1 TV' },
      { nome: 'GP de São Paulo (Interlagos)', genero: 'masc', oque: 'A etapa brasileira, em Interlagos — uma das corridas mais imprevisíveis do calendário.', quando: '6 a 8/nov/2026 (sem sprint neste ano)', assistir: 'Band, BandSports e F1 TV' },
      { nome: 'F1 Academy', genero: 'fem', oque: 'A categoria feminina de formação, que corre junto a etapas da F1 para revelar pilotas.', quando: 'Ao longo de 2026', assistir: 'Canais e plataformas da F1' },
    ],
  },
  {
    id: 'surfe', nome: 'Surfe', emoji: '🏄', cor: '#1aa3a3',
    escopo: 'circuito mundial WSL · masculino e feminino',
    regras: [
      'Baterias (heats) de 2 ou 3 surfistas; contam as 2 melhores ondas de cada um.',
      'Cada onda recebe nota de 0 a 10 (cinco juízes); a bateria soma até 20.',
      'Avalia dificuldade, variedade, manobras, velocidade, potência e fluidez.',
      'A “prioridade” define quem tem preferência para escolher a próxima onda.',
      'O CT (elite) tem tour masculino e feminino; o título sai por pontos nas etapas.',
    ],
    competicoes: [
      { nome: 'Championship Tour (CT)', genero: 'misto', oque: 'A elite da WSL, com tour masculino e feminino. Brasil forte: Medina, Yago Dora, Ítalo, Tati Weston-Webb.', quando: '12 etapas de jan a set/2026', assistir: 'SporTV, Globoplay e site/redes da WSL' },
      { nome: 'Etapa de Teahupo’o (Taiti)', genero: 'misto', oque: 'Uma das ondas mais pesadas do mundo — a mesma do surfe olímpico de Paris 2024.', quando: '8 a 18/ago/2026', assistir: 'SporTV, Globoplay e WSL' },
      { nome: 'WSL Finals (Pipeline)', genero: 'misto', oque: 'A decisão do título mundial, no Havaí, com os melhores do ranking.', quando: 'Fim da temporada 2026', assistir: 'SporTV, Globoplay e WSL' },
    ],
  },
];

// AGENDA dia a dia — cada jogo/sessão com data, horário (Brasília), gênero e onde assistir.
// Peça "atualiza os esportes" que eu revejo os próximos dias.
export const ESPORTES_AGENDA = [
  // Segunda 13/jul
  { data: '2026-07-13', hora: '', esporte: 'basquete', emoji: '🏀', genero: 'masc', titulo: 'NBA Summer League — rodada do dia', sub: 'Vários jogos · Las Vegas', assistir: 'ESPN e Disney+' },
  { data: '2026-07-13', hora: '', esporte: 'basquete', emoji: '🏀', genero: 'fem', titulo: 'WNBA — rodada do dia', sub: 'Temporada regular · vários jogos', assistir: 'ESPN, Disney+ e Prime Video' },
  { data: '2026-07-13', hora: '', esporte: 'tenis', emoji: '🎾', genero: 'masc', titulo: 'ATP 250: Gstaad, Båstad e Umag', sub: 'Circuito no saibro (pós-Wimbledon) · a semana toda', assistir: 'ESPN e Disney+' },
  { data: '2026-07-13', hora: '', esporte: 'tenis', emoji: '🎾', genero: 'fem', titulo: 'WTA 250 de Iași', sub: 'Circuito feminino no saibro · a semana toda', assistir: 'ESPN e Disney+' },

  // Terça 14/jul
  { data: '2026-07-14', hora: '16:00', esporte: 'futebol', emoji: '⚽', genero: 'masc', titulo: 'França × Espanha', sub: 'Semifinal da Copa do Mundo · Dallas', assistir: 'Globo, SporTV, SBT e CazéTV', destaque: true },
  { data: '2026-07-14', hora: '20:00', esporte: 'basquete', emoji: '🏀', genero: 'masc', titulo: 'Utah Jazz × Golden State Warriors', sub: 'NBA Summer League · Las Vegas', assistir: 'ESPN' },
  { data: '2026-07-14', hora: '21:00', esporte: 'basquete', emoji: '🏀', genero: 'masc', titulo: 'Chicago Bulls × Washington Wizards', sub: 'NBA Summer League · Las Vegas', assistir: 'Prime Video' },

  // Quarta 15/jul
  { data: '2026-07-15', hora: '16:00', esporte: 'futebol', emoji: '⚽', genero: 'masc', titulo: 'Inglaterra × Argentina', sub: 'Semifinal da Copa do Mundo · Atlanta', assistir: 'Globo, SporTV, SBT e CazéTV', destaque: true },

  // Quinta 16/jul
  { data: '2026-07-16', hora: '21:00', esporte: 'basquete', emoji: '🏀', genero: 'masc', titulo: 'Utah Jazz × Atlanta Hawks', sub: 'NBA Summer League · Las Vegas', assistir: 'Prime Video' },
  { data: '2026-07-16', hora: '', esporte: 'basquete', emoji: '🏀', genero: 'masc', titulo: 'Chicago Bulls × San Antonio Spurs', sub: 'NBA Summer League · Las Vegas', assistir: 'ESPN' },
  { data: '2026-07-16', hora: '', esporte: 'tenis', emoji: '🎾', genero: 'masc', titulo: 'Ultimate Tennis Showdown — Rio', sub: 'Exibição em quadra dura · Rio de Janeiro', assistir: 'a confirmar' },

  // Sexta 17/jul
  { data: '2026-07-17', hora: '', esporte: 'basquete', emoji: '🏀', genero: 'masc', titulo: 'NBA Summer League — rodada do dia', sub: 'Fase de classificação · Las Vegas', assistir: 'ESPN e Disney+' },

  // Sábado 18/jul
  { data: '2026-07-18', hora: '18:00', esporte: 'futebol', emoji: '⚽', genero: 'masc', titulo: 'Disputa de 3º lugar', sub: 'Copa do Mundo · Hard Rock, Miami', assistir: 'Globo, SporTV, SBT e CazéTV', destaque: true },

  // Domingo 19/jul
  { data: '2026-07-19', hora: '16:00', esporte: 'futebol', emoji: '⚽', genero: 'masc', titulo: 'FINAL da Copa do Mundo 2026', sub: 'MetLife Stadium, Nova Jersey', assistir: 'Globo, SporTV, SBT e CazéTV', destaque: true },
  { data: '2026-07-19', hora: '', esporte: 'basquete', emoji: '🏀', genero: 'masc', titulo: 'NBA Summer League — FINAL', sub: 'Las Vegas', assistir: 'ESPN e Disney+' },

  // Segunda 20/jul
  { data: '2026-07-20', hora: '', esporte: 'tenis', emoji: '🎾', genero: 'masc', titulo: 'ATP 500 de Hamburgo + Kitzbühel e Estoril', sub: 'Circuito no saibro · a semana toda', assistir: 'ESPN e Disney+' },

  // Quarta 22/jul
  { data: '2026-07-22', hora: '08:30', esporte: 'volei', emoji: '🏐', genero: 'fem', titulo: 'Brasil × Japão', sub: 'Quartas da VNL feminina · Macau', assistir: 'SporTV, GE TV e VBTV', destaque: true },
  { data: '2026-07-22', hora: '', esporte: 'volei', emoji: '🏐', genero: 'fem', titulo: 'EUA × China · Turquia × Canadá', sub: 'Quartas da VNL feminina · Macau', assistir: 'SporTV, GE TV e VBTV' },

  // Quinta 23/jul
  { data: '2026-07-23', hora: '', esporte: 'volei', emoji: '🏐', genero: 'fem', titulo: 'Quartas de final (restantes)', sub: 'VNL feminina · Macau', assistir: 'SporTV, GE TV e VBTV' },

  // Sexta 24/jul
  { data: '2026-07-24', hora: '', esporte: 'skate', emoji: '🛹', genero: 'misto', titulo: 'X Games New Orleans — dia 1', sub: 'Street e park (masc. e fem.)', assistir: 'ESPN e Disney+' },

  // Sábado 25/jul
  { data: '2026-07-25', hora: '', esporte: 'volei', emoji: '🏐', genero: 'fem', titulo: 'Semifinais da VNL feminina', sub: 'Macau', assistir: 'SporTV, GE TV e VBTV' },
  { data: '2026-07-25', hora: '', esporte: 'basquete', emoji: '🏀', genero: 'fem', titulo: 'WNBA All-Star Game', sub: 'Jogo das estrelas da liga feminina', assistir: 'ESPN e Disney+', destaque: true },
  { data: '2026-07-25', hora: '', esporte: 'skate', emoji: '🛹', genero: 'misto', titulo: 'X Games New Orleans — dia 2', sub: 'Street e park (masc. e fem.)', assistir: 'ESPN e Disney+' },

  // Domingo 26/jul
  { data: '2026-07-26', hora: '', esporte: 'volei', emoji: '🏐', genero: 'fem', titulo: 'FINAL da VNL feminina + 3º lugar', sub: 'Macau', assistir: 'SporTV, GE TV e VBTV', destaque: true },
  { data: '2026-07-26', hora: '', esporte: 'skate', emoji: '🛹', genero: 'misto', titulo: 'X Games New Orleans — finais', sub: 'Street e park (masc. e fem.)', assistir: 'ESPN e Disney+' },

  // Segunda 27/jul
  { data: '2026-07-27', hora: '', esporte: 'tenis', emoji: '🎾', genero: 'misto', titulo: 'ATP 500 e WTA de Washington', sub: 'Quadra dura (EUA) · série rumo ao US Open', assistir: 'ESPN e Disney+' },
];

// "Mais pra frente" — a próxima data marcante de CADA esporte fora dos próximos dias,
// pra nenhum ficar de fora. Peça "atualiza os esportes".
export const ESPORTES_PROXIMOS = [
  { esporte: 'volei', emoji: '🏐', genero: 'masc', evento: 'Finais da VNL masculina (Brasil na briga)', quando: '29/jul a 2/ago · Ningbo (China)', assistir: 'SporTV, GE TV e VBTV' },
  { esporte: 'futebol', emoji: '⚽', genero: 'masc', evento: 'Brasileirão volta após a Copa; Libertadores no mata-mata', quando: 'Fim de julho em diante', assistir: 'Premiere, Prime Video, Globo e CazéTV' },
  { esporte: 'skate', emoji: '🛹', genero: 'misto', evento: 'SLS Rio, com Rayssa Leal e Kelvin Hoefler', quando: '9/ago · Maracanãzinho (Rio)', assistir: 'Rumble (grátis) e SporTV' },
  { esporte: 'surfe', emoji: '🏄', genero: 'misto', evento: 'WSL — etapa de Teahupo’o (Taiti)', quando: '8 a 18/ago · masc. e fem.', assistir: 'SporTV, Globoplay e WSL' },
  { esporte: 'ginastica', emoji: '🤸', genero: 'fem', evento: 'Mundial de Ginástica Rítmica', quando: '12 a 16/ago · Frankfurt (Alemanha)', assistir: 'SporTV e Globoplay' },
  { esporte: 'tenis', emoji: '🎾', genero: 'misto', evento: 'Masters do Canadá → Cincinnati → US Open', quando: 'Canadá 2/ago · Cincinnati 13/ago · US Open 31/ago', assistir: 'ESPN e Disney+' },
  { esporte: 'formula1', emoji: '🏎️', genero: 'masc', evento: 'F1 volta do recesso; depois GP de São Paulo', quando: 'Volta 21/ago · GP de São Paulo 6–8/nov', assistir: 'Band, BandSports e F1 TV' },
  { esporte: 'basquete', emoji: '🏀', genero: 'masc', evento: 'Início da nova temporada da NBA (2026/27)', quando: 'A partir de outubro', assistir: 'ESPN, Disney+ e Prime Video' },
  { esporte: 'natacao', emoji: '🏊', genero: 'misto', evento: 'Mundial de piscina curta (25 m)', quando: '1 a 6/dez · Pequim (Water Cube)', assistir: 'SporTV e Globoplay' },
];
