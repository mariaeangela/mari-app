# Diagonal — estado do projeto (nota de continuação)

App de cultura em React + Vite. Deploy: Vercel, a partir do GitHub
`mariaeangela/mari-app` (branch `main`). Publicar = `git push origin main`
(a Vercel republica sozinha). Senha do app (login): `taylor13` (em `src/Login.jsx`).

## Arquitetura
- `src/App.jsx` — tabs (Hoje/Explorar/Salvos), Header, responsivo
  (grade de 3 colunas no desktop via `useIsWide`, coluna única no mobile),
  relógio vivo (`useMinuteTick`) → edição muda às 6h/14h, datas à meia-noite.
- `src/ContentCard.jsx` — card; imagem multi-fonte (Met/Cleveland/Wikimedia),
  lightbox ao clicar na imagem, bloco "Da fonte" (`content.fonteOficial`).
- `src/contentLibrary.js` — todo o conteúdo: CONTENT_LIBRARY (cards por tema),
  CARD_PALETTES (tema claro/pastel), OPENING_QUOTES (frase literária do header
  em Hoje — mantida), getEditionPeriod.
  Obs.: a aba "Frases" (humores + MOOD_QUOTES) foi REMOVIDA por completo.
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
  viagem*, aniversários, saúde, datas pessoais*; * = `aguardado`, entra na
  contagem regressiva — viagem/datas pessoais/corrida, NÃO aniversário).
  EXERCICIO_SUBTIPOS (treino, corrida*). CULTURA_SUBTIPOS
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
  que vira subtipo 'lido' na data de hoje; e "Tarefas sem data". Eventos:
  intervalo, hora, repetir, "com quem". Tarefas têm ✓ (com ou sem data). Rolês:
  opções do dia c/ horário (sem ✓; editar usa updateRole p/ não duplicar).
  Exercício: treino/corrida c/ hora e distância (corrida). Cultura alimentará Projetos.
- FALTA (Leva 2): aba Projetos lendo/agrupando cultura+exercício por mês/ano
  (retrospectiva: nº museu/academia, livros lidos...), "quem você viu" somado,
  e a aba Estudos (estudos saiu do calendário; vai viver só em Projetos).

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
