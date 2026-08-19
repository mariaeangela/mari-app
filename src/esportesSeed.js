// Sessão "Esportes" do Explorar.
// - ESPORTES: referência por esporte (regras + competições com o que é / quando / onde assistir).
//   Cada competição e cada evento tem `genero`: 'masc', 'fem' ou 'misto' (masc + fem).
// - ESPORTES_AGENDA: agenda dia a dia (jogo a jogo, horário de Brasília, onde assistir).
// - ESPORTES_PROXIMOS: "mais pra frente" — próxima data de cada esporte fora da janela.
//
// A Mari pede "atualiza os esportes" quando quiser: revejo a agenda dos próximos dias,
// as datas e a constante ESPORTES_ATUALIZADO.
export const ESPORTES_ATUALIZADO = '19 ago 2026';

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
      { nome: 'Copa do Mundo FIFA', genero: 'masc', oque: 'O maior torneio de seleções, de 4 em 4 anos. A de 2026 teve 48 seleções, nos EUA, México e Canadá — e a Espanha foi campeã, 1×0 na Argentina na prorrogação (gol de Ferran Torres).', quando: 'Acabou em 19/jul/2026 · próxima em 2030', assistir: 'Globo, SporTV, SBT e CazéTV' },
      { nome: 'Copa do Mundo Feminina', genero: 'fem', oque: 'O Mundial de seleções feminino — e a próxima edição é NO BRASIL, a primeira na América do Sul.', quando: 'Em 2027, no Brasil', assistir: 'Globo, SporTV e CazéTV' },
      { nome: 'Champions League (UEFA)', genero: 'masc', oque: 'O mata-mata dos melhores clubes da Europa — o título de clubes mais cobiçado. Há também a versão feminina.', quando: 'Setembro a maio · a temporada 2026/27 começa em setembro', assistir: 'HBO Max e TNT Sports' },
      { nome: 'Libertadores (CONMEBOL)', genero: 'masc', oque: 'A “Champions” da América do Sul. Tem edição masculina e feminina.', quando: 'Fevereiro a novembro · final em nov', assistir: 'Globo (aberta/GE TV), ESPN/Disney+ e Paramount+' },
      { nome: 'Brasileirão (masculino e feminino)', genero: 'misto', oque: 'A liga nacional por pontos corridos — 20 clubes no masculino; o feminino cresce a cada ano.', quando: 'Masc.: abr–dez · Fem.: mar–set', assistir: 'Globo, Premiere, Prime Video, CazéTV e GE TV' },
      { nome: 'Premier League e La Liga', genero: 'masc', oque: 'As ligas nacionais mais fortes da Europa (Inglaterra e Espanha).', quando: 'Agosto a maio · a Premier 2026/27 abre em 21/ago (Arsenal x Coventry)', assistir: 'ESPN e Disney+' },
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
      { nome: 'Australian Open', genero: 'misto', oque: 'O 1º Grand Slam do ano, em quadra dura, em Melbourne. Tem chave masculina e feminina.', quando: 'Todo janeiro, em Melbourne · próxima edição em jan/2027', assistir: 'ESPN e Disney+' },
      { nome: 'Roland Garros', genero: 'misto', oque: 'Grand Slam no saibro, em Paris — o mais desgastante fisicamente.', quando: 'Fim de maio a começo de junho, em Paris · próxima em 2027', assistir: 'ESPN e Disney+' },
      { nome: 'Wimbledon', genero: 'misto', oque: 'Grand Slam na grama, em Londres — o mais tradicional de todos.', quando: 'Fim de junho a meados de julho, em Londres · próxima em 2027', assistir: 'ESPN e Disney+' },
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
      { nome: 'Copa do Mundo FIG (etapas)', genero: 'misto', oque: 'Série de etapas pelo mundo que valem ranking ao longo do ano.', quando: 'Março a julho, todo ano', assistir: 'SporTV e canais da FIG' },
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
      { nome: 'Campeonato Pan-Pacífico', genero: 'misto', oque: 'Reúne as potências da bacia do Pacífico (EUA, Austrália, Japão, Canadá) mais convidados — e o Brasil é presença tradicional. Estava parado desde 2018.', quando: '12 a 15/ago/2026 · Irvine (EUA)', assistir: 'SporTV e Globoplay' },
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
      { nome: 'Mundial de Skate (World Skate)', genero: 'misto', oque: 'O Mundial de street — o Brasil é potência com Rayssa Leal (fem) e Kelvin Hoefler (masc).', quando: 'Julho · a edição de 2026 foi em São Paulo', assistir: 'Globo e SporTV' },
      { nome: 'SLS — Street League', genero: 'misto', oque: 'O principal circuito profissional de street, com disputa masculina e feminina.', quando: 'SLS Rio: 9/ago/2026 (Maracanãzinho)', assistir: 'Rumble (grátis) e SporTV' },
      { nome: 'X Games', genero: 'misto', oque: 'O clássico dos esportes radicais (street e park), com categorias masc. e fem.', quando: 'Etapas ao longo do ano · em jul/2026 foi em New Orleans', assistir: 'ESPN e Disney+' },
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
      { nome: 'WNBA', genero: 'fem', oque: 'A liga feminina dos EUA — a principal do mundo. Tem as brasileiras Kamilla Cardoso e Damiris Dantas.', quando: 'Maio a set/2026 · pausa em 31/ago pro Mundial e playoffs a partir de 27/set', assistir: 'ESPN, Disney+ e Prime Video' },
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
      { nome: 'Liga das Nações (VNL)', genero: 'misto', oque: 'O principal torneio anual de seleções, com disputa masculina e feminina.', quando: 'Junho a agosto · a edição de 2026 terminou em 2/ago (Ningbo)', assistir: 'SporTV, GE TV e VBTV' },
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
  {
    id: 'atletismo', nome: 'Atletismo', emoji: '🏃', cor: '#8a5cc4',
    escopo: 'pista e campo · masculino e feminino',
    regras: [
      'Três grandes grupos: corridas (pista), saltos e lançamentos (campo).',
      'Corridas: vence quem cruza a linha primeiro; queima da largada desclassifica.',
      'Saltos (distância, altura, triplo, vara) e lançamentos (peso, disco, dardo, martelo): vale a melhor marca entre as tentativas.',
      'Há provas com barreiras e com obstáculos (110 m/400 m com barreiras, 3000 m steeplechase).',
      'Combinadas: decatlo (masc.) e heptatlo (fem.) somam pontos de várias provas.',
      'Revezamentos 4×100 m e 4×400 m; o bastão tem de ser passado dentro da zona.',
    ],
    competicoes: [
      { nome: 'Wanda Diamond League', genero: 'misto', oque: 'O principal circuito mundial de etapas (corridas, saltos e lançamentos), masc. e fem. Destaque brasileiro: Alison dos Santos (Piu), nos 400 m com barreiras.', quando: 'Maio a set/2026 · final 4–5/set (Bruxelas)', assistir: 'SporTV e Xsports' },
      { nome: 'Etapa de Londres (Diamond League)', genero: 'misto', oque: 'Uma das etapas mais fortes do circuito, no estádio olímpico de Londres.', quando: 'Julho, no estádio olímpico de Londres', assistir: 'SporTV e Xsports' },
      { nome: 'Mundial de Atletismo (World Athletics)', genero: 'misto', oque: 'O Mundial de pista e campo — o maior torneio da modalidade fora as Olimpíadas.', quando: 'Próxima edição em 2027', assistir: 'SporTV e Globoplay' },
      { nome: 'Jogos Olímpicos', genero: 'misto', oque: 'O ápice do atletismo, de 4 em 4 anos.', quando: 'Próxima: 2028 (Los Angeles)', assistir: 'Globo e SporTV' },
    ],
  },
];

// AGENDA dia a dia — cada jogo/sessão com data, horário (Brasília), gênero e onde assistir.
// Peça "atualiza os esportes" que eu revejo os próximos dias.
export const ESPORTES_AGENDA = [
  // Quarta 19/ago
  { data: '2026-08-19', hora: '', esporte: 'futebol', emoji: '⚽', genero: 'masc', titulo: 'Libertadores — oitavas, jogos de VOLTA', sub: 'Flamengo x Cruzeiro e Cerro Porteño x Palmeiras decidem quem vai às quartas', assistir: 'SBT, ESPN e Paramount+', destaque: true },
  { data: '2026-08-19', hora: '', esporte: 'tenis', emoji: '🎾', genero: 'misto', titulo: 'Masters de Cincinnati', sub: 'Último Masters 1000 antes do US Open · Sabalenka, Rybakina, Gauff, Djokovic e Zverev na chave · final domingo', assistir: 'ESPN e Disney+' },
  { data: '2026-08-19', hora: '', esporte: 'basquete', emoji: '🏀', genero: 'fem', titulo: 'WNBA — temporada regular', sub: 'Reta final antes da pausa pro Mundial da FIBA', assistir: 'ESPN e Disney+' },

  // Quinta 20/ago
  { data: '2026-08-20', hora: '', esporte: 'futebol', emoji: '⚽', genero: 'masc', titulo: 'Libertadores — Corinthians x Rosario Central', sub: 'Fecha as oitavas · ficou 0 a 0 na Argentina, então quem vencer aqui avança', assistir: 'SBT, ESPN e Paramount+', destaque: true },
  { data: '2026-08-20', hora: '', esporte: 'atletismo', emoji: '🏃', genero: 'masc', titulo: 'Duplantis tenta o recorde mundial do salto com vara', sub: 'Evento de rua em Lausanne, na véspera da Diamond League · de graça pro público', assistir: 'SporTV e Xsports', destaque: true },
  { data: '2026-08-20', hora: '', esporte: 'tenis', emoji: '🎾', genero: 'misto', titulo: 'Cincinnati — a chave vai afunilando', sub: 'Mason, Ohio · quadra dura', assistir: 'ESPN e Disney+' },

  // Sexta 21/ago
  { data: '2026-08-21', hora: '7h30 e 11h30', esporte: 'formula1', emoji: '🏎️', genero: 'misto', titulo: 'A F1 volta do recesso: GP da Holanda', sub: 'Treino livre 7h30 e classificação da sprint 11h30 · Bortoleto na pista · é a ÚLTIMA edição em Zandvoort', assistir: 'Band, BandSports e F1 TV', destaque: true },
  { data: '2026-08-21', hora: '', esporte: 'atletismo', emoji: '🏃', genero: 'misto', titulo: 'Diamond League volta em Lausanne', sub: 'Duplantis, Shericka Jackson, Letsile Tebogo e Amy Hunt · restam 4 encontros até a final', assistir: 'SporTV e Xsports', destaque: true },
  { data: '2026-08-21', hora: '', esporte: 'futebol', emoji: '⚽', genero: 'masc', titulo: 'Começa a Premier League 2026/27', sub: 'Arsenal (o campeão) x Coventry (recém-subido) no Emirates · a temporada atrasou uma semana por causa da Copa', assistir: 'ESPN e Disney+', destaque: true },

  // Sábado 22/ago
  { data: '2026-08-22', hora: '7h e 11h', esporte: 'formula1', emoji: '🏎️', genero: 'misto', titulo: 'GP da Holanda — dia de SPRINT', sub: 'Corrida sprint às 7h e classificação do GP às 11h · a 1ª vez que Zandvoort tem sprint', assistir: 'Band, BandSports e F1 TV', destaque: true },
  { data: '2026-08-22', hora: '', esporte: 'futebol', emoji: '⚽', genero: 'masc', titulo: 'Premier League — Hull City x Manchester United', sub: 'E Fulham x Chelsea no mesmo dia · 1ª rodada', assistir: 'ESPN e Disney+' },
  { data: '2026-08-22', hora: '', esporte: 'futebol', emoji: '⚽', genero: 'masc', titulo: 'Brasileirão — 24ª rodada', sub: 'A rodada vai de sábado a segunda', assistir: 'Premiere, Globo, SporTV, Record e Prime Video' },
  { data: '2026-08-22', hora: '', esporte: 'tenis', emoji: '🎾', genero: 'misto', titulo: 'Cincinnati — semifinais', sub: 'Quem chega na decisão de domingo', assistir: 'ESPN e Disney+' },

  // Domingo 23/ago
  { data: '2026-08-23', hora: '10h', esporte: 'formula1', emoji: '🏎️', genero: 'misto', titulo: 'GP da Holanda — A CORRIDA', sub: 'Zandvoort · a despedida da pista no calendário da F1', assistir: 'Band, BandSports e F1 TV', destaque: true },
  { data: '2026-08-23', hora: '~17h30', esporte: 'tenis', emoji: '🎾', genero: 'misto', titulo: 'FINAL do Masters de Cincinnati', sub: 'Homens e mulheres decidem o último 1000 antes do Grand Slam', assistir: 'ESPN e Disney+', destaque: true },
  { data: '2026-08-23', hora: '', esporte: 'atletismo', emoji: '🏃', genero: 'misto', titulo: 'Diamond League — Silésia (Polônia)', sub: 'Segunda das quatro etapas finais', assistir: 'SporTV e Xsports' },
  { data: '2026-08-23', hora: '', esporte: 'futebol', emoji: '⚽', genero: 'masc', titulo: 'Premier League — Newcastle x Liverpool', sub: 'E Manchester City x Bournemouth · 1ª rodada', assistir: 'ESPN e Disney+' },
  { data: '2026-08-23', hora: '', esporte: 'futebol', emoji: '⚽', genero: 'masc', titulo: 'Brasileirão — 24ª rodada', sub: 'Domingo de rodada', assistir: 'Premiere, Globo, SporTV, Record e Prime Video' },

  // Segunda 24/ago
  { data: '2026-08-24', hora: '', esporte: 'futebol', emoji: '⚽', genero: 'masc', titulo: 'Fecham a 24ª do Brasileirão e a 1ª da Premier League', sub: 'Os jogos que sobraram das duas rodadas', assistir: 'Premiere e Prime Video · ESPN e Disney+' },

  // Terça 25/ago
  { data: '2026-08-25', hora: '21h', esporte: 'futebol', emoji: '⚽', genero: 'masc', titulo: 'Copa do Brasil — CLÁSSICO MINEIRO nas quartas', sub: 'Cruzeiro x Atlético-MG no Mineirão · a volta é 1º/set, na Arena MRV', assistir: 'Globo, SporTV, Premiere e Prime Video', destaque: true },
  { data: '2026-08-25', hora: '', esporte: 'surfe', emoji: '🏄', genero: 'misto', titulo: 'Abre a janela do Fiji Pro, em Cloudbreak', sub: '8ª etapa do mundial · a WSL chama o dia quando o mar está bom · janela até 4/set', assistir: 'SporTV, Globoplay e WSL', destaque: true },

  // Quarta 26/ago
  { data: '2026-08-26', hora: '21h30', esporte: 'futebol', emoji: '⚽', genero: 'masc', titulo: 'Copa do Brasil — Palmeiras x Santos e Vasco x Vitória', sub: 'Clássico paulista nas quartas · as voltas são em 2/set', assistir: 'Globo, SporTV, Premiere e Prime Video', destaque: true },
  { data: '2026-08-26', hora: '', esporte: 'surfe', emoji: '🏄', genero: 'misto', titulo: 'Fiji Pro — janela aberta', sub: 'Vale olhar de manhã pra ver se chamaram o dia', assistir: 'SporTV, Globoplay e WSL' },

  // Quinta 27/ago
  { data: '2026-08-27', hora: '20h', esporte: 'futebol', emoji: '⚽', genero: 'masc', titulo: 'Copa do Brasil — GRENAL nas quartas', sub: 'Grêmio x Internacional no Beira-Rio · a volta é 3/set, na Arena do Grêmio', assistir: 'Globo, SporTV, Premiere e Prime Video', destaque: true },
  { data: '2026-08-27', hora: '', esporte: 'atletismo', emoji: '🏃', genero: 'misto', titulo: 'Diamond League — Zurique', sub: 'Última etapa antes da final de Bruxelas', assistir: 'SporTV e Xsports' },

  // Sexta 28/ago
  { data: '2026-08-28', hora: '', esporte: 'tenis', emoji: '🎾', genero: 'misto', titulo: 'US Open — semana de qualifying em Nova York', sub: 'Fan Week (23 a 29/ago), com o Mixed Doubles reformulado · a chave principal começa domingo', assistir: 'ESPN e Disney+' },
  { data: '2026-08-28', hora: '', esporte: 'futebol', emoji: '⚽', genero: 'misto', titulo: 'Brasileirão masculino e feminino', sub: 'Rodada do fim de semana nas duas competições', assistir: 'Premiere, Prime Video, CazéTV e GE TV' },

  // Sábado 29/ago
  { data: '2026-08-29', hora: '', esporte: 'skate', emoji: '🛹', genero: 'misto', titulo: 'SLS Tempe — o street mundial volta ao Arizona, onde nasceu', sub: 'Rayssa Leal, Pâmela Rosa, Kelvin Hoefler e Nyjah Huston · 4ª etapa do circuito', assistir: 'Rumble (grátis) e SporTV', destaque: true },
  { data: '2026-08-29', hora: '', esporte: 'futebol', emoji: '⚽', genero: 'masc', titulo: 'Brasileirão e Premier League — rodada do fim de semana', sub: 'Sábado cheio nos dois campeonatos', assistir: 'Premiere e Prime Video · ESPN e Disney+' },
  { data: '2026-08-29', hora: '', esporte: 'surfe', emoji: '🏄', genero: 'misto', titulo: 'Fiji Pro — janela aberta', sub: 'Cloudbreak', assistir: 'SporTV, Globoplay e WSL' },

  // Domingo 30/ago
  { data: '2026-08-30', hora: '', esporte: 'tenis', emoji: '🎾', genero: 'misto', titulo: 'COMEÇA O US OPEN, o último Grand Slam do ano', sub: 'Flushing Meadows, Nova York · vai até 13/set', assistir: 'ESPN e Disney+', destaque: true },
  { data: '2026-08-30', hora: '', esporte: 'futebol', emoji: '⚽', genero: 'masc', titulo: 'Brasileirão e Premier League — domingo de rodada', sub: 'Nos dois campeonatos', assistir: 'Premiere e Prime Video · ESPN e Disney+' },

  // Segunda 31/ago
  { data: '2026-08-31', hora: '', esporte: 'tenis', emoji: '🎾', genero: 'misto', titulo: 'US Open — 1ª rodada', sub: 'Chave de simples masculina e feminina', assistir: 'ESPN e Disney+' },
  { data: '2026-08-31', hora: '', esporte: 'basquete', emoji: '🏀', genero: 'fem', titulo: 'WNBA — últimos jogos antes da pausa do Mundial', sub: 'A liga para pras seleções, volta em 17/set e os playoffs começam em 27/set', assistir: 'ESPN e Disney+' },
];

// "Mais pra frente" — a próxima data marcante de CADA esporte fora dos próximos dias,
// pra nenhum ficar de fora. Peça "atualiza os esportes".
export const ESPORTES_PROXIMOS = [
  { esporte: 'atletismo', emoji: '🏃', genero: 'misto', evento: 'FINAL da Diamond League, em Bruxelas — quem ganha ali leva o título da temporada', quando: '4 e 5/set', assistir: 'SporTV e Xsports' },
  { esporte: 'formula1', emoji: '🏎️', genero: 'misto', evento: 'GP da Itália, em Monza — o templo da velocidade', quando: '4 a 6/set · depois Madri estreia no calendário (11 a 13/set)', assistir: 'Band, BandSports e F1 TV' },
  { esporte: 'basquete', emoji: '🏀', genero: 'fem', evento: 'Mundial feminino da FIBA, na Alemanha — a WNBA para pra seleção jogar', quando: '4 a 13/set', assistir: 'ESPN, Disney+ e DAZN' },
  { esporte: 'volei', emoji: '🏐', genero: 'misto', evento: 'Sul-Americano no Maracanãzinho, valendo vaga olímpica pra LA28', quando: 'Feminino 8 a 13/set · masculino 15 a 20/set · Brasil x Argentina no dia 13, 10h30', assistir: 'SporTV, GE TV e VBTV' },
  { esporte: 'surfe', emoji: '🏄', genero: 'misto', evento: 'Trestles Pro, na Califórnia — 9ª etapa do mundial', quando: '11 a 20/set · Lower Trestles', assistir: 'SporTV, Globoplay e WSL' },
  { esporte: 'ginastica', emoji: '🤸', genero: 'misto', evento: 'Mundial de Ginástica Artística — classifica as 3 melhores equipes pra LA28', quando: '17 a 25/out · Roterdã (Holanda)', assistir: 'SporTV e Globoplay' },
  { esporte: 'natacao', emoji: '🏊', genero: 'misto', evento: 'Mundial de piscina curta (25 m)', quando: '1 a 6/dez · Pequim (Water Cube)', assistir: 'SporTV e Globoplay' },
];
