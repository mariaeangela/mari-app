// Conversa com a função serverless /api/data.
// Best-effort: se a nuvem estiver fora (ex.: `npm run dev` local sem /api, ou
// sem internet), falha em silêncio e o app segue no localStorage.
const ENDPOINT = '/api/data';

// ---- MODO RESGATE (`?resgate=1` na URL) ----
// Trava TODO envio pra nuvem. Serve pra abrir o app num aparelho que ainda tem
// uma cópia local boa sem correr o risco de ela ser substituída ou de empurrar
// algo por cima da nuvem: dá pra olhar e EXPORTAR em paz (Life → Seus dados).
// Os stores também pulam a leitura/adoção da nuvem quando isto está ligado.
export const RESGATE = (() => {
  try { return /[?&]resgate=1/.test(location.search); } catch { return false; }
})();

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

// ---- Backups guardados no servidor (20 por seção) ----
// Lista só metadados (índice + quando). Devolve [] se não der pra ler.
export async function listarBackups(secao) {
  try {
    const res = await fetch(ENDPOINT + '?backups=' + encodeURIComponent(secao), { headers: authHeaders() });
    if (!res.ok) return [];
    const j = await res.json();
    return Array.isArray(j && j.backups) ? j.backups : [];
  } catch { return []; }
}
// Conteúdo de um backup, pra conferir/baixar ANTES de restaurar. null se falhar.
export async function lerBackup(secao, i) {
  try {
    const res = await fetch(`${ENDPOINT}?backup=${encodeURIComponent(secao)}&i=${i}`, { headers: authHeaders() });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}
// Restaura o backup `i` da seção. O servidor guarda o valor ATUAL antes de trocar
// (dá pra desfazer) e sobe o `_rev`, pra os outros aparelhos receberem no próximo load.
export async function restaurarBackup(secao, i) {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ restore: { section: secao, i } }),
    });
    return res.ok;
  } catch { return false; }
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

// ---- Chave inválida (401): a sessão perdeu o direito de gravar ----
// Foi ASSIM que um dia inteiro se perdeu (ago/2026): uma aba aberta desde antes
// de a proteção entrar no ar não tinha chave, cada save voltava 401, e o app
// seguiu como se nada fosse. Agora isso grita: quem escuta manda a Mari entrar
// de novo, o que repõe a chave e destrava os envios pendentes.
const semChaveL = new Set();
export function onSemChave(fn) { semChaveL.add(fn); return () => semChaveL.delete(fn); }
function avisarSemChave() { semChaveL.forEach(fn => { try { fn(); } catch { /* ignora */ } }); }

// ---- PENDÊNCIA por seção (sobrevive a fechar o app) ----
// Marca "esta seção tem edição que ainda NÃO foi confirmada pela nuvem". Só o
// carimbo de tempo é guardado — o conteúdo já está no cache local da própria
// seção, então não há nada a duplicar. Serve pra duas coisas: (1) no boot, o
// store sabe que o local é precioso e NÃO pode ser substituído pela nuvem em
// silêncio; (2) a tela consegue avisar "você tem coisa não salva desde as 14h".
const PEND_KEY = 'diagonal_pendencias';
function lerPend() { try { return JSON.parse(localStorage.getItem(PEND_KEY) || '{}'); } catch { return {}; } }
function escreverPend(p) { try { localStorage.setItem(PEND_KEY, JSON.stringify(p)); } catch { /* ignora */ } }
function marcarPendente(field) { const p = lerPend(); if (!p[field]) { p[field] = Date.now(); escreverPend(p); } }
function limparPendente(field) { const p = lerPend(); if (p[field]) { delete p[field]; escreverPend(p); } }
export function temPendente(field) { return !!lerPend()[field]; }
export function pendenteDesde(field) { return lerPend()[field] || 0; }
export function pendenciasAbertas() { return Object.keys(lerPend()); }

// ---- LIXEIRA local: nada é sobrescrito sem cópia ----
// Regra nova e inegociável: antes de a nuvem substituir o cache local de uma
// seção, o valor que está saindo vai pra cá. Se a decisão estiver errada (foi o
// que aconteceu), a versão boa continua existindo no aparelho em vez de sumir.
// Poucas cópias porque o `life` é grande (~240KB) e o localStorage é ~5MB: ao
// estourar a cota, descarta as mais antigas até caber.
const LIXO_KEY = 'diagonal_lixeira';
const LIXO_MAX = 3;
export function lerLixeira() { try { return JSON.parse(localStorage.getItem(LIXO_KEY) || '[]'); } catch { return []; } }
export function guardarNaLixeira(secao, doc, motivo) {
  if (!doc) return;
  let lista = [{ ts: Date.now(), secao, motivo: motivo || '', doc }, ...lerLixeira()].slice(0, LIXO_MAX);
  while (lista.length) {
    try { localStorage.setItem(LIXO_KEY, JSON.stringify(lista)); return; }
    catch { lista = lista.slice(0, lista.length - 1); }   // sem espaço: sacrifica a mais velha
  }
}

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
      avisarSemChave();     // a tela pede a senha de novo; o pendente sobe depois
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
    if (result !== 'fail' && s.p === v) { s.p = null; limparPendente(field); }
    if (s.p != null && !s.t) s.t = setTimeout(() => runPush(field), result === 'ok' ? 0 : RETRY);
  });
}
function schedule(field, payload) {
  if (RESGATE) return;          // modo resgate: nada sai daqui
  const s = q[field];
  s.p = payload;                            // sobrescreve o pendente (payload atual da seção)
  marcarPendente(field);                    // some só quando a nuvem confirmar
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
  if (RESGATE) return false;    // modo resgate: o botão Salvar também não envia
  const s = q[field];
  if (s.t) { clearTimeout(s.t); s.t = null; }
  const result = await doPost(payload);
  if (result === 'ok') { if (s.p === payload) s.p = null; limparPendente(field); return true; }
  if (result === 'conflict') { if (s.p === payload) s.p = null; limparPendente(field); return false; } // descarta o velho; o resync (ao focar) traz a versão nova
  s.p = payload; if (!s.t) s.t = setTimeout(() => runPush(field), RETRY);        // erro de rede: re-tenta
  return false;
}
export async function saveLifeNow(life) { return saveNow('life', { life }); }
export async function saveCalendarioNow(cal) { return saveNow('calendario', { calendario: cal }); }
export async function saveSavedNow(saved, savedRev) { return saveNow('saved', { saved, savedRev }); }
