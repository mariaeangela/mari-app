# Diagonal — Roadmap / ideias

Backlog vivo do app. Tamanho: 🟢 rápido · 🟡 médio · 🔴 grande (curadoria/feature).
Para entender o **código/arquitetura**, ver `HANDOFF.md`.

---

## 1. Life — seções
*(hub pronto. Cards atuais: Compras · Planos · Estudos · Aprendizados · Vida Financeira ·
Saúde · Viagens · Retrospectivas. "Calendário cultural" saiu da Life → agora é tile da aba Explorar.)*
- ✅ **Compras** (listas + moeda) · **Planos** (checklist + info; checklist é a aba padrão).
- ✅ **Calendário cultural** (em cartaz, com link) — vive na aba **Explorar** (`CulturalSection`).
- ✅ **Vida Financeira** — pronta, com 3 sub-abas (Carteira / Salários / Gastos). Ver bloco A.
- ✅ **Saúde** — pronta. Ver bloco B.
- 🟡 **Estudos** — aulas, leituras, cursos (placeholder "em construção"). Único placeholder que sobra na Life.
- ✅ **Aprendizados** — hub de **tópicos**; cada tópico tem **notas** (accordion) que **aninham 1 nível**
  (categoria → itens). Notas especiais: **vinho** (form país/região/nome/uva/info/data) e **compras**
  (espelho ao vivo de uma lista de Compras). Tópicos prontos: **Café, Tecidos, Fotografia analógica,
  Vinhos, Vida, Maquiagem** (a seção "Para comprar" espelha a lista de Compras "Maquiagem"). Cria
  tópico/nota/sub-nota/vinho pela própria UI. Ver bloco C.
- 🟡 **Viagens** — placeholder; ver bloco 2.
- 🟡 **Retrospectivas** — card existe (placeholder). Vira o hub de agregações por mês/ano
  (livros lidos, filmes, nº museu/academia, corridas…). Parte já existe espalhada
  (exercícios na Saúde; gastos/patrimônio na Vida Financeira) — falta juntar.

### A. Vida Financeira — pendências/ideias
- ✅ **2ª linha de total dos Gastos** — gasto recorrente do mês **sem Viagem, Fixos e Mercado** +
  **% do total** (bate com o print: jun = R$ 5.388,34). Aparece na vista Mês (cabeçalho + linha de total).
- 🟡 **Bloco "Investimentos"** que vinha embaixo dos Gastos no print — organizar se ela quiser.
- 🟡 Travar cotação do dólar por mês já existe; ideia futura: aporte vs rendimento (separar
  "quanto aportei" de "quanto rendeu").
- 🟢 (opcional) Mostrar a 2ª linha também na vista **Tabela** (uma por mês).

### B. Saúde — ideias futuras
- 🟡 **Lembrete** de quando um remédio acaba (a partir de início + duração).
- 🟡 **Previsão da próxima menstruação** (média dos ciclos).
- 🟡 Período do peso é manhã/tarde/noite; treino é pré/pós. OK por enquanto. (Pesagens antigas
  seedadas como `dia` seguem aparecendo, sem filtro — editar se quiser reclassificar.)

### C. Aprendizados — ideias futuras
- 🟢 Preencher os materiais/itens deixados **vazios** (Tecidos: Sisal/Ráfia/Rami/Juta/Modal/Cupro;
  Fotografia: filmes sem nota; Vinhos: Espumante). Tudo editável pela UI.
- 🟡 Permitir **criar grupo de vinho** (categoria nova tipo "Rosé") e novos métodos via UI (hoje as
  categorias `grupoVinho` vêm do seed).
- 🟡 Outras listas de Aprendizados poderiam espelhar Compras também (padrão `tipo:'compras'` já existe).

## 2. Viagens & Modo Viagem
- 🟡 **Viagens futuras** (planejamento) + listas de compras por ocasião (parte já existe).
- 🟡 **Viagens feitas** (passado) — salvas; viram **retrospectiva de vida**.
- 🟡 **Viagem atual / diário de bordo ao vivo** — marcar "coisas legais" durante a viagem.
- 🟡 **Momentos** — marcar coisas legais **também no dia a dia (mesmo em SP)**.
- 🟡 **Modo viagem (saudação + cidade)** — com viagem ativa, a **tela de senha** e a
  **capa** mudam pra *"Bom dia em Paraty, Mariângela"* + um **fato sobre a cidade atual**.
  - A decidir: cidade vem da **"viagem atual" marcada por você** (datas+cidade) ou **GPS**.
- 🟡🔴 **#8 Antes da viagem** — kit cultural do destino (livro/filme/arte/história/gastronomia).
- 🟡🔴 **#9 Depois da viagem** — aprofundar a partir do que visitou ("o lugar continua vivo").

## 3. Malha de temas & diário de ideias  *(a "visão de mundo")*
- 🔴 **#2 Temas** *(BASE — destrava o resto)* — taggear cada card com 3–5 temas
  (Memória, Perda, Identidade…) **e também o que é seu** (livros lidos, momentos de
  viagem, diário), pra navegar "tudo sobre Memória" cruzando **cultura + sua vida**.
  Entra **de carona na reforma dos cards** (frente 4).
- 🟡🔴 **#1 Conexões de verdade** — no rodapé do card, 3–4 "continua em" com **1 frase do
  porquê**. Usa a malha de temas (#2). *(upgrade da antiga "Conexões")*
- 🟡 **#10 Perguntas** — cada card termina com uma pergunta; **salvar respostas** → um
  diário intelectual que cresce em anos. *(novo, barato, alto valor)*
- ⏸🔴🔴 **#3 Mapa da mente** *(DEPOIS)* — visualização do grafo dos seus interesses.

## 4. Reforma dos cards (conteúdo)
- 🔴 Converter **Imagem · Cena · Mito & Sagrado · Mundo** para o **formato novo**
  (texto real → "Sobre a obra" → contexto → ficha). Taggear os **temas (#2)** na mesma passada.
- 🔴 **Podar** os cards fracos/mainstream (qualidade > quantidade).
- 🔴 **#5 "O que aconteceu depois?"** — bloco/categoria com o desfecho/legado.
- 🟡 Engordar a **Texto** com o 4º veio (**ensaios/crônicas**) + mais autores.

## 5. Álbum da semana
- 🔴 **Álbum da semana** na capa de Hoje + **histórico** no Explorar — banda, ano e o
  momento do disco (curadoria real, verificada).

## 6. Cartas — crescer a coleção
- 🔴 Mais cartas reais e **completas** (incl. **brasileiras**, tipo Clarice), verificadas.
  (Feitas: Vita→Virginia 1926; Frida→Diego 1940.)

## 7. Calendário — "Leva 2" (agregações / retrospectiva)
- 🔴 **Retrospectiva geral** (no card Retrospectivas) — nº museu/academia, **livros lidos**,
  filmes, **corridas** por mês/ano. *(exercícios já têm retrospectiva na Saúde; falta o resto.)*
- 🟡 **#4 Diário cultural narrativo** — "em junho: leu X, visitou MASP, viajou Y".
- 🟡 **"Quem você viu"** — somar pessoas marcadas em eventos/rolês (campo `comQuem` já existe).

## 8. Visual & atmosfera (capa e senha)
- 🟡 **Imagens de fundo da tela de senha** mais bonitas/variadas (hoje é por estação, via
  cores; a ideia é fotos ligadas ao frio/estação). *(pendente)*
- 🟢 **Frase de abertura** — hoje em **100** (era 12). Dá pra continuar engordando.

## 9. Polimentos & verificações
- 🟢 **Testar nos aparelhos**: X dos Salvos e sync na nuvem (Salvos/Calendário/Life).
- 🟡 (técnico) unificar as buscas na nuvem (saved/calendário/life) numa só.

---

## Descartadas (decisão da Mari — não ressuscitar)
- **#7 Rabbit Hole** (túnel "me leve mais fundo").
- **#6 Pessoas / linhas do tempo** de figuras.
- **Subtítulos das páginas** — a Mari preferiu cards/abas **sem** subtítulo (mais clean).

---

## Já feito (marcos)

**Base:** Salvos na nuvem (sync) · Calendário completo · capa de Hoje · Explorar clean ·
**Texto** e **Cartas** no formato novo · senha `taylor13` (pede sempre).

**Conteúdo (Hoje/senha):**
- "Neste dia" (`HISTORICAL_FACTS`) e "Sabia que" (`DAILY_FACTS`) — **366 dias cada**, listas
  separadas, verificadas. Frase de abertura (`OPENING_QUOTES`) em **100**.
- Hoje sem trocar de card (só 1/dia); o ↻ ficou só no Explorar.

**Explorar / Life (hub):** cards enxutos sem subtítulo. Cards da Life com rótulos curtos
(Compras, Vida Financeira, Saúde, Aprendizados…). Compras: tirado o "até" do valor.
**Calendário cultural** saiu da Life e virou **tile da aba Explorar**.

**Navegação:** reclicar a **aba ativa** volta pra **capa** dela (sai de qualquer sub-página);
clicar em **"diagonal"** no topo vai pra **Hoje**.

**Aprendizados (Life):** seção de tópicos com notas em accordion que aninham 1 nível. Tópicos:
**Café** (Hario V60 com as receitas dentro), **Tecidos** (tipos + fibras naturais/artificiais/
sintéticas, cada material aninhado), **Fotografia analógica** (câmera→filmes), **Vinhos** (form
próprio país/região/nome/uva/info/data), **Vida** (dinheiro/saúde/sentimentos/viagem) e
**Maquiagem** (conhecimento + "Para comprar" **espelhando ao vivo** a lista de Compras "Maquiagem").

**Calendário:**
- Tarefa vencida não-recorrente e incompleta **rola pra hoje** ao carregar.
- Tarefa concluída vai pro fim (tarefas com/sem data e checklist dos Planos); **"Tarefas
  sem data"** esconde as concluídas atrás de "Tarefas concluídas (N)" com a data.
- Dia de hoje no Mês destacado (círculo preto); clicar na data do topo (ou no rótulo do
  mês) **volta ao mês atual**.
- Calendário **cultural** ganhou campo de **link** (↗).

**Vida Financeira (3 sub-abas):**
- **Carteira de investimentos** — snapshots mensais; multi-moeda (US$ com **cotação travada
  por mês**, busca via AwesomeAPI: atual no mês corrente, fechamento nos passados); itens
  **fora da carteira** (FGTS etc.); **tabela** (Por categoria / Por ativo, agrupada por
  finalidade Reserva→Investimento→Aposta), **pizza** (ativo/categoria/finalidade/moeda,
  interativa) e **evolução** (linha preta clean com tooltip; séries por carteira/ativo/
  categoria/finalidade). Campo de valor aceita **conta** (ex.: `1000+2500`).
- **Salários** — histórico 2017–2026 (editável); destaques do ano (ganhei / % poupei /
  **meta de PL** com barra); barras Ganhos×Patrimônio por ano; cards por ano com detalhe
  mensal; patrimônio puxa a carteira em 2026.
- **Gastos** — por categoria/mês (2026 jan–jun); visões **Mês / Tabela (matriz, mês recente
  primeiro) / Linhas (1 por categoria, eixo Y + valores ao focar)**. Na vista Mês, **2ª linha de
  total** = sem Viagem, Fixos e Mercado + **% do total**.

**Planos:** abas **Check list** (padrão) e **Informações**; a caixa de novo item do checklist fica
no **topo** da lista.

**Saúde:**
- **Consultas e exames** — puxa eventos com categoria *Saúde* do Calendário.
- **Exercícios** — retrospectiva do calendário: barras de treinos/mês, contagem por tipo,
  **musculação × corrida**, km e **total no ano**.
- **Peso** — registro (valor, pré/pós treino, período **manhã/tarde/noite**, local: Smart Fit
  Pinheiros/Teodoro/Itaim/Outro); gráfico com filtros (local/treino/período); histórico
  jan–jun/2026 já carregado.
- **Remédios** (nome, dose, por quanto tempo, ativo) · **Vacinas** (nome+data) ·
  **Menstruação** (datas de início + ciclo em dias).

> Deploy: `git push origin main` → Vercel republica. Tudo sincroniza na nuvem (Upstash Redis
> via `/api/data`); em `npm run dev` local não há `/api`, então cai no `localStorage`.
