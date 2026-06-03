import { useState, useEffect } from 'react';

// Busca imagem de obra de arte no Metropolitan Museum of Art (API aberta).
// 1) Tenta pelo ID exato da obra (método confiável)
// 2) Se falhar, busca pelo nome
function useArtworkImage(metId, metQuery) {
  const [imgUrl, setImgUrl] = useState(null);

  useEffect(() => {
    if (!metId && !metQuery) return;
    let cancelled = false;
    const base = 'https://collectionapi.metmuseum.org/public/collection/v1';

    async function getById(id) {
      try {
        const r = await fetch(`${base}/objects/${id}`);
        const d = await r.json();
        return d.primaryImageSmall || d.primaryImage || null;
      } catch { return null; }
    }

    async function getByQuery(q) {
      try {
        const r = await fetch(`${base}/search?q=${encodeURIComponent(q)}&hasImages=true`);
        const d = await r.json();
        const ids = (d.objectIDs || []).slice(0, 6);
        for (const id of ids) {
          if (cancelled) return null;
          const url = await getById(id);
          if (url) return url;
        }
      } catch {}
      return null;
    }

    async function run() {
      let url = null;
      if (metId) url = await getById(metId);
      if (!url && metQuery) url = await getByQuery(metQuery);
      if (url && !cancelled) setImgUrl(url);
    }

    run();
    return () => { cancelled = true; };
  }, [metId, metQuery]);

  return imgUrl;
}

function SaveButton({ content, type }) {
  const getId = () => `${type}_${content.titulo}`;
  const isSaved = () => {
    try { return JSON.parse(localStorage.getItem('diagonal_saved') || '[]').some(i => i.id === getId()); }
    catch { return false; }
  };
  const [saved, setSaved] = useState(isSaved);
  const toggle = (e) => {
    e.stopPropagation();
    try {
      const list = JSON.parse(localStorage.getItem('diagonal_saved') || '[]');
      if (saved) {
        localStorage.setItem('diagonal_saved', JSON.stringify(list.filter(i => i.id !== getId())));
        setSaved(false);
      } else {
        list.unshift({ id: getId(), type, ...content, savedAt: Date.now() });
        localStorage.setItem('diagonal_saved', JSON.stringify(list));
        setSaved(true);
      }
    } catch {}
  };
  return (
    <button onClick={toggle} title={saved ? 'Salvo!' : 'Salvar'} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '0 4px', opacity: saved ? 1 : 0.35, transition: 'all 0.2s', transform: saved ? 'scale(1.2)' : 'scale(1)' }}>
      {saved ? '★' : '☆'}
    </button>
  );
}

export default function ContentCard({ typeLabel, typeEmoji, palette, content, onReload, type }) {
  const [expanded, setExpanded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const fetchedImg = useArtworkImage(content?.metId, content?.metQuery);
  const imageUrl = fetchedImg || content?.imagem;
  const hasImageSlot = !!(content?.metId || content?.metQuery || content?.imagem);

  if (!content) return null;

  return (
    <div style={{ background: palette.bg, padding: '26px 22px', marginBottom: 2, animation: 'fadeUp 0.4s ease', position: 'relative', overflow: 'hidden' }}>
      <style>{'@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}}'}</style>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 90, height: 90, background: palette.accent + '10', borderRadius: '0 0 0 90px' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15 }}>{typeEmoji}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: palette.accent, letterSpacing: '2px', textTransform: 'uppercase' }}>{typeLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SaveButton content={content} type={type} />
          {onReload && (
            <button onClick={() => { onReload(); setExpanded(false); setImgError(false); setImgLoaded(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.sub, fontSize: 16, padding: 4 }}>↻</button>
          )}
        </div>
      </div>

      {/* Image — spinner enquanto carrega; sai sozinha se não houver */}
      {hasImageSlot && !imgError && (
        <div style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden', background: palette.accent + '12', aspectRatio: imgLoaded ? 'auto' : '16/10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!imgLoaded && (
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${palette.accent}40`, borderTopColor: palette.accent, animation: 'spin 1s linear infinite' }} />
          )}
          {imageUrl && (
            <img src={imageUrl} alt={content.titulo} onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)}
              style={{ width: '100%', display: imgLoaded ? 'block' : 'none', maxHeight: 300, objectFit: 'cover' }} />
          )}
        </div>
      )}
      {content.imagemCredito && !imgError && imgLoaded && (
        <p style={{ fontSize: 9, color: palette.sub + '60', marginBottom: 14 }}>{content.imagemCredito}</p>
      )}

      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 21, fontWeight: 700, color: palette.text, marginBottom: 5, lineHeight: 1.25 }}>{content.titulo}</h2>
      <p style={{ fontSize: 10, color: palette.sub, marginBottom: 16, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>{content.subtitulo}</p>
      <div style={{ width: 28, height: 2, background: palette.accent, marginBottom: 16, borderRadius: 2 }} />

      <div style={{ color: palette.sub, fontSize: 15, lineHeight: 1.85, fontFamily: "'Playfair Display', serif", marginBottom: 18, whiteSpace: 'pre-line', overflow: expanded ? 'visible' : 'hidden', display: expanded ? 'block' : '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 4, WebkitBoxOrient: 'vertical' }}>
        {content.corpo}
      </div>

      {expanded && content.frase && (
        <div style={{ borderLeft: '3px solid ' + palette.accent, paddingLeft: 16, marginBottom: 14 }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 15, color: palette.text, lineHeight: 1.65, margin: 0 }}>{content.frase}</p>
        </div>
      )}
      {expanded && content.fonte && <p style={{ fontSize: 10, color: palette.sub + '60', marginBottom: 14 }}>{content.fonte}</p>}

      <button onClick={() => setExpanded(!expanded)} style={{ width: '100%', padding: '12px 0', background: 'transparent', border: '1px solid ' + palette.accent + '50', borderRadius: 12, color: palette.accent, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
        {expanded ? 'menos' : 'ler mais'}
      </button>
    </div>
  );
}
