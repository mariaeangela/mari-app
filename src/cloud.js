// Conversa com a função serverless /api/data.
// Best-effort: se a nuvem estiver fora (ex.: `npm run dev` local sem /api, ou
// sem internet), falha em silêncio e o app segue no localStorage.
const ENDPOINT = '/api/data';

// ---- Chave de acesso ao /api/data ----
// A senha digitada na tela de entrada vira a chave mandada em TODA chamada
// (cabeçalho `x-diagonal-key`), e o servidor só responde a quem tem ela — sem
// isso o endereço fica aberto e qualquer um que o descubra lê tudo.
// Fica no `sessionStorage` porque o login já é por sessão (recarregou, entra de
// novo); assim a senha não fica gravada no aparelho depois que a aba fecha.
let apiKey = null;
try { apiKey = sessionStorage.getItem('diagonal_key') || null; } catch { /* sem storage */ }
export function setApiKey(k) {
  apiKey = k || null;
  try { k ? sessionStorage.setItem('diagonal_key', k) : sessionStorage.removeItem('diagonal_key'); } catch { /* ignora */ }
}
const authHeaders = () => (apiKey ? { 'x-diagonal-key': apiKey } : {});

// A proteção está ligada no servidor? (não exige chave, não devolve dado)
// true/false, ou null se não deu pra perguntar (offline / sem /api no dev local).
export async function pingProtegido() {
  try {
    const res = await fetch(ENDPOINT + '?ping=1');
    if (!res.ok) return null;
    const j = await res.json();
    return !!(j && j.protegido);
  } catch { return null; }
}

// A senha confere? true/false, ou null se não deu pra perguntar (offline).
export async function checarSenha(senha) {
  try {
    const res = await fetch(ENDPOINT + '?auth=1', { headers: { 'x-diagonal-key': senha } });
    if (res.status === 401) return false;
    return res.ok ? true : null;
  } catch { return null; }
}

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

// Teto do `keepalive`/sendBeacon do navegador (~64KB). Só usamos keepalive
// quando o corpo cabe — senão o fetch nem sai. (item C)
const KEEPALIVE_MAX = 60000;

// POST awaitable que reporta o status. Devolve true/false.
// `keepalive`: no flush ao fechar/ocultar o app, o navegador pode matar um fetch
// normal em andamento; keepalive garante a entrega — mas só vale pra corpo pequeno
// (calendario/saved), então cai no fetch normal quando não cabe (life grande).
// Devolve o RESULTADO do POST: 'ok' | 'conflict' | 'fail'.
//  - 'conflict' (HTTP 409): o servidor recusou porque a nuvem tem dados MAIS NOVOS
//    (esta aba/aparelho está desatualizado). NÃO é pra re-tentar com o dado velho —
//    o chamador descarta o envio, e o resync (ao focar a aba) puxa a versão nova.
//  - 'fail': erro de rede/servidor → mantém pendente e re-tenta.
async function doPost(payload, opts) {
  emit('saving');
  const body = JSON.stringify(payload);
  const keepalive = !!(opts && opts.keepalive) && body.length <= KEEPALIVE_MAX;
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body,
      ...(keepalive ? { keepalive: true } : {}),
    });
    if (res.status === 401) {
      lastError = 'sem permissão: entre de novo com a senha (a sessão expirou ou a senha mudou)';
      emit('error');
      return 'fail';
    }
    if (res.status === 409) {
      lastError = 'ignorado: a nuvem já tinha dados mais novos (esta tela estava desatualizada)';
      emit('conflict');
      return 'conflict';
    }
    if (!res.ok) {
      const corpo = await res.text().catch(() => '');
      lastError = `HTTP ${res.status}` + (corpo ? ` · ${corpo.slice(0, 140)}` : '');
      emit('error');
      return 'fail';
    }
    lastError = null;
    emit('saved');
    return 'ok';
  } catch (e) {
    lastError = 'rede/offline · ' + String((e && e.message) || e).slice(0, 120);
    emit('error');
    return 'fail';
  }
}

// Devolve o doc da nuvem, ou UNREACHABLE se não deu pra ler (offline/erro/timeout).
// NUNCA devolve null por falha — null/[] são reservados para "leu, mas vazio".
//
// Leitura COMPARTILHADA: saved/calendario/life leem a mesma seção (o doc inteiro),
// e no boot os três disparam quase juntos. `inflight` faz o 1º GET valer pelos três
// — enquanto uma requisição está no ar, as outras reusam a MESMA promessa (1 GET em
// vez de 3). Some assim que a resposta chega, então cada resync futuro faz um GET novo.
// Todos recebem o MESMO resultado (doc OU UNREACHABLE), então a invariante do sync
// (falha de leitura nunca empurra o local por cima da nuvem) continua valendo igual.
let inflight = null;
function getDoc() {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      // 401 (chave errada/ausente) também é UNREACHABLE: "não consegui LER" —
      // NUNCA "a nuvem está vazia". Tratar como vazia empurraria o local por cima.
      const res = await fetch(ENDPOINT, { method: 'GET', headers: authHeaders() });
      return res.ok ? await res.json() : UNREACHABLE;
    } catch {
      return UNREACHABLE;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
// Cada fetch devolve UNREACHABLE (não leu) OU o valor da seção (lido; pode ser
// [] / null = vazio). O chamador DEVE tratar UNREACHABLE como "mantém o local,
// não empurra nada", e só migrar o local pra cima quando a nuvem leu e veio vazia.
// fetchSaved devolve { items, rev } (ou UNREACHABLE). `rev` = carimbo companheiro
// dos Salvos (registro `savedRev`), pra reconciliar por versão como life/calendario.
export async function fetchSaved() { const d = await getDoc(); if (d === UNREACHABLE) return UNREACHABLE; return { items: Array.isArray(d && d.saved) ? d.saved : [], rev: Number((d && d.savedRev) || 0) }; }
export async function fetchCalendario() { const d = await getDoc(); if (d === UNREACHABLE) return UNREACHABLE; return (d && typeof d.calendario === 'object' && d.calendario) || null; }
export async function fetchLife() { const d = await getDoc(); if (d === UNREACHABLE) return UNREACHABLE; return (d && typeof d.life === 'object' && d.life) || null; }

// Capa de um álbum a partir do link do Spotify (via /api/spotify -> oEmbed). null se não achar.
export async function fetchSpotifyCover(url) {
  try {
    const res = await fetch('/api/spotify?url=' + encodeURIComponent(url));
    if (!res.ok) return null;
    const j = await res.json();
    return j && j.thumb ? j.thumb : null;
  } catch { return null; }
}

// ---- Envio automático (debounce curto por seção + flush ao ocultar/sair) ----
// `p` = PAYLOAD pendente (o "pedaço" a postar, ex.: {life:{...}} ou
// {saved:[...], savedRev:N}) ainda não confirmado. Só é limpo quando o POST
// volta OK; se falhar, mantém e re-tenta — save que caiu na rede não some.
const DEBOUNCE = 200;
const RETRY = 4000;
const q = { saved: { t: null, p: null, sending: false }, calendario: { t: null, p: null, sending: false }, life: { t: null, p: null, sending: false } };
function runPush(field, keepalive) {
  const s = q[field];
  s.t = null;
  if (s.sending || s.p == null) return;   // um envio de cada vez por seção
  const v = s.p;
  s.sending = true;
  doPost(v, { keepalive }).then(result => {
    s.sending = false;
    // 'ok' = gravou; 'conflict' = a nuvem tinha dados mais novos, então DESCARTA este
    // envio velho (não re-tenta); 'fail' = erro de rede, mantém `v` pra re-tentar.
    // Em ambos 'ok'/'conflict' o envio de `v` está resolvido; só re-agenda se um valor
    // MAIS NOVO chegou durante o envio (s.p !== v).
    if (result !== 'fail' && s.p === v) s.p = null;
    if (s.p != null && !s.t) s.t = setTimeout(() => runPush(field), result === 'ok' ? 0 : RETRY);
  });
}
function schedule(field, payload) {
  const s = q[field];
  s.p = payload;                            // sobrescreve o pendente (payload atual da seção)
  if (s.t) clearTimeout(s.t);
  s.t = setTimeout(() => runPush(field), DEBOUNCE);
}
function flushAll() {
  for (const field of Object.keys(q)) {
    const s = q[field];
    if (s.p == null) continue;
    if (s.t) { clearTimeout(s.t); s.t = null; }
    runPush(field, true);   // keepalive p/ garantir entrega ao fechar (só vale p/ corpo pequeno)
  }
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushAll(); });
  window.addEventListener('pagehide', flushAll);
}

export function pushSaved(saved, savedRev) { schedule('saved', { saved, savedRev }); }
export function pushCalendario(cal) { schedule('calendario', { calendario: cal }); }
export function pushLife(life) { schedule('life', { life }); }

// ---- Salvar AGORA (aguardável) — pro botão manual; garante entrega + confirmação ----
// Se FALHAR, deixa o valor no pendente pra o retry automático continuar tentando
// (o botão mostra erro, mas o dado não é abandonado).
async function saveNow(field, payload) {
  const s = q[field];
  if (s.t) { clearTimeout(s.t); s.t = null; }
  const result = await doPost(payload);
  if (result === 'ok') { if (s.p === payload) s.p = null; return true; }
  if (result === 'conflict') { if (s.p === payload) s.p = null; return false; } // descarta o velho; o resync (ao focar) traz a versão nova
  s.p = payload; if (!s.t) s.t = setTimeout(() => runPush(field), RETRY);        // erro de rede: re-tenta
  return false;
}
export async function saveLifeNow(life) { return saveNow('life', { life }); }
export async function saveCalendarioNow(cal) { return saveNow('calendario', { calendario: cal }); }
export async function saveSavedNow(saved, savedRev) { return saveNow('saved', { saved, savedRev }); }
