// Store do Calendário — mesmo padrão dos Salvos: cache local instantâneo +
// sincronização na nuvem (sincroniza computador ↔ iPhone).
//
// Formato dos dados (objeto `calendario`):
//   events:  [{ id, titulo, categoria, inicio, fim?, horaInicio?, horaFim?,
//               repetir:'nao'|'semanal'|'mensal'|'anual', nota?, comQuem? }]
//   tasks:   [{ id, titulo, data?, feita:false, nota? }]
//   roles:   [{ id, data, titulo, comQuem? }]   // opções de rolê do dia (sem ✓)
//   cultura: [{ id, subtipo, titulo, data, nota?, comQuem? }]
//   moods:   { 'YYYY-MM-DD': moodId }
//   diary:   { 'YYYY-MM-DD': 'texto' }
//   savedRoles: [ 'rolê reaproveitável', ... ]
import { createContext, useContext, useEffect, useState } from 'react';
import { fetchCalendario, pushCalendario } from './cloud';

const KEY = 'diagonal_calendario';
const DEFAULT = { events: [], tasks: [], roles: [], cultura: [], moods: {}, diary: {}, savedRoles: [] };
const CalContext = createContext(null);

const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function readLocal() {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { ...DEFAULT }; }
}
function writeLocal(d) {
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {}
}

export function CalendarProvider({ children }) {
  const [data, setData] = useState(readLocal);

  useEffect(() => {
    let alive = true;
    (async () => {
      const local = readLocal();
      const cloud = await fetchCalendario();
      if (!alive) return;
      if (!cloud) {
        // nuvem vazia/offline: se já há algo local, empurra pra cima (migração)
        const hasLocal = local.events.length || local.tasks.length || local.cultura.length ||
          local.roles.length || Object.keys(local.moods).length || Object.keys(local.diary).length;
        if (hasLocal) pushCalendario(local);
        return;
      }
      const merged = { ...DEFAULT, ...cloud };
      writeLocal(merged);
      setData(merged);
    })();
    return () => { alive = false; };
  }, []);

  const persist = (next) => { setData(next); writeLocal(next); pushCalendario(next); };
  const patch = (part) => persist({ ...data, ...part });

  // ---- Eventos ----
  const saveEvent = (ev) => {
    if (ev.id) patch({ events: data.events.map(e => e.id === ev.id ? ev : e) });
    else patch({ events: [...data.events, { ...ev, id: uid('e') }] });
  };
  const deleteEvent = (id) => patch({ events: data.events.filter(e => e.id !== id) });

  // ---- Tarefas ----
  const saveTask = (t) => {
    if (t.id) patch({ tasks: data.tasks.map(x => x.id === t.id ? t : x) });
    else patch({ tasks: [...data.tasks, { feita: false, ...t, id: uid('t') }] });
  };
  const toggleTask = (id) => patch({ tasks: data.tasks.map(x => x.id === id ? { ...x, feita: !x.feita } : x) });
  const deleteTask = (id) => patch({ tasks: data.tasks.filter(x => x.id !== id) });

  // ---- Rolês (opções do dia) ----
  const addRole = (r) => {
    const savedRoles = r.titulo && !data.savedRoles.includes(r.titulo)
      ? [...data.savedRoles, r.titulo] : data.savedRoles;
    patch({ roles: [...data.roles, { ...r, id: uid('r') }], savedRoles });
  };
  const deleteRole = (id) => patch({ roles: data.roles.filter(x => x.id !== id) });

  // ---- Cultura ----
  const saveCultura = (c) => {
    if (c.id) patch({ cultura: data.cultura.map(x => x.id === c.id ? c : x) });
    else patch({ cultura: [...data.cultura, { ...c, id: uid('c') }] });
  };
  const deleteCultura = (id) => patch({ cultura: data.cultura.filter(x => x.id !== id) });

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

  const value = {
    data, saveEvent, deleteEvent, saveTask, toggleTask, deleteTask,
    addRole, deleteRole, saveCultura, deleteCultura, setMood, setDiary,
  };
  return <CalContext.Provider value={value}>{children}</CalContext.Provider>;
}

export function useCalendar() {
  const ctx = useContext(CalContext);
  if (!ctx) throw new Error('useCalendar precisa estar dentro de <CalendarProvider>');
  return ctx;
}
