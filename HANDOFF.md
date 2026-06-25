# Diagonal — estado do projeto (nota de continuação)

App de cultura em React + Vite. Deploy: Vercel, a partir do GitHub
`mariaeangela/mari-app` (branch `main`). Publicar = `git push origin main`
(a Vercel republica sozinha). Senha do app (login): `taylor13` (em `src/Login.jsx`).

## Arquitetura
- `src/App.jsx` — tabs (Hoje/Explorar/Salvos), Header, responsivo
  (grade de 3 colunas no desktop via `useIsWide`, coluna única no mobile),
  relógio vivo (`useMinuteTick`) → edição muda às 6h/14h, datas à meia-noite.
  Navegação: `goTab(id)` reclica a aba ativa → bump em `homeNonce` (key de cada
  página) → remonta e volta à capa (sai de sub-páginas internas). Clicar em
  "diagonal" no Header também vai pra Hoje. A agenda "hoje" da capa (`HojeAgenda`)
  reaproveita `itemsForDay`; clicar no título de um item abre o `AddSheet` (exportado
  de Calendario.jsx) para editar direto na Hoje, sem ir ao Calendário. O bloco `Antecipacao`
  (capa) mostra contagem regressiva: viagem/aniversário, próxima prova de corrida, **compras com
  `dataLimite` nos próximos 7 dias** (label "comprar: …") e, por último, **eventos culturais que acabam
  (dataMax) nos próximos 30 dias** ("acaba em N dias"). Compras vêm antes das últimas chances culturais.
  A capa também tem `MetasHoje` (metas do mês corrente, slice `metas` do calendarStore — toque marca feito)
  e `PlanosProximos` (itens do checklist de Planos com `prazo` nos **próximos 15 dias**, toque =
  `togglePlanoCheck`). Ordem do `Feed`: Saudacao · NesteDiaFato · SeuDia · MetasHoje · Antecipacao ·
  LendoAgora · PlanosProximos · HojeAgenda.
- `src/ContentCard.jsx` — card; imagem multi-fonte (Met/Cleveland/Wikimedia),
  lightbox ao clicar na imagem, bloco "Da fonte" (`content.fonteOficial`).
- `src/contentLibrary.js` — todo o conteúdo: CONTENT_LIBRARY (arrays por tema
  ANTIGO, ainda usados), CARD_PALETTES, OPENING_QUOTES (frase do header, ~76), getEditionPeriod.
  Obs.: a aba "Frases" (humores + MOOD_QUOTES) foi REMOVIDA por completo.
  - **Dois bancos de fato por dia (chave = "mês-dia", ambos com 366 dias, inclui "2-29"):**
    `HISTORICAL_FACTS` alimenta o **"Neste dia…"** (capa de Hoje, via `getOnThisDay`
    em calendarConfig.js — usa o fato curado e só cai na Wikipédia se faltar); e
    `DAILY_FACTS` alimenta o **"Sabia que…"** (tela de senha, via `getTodayFact`).
    SÃO LISTAS SEPARADAS DE PROPÓSITO: "Neste dia" é fato datado ("em <ano>, …"),
    "Sabia que" é curiosidade atemporal — antes `getTodayFact` lia o HISTORICAL e as
    duas coincidiam. Curiosidades são únicas no ano todo (sem repetir entre meses).
    `getTodayDefaultFact` é só fallback se faltar chave em DAILY_FACTS.

## Conteúdo dos cards — REFORMA em curso (qualidade > quantidade)
A pedido da usuária: textos menos mainstream, mais escrita HUMANA real (e menos
texto de AI), com traduções e coisas obscuras.
- **18 temas → 5 categorias** (`CONTENT_TYPES` + `CATEGORY_SOURCES` em
  contentLibrary): **Texto** (cartas/filosofia/conceito/conexões + curadoria nova),
  **Imagem** (artwork/artist/photography/movement), **Cena** (film/music),
  **Mito & Sagrado** (mythology/religion/bible), **Mundo** (city/context/now).
  Cortados: **xadrez** e **health** (orfãos nos dados). Conexões preservada.
  Feed e Explorar usam `getCategoryDaily/getCategoryRandom(catId)` (App.jsx).
- **Formato novo de card** (array `texto` em CONTENT_LIBRARY; ContentCard detecta
  via `content.original||content.traducao`): titulo → original + tradução →
  "Sobre a obra" (trecho real de crítica/estudo, atribuído) → contexto (1 parág.
  meu) → ficha + fontes. SEM depender de imagem. Cards antigos (corpo/fonteOficial)
  seguem no formato antigo (renderização dupla no ContentCard).
- FEITO (vitrine): categoria **Texto** com 3 cards novos verificados (Pizarnik,
  Porchia, Izumi Shikibu) — original+tradução+Sobre a obra+contexto+ficha.
- FALTA: reformatar **Imagem, Cena, Mito & Sagrado, Mundo** (e os textos antigos
  letter/philosophy/concept/connection) no padrão novo, em lotes verificados na
  web; podar cards fracos. Política: original+tradução; análise humana real;
  nada inventado.
- `src/Login.jsx` — tela sazonal + saudação.
- Ícone do app: pintura da nadadora (`public/apple-touch-icon.png` etc.).

## Persistência na nuvem (salvos) — NOVO
Os "Salvos" agora são permanentes e sincronizam entre aparelhos (antes só
localStorage, que o iOS apagava). Camada:
- `api/data.js` — função serverless da Vercel. GET/POST em Redis (Upstash for
  Redis, criado no painel Vercel → Storage → conectado ao projeto mari-app; envs
  `KV_REST_API_URL`/`KV_REST_API_TOKEN` injetadas automaticamente). POST faz
  MERGE raso (chave `diagonal:data`), então já comporta `projetos` no futuro.
  `pickEnv()` casa as envs por sufixo, tolerando qualquer prefixo da Vercel.
- `src/cloud.js` — cliente GET/POST best-effort (debounce no POST).
- Anti-corrida (ambos os stores): um `dirty` ref impede que a resposta TARDIA
  da nuvem sobrescreva uma ação que o usuário acabou de fazer (corrigia o "X dos
  Salvos não remove" quando clicado antes do fetch da nuvem terminar).
- `src/savedStore.jsx` — store central (contexto `SavedProvider`/`useSaved`):
  cache local instantâneo + sync na nuvem; ao abrir com nuvem vazia e local
  cheio, MIGRA o local para cima. `localStorage` segue como cache/fallback
  offline (rodando `npm run dev` local não tem /api → cai no localStorage).
- A estrela (`ContentCard`) e a aba Salvos (`App.jsx`) usam `useSaved()`.
- IMPORTANTE p/ a 1ª vez: abrir primeiro no aparelho que JÁ tem os salvos
  (ele empurra pra nuvem); os outros aparelhos depois recebem da nuvem.
- Banco: `@upstash/redis`. Endpoint de produção: `/api/data`.

## Aba Calendário — Leva 1 (NOVO)
Aba "Calendário" (tab id `calendar`). Persistência na nuvem na chave
`calendario` de `/api/data` (POST faz merge; convive com `saved`).
- `src/calendarConfig.js` — CATEGORIES (5 categorias de evento: trabalho,
  viagem*, aniversários, saúde, datas pessoais; * = `aguardado` → contagem
  regressiva é SÓ viagem + corrida). EXERCICIO_SUBTIPOS tem `grupo`: treino
  (costas/peitoral/perna, cor por grupo), corrida* e outros (natação/caminhada/
  trilha/jogo/dança, cor cinza). EXERCICIO_LEGENDA agrupa em Costas/Peitoral/
  Perna/Corrida/Outros. itemsGeral exclui só o grupo 'treino' do Mês/Agenda
  (corrida e outros aparecem). Corrida exibida como "{dist}km - {nome}" (+ tempo real
  quando há). Corrida (form) tem `distancia`, `tempo` (real) e `metaTempo` — os dois
  tempos em SEGUNDOS. Helpers em calendarConfig.js: `parseTempo` ("h:mm:ss"/"mm:ss"/
  "32"=min → seg), `fmtTempo`, `paceSecs`(t,km), `fmtPace` (→ "m:ss/km"). O form mostra
  preview de pace ao vivo (real e meta). A **distância aceita decimais** (campo `type=text` +
  `inputMode=decimal` no form, p/ funcionar no celular): `parseKm` aceita vírgula OU ponto e guarda
  como número; `fmtKm` exibe com **ponto** e 1 casa (preferência da Mari). Todo lugar que mostra km usa
  `fmtKm` (Calendário, Retrospectiva, Saúde). `metaTempo` guardado em SEGUNDOS; helper `metaLabel`
  exibe formatado (tolera string legada). "Próximas corridas" (visão Exercício) e "Próximas metas"
  (Life→Saúde) mostram **🎯 m:ss**; a edição inline da Saúde salva via `parseTempo`. CULTURA_SUBTIPOS
  (lendo, lido, filme, série, exposição, museu, show, espetáculo). MOODS (5:
  ótimo/bem/triste/estressado/ansioso, sem emoji). LEGENDA (chips de cor).
  `getOnThisDay()` (fato curado de HISTORICAL_FACTS, senão efemérides da
  Wikipédia pt via api.wikimedia.org, cache em memória por MM-DD).
- `src/calendarStore.jsx` — CalendarProvider/useCalendar; cache local
  (`diagonal_calendario`) + sync nuvem (cloud.js: fetchCalendario/pushCalendario).
  Seeds idempotentes via `runSeeds` (aplicado no init e nos dois ramos do fetch):
  `ensureLembreteSpotify` (tarefa mensal) e `ensureLivrosLidos2026` (4 livros lidos
  da Mari como cultura subtipo 'lido', ids estáveis `seed-livro-*`, flag
  `livrosLidos2026Seeded`) e `ensureProvasCorrida` (provas de corrida feitas, exercicio
  `corrida_prova`, ids `seed-prova-*`, flag `provasCorridaSeeded` — ex.: Corrida 7km SP
  12/04/2026, 7km, tempo 50:46, meta 50:00). `ensureProvasCorrida` tem também um **patch único**
  (flag `prova7kmMetaSet`) que preenche `metaTempo` na prova já semeada sem mexer se a Mari editou —
  padrão útil quando precisa atualizar um seed que já rodou (a flag de seed sozinha faz early-return).
  Para semear mais conteúdo, criar outra `ensure*` e encadear em `runSeeds`.
  Dados: events[], exercicios[], tasks[], roles[], cultura[], moods{}, diary{},
  savedRoles[], **metas{}** (chave 'YYYY-MM' → [{id,texto,feito}]; CRUDs `addMeta`/`toggleMeta`/`deleteMeta`).
- `src/Calendario.jsx` — UI: "Neste dia" + "você há N anos" + contagem
  regressiva (só viagem/aniversário/corrida). `+` no topo abre AddSheet (tipos:
  Evento, Exercício, Tarefa, Rolê, Cultura — escolhe data no form). Visões: Mês
  (grade c/ pontinhos + LEGENDA), Agenda (Próximos/Passado), Exercício (também
  um CALENDÁRIO, só pontinhos de treino+corrida, + contagem), Humor (mapa de
  cores). Treino só aparece na visão Exercício; corrida aparece em todas. Itens
  do dia em ordem cronológica de horário (helper byTime; itemsGeral exclui
  treino do Mês/Agenda). DayModal: humor + diário + itens do dia. Sempre no fim
  da página: "Lendo no momento" (cultura subtipo lendo) com botão "concluído"
  que vira subtipo 'lido' na data de hoje; e "Tarefas sem data". Na visão Mês há
  também "Compras do mês" (dataLimite), "Cultural do mês" (dataMax) e **"Planos do
  mês"** — agrupado por plano: prazo do próprio plano + **itens do checklist com
  `prazo` no mês** (pendentes, com ✓ que chama `togglePlanoCheck`); e **"Metas de {mês}"**
  (`MetasMes`, slice `metas` — add/✓/apagar por mês exibido). **`itemsForDay(data, date, planos?)`**
  aceita um 3º arg opcional (`life.planos`): injeta itens do checklist com `prazo===dia` (não-feitos) como
  `_tipo:'plano'` (cor `PLANO_COR`, `_planoNome`), entrando nos pontinhos do Mês, na Agenda e no DayModal
  (bloco "Planos", ✓ = `togglePlanoCheck`). Eventos:
  intervalo, hora, repetir, "com quem". Tarefas têm ✓ (com ou sem data). Rolês:
  opções do dia c/ horário (sem ✓; editar usa updateRole p/ não duplicar).
  Exercício: treino/corrida c/ hora e distância (corrida). Cultura alimentará Projetos.
- Visão Humor tem sub-abas: Mês (grade), Ano (12 mini-meses coloridos por humor,
  YearMoodGrid/MiniMonth) e Diário (DiarioList: dias do mês com humor+linha do
  diário, mais recente primeiro). Tudo dentro da aba Humor (não polui o Mês).
- Bilhete para o futuro: `bilhetes{}` (chave = dia). Escreve-se no DayModal de um
  dia FUTURO; no dia marcado aparece um aviso no topo do calendário (toque p/ ler).
- Leva 2 (parcial): a **retrospectiva de exercícios** (treinos/tipo, km, total no ano) já
  existe na **Saúde** (puxa `cal.data.exercicios`). FALTA o card **Retrospectivas** juntar o
  resto (livros lidos, filmes, nº museu por mês/ano), o **"quem você viu"** somado (campo
  `comQuem`), e a aba **Estudos**.

## Aba Life — seções (`src/Life.jsx` + `src/lifeStore.jsx`)
Hub `LifePage` com cards (SECOES). `lifeStore` = mesma estrutura dos Salvos (cache local
`diagonal_life` + sync nuvem via `cloud.js`/`/api/data`, merge raso). Slices em `data`:
`compras`, `cultural`, `planos` (DEFAULT_PLANOS), `financas`, `salarios` (DEFAULT_SALARIOS),
`gastos` (DEFAULT_GASTOS), `saude`. Seeds históricos (salários/gastos/pesos) **persistem ao
1º salvar** (`{...DEFAULT, ...atual, [tipo]: next}`). `useLife()` expõe os CRUDs.
**Planos**: hub tem botão ⚙ ("Gerenciar planos") para **reordenar** (↑↓ via `movePlano`) e apagar —
mesmo padrão do ⚙ de Aprendizados/Compras.
**Compras**: itens têm campo opcional **`grupo`** (sublista) — `ComprasSection` renderiza agrupado
(sem-grupo primeiro, depois cada grupo c/ header); `ComprasForm` tem campo "Sublista / grupo" (datalist).
Dentro de cada grupo, itens ordenados por **data limite** (`porData`: mais próxima primeiro, sem data
por último, comprados no fim).
Listas semeadas idempotentes (flags): **Maquiagem** (`ensureMaquiagem`) e **NY26** (`ensureNY26` —
acha a lista pelo nome, USD, ~45 itens em 7 grupos com teto no nome do grupo). A lista **Maquiagem**
tem 3 grupos (`ensureMaquiagemGrupos`): **Compras decididas / Experimentar BR / Comprar fora** — todos
itens reais checáveis. As 3 notas `tipo:'compras'` do tópico Maquiagem (Aprendizados) são espelhos
**filtrados por grupo** (`ComprasMirror` aceita `grupo`): editar/adicionar de um lado reflete no outro.
O slice `cultural` segue no `lifeStore`, mas sua UI — `CulturalSection` ("Calendário cultural",
exportada de `Life.jsx`) — agora é renderizada na aba **Explorar** (tile próprio), não na Life.
Dentro da `CulturalSection` há um botão **"↻ Eventos recorrentes"** (estado `verRec`) que abre a sub-view
`RecorrentesView`/`RecorrenteForm`: opções que se repetem, pra consultar quando estiver em dúvida do que
fazer. Slice próprio `recorrentes:[{id,nome,freq,dias?,hora?,cidade?,local?,preco?,link?,nota?}]` no
`lifeStore` (CRUD `saveRecorrente`/`deleteRecorrente`; ids `r-*`). O "quando" é **estruturado**:
`freq` ∈ `REC_FREQS` (Semanal/Mensal/Outro, chips no form), `dias` = índices 0–6 (caixinhas Dom–Sáb,
mesmo padrão do funcionamento da `CulturalForm`) e `hora` (input time). A **Nota** é onde se explica
(sobretudo no "Outro", ex.: "1ª sexta do mês"). `fmtRecQuando(it)` monta a linha exibida
("Semanal · seg, ter, sáb · 08h30"); `recDiasLabel` formata os dias; tolera o campo legado `quando`
(texto livre) como fallback. **SEM tipo/categoria** (a Mari não quis chips/select/badge) e **sem
subtítulo** — só cadastrar a opção. Filtros: **cidade** (só aparece com 1+ cidade) e **dia da semana**
(chips Dom–Sáb, só aparece quando algum item tem `dias`; `diaSel` ∈ 0–6 ou `null`); sem seed. ATENÇÃO
Regras de Hooks: o `if (verRec) return …` fica DEPOIS de todos os `useState` da `CulturalSection`.
Outra tile da Explorar: **`LeiturasSection`** ("Próximas leituras", exportada de `Life.jsx`) — livros em
casa a ler. Slice `leituras:[{id,titulo,autor?,pais?,idioma?,ano?,genero?,temas:[string],nota?,lido?}]` no
`lifeStore` (CRUD `saveLeitura`/`deleteLeitura`/`toggleLeituraLido`; ids `lv-*`). **Tema em vez de sinopse**
(sem spoiler), **3–5 temas por livro** (preferência da Mari). As tags de tema aparecem no card e são
clicáveis (viram filtro). `idioma` (original) é campo SEPARADO de `pais`. Filtros por **tema · gênero ·
idioma · país · década** (chips `filtroRow`, cada um só aparece com 2+ valores; década = `decadaDe(ano)`). Cards
ordenados por título; lidos vão p/ "já lidos" colapsável. `LeituraForm` tem datalist de país/gênero e temas
por vírgula. **Páginas** (do print do Skoob ou média da internet) no card + **ordenação A–Z / ↑ páginas**
(ajuda a escolher o que ler por tempo). **Toggle "A ler / Já lidos"** (estado `aba`) no topo: troca de "tela"
entre os não-lidos e os lidos, ambos com os MESMOS filtros e cards iguais (lidos NÃO ficam riscados; o ✓ do
card move o livro entre as abas). Contagem na aba reflete o filtro ativo. Seed dos **lidos**: `LEITURAS_LIDOS_SEED` em `src/leiturasSeed.js`
(~181 livros do Skoob, limpos: título/autor/país/idioma/ano/gênero/páginas/temas) → `ensureLeiturasLidos`
(flag `leiturasLidosSeeded`, ids `lv-lido-N`, `lido:true`) em `runLifeSeeds`. Temas **consolidados** num
vocabulário de **58 canônicos** (`TEMA_CANON` em leiturasSeed.js) via patch `ensureLeiturasTemasV2` (flag
`leiturasTemasV2`): funde sinônimos, descarta lugares (Paris/Nápoles/…), dedupe + teto 5; aplica a TODAS as
leituras (não só o seed). Pra mudar o vocabulário no futuro: editar `TEMA_CANON` + nova flag. Campo **`tipo`** (`'ficção'` |
`'não ficção'`) — filtro próprio (Tudo/Ficção/Não ficção, 1ª linha) + toggle no form; patch
`ensureLeiturasTipo` (flag `leiturasTipo1`) classifica os já semeados (lista `NAOFICCAO_TITULOS` → não
ficção, resto → ficção). **A ler** (livros de casa): `LEITURAS_CASA_SEED` + `ensureLeiturasCasa` (flag
`leiturasCasaSeeded`, ids `lv-casa-N`, `lido:false`); 1º lote = 7 livros. Mais livros = estender o array
(novos índices não duplicam) ou novo `ensureLeiturasCasa2`.
Mesma ideia: **`AssistirSection`** ("Conteúdos para assistir", exportada de `Life.jsx`, tile próprio na
Explorar) — vídeos/matérias para depois. Slice `assistir:[{id,url,titulo?,tipo:'video'|'artigo'|
'outro',nota?,feito?,criadoEm}]` no `lifeStore` (CRUDs `saveAssistir`/`deleteAssistir`/`toggleAssistir`;
novos itens entram no topo). UI: filtro por tipo, checkbox marca "visto" (vai p/ "já vistos"), ↗ abre o
link, clicar edita. Tipos: vídeo/série/filme/álbum/livro/artigo/outro. Lista de livros da Mari semeada
via `ASSISTIR_LIVROS_SEED`/`ensureAssistirLivros` (flag `assistirLivrosSeeded`, em `runLifeSeeds`).
`ensureAssistirLivrosV2` (flag `assistirLivrosV2`) é um patch único que quebra o item combinado do
Sándor Márai (asl8) em 4 livros individuais padronizados — só age se o item original estiver intacto.
- **Planos: seed Carnaval 2027** — `ensureCarnaval2027` (flag `carnaval2027Seeded`) adiciona um plano à
  `planos` (lista/infos/itens; base = `d.planos || DEFAULT_PLANOS`): info "Placas" + checklist com
  Fantasias e Coisas a comprar (prefixados "Fantasia:" / "Comprar:" porque o checklist é plano, sem grupo).

- **Vida Financeira** (`FinancasSection`) — 3 sub-abas (estado `sub`): **Carteira** /
  **Salários** / **Gastos**.
  - Carteira: `financas.snapshots = [{ id, mes, usdRate, holdings:[{nome,categoria,
    finalidade,valor,moeda:'BRL'|'USD',externo}] }]`. `valorBRL(h,rate)` converte USD pela
    `usdRate` do mês (travada; `rateOf(snap)`; `fetchUsdRate(mes)` = AwesomeAPI, atual no mês
    corrente / fechamento nos passados). Helpers: `totalCarteiraBRL`, `gruposPorFinalidade`,
    `agregarCat`. Views: `FinTabela` (Por categoria/ativo, ordem Reserva→Investimento→Aposta
    via `FIN_ORDEM`/`finRank`), `FinPizza`/`PizzaFin` (ativo/categoria/finalidade/moeda,
    hover), `FinEvolucao`/`EvolucaoFin` (linha preta + tooltip; séries carteira/ativo/cat/fin).
  - Salários: `SalariosVida`/`SalarioForm`, `salarios=[{ano,idade,cargo,meses[12],extra,
    bonus,yoy?,pl?,metaPL?}]`. Destaques do ano (ganhei / % poupei = ΔPL/renda / meta PL com
    barra). `BarrasSalario({barras,fmt})` (genérico). Patrimônio 2026 = snapshots da carteira.
  - Gastos: `GastosVida`/`GastoForm`/`TabelaGastos`/`LinhasGastos`, `gastos=[{mes,itens:
    [{categoria,valor}]}]`. Views Mês / Tabela (mês recente 1º) / Linhas (1 por categoria,
    eixo Y, valores ao focar). Campo de valor aceita conta via `evalValor()`.
- **Saúde** (`SaudeSection`/`SaudeForm`/`PesoLinha`) — usa `useLife()` e `useCalendar()`.
  `saude = { pesos:[{data,valor,treino:'pre'|'pos',periodo:'manha'|'tarde'|'noite'?,local}],
  remedios:[{nome,dose?,duracao?,inicio?,ativo}], vacinas:[{nome,data}], menstruacao:[{data}] }`.
  CRUD genérico `saveSaudeItem(tipo,item)`/`deleteSaudeItem`. Blocos: Consultas (events com
  `categoria==='saude'` do calendário), Exercícios (retrospectiva de `cal.data.exercicios`:
  barras/mês, por tipo, musc×corrida, km, total no ano — usa `EXERCICIO_BY_ID`), Peso (gráfico
  `PesoLinha` com folga no eixo + filtros local/treino/período), Remédios, Vacinas, Menstruação.
  Pesos jan–jun/2026 seedados em `DEFAULT_PESOS`. `normPeriodo()` mapeia 'dia' (legado) → manhã.
- **Aprendizados** (`AprendizadosSection`/`TopicoView`/`NotaCard`/`NotaForm`) — hub de **tópicos**
  (assuntos); cada tópico tem **notas** (título + `itens:[string]`, accordion tipo infos dos Planos).
  Notas **aninham 1 nível** via `paiId` (nota-mãe = "método/categoria"; filhas = receitas/materiais).
  `NotaCard` é recursivo; "+ adicionar dentro" só aparece em notas de topo (nível 0). Hub conta só
  as notas de topo. `aprendizados = { topicos:[{id,nome}], notas:[{id,topicoId,paiId?,titulo,itens[]}] }`
  no `lifeStore` (CRUDs `addAprendTopico`/`deleteAprendTopico`/`moveAprendTopico`/`saveAprendNota`/`deleteAprendNota`).
  O hub tem botão ⚙ ("Gerenciar tópicos") que abre painel para **reordenar** (↑↓ via `moveAprendTopico`)
  e apagar tópicos — mesmo padrão do ⚙ das listas de Compras.
  `NotaForm` edita os itens por textarea (1 linha = 1 item). Notas novas ganham `criadoEm` (Date.now) e
  o `TopicoView` ordena as notas de topo por ele **(mais novas primeiro)**; notas antigas/sem `criadoEm`
  ficam abaixo na ordem original (não bagunça tópicos curados). `saveAprendNota` faz merge ao editar (preserva `criadoEm`).
  **Vinhos** têm form próprio (`WineForm`,
  campos país/região/nome/uva/info/data → nota `tipo:'vinho'`): notas-mãe com `grupoVinho:true`
  (Branco/Tinto/Espumante) mostram "+ adicionar vinho" e os filhos `tipo:'vinho'` renderizam em layout
  de vinho (badge país + meta + info) em vez de bullets. Notas `tipo:'compras'` (com `listaId`) renderizam
  um **espelho ao vivo** de uma lista de Compras (`ComprasMirror` — mesmos itens da aba Compras, com
  checkbox; marcar/adicionar/apagar reflete nos dois lados, é o mesmo dado). Seed `DEFAULT_APRENDIZADOS`:
  **Café** (V60 com as receitas dentro), **Tecidos** (Tipos de tecido + Fibras nat./art./sint.),
  **Fotografia analógica** (câmera→filmes), **Vinhos** (Classificação + Branco/Tinto/Espumante), **Vida**
  (dinheiro/saúde/sentimentos/viagem) e **Maquiagem** (conhecimento + "Para comprar" espelhando a lista de
  Compras **Maquiagem**, semeada idempotente por `ensureMaquiagem`/flag `maquiagemSeeded` por causa do
  merge raso; "Para provar" só referência). Adicionar tópico/nota/sub-nota/vinho pela própria UI.
- Pendências Life: Estudos (placeholder via `SubPlaceholder`). Ver `ROADMAP.md`.
- **Viagens** (`ViagensSection`/`ViagemDetail`/`ViagemForm`/`MesaLinkForm`, em Life.jsx) — viagens
  **futuras/em curso**. Slice `viagensFuturas:[{id,titulo,cidade,inicio,fim,hospedagem?,passagens?,notas?,
  link?,homenageada?:{nome,texto,link},mesas?:[{id,n,dia,hora,titulo,autores,link?,desc?}],
  levar?:[{id,texto,feito}],comprar?:[…]}]` no `lifeStore` (CRUD `saveViagemFutura`/`deleteViagemFutura`;
  ids `vf-*`). Hub lista as viagens ordenadas por início com chip de status (`statusViagem`: faltam N dias /
  é amanhã / começa hoje / rolando agora / terminou). Detalhe: header + site oficial + blocos Hospedagem/
  Passagens (textareas no `ViagemForm`), Autora homenageada, **Programação** (mesas por dia, com sinopse
  `desc`; tocar numa mesa abre `MesaLinkForm` p/ colar o link), e **DUAS** checklists separadas — "O que
  levar" (`levar`) e "O que comprar" (`comprar`), inline via `listaCheck(campo,…)`. (Sem aviso/nota do Modo
  Viagem na UI — a Mari pediu pra manter o comportamento sem o banner.) Seed **FLIP 2026** (`ensureFlip2026`/
  flag `flip2026Seeded`, id `vf-flip2026`): 22–26/jul/2026, Paraty, 21 mesas (títulos = versos da Orides
  Fontela), datas/autores/**link oficial**/**sinopse** por mesa (`FLIP_MESA_DESCS`) + bio rica da homenageada.
  Patches: `ensureFlipMesaLinks` (flag `flipMesaLinks1`, preenche link onde vazio) e `ensureFlipDetalhes`
  (flag `flipDetalhes1`: preenche `desc` onde vazia, atualiza a bio da homenageada, migra `checklist`→`levar`).
  Nenhum sobrescreve o que a Mari editou. Encadeados em `runLifeSeeds`.

## Modo Viagem (`src/cidadeFatos.js` + Login/App)
Com viagem ativa (da **véspera ao fim**: hoje ∈ [início−1, fim]), a tela de **senha**, a **capa de Hoje** e
uma **faixa** no topo do app viram *"Bom dia em {cidade}"* + um fato da cidade. Detecção pura em
`getViagemAtiva(viagensFuturas, hoje)` (lifeStore, exportada); `getViagemAtivaCache()` lê o cache local
`diagonal_life` p/ a **tela de senha**, que roda ANTES dos providers (Login não tem `useLife`). Fatos por
cidade em `cidadeFatos.js` (`CIDADE_FATOS` + `getCidadeFato(cidade,date)` girando por dia); só **Paraty**
por ora (6 fatos verificados). Pontos: `Login.jsx` (senha), `Saudacao` (capa) e `FaixaViagem` (faixa, dentro
do sticky do Header, só aparece com viagem ativa) em App.jsx. Datas vêm da viagem cadastrada em Life→Viagens.

## Aba Retrospectiva (`src/Retrospectiva.jsx`) — NOVO
Virou **aba própria** (tab `retrospectiva`, ao lado de Life). Hub: **"ano em números"** (cultura+
exercícios do calendário, por ano, sem futuros) com cada número **clicável** (drill-down → lista os
itens) + grade de **cards** que abrem sub-páginas: **Compras**, **Música** e **Corridas** (prontos) e
Quem você viu / Viagens / Saúde / Amorosa (placeholder `EmBreve`).
- **Corridas** (`CorridasRetro`/`PaceChart`): provas (`corrida_prova`, + legado `corrida`) com
  meta × executado — tempo real, pace real e pace meta (via helpers de calendarConfig), delta
  "bateu/acima da meta", totais (nº provas, km, melhor pace) e **gráfico de evolução do pace**
  (SVG, mais alto = mais rápido). Sem CRUD próprio: lê das provas marcadas no Calendário.
- **Compras**: fonte ÚNICA — `life.comprasFeitas` (histórico próprio, editável, marcado manualmente
  aqui). As **listas de compras NÃO alimentam mais** esta retrospectiva (decisão da Mari, jun/2026:
  valores mudam e nem tudo está na lista). Agrupado por mês, subtotal em R$ por mês. Form
  `CompraFeitaForm` (nome/data/valor/categoria). `comprasFeitas` é slice do `lifeStore`
  (CRUD `saveCompraFeita`/`deleteCompraFeita`); seed histórico jan–jun/2026 via
  `ensureComprasFeitas` (flag `comprasFeitasSeeded`). IMPORTANTE: a lista de Compras (Life) **não**
  alimenta esta retrospectiva — o antigo botão "limpar comprados → histórico" (`arquivarComprados`) foi
  REMOVIDO da UI porque vazava itens da lista pra cá; marcar item como comprado só fica na própria lista.
  `arquivarComprados` segue no store, mas sem nenhum chamador.
- **Música** (`MusicaRetro`/`MusicaForm`): 1 registro por mês (`life.musica = [{id,mes,minutos,artista,
  musica}]`, CRUD `saveMusica`/`deleteMusica`; seed jan–mai/2026 dos prints do Spotify via
  `ensureMusica`/flag `musicaSeeded`). Mostra total de minutos do ano + **toggle Lista/Gráfico**: Lista =
  cada mês (minutos/horas, top artista, top música); Gráfico = `MusicaGrafico` (barras de minutos por mês,
  tap mostra o valor + ranking de artistas e músicas por nº de meses como top no ano). O card no hub da
  Retrospectiva é `pronto:true` (mostra a descrição, não "em breve"). **Lembrete recorrente** no Calendário (`ensureLembreteSpotify` no
  `calendarStore`, flag `lembreteSpotifySeeded`): tarefa mensal "Cadastrar Spotify do mês passado"
  (data dia 1, `repetir:'mensal'`) — aparece no Calendário e no **Hoje** (via `HojeAgenda`) todo dia 1.
- **Seletor de ano nos sub-cards**: `useAnoSel(datas)` + `<AnoChips>` (em Retrospectiva.jsx) — Compras,
  Música e Corridas filtram pelo ano selecionado (chips só aparecem com 2+ anos; default = ano atual,
  cai no mais recente com dados). Compras sem data aparecem em qualquer ano.
- **Compras: gráfico** (`ComprasChart`) — barras empilhadas por mês (só compras em R$): altura da barra =
  total do mês (evolução), cada faixa = uma compra (maior embaixo, paleta multicolor `PALETTE`), nº embaixo
  = qtd no mês; toque numa faixa mostra a compra + valor. USD fica de fora do gráfico (sem taxa).
- **Compras → Coisas caras** (`CoisasCarasView`/`CoisaCaraForm`) — botão dentro da Retrospectiva de
  Compras. Slice `coisasCaras:[{id,nome,ano,half(1|2=semestre),fimAno?,fimHalf?}]` no `lifeStore`
  (CRUD `saveCoisaCara`/`deleteCoisaCara`; seed `COISAS_CARAS_SEED`/`ensureCoisasCaras`, flag
  `coisasCarasSeeded` — Kindle 1H17, Computador 1H18, Tablet 2H22, iPhone 1H25). Mostra "comprei no
  {sem.} de {ano}" e duração: "em uso há X" (sem fim) ou "durou X" (com fim). ATENÇÃO Regras de Hooks:
  o early-return `if (verCaras)` fica DEPOIS de todos os hooks (inclui `useAnoSel`).
- **Viagens** (`ViagensRetro`/`ViagemForm`) — card com stats (viagens/cidades/países), barras de viagens
  por ano, países com bandeiras (derivados das viagens, `PAIS_FLAG`) e timeline por ano. Slice
  `viagens:[{id,ano('jovem'|'YYYY'),titulo,locais[],paises[]}]` no `lifeStore` (CRUD `saveViagem`/
  `deleteViagem`; seed `VIAGENS_SEED`/`ensureViagens`, flag `viagensSeeded`). Países e cidades são
  derivados (não duplicar); 'jovem' ordena antes de tudo (`vAnoKey`).
- **Dias importantes** (`DiasRetro`/`DiasForm`) — card de marcos de vida. Slice `marcos:[{id,data,titulo}]`
  no `lifeStore` (CRUD `saveMarco`/`deleteMarco`; seed `MARCOS_SEED`/`ensureMarcos`, flag `marcosSeeded`).
  Timeline cronológica por ano (usa `useAnoSel`/`AnoChips`). Os seeds do Life agora passam por um único
  `runLifeSeeds(d)` (encadeia ensureMaquiagem→…→ensureMarcos), usado nos 3 pontos do `LifeProvider`.
- **"Ano em números" (RetroHome)**: os números de corrida são **"provas de corrida"** (só
  `corrida_prova`/legado `corrida`; drill-down lista data · km · tempo) e **"km corridos"** (soma de
  TODAS as corridas — prova + treino). "km corridos" é clicável → `KmDrilldown` com toggle **por data**
  (cada corrida com tag prova/treino, km e tempo) e **por mês** (km/mês com barras = evolução).
  "treinos" é clicável → `TreinoDrilldown`: barras horizontais com contagem por tipo (Costas 2x…),
  clicar num tipo expande as datas daquele treino.
- **Gastos** (`GastosRetro`) — ÚNICO card de finanças na Retrospectiva (o antigo card "Compras" foi
  removido; agora é a categoria **Coisas** dentro de Gastos). Lê `life.gastos` (Vida Financeira, sem
  duplicar). Hub = **grid de cards**, um por categoria (`GASTO_CATS`, cor por índice via `GASTO_CORES`/`catCor`),
  cada card com total + % do ano. Clicar num card abre a categoria:
  **Coisas** → reusa `ComprasRetro` (itemizado, `backLabel="Gastos"`); categorias **detalhadas** (têm
  `gastosItens`) → design de Compras (`ComprasChart` + lista por mês com valor de cada item + form);
  categorias **sem detalhe** → total por mês (fallback). O gráfico do detalhe tem toggle **barras/linhas**
  (`ComprasChart` × `LinhasGastoChart`); default = **linhas** quando 3+ itens se repetem em vários meses
  (ex.: Fixos), senão barras. `LinhasGastoChart`: uma linha por item ao longo dos meses; tocar na legenda
  isola o item (auto-escala) e lista os valores por mês. Abaixo do gráfico, `GastoTabela`: itens nas
  linhas × meses nas colunas (mês mais recente à ESQUERDA), 1ª coluna sticky, linha Total, célula
  clicável p/ editar o item. Seeds itemizados: `ensureGastosPresentes`,
  `ensureGastosFixos` (Fixos jan–jun, padronizado: Personal/Faxina/Conta de luz unificados). `runLifeSeeds`
  agora é um `reduce` sobre a lista de seeds (evita inferno de parênteses). Deep-link: `nav.goRetro('gastos', categoria)`
  abre direto o card da categoria (codificado em `secInicial='gastos:Categoria'`, parseado no
  `RetrospectivaPage`). Link "ver ›" em cada categoria da **Vida Financeira → Gastos** usa isso.
  **Quebra itemizada**: slice `gastosItens:[{id,mes,categoria,nome,valor}]` no `lifeStore` (CRUD `saveGastoItem`/
  `deleteGastoItem`; form `GastoItemForm`). Quando uma categoria tem itens, o detalhe lista item a item
  agrupado por mês (com subtotais); senão cai no total mensal da VF. Seeds por categoria: `ensureGastosPresentes`
  (flag `gastosPresentesSeeded`) — os itens somam o total da categoria. Próximas categorias = nova `ensure*`/flag.
- **Navegação entre abas**: `src/nav.jsx` (`NavContext`/`useNav`) — App expõe `goRetro(sec)` (genérico) e
  `goRetroCompras()`
  (seta `retroSec` + `goTab('retrospectiva')`; `RetrospectivaPage` lê `secInicial`). Usado pelo botão
  "Ver minhas compras feitas" e pelo link "ver compras ›" na linha **Coisas** dos Gastos (Vida
  Financeira). Importante: esse link é SÓ navegação — a Retrospectiva de Compras mostra apenas o
  histórico manual (`comprasFeitas`), NÃO se atualiza ao marcar/adicionar itens na lista de compras.

## Fontes — convenção do bloco "Da fonte"
Cada card pode ter:
```
fonteOficial: { texto: '<parágrafo VERBATIM da fonte>', veiculo: 'Wikipédia', url: '<link>' }
```
Regras: NUNCA traduzir/reescrever (seria "texto de AI"); usar trecho verbatim.
Idioma: PT > Espanhol > Inglês (rotular "Wikipédia (em espanhol/inglês)").
Trechos de ~1 parágrafo. Busca via API: pt.wikipedia.org/api (exintro).

## Cobertura das fontes — CONCLUÍDA (~90 cards)
Feito: Arte, Cidades, Mitologia, Filosofia, Música, Cinema, Conceito, Cartas,
Movimentos, Artista, Xadrez, Contexto, Agora, Religião, Bíblia, Fotografia, Saúde.
SEM o bloco (de propósito): os 3 cards de `connection` (comparações) e o card
do cantor `Cícero` (sem artigo confiável).

## Possíveis próximos passos (a pedido da usuária)
- Trocar trechos em inglês por espanhol onde houver artigo.
- Alongar trechos de algum tema específico.
- Cobrir os 3 cards de Conexões apontando para uma das obras citadas.
- (Saúde: opcional trocar Wikipédia por trecho oficial OMS/Harvard.)
