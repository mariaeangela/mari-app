// Conversa com a função serverless /api/data.
// Best-effort: se a nuvem estiver fora (ex.: `npm run dev` local sem /api, ou
// sem internet), falha em silêncio e o app segue no localStorage.
const ENDPOINT = '/api/data';

// Sentinela para "não consegui LER a nuvem" (offline, erro HTTP, timeout do
// serverless frio). É DIFERENTE de "a nuvem respondeu e a seção está vazia".
// Distinguir os dois é CRÍTICO: se o app trata uma falha de leitura como
// "nuvem vazia", ele empurra o local por cima da nuvem e APAGA dados bons de
// outro aparelho. Quem lê a nuvem no boot deve, ao ver UNREACHABLE, manter o
// local e NÃO empurrar nada pra cima.
export const UNREACHABLE = Symbol('cloud-unreachable');

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

// Devolve o doc da nuvem, ou UNREACHABLE se não deu pra ler (offline/erro/timeout).
// NUNCA devolve null por falha — null/[] são reservados para "leu, mas vazio".
async function getDoc() {
  try {
    const res = await fetch(ENDPOINT, { method: 'GET' });
    if (!res.ok) return UNREACHABLE;
    return await res.json();
  } catch {
    return UNREACHABLE;
  }
}
// Cada fetch devolve UNREACHABLE (não leu) OU o valor da seção (lido; pode ser
// [] / null = vazio). O chamador DEVE tratar UNREACHABLE como "mantém o local,
// não empurra nada", e só migrar o local pra cima quando a nuvem leu e veio vazia.
export async function fetchSaved() { const d = await getDoc(); if (d === UNREACHABLE) return UNREACHABLE; return Array.isArray(d && d.saved) ? d.saved : []; }
export async function fetchCalendario() { const d = await getDoc(); if (d === UNREACHABLE) return UNREACHABLE; return (d && typeof d.calendario === 'object' && d.calendario) || null; }
export async function fetchLife() { const d = await getDoc(); if (d === UNREACHABLE) return UNREACHABLE; return (d && typeof d.life === 'object' && d.life) || null; }

// ---- Envio automático (debounce curto por seção + flush ao ocultar/sair) ----
// `p` = valor pendente ainda não confirmado na nuvem. Ele SÓ é limpo quando o
// POST volta OK; se falhar, mantém e re-tenta — assim um save que caiu na rede
// não é perdido em silêncio (antes o pendente era zerado antes do POST).
const DEBOUNCE = 200;
const RETRY = 4000;
const q = { saved: { t: null, p: null, sending: false }, calendario: { t: null, p: null, sending: false }, life: { t: null, p: null, sending: false } };
function runPush(field) {
  const s = q[field];
  s.t = null;
  if (s.sending || s.p == null) return;   // um envio de cada vez por seção
  const v = s.p;
  s.sending = true;
  doPost({ [field]: v }).then(ok => {
    s.sending = false;
    // Se um valor MAIS NOVO chegou durante o envio, `s.p` já é outro: envia esse.
    if (ok && s.p === v) s.p = null;        // confirmado e nada novo -> limpa
    if (s.p != null && !s.t) s.t = setTimeout(() => runPush(field), ok ? 0 : RETRY);
  });
}
function schedule(field, value) {
  const s = q[field];
  s.p = value;                              // sobrescreve o pendente (é o estado atual inteiro)
  if (s.t) clearTimeout(s.t);
  s.t = setTimeout(() => runPush(field), DEBOUNCE);
}
function flushAll() {
  for (const field of Object.keys(q)) {
    const s = q[field];
    if (s.p == null) continue;
    if (s.t) { clearTimeout(s.t); s.t = null; }
    runPush(field);   // dispara já (foreground fetch costuma completar mesmo ao ocultar)
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
// Se FALHAR, deixa o valor no pendente pra o retry automático continuar tentando
// (o botão mostra erro, mas o dado não é abandonado).
async function saveNow(field, value) {
  const s = q[field];
  if (s.t) { clearTimeout(s.t); s.t = null; }
  const ok = await doPost({ [field]: value });
  if (ok) { if (s.p === value) s.p = null; }
  else { s.p = value; if (!s.t) s.t = setTimeout(() => runPush(field), RETRY); }
  return ok;
}
export async function saveLifeNow(life) { return saveNow('life', life); }
export async function saveCalendarioNow(cal) { return saveNow('calendario', cal); }
export async function saveSavedNow(saved) { return saveNow('saved', saved); }
