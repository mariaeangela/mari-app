import { useState } from 'react';
import { ESPORTES, ESPORTES_AGENDA, ESPORTES_PROXIMOS, ESPORTES_ATUALIZADO } from './esportesSeed.js';

const COR = '#e2603a'; // laranja-esporte (acento da seção)
const DIAS_SEM = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// 'YYYY-MM-DD' -> Date local à meia-noite (evita fuso bagunçar o dia).
function parseData(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function meiaNoiteHoje() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }

// Rótulo do dia: Hoje / Amanhã / "Sábado, 18/07".
function rotuloDia(dataStr, hoje) {
  const d = parseData(dataStr);
  const diff = Math.round((d - hoje) / 86400000);
  const dm = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  if (diff === 0) return { titulo: 'Hoje', sub: `${DIAS_SEM[d.getDay()]}, ${dm}` };
  if (diff === 1) return { titulo: 'Amanhã', sub: `${DIAS_SEM[d.getDay()]}, ${dm}` };
  return { titulo: DIAS_SEM[d.getDay()], sub: dm };
}

// Selo de gênero: feminino / masculino / fem + masc.
const GENERO = {
  fem: { label: 'Feminino', cor: '#c2548f', bg: '#c2548f18' },
  masc: { label: 'Masculino', cor: '#3f6fb0', bg: '#3f6fb018' },
  misto: { label: 'Fem + Masc', cor: '#7a7a7a', bg: '#7a7a7a18' },
};
function GeneroTag({ genero }) {
  const g = GENERO[genero];
  if (!g) return null;
  return (
    <span style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 800, letterSpacing: '.4px', color: g.cor, background: g.bg, border: '1px solid ' + g.cor + '44', borderRadius: 999, padding: '1px 8px' }}>{g.label}</span>
  );
}

// Bloco de referência dentro do card de um esporte.
function Bloco({ titulo, children }) {
  return (
    <div style={{ marginTop: 16 }}>
      <p style={{ fontSize: 11, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>{titulo}</p>
      {children}
    </div>
  );
}

// Uma linha da agenda (um jogo/sessão).
function LinhaEvento({ ev }) {
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 8,
      background: ev.destaque ? COR + '10' : '#fff', border: '1px solid ' + (ev.destaque ? COR + '55' : '#eee'),
      borderRadius: 14, padding: '12px 14px',
    }}>
      <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 42 }}>
        <div style={{ fontSize: 20, lineHeight: 1 }}>{ev.emoji}</div>
        <div style={{ fontSize: 12, fontWeight: 800, color: ev.hora ? '#333' : '#bbb', marginTop: 4 }}>{ev.hora || '—'}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15.5, fontWeight: 700, color: '#111', lineHeight: 1.25 }}>{ev.titulo}</span>
          <GeneroTag genero={ev.genero} />
        </div>
        {ev.sub && <div style={{ fontSize: 12.5, color: '#888', marginTop: 3 }}>{ev.sub}</div>}
        {ev.assistir && <div style={{ fontSize: 12.5, color: COR, fontWeight: 700, marginTop: 4 }}>📺 {ev.assistir}</div>}
      </div>
    </div>
  );
}

// Aba Agenda: eventos de hoje em diante, agrupados por dia.
function Agenda() {
  const hoje = meiaNoiteHoje();
  const futuros = ESPORTES_AGENDA
    .filter(e => parseData(e.data) >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data) || (a.hora || '99').localeCompare(b.hora || '99'));

  // agrupa por data mantendo a ordem
  const dias = [];
  for (const ev of futuros) {
    let g = dias.find(d => d.data === ev.data);
    if (!g) { g = { data: ev.data, eventos: [] }; dias.push(g); }
    g.eventos.push(ev);
  }

  if (!dias.length) return (
    <p style={{ fontSize: 13.5, color: '#999', lineHeight: 1.6, marginTop: 20 }}>
      Sem jogos na agenda por enquanto. Me peça <b>“atualiza os esportes”</b> que eu preencho os próximos dias.
    </p>
  );

  return (
    <div style={{ marginTop: 8 }}>
      <p style={{ fontSize: 11.5, color: '#bbb', marginBottom: 14 }}>horários de Brasília · atualizado {ESPORTES_ATUALIZADO}</p>
      {dias.map(g => {
        const r = rotuloDia(g.data, hoje);
        return (
          <div key={g.data} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10, borderBottom: '2px solid #111', paddingBottom: 6 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, fontWeight: 800, color: '#111' }}>{r.titulo}</span>
              <span style={{ fontSize: 12, color: '#999', textTransform: 'lowercase' }}>{r.sub}</span>
            </div>
            {g.eventos.map((ev, i) => <LinhaEvento key={i} ev={ev} />)}
          </div>
        );
      })}

      {/* Mais pra frente — próxima data de cada esporte fora da janela dos próximos dias */}
      {ESPORTES_PROXIMOS.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <p style={{ fontSize: 11, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>mais pra frente</p>
          {ESPORTES_PROXIMOS.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 8, background: '#fafafa', border: '1px solid #eee', borderRadius: 14, padding: '11px 14px' }}>
              <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{p.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#222', lineHeight: 1.3 }}>{p.evento}</span>
                  <GeneroTag genero={p.genero} />
                </div>
                <div style={{ fontSize: 12.5, color: '#333', fontWeight: 700, marginTop: 3 }}>📅 {p.quando}</div>
                {p.assistir && <div style={{ fontSize: 12.5, color: COR, fontWeight: 700, marginTop: 3 }}>📺 {p.assistir}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Detalhe de um esporte: regras + competições (o que é, quando e onde assistir).
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

      <Bloco titulo="Competições · quando e onde assistir">
        {esp.competicoes.map((c, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15.5, fontWeight: 700, color: '#111', lineHeight: 1.25 }}>{c.nome}</span>
              <GeneroTag genero={c.genero} />
            </div>
            {c.oque && <div style={{ fontSize: 12.5, color: '#777', marginTop: 4, lineHeight: 1.5 }}>{c.oque}</div>}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 8 }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>📅</span>
              <span style={{ fontSize: 12.5, color: '#333', fontWeight: 700, lineHeight: 1.4 }}>{c.quando}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 5 }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>📺</span>
              <span style={{ fontSize: 12.5, color: esp.cor, fontWeight: 700, lineHeight: 1.4 }}>{c.assistir}</span>
            </div>
          </div>
        ))}
      </Bloco>
    </div>
  );
}

export default function EsportesSection({ onBack, backLabel = 'Explorar' }) {
  const [aba, setAba] = useState('agenda'); // 'agenda' | 'esportes'
  const [selId, setSelId] = useState(null);
  const sel = ESPORTES.find(e => e.id === selId);
  if (sel) return <EsporteDetail esp={sel} onBack={() => setSelId(null)} />;

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: 620, margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; {backLabel}</button>
      <div style={{ width: 36, height: 4, background: COR, borderRadius: 4, marginBottom: 10 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: 0 }}>Esportes</h2>
      <p style={{ fontSize: 12.5, color: '#999', margin: '4px 0 0' }}>a agenda dia a dia — e as regras, torneios e onde assistir</p>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 6, margin: '16px 0 4px' }}>
        {[['agenda', 'Agenda'], ['esportes', 'Esportes']].map(([id, label]) => (
          <button key={id} onClick={() => setAba(id)} style={{
            flex: 1, padding: '9px 2px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            border: '1px solid ' + (aba === id ? COR : '#e2e2e2'),
            background: aba === id ? COR + '1c' : '#fff', color: aba === id ? '#b6482a' : '#999',
          }}>{label}</button>
        ))}
      </div>

      {aba === 'agenda' ? <Agenda /> : (
        <>
          <p style={{ fontSize: 11, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', margin: '18px 0 10px' }}>esportes que acompanho</p>
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
        </>
      )}
    </div>
  );
}
