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
  "diagonal" no Header também vai pra Hoje.
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
  (corrida e outros aparecem). Corrida exibida como "{dist}km - {nome}". CULTURA_SUBTIPOS
  (lendo, lido, filme, série, exposição, museu, show, espetáculo). MOODS (5:
  ótimo/bem/triste/estressado/ansioso, sem emoji). LEGENDA (chips de cor).
  `getOnThisDay()` (fato curado de HISTORICAL_FACTS, senão efemérides da
  Wikipédia pt via api.wikimedia.org, cache em memória por MM-DD).
- `src/calendarStore.jsx` — CalendarProvider/useCalendar; cache local
  (`diagonal_calendario`) + sync nuvem (cloud.js: fetchCalendario/pushCalendario).
  Dados: events[], exercicios[], tasks[], roles[], cultura[], moods{}, diary{},
  savedRoles[].
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
  `prazo` no mês** (pendentes, com ✓ que chama `togglePlanoCheck`). Eventos:
  intervalo, hora, repetir, "com quem". Tarefas têm ✓ (com ou sem data). Rolês:
  opções do dia c/ horário (sem ✓; editar usa updateRole p/ não duplicar).
  Exercício: treino/corrida c/ hora e distância (corrida). Cultura alimentará Projetos.
- Visão Humor tem sub-abas: Mês (grade), Ano (12 mini-meses coloridos por humor,
  YearMoodGrid/MiniMonth) e Diário (DiarioList: dias do mês com humor+linha do
  diário, mais recente primeiro). Tudo dentro da aba Humor (não polui o Mês).
- Bilhete para o futuro: `bilhetes{}` (chave = dia). Escreve-se no DayModal de um
  dia FUTURO; no dia marcado aparece um aviso no topo do calendário (toque p/ ler).
- IDEIA pendente (não feita): "era/música do mês" — legenda pequena sob o nome do
  mês, guardada por mês (como humor/diário). Aguardando decisão da usuária.
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
**Compras**: itens têm campo opcional **`grupo`** (sublista) — `ComprasSection` renderiza agrupado
(sem-grupo primeiro, depois cada grupo c/ header); `ComprasForm` tem campo "Sublista / grupo" (datalist).
Listas semeadas idempotentes (flags): **Maquiagem** (`ensureMaquiagem`) e **NY26** (`ensureNY26` —
acha a lista pelo nome, USD, ~45 itens em 7 grupos com teto no nome do grupo). A lista **Maquiagem**
tem 3 grupos (`ensureMaquiagemGrupos`): **Compras decididas / Experimentar BR / Comprar fora** — todos
itens reais checáveis. As 3 notas `tipo:'compras'` do tópico Maquiagem (Aprendizados) são espelhos
**filtrados por grupo** (`ComprasMirror` aceita `grupo`): editar/adicionar de um lado reflete no outro.
O slice `cultural` segue no `lifeStore`, mas sua UI — `CulturalSection` ("Calendário cultural",
exportada de `Life.jsx`) — agora é renderizada na aba **Explorar** (tile próprio), não na Life.

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
  no `lifeStore` (CRUDs `addAprendTopico`/`deleteAprendTopico`/`saveAprendNota`/`deleteAprendNota`).
  `NotaForm` edita os itens por textarea (1 linha = 1 item). **Vinhos** têm form próprio (`WineForm`,
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
- Pendências Life: Estudos, Viagens (placeholders via `SubPlaceholder`). Ver `ROADMAP.md`.

## Aba Retrospectiva (`src/Retrospectiva.jsx`) — NOVO
Virou **aba própria** (tab `retrospectiva`, ao lado de Life). Hub: **"ano em números"** (cultura+
exercícios do calendário, por ano, sem futuros) com cada número **clicável** (drill-down → lista os
itens) + grade de **cards** que abrem sub-páginas: **Compras** (pronto) e Quem você viu / Viagens /
Música / Saúde / Corridas / Amorosa (placeholder `EmBreve`).
- **Compras**: fonte ÚNICA — `life.comprasFeitas` (histórico próprio, editável, marcado manualmente
  aqui). As **listas de compras NÃO alimentam mais** esta retrospectiva (decisão da Mari, jun/2026:
  valores mudam e nem tudo está na lista). Agrupado por mês, subtotal em R$ por mês. Form
  `CompraFeitaForm` (nome/data/valor/categoria). `comprasFeitas` é slice do `lifeStore`
  (CRUD `saveCompraFeita`/`deleteCompraFeita`); seed histórico jan–jun/2026 via
  `ensureComprasFeitas` (flag `comprasFeitasSeeded`). Obs.: o botão "limpar comprados" da página de
  Compras (Life) segue arquivando em `comprasFeitas` via `arquivarComprados` — só se usado de propósito.
- **Música** (`MusicaRetro`/`MusicaForm`): 1 registro por mês (`life.musica = [{id,mes,minutos,artista,
  musica}]`, CRUD `saveMusica`/`deleteMusica`; seed jan–mai/2026 dos prints do Spotify via
  `ensureMusica`/flag `musicaSeeded`). Mostra total de minutos do ano + cada mês (minutos/horas, top
  artista, top música). **Lembrete recorrente** no Calendário (`ensureLembreteSpotify` no
  `calendarStore`, flag `lembreteSpotifySeeded`): tarefa mensal "Cadastrar Spotify do mês passado"
  (data dia 1, `repetir:'mensal'`) — aparece no Calendário e no **Hoje** (via `HojeAgenda`) todo dia 1.
- **Navegação entre abas**: `src/nav.jsx` (`NavContext`/`useNav`) — App expõe `goRetroCompras()`
  (seta `retroSec` + `goTab('retrospectiva')`; `RetrospectivaPage` lê `secInicial`). Usado pelo botão
  "Ver minhas compras feitas". (O link "ver compras" na linha **Coisas** dos Gastos foi REMOVIDO —
  Compras não se liga mais à Vida Financeira; `GastosVida` não usa mais `useNav`.)

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
