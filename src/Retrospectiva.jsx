// Aba "Retrospectiva": hub que agrega seus números e marcos.
// Página inicial: "o ano em números" (clicável) + cards que abrem sub-retrospectivas.
import { useState, useEffect } from 'react';
import { useCalendar } from './calendarStore.jsx';
import { useLife, simboloMoeda, MOEDAS } from './lifeStore.jsx';
import { EXERCICIO_BY_ID, fmtTempo, paceSecs, fmtPace, fmtKm } from './calendarConfig.js';

const COR = '#8d6e63';
const overlay = { position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' };
const sheet = { background: '#fafafa', width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', borderRadius: '20px 20px 0 0', padding: '20px 20px 28px' };
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', color: '#222' };
const labelStyle = { fontSize: 11, color: '#999', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: 5, marginTop: 14 };
const pad2 = (n) => String(n).padStart(2, '0');
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const fmtDM = (s) => { const [, m, d] = s.split('-'); return `${d}/${m}`; };
const fmtMesAno = (mm) => `${MESES[+mm.slice(5, 7) - 1]} de ${mm.slice(0, 4)}`;
const fmtDiaMes = (s) => { const [, m, d] = s.split('-'); return `${+d} ${MESES[+m - 1].slice(0, 3)}`; };

// Seletor de ano reutilizável (Compras / Música / Corridas). `datas` = lista de strings "YYYY-..".
function useAnoSel(datas) {
  const anoAtual = String(new Date().getFullYear());
  const anos = [...new Set(datas.map(d => (d || '').slice(0, 4)).filter(Boolean))].filter(a => a <= anoAtual).sort().reverse();
  const [anoSelRaw, setAnoSel] = useState(anoAtual);
  const anoSel = anos.includes(anoSelRaw) ? anoSelRaw : (anos[0] || anoAtual);
  return { anos, anoSel, setAnoSel };
}
function AnoChips({ anos, anoSel, setAnoSel, cor }) {
  if (anos.length < 2) return null;
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
      {anos.map(a => (
        <button key={a} onClick={() => setAnoSel(a)} style={{
          whiteSpace: 'nowrap', padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
          border: '1px solid ' + (anoSel === a ? cor : '#e2e2e2'), background: anoSel === a ? cor + '1c' : '#fff', color: anoSel === a ? '#333' : '#999',
        }}>{a}</button>
      ))}
    </div>
  );
}

// Cards do hub. `pronto` = sub-página já construída.
const CARDS = [
  { id: 'dias', label: 'Dias importantes', desc: 'seus marcos de vida', cor: '#7a6ff0', pronto: true },
  { id: 'compras', label: 'Compras', desc: 'o que você comprou', cor: '#ff8a3d', pronto: true },
  { id: 'quem', label: 'Quem você viu', desc: 'as pessoas do seu ano', cor: '#ff5d8f' },
  { id: 'viagens', label: 'Viagens', desc: 'pra onde você foi', cor: '#19b3a6' },
  { id: 'musica', label: 'Música', desc: 'o que tocou no seu ano', cor: '#1db954' },
  { id: 'saude', label: 'Saúde', desc: 'terapia, consultas', cor: '#d96459' },
  { id: 'corridas', label: 'Corridas', desc: 'suas provas e pace', cor: '#ef6c4d', pronto: true },
  { id: 'amorosa', label: 'Amorosa', desc: 'dates e afins', cor: '#c2548f' },
];

export default function RetrospectivaPage({ isWide, secInicial, onConsumeSec }) {
  const [sec, setSec] = useState(secInicial || null);
  useEffect(() => { if (secInicial) { setSec(secInicial); onConsumeSec && onConsumeSec(); } }, [secInicial]);
  if (sec === 'compras') return <ComprasRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (sec === 'musica') return <MusicaRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (sec === 'corridas') return <CorridasRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (sec === 'dias') return <DiasRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (sec) return <EmBreve card={CARDS.find(c => c.id === sec)} onBack={() => setSec(null)} />;
  return <RetroHome isWide={isWide} onOpen={setSec} />;
}

function RetroHome({ isWide, onOpen }) {
  const cal = useCalendar();
  const cultura = cal.data.cultura || [];
  const exercicios = cal.data.exercicios || [];

  const hoje = new Date();
  const hk = `${hoje.getFullYear()}-${pad2(hoje.getMonth() + 1)}-${pad2(hoje.getDate())}`;
  const anoAtual = String(hoje.getFullYear());
  const anos = [...new Set([
    ...cultura.map(c => (c.data || '').slice(0, 4)),
    ...exercicios.map(x => (x.data || '').slice(0, 4)),
  ].filter(Boolean))].filter(a => a <= anoAtual).sort().reverse();
  const [anoSelRaw, setAnoSel] = useState(anoAtual);
  const anoSel = anos.includes(anoSelRaw) ? anoSelRaw : (anos[0] || anoAtual);
  const [detalhe, setDetalhe] = useState(null);

  const noAno = (arr) => arr.filter(x => (x.data || '').startsWith(anoSel) && (x.data || '') <= hk);
  const cultAno = noAno(cultura);
  const exAno = noAno(exercicios);
  const byData = (a, b) => (b.data || '').localeCompare(a.data || '');
  const cultItens = (sub) => cultAno.filter(c => c.subtipo === sub).sort(byData).map(c => ({ titulo: c.titulo || '—', data: c.data }));
  const exGrupo = (g) => exAno.filter(x => EXERCICIO_BY_ID[x.subtipo]?.grupo === g).sort(byData);
  const corridas = exGrupo('corrida');                                  // todas as corridas (prova + treino)
  const ehProva = (x) => x.subtipo === 'corrida_prova' || x.subtipo === 'corrida';
  const km = Math.round(corridas.reduce((a, x) => a + (Number(x.distancia) || 0), 0) * 10) / 10;
  const provaLabel = (x) => {
    const nome = x.titulo || EXERCICIO_BY_ID[x.subtipo]?.label || 'Prova';
    const extra = [x.distancia ? `${fmtKm(x.distancia)}km` : null, x.tempo ? fmtTempo(x.tempo) : null].filter(Boolean);
    return extra.length ? `${nome} · ${extra.join(' · ')}` : nome;
  };

  const numeros = [
    { key: 'lido', label: 'livros lidos', itens: cultItens('lido') },
    { key: 'filme', label: 'filmes', itens: cultItens('filme') },
    { key: 'serie', label: 'séries', itens: cultItens('serie') },
    { key: 'exposicao', label: 'exposições', itens: cultItens('exposicao') },
    { key: 'museu', label: 'museus', itens: cultItens('museu') },
    { key: 'show', label: 'shows', itens: cultItens('show') },
    { key: 'espetaculo', label: 'espetáculos', itens: cultItens('espetaculo') },
    { key: 'treino', label: 'treinos', itens: exGrupo('treino').map(x => ({ titulo: EXERCICIO_BY_ID[x.subtipo]?.label || 'Treino', data: x.data })) },
    { key: 'provas', label: 'provas de corrida', itens: corridas.filter(ehProva).map(x => ({ titulo: provaLabel(x), data: x.data })) },
    { key: 'km', label: 'km corridos', valor: km, itens: null },
  ].map(n => ({ ...n, valor: n.valor != null ? n.valor : n.itens.length })).filter(n => n.valor > 0);

  const det = detalhe && numeros.find(n => n.key === detalhe);

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 720 : 'none', margin: '0 auto' }}>
      <div style={{ width: 36, height: 4, background: COR, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#111', margin: '0 0 4px' }}>Retrospectiva</h2>
      <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>seus números e marcos por ano</p>

      {anos.length > 1 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
          {anos.map(a => (
            <button key={a} onClick={() => { setAnoSel(a); setDetalhe(null); }} style={{
              whiteSpace: 'nowrap', padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
              border: '1px solid ' + (anoSel === a ? COR : '#e2e2e2'), background: anoSel === a ? COR + '1c' : '#fff', color: anoSel === a ? '#5d473e' : '#888',
            }}>{a}</button>
          ))}
        </div>
      )}

      <div style={{ fontSize: 11, color: COR, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>{anoSel} em números</div>

      {numeros.length === 0 ? (
        <div style={{ padding: 24, borderRadius: 16, background: COR + '10', border: '1px dashed ' + COR + '55', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 16, color: '#555', margin: 0 }}>Seu ano ainda está em branco por aqui.</p>
          <p style={{ fontSize: 13, color: '#999', marginTop: 8, lineHeight: 1.6 }}>Conforme você registra cultura e exercícios no Calendário, seus números aparecem aqui.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isWide ? 'repeat(auto-fill, minmax(150px, 1fr))' : '1fr 1fr', gap: 12 }}>
          {numeros.map(n => {
            const clicavel = n.key === 'km' ? corridas.length > 0 : (n.itens && n.itens.length > 0);
            const ativo = detalhe === n.key;
            return (
              <div key={n.key} onClick={clicavel ? () => setDetalhe(ativo ? null : n.key) : undefined} style={{
                background: ativo ? COR + '1c' : COR + '10', border: '1px solid ' + (ativo ? COR : COR + '28'), borderRadius: 14, padding: '16px 14px', cursor: clicavel ? 'pointer' : 'default',
              }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: '#111', lineHeight: 1 }}>{n.key === 'km' ? fmtKm(n.valor) : n.valor.toLocaleString('pt-BR')}</div>
                <div style={{ fontSize: 12.5, color: '#777', marginTop: 6 }}>{n.label}{clicavel && <span style={{ color: COR, fontWeight: 700 }}> ›</span>}</div>
              </div>
            );
          })}
        </div>
      )}

      {detalhe === 'km' && <KmDrilldown corridas={corridas} ehProva={ehProva} onClose={() => setDetalhe(null)} />}

      {det && detalhe !== 'km' && (
        <div style={{ marginTop: 14, background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#222', textTransform: 'capitalize' }}>{det.label}</span>
            <span onClick={() => setDetalhe(null)} style={{ cursor: 'pointer', color: '#bbb', fontSize: 18 }}>×</span>
          </div>
          {det.itens.map((it, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid #f4f4f4' }}>
              <span style={{ fontSize: 12, color: COR, fontWeight: 700, width: 42, flexShrink: 0 }}>{fmtDM(it.data)}</span>
              <span style={{ flex: 1, fontSize: 14, color: '#222' }}>{it.titulo}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 11, color: COR, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 700, margin: '26px 0 10px' }}>retrospectivas</div>
      <div style={{ display: 'grid', gridTemplateColumns: isWide ? 'repeat(auto-fill, minmax(170px, 1fr))' : '1fr 1fr', gap: 12 }}>
        {CARDS.map(c => (
          <button key={c.id} onClick={() => onOpen(c.id)} style={{ background: c.cor + '12', border: '1px solid ' + c.cor + '33', borderRadius: 16, padding: '18px 16px', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: 24, height: 4, background: c.cor, borderRadius: 4, marginBottom: 12 }} />
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#222', fontWeight: 700, lineHeight: 1.2 }}>{c.label}</div>
            <div style={{ fontSize: 11.5, color: '#999', marginTop: 3 }}>{c.pronto ? c.desc : 'em breve'}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Drill-down do "km corridos": tudo que correu (prova + treino), por data ou por mês (evolução).
function KmDrilldown({ corridas, ehProva, onClose }) {
  const [modo, setModo] = useState('data');
  const total = Math.round(corridas.reduce((a, x) => a + (Number(x.distancia) || 0), 0) * 10) / 10;
  const porMes = {};
  corridas.forEach(x => { const mm = (x.data || '').slice(0, 7); if (!mm) return; porMes[mm] = (porMes[mm] || 0) + (Number(x.distancia) || 0); });
  const mesesAsc = Object.keys(porMes).sort();
  const maxMes = Math.max(1, ...mesesAsc.map(m => porMes[m]));
  const tabBtn = (id, txt) => (
    <button onClick={() => setModo(id)} style={{ padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid ' + (modo === id ? '#ef6c4d' : '#e2e2e2'), background: modo === id ? '#ef6c4d18' : '#fff', color: modo === id ? '#b33d20' : '#999' }}>{txt}</button>
  );
  return (
    <div style={{ marginTop: 14, background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#222' }}>{fmtKm(total)} km corridos</span>
        <span onClick={onClose} style={{ cursor: 'pointer', color: '#bbb', fontSize: 18 }}>×</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>{tabBtn('data', 'por data')}{tabBtn('mes', 'por mês')}</div>

      {modo === 'data' ? corridas.map((x, i) => (
        <div key={x.id || i} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '7px 0', borderBottom: '1px solid #f4f4f4' }}>
          <span style={{ fontSize: 12, color: COR_CORRIDA, fontWeight: 700, width: 42, flexShrink: 0 }}>{fmtDM(x.data)}</span>
          <span style={{ flex: 1, fontSize: 14, color: '#222' }}>{x.distancia ? fmtKm(x.distancia) + 'km' : '—'}{x.tempo ? ' · ' + fmtTempo(x.tempo) : ''}</span>
          <span style={{ fontSize: 10.5, color: ehProva(x) ? COR_CORRIDA : '#aaa', textTransform: 'uppercase', fontWeight: 700, flexShrink: 0 }}>{ehProva(x) ? 'prova' : 'treino'}</span>
        </div>
      )) : mesesAsc.map(mm => {
        const v = Math.round(porMes[mm] * 10) / 10;
        return (
          <div key={mm} style={{ padding: '7px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
              <span style={{ color: '#555', textTransform: 'capitalize' }}>{MESES[+mm.slice(5, 7) - 1]}</span>
              <span style={{ color: COR_CORRIDA, fontWeight: 700 }}>{fmtKm(v)} km</span>
            </div>
            <div style={{ height: 6, background: '#f0f0f0', borderRadius: 4 }}>
              <div style={{ width: (v / maxMes * 100) + '%', height: '100%', background: COR_CORRIDA, borderRadius: 4 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Gráfico de barras empilhadas: 1 barra por mês, cada faixa = uma compra (valor em R$).
// Altura da barra = total do mês (evolução); nº embaixo = quantidade de compras no mês.
const COR_COMPRAS = '#ff8a3d';
function ComprasChart({ meses }) {
  const [sel, setSel] = useState(null);
  if (!meses.length) return null;
  const max = Math.max(...meses.map(m => m.total), 1);
  const H = 160, barW = 26, gap = 16, padBot = 24, padTop = 6;
  const chartH = H - padBot - padTop;
  const W = Math.max(meses.length * (barW + gap) + gap, 1);
  const PALETTE = ['#ff8a3d', '#5b8def', '#2bb673', '#c77dff', '#ef6c4d', '#26c6da', '#f0a35e', '#c2548f', '#6b7a99', '#d4a72c'];
  const fmtR = (v) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
      <div style={{ fontSize: 11, color: '#7a3d12', letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>valor por mês <span style={{ color: '#bbb', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· cada faixa = uma compra</span></div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {meses.map((m, mi) => {
          const x = gap + mi * (barW + gap);
          let yAcc = H - padBot;
          return (
            <g key={m.mm}>
              {m.itens.map((it, ii) => {
                const h = (it.vnum / max) * chartH;
                yAcc -= h;
                const ativo = sel && sel.mm === m.mm && sel.ii === ii;
                return <rect key={ii} x={x} y={yAcc} width={barW} height={Math.max(h, 0.6)} fill={PALETTE[ii % PALETTE.length]} stroke={ativo ? '#111' : '#fff'} strokeWidth={ativo ? 1.4 : 0.5} style={{ cursor: 'pointer' }} onClick={() => setSel({ mm: m.mm, ii, titulo: it.titulo, vnum: it.vnum, label: m.label })} />;
              })}
              <text x={x + barW / 2} y={H - 13} textAnchor="middle" fontSize="8.5" fill="#999">{m.label}</text>
              <text x={x + barW / 2} y={H - 3} textAnchor="middle" fontSize="8" fill="#c79a7a" fontWeight="700">{m.itens.length}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ fontSize: 12, color: sel ? '#333' : '#bbb', marginTop: 6, minHeight: 18 }}>
        {sel ? <><b>{sel.titulo}</b> · {fmtR(sel.vnum)} <span style={{ color: '#aaa' }}>({sel.label})</span></> : 'toque numa faixa para ver a compra'}
      </div>
    </div>
  );
}

// ---- Card: Compras — histórico próprio (+ o que foi marcado como comprado nas listas) ----
function ComprasRetro({ onBack, isWide }) {
  const life = useLife();
  const [form, setForm] = useState(null); // { editing? }
  const valorTxt = (v, m) => v ? simboloMoeda(m) + ' ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';

  // Fonte única: registro próprio (comprasFeitas) — marcado manualmente aqui.
  // (As listas de compras NÃO alimentam mais esta retrospectiva, por decisão da Mari.)
  const todas = (life.comprasFeitas || []).map(c => ({ id: c.id, titulo: c.titulo, data: c.data, sub: c.categoria, vtxt: valorTxt(c.valor, c.moeda), moeda: c.moeda || 'BRL', vnum: Number(c.valor) || 0, editavel: true, raw: c }));
  const { anos, anoSel, setAnoSel } = useAnoSel(todas.map(i => i.data));
  const doAno = todas.filter(i => (i.data || '').slice(0, 4) === anoSel); // só compras do ano selecionado

  const meses = [...new Set(doAno.map(i => (i.data || '').slice(0, 7)).filter(Boolean))].sort().reverse();
  const ordDia = (a, b) => (b.data || '').localeCompare(a.data || '');
  const grupos = meses.map(mm => ({ mm, itens: doAno.filter(i => (i.data || '').slice(0, 7) === mm).sort(ordDia) }));
  const semData = todas.filter(i => !i.data); // compras sem data: aparecem em qualquer ano
  // dados do gráfico: meses em ordem cronológica, só compras em R$ com valor (faixas maiores embaixo).
  const mesesChart = [...grupos].reverse().map(g => {
    const itens = g.itens.filter(i => i.moeda === 'BRL' && i.vnum > 0).map(i => ({ titulo: i.titulo, vnum: i.vnum })).sort((a, b) => b.vnum - a.vnum);
    return { mm: g.mm, label: MESES[+g.mm.slice(5, 7) - 1].slice(0, 3), itens, total: itens.reduce((a, i) => a + i.vnum, 0) };
  }).filter(m => m.total > 0);

  const linhaItem = (it) => (
    <div key={it.id} onClick={it.editavel ? () => setForm({ editing: it.raw }) : undefined} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '9px 0', borderBottom: '1px solid #f3f3f3', cursor: it.editavel ? 'pointer' : 'default' }}>
      <span style={{ flex: 1, fontSize: 14, color: '#222' }}>{it.titulo}</span>
      <span style={{ fontSize: 11.5, color: '#aaa', flexShrink: 0 }}>{[it.sub, it.vtxt].filter(Boolean).join(' · ')}</span>
    </div>
  );

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Retrospectiva</button>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: 36, height: 4, background: '#ff8a3d', borderRadius: 4, marginBottom: 12 }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Compras</h2>
          <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>seu histórico de compras feitas</p>
        </div>
        <button onClick={() => setForm({})} title="registrar compra" style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>+</button>
      </div>

      {todas.length === 0 ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Nada por aqui ainda. Toque no + para registrar uma compra que você fez.</p>
      ) : <>
        <AnoChips anos={anos} anoSel={anoSel} setAnoSel={setAnoSel} cor="#ff8a3d" />
        <div style={{ marginBottom: 18 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: '#111' }}>{doAno.length}</span>
          <span style={{ fontSize: 13, color: '#999' }}> {doAno.length === 1 ? 'compra' : 'compras'} em {anoSel}</span>
        </div>
        {mesesChart.length > 0 && <ComprasChart meses={mesesChart} />}
        {grupos.length === 0 && semData.length === 0 && <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '10px 0' }}>Nada registrado em {anoSel}.</p>}
        {grupos.map(g => {
          const totalBRL = g.itens.filter(i => i.moeda === 'BRL').reduce((a, i) => a + i.vnum, 0);
          return (
            <div key={g.mm} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: '#7a3d12', letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: 700 }}>{fmtMesAno(g.mm)}</span>
                {totalBRL > 0 && <span style={{ fontSize: 12, color: '#7a3d12', fontWeight: 700 }}>R$ {totalBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
              </div>
              {g.itens.map(linhaItem)}
            </div>
          );
        })}
        {semData.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>sem data</div>
            {semData.map(linhaItem)}
          </div>
        )}
      </>}

      {form && <CompraFeitaForm editing={form.editing} onClose={() => setForm(null)} />}
    </div>
  );
}

function CompraFeitaForm({ editing, onClose }) {
  const life = useLife();
  const [titulo, setTitulo] = useState(editing?.titulo || '');
  const [data, setData] = useState(editing?.data || '');
  const [moeda, setMoeda] = useState(editing?.moeda || 'BRL');
  const [valor, setValor] = useState(editing?.valor != null ? String(editing.valor) : '');
  const [categoria, setCategoria] = useState(editing?.categoria || '');
  const cats = [...new Set((life.comprasFeitas || []).map(c => c.categoria).filter(Boolean))];
  const podeSalvar = titulo.trim().length > 0;
  const salvar = () => {
    if (!podeSalvar) return;
    life.saveCompraFeita({ id: editing?.id, titulo: titulo.trim(), data: data || undefined, moeda, valor: valor ? Number(valor.replace(',', '.')) : undefined, categoria: categoria.trim() || undefined });
    onClose();
  };
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar' : 'Registrar'} compra</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>
        <label style={labelStyle}>O quê</label>
        <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="ex.: Tênis Asics Novablast" style={inputStyle} />
        <label style={labelStyle}>Quando (opcional)</label>
        <input type="date" value={data} onChange={e => setData(e.target.value)} style={inputStyle} />
        <label style={labelStyle}>Quanto (opcional)</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={moeda} onChange={e => setMoeda(e.target.value)} style={{ ...inputStyle, width: 92, flexShrink: 0 }}>
            {MOEDAS.map(m => <option key={m.id} value={m.id}>{m.simbolo}</option>)}
          </select>
          <input type="text" inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)} placeholder="ex.: 600" style={inputStyle} />
        </div>
        <label style={labelStyle}>Categoria (opcional)</label>
        <input list="cf-cats" value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="ex.: roupa, casa, maquiagem…" style={inputStyle} />
        <datalist id="cf-cats">{cats.map(c => <option key={c} value={c} />)}</datalist>
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          {editing && <button onClick={() => { life.deleteCompraFeita(editing.id); onClose(); }} style={{ padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apagar</button>}
          <button onClick={salvar} disabled={!podeSalvar} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: 'none', background: podeSalvar ? '#111' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: podeSalvar ? 'pointer' : 'default' }}>{editing ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  );
}

// ---- Card: Música (Spotify por mês) ----
const COR_MUSICA = '#1db954';
function MusicaRetro({ onBack, isWide }) {
  const life = useLife();
  const [form, setForm] = useState(null);
  const todasMeses = life.musica || [];
  const { anos, anoSel, setAnoSel } = useAnoSel(todasMeses.map(m => m.mes));
  const meses = todasMeses.filter(m => (m.mes || '').slice(0, 4) === anoSel).sort((a, b) => (b.mes || '').localeCompare(a.mes || ''));
  const totalMin = meses.reduce((a, m) => a + (Number(m.minutos) || 0), 0);
  const fmtMin = (n) => Number(n || 0).toLocaleString('pt-BR');
  const horas = (n) => Math.round((Number(n) || 0) / 60);
  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Retrospectiva</button>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: 36, height: 4, background: COR_MUSICA, borderRadius: 4, marginBottom: 12 }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Música</h2>
          <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>minutos, artistas e músicas do seu ano</p>
        </div>
        <button onClick={() => setForm({})} title="adicionar mês" style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>+</button>
      </div>

      {todasMeses.length === 0 ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Nada por aqui ainda. Toque no + e cadastre o print do Spotify do mês (minutos, top artista e top música).</p>
      ) : <>
        <AnoChips anos={anos} anoSel={anoSel} setAnoSel={setAnoSel} cor={COR_MUSICA} />
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: '#111' }}>{fmtMin(totalMin)}</span>
          <span style={{ fontSize: 13, color: '#999' }}> minutos em {anoSel} · ~{horas(totalMin)}h</span>
        </div>
        {meses.length === 0 && <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '10px 0' }}>Nada registrado em {anoSel}.</p>}
        {meses.map(m => (
          <div key={m.id} onClick={() => setForm({ editing: m })} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 16px', marginBottom: 10, cursor: 'pointer' }}>
            <div style={{ fontSize: 11, color: COR_MUSICA, letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>{fmtMesAno(m.mes)}</div>
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#111' }}>{fmtMin(m.minutos)}</span>
              <span style={{ fontSize: 12.5, color: '#999' }}> min · ~{horas(m.minutos)}h</span>
            </div>
            <div style={{ fontSize: 13.5, color: '#333' }}>🎤 {m.artista || '—'}</div>
            <div style={{ fontSize: 13.5, color: '#333', marginTop: 2 }}>🎵 {m.musica || '—'}</div>
          </div>
        ))}
      </>}

      {form && <MusicaForm editing={form.editing} onClose={() => setForm(null)} />}
    </div>
  );
}

function MusicaForm({ editing, onClose }) {
  const life = useLife();
  const [mes, setMes] = useState(editing?.mes || '');
  const [minutos, setMinutos] = useState(editing?.minutos != null ? String(editing.minutos) : '');
  const [artista, setArtista] = useState(editing?.artista || '');
  const [musica, setMusica] = useState(editing?.musica || '');
  const podeSalvar = !!mes;
  const salvar = () => {
    if (!podeSalvar) return;
    life.saveMusica({ id: editing?.id, mes, minutos: minutos ? Number(minutos.replace(/\D/g, '')) : undefined, artista: artista.trim() || undefined, musica: musica.trim() || undefined });
    onClose();
  };
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar' : 'Novo'} mês</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>
        <label style={labelStyle}>Mês</label>
        <input type="month" value={mes} onChange={e => setMes(e.target.value)} style={inputStyle} />
        <label style={labelStyle}>Minutos ouvidos</label>
        <input type="text" inputMode="numeric" value={minutos} onChange={e => setMinutos(e.target.value)} placeholder="ex.: 1958" style={inputStyle} />
        <label style={labelStyle}>Top artista</label>
        <input value={artista} onChange={e => setArtista(e.target.value)} placeholder="ex.: Taylor Swift" style={inputStyle} />
        <label style={labelStyle}>Top música</label>
        <input value={musica} onChange={e => setMusica(e.target.value)} placeholder="ex.: Reliquia" style={inputStyle} />
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          {editing && <button onClick={() => { life.deleteMusica(editing.id); onClose(); }} style={{ padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apagar</button>}
          <button onClick={salvar} disabled={!podeSalvar} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: 'none', background: podeSalvar ? '#111' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: podeSalvar ? 'pointer' : 'default' }}>{editing ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  );
}

// ---- Card: Corridas (provas — meta × executado, pace e evolução) ----
const COR_CORRIDA = '#ef6c4d';
// Mini-gráfico de evolução do pace (mais rápido = mais alto). pts em ordem cronológica.
function PaceChart({ pts }) {
  if (pts.length < 2) return null;
  const W = 320, H = 110, pad = 16;
  const paces = pts.map(p => p.pace);
  const min = Math.min(...paces), max = Math.max(...paces);
  const range = (max - min) || 1;
  const x = (i) => pad + (W - 2 * pad) * (i / (pts.length - 1));
  const y = (p) => pad + (H - 2 * pad) * ((p - min) / range); // pace menor (mais rápido) no topo
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.pace).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <path d={d} fill="none" stroke={COR_CORRIDA} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.pace)} r="3.5" fill={COR_CORRIDA} />)}
    </svg>
  );
}

function CorridasRetro({ onBack, isWide }) {
  const cal = useCalendar();
  const hoje = new Date();
  const hk = `${hoje.getFullYear()}-${pad2(hoje.getMonth() + 1)}-${pad2(hoje.getDate())}`;
  const todasProvas = (cal.data.exercicios || [])
    .filter(x => x.subtipo === 'corrida_prova' || x.subtipo === 'corrida')
    .filter(x => (x.data || '') <= hk)
    .map(x => {
      const km = Number(x.distancia) || 0;
      const pReal = paceSecs(x.tempo, km);
      const pMeta = paceSecs(x.metaTempo, km);
      const nome = x.titulo || EXERCICIO_BY_ID[x.subtipo]?.label || 'Corrida';
      return { ...x, km, pReal, pMeta, nome };
    })
    .sort((a, b) => (b.data || '').localeCompare(a.data || ''));
  const { anos, anoSel, setAnoSel } = useAnoSel(todasProvas.map(p => p.data));
  const provas = todasProvas.filter(p => (p.data || '').slice(0, 4) === anoSel);

  const comTempo = provas.filter(p => p.tempo);
  const totalKm = Math.round(provas.reduce((a, p) => a + p.km, 0) * 10) / 10;
  const melhorPace = comTempo.map(p => p.pReal).filter(Boolean).length ? Math.min(...comTempo.map(p => p.pReal).filter(Boolean)) : null;
  const evo = comTempo.filter(p => p.pReal).slice().sort((a, b) => (a.data || '').localeCompare(b.data || '')).map(p => ({ pace: p.pReal }));

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Retrospectiva</button>
      <div style={{ width: 36, height: 4, background: COR_CORRIDA, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Corridas</h2>
      <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>suas provas: meta × executado e evolução do pace</p>

      {todasProvas.length === 0 ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Nenhuma prova ainda. Marque uma "Corrida prova" no Calendário com distância, tempo real e meta de tempo.</p>
      ) : <>
        <AnoChips anos={anos} anoSel={anoSel} setAnoSel={setAnoSel} cor={COR_CORRIDA} />
        {provas.length === 0 && <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '10px 0' }}>Nenhuma prova em {anoSel}.</p>}
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 18 }}>
          <div><span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#111' }}>{provas.length}</span><span style={{ fontSize: 12.5, color: '#999' }}> {provas.length === 1 ? 'prova' : 'provas'}</span></div>
          <div><span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#111' }}>{fmtKm(totalKm)}</span><span style={{ fontSize: 12.5, color: '#999' }}> km</span></div>
          {melhorPace && <div><span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: COR_CORRIDA }}>{fmtPace(melhorPace)}</span><span style={{ fontSize: 12.5, color: '#999' }}> melhor pace</span></div>}
        </div>

        {evo.length >= 2 && (
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: COR_CORRIDA, letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>evolução do pace (mais alto = mais rápido)</div>
            <PaceChart pts={evo} />
          </div>
        )}

        {provas.map(p => {
          const delta = (p.tempo && p.metaTempo) ? p.tempo - p.metaTempo : null;
          const bateu = delta != null && delta <= 0;
          return (
            <div key={p.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#222' }}>{p.nome}</span>
                <span style={{ fontSize: 11.5, color: '#aaa', flexShrink: 0 }}>{p.data ? fmtDM(p.data) : '—'}{p.km ? ` · ${fmtKm(p.km)}km` : ''}</span>
              </div>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13 }}>
                {p.tempo && <span style={{ color: '#333' }}>tempo <b>{fmtTempo(p.tempo)}</b>{p.pReal && <span style={{ color: '#999' }}> · {fmtPace(p.pReal)}</span>}</span>}
                {p.metaTempo && <span style={{ color: '#999' }}>meta {fmtTempo(p.metaTempo)}{p.pMeta && ` · ${fmtPace(p.pMeta)}`}</span>}
              </div>
              {delta != null && (
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: bateu ? '#2bb673' : '#d05050' }}>
                  {bateu ? `✓ bateu a meta por ${fmtTempo(-delta)}` : `${fmtTempo(delta)} acima da meta`}
                </div>
              )}
            </div>
          );
        })}
      </>}
    </div>
  );
}

// ---- Card: Dias importantes (marcos de vida) ----
const COR_DIAS = '#7a6ff0';
function DiasRetro({ onBack, isWide }) {
  const life = useLife();
  const [form, setForm] = useState(null);
  const todos = life.marcos || [];
  const { anos, anoSel, setAnoSel } = useAnoSel(todos.map(m => m.data));
  const doAno = todos.filter(m => (m.data || '').slice(0, 4) === anoSel).sort((a, b) => (a.data || '').localeCompare(b.data || '')); // cronológico (mais antigo primeiro)

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Retrospectiva</button>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: 36, height: 4, background: COR_DIAS, borderRadius: 4, marginBottom: 12 }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Dias importantes</h2>
          <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>os marcos que mudaram o seu ano</p>
        </div>
        <button onClick={() => setForm({})} title="registrar dia importante" style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>+</button>
      </div>

      {todos.length === 0 ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Nada por aqui ainda. Toque no + para registrar um dia importante.</p>
      ) : <>
        <AnoChips anos={anos} anoSel={anoSel} setAnoSel={setAnoSel} cor={COR_DIAS} />
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: '#111' }}>{doAno.length}</span>
          <span style={{ fontSize: 13, color: '#999' }}> {doAno.length === 1 ? 'dia' : 'dias'} em {anoSel}</span>
        </div>
        {doAno.length === 0 && <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '10px 0' }}>Nada registrado em {anoSel}.</p>}
        <div style={{ borderLeft: '2px solid ' + COR_DIAS + '33', marginLeft: 5, paddingLeft: 16 }}>
          {doAno.map(m => (
            <div key={m.id} onClick={() => setForm({ editing: m })} style={{ position: 'relative', padding: '8px 0 12px', cursor: 'pointer' }}>
              <span style={{ position: 'absolute', left: -23, top: 12, width: 9, height: 9, borderRadius: '50%', background: COR_DIAS, border: '2px solid #fafafa' }} />
              <div style={{ fontSize: 11, color: COR_DIAS, fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase', marginBottom: 2 }}>{fmtDiaMes(m.data)}</div>
              <div style={{ fontSize: 14, color: '#222', lineHeight: 1.45 }}>{m.titulo}</div>
            </div>
          ))}
        </div>
      </>}

      {form && <DiasForm editing={form.editing} onClose={() => setForm(null)} />}
    </div>
  );
}

function DiasForm({ editing, onClose }) {
  const life = useLife();
  const [data, setData] = useState(editing?.data || '');
  const [titulo, setTitulo] = useState(editing?.titulo || '');
  const podeSalvar = data && titulo.trim().length > 0;
  const salvar = () => {
    if (!podeSalvar) return;
    life.saveMarco({ id: editing?.id, data, titulo: titulo.trim() });
    onClose();
  };
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar' : 'Novo'} dia importante</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>
        <label style={labelStyle}>Quando</label>
        <input type="date" value={data} onChange={e => setData(e.target.value)} style={inputStyle} />
        <label style={labelStyle}>O que aconteceu</label>
        <textarea value={titulo} onChange={e => setTitulo(e.target.value)} rows={2} placeholder="ex.: Fiz minha primeira corrida de rua" style={{ ...inputStyle, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          {editing && <button onClick={() => { life.deleteMarco(editing.id); onClose(); }} style={{ padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apagar</button>}
          <button onClick={salvar} disabled={!podeSalvar} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: 'none', background: podeSalvar ? '#111' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: podeSalvar ? 'pointer' : 'default' }}>{editing ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  );
}

function EmBreve({ card, onBack }) {
  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: 620, margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Retrospectiva</button>
      <div style={{ width: 36, height: 4, background: card.cor, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 10px' }}>{card.label}</h2>
      <div style={{ marginTop: 18, padding: 24, borderRadius: 16, background: card.cor + '12', border: '1px dashed ' + card.cor + '55', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 16, color: '#555', margin: 0 }}>Em breve.</p>
        <p style={{ fontSize: 13, color: '#999', marginTop: 8, lineHeight: 1.6 }}>Vamos construir esta retrospectiva juntas.</p>
      </div>
    </div>
  );
}
