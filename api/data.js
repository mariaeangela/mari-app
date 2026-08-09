// Função serverless da Vercel: guarda os dados pessoais do app num Redis
// gratuito da Upstash/Vercel KV.
//
//   GET  /api/data                 -> { saved:[...], calendario?, life?, projetos?, savedRev? }
//   GET  /api/data?backups=life    -> { section:'life', backups:[{ i, ts }] }  (metadados)
//   POST /api/data  {life:{...}}   -> grava só os campos enviados (com trava de versão)
//   POST /api/data  {restore:{section,i}} -> restaura o backup i daquela seção
//
// Cada seção fica no SEU PRÓPRIO registro (`diagonal:life`, `diagonal:saved`,
// `diagonal:calendario`, `diagonal:projetos`). O GET junta o registro LEGADO
// (`diagonal:data`) com os por-seção (estes têm prioridade).
//
// BLINDAGEM contra perda de dados (jul/2026):
//  1) TRAVA DE VERSÃO: cada seção carrega um `_rev` monotônico (saved usa `savedRev`).
//     Numa gravação, se o `_rev` que chega for MENOR que o guardado, o servidor RECUSA
//     (409) — assim uma aba/aparelho antigo NUNCA grava por cima de dados mais novos.
//  2) BACKUP: antes de sobrescrever uma seção, o valor atual vai pra uma lista
//     `diagonal:bak:<seção>` (últimos BAK_MAX), pra dar pra voltar no tempo.
const { Redis } = require('@upstash/redis');

function pickEnv(suffixes) {
  for (const [k, v] of Object.entries(process.env)) {
    if (!v) continue;
    if (suffixes.some(s => k === s || k.endsWith('_' + s))) return v;
  }
  return undefined;
}

const redis = new Redis({
  url: pickEnv(['KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL']),
  token: pickEnv(['KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN']),
});

const LEGACY = 'diagonal:data';
const K = { saved: 'diagonal:saved', calendario: 'diagonal:calendario', life: 'diagonal:life', projetos: 'diagonal:projetos', savedRev: 'diagonal:savedRev' };
const BAK = (sec) => 'diagonal:bak:' + sec;   // lista de backups por seção (mais novo no topo)
const BAK_MAX = 20;                            // guarda os 20 últimos por seção

// `_rev` de uma seção: objetos (life/calendario/projetos) usam `value._rev`;
// `saved` usa o carimbo companheiro `savedRev`. 0 = sem versão (não trava).
function revOf(sec, value, savedRev) {
  if (sec === 'saved') return Number(savedRev) || 0;
  return Number(value && value._rev) || 0;
}

module.exports = async function handler(req, res) {
  const secret = process.env.DIAGONAL_API_SECRET;

  // PING (sem chave): só diz se a proteção está ligada — nenhum dado sai daqui.
  // A tela de senha usa isto pra saber se valida a senha no servidor (protegido)
  // ou na própria tela (enquanto a variável não estiver configurada na Vercel).
  if (req.method === 'GET' && req.query && req.query.ping) {
    res.status(200).json({ protegido: !!secret });
    return;
  }

  // Daqui pra baixo, tudo exige a chave quando ela existe.
  if (secret && req.headers['x-diagonal-key'] !== secret) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  // Conferência de senha da tela de login: passou pela trava acima, então a chave
  // está certa. Responde só "ok" (sem trazer o documento inteiro à toa).
  if (req.method === 'GET' && req.query && req.query.auth) {
    res.status(200).json({ ok: true });
    return;
  }

  try {
    if (req.method === 'GET') {
      // Listar backups de uma seção (só metadados: índice + timestamp).
      if (req.query && req.query.backups) {
        const sec = String(req.query.backups);
        let list = [];
        try { list = await redis.lrange(BAK(sec), 0, -1); } catch { list = []; }
        const metas = (list || []).map((b, i) => ({ i, ts: (b && b.ts) || null, rev: revOf(sec, b && b.v, b && b.savedRev) }));
        res.status(200).json({ section: sec, backups: metas });
        return;
      }

      // Conteúdo de UM backup (`?backup=calendario&i=3`), pra dar pra CONFERIR
      // antes de restaurar — listar só data/hora não diz qual versão é a boa.
      if (req.query && req.query.backup) {
        const sec = String(req.query.backup);
        const i = Number(req.query.i) || 0;
        let list = [];
        try { list = await redis.lrange(BAK(sec), 0, -1); } catch { list = []; }
        const bak = list && list[i];
        if (!bak) { res.status(404).json({ error: 'backup não encontrado' }); return; }
        res.status(200).json({ section: sec, i, ts: bak.ts || null, v: bak.v });
        return;
      }

      // GET normal: lê cada registro isolado; se um falhar, os outros ainda voltam.
      const safeGet = async (k) => { try { return await redis.get(k); } catch { return null; } };
      const [legacy, saved, calendario, life, projetos, savedRev] = await Promise.all([
        safeGet(LEGACY), safeGet(K.saved), safeGet(K.calendario), safeGet(K.life), safeGet(K.projetos), safeGet(K.savedRev),
      ]);
      const out = { ...(legacy || {}) };
      if (saved != null) out.saved = saved;
      if (calendario != null) out.calendario = calendario;
      if (life != null) out.life = life;
      if (projetos != null) out.projetos = projetos;
      if (savedRev != null) out.savedRev = savedRev;
      if (!Array.isArray(out.saved)) out.saved = [];
      res.status(200).json(out);
      return;
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

      // Restaurar um backup: POST { restore: { section, i } }.
      if (body.restore && body.restore.section != null) {
        const sec = String(body.restore.section);
        const key = K[sec];
        if (!key) { res.status(400).json({ error: 'seção inválida' }); return; }
        const i = Number(body.restore.i) || 0;
        const list = await redis.lrange(BAK(sec), 0, -1);
        const bak = list && list[i];
        if (!bak) { res.status(404).json({ error: 'backup não encontrado' }); return; }
        // backup do valor ATUAL antes de restaurar (pra dar pra desfazer)
        const cur = await redis.get(key);
        if (cur != null) { try { await redis.lpush(BAK(sec), { ts: Date.now(), v: cur, savedRev: sec === 'saved' ? await redis.get(K.savedRev) : undefined }); await redis.ltrim(BAK(sec), 0, BAK_MAX - 1); } catch {} }
        let value = bak.v;
        // bump `_rev` acima de tudo, pra propagar aos aparelhos no próximo load.
        if (sec === 'saved') { await redis.set(key, value); await redis.set(K.savedRev, Date.now()); }
        else { if (value && typeof value === 'object') value = { ...value, _rev: Date.now() }; await redis.set(key, value); }
        res.status(200).json({ ok: true, restored: sec });
        return;
      }

      // Gravação normal: por seção, COM trava de versão + backup.
      const sections = [];
      if (Array.isArray(body.saved)) sections.push({ sec: 'saved', key: K.saved, value: body.saved, savedRev: body.savedRev });
      if (body.calendario !== undefined) sections.push({ sec: 'calendario', key: K.calendario, value: body.calendario });
      if (body.life !== undefined) sections.push({ sec: 'life', key: K.life, value: body.life });
      if (body.projetos !== undefined) sections.push({ sec: 'projetos', key: K.projetos, value: body.projetos });

      const rejected = [];
      let escritas = 0;
      for (const s of sections) {
        const stored = await redis.get(s.key);
        const storedSavedRev = s.sec === 'saved' ? await redis.get(K.savedRev) : undefined;
        const storedRev = revOf(s.sec, stored, storedSavedRev);
        const incomingRev = revOf(s.sec, s.value, s.savedRev);
        // Só RECUSA quando é provadamente velho: os dois têm versão e a que chega é MENOR.
        // (fail-open: se faltar versão em qualquer lado, grava — pra nunca travar um save legítimo.)
        if (storedRev > 0 && incomingRev > 0 && incomingRev < storedRev) { rejected.push(s.sec); continue; }
        // Backup do valor atual ANTES de sobrescrever.
        if (stored != null) { try { await redis.lpush(BAK(s.sec), { ts: Date.now(), v: stored, savedRev: storedSavedRev }); await redis.ltrim(BAK(s.sec), 0, BAK_MAX - 1); } catch {} }
        await redis.set(s.key, s.value);
        if (s.sec === 'saved' && s.savedRev !== undefined) await redis.set(K.savedRev, s.savedRev);
        escritas++;
      }
      if (rejected.length) { res.status(409).json({ ok: false, conflict: true, rejected, saved: escritas }); return; }
      res.status(200).json({ ok: true, saved: escritas });
      return;
    }

    res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
