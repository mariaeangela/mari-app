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
  { id: 'gastos', label: 'Gastos', desc: 'pra onde foi o dinheiro', cor: '#6b7a99', pronto: true },
  { id: 'quem', label: 'Quem você viu', desc: 'as pessoas do seu ano', cor: '#ff5d8f' },
  { id: 'viagens', label: 'Viagens', desc: 'pra onde você foi', cor: '#19b3a6', pronto: true },
  { id: 'musica', label: 'Música', desc: 'o que tocou no seu ano', cor: '#1db954', pronto: true },
  { id: 'leituras', label: 'Leituras', desc: 'os livros do seu ano', cor: '#7a5c9e', pronto: true },
  { id: 'saude', label: 'Saúde', desc: 'terapia, consultas', cor: '#d96459' },
  { id: 'corridas', label: 'Corridas', desc: 'suas provas e pace', cor: '#ef6c4d', pronto: true },
  { id: 'amorosa', label: 'Amorosa', desc: 'dates, beijos e afins', cor: '#c2548f', pronto: true },
];

export default function RetrospectivaPage({ isWide, secInicial, onConsumeSec }) {
  const [sec, setSec] = useState(secInicial || null);
  useEffect(() => { if (secInicial) { setSec(secInicial); onConsumeSec && onConsumeSec(); } }, [secInicial]);
  const baseSec = (sec || '').split(':')[0];          // 'gastos:Saúde' → 'gastos'
  const catInicial = (sec || '').split(':').slice(1).join(':') || null; // → 'Saúde'
  if (baseSec === 'gastos') return <GastosRetro onBack={() => setSec(null)} isWide={isWide} catInicial={catInicial} />;
  if (baseSec === 'musica') return <MusicaRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec === 'leituras') return <LeiturasRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec === 'corridas') return <CorridasRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec === 'dias') return <DiasRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec === 'viagens') return <ViagensRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec === 'amorosa') return <AmorosaRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec) return <EmBreve card={CARDS.find(c => c.id === baseSec)} onBack={() => setSec(null)} />;
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
      {detalhe === 'treino' && det && <TreinoDrilldown itens={det.itens} onClose={() => setDetalhe(null)} />}

      {det && detalhe !== 'km' && detalhe !== 'treino' && (
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

// Drill-down de "treinos": barras horizontais com a contagem por tipo; clicar abre as datas.
function TreinoDrilldown({ itens, onClose }) {
  const [aberto, setAberto] = useState(null);
  const grupos = {};
  itens.forEach(it => { (grupos[it.titulo] = grupos[it.titulo] || []).push(it); });
  const linhas = Object.entries(grupos).map(([label, arr]) => ({ label, arr, n: arr.length })).sort((a, b) => b.n - a.n);
  const max = Math.max(...linhas.map(l => l.n), 1);
  return (
    <div style={{ marginTop: 14, background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#222' }}>Treinos</span>
        <span onClick={onClose} style={{ cursor: 'pointer', color: '#bbb', fontSize: 18 }}>×</span>
      </div>
      {linhas.map(l => {
        const ativo = aberto === l.label;
        return (
          <div key={l.label} style={{ marginBottom: 8 }}>
            <div onClick={() => setAberto(ativo ? null : l.label)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3, fontSize: 13 }}>
                <span style={{ color: '#333', fontWeight: 600 }}>{l.label}{ativo && <span style={{ color: COR, fontWeight: 700 }}> ▾</span>}</span>
                <span style={{ color: COR, fontWeight: 700 }}>{l.n}x</span>
              </div>
              <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4 }}>
                <div style={{ width: (l.n / max * 100) + '%', height: '100%', background: COR, borderRadius: 4 }} />
              </div>
            </div>
            {ativo && (
              <div style={{ marginTop: 6, paddingLeft: 2 }}>
                {[...l.arr].sort((a, b) => (b.data || '').localeCompare(a.data || '')).map((it, i) => (
                  <div key={i} style={{ fontSize: 12.5, color: COR, fontWeight: 700, padding: '3px 0' }}>{fmtDM(it.data)}</div>
                ))}
              </div>
            )}
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
function ComprasRetro({ onBack, isWide, backLabel = 'Retrospectiva' }) {
  const life = useLife();
  const [form, setForm] = useState(null); // { editing? }
  const [verCaras, setVerCaras] = useState(false);
  const valorTxt = (v, m) => v ? simboloMoeda(m) + ' ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';

  // Fonte única: registro próprio (comprasFeitas) — marcado manualmente aqui.
  // (As listas de compras NÃO alimentam mais esta retrospectiva, por decisão da Mari.)
  const todas = (life.comprasFeitas || []).map(c => ({ id: c.id, titulo: c.titulo, data: c.data, sub: c.categoria, vtxt: valorTxt(c.valor, c.moeda), moeda: c.moeda || 'BRL', vnum: Number(c.valor) || 0, editavel: true, raw: c }));
  const { anos, anoSel, setAnoSel } = useAnoSel(todas.map(i => i.data));
  if (verCaras) return <CoisasCarasView onBack={() => setVerCaras(false)} isWide={isWide} />; // depois de todos os hooks
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
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; {backLabel}</button>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: 36, height: 4, background: '#ff8a3d', borderRadius: 4, marginBottom: 12 }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Compras</h2>
          <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>seu histórico de compras feitas</p>
        </div>
        <button onClick={() => setForm({})} title="registrar compra" style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>+</button>
      </div>

      <button onClick={() => setVerCaras(true)} style={{ width: '100%', marginBottom: 16, padding: '11px 0', borderRadius: 11, border: '1px solid #ff8a3d55', background: '#fff8f2', color: '#7a3d12', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>🏷️ Coisas caras — quando comprei e quanto duram ›</button>

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

// ---- Coisas caras: quando comprei e quanto duram (semestre = ano + half 1|2) ----
const halfLabel = (h) => (h === 2 ? '2º sem.' : '1º sem.');
const halfStartMonth = (h) => (h === 2 ? 6 : 0);
function fmtDuracao(meses) {
  const a = Math.floor(meses / 12), m = meses % 12;
  if (a <= 0) return `${m} ${m === 1 ? 'mês' : 'meses'}`;
  if (m === 0) return `${a} ${a === 1 ? 'ano' : 'anos'}`;
  return `${a} ${a === 1 ? 'ano' : 'anos'} e ${m} ${m === 1 ? 'mês' : 'meses'}`;
}
function CoisasCarasView({ onBack, isWide }) {
  const life = useLife();
  const [form, setForm] = useState(null);
  const hoje = new Date();
  const nowMonths = hoje.getFullYear() * 12 + hoje.getMonth();
  const itens = [...(life.coisasCaras || [])].sort((a, b) => (b.ano * 12 + halfStartMonth(b.half)) - (a.ano * 12 + halfStartMonth(a.half)));
  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Compras</button>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: 36, height: 4, background: '#ff8a3d', borderRadius: 4, marginBottom: 12 }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Coisas caras</h2>
          <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>quando comprei e quanto duram</p>
        </div>
        <button onClick={() => setForm({})} title="adicionar coisa cara" style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>+</button>
      </div>

      {itens.length === 0 ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Nada por aqui ainda. Toque no + para registrar uma coisa cara (ex.: notebook, celular).</p>
      ) : itens.map(c => {
        const startMonths = c.ano * 12 + halfStartMonth(c.half);
        const emUso = c.fimAno == null;
        const endMonths = emUso ? nowMonths : c.fimAno * 12 + halfStartMonth(c.fimHalf || 1);
        const dur = Math.max(0, endMonths - startMonths);
        return (
          <div key={c.id} onClick={() => setForm({ editing: c })} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '13px 15px', marginBottom: 8, cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#222' }}>{c.nome}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: emUso ? '#2bb673' : '#999', flexShrink: 0 }}>{emUso ? 'em uso há ' : 'durou '}{fmtDuracao(dur)}</span>
            </div>
            <div style={{ fontSize: 11.5, color: '#999', marginTop: 3 }}>comprei no {halfLabel(c.half)} de {c.ano}{!emUso ? ` · até ${halfLabel(c.fimHalf || 1)} de ${c.fimAno}` : ''}</div>
          </div>
        );
      })}

      {form && <CoisaCaraForm editing={form.editing} onClose={() => setForm(null)} />}
    </div>
  );
}

function CoisaCaraForm({ editing, onClose }) {
  const life = useLife();
  const [nome, setNome] = useState(editing?.nome || '');
  const [ano, setAno] = useState(editing?.ano != null ? String(editing.ano) : '');
  const [half, setHalf] = useState(editing?.half || 1);
  const [aindaUso, setAindaUso] = useState(editing ? editing.fimAno == null : true);
  const [fimAno, setFimAno] = useState(editing?.fimAno != null ? String(editing.fimAno) : '');
  const [fimHalf, setFimHalf] = useState(editing?.fimHalf || 1);
  const podeSalvar = nome.trim().length > 0 && ano;
  const salvar = () => {
    if (!podeSalvar) return;
    life.saveCoisaCara({ id: editing?.id, nome: nome.trim(), ano: Number(ano), half: Number(half),
      fimAno: aindaUso || !fimAno ? undefined : Number(fimAno), fimHalf: aindaUso || !fimAno ? undefined : Number(fimHalf) });
    onClose();
  };
  const semSel = (v, set) => (
    <select value={v} onChange={e => set(Number(e.target.value))} style={{ ...inputStyle, width: 130, flexShrink: 0 }}>
      <option value={1}>1º semestre</option><option value={2}>2º semestre</option>
    </select>
  );
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar' : 'Nova'} coisa cara</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>
        <label style={labelStyle}>O quê</label>
        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="ex.: Notebook" style={inputStyle} />
        <label style={labelStyle}>Comprei em</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="number" inputMode="numeric" value={ano} onChange={e => setAno(e.target.value)} placeholder="ano" style={inputStyle} />
          {semSel(half, setHalf)}
        </div>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'none', letterSpacing: 0, fontSize: 13, color: '#444', cursor: 'pointer' }}>
          <input type="checkbox" checked={aindaUso} onChange={e => setAindaUso(e.target.checked)} /> Ainda uso
        </label>
        {!aindaUso && (
          <>
            <label style={labelStyle}>Parei de usar em</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" inputMode="numeric" value={fimAno} onChange={e => setFimAno(e.target.value)} placeholder="ano" style={inputStyle} />
              {semSel(fimHalf, setFimHalf)}
            </div>
          </>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          {editing && <button onClick={() => { life.deleteCoisaCara(editing.id); onClose(); }} style={{ padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apagar</button>}
          <button onClick={salvar} disabled={!podeSalvar} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: 'none', background: podeSalvar ? '#111' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: podeSalvar ? 'pointer' : 'default' }}>{editing ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
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
// Visão em gráfico: barras de minutos por mês + ranking de artistas/músicas do ano.
function MusicaGrafico({ meses, fmtMin, horas }) {
  const [sel, setSel] = useState(null);
  const cron = meses.slice().sort((a, b) => (a.mes || '').localeCompare(b.mes || ''));
  const maxMin = Math.max(1, ...cron.map(m => Number(m.minutos) || 0));
  const rank = (campo) => {
    const map = {};
    cron.forEach(m => { const v = (m[campo] || '').trim(); if (v) map[v] = (map[v] || 0) + 1; });
    return Object.entries(map).map(([nome, n]) => ({ nome, n })).sort((a, b) => b.n - a.n);
  };
  const artistas = rank('artista'), musicas = rank('musica');
  const maxN = Math.max(1, ...artistas.map(a => a.n), ...musicas.map(a => a.n));
  const ranking = (titulo, lista) => lista.length > 0 && (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: 11, color: COR_MUSICA, letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>{titulo}</div>
      {lista.map(item => (
        <div key={item.nome} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nome}</div>
            <div style={{ height: 6, background: COR_MUSICA + '22', borderRadius: 4, marginTop: 3 }}>
              <div style={{ width: (item.n / maxN * 100) + '%', height: '100%', background: COR_MUSICA, borderRadius: 4 }} />
            </div>
          </div>
          <span style={{ fontSize: 11.5, color: '#999', flexShrink: 0 }}>{item.n} {item.n > 1 ? 'meses' : 'mês'}</span>
        </div>
      ))}
    </div>
  );
  return (
    <div>
      <div style={{ fontSize: 11, color: COR_MUSICA, letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>minutos por mês</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 150 }}>
        {cron.map((m, i) => {
          const min = Number(m.minutos) || 0;
          const h = Math.max(2, Math.round((min / maxMin) * 116));
          const on = sel === i;
          return (
            <div key={m.id} onClick={() => setSel(on ? null : i)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', minWidth: 0 }}>
              <div style={{ fontSize: 9, color: '#777', height: 12, fontWeight: 700 }}>{on ? fmtMin(min) : ''}</div>
              <div style={{ width: '100%', maxWidth: 30, height: h, background: COR_MUSICA, borderRadius: '4px 4px 0 0', opacity: sel == null || on ? 1 : 0.4 }} />
              <div style={{ fontSize: 9, color: '#aaa', marginTop: 4 }}>{MESES[+(m.mes || '').slice(5, 7) - 1]?.slice(0, 3)}</div>
            </div>
          );
        })}
      </div>
      {sel != null && (
        <div style={{ fontSize: 12, color: '#777', marginTop: 8, textAlign: 'center' }}>
          {fmtMesAno(cron[sel].mes).replace(/^./, c => c.toUpperCase())}: {fmtMin(cron[sel].minutos)} min · ~{horas(cron[sel].minutos)}h
        </div>
      )}
      {ranking('artistas do ano', artistas)}
      {ranking('músicas do ano', musicas)}
    </div>
  );
}

function MusicaRetro({ onBack, isWide }) {
  const life = useLife();
  const [form, setForm] = useState(null);
  const [vis, setVis] = useState('lista');
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
        {meses.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {[['lista', 'Lista'], ['grafico', 'Gráfico']].map(([v, label]) => (
              <button key={v} onClick={() => setVis(v)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: '1px solid ' + (vis === v ? COR_MUSICA : '#e2e2e2'),
                background: vis === v ? COR_MUSICA + '1c' : '#fff', color: vis === v ? '#0a7d36' : '#888',
              }}>{label}</button>
            ))}
          </div>
        )}
        {meses.length > 0 && vis === 'grafico' && <MusicaGrafico meses={meses} fmtMin={fmtMin} horas={horas} />}
        {vis === 'lista' && meses.map(m => (
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

// ---- Card: Leituras (livros por ano · páginas · países/idiomas · gênero/tema) ----
const COR_LIVROS = '#7a5c9e';
const LIVRO_FLAG = {
  'Brasil': '🇧🇷', 'Estados Unidos': '🇺🇸', 'Reino Unido': '🇬🇧', 'Inglaterra': '🇬🇧', 'Irlanda': '🇮🇪',
  'França': '🇫🇷', 'Itália': '🇮🇹', 'Espanha': '🇪🇸', 'Portugal': '🇵🇹', 'Alemanha': '🇩🇪', 'Rússia': '🇷🇺',
  'Japão': '🇯🇵', 'Coreia do Sul': '🇰🇷', 'Hungria': '🇭🇺', 'Tchéquia': '🇨🇿', 'Polônia': '🇵🇱',
  'Bielorrússia': '🇧🇾', 'Grécia': '🇬🇷', 'Suíça': '🇨🇭', 'Canadá': '🇨🇦', 'México': '🇲🇽', 'Argentina': '🇦🇷',
  'Chile': '🇨🇱', 'Colômbia': '🇨🇴', 'Peru': '🇵🇪', 'Bolívia': '🇧🇴', 'Paquistão': '🇵🇰', 'Israel': '🇮🇱', 'Austrália': '🇦🇺',
};
function LeiturasRetro({ onBack, isWide }) {
  const life = useLife();
  const lidos = (life.leituras || []).filter(l => l.lido && l.lidoEm && l.lidoEm.length);
  const anosNum = [...new Set(lidos.flatMap(l => l.lidoEm.filter(a => typeof a === 'number')))].sort((a, b) => b - a);
  const temAntes = lidos.some(l => l.lidoEm.includes('antes'));
  const opcoes = [...anosNum.map(String), ...(temAntes ? ['antes'] : [])];
  const anoAtual = String(new Date().getFullYear());
  const [selRaw, setSel] = useState(null);
  const sel = (selRaw && opcoes.includes(selRaw)) ? selRaw : (opcoes.includes(anoAtual) ? anoAtual : opcoes[0]);
  const doAno = sel === 'antes' ? lidos.filter(l => l.lidoEm.includes('antes')) : lidos.filter(l => l.lidoEm.includes(Number(sel)));
  const totalPaginas = doAno.reduce((s, l) => s + (Number(l.paginas) || 0), 0);
  const fmtN = (n) => Number(n || 0).toLocaleString('pt-BR');
  const porAno = {}; lidos.forEach(l => l.lidoEm.forEach(a => { if (typeof a === 'number') porAno[a] = (porAno[a] || 0) + 1; }));
  const anosCron = Object.keys(porAno).map(Number).sort((a, b) => a - b);
  const maxAno = Math.max(1, ...Object.values(porAno));
  const rank = (vals) => { const m = {}; vals.forEach(v => { if (v) m[v] = (m[v] || 0) + 1; }); return Object.entries(m).map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n); };
  const paises = rank(doAno.map(l => l.pais)), idiomas = rank(doAno.map(l => l.idioma)), generos = rank(doAno.map(l => l.tipo)), temas = rank(doAno.flatMap(l => l.temas || []));
  const maxRank = Math.max(1, ...paises.map(x => x.n), ...temas.map(x => x.n), ...generos.map(x => x.n));

  const ranking = (titulo, lista, fmtK = (k) => k, cap = false, limite = 6) => lista.length > 0 && (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: 11, color: COR_LIVROS, letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>{titulo}</div>
      {lista.slice(0, limite).map(item => (
        <div key={item.k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: cap ? 'capitalize' : 'none' }}>{fmtK(item.k)}</div>
            <div style={{ height: 6, background: COR_LIVROS + '22', borderRadius: 4, marginTop: 3 }}>
              <div style={{ width: (item.n / maxRank * 100) + '%', height: '100%', background: COR_LIVROS, borderRadius: 4 }} />
            </div>
          </div>
          <span style={{ fontSize: 11.5, color: '#999', flexShrink: 0 }}>{item.n}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Retrospectiva</button>
      <div style={{ width: 36, height: 4, background: COR_LIVROS, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Leituras</h2>
      <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>os livros que você leu, por ano</p>

      {lidos.length === 0 ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Nenhum livro com ano de leitura ainda. Marque "lido em ANO" nos livros (Explorar › Próximas leituras) que eles aparecem aqui.</p>
      ) : <>
        {anosCron.length > 1 && <>
          <div style={{ fontSize: 11, color: COR_LIVROS, letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>livros por ano</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 130, marginBottom: 18 }}>
            {anosCron.map(a => {
              const n = porAno[a], h = Math.max(3, Math.round((n / maxAno) * 100));
              return (
                <div key={a} onClick={() => setSel(String(a))} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: '#777', height: 13, fontWeight: 700 }}>{n}</div>
                  <div style={{ width: '100%', maxWidth: 34, height: h, background: COR_LIVROS, borderRadius: '4px 4px 0 0', opacity: String(a) === sel ? 1 : 0.45 }} />
                  <div style={{ fontSize: 9.5, color: '#aaa', marginTop: 4 }}>{a}</div>
                </div>
              );
            })}
          </div>
        </>}

        {opcoes.length > 1 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
            {opcoes.map(o => (
              <button key={o} onClick={() => setSel(o)} style={{
                whiteSpace: 'nowrap', padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                border: '1px solid ' + (sel === o ? COR_LIVROS : '#e2e2e2'), background: sel === o ? COR_LIVROS + '1c' : '#fff', color: sel === o ? '#4a3470' : '#999',
              }}>{o === 'antes' ? 'antes de 2013' : o}</button>
            ))}
          </div>
        )}
        <div style={{ marginBottom: 4 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: '#111' }}>{doAno.length}</span>
          <span style={{ fontSize: 13, color: '#999' }}> {doAno.length === 1 ? 'livro' : 'livros'} {sel === 'antes' ? (doAno.length === 1 ? 'lido' : 'lidos') + ' antes de 2013' : 'em ' + sel} · {fmtN(totalPaginas)} páginas</span>
        </div>

        {ranking('países', paises, (k) => `${LIVRO_FLAG[k] || '📖'}  ${k}`)}
        {ranking('idiomas', idiomas)}
        {ranking('gêneros', generos, (k) => k, true)}
        {ranking('temas', temas, (k) => k, true)}

        <div style={{ fontSize: 11, color: COR_LIVROS, letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: 700, margin: '22px 0 8px' }}>os livros</div>
        {doAno.slice().sort((a, b) => (a.titulo || '').localeCompare(b.titulo || '')).map(l => (
          <div key={l.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '10px 13px', marginBottom: 6 }}>
            <div style={{ fontSize: 14, color: '#222', fontWeight: 600 }}>{l.titulo}{(l.lidoEm || []).length > 1 ? <span style={{ fontSize: 11, color: COR_LIVROS, fontWeight: 700 }}>  (releitura)</span> : null}</div>
            <div style={{ fontSize: 11.5, color: '#999', marginTop: 2 }}>{[l.autor, l.pais, l.paginas ? l.paginas + ' p.' : null].filter(Boolean).join(' · ')}</div>
          </div>
        ))}
      </>}
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

// ---- Card: Viagens (timeline por ano + países com bandeiras) ----
const COR_VIAGENS = '#19b3a6';
const PAIS_FLAG = { 'Brasil': '🇧🇷', 'Espanha': '🇪🇸', 'França': '🇫🇷', 'Itália': '🇮🇹', 'Argentina': '🇦🇷', 'Bélgica': '🇧🇪', 'Portugal': '🇵🇹', 'Peru': '🇵🇪', 'Inglaterra': '🇬🇧', 'Tailândia': '🇹🇭', 'Catar': '🇶🇦', 'Hungria': '🇭🇺', 'República Checa': '🇨🇿' };
const flagOf = (p) => PAIS_FLAG[p] || '🌍';
const vAnoKey = (a) => (String(a) === 'jovem' ? '0000' : String(a));
const vAnoLabel = (a) => (String(a) === 'jovem' ? 'Jovem' : String(a));

function ViagensRetro({ onBack, isWide }) {
  const life = useLife();
  const [form, setForm] = useState(null);
  const viagens = life.viagens || [];
  const cidades = new Set();
  viagens.forEach(v => { const places = (v.locais && v.locais.length) ? v.locais : [v.titulo]; places.forEach(p => cidades.add(p)); });
  const paisesCount = {};
  viagens.forEach(v => (v.paises || []).forEach(p => { paisesCount[p] = (paisesCount[p] || 0) + 1; }));
  const paisesList = Object.entries(paisesCount).sort((a, b) => b[1] - a[1]);
  const porAno = {};
  viagens.forEach(v => { const k = String(v.ano); porAno[k] = (porAno[k] || 0) + 1; });
  const anosDesc = Object.keys(porAno).sort((a, b) => vAnoKey(b).localeCompare(vAnoKey(a)));
  const maxAno = Math.max(...Object.values(porAno), 1);

  const stat = (n, label) => (
    <div><span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#111' }}>{n}</span><span style={{ fontSize: 12.5, color: '#999' }}> {label}</span></div>
  );

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Retrospectiva</button>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: 36, height: 4, background: COR_VIAGENS, borderRadius: 4, marginBottom: 12 }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Viagens</h2>
          <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>para onde você foi</p>
        </div>
        <button onClick={() => setForm({})} title="adicionar viagem" style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>+</button>
      </div>

      {viagens.length === 0 ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Nada por aqui ainda. Toque no + para registrar uma viagem.</p>
      ) : <>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
          {stat(viagens.length, viagens.length === 1 ? 'viagem' : 'viagens')}
          {stat(cidades.size, 'cidades')}
          {stat(paisesList.length, paisesList.length === 1 ? 'país' : 'países')}
        </div>

        <div style={{ fontSize: 11, color: COR_VIAGENS, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>viagens por ano</div>
        <div style={{ marginBottom: 22 }}>
          {anosDesc.map(a => (
            <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
              <span style={{ fontSize: 11.5, color: '#888', fontWeight: 700, width: 42, flexShrink: 0, textAlign: 'right' }}>{vAnoLabel(a)}</span>
              <div style={{ flex: 1, height: 14, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: (porAno[a] / maxAno * 100) + '%', height: '100%', background: COR_VIAGENS, borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 12, color: COR_VIAGENS, fontWeight: 700, width: 20, flexShrink: 0 }}>{porAno[a]}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, color: COR_VIAGENS, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>países · {paisesList.length}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 24 }}>
          {paisesList.map(([nome, n]) => (
            <span key={nome} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 20, background: COR_VIAGENS + '12', border: '1px solid ' + COR_VIAGENS + '33', fontSize: 12.5, color: '#1a5a54', fontWeight: 600 }}>
              <span style={{ fontSize: 14 }}>{flagOf(nome)}</span>{nome}<span style={{ color: '#7fb8b2', fontWeight: 700 }}>{n}</span>
            </span>
          ))}
        </div>

        <div style={{ fontSize: 11, color: COR_VIAGENS, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>linha do tempo</div>
        {anosDesc.map(a => {
          const lista = viagens.filter(v => String(v.ano) === a);
          return (
            <div key={a} style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#222' }}>{vAnoLabel(a)}</span>
                <span style={{ fontSize: 11.5, color: '#bbb' }}>{lista.length} {lista.length === 1 ? 'viagem' : 'viagens'}</span>
              </div>
              <div style={{ borderLeft: '2px solid ' + COR_VIAGENS + '33', marginLeft: 4, paddingLeft: 16 }}>
                {lista.map(v => (
                  <div key={v.id} onClick={() => setForm({ editing: v })} style={{ position: 'relative', padding: '7px 0 10px', cursor: 'pointer' }}>
                    <span style={{ position: 'absolute', left: -23, top: 11, width: 9, height: 9, borderRadius: '50%', background: COR_VIAGENS, border: '2px solid #fafafa' }} />
                    <div style={{ fontSize: 14, color: '#222', fontWeight: 600 }}>{v.titulo} {(v.paises || []).map(flagOf).join('')}</div>
                    {v.locais && v.locais.length > 0 && <div style={{ fontSize: 11.5, color: '#999', marginTop: 2 }}>{v.locais.join(' · ')}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </>}

      {form && <ViagemForm editing={form.editing} onClose={() => setForm(null)} />}
    </div>
  );
}

function ViagemForm({ editing, onClose }) {
  const life = useLife();
  const [titulo, setTitulo] = useState(editing?.titulo || '');
  const [ano, setAno] = useState(editing?.ano != null ? String(editing.ano) : '');
  const [locais, setLocais] = useState((editing?.locais || []).join('\n'));
  const [paises, setPaises] = useState((editing?.paises || []).join(', '));
  const podeSalvar = titulo.trim().length > 0 && ano.trim().length > 0;
  const salvar = () => {
    if (!podeSalvar) return;
    life.saveViagem({ id: editing?.id, ano: ano.trim(), titulo: titulo.trim(),
      locais: locais.split('\n').map(s => s.trim()).filter(Boolean),
      paises: paises.split(',').map(s => s.trim()).filter(Boolean) });
    onClose();
  };
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar' : 'Nova'} viagem</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>
        <label style={labelStyle}>Destino</label>
        <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="ex.: Tailândia ou Paraty" style={inputStyle} />
        <label style={labelStyle}>Ano</label>
        <input value={ano} onChange={e => setAno(e.target.value)} placeholder="ex.: 2026 (ou jovem)" style={inputStyle} />
        <label style={labelStyle}>Cidades (opcional, uma por linha)</label>
        <textarea value={locais} onChange={e => setLocais(e.target.value)} rows={3} placeholder={'Bangkok\nChiang Mai\nKrabi'} style={{ ...inputStyle, resize: 'vertical' }} />
        <label style={labelStyle}>Países (separados por vírgula)</label>
        <input list="vg-paises" value={paises} onChange={e => setPaises(e.target.value)} placeholder="ex.: Itália, França" style={inputStyle} />
        <datalist id="vg-paises">{Object.keys(PAIS_FLAG).map(p => <option key={p} value={p} />)}</datalist>
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          {editing && <button onClick={() => { life.deleteViagem(editing.id); onClose(); }} style={{ padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apagar</button>}
          <button onClick={salvar} disabled={!podeSalvar} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: 'none', background: podeSalvar ? '#111' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: podeSalvar ? 'pointer' : 'default' }}>{editing ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  );
}

// ---- Card: Gastos (por categoria; Coisas reusa a retrospectiva de Compras) ----
const COR_GASTOS = '#6b7a99';
const GASTO_CATS = ['Fixos', 'Mercado', 'Uber', 'Trabalho', 'Mãe', 'Saúde', 'Viagem', 'Coisas', 'Roupa', 'Skin care', 'Bobeira', 'Rolês', 'Presentes'];
const fmtBRLr = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const GASTO_CORES = ['#ff8a3d', '#5b8def', '#2bb673', '#c77dff', '#ef6c4d', '#26c6da', '#f0a35e', '#c2548f', '#6b7a99', '#d4a72c', '#e0729b', '#3fb6a8', '#8a8f98'];
const catCor = (c, fallback = 0) => { const i = GASTO_CATS.indexOf(c); return GASTO_CORES[(i >= 0 ? i : fallback) % GASTO_CORES.length]; };
// Gráfico de linha por item (bom p/ Fixos): cada item uma linha ao longo dos meses.
// Tocar num item na legenda isola a linha (auto-escala) e mostra os valores por mês.
function LinhasGastoChart({ itens, mesesAsc }) {
  const [sel, setSel] = useState(null);
  const byNomeMes = {};
  itens.forEach(i => { (byNomeMes[i.nome] = byNomeMes[i.nome] || {}); byNomeMes[i.nome][i.mes] = (byNomeMes[i.nome][i.mes] || 0) + (Number(i.valor) || 0); });
  const totalDe = (n) => Object.values(byNomeMes[n]).reduce((a, b) => a + b, 0);
  const nomes = Object.keys(byNomeMes).sort((a, b) => totalDe(b) - totalDe(a));
  const corDe = (n) => GASTO_CORES[nomes.indexOf(n) % GASTO_CORES.length];
  const shown = sel ? [sel] : nomes;
  const W = 320, H = 150, padL = 8, padR = 8, padT = 12, padB = 22;
  const x = (i) => mesesAsc.length <= 1 ? W / 2 : padL + i * (W - padL - padR) / (mesesAsc.length - 1);
  let max = 0; shown.forEach(n => mesesAsc.forEach(mm => { max = Math.max(max, byNomeMes[n][mm] || 0); }));
  max = max || 1;
  const y = (v) => (H - padB) - (v / max) * (H - padT - padB);
  const pathOf = (n) => mesesAsc.map((mm, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(byNomeMes[n][mm] || 0).toFixed(1)}`).join(' ');
  const mAbbr = (mm) => MESES[+mm.slice(5, 7) - 1].slice(0, 3);
  const fmtR = (v) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
      <div style={{ fontSize: 11, color: '#4a5468', letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>evolução por item{sel ? ' · ' + sel : ''} <span style={{ color: '#bbb', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· toque pra isolar</span></div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {shown.map(n => (
          <g key={n}>
            <path d={pathOf(n)} fill="none" stroke={corDe(n)} strokeWidth={sel ? 2.2 : 1.6} strokeLinejoin="round" strokeLinecap="round" />
            {mesesAsc.map((mm, i) => byNomeMes[n][mm] != null ? <circle key={i} cx={x(i)} cy={y(byNomeMes[n][mm] || 0)} r={sel ? 3 : 2.2} fill={corDe(n)} /> : null)}
          </g>
        ))}
        {mesesAsc.map((mm, i) => <text key={mm} x={x(i)} y={H - 6} textAnchor="middle" fontSize="8" fill="#bbb">{mAbbr(mm)}</text>)}
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {nomes.map(n => {
          const ativo = sel === n;
          return (
            <button key={n} onClick={() => setSel(ativo ? null : n)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 14, fontSize: 11.5, cursor: 'pointer', border: '1px solid ' + (ativo ? corDe(n) : '#eee'), background: ativo ? corDe(n) + '1c' : '#fafafa', color: '#444', fontWeight: ativo ? 700 : 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: corDe(n), flexShrink: 0 }} />{n}
            </button>
          );
        })}
      </div>
      {sel && <div style={{ marginTop: 8, fontSize: 12, color: '#666', lineHeight: 1.6 }}>{mesesAsc.filter(mm => byNomeMes[sel][mm] != null).map(mm => `${mAbbr(mm)} ${fmtR(byNomeMes[sel][mm])}`).join(' · ')}</div>}
    </div>
  );
}

// Tabela de evolução: itens nas linhas, meses nas colunas (mais recente à esquerda).
function GastoTabela({ itens, mesesAsc, cor, onEdit }) {
  const mesesDesc = [...mesesAsc].reverse(); // mais recente primeiro (coluna da esquerda)
  const byNomeMes = {};
  itens.forEach(i => { (byNomeMes[i.nome] = byNomeMes[i.nome] || {}); (byNomeMes[i.nome][i.mes] = byNomeMes[i.nome][i.mes] || []).push(i); });
  const valOf = (n, mm) => (byNomeMes[n][mm] || []).reduce((a, i) => a + (Number(i.valor) || 0), 0);
  const totalDe = (n) => mesesDesc.reduce((a, mm) => a + valOf(n, mm), 0);
  const nomes = Object.keys(byNomeMes).sort((a, b) => totalDe(b) - totalDe(a));
  const totalMes = (mm) => nomes.reduce((a, n) => a + valOf(n, mm), 0);
  const fmt = (v) => v ? Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '·';
  const mAbbr = (mm) => MESES[+mm.slice(5, 7) - 1].slice(0, 3);
  const stickyL = { position: 'sticky', left: 0, background: '#fff', zIndex: 1 };
  const th = { padding: '7px 10px', fontSize: 10.5, color: '#888', textTransform: 'uppercase', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', borderBottom: '2px solid #eee' };
  const td = { padding: '7px 10px', fontSize: 12.5, color: '#333', textAlign: 'right', whiteSpace: 'nowrap', borderBottom: '1px solid #f3f3f3' };
  return (
    <div style={{ overflowX: 'auto', marginBottom: 18, border: '1px solid #eee', borderRadius: 12 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ ...th, ...stickyL, textAlign: 'left' }}>item</th>
            {mesesDesc.map(mm => <th key={mm} style={th}>{mAbbr(mm)}</th>)}
          </tr>
        </thead>
        <tbody>
          {nomes.map(n => (
            <tr key={n}>
              <td style={{ ...td, ...stickyL, textAlign: 'left', fontWeight: 600, color: '#222' }}>{n}</td>
              {mesesDesc.map(mm => {
                const arr = byNomeMes[n][mm] || [];
                const v = valOf(n, mm);
                return <td key={mm} onClick={arr.length ? () => onEdit(arr[0]) : undefined} style={{ ...td, cursor: arr.length ? 'pointer' : 'default', color: v ? '#333' : '#ccc' }}>{fmt(v)}</td>;
              })}
            </tr>
          ))}
          <tr>
            <td style={{ ...td, ...stickyL, textAlign: 'left', fontWeight: 700, color: cor, borderTop: '2px solid #eee' }}>Total</td>
            {mesesDesc.map(mm => <td key={mm} style={{ ...td, fontWeight: 700, color: cor, borderTop: '2px solid #eee' }}>{fmt(totalMes(mm))}</td>)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function GastosRetro({ onBack, isWide, catInicial }) {
  const life = useLife();
  const [catSel, setCatSel] = useState(catInicial || null);
  const [form, setForm] = useState(null); // { editing? } — item de gasto
  const [tipoChart, setTipoChart] = useState(null); // null = automático; 'barras' | 'linhas'
  useEffect(() => { setTipoChart(null); }, [catSel]); // reset ao trocar de categoria
  const gastos = life.gastos || [];
  const { anos, anoSel, setAnoSel } = useAnoSel(gastos.map(g => g.mes));
  const doAno = gastos.filter(g => (g.mes || '').slice(0, 4) === anoSel);
  const catTotals = {};
  doAno.forEach(g => (g.itens || []).forEach(it => { catTotals[it.categoria] = (catTotals[it.categoria] || 0) + (Number(it.valor) || 0); }));
  const cats = [...GASTO_CATS.filter(c => catTotals[c] != null), ...Object.keys(catTotals).filter(c => !GASTO_CATS.includes(c))];
  const totalAno = cats.reduce((a, c) => a + (catTotals[c] || 0), 0);

  // "Coisas" reaproveita a retrospectiva de compras itemizada (como hoje).
  if (catSel === 'Coisas') return <ComprasRetro onBack={() => setCatSel(null)} isWide={isWide} backLabel="Gastos" />;

  if (catSel) {
    // itens itemizados desta categoria no ano (quebra enviada pela Mari)
    const itens = (life.gastosItens || []).filter(x => x.categoria === catSel && (x.mes || '').slice(0, 4) === anoSel);
    const temItens = itens.length > 0;
    // fallback: total mensal vindo da Vida Financeira (categorias ainda não detalhadas)
    const linhas = doAno.map(g => ({ mes: g.mes, valor: Number((g.itens || []).find(i => i.categoria === catSel)?.valor) || 0 }))
      .filter(l => l.valor > 0).sort((a, b) => (b.mes || '').localeCompare(a.mes || ''));
    const maxMes = Math.max(...linhas.map(l => l.valor), 1);
    const cor = catCor(catSel);
    // agrupa itens por mês (mais recente primeiro)
    const mesesItens = [...new Set(itens.map(i => i.mes))].sort().reverse();
    const totalItens = itens.reduce((a, i) => a + (Number(i.valor) || 0), 0);
    const totalCat = temItens ? totalItens : linhas.reduce((a, l) => a + l.valor, 0);
    // dados do gráfico (design de Compras): meses cronológicos, faixas = itens
    const mesesChart = [...mesesItens].reverse().map(mm => {
      const arr = itens.filter(i => i.mes === mm).map(i => ({ titulo: i.nome, vnum: Number(i.valor) || 0 })).sort((a, b) => b.vnum - a.vnum);
      return { mm, label: MESES[+mm.slice(5, 7) - 1].slice(0, 3), itens: arr, total: arr.reduce((a, i) => a + i.vnum, 0) };
    }).filter(m => m.total > 0);
    const mesesAsc = [...mesesItens].reverse();
    // se 3+ itens se repetem em vários meses (ex.: Fixos) → gráfico de linha por padrão
    const recCount = {}; itens.forEach(i => { (recCount[i.nome] = recCount[i.nome] || new Set()).add(i.mes); });
    const recorrentes = Object.values(recCount).filter(s => s.size >= 2).length;
    const chartTipo = tipoChart || (recorrentes >= 3 ? 'linhas' : 'barras');
    return (
      <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
        <button onClick={() => setCatSel(null)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Gastos</button>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ width: 36, height: 4, background: cor, borderRadius: 4, marginBottom: 12 }} />
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>{catSel}</h2>
            <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>{fmtBRLr(totalCat)} em {anoSel}{temItens ? ` · ${itens.length} ${itens.length === 1 ? 'compra' : 'compras'}` : ''}</p>
          </div>
          <button onClick={() => setForm({})} title="adicionar gasto" style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>+</button>
        </div>

        {temItens ? <>
          {mesesChart.length > 0 && <>
            {mesesAsc.length > 1 && <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {[['barras', 'barras'], ['linhas', 'linhas']].map(([id, lbl]) => (
                <button key={id} onClick={() => setTipoChart(id)} style={{ padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid ' + (chartTipo === id ? cor : '#e2e2e2'), background: chartTipo === id ? cor + '1c' : '#fff', color: chartTipo === id ? '#333' : '#999' }}>{lbl}</button>
              ))}
            </div>}
            {chartTipo === 'linhas' ? <LinhasGastoChart itens={itens} mesesAsc={mesesAsc} /> : <ComprasChart meses={mesesChart} />}
          </>}
          <GastoTabela itens={itens} mesesAsc={mesesAsc} cor={cor} onEdit={(it) => setForm({ editing: it })} />
        </> : linhas.length === 0 ? (
          <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '10px 0' }}>Sem gastos em {catSel} em {anoSel}. Toque no + para detalhar.</p>
        ) : <>
          <p style={{ fontSize: 11.5, color: '#bbb', margin: '0 0 10px' }}>total por mês (ainda não detalhado — toque no + para listar os itens)</p>
          {linhas.map(l => (
            <div key={l.mes} style={{ marginBottom: 9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                <span style={{ color: '#555', textTransform: 'capitalize' }}>{fmtMesAno(l.mes)}</span>
                <span style={{ color: '#222', fontWeight: 600 }}>{fmtBRLr(l.valor)}</span>
              </div>
              <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4 }}>
                <div style={{ width: (l.valor / maxMes * 100) + '%', height: '100%', background: COR_GASTOS, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </>}

        {form && <GastoItemForm editing={form.editing} categoria={catSel} onClose={() => setForm(null)} />}
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Retrospectiva</button>
      <div style={{ width: 36, height: 4, background: COR_GASTOS, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Gastos</h2>
      <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>pra onde foi o dinheiro, por categoria</p>

      {gastos.length === 0 ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Sem gastos registrados ainda (eles vêm da Vida Financeira → Gastos).</p>
      ) : <>
        <AnoChips anos={anos} anoSel={anoSel} setAnoSel={setAnoSel} cor={COR_GASTOS} />
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: '#111' }}>{fmtBRLr(totalAno)}</span>
          <span style={{ fontSize: 12.5, color: '#999' }}> em {anoSel}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isWide ? 'repeat(auto-fill, minmax(160px, 1fr))' : '1fr 1fr', gap: 12 }}>
          {cats.map((c, i) => {
            const cor = catCor(c, i);
            return (
              <button key={c} onClick={() => setCatSel(c)} style={{ background: cor + '12', border: '1px solid ' + cor + '33', borderRadius: 16, padding: '16px 14px', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: 22, height: 4, background: cor, borderRadius: 4, marginBottom: 10 }} />
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#222', fontWeight: 700, lineHeight: 1.2 }}>{c}</div>
                <div style={{ fontSize: 13, color: '#444', marginTop: 5, fontWeight: 700 }}>{fmtBRLr(catTotals[c])}</div>
                <div style={{ fontSize: 10.5, color: '#aaa', marginTop: 2 }}>{c === 'Coisas' ? 'compras' : (totalAno ? (catTotals[c] / totalAno * 100).toFixed(0) + '% do ano' : '')}</div>
              </button>
            );
          })}
        </div>
      </>}
    </div>
  );
}

function GastoItemForm({ editing, categoria, onClose }) {
  const life = useLife();
  const [nome, setNome] = useState(editing?.nome || '');
  const [mes, setMes] = useState(editing?.mes || '');
  const [valor, setValor] = useState(editing?.valor != null ? String(editing.valor) : '');
  const podeSalvar = nome.trim().length > 0 && mes && valor;
  const salvar = () => {
    if (!podeSalvar) return;
    life.saveGastoItem({ id: editing?.id, categoria, mes, nome: nome.trim(), valor: Number(String(valor).replace(',', '.')) || 0 });
    onClose();
  };
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar' : 'Novo'} gasto · {categoria}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>
        <label style={labelStyle}>O quê</label>
        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="ex.: Presente Lucy e Thales" style={inputStyle} />
        <label style={labelStyle}>Mês</label>
        <input type="month" value={mes} onChange={e => setMes(e.target.value)} style={inputStyle} />
        <label style={labelStyle}>Valor (R$)</label>
        <input type="text" inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)} placeholder="ex.: 533,70" style={inputStyle} />
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          {editing && <button onClick={() => { life.deleteGastoItem(editing.id); onClose(); }} style={{ padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apagar</button>}
          <button onClick={salvar} disabled={!podeSalvar} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: 'none', background: podeSalvar ? '#111' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: podeSalvar ? 'pointer' : 'default' }}>{editing ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  );
}

// ---- Card: Amorosa (privada — escondida atrás de um toque) ----
const COR_AMOR = '#c2548f';
const TIPOS_AM = [
  { id: 'transa', label: 'Transa', plural: 'transas', emoji: '🔥' },
  { id: 'date', label: 'Date', plural: 'dates', emoji: '🍷' },
  { id: 'beijo', label: 'Beijo', plural: 'beijos', emoji: '💋' },
  { id: 'relacao', label: 'Relação', plural: 'relações', emoji: '❤️' },
];
const tipoAm = (id) => TIPOS_AM.find(t => t.id === id) || TIPOS_AM[0];

function AmorosaRetro({ onBack, isWide }) {
  const life = useLife();
  const [revelado, setRevelado] = useState(false);
  const [form, setForm] = useState(null);
  const todos = life.amorosa || [];
  const { anos, anoSel, setAnoSel } = useAnoSel(todos.map(a => a.data));
  const doAno = todos.filter(a => (a.data || '').slice(0, 4) === anoSel).sort((a, b) => (b.data || '').localeCompare(a.data || ''));
  const countTipo = (t) => doAno.filter(a => (a.tipo || 'transa') === t).length;
  const pessoaCount = {};
  doAno.forEach(a => { const p = (a.pessoa || '').trim(); if (p) pessoaCount[p] = (pessoaCount[p] || 0) + 1; });
  const pessoas = Object.entries(pessoaCount).sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Retrospectiva</button>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: 36, height: 4, background: COR_AMOR, borderRadius: 4, marginBottom: 12 }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Amorosa</h2>
          <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>só seu · dates, beijos e afins</p>
        </div>
        {revelado && <button onClick={() => setForm({})} title="registrar" style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>+</button>}
      </div>

      {!revelado ? (
        <div style={{ marginTop: 16, padding: '44px 24px', borderRadius: 16, background: COR_AMOR + '0e', border: '1px dashed ' + COR_AMOR + '55', textAlign: 'center' }}>
          <div style={{ fontSize: 30 }}>🔒</div>
          <p style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 15.5, color: '#555', margin: '10px 0 3px' }}>Conteúdo privado</p>
          <p style={{ fontSize: 12.5, color: '#aaa', marginBottom: 18 }}>fica oculto até você mostrar</p>
          <button onClick={() => setRevelado(true)} style={{ border: 'none', borderRadius: 20, background: COR_AMOR, color: '#fff', cursor: 'pointer', padding: '10px 22px', fontSize: 13.5, fontWeight: 700 }}>Toque para mostrar</button>
        </div>
      ) : todos.length === 0 ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Nada por aqui ainda. Toque no + para registrar uma transa, date, beijo ou relação.</p>
      ) : <div>
        <AnoChips anos={anos} anoSel={anoSel} setAnoSel={setAnoSel} cor={COR_AMOR} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 20px', marginBottom: 18 }}>
          {TIPOS_AM.map(t => { const n = countTipo(t.id); return (
            <div key={t.id}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: n ? '#111' : '#ccc' }}>{n}</span>
              <span style={{ fontSize: 12.5, color: '#999' }}> {t.emoji} {n === 1 ? t.label.toLowerCase() : t.plural}</span>
            </div>
          ); })}
        </div>

        {pessoas.length > 0 && <div>
          <div style={{ fontSize: 11, color: COR_AMOR, letterSpacing: '0.4px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>quem apareceu mais</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 22 }}>
            {pessoas.map(([nome, n]) => (
              <span key={nome} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 20, background: COR_AMOR + '12', border: '1px solid ' + COR_AMOR + '33', fontSize: 12.5, color: '#8a2f63', fontWeight: 600 }}>
                {nome}{n > 1 && <span style={{ color: COR_AMOR, fontWeight: 700 }}>{n}</span>}
              </span>
            ))}
          </div>
        </div>}

        <div style={{ fontSize: 11, color: COR_AMOR, letterSpacing: '0.4px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>no ano</div>
        {doAno.length === 0 ? <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '6px 0' }}>Nada registrado em {anoSel}.</p> : (
          <div style={{ borderLeft: '2px solid ' + COR_AMOR + '33', marginLeft: 5, paddingLeft: 16 }}>
            {doAno.map(a => { const T = tipoAm(a.tipo); return (
              <div key={a.id} onClick={() => setForm({ editing: a })} style={{ position: 'relative', padding: '8px 0 12px', cursor: 'pointer' }}>
                <span style={{ position: 'absolute', left: -23, top: 12, width: 9, height: 9, borderRadius: '50%', background: COR_AMOR, border: '2px solid #fafafa' }} />
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: COR_AMOR, fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase' }}>{fmtDiaMes(a.data)}</span>
                  <span style={{ fontSize: 12, color: '#777' }}>{T.emoji} {T.label}</span>
                  {a.pessoa && <span style={{ fontSize: 14, color: '#222', fontWeight: 600 }}>· {a.pessoa}</span>}
                  {a.tipo === 'relacao' && a.fim && <span style={{ fontSize: 11.5, color: '#aaa' }}>até {fmtDiaMes(a.fim)}</span>}
                </div>
                {(a.local || a.nota) && <div style={{ fontSize: 13, color: '#888', lineHeight: 1.45, marginTop: 3 }}>{[a.local, a.nota].filter(Boolean).join(' · ')}</div>}
              </div>
            ); })}
          </div>
        )}
      </div>}

      {form && <AmorosaForm editing={form.editing} onClose={() => setForm(null)} />}
    </div>
  );
}

function AmorosaForm({ editing, onClose }) {
  const life = useLife();
  const [tipo, setTipo] = useState(editing?.tipo || 'transa');
  const [data, setData] = useState(editing?.data || '');
  const [fim, setFim] = useState(editing?.fim || '');
  const [pessoa, setPessoa] = useState(editing?.pessoa || '');
  const [local, setLocal] = useState(editing?.local || '');
  const [nota, setNota] = useState(editing?.nota || '');
  const pessoas = [...new Set((life.amorosa || []).map(a => a.pessoa).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt'));
  const podeSalvar = !!data;
  const salvar = () => {
    if (!podeSalvar) return;
    life.saveAmorosa({ id: editing?.id, tipo, data, fim: (tipo === 'relacao' && fim) ? fim : undefined, pessoa: pessoa.trim() || undefined, local: local.trim() || undefined, nota: nota.trim() || undefined });
    onClose();
  };
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar' : 'Novo'} registro</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>
        <label style={labelStyle}>Tipo</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {TIPOS_AM.map(t => (
            <button key={t.id} onClick={() => setTipo(t.id)} style={{ border: '1px solid ' + (tipo === t.id ? COR_AMOR : '#e2e2e2'), borderRadius: 20, background: tipo === t.id ? COR_AMOR : '#fff', color: tipo === t.id ? '#fff' : '#777', cursor: 'pointer', padding: '7px 13px', fontSize: 12.5, fontWeight: 700 }}>{t.emoji} {t.label}</button>
          ))}
        </div>
        <label style={labelStyle}>{tipo === 'relacao' ? 'Início' : 'Quando'}</label>
        <input type="date" value={data} onChange={e => setData(e.target.value)} style={inputStyle} />
        {tipo === 'relacao' && <>
          <label style={labelStyle}>Fim (opcional)</label>
          <input type="date" value={fim} onChange={e => setFim(e.target.value)} style={inputStyle} />
        </>}
        <label style={labelStyle}>Com quem (opcional)</label>
        <input value={pessoa} onChange={e => setPessoa(e.target.value)} list="amor-pessoas" placeholder="nome ou apelido" style={inputStyle} />
        <datalist id="amor-pessoas">{pessoas.map(p => <option key={p} value={p} />)}</datalist>
        <label style={labelStyle}>Onde (opcional)</label>
        <input value={local} onChange={e => setLocal(e.target.value)} placeholder="ex.: bar, casa dele…" style={inputStyle} />
        <label style={labelStyle}>Nota (opcional)</label>
        <textarea value={nota} onChange={e => setNota(e.target.value)} rows={2} placeholder="como foi, o que rolou…" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          {editing && <button onClick={() => { life.deleteAmorosa(editing.id); onClose(); }} style={{ padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apagar</button>}
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
