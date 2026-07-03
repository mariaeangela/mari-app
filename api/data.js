// Função serverless da Vercel: guarda os dados pessoais do app num Redis
// gratuito da Upstash/Vercel KV.
//
//   GET  /api/data  -> { saved: [...], calendario?: {...}, life?: {...}, projetos?: {...} }
//   POST /api/data  -> grava só os campos enviados
//
// IMPORTANTE: cada seção fica no SEU PRÓPRIO registro (`diagonal:life`,
// `diagonal:saved`, `diagonal:calendario`, `diagonal:projetos`) em vez de tudo
// num único `diagonal:data`. Assim cada gravação é pequena e não estoura o
// limite de request do Upstash (~1MB) — o que fazia edições manuais (ex.: marcar
// um item de checklist) falharem em silêncio quando o doc combinado cresceu.
// O GET junta o registro LEGADO (`diagonal:data`) com os por-seção (estes têm
// prioridade), então dados antigos continuam aparecendo e migram ao serem salvos.
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
const K = { saved: 'diagonal:saved', calendario: 'diagonal:calendario', life: 'diagonal:life', projetos: 'diagonal:projetos' };

module.exports = async function handler(req, res) {
  const secret = process.env.DIAGONAL_API_SECRET;
  if (secret && req.headers['x-diagonal-key'] !== secret) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  try {
    if (req.method === 'GET') {
      // lê cada registro isolado: se um falhar (ex.: legado muito grande), os
      // outros ainda voltam — o load nunca quebra por causa de uma seção só.
      const safeGet = async (k) => { try { return await redis.get(k); } catch { return null; } };
      const [legacy, saved, calendario, life, projetos] = await Promise.all([
        safeGet(LEGACY), safeGet(K.saved), safeGet(K.calendario), safeGet(K.life), safeGet(K.projetos),
      ]);
      const out = { ...(legacy || {}) };            // base: registro antigo (se houver)
      if (saved != null) out.saved = saved;         // por-seção sobrepõe o legado
      if (calendario != null) out.calendario = calendario;
      if (life != null) out.life = life;
      if (projetos != null) out.projetos = projetos;
      if (!Array.isArray(out.saved)) out.saved = [];
      res.status(200).json(out);
      return;
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const ops = [];
      if (Array.isArray(body.saved)) ops.push(redis.set(K.saved, body.saved));
      if (body.calendario !== undefined) ops.push(redis.set(K.calendario, body.calendario));
      if (body.life !== undefined) ops.push(redis.set(K.life, body.life));
      if (body.projetos !== undefined) ops.push(redis.set(K.projetos, body.projetos));
      await Promise.all(ops);
      res.status(200).json({ ok: true, saved: ops.length });
      return;
    }

    res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
