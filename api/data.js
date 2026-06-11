// Função serverless da Vercel: guarda os dados pessoais do app (salvos e, no
// futuro, projetos) num Redis gratuito da Upstash/Vercel KV.
//
//   GET  /api/data  -> { saved: [...], projetos?: {...} }
//   POST /api/data  -> mescla os campos enviados no documento e devolve { ok: true }
//
// O POST faz MERGE raso: enviar só { saved } atualiza os salvos sem apagar os
// projetos (e vice-versa). Assim a futura aba Projetos reusa o mesmo endpoint.
const { Redis } = require('@upstash/redis');

// Acha a URL/token do Redis entre as envs, tolerando prefixos que a Vercel
// possa adicionar (ex.: STORAGE_KV_REST_API_URL). Casa pelo sufixo do nome.
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

const DATA_KEY = 'diagonal:data';
const DEFAULT = { saved: [] };

module.exports = async function handler(req, res) {
  // Trava opcional por segredo compartilhado. Se a env DIAGONAL_API_SECRET
  // existir, todo request precisa mandar o header x-diagonal-key igual.
  // (Pode ser adicionada depois, sem mexer no código.)
  const secret = process.env.DIAGONAL_API_SECRET;
  if (secret && req.headers['x-diagonal-key'] !== secret) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  try {
    if (req.method === 'GET') {
      const data = (await redis.get(DATA_KEY)) || DEFAULT;
      res.status(200).json(data);
      return;
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const current = (await redis.get(DATA_KEY)) || DEFAULT;
      const next = { ...current };
      if (Array.isArray(body.saved)) next.saved = body.saved;
      if (body.projetos !== undefined) next.projetos = body.projetos;
      await redis.set(DATA_KEY, next);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
