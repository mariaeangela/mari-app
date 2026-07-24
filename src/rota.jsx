// Trajeto de corrida a partir de um GPX (Strava/Garmin), desenhado como linha SVG.
// Sem mapa externo / sem chave de API: só o contorno do percurso. Usado na
// Retrospectiva (provas) e no form de exercício do Calendário (corrida rua/prova).
import { useState, useRef } from 'react';

// Lê o texto de um GPX e devolve o traçado já projetado e simplificado, pronto pra
// desenhar: { pts:[[x,y],...], w, h }. Projeção equiretangular com correção de
// latitude (lon·cos(lat)); norte pra cima; caixa normalizada (~1000 no maior lado).
// Amostra pra no máx ~250 pontos, pra não inchar o sync. null se não for GPX válido.
export function parseGpx(text) {
  let doc;
  try { doc = new DOMParser().parseFromString(text, 'application/xml'); } catch { return null; }
  if (!doc || doc.getElementsByTagName('parsererror').length) return null;
  let nodes = doc.getElementsByTagName('trkpt');
  if (!nodes.length) nodes = doc.getElementsByTagName('rtept');
  if (!nodes.length) nodes = doc.getElementsByTagName('wpt');
  const raw = [];
  for (let i = 0; i < nodes.length; i++) {
    const la = parseFloat(nodes[i].getAttribute('lat'));
    const lo = parseFloat(nodes[i].getAttribute('lon'));
    if (Number.isFinite(la) && Number.isFinite(lo)) raw.push([la, lo]);
  }
  if (raw.length < 2) return null;
  const MAX = 250;
  let sampled = raw;
  if (raw.length > MAX) {
    sampled = [];
    const step = raw.length / MAX;
    for (let i = 0; i < MAX; i++) sampled.push(raw[Math.floor(i * step)]);
    sampled.push(raw[raw.length - 1]);
  }
  const meanLat = sampled.reduce((a, p) => a + p[0], 0) / sampled.length;
  const k = Math.cos(meanLat * Math.PI / 180) || 1;
  const proj = sampled.map(([la, lo]) => [lo * k, la]);
  const xs = proj.map(p => p[0]), ys = proj.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rx = (maxX - minX) || 1e-6, ry = (maxY - minY) || 1e-6;
  const scale = 1000 / Math.max(rx, ry);
  const w = Math.max(1, Math.round(rx * scale));
  const h = Math.max(1, Math.round(ry * scale));
  const pts = proj.map(([x, y]) => [Math.round((x - minX) * scale), Math.round((maxY - y) * scale)]);
  return { pts, w, h };
}

// Desenha o traçado (saída do parseGpx) como linha SVG, com um ponto verde na
// largada e um vermelho na chegada.
export function RotaChart({ rota, cor = '#ef6c4d' }) {
  if (!rota || !Array.isArray(rota.pts) || rota.pts.length < 2) return null;
  const { pts, w, h } = rota;
  const pad = Math.max(w, h) * 0.06;
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  const a = pts[0], b = pts[pts.length - 1];
  const sw = Math.max(w, h) / 90;
  const r = Math.max(w, h) / 55;
  return (
    <svg viewBox={`${-pad} ${-pad} ${w + pad * 2} ${h + pad * 2}`} style={{ width: '100%', maxHeight: 220, height: 'auto', display: 'block' }}>
      <path d={d} fill="none" stroke={cor} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
      <circle cx={a[0]} cy={a[1]} r={r} fill="#2bb673" />
      <circle cx={b[0]} cy={b[1]} r={r} fill="#d05050" />
    </svg>
  );
}

// Campo CONTROLADO de trajeto: desenha (se houver) + botão pra subir/trocar/remover
// o GPX. `rota` é o valor atual; `onChange(rotaOuUndefined)` avisa quem controla.
export function RotaField({ rota, onChange, cor = '#ef6c4d' }) {
  const [erro, setErro] = useState('');
  const inputRef = useRef(null);
  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseGpx(String(reader.result || ''));
      if (!parsed) { setErro('Não consegui ler esse arquivo. Confira se é o .gpx exportado do Strava/Garmin.'); return; }
      setErro('');
      onChange(parsed);
    };
    reader.onerror = () => setErro('Não consegui abrir o arquivo.');
    reader.readAsText(f);
  };
  const linkBtn = { background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: cor };
  return (
    <div style={{ marginTop: 10 }}>
      {rota && (
        <div style={{ background: '#faf7f5', border: '1px solid #f1e7e3', borderRadius: 10, padding: 8, marginBottom: 6 }}>
          <RotaChart rota={rota} cor={cor} />
        </div>
      )}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <button type="button" onClick={() => inputRef.current && inputRef.current.click()} style={linkBtn}>{rota ? '↻ trocar trajeto' : '＋ adicionar trajeto (GPX)'}</button>
        {rota && <button type="button" onClick={() => onChange(undefined)} style={{ ...linkBtn, color: '#bbb' }}>remover</button>}
        <input ref={inputRef} type="file" accept=".gpx,application/gpx+xml,application/xml,text/xml" onChange={onFile} style={{ display: 'none' }} />
      </div>
      {erro && <div style={{ fontSize: 11.5, color: '#d05050', marginTop: 5, lineHeight: 1.4 }}>{erro}</div>}
    </div>
  );
}
