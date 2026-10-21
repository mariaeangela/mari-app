// Sessão "Esportes" do Explorar.
// - ESPORTES: referência por esporte (regras + competições com o que é / quando / onde assistir).
//   Cada competição e cada evento tem `genero`: 'masc', 'fem' ou 'misto' (masc + fem).
// - ESPORTES_AGENDA: agenda dia a dia (jogo a jogo, horário de Brasília, onde assistir).
// - ESPORTES_PROXIMOS: "mais pra frente" — próxima data de cada esporte fora da janela.
//
// A Mari pede "atualiza os esportes" quando quiser: revejo a agenda dos próximos dias,
// as datas e a constante ESPORTES_ATUALIZADO.
export const ESPORTES_ATUALIZADO = '21 out 2026';

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
      { nome: 'Champions League (UEFA)', genero: 'masc', oque: 'O mata-mata dos melhores clubes da Europa — o título de clubes mais cobiçado. Há também a versão feminina.', quando: 'Setembro a maio · fase de liga até janeiro, final em maio/2027', assistir: 'HBO Max e TNT Sports' },
      { nome: 'Libertadores (CONMEBOL)', genero: 'masc', oque: 'A “Champions” da América do Sul. Tem edição masculina e feminina.', quando: 'Fevereiro a novembro · a FINAL de 2026 é em 28/nov, no Centenário (Montevidéu)', assistir: 'Globo (aberta/GE TV), ESPN/Disney+ e Paramount+' },
      { nome: 'Brasileirão (masculino e feminino)', genero: 'misto', oque: 'A liga nacional por pontos corridos — 20 clubes no masculino; o feminino cresce a cada ano.', quando: 'Masc.: abr–dez · Fem.: mar–out (o São Paulo foi campeão em 2026, o 1º título)', assistir: 'Globo, Premiere, Prime Video, CazéTV e GE TV' },
      { nome: 'Premier League e La Liga', genero: 'masc', oque: 'As ligas nacionais mais fortes da Europa (Inglaterra e Espanha).', quando: 'Agosto a maio · temporada 2026/27 rolando', assistir: 'ESPN e Disney+' },
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
      { nome: 'US Open', genero: 'misto', oque: 'O último Grand Slam do ano, em quadra dura, em Nova York.', quando: 'Fim de agosto a meados de setembro · próxima em 2027', assistir: 'ESPN e Disney+' },
      { nome: 'ATP Finals e WTA Finals', genero: 'misto', oque: 'Os torneios de encerramento, só com os 8 melhores do ano (um masculino, um feminino). O WTA Finals de 2026 saiu de Riad e foi pra Indian Wells (EUA).', quando: 'WTA: 8 a 15/nov (Indian Wells) · ATP: 15 a 22/nov (Turim)', assistir: 'ESPN e Disney+' },
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
      { nome: 'Mundial de Ginástica Rítmica', genero: 'fem', oque: 'A principal competição da rítmica — que no programa olímpico é só feminina (arco, bola, maças e fita).', quando: 'A de 2026 foi em agosto, em Frankfurt · próxima em 2027', assistir: 'SporTV e Globoplay' },
      { nome: 'Mundial de Ginástica Artística', genero: 'misto', oque: 'A principal competição da artística, com disputa masculina e feminina.', quando: '17 a 25/out/2026 · Roterdã (Holanda) — ACONTECENDO AGORA', assistir: 'SporTV e Globoplay' },
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
      { nome: 'Campeonato Pan-Pacífico', genero: 'misto', oque: 'Reúne as potências da bacia do Pacífico (EUA, Austrália, Japão, Canadá) mais convidados — e o Brasil é presença tradicional. Estava parado desde 2018.', quando: 'A de 2026 foi em agosto, em Irvine (EUA)', assistir: 'SporTV e Globoplay' },
      { nome: 'Copa do Mundo (World Cup)', genero: 'misto', oque: 'Circuito de etapas ao longo da temporada.', quando: 'A de 2026 foi em outubro (Baku, Tashkent e Astana) — já acabou', assistir: 'SporTV e World Aquatics' },
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
      { nome: 'SLS — Street League', genero: 'misto', oque: 'O principal circuito profissional de street, com disputa masculina e feminina.', quando: 'Última etapa: Tóquio, 14/nov · SUPER CROWN (a final do ano) em São Paulo, 12 e 13/dez, no Ibirapuera', assistir: 'Rumble (grátis) e SporTV' },
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
      { nome: 'NBA', genero: 'masc', oque: 'A liga masculina dos EUA — a mais forte do mundo, com os melhores jogadores.', quando: 'Começou em 20/out/2026 (Knicks são os atuais campeões) · temporada até abr/2027, playoffs até jun', assistir: 'ESPN, Disney+ e Prime Video' },
      { nome: 'WNBA', genero: 'fem', oque: 'A liga feminina dos EUA — a principal do mundo. Tem as brasileiras Kamilla Cardoso e Damiris Dantas.', quando: 'Maio a outubro · a temporada 2026 já acabou, volta em maio/2027', assistir: 'ESPN, Disney+ e Prime Video' },
      { nome: 'NBB e LBF (Brasil)', genero: 'misto', oque: 'As ligas nacionais de clubes: NBB (masculino) e LBF (feminino).', quando: 'NBB: out–mai (a temporada 2026/27 começou em 17/out) · LBF: mai–dez', assistir: 'SporTV, Band, ESPN e YouTube (LNB/LBF)' },
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
      { nome: 'Liga das Nações (VNL)', genero: 'misto', oque: 'O principal torneio anual de seleções, com disputa masculina e feminina.', quando: 'Junho a agosto · próxima em 2027', assistir: 'SporTV, GE TV e VBTV' },
      { nome: 'Superliga', genero: 'misto', oque: 'A liga nacional de clubes do Brasil, masculina e feminina — 12 times em cada.', quando: 'Out a abril · feminina começou em 17/out, masculina em 24/out', assistir: 'SporTV, Globoplay e GE TV' },
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
      { nome: 'Mundial de Pilotos e Construtores', genero: 'masc', oque: 'O campeonato principal, com 24 GPs pelo mundo. A F1 é masculina; a categoria feminina de acesso é a F1 Academy.', quando: 'Março a dezembro/2026 · Kimi Antonelli (Mercedes) lidera com folga e pode ser campeão já em Austin (25/out)', assistir: 'Globo, SporTV, Globoplay e F1 TV' },
      { nome: 'GP de São Paulo (Interlagos)', genero: 'masc', oque: 'A etapa brasileira, em Interlagos — uma das corridas mais imprevisíveis do calendário.', quando: '6 a 8/nov/2026 (corrida no domingo, 8)', assistir: 'Globo, SporTV, Globoplay e F1 TV' },
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
      { nome: 'Championship Tour (CT)', genero: 'misto', oque: 'A elite da WSL, com tour masculino e feminino. Brasil forte: Medina, Yago Dora, Ítalo, Tati Weston-Webb.', quando: '12 etapas de abril a dezembro · o título sai na última, em Pipeline (Havaí)', assistir: 'SporTV, Globoplay e site/redes da WSL' },
      { nome: 'Etapa de Peniche (Portugal)', genero: 'misto', oque: 'A penúltima etapa do ano, em Supertubos — tubos fortes em praia de areia. Pesa muito na briga pelo título.', quando: '22/out a 1º/nov/2026 · a WSL chama os dias conforme o mar', assistir: 'SporTV, Globoplay e WSL' },
      { nome: 'Pipe Masters (Pipeline)', genero: 'misto', oque: 'A última etapa e a decisão do título mundial, no Havaí. Em 2026 acabou o formato “WSL Finals”: o campeão sai da soma das etapas.', quando: '8 a 20/dez/2026', assistir: 'SporTV, Globoplay e WSL' },
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
      { nome: 'Wanda Diamond League', genero: 'misto', oque: 'O principal circuito mundial de etapas (corridas, saltos e lançamentos), masc. e fem. Destaque brasileiro: Alison dos Santos (Piu), nos 400 m com barreiras.', quando: 'Maio a setembro · a de 2026 já acabou (final em Bruxelas)', assistir: 'SporTV e Xsports' },
      { nome: 'Etapa de Londres (Diamond League)', genero: 'misto', oque: 'Uma das etapas mais fortes do circuito, no estádio olímpico de Londres.', quando: 'Julho, no estádio olímpico de Londres', assistir: 'SporTV e Xsports' },
      { nome: 'Mundial de Atletismo (World Athletics)', genero: 'misto', oque: 'O Mundial de pista e campo — o maior torneio da modalidade fora as Olimpíadas.', quando: 'Próxima edição em 2027', assistir: 'SporTV e Globoplay' },
      { nome: 'Jogos Olímpicos', genero: 'misto', oque: 'O ápice do atletismo, de 4 em 4 anos.', quando: 'Próxima: 2028 (Los Angeles)', assistir: 'Globo e SporTV' },
    ],
  },
];

// AGENDA dia a dia — cada jogo/sessão com data, horário (Brasília), gênero e onde assistir.
// Peça "atualiza os esportes" que eu revejo os próximos dias.
export const ESPORTES_AGENDA = [
  // Quarta 21/out
  { data: '2026-10-21', hora: '14h30', esporte: 'ginastica', emoji: '🤸', genero: 'fem', titulo: 'Mundial de Ginástica — FINAL POR EQUIPES feminina', sub: 'Roterdã · o Brasil, com Rebeca e Flavinha, entrou em 8º, a última vaga', assistir: 'SporTV e Globoplay', destaque: true },
  { data: '2026-10-21', hora: '16h', esporte: 'futebol', emoji: '⚽', genero: 'masc', titulo: 'Champions League — Bayern x Arsenal', sub: 'E Real Madrid x RB Leipzig no mesmo horário · 3ª rodada da fase de liga', assistir: 'HBO Max e TNT Sports' },
  { data: '2026-10-21', hora: '21h30', esporte: 'futebol', emoji: '⚽', genero: 'masc', titulo: 'Libertadores — SEMIFINAL: Palmeiras x Fluminense', sub: 'Volta, em São Paulo · o Palmeiras ganhou a ida por 2 a 1 no Maracanã', assistir: 'SBT, ESPN e Paramount+', destaque: true },
  { data: '2026-10-21', hora: 'noite', esporte: 'basquete', emoji: '🏀', genero: 'masc', titulo: 'NBA — Heat x Timberwolves e Warriors x Lakers', sub: 'Estreia de Giannis no Miami · a temporada abriu ontem', assistir: 'ESPN e Disney+' },

  // Quinta 22/out
  { data: '2026-10-22', hora: '21h30', esporte: 'futebol', emoji: '⚽', genero: 'masc', titulo: 'Libertadores — SEMIFINAL: Flamengo x Estudiantes', sub: 'Volta, no Maracanã · a ida na Argentina foi 0 a 0, então quem vencer vai à final', assistir: 'SBT, ESPN e Paramount+', destaque: true },
  { data: '2026-10-22', hora: '', esporte: 'surfe', emoji: '🏄', genero: 'misto', titulo: 'Abre a janela de Peniche (Portugal)', sub: 'Penúltima etapa do mundial, em Supertubos · a WSL chama o dia quando o mar está bom · até 1º/nov', assistir: 'SporTV, Globoplay e WSL', destaque: true },

  // Sexta 23/out
  { data: '2026-10-23', hora: '14h30', esporte: 'ginastica', emoji: '🤸', genero: 'fem', titulo: 'Mundial — FINAL DO INDIVIDUAL GERAL feminino', sub: 'Flavinha (12ª no classificatório) e Lorrane Oliveira na disputa', assistir: 'SporTV e Globoplay', destaque: true },
  { data: '2026-10-23', hora: '14h30 e 18h', esporte: 'formula1', emoji: '🏎️', genero: 'misto', titulo: 'GP dos Estados Unidos — treinos livres', sub: 'Austin, Texas · fim de semana sem sprint', assistir: 'SporTV, Globoplay e F1 TV' },

  // Sábado 24/out
  { data: '2026-10-24', hora: '9h', esporte: 'ginastica', emoji: '🤸', genero: 'fem', titulo: 'Mundial — FINAL DO SALTO com Rebeca Andrade', sub: 'Ela foi a melhor nota do classificatório (15.533) · a mesma sessão tem as barras assimétricas', assistir: 'SporTV e Globoplay', destaque: true },
  { data: '2026-10-24', hora: '18h', esporte: 'formula1', emoji: '🏎️', genero: 'misto', titulo: 'GP dos Estados Unidos — classificação', sub: 'Define o grid de domingo', assistir: 'SporTV, Globoplay e F1 TV' },
  { data: '2026-10-24', hora: '18h30', esporte: 'futebol', emoji: '⚽', genero: 'masc', titulo: 'Brasileirão — Palmeiras x Bragantino', sub: 'Briga pelo título: Flamengo 67 pontos, Palmeiras 66 · à tarde tem Inter x Botafogo e Mirassol x São Paulo', assistir: 'Premiere, Globo, SporTV, Record e Prime Video' },
  { data: '2026-10-24', hora: '', esporte: 'volei', emoji: '🏐', genero: 'masc', titulo: 'Começa a Superliga masculina', sub: 'Guarulhos x Azulim abre a temporada · a feminina já começou no dia 17', assistir: 'SporTV, Globoplay e GE TV', destaque: true },

  // Domingo 25/out
  { data: '2026-10-25', hora: '~10h', esporte: 'ginastica', emoji: '🤸', genero: 'fem', titulo: 'Mundial — finais de TRAVE e SOLO', sub: 'Flavinha foi 3ª na trave no classificatório · último dia em Roterdã (a Holanda muda o horário de verão, confira)', assistir: 'SporTV e Globoplay', destaque: true },
  { data: '2026-10-25', hora: '17h', esporte: 'formula1', emoji: '🏎️', genero: 'misto', titulo: 'GP dos Estados Unidos — A CORRIDA', sub: 'Antonelli pode ser campeão mundial aqui, com 5 corridas de sobra · 56 voltas', assistir: 'Globo, SporTV, Globoplay e F1 TV', destaque: true },
  { data: '2026-10-25', hora: '', esporte: 'futebol', emoji: '⚽', genero: 'masc', titulo: 'Brasileirão — Flamengo x Atlético-MG', sub: 'E Vasco x Corinthians e Santos x Bahia · rodada de sábado a segunda (confira os horários)', assistir: 'Premiere, Globo, SporTV, Record e Prime Video' },

  // Sexta 30/out
  { data: '2026-10-30', hora: '', esporte: 'formula1', emoji: '🏎️', genero: 'misto', titulo: 'GP da Cidade do México — treinos livres', sub: 'Autódromo Hermanos Rodríguez, na altitude', assistir: 'SporTV, Globoplay e F1 TV' },
  { data: '2026-10-30', hora: '', esporte: 'basquete', emoji: '🏀', genero: 'masc', titulo: 'Começa a NBA Cup', sub: 'O torneio dentro da temporada · fase de grupos até 27/nov, final em 11/dez', assistir: 'ESPN, Disney+ e Prime Video' },

  // Sábado 31/out
  { data: '2026-10-31', hora: '', esporte: 'formula1', emoji: '🏎️', genero: 'misto', titulo: 'GP do México — classificação', sub: 'Define o grid de domingo', assistir: 'SporTV, Globoplay e F1 TV' },
  { data: '2026-10-31', hora: '', esporte: 'tenis', emoji: '🎾', genero: 'masc', titulo: 'Começa o Masters de Paris', sub: 'Último Masters 1000 do ano, na La Défense Arena · vale vaga no ATP Finals · até 8/nov (algumas fontes dão início em 2/nov)', assistir: 'ESPN e Disney+' },

  // Domingo 1º/nov
  { data: '2026-11-01', hora: '16h e 18h30', esporte: 'futebol', emoji: '⚽', genero: 'masc', titulo: 'Copa do Brasil — SEMIFINAIS, jogos de ida', sub: 'Palmeiras x Vasco (16h) e Grêmio x Atlético-MG (18h30) · voltas em 7 e 8/nov, final em 6/dez em Brasília', assistir: 'Globo, SporTV, Premiere e Prime Video', destaque: true },
  { data: '2026-11-01', hora: '17h', esporte: 'formula1', emoji: '🏎️', genero: 'misto', titulo: 'GP do México — A CORRIDA', sub: 'Na semana seguinte é Interlagos', assistir: 'Globo, SporTV, Globoplay e F1 TV', destaque: true },
  { data: '2026-11-01', hora: 'manhã', esporte: 'atletismo', emoji: '🏃', genero: 'misto', titulo: 'Maratona de Nova York', sub: '50 anos do percurso pelos 5 distritos, da ponte Verrazzano ao Central Park · a pista já fechou a temporada', assistir: 'Transmissão no Brasil a confirmar · app e site da NYRR', destaque: true },
  { data: '2026-11-01', hora: '', esporte: 'surfe', emoji: '🏄', genero: 'misto', titulo: 'Último dia da janela de Peniche', sub: 'Se ainda não acabou, é hoje · depois só Pipeline, em dezembro', assistir: 'SporTV, Globoplay e WSL' },
];

// "Mais pra frente" — a próxima data marcante de CADA esporte fora dos próximos dias,
// pra nenhum ficar de fora. Peça "atualiza os esportes".
export const ESPORTES_PROXIMOS = [
  { esporte: 'formula1', emoji: '🏎️', genero: 'misto', evento: 'GP de São Paulo, em Interlagos', quando: '6 a 8/nov · depois Las Vegas, Catar e Abu Dhabi (fim em 6/dez)', assistir: 'Globo, SporTV, Globoplay e F1 TV' },
  { esporte: 'natacao', emoji: '🏊', genero: 'misto', evento: 'Copa do Mundo de águas abertas abre em Cancún', quando: '6 e 7/nov · e o Mundial de piscina curta em Pequim de 1 a 6/dez', assistir: 'SporTV, Globoplay e World Aquatics' },
  { esporte: 'tenis', emoji: '🎾', genero: 'misto', evento: 'WTA Finals (Indian Wells) e ATP Finals (Turim) — só os 8 melhores do ano', quando: 'WTA 8 a 15/nov · ATP 15 a 22/nov', assistir: 'ESPN e Disney+' },
  { esporte: 'skate', emoji: '🛹', genero: 'misto', evento: 'SLS Tóquio e depois o SUPER CROWN em São Paulo — Rayssa busca o 5º título seguido', quando: 'Tóquio 14/nov · Super Crown 12 e 13/dez, no Ginásio do Ibirapuera', assistir: 'Rumble (grátis) e SporTV' },
  { esporte: 'futebol', emoji: '⚽', genero: 'masc', evento: 'FINAL da Libertadores, em jogo único', quando: '28/nov · Estádio Centenário, Montevidéu', assistir: 'SBT, ESPN e Paramount+' },
  { esporte: 'surfe', emoji: '🏄', genero: 'misto', evento: 'Pipe Masters — última etapa, que decide os campeões mundiais', quando: '8 a 20/dez · Pipeline, Havaí', assistir: 'SporTV, Globoplay e WSL' },
];
