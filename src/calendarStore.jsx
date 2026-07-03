// Store do Calendário — mesmo padrão dos Salvos: cache local instantâneo +
// sincronização na nuvem (sincroniza computador ↔ iPhone).
//
// Formato dos dados (objeto `calendario`):
//   events:     [{ id, titulo, categoria, inicio, fim?, horaInicio?, horaFim?,
//                  repetir:'nao'|'semanal'|'mensal'|'anual', nota?, comQuem? }]
//   exercicios: [{ id, subtipo:'treino'|'corrida', titulo?, data, horaInicio?, distancia?, nota? }]
//   tasks:      [{ id, titulo, data?, repetir?, nota?,
//                  feita?(sem data) , feitas?[]( dias concluídos, p/ as com data) }]
//   roles:      [{ id, data, titulo, horaInicio?, comQuem? }]  // opções do dia (sem ✓)
//   cultura:    [{ id, subtipo, titulo, data, nota?, comQuem? }]
//   moods:      { 'YYYY-MM-DD': moodId }
//   diary:      { 'YYYY-MM-DD': 'texto' }
//   savedRoles: [ 'rolê reaproveitável', ... ]
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { fetchCalendario, pushCalendario, saveCalendarioNow } from './cloud';

const KEY = 'diagonal_calendario';
const DEFAULT = { events: [], exercicios: [], tasks: [], roles: [], cultura: [], moods: {}, diary: {}, bilhetes: {}, savedRoles: [], metas: {} };
const CalContext = createContext(null);

const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const hojeKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
// Tarefas com data, não recorrentes, vencidas e não concluídas: puxa pra hoje
// (pra não se perder). Retorna { next, changed }.
function rolarAtrasadas(tasks, hoje) {
  let changed = false;
  const next = (tasks || []).map(t => {
    const repete = t.repetir && t.repetir !== 'nao';
    if (t.data && !repete && t.data < hoje && !t.feita && !(t.feitas || []).includes(t.data)) {
      changed = true;
      return { ...t, data: hoje };
    }
    return t;
  });
  return { next, changed };
}

// Lembrete recorrente (todo dia 1): cadastrar o Spotify do mês anterior. Semeado uma vez.
function ensureLembreteSpotify(d) {
  if (d.lembreteSpotifySeeded) return d;
  if ((d.tasks || []).some(t => t.id === 'lembrete-spotify')) return { ...d, lembreteSpotifySeeded: true };
  const task = { id: 'lembrete-spotify', titulo: 'Cadastrar Spotify do mês passado', data: '2026-01-01', repetir: 'mensal' };
  return { ...d, lembreteSpotifySeeded: true, tasks: [...(d.tasks || []), task] };
}

// Livros lidos em 2026 enviados pela Mari (cultura subtipo 'lido'). Semeados uma vez,
// ids estáveis pra não duplicar no merge da nuvem. Ela edita/apaga normalmente depois.
function ensureLivrosLidos2026(d) {
  if (d.livrosLidos2026Seeded) return d;
  const livros = [
    { id: 'seed-livro-travesuras', subtipo: 'lido', titulo: 'Travesuras de la niña mala', data: '2026-05-14' },
    { id: 'seed-livro-leveza',     subtipo: 'lido', titulo: 'A insustentável leveza do ser', data: '2026-02-25' },
    { id: 'seed-livro-vegetariana', subtipo: 'lido', titulo: 'A vegetariana', data: '2026-01-22' },
    { id: 'seed-livro-casamento',  subtipo: 'lido', titulo: 'Como arruinar um casamento', data: '2026-01-16' },
  ];
  const have = new Set((d.cultura || []).map(c => c.id));
  const novos = livros.filter(l => !have.has(l.id));
  return { ...d, livrosLidos2026Seeded: true, cultura: [...(d.cultura || []), ...novos] };
}

// Provas de corrida já feitas, enviadas pela Mari (exercicio corrida_prova). Semeadas uma vez,
// ids estáveis. tempo em SEGUNDOS, distancia em km. Ela edita/apaga normalmente depois.
function ensureProvasCorrida(d) {
  let out = d;
  if (!out.provasCorridaSeeded) {
    const provas = [
      { id: 'seed-prova-7kmsp', subtipo: 'corrida_prova', titulo: 'Corrida 7km SP', data: '2026-04-12', distancia: 7, tempo: 3046, metaTempo: 3000 },
    ];
    const have = new Set((out.exercicios || []).map(x => x.id));
    const novos = provas.filter(p => !have.has(p.id));
    out = { ...out, provasCorridaSeeded: true, exercicios: [...(out.exercicios || []), ...novos] };
  }
  // patch único: preenche a meta (50min) da prova 7km SP já semeada, sem mexer se a Mari já editou.
  if (!out.prova7kmMetaSet) {
    out = { ...out, prova7kmMetaSet: true, exercicios: (out.exercicios || []).map(x =>
      x.id === 'seed-prova-7kmsp' && x.metaTempo == null ? { ...x, metaTempo: 3000 } : x) };
  }
  return out;
}

// Aplica todos os seeds idempotentes do calendário, na ordem.
function runSeeds(d) { return ensureProvasCorrida(ensureLivrosLidos2026(ensureLembreteSpotify(d))); }

function readLocal() {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { ...DEFAULT }; }
}
function writeLocal(d) {
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {}
}

export function CalendarProvider({ children }) {
  const [data, setData] = useState(() => runSeeds(readLocal()));
  const dirty = useRef(false); // não deixa a nuvem tardia sobrescrever ação local
  const dataRef = useRef(data); dataRef.current = data; // pro salvar manual pegar o estado atual

  useEffect(() => {
    let alive = true;
    (async () => {
      const local = readLocal();
      const cloud = await fetchCalendario();
      if (!alive || dirty.current) return;
      if (!cloud) {
        // nuvem vazia/offline: se já há algo local, empurra pra cima (migração)
        const hasLocal = local.events.length || local.exercicios.length || local.tasks.length ||
          local.cultura.length || local.roles.length || Object.keys(local.moods).length || Object.keys(local.diary).length;
        const seeded = runSeeds(local);
        const { next, changed } = rolarAtrasadas(seeded.tasks, hojeKey());
        const f = changed ? { ...seeded, tasks: next } : seeded;
        const mudou = changed || seeded !== local;
        if (mudou) { writeLocal(f); setData(f); }
        if (mudou || hasLocal) pushCalendario(f);
        return;
      }
      const merged0 = { ...DEFAULT, ...cloud };
      const merged = runSeeds(merged0);
      const { next, changed } = rolarAtrasadas(merged.tasks, hojeKey());
      const final = changed ? { ...merged, tasks: next } : merged;
      writeLocal(final);
      setData(final);
      if (changed || merged !== merged0) pushCalendario(final);
    })();
    return () => { alive = false; };
  }, []);

  const persist = (next) => { dirty.current = true; setData(next); writeLocal(next); pushCalendario(next); };
  const patch = (part) => persist({ ...data, ...part });
  // Salvar AGORA na nuvem (pro botão global) — aguarda e devolve true/false.
  const salvarAgora = async () => { dirty.current = true; return await saveCalendarioNow(dataRef.current); };

  // ---- Eventos ----
  const saveEvent = (ev) => {
    if (ev.id) patch({ events: data.events.map(e => e.id === ev.id ? ev : e) });
    else patch({ events: [...data.events, { ...ev, id: uid('e') }] });
  };
  const deleteEvent = (id) => patch({ events: data.events.filter(e => e.id !== id) });
  // Apaga só UMA ocorrência de um evento recorrente (adiciona o dia às exceções).
  const addEventExcecao = (id, dia) => patch({ events: data.events.map(e => e.id === id ? { ...e, excecoes: [...(e.excecoes || []), dia] } : e) });

  // ---- Exercícios (treino/corrida) ----
  const saveExercicio = (x) => {
    if (x.id) patch({ exercicios: data.exercicios.map(e => e.id === x.id ? x : e) });
    else patch({ exercicios: [...data.exercicios, { ...x, id: uid('x') }] });
  };
  const deleteExercicio = (id) => patch({ exercicios: data.exercicios.filter(e => e.id !== id) });

  // ---- Tarefas ----
  const saveTask = (t) => {
    if (t.id) patch({ tasks: data.tasks.map(x => x.id === t.id ? t : x) });
    else patch({ tasks: [...data.tasks, { feita: false, ...t, id: uid('t') }] });
  };
  // Conclusão: tarefa com data usa `feitas` (lista de dias concluídos, para as
  // que repetem); tarefa sem data usa o booleano `feita`.
  const toggleTask = (id, dateKey) => patch({
    tasks: data.tasks.map(x => {
      if (x.id !== id) return x;
      if (dateKey) {
        const set = new Set(x.feitas || []);
        set.has(dateKey) ? set.delete(dateKey) : set.add(dateKey);
        return { ...x, feitas: [...set] };
      }
      const nova = !x.feita;
      return { ...x, feita: nova, feitaEm: nova ? hojeKey() : undefined };
    }),
  });
  const deleteTask = (id) => patch({ tasks: data.tasks.filter(x => x.id !== id) });
  const addTaskExcecao = (id, dia) => patch({ tasks: data.tasks.map(t => t.id === id ? { ...t, excecoes: [...(t.excecoes || []), dia] } : t) });

  // ---- Rolês (opções do dia) ----
  const addRole = (r) => {
    const savedRoles = r.titulo && !data.savedRoles.includes(r.titulo)
      ? [...data.savedRoles, r.titulo] : data.savedRoles;
    patch({ roles: [...data.roles, { ...r, id: uid('r') }], savedRoles });
  };
  const updateRole = (r) => patch({ roles: data.roles.map(x => x.id === r.id ? r : x) });
  const deleteRole = (id) => patch({ roles: data.roles.filter(x => x.id !== id) });

  // ---- Cultura ----
  const saveCultura = (c) => {
    if (c.id) patch({ cultura: data.cultura.map(x => x.id === c.id ? c : x) });
    else patch({ cultura: [...data.cultura, { ...c, id: uid('c') }] });
  };
  const deleteCultura = (id) => patch({ cultura: data.cultura.filter(x => x.id !== id) });

  // Converte um item de um tipo para outro (ex.: evento -> tarefa) num único
  // patch: remove do array de origem e cria no de destino.
  const ARR = { evento: 'events', exercicio: 'exercicios', tarefa: 'tasks', role: 'roles', cultura: 'cultura' };
  const convertItem = (fromTipo, fromId, toTipo, obj) => {
    const fromKey = ARR[fromTipo], toKey = ARR[toTipo];
    if (!fromKey || !toKey) return;
    const next = { ...data };
    next[fromKey] = data[fromKey].filter(i => i.id !== fromId);
    next[toKey] = [...next[toKey], { ...obj, id: uid('v') }];
    persist(next);
  };

  // ---- Humor & Diário (por dia) ----
  const setMood = (dayKey, moodId) => {
    const moods = { ...data.moods };
    if (moodId) moods[dayKey] = moodId; else delete moods[dayKey];
    patch({ moods });
  };
  const setDiary = (dayKey, texto) => {
    const diary = { ...data.diary };
    // Guarda o texto cru (preserva espaços ao digitar); só remove se ficar vazio.
    if (texto && texto.trim()) diary[dayKey] = texto; else delete diary[dayKey];
    patch({ diary });
  };
  // Bilhete para o futuro: texto que aparece quando o dia chega.
  const setBilhete = (dayKey, texto) => {
    const bilhetes = { ...data.bilhetes };
    if (texto && texto.trim()) bilhetes[dayKey] = texto; else delete bilhetes[dayKey];
    patch({ bilhetes });
  };

  // ---- Metas do mês (chave 'YYYY-MM' → [{id, texto, feito}]) ----
  const addMeta = (mesKey, texto) => { const t = (texto || '').trim(); if (!t) return; patch({ metas: { ...data.metas, [mesKey]: [...(data.metas?.[mesKey] || []), { id: uid('m'), texto: t, feito: false }] } }); };
  const toggleMeta = (mesKey, id) => patch({ metas: { ...data.metas, [mesKey]: (data.metas?.[mesKey] || []).map(m => m.id === id ? { ...m, feito: !m.feito } : m) } });
  const deleteMeta = (mesKey, id) => patch({ metas: { ...data.metas, [mesKey]: (data.metas?.[mesKey] || []).filter(m => m.id !== id) } });

  const value = {
    data, saveEvent, deleteEvent, addEventExcecao, saveExercicio, deleteExercicio,
    saveTask, toggleTask, deleteTask, addTaskExcecao,
    addRole, updateRole, deleteRole, saveCultura, deleteCultura, convertItem, setMood, setDiary, setBilhete,
    addMeta, toggleMeta, deleteMeta, salvarAgora,
  };
  return <CalContext.Provider value={value}>{children}</CalContext.Provider>;
}

export function useCalendar() {
  const ctx = useContext(CalContext);
  if (!ctx) throw new Error('useCalendar precisa estar dentro de <CalendarProvider>');
  return ctx;
}
