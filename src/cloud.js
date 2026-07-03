// Conversa com a função serverless /api/data.
// Tudo é "best-effort": se a nuvem estiver fora (ex.: rodando local com
// `npm run dev`, ou sem internet), as funções falham em silêncio e o app
// segue usando o cache do localStorage.
const ENDPOINT = '/api/data';

async function getDoc() {
  try {
    const res = await fetch(ENDPOINT, { method: 'GET' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Busca os salvos da nuvem. Devolve um array, ou null se a nuvem estiver
// inacessível (para o chamador saber distinguir "vazio" de "offline").
export async function fetchSaved() {
  const data = await getDoc();
  if (data == null) return null;
  return Array.isArray(data.saved) ? data.saved : [];
}
// Objeto do calendário (ou null se inacessível/inexistente).
export async function fetchCalendario() {
  const data = await getDoc();
  return (data && typeof data.calendario === 'object' && data.calendario) || null;
}
// Aba Life (ou null se inacessível/inexistente).
export async function fetchLife() {
  const data = await getDoc();
  return (data && typeof data.life === 'object' && data.life) || null;
}

// ---- Envios (debounce por seção + flush ao ocultar/sair) ----
// Cada seção manda só o SEU campo (o servidor grava em registro próprio, então
// a gravação é pequena e não estoura o limite de request do Upstash).
// No mobile, ao trocar de app o setTimeout pode não disparar e o save se perde —
// por isso, quando a página é ocultada/descarregada, mandamos o pendente na hora.
const DEBOUNCE = 350;
const q = {
  saved: { t: null, p: null },
  calendario: { t: null, p: null },
  life: { t: null, p: null },
};
function post(field, value) {
  try {
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    }).catch(() => {});
  } catch { /* ignora */ }
}
function schedule(field, value) {
  const s = q[field];
  s.p = value;
  if (s.t) clearTimeout(s.t);
  s.t = setTimeout(() => { s.t = null; if (s.p != null) { post(field, s.p); s.p = null; } }, DEBOUNCE);
}
function flushAll() {
  for (const field of Object.keys(q)) {
    const s = q[field];
    if (s.p == null) continue;
    if (s.t) { clearTimeout(s.t); s.t = null; }
    post(field, s.p);   // dispara já (foreground fetch costuma completar mesmo ao ocultar)
    s.p = null;
  }
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushAll(); });
  window.addEventListener('pagehide', flushAll);
}

export function pushSaved(saved) { schedule('saved', saved); }
export function pushCalendario(cal) { schedule('calendario', cal); }
export function pushLife(life) { schedule('life', life); }
