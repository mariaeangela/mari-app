# Diagonal — o que falta

Só o que ainda **não** foi feito. O que já está pronto sai daqui (o histórico fica
no `git log`); o que morreu vai pro fim, pra ninguém ressuscitar sem querer.
Para entender o **código**, ver `HANDOFF.md`.

Tamanho: 🟢 rápido · 🟡 médio · 🔴 grande. ⏳ = espera uma decisão ou uma lista dela.

---

## 1. Com data marcada

- 🔴 **Roteiro de Chicago (20–24/09)** ⏳ — a viagem é **13–26/09/2026** e hoje há
  só um marcador vazio em 20/09. Ela manda os lugares; eu preencho no mesmo padrão
  de Nova York (descrição, horário de abertura, preço, link do Maps, site) e
  confirmo o voo NY→Chicago. **É o único item com prazo real.**
- 🟡 **Esportes: manter a agenda viva** — `esportesSeed.js` é escrito à mão e
  envelhece sozinho. Antes de reescrever, buscar na web datas/confrontos/transmissões.

## 2. Segurança (o que ainda pode dar errado)

- 🟡 **O relógio do aparelho decide quem vence** — entre celular e computador,
  quem tem a hora mais adiantada ganha, mesmo estando errado. O conserto é o
  **servidor** dar o número da versão (o app só guarda o que voltou). Hoje não
  perde nada (a mescla por fatia salva os dois lados), só confunde.
  **É o único dos quatro que sobrou — e o único com risco de verdade,
  porque mexe no servidor e nos três stores.**
- 🟡 **Cobrir mais coisa de teste** — `npm test` existe desde 11/ago (campos de
  dinheiro + detecção de versão nova, 12 testes). Falta cobrir as regras de sync:
  duas edições no mesmo instante, o 409 que mescla, a falta de espaço.
- 🟢 **Sem internet o app não abre** — dá pra editar depois de aberto, mas abrir
  precisa de rede (não há cópia offline do app). Nunca atrapalhou; fica registrado.

## 3. Finanças (o plano por passos)

Passos 1–3 feitos (importar gastos · VR por dia · painel "posso gastar").

- 🔴 **Passo 4 — lançador rápido** ⏳ — lançar o gasto **na hora que acontece**, já
  categorizado, em vez de colar totais do Excel. É o passo que ela mais quer.
- 🟡 **Gastos detalhados: acabar com o "outros"** ⏳ — hoje são duas listas que
  divergem (o total do mês, digitado; e os itens, com nome). A diferença vira uma
  linha "outros". O objetivo é o total ser a **soma dos itens**. Ela ia mandar um
  desenho do layout — esperar o rascunho.
- 🟡 **Investimentos: separar aporte de rendimento** — quanto ela pôs vs quanto rendeu.
- 🟡 **Chip "Evolução"** — comparar um ano com o outro.
- 🔴 **"Performance"** ⏳ — recurso novo que ela vai detalhar. (Não confundir com o
  subgrupo "Performance" do Mercado, que já existe.)
- ⏸ **Ano a ano** — parado até 2027 ter dados de verdade (decisão dela, 29/07).
- 🟢 **CDBs antigos** ⏳ — ela ofereceu reclassificar em massa; eu perguntei antes e
  a decisão ficou parada.
- 🟢 **`comprasFeitas` sem tela** ⏳ — os registros continuam no documento dela sem
  nenhuma tela que os leia (a tela foi apagada em 31/07 a pedido dela). Apagar de
  vez ou dar tela? Falta a palavra dela.

## 4. Estudos e leituras

- 🟡 **Temas para estudar + o que aprendi por tema** ⏳ — ela vai detalhar.
- 🟡 **"Pedir guia" pra qualquer livro** — hoje o guia de contexto é escrito à mão
  (só Anna Kariênina tem).
- 🟡 **"Me sugere um livro"** — sugere da estante por tempo/humor/tema ("tá com 1h?
  esse tem 96 páginas").

## 5. Saúde

- 🟡 **Aviso de remédio acabando** — a partir do início + duração.
- 🟡 **Previsão da próxima menstruação** — média dos ciclos.

## 6. Viagens

- 🟡 **Viagens feitas** — o passado hoje mora na Retrospectiva e o futuro em Life.
  Juntar os dois (uma coisa, um lugar).

## 7. Ideias (sem pressa, nenhuma começada)

- 🔴 **"Seu ano em revisão"** — a tela do fim do ano juntando livros, viagens,
  corridas, música, humor, gastos e dias importantes.
- 🔴 **Mapa-múndi pessoal** — países visitados + países dos autores lidos.
- 🟡 **Filmes & séries vistos** — coleção no mesmo molde da de leituras.
- 🟡 **Lugares** — restaurantes/cafés/cidades que foi e quer ir.
- 🟡 **"Neste mês, anos atrás"** — memórias do mesmo mês em anos passados.
- 🟡 **Humor + correlações** — "fica melhor nos dias que corre ou lê".
- 🟡 **Diário cultural narrativo** — "em junho: leu X, foi ao MASP, viajou pra Y".
- 🟡 **Indicações de álbuns** a partir do histórico do Spotify.
- 🟢 **Imagem de fundo na tela de senha** — hoje é só cor.

---

## Morreu com os cards (não ressuscitar)

Os cards (Texto · Cartas · Imagem · Cena · Mito · Mundo) foram **excluídos** em
ago/2026 — não é mais essa a intenção do app. Caiu junto tudo que dependia deles:
reforma dos cards, **malha de temas**, **conexões "continua em"**, **perguntas ao
fim do card**, **coleção de Cartas**, **Álbum da semana no Explorar** e o **Mapa da
mente**. O Explorar hoje é só: Calendário cultural · Conteúdos para assistir ·
Próximas leituras · Esportes.

## Descartadas antes (decisão dela)

**Rabbit Hole** · **Pessoas / linhas do tempo** de figuras · **subtítulos das
páginas** (ela prefere sem, mais clean) · **Cursos online**.

---

## Regras que valem pra qualquer item daqui

1. **Conteúdo novo entra pelo documento dela**, nunca por um bilhete que roda a
   cada abertura. Os 51 antigos foram apagados em 11/ago/2026 — não criar mais.
2. **Menos mecanismo, mais português.** Quando ela reclama, a resposta é tirar
   coisa e trocar jargão — não somar mais uma camada.
3. **Nada pode sumir.** Migração só adiciona, nunca remove.

> Deploy: `git push origin main` → a Vercel republica.
