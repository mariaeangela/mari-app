# Diagonal — Roadmap / ideias

Backlog vivo do app. Tamanho: 🟢 rápido · 🟡 médio · 🔴 grande (curadoria/feature).
Status: ⏳ espera lista sua · 🆕 registro novo.
Para entender o **código/arquitetura**, ver `HANDOFF.md`.

---

# ESTRUTURAIS (atravessam o app inteiro)

- 🔴 **Cards (conteúdo)** — converter **Imagem · Cena · Mito & Sagrado · Mundo** para o formato novo
  (texto real → "Sobre a obra" → contexto → ficha); **podar** os fracos/mainstream; bloco **"o que
  aconteceu depois?"** (desfecho/legado); engordar **Texto** com ensaios/crônicas + mais autores.
- 🔴 **Malha de temas** *(base — destrava o resto)* — taggear cada card com 3–5 temas (Memória, Perda…)
  **e também o que é seu** (livros lidos, viagens, diário), pra navegar "tudo sobre Memória" cruzando
  cultura + sua vida. Entra de carona na reforma dos cards.
- 🟡🔴 **Conexões de verdade** — no rodapé do card, 3–4 "continua em" com 1 frase do porquê (usa os temas).
- 🟡 **Perguntas** — cada card termina com uma pergunta; **salvar respostas** → diário intelectual.
- 🔴 **Álbum da semana** — na capa de Hoje + histórico no Explorar (banda, ano, momento do disco).
- 🔴 **Cartas** — crescer a coleção, completas e verificadas (incl. brasileiras, tipo Clarice).
- 🟡 **Imagem de fundo da tela de senha** — fotos bonitas ligadas à estação/frio (hoje é só cor).
- 🟢 **Número de frases de abertura** — está em **145** (era 12); dá pra continuar engordando.
- 🟡 **Modo Viagem** — com viagem ativa, a **senha** e a **capa** viram *"Bom dia em Paraty"* + um fato
  da cidade. (A decidir: cidade vem da viagem marcada por você ou do GPS.) — atravessa Hoje + senha.
- 🟡 (técnico) Unificar as buscas na nuvem (saved / calendário / life) numa só.
- ⏸🔴🔴 **Mapa da mente** *(bem depois)* — visualização do grafo dos seus interesses.

---

# POR PÁGINA

## 🏠 Hoje (capa)
- Quase tudo pronto. Recebe o **Álbum da semana** e o **Modo Viagem** (ver Estruturais).

## 🧭 Explorar
- Calendário cultural e **Conteúdos para assistir** já vivem aqui. A reforma dos cards é estrutural —
  sem pendência só desta página.

## 🗓️ Calendário
- 🟡 **Diário cultural narrativo** — "em junho: leu X, visitou o MASP, viajou pra Y".

## 💛 Life
*(seções: Compras ✅ · Planos ✅ · Vida Financeira ✅ · Saúde ✅ · Aprendizados ✅ · Estudos · Viagens)*
- 🟡 **Estudos** — aulas, leituras, cursos (placeholder; único que sobra).
- 🟡 **Viagens** — planejamento de **futuras** + listas de compras por ocasião; **feitas** (passado).
- **Vida Financeira:** 🟡 bloco **"Investimentos"** (do print) · 🟡 **aporte vs rendimento** (separar
  "quanto aportei" de "quanto rendeu") · 🟢 2ª linha de total também na vista **Tabela**.
- **Saúde:** 🟡 **lembrete** de quando um remédio acaba (início + duração) · 🟡 **previsão da próxima
  menstruação** (média dos ciclos).
- **Aprendizados:** 🟢 preencher materiais **vazios** (Tecidos, Fotografia, Espumante) · 🟡 criar
  **grupo de vinho** / métodos novos pela UI · 🟡 outras listas espelhando Compras.

## 📊 Retrospectiva
*(prontos: ✅ ano em números clicável · ✅ Compras · ✅ Música · ✅ Corridas)*
- 🟢 **Quem você viu** — soma as pessoas marcadas (`comQuem`), clicável, por mês.
- 🟢 **Saúde** — nº de sessões de terapia, consultas, exames (do Calendário).
- ⏳ **Viagens** — você me manda o histórico → eu desenho bonito.
- 🆕 **Amorosa** *(privada)* — dates, beijos, etc.
- 🟡 **Corridas: trajeto** da prova desenhado (print/GPS do Strava) — meta × executado, pace e
  evolução já estão prontos; falta só o desenho do trajeto.
- 🟡 **Música → indicações de álbuns** (usar o histórico do Spotify pra recomendar).
- 🟢 (refino) opção **"por mês"** no ano em números, além do "por ano".

---

## Descartadas (decisão da Mari — não ressuscitar)
- **Rabbit Hole** (túnel "me leve mais fundo") · **Pessoas / linhas do tempo** de figuras ·
  **Subtítulos das páginas** (a Mari prefere sem subtítulo, mais clean).

---

## Já feito (marcos)

**Base:** Salvos na nuvem (sync) · senha `taylor13` · navegação (reclicar aba volta à capa; "diagonal"
→ Hoje) · "Neste dia" + "Sabia que" (366 dias) · frase de abertura em **145** (com **estrela pra salvar
favoritas** → card "Frases" nos Salvos).

**Calendário:** completo (Mês/Agenda/Exercício/Humor) · tarefa vencida rola pra hoje · cultural com link ·
**lembrete recorrente do Spotify** (dia 1) · rolê com campo **"Onde"** · Hoje mostra o **exercício do dia**.

**Life:** **Compras** (sublistas/grupo; data limite vencida rola pra hoje) · **Planos** (checklist 1ª aba +
**prazo por item**, sincroniza com o Calendário) · **Vida Financeira** (Carteira/Salários/Gastos; 2ª linha
de total) · **Saúde** (consultas ordenadas + "Passado"; exercícios sem meses futuros + **Próximas metas**;
peso manhã/tarde/noite + lista colapsável; remédios/vacinas/menstruação com **data de fim**) ·
**Aprendizados** (Café/Tecidos/Fotografia/Vinhos/Vida/Maquiagem). Calendário cultural foi pra Explorar.

**Retrospectiva (aba nova):** "ano em números" clicável (**provas de corrida** com km/tempo; **km
corridos** clicável → por data + por mês com evolução) · **Compras** (histórico próprio, marcado
manualmente; jan–jun/2026; subtotal/mês — as listas de compras NÃO alimentam mais a Retrospectiva nem
a Vida Financeira) · **Música** (Spotify por mês, jan–mai/2026, total do ano) · **Corridas** (provas
do Calendário: meta × executado, pace real/meta, "bateu a meta", melhor pace + gráfico de evolução).

**Outros desta rodada:** **Conteúdos para assistir** (Explorar — salvar vídeos/matérias por tipo) ·
**Aprendizados** reordenáveis (⚙) · clicar item da agenda na **Hoje** abre a edição · campo de **km
aceita decimais** (5.2) no celular · livros lidos + prova "Corrida 7km SP" semeados · **seletor de ano**
nos cards Compras/Música/Corridas da Retrospectiva (consistente com "ano em números").

> Deploy: `git push origin main` → Vercel republica. Tudo sincroniza na nuvem (Upstash Redis
> via `/api/data`); em `npm run dev` local não há `/api`, então cai no `localStorage`.
