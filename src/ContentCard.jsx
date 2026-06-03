import { useState, useEffect } from 'react';

const MET_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';
const CLE_BASE = 'https://openaccess-api.clevelandart.org/api/artworks';

// Busca a imagem de uma obra em várias fontes abertas de museus.
// Ordem de prioridade:
//   1) URL direta (content.imagem) — ex.: Wikimedia Commons (domínio público)
//   2) Metropolitan Museum of Art — por ID (metId) ou por busca (metQuery)
//   3) Cleveland Museum of Art — por ID (clevelandId) ou por busca (clevelandQuery)
//   4) Wikimedia Commons — por busca (wikiQuery)
function useArtworkImage(content) {
  const direct = content?.imagem;
  const { metId, metQuery, clevelandId, clevelandQuery, wikiQuery } = content || {};
  const [imgUrl, setImgUrl] = useState(direct || null);

  useEffect(() => {
    if (direct) { setImgUrl(direct); return; }
    if (!metId && !metQuery && !clevelandId && !clevelandQuery && !wikiQuery) return;
    let cancelled = false;

    async function metById(id) {
      try {
        const r = await fetch(`${MET_BASE}/objects/${id}`);
        const d = await r.json();
        return d.primaryImageSmall || d.primaryImage || null;
      } catch { return null; }
    }
    async function metBySearch(q) {
      try {
        const r = await fetch(`${MET_BASE}/search?q=${encodeURIComponent(q)}&hasImages=true`);
        const d = await r.json();
        for (const id of (d.objectIDs || []).slice(0, 6)) {
          if (cancelled) return null;
          const u = await metById(id);
          if (u) return u;
        }
      } catch {}
      return null;
    }
    async function cleById(id) {
      try {
        const r = await fetch(`${CLE_BASE}/${id}`);
        const d = await r.json();
        return d.data?.images?.web?.url || null;
      } catch { return null; }
    }
    async function cleBySearch(q) {
      try {
        const r = await fetch(`${CLE_BASE}/?q=${encodeURIComponent(q)}&has_image=1&limit=1`);
        const d = await r.json();
        return d.data?.[0]?.images?.web?.url || null;
      } catch { return null; }
    }
    async function wikiBySearch(q) {
      try {
        const r = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&iiurlwidth=900&format=json&origin=*`);
        const d = await r.json();
        const first = Object.values(d.query?.pages || {})[0];
        return first?.imageinfo?.[0]?.thumburl || null;
      } catch { return null; }
    }

    async function run() {
      let url = null;
      if (!url && metId) url = await metById(metId);
      if (!url && metQuery) url = await metBySearch(metQuery);
      if (!url && clevelandId) url = await cleById(clevelandId);
      if (!url && clevelandQuery) url = await cleBySearch(clevelandQuery);
      if (!url && wikiQuery) url = await wikiBySearch(wikiQuery);
      if (url && !cancelled) setImgUrl(url);
    }

    run();
    return () => { cancelled = true; };
  }, [direct, metId, metQuery, clevelandId, clevelandQuery, wikiQuery]);

  return imgUrl;
}

// Visualizador de imagem em tela cheia. Fecha no ×, na tecla Esc ou clicando fora.
function Lightbox({ src, alt, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.93)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'lbFade 0.2s ease', cursor: 'zoom-out' }}>
      <style>{'@keyframes lbFade{from{opacity:0}to{opacity:1}}'}</style>
      <button onClick={onClose} aria-label="fechar" style={{ position: 'absolute', top: 14, right: 16, background: 'rgba(255,255,255,0.14)', border: 'none', color: '#fff', fontSize: 26, width: 42, height: 42, borderRadius: '50%', cursor: 'pointer', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
      <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8, boxShadow: '0 8px 40px rgba(0,0,0,0.6)', cursor: 'default' }} />
    </div>
  );
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

export default function ContentCard({ typeLabel, typeEmoji, palette, content, onReload, onRemove, type, showSave = true }) {
  const [expanded, setExpanded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [zoom, setZoom] = useState(false);

  const imageUrl = useArtworkImage(content);
  const hasImageSlot = !!(content?.metId || content?.metQuery || content?.clevelandId || content?.clevelandQuery || content?.wikiQuery || content?.imagem);

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
          {showSave && <SaveButton content={content} type={type} />}
          {onReload && (
            <button onClick={() => { onReload(); setExpanded(false); setImgError(false); setImgLoaded(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.sub, fontSize: 16, padding: 4 }}>↻</button>
          )}
          {onRemove && (
            <button onClick={onRemove} title="remover dos salvos"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.sub, fontSize: 16, padding: '4px 6px', lineHeight: 1 }}>×</button>
          )}
        </div>
      </div>

      {/* Imagem — spinner enquanto carrega; sai sozinha se não houver. Clique para ampliar. */}
      {hasImageSlot && !imgError && (
        <div style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden', background: palette.accent + '12', aspectRatio: imgLoaded ? 'auto' : '16/10', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {!imgLoaded && (
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${palette.accent}40`, borderTopColor: palette.accent, animation: 'spin 1s linear infinite' }} />
          )}
          {imageUrl && (
            <>
              <img src={imageUrl} alt={content.titulo} onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)}
                onClick={() => imgLoaded && setZoom(true)}
                style={{ width: '100%', display: imgLoaded ? 'block' : 'none', maxHeight: 300, objectFit: 'cover', cursor: 'zoom-in' }} />
              {imgLoaded && (
                <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 14, width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>⤢</span>
              )}
            </>
          )}
        </div>
      )}
      {content.imagemCredito && !imgError && imgLoaded && (
        <p style={{ fontSize: 9, color: palette.sub + '60', marginBottom: 14 }}>{content.imagemCredito}</p>
      )}

      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 21, fontWeight: 700, color: palette.text, marginBottom: 5, lineHeight: 1.25 }}>{content.titulo}</h2>
      <p style={{ fontSize: 10, color: palette.sub, marginBottom: 16, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>{content.subtitulo}</p>
      <div style={{ width: 28, height: 2, background: palette.accent, marginBottom: 16, borderRadius: 2 }} />

      <div style={{ color: palette.text, fontSize: 15.5, lineHeight: 1.8, fontFamily: "'Lora', serif", marginBottom: 18, whiteSpace: 'pre-line', overflow: expanded ? 'visible' : 'hidden', display: expanded ? 'block' : '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 4, WebkitBoxOrient: 'vertical' }}>
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

      {zoom && imageUrl && <Lightbox src={imageUrl} alt={content.titulo} onClose={() => setZoom(false)} />}
    </div>
  );
}
