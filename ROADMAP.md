# Diagonal — o que falta

Só o que ainda **não** foi feito. O que já está pronto sai daqui (o histórico fica
no `git log`); o que morreu vai pro fim, pra ninguém ressuscitar sem querer.
Para entender o **código**, ver `HANDOFF.md`.

Tamanho: 🟢 rápido · 🟡 médio · 🔴 grande. ⏳ = espera uma decisão ou uma lista dela.

---

## 1. Pra manter em dia

- 🟡 **Esportes: manter a agenda viva** — `esportesSeed.js` é escrito à mão e
  envelhece sozinho. Antes de reescrever, buscar na web datas/confrontos/transmissões.

## 2. Segurança (o que ainda pode dar errado)

- 🟡 **O relógio do aparelho decide quem vence** — entre celular e computador,
  quem tem a hora mais adiantada ganha, mesmo estando errado. O conserto é o
  **servidor** dar o número da versão (o app só guarda o que voltou). Hoje não
  perde nada (a mescla por fatia salva os dois lados), só confunde.
  **É o único com risco de verdade, porque mexe no servidor e nos três stores.**
  (As regras de sync já têm teste: 409 que mescla, falta de espaço, dois aparelhos.)
- 🟡 **Abrir o app sem internet** ⏳ — os dados dela já ficam no aparelho e a senha
  já funciona offline; o que falta é o próprio app ficar guardado no aparelho
  (service worker) pra abrir sem rede — avião, metrô, roaming. Proposta feita em
  10/09, antes da viagem; espera o ok dela. Cuidado: não pode prender o app numa
  versão velha (o aviso de versão nova tem que continuar funcionando).

## 3. Finanças (o plano por passos)

Passos 1–4 feitos (importar gastos · VR por dia · painel "posso gastar" · lançar
o gasto na hora, que já está na capa).

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
- 🟢 **Compras antigas sem tela (`comprasFeitas`)** ⏳ — ~30 compras de jan–jun/2026
  (nome, mês, valor: vinil, óculos, livros…) que apareciam no card Compras da
  Retrospectiva. O card saiu em 31/07 a pedido dela; os registros ficaram no
  documento, invisíveis. Deixar como está, apagar, ou mostrar em algum canto?

## 4. Estudos e leituras

- 🟢 **Reportagens: edições 226 e 227** ⏳ — faltaram na planilha da piauí (jul e
  ago/2025). Ela manda a planilha; eu cadastro no mesmo formato.
- 🟡 **"Pedir guia" pra qualquer livro** — hoje o guia de contexto é escrito à mão
  (só Anna Kariênina tem).
- 🟡 **"Me sugere um livro"** ⏳ — sugere da estante por tamanho/tipo/tema ("tá com
  pouco tempo? esse tem 96 páginas"). Proposta feita em 10/09; espera o ok dela.

## 5. Saúde

- 🟡 **Cadastro de remédios** ⏳ — ela vai ver depois o que quer aqui (era "aviso de
  remédio acabando").

## 6. Ideias (sem pressa, nenhuma começada)

- 🔴 **"Seu ano em revisão"** — a tela do fim do ano juntando livros, viagens,
  corridas, música, humor, gastos e dias importantes.
- 🔴 **Mapa-múndi pessoal** — países visitados + países dos autores lidos.
- 🟡 **Filmes & séries vistos** — coleção no mesmo molde da de leituras.
- 🟡 **Lugares** — restaurantes/cafés/cidades que foi e quer ir.
- 🟡 **"Neste mês, anos atrás"** — memórias do mesmo mês em anos passados.
- 🟡 **Humor + correlações** — "fica melhor nos dias que corre ou lê".
- 🟡 **Diário cultural narrativo** — "em junho: leu X, foi ao MASP, viajou pra Y".
- 🟡 **Indicações de álbuns** a partir do histórico do Spotify.

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
páginas** (ela prefere sem, mais clean) · **Cursos online** · **juntar viagens
feitas e futuras** (10/09: não foi pedido dela — saiu da lista) · **"o que aprendi
por tema"** (10/09: o card Temas resolve).

---

## Regras que valem pra qualquer item daqui

1. **Conteúdo novo entra pelo documento dela**, nunca por um bilhete que roda a
   cada abertura. Os 51 antigos foram apagados em 11/ago/2026 — não criar mais.
2. **Menos mecanismo, mais português.** Quando ela reclama, a resposta é tirar
   coisa e trocar jargão — não somar mais uma camada.
3. **Nada pode sumir.** Migração só adiciona, nunca remove.

> Deploy: `git push origin main` → a Vercel republica.
