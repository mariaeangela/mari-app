import { useState } from 'react';
import { ESPORTES, ESPORTES_AGORA, ESPORTES_ATUALIZADO } from './esportesSeed.js';

const COR = '#e2603a'; // laranja-esporte (acento da seção)

// Bloco de referência dentro do card de um esporte (Regras / Torneios / Calendário).
function Bloco({ titulo, children }) {
  return (
    <div style={{ marginTop: 16 }}>
      <p style={{ fontSize: 11, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>{titulo}</p>
      {children}
    </div>
  );
}

// Detalhe de um esporte: regras, torneios e calendário.
function EsporteDetail({ esp, onBack }) {
  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: 620, margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Esportes</button>
      <div style={{ width: 36, height: 4, background: esp.cor, borderRadius: 4, marginBottom: 10 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#111', margin: 0 }}>{esp.emoji} {esp.nome}</h2>
      {esp.escopo && <p style={{ fontSize: 12.5, color: '#999', margin: '4px 0 0' }}>{esp.escopo}</p>}

      <Bloco titulo="Principais regras">
        {esp.regras.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '6px 0', borderBottom: '1px solid #f4f4f4' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: esp.cor, flexShrink: 0, marginTop: 7 }} />
            <span style={{ fontSize: 13.5, color: '#444', lineHeight: 1.5 }}>{r}</span>
          </div>
        ))}
      </Bloco>

      <Bloco titulo="Principais torneios">
        {esp.torneios.map((t, i) => (
          <div key={i} style={{ padding: '9px 0', borderBottom: '1px solid #f4f4f4' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: '#111' }}>{t.nome}</div>
            {t.nota && <div style={{ fontSize: 12.5, color: '#888', marginTop: 2 }}>{t.nota}</div>}
          </div>
        ))}
      </Bloco>

      <Bloco titulo="Calendário">
        {esp.calendario.map((c, i) => (
          <p key={i} style={{ fontSize: 13.5, color: '#444', lineHeight: 1.55, margin: '0 0 8px' }}>{c}</p>
        ))}
      </Bloco>
    </div>
  );
}

export default function EsportesSection({ onBack, backLabel = 'Explorar' }) {
  const [selId, setSelId] = useState(null);
  const sel = ESPORTES.find(e => e.id === selId);
  if (sel) return <EsporteDetail esp={sel} onBack={() => setSelId(null)} />;

  const nomeDe = (id) => ESPORTES.find(e => e.id === id)?.nome || '';

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: 620, margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; {backLabel}</button>
      <div style={{ width: 36, height: 4, background: COR, borderRadius: 4, marginBottom: 10 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: 0 }}>Esportes</h2>
      <p style={{ fontSize: 12.5, color: '#999', margin: '4px 0 0' }}>regras, torneios e calendário — e o que dá pra ver agora</p>

      {/* Acontecendo agora */}
      <div style={{ marginTop: 22 }}>
        <p style={{ fontSize: 11, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>
          acontecendo agora <span style={{ color: '#ccc', textTransform: 'none', letterSpacing: 0 }}>· atualizado {ESPORTES_ATUALIZADO}</span>
        </p>
        {ESPORTES_AGORA.map((a, i) => (
          <div key={i} onClick={() => setSelId(a.esporte)} title="ver o esporte" style={{
            display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 8,
            background: a.destaque ? COR + '10' : '#fff', border: '1px solid ' + (a.destaque ? COR + '55' : '#eee'),
            borderRadius: 14, padding: '13px 15px',
          }}>
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{a.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15.5, fontWeight: 700, color: '#111', lineHeight: 1.25 }}>{a.titulo}</div>
              <div style={{ fontSize: 12.5, color: a.destaque ? '#b6482a' : '#777', fontWeight: 700, marginTop: 4 }}>{a.quando}</div>
              {a.nota && <div style={{ fontSize: 12.5, color: '#888', marginTop: 4, lineHeight: 1.45 }}>{a.nota}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Esportes que acompanho */}
      <p style={{ fontSize: 11, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', margin: '24px 0 10px' }}>esportes que acompanho</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {ESPORTES.map(e => (
          <button key={e.id} onClick={() => setSelId(e.id)} style={{
            background: e.cor + '12', border: '1px solid ' + e.cor + '33', borderRadius: 16, padding: '16px 14px', cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{ fontSize: 24, marginBottom: 8, lineHeight: 1 }}>{e.emoji}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#222', fontWeight: 700, lineHeight: 1.2 }}>{e.nome}</div>
            <div style={{ fontSize: 11.5, color: '#999', marginTop: 3 }}>{e.escopo}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
