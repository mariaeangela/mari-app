// Proxy do oEmbed público do Spotify: dado o link de um álbum, devolve a URL da
// capa (thumbnail). Feito no servidor pra não esbarrar em CORS no navegador.
// GET /api/spotify?url=<link do álbum no Spotify>  ->  { thumb, title }
module.exports = async function handler(req, res) {
  const url = (req.query && req.query.url) || '';
  // Só aceita links do próprio Spotify (evita virar proxy aberto / SSRF).
  if (!/^https?:\/\/open\.spotify\.com\//.test(url)) {
    res.status(400).json({ error: 'url inválida' });
    return;
  }
  try {
    const r = await fetch('https://open.spotify.com/oembed?url=' + encodeURIComponent(url), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DiagonalApp/1.0)', 'Accept': 'application/json' },
    });
    if (!r.ok) { res.status(200).json({ thumb: null }); return; }
    const j = await r.json();
    // Cacheia no edge por 30 dias (a capa não muda).
    res.setHeader('Cache-Control', 's-maxage=2592000, stale-while-revalidate=86400');
    res.status(200).json({ thumb: j.thumbnail_url || null, title: j.title || null });
  } catch (e) {
    res.status(200).json({ thumb: null });
  }
};
