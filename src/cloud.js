// Conversa com a função serverless /api/data.
// Best-effort: se a nuvem estiver fora (ex.: `npm run dev` local sem /api, ou
// sem internet), falha em silêncio e o app segue no localStorage.
const ENDPOINT = '/api/data';

// ---- Status de sincronização (pro indicador/botão "Salvar") ----
const listeners = new Set();
export function onSyncStatus(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit(s) { listeners.forEach(fn => { try { fn(s); } catch { /* ignora */ } }); }

// Guarda o detalhe do último erro de POST (código HTTP / mensagem), pra
// diagnóstico: o botão Salvar mostra isso quando falha.
let lastError = null;
export function getLastSyncError() { return lastError; }

// POST awaitable que reporta o status. Devolve true/false.
async function doPost(payload) {
  emit('saving');
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const corpo = await res.text().catch(() => '');
      lastError = `HTTP ${res.status}` + (corpo ? ` · ${corpo.slice(0, 140)}` : '');
      emit('error');
      return false;
    }
    lastError = null;
    emit('saved');
    return true;
  } catch (e) {
    lastError = 'rede/offline · ' + String((e && e.message) || e).slice(0, 120);
    emit('error');
    return false;
  }
}

async function getDoc() {
  try {
    const res = await fetch(ENDPOINT, { method: 'GET' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
export async function fetchSaved() { const d = await getDoc(); if (d == null) return null; return Array.isArray(d.saved) ? d.saved : []; }
export async function fetchCalendario() { const d = await getDoc(); return (d && typeof d.calendario === 'object' && d.calendario) || null; }
export async function fetchLife() { const d = await getDoc(); return (d && typeof d.life === 'object' && d.life) || null; }

// ---- Envio automático (debounce curto por seção + flush ao ocultar/sair) ----
const DEBOUNCE = 200;
const q = { saved: { t: null, p: null }, calendario: { t: null, p: null }, life: { t: null, p: null } };
function schedule(field, value) {
  const s = q[field];
  s.p = value;
  if (s.t) clearTimeout(s.t);
  s.t = setTimeout(() => { s.t = null; const v = s.p; s.p = null; doPost({ [field]: v }); }, DEBOUNCE);
}
function flushAll() {
  for (const field of Object.keys(q)) {
    const s = q[field];
    if (s.p == null) continue;
    if (s.t) { clearTimeout(s.t); s.t = null; }
    const v = s.p; s.p = null;
    doPost({ [field]: v });   // dispara já (foreground fetch costuma completar mesmo ao ocultar)
  }
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushAll(); });
  window.addEventListener('pagehide', flushAll);
}

export function pushSaved(saved) { schedule('saved', saved); }
export function pushCalendario(cal) { schedule('calendario', cal); }
export function pushLife(life) { schedule('life', life); }

// ---- Salvar AGORA (aguardável) — pro botão manual; garante entrega + confirmação ----
export async function saveLifeNow(life) { const s = q.life; if (s.t) { clearTimeout(s.t); s.t = null; } s.p = null; return doPost({ life }); }
export async function saveCalendarioNow(cal) { const s = q.calendario; if (s.t) { clearTimeout(s.t); s.t = null; } s.p = null; return doPost({ calendario: cal }); }
export async function saveSavedNow(saved) { const s = q.saved; if (s.t) { clearTimeout(s.t); s.t = null; } s.p = null; return doPost({ saved }); }
