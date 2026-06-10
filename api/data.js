// Função serverless da Vercel: guarda os dados pessoais do app (salvos e, no
// futuro, projetos) num Redis gratuito da Upstash/Vercel KV.
//
//   GET  /api/data  -> { saved: [...], projetos?: {...} }
//   POST /api/data  -> mescla os campos enviados no documento e devolve { ok: true }
//
// O POST faz MERGE raso: enviar só { saved } atualiza os salvos sem apagar os
// projetos (e vice-versa). Assim a futura aba Projetos reusa o mesmo endpoint.
const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
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
