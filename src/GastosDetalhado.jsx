// Aba "Gastos detalhados" da VF — CÓPIA INDEPENDENTE do antigo Gastos da
// Retrospectiva (que vai ser aposentado). NÃO importa nada da Retrospectiva de
// propósito: quando aquele card sumir, esta aba não sente. Só depende de coisas
// compartilhadas (store, calendarConfig).
//
// Difere do original em: capa nova (seletor ano+mês, totais do ano e do mês, um
// card por categoria com valor+% do ano e valor+% do mês); dinheiro no formato da
// VF (inteiro, vírgula, sem "k"); e o cadeado da VF borra os valores aqui também
// (via `oculto`, borrão só nos números — rótulos seguem legíveis).
import { useState, useEffect, useContext, createContext } from 'react';
import { useLife, simboloMoeda } from './lifeStore.jsx';
import { cicloDia27, cicloLabel } from './calendarConfig.js';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const fmtMesAno = (mm) => `${MESES[+mm.slice(5, 7) - 1]} de ${mm.slice(0, 4)}`;
const COR_GASTOS = '#6b7a99';
const GASTO_CATS = ['Fixos', 'Mercado', 'Uber', 'Trabalho', 'Mãe', 'Saúde', 'Viagem', 'Coisas', 'Roupa', 'Skin care', 'Bobeira', 'Rolês', 'Presentes'];
const GASTO_CORES = ['#ff8a3d', '#5b8def', '#2bb673', '#c77dff', '#ef6c4d', '#26c6da', '#f0a35e', '#c2548f', '#6b7a99', '#d4a72c', '#e0729b', '#3fb6a8', '#8a8f98'];
const catCor = (c, fallback = 0) => { const i = GASTO_CATS.indexOf(c); return GASTO_CORES[(i >= 0 ? i : fallback) % GASTO_CORES.length]; };
// Dinheiro no padrão da VF: inteiro arredondado, vírgula de milhar, sem decimais.
const fmtR = (v) => 'R$ ' + Math.round(Number(v) || 0).toLocaleString('en-US');

// estilos locais (cópias — não importa de Life/Retrospectiva)
const overlay = { position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' };
const sheet = { background: '#fafafa', width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', borderRadius: '20px 20px 0 0', padding: '20px 20px 28px' };
const labelStyle = { fontSize: 11, color: '#999', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: 5, marginTop: 14 };
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', color: '#222' };

// Cadeado: contexto local só desta aba. `V` borra o número quando oculto.
const PrivCtx = createContext(false);
function V({ children, style }) {
  const o = useContext(PrivCtx);
  return <span style={{ filter: o ? 'blur(6px)' : 'none', transition: 'filter .15s', userSelect: o ? 'none' : 'auto', ...style }}>{children}</span>;
}
// estilo de borrão pra usar em <text> de SVG (V é span, não serve dentro de svg)
const useBlur = () => (useContext(PrivCtx) ? { filter: 'blur(4px)' } : null);

// anos disponíveis a partir das datas 'YYYY-MM'; mantém o ano selecionado.
function useAnoSel(datas) {
  const anos = [...new Set((datas || []).map(d => (d || '').slice(0, 4)).filter(Boolean))].sort().reverse();
  const [anoSel, setAnoSel] = useState(anos[0] || String(new Date().getFullYear()));
  const ano = anos.includes(anoSel) ? anoSel : (anos[0] || anoSel);
  return { anos, anoSel: ano, setAnoSel };
}

// Gráfico de linha por item (bom p/ Fixos): cada item uma linha ao longo dos meses.
function LinhasGastoChart({ itens, mesesAsc }) {
  const [sel, setSel] = useState(null);
  const blur = useBlur();
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
      {sel && <div style={{ marginTop: 8, fontSize: 12, color: '#666', lineHeight: 1.6, ...blur }}>{mesesAsc.filter(mm => byNomeMes[sel][mm] != null).map(mm => `${mAbbr(mm)} ${fmtR(byNomeMes[sel][mm])}`).join(' · ')}</div>}
    </div>
  );
}

// Gráfico de barras empilhadas: cada faixa = um item do mês.
function ComprasChart({ meses }) {
  const [sel, setSel] = useState(null);
  const blur = useBlur();
  if (!meses.length) return null;
  const max = Math.max(...meses.map(m => m.total), 1);
  const H = 160, barW = 26, gap = 16, padBot = 24, padTop = 6;
  const chartH = H - padBot - padTop;
  const W = Math.max(meses.length * (barW + gap) + gap, 1);
  const PALETTE = ['#ff8a3d', '#5b8def', '#2bb673', '#c77dff', '#ef6c4d', '#26c6da', '#f0a35e', '#c2548f', '#6b7a99', '#d4a72c'];
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
        {sel ? <><b>{sel.titulo}</b> · <span style={blur}>{fmtR(sel.vnum)}</span> <span style={{ color: '#aaa' }}>({sel.label})</span></> : 'toque numa faixa para ver a compra'}
      </div>
    </div>
  );
}

// Tabela de evolução: itens nas linhas, meses nas colunas (mais recente à esquerda).
function GastoTabela({ itens, mesesAsc, cor, onEdit }) {
  const blurV = useBlur();
  const mesesDesc = [...mesesAsc].reverse();
  const byNomeMes = {};
  itens.forEach(i => { (byNomeMes[i.nome] = byNomeMes[i.nome] || {}); (byNomeMes[i.nome][i.mes] = byNomeMes[i.nome][i.mes] || []).push(i); });
  const valOf = (n, mm) => (byNomeMes[n][mm] || []).reduce((a, i) => a + (Number(i.valor) || 0), 0);
  const totalDe = (n) => mesesDesc.reduce((a, mm) => a + valOf(n, mm), 0);
  const nomes = Object.keys(byNomeMes).sort((a, b) => totalDe(b) - totalDe(a));
  const totalMes = (mm) => nomes.reduce((a, n) => a + valOf(n, mm), 0);
  const totalGeral = nomes.reduce((a, n) => a + totalDe(n), 0);
  const fmt = (v) => v ? Math.round(Number(v)).toLocaleString('en-US') : '·';
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
            <th style={{ ...th, color: cor, borderLeft: '2px solid #eee' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {nomes.map(n => (
            <tr key={n}>
              <td style={{ ...td, ...stickyL, textAlign: 'left', fontWeight: 600, color: '#222' }}>{n}</td>
              {mesesDesc.map(mm => {
                const arr = byNomeMes[n][mm] || [];
                const v = valOf(n, mm);
                return <td key={mm} onClick={arr.length ? () => onEdit(arr[0]) : undefined} style={{ ...td, cursor: arr.length ? 'pointer' : 'default', color: v ? '#333' : '#ccc', ...(v ? blurV : null) }}>{fmt(v)}</td>;
              })}
              <td style={{ ...td, fontWeight: 700, color: '#111', borderLeft: '2px solid #eee', ...blurV }}>{fmt(totalDe(n))}</td>
            </tr>
          ))}
          <tr>
            <td style={{ ...td, ...stickyL, textAlign: 'left', fontWeight: 700, color: cor, borderTop: '2px solid #eee' }}>Total</td>
            {mesesDesc.map(mm => <td key={mm} style={{ ...td, fontWeight: 700, color: cor, borderTop: '2px solid #eee', ...blurV }}>{fmt(totalMes(mm))}</td>)}
            <td style={{ ...td, fontWeight: 700, color: cor, borderTop: '2px solid #eee', borderLeft: '2px solid #eee', ...blurV }}>{fmt(totalGeral)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Formulário de UM item de gasto (nome + mês + valor). Reusa saveGastoItem do store.
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

// VR: histórico do vale-refeição por ciclo 27→26 e, dentro de cada um, gastos por dia.
function VRDet({ onBack }) {
  const life = useLife();
  const blur = useBlur();
  const ciclos = life.vr?.ciclos || {};
  const keys = Object.keys(ciclos).sort().reverse();
  const [aberto, setAberto] = useState(keys[0] || null);
  const cor = '#b06d1e';
  return (
    <div style={{ paddingBottom: 20 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 14, padding: 0 }}>&larr; Gastos detalhados</button>
      <div style={{ width: 36, height: 4, background: cor, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#111', margin: '0 0 4px' }}>VR</h2>
      <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>histórico do vale-refeição · ciclo 27→26</p>
      {!keys.length ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Ainda sem VR. Lance no card “VR do mês” no fim da Tela Hoje.</p>
      ) : keys.map(ck => {
        const c = ciclos[ck];
        const gastos = c.gastos || [];
        const gasto = gastos.reduce((s, g) => s + (Number(g.valor) || 0), 0);
        const total = Number(c.total) || 0;
        const sobrou = total - gasto;
        const open = aberto === ck;
        const porDia = {};
        gastos.forEach(g => { (porDia[g.data] = porDia[g.data] || []).push(g); });
        const dias = Object.keys(porDia).sort().reverse();
        return (
          <div key={ck} style={{ border: '1px solid #eee', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
            <div onClick={() => setAberto(open ? null : ck)} style={{ padding: '11px 14px', cursor: 'pointer', background: '#fafafa' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#222' }}>{open ? '▾' : '▸'} {cicloLabel(ck)}</div>
              <div style={{ fontSize: 11.5, color: '#999', marginTop: 2 }}>gastou <b style={{ color: '#555', ...blur }}>{fmtR(gasto)}</b> de <span style={blur}>{fmtR(total)}</span> · sobrou <span style={blur}>{fmtR(sobrou)}</span></div>
            </div>
            {open && (
              <div style={{ padding: '4px 14px 12px' }}>
                {dias.length === 0 ? <p style={{ fontSize: 12.5, color: '#bbb', fontStyle: 'italic', margin: '6px 0' }}>Nenhum gasto neste ciclo.</p> :
                  dias.map(dia => {
                    const arr = porDia[dia];
                    const totDia = arr.reduce((s, g) => s + (Number(g.valor) || 0), 0);
                    return (
                      <div key={dia} style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', fontWeight: 700, borderBottom: '1px solid #f3f3f3', paddingBottom: 2 }}>
                          <span>{dia.slice(8, 10)}/{dia.slice(5, 7)}</span><span style={blur}>{fmtR(totDia)}</span>
                        </div>
                        {arr.map(g => (
                          <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '4px 0 4px 12px', fontSize: 12.5, color: '#666' }}>
                            <span style={{ color: '#bbb' }}>· {g.nota || 'gasto'}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={blur}>{fmtR(g.valor)}</span><button onClick={() => life.deleteVrGasto(ck, g.id)} style={{ border: 'none', background: 'none', color: '#ccc', fontSize: 15, cursor: 'pointer', lineHeight: 1 }}>×</button></span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Posso gastar: quanto ainda dá pra gastar no ciclo atual (Total e Mercado) + histórico.
function PossoDet({ onBack }) {
  const life = useLife();
  const blur = useBlur();
  const ciclos = life.possoGastar?.ciclos || {};
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const { cycleKey } = cicloDia27(hoje);
  const keys = Object.keys(ciclos).sort().reverse();
  const cor = '#b06d1e';
  const buckets = [['total', 'Total'], ['mercado', 'Mercado']];
  const resumo = (b) => { const bb = b || {}; const g = (bb.gastos || []).reduce((s, x) => s + (Number(x.valor) || 0), 0); const bud = Number(bb.budget) || 0; return { budget: bud, gasto: g, resta: bud - g }; };
  const temAlgum = keys.some(k => resumo(ciclos[k].total).budget > 0 || resumo(ciclos[k].mercado).budget > 0 || (ciclos[k].total?.gastos || []).length || (ciclos[k].mercado?.gastos || []).length);
  const linhaBuckets = (c, big) => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: big ? 10 : 6 }}>
      {buckets.map(([bk, lbl]) => { const r = resumo((c || {})[bk]); if (r.budget <= 0 && r.gasto <= 0) return null; return (
        <div key={bk} style={{ flex: '1 1 40%', minWidth: 130 }}>
          <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>{lbl}</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: big ? 25 : 18, fontWeight: 700, color: r.resta < 0 ? '#c0392b' : cor, ...blur }}>{fmtR(r.resta)}</div>
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>de <span style={blur}>{fmtR(r.budget)}</span> · gastou <span style={blur}>{fmtR(r.gasto)}</span></div>
        </div>
      ); })}
    </div>
  );
  const anteriores = keys.filter(k => k !== cycleKey);
  return (
    <div style={{ paddingBottom: 20 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 14, padding: 0 }}>&larr; Gastos detalhados</button>
      <div style={{ width: 36, height: 4, background: cor, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#111', margin: '0 0 4px' }}>Posso gastar</h2>
      <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>quanto ainda dá pra gastar no mês · ciclo 27→26</p>
      {!temAlgum ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Defina seus orçamentos no card “Posso gastar” no fim da Tela Hoje — os lançamentos aparecem aqui.</p>
      ) : <>
        <div style={{ border: '1px solid ' + cor + '33', background: cor + '0c', borderRadius: 16, padding: '14px 16px', marginBottom: 18 }}>
          <div style={{ fontSize: 11.5, color: cor, fontWeight: 700 }}>{cicloLabel(cycleKey)} · agora</div>
          {linhaBuckets(ciclos[cycleKey], true)}
        </div>
        {anteriores.length > 0 && <p style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, margin: '0 0 8px' }}>meses anteriores</p>}
        {anteriores.map(k => (
          <div key={k} style={{ border: '1px solid #eee', borderRadius: 12, padding: '11px 14px', marginBottom: 10 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#444' }}>{cicloLabel(k)}</div>
            {linhaBuckets(ciclos[k], false)}
          </div>
        ))}
      </>}
    </div>
  );
}

// Componente principal. `oculto` vem da VF (cadeado) — borra os valores.
// Preenchimento por subcategoria de UMA categoria num mês. As subcategorias vêm
// com o nome pronto (life.gastoSubcats[cat]); a Mari só põe/edita o valor. "outros"
// = total da categoria no mês (vindo de Gastos) − soma das subs. Dá pra criar e
// excluir subcategoria (excluir apaga os valores dela → viram "outros").
function SubcatForm({ cat, mes, catTotalMes, cor }) {
  const life = useLife();
  const subs = (life.gastoSubcats || {})[cat] || [];
  const itens = life.gastosItens || [];
  const valorDe = (nome) => itens.filter(x => x.categoria === cat && x.mes === mes && x.nome === nome).reduce((a, x) => a + (Number(x.valor) || 0), 0);
  const [txt, setTxt] = useState({});
  // seeda os campos com os valores do mês ao trocar de categoria ou mês
  useEffect(() => { const o = {}; subs.forEach(s => { const v = valorDe(s); o[s] = v ? String(v) : ''; }); setTxt(o); }, [cat, mes]); // eslint-disable-line
  const [novo, setNovo] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const somaSubs = subs.reduce((a, s) => a + valorDe(s), 0);
  const outros = Math.round((catTotalMes - somaSubs) * 100) / 100;
  const salvar = (s, v) => { setTxt(t => ({ ...t, [s]: v })); const n = Number(String(v).replace(',', '.')); life.setGastoSubItem(cat, mes, s, isFinite(n) ? n : 0); };
  const addSub = () => { const n = novo.trim(); if (!n) return; life.addGastoSubcat(cat, n); setNovo(''); setAddOpen(false); };
  const inputStyle = { width: 110, padding: '7px 9px', border: '1px solid #e2e2e2', borderRadius: 9, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', color: '#222', textAlign: 'right' };
  return (
    <div>
      {subs.map(s => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #f3f3f3' }}>
          <span style={{ flex: 1, fontSize: 13.5, color: '#333', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{s}</span>
          <span style={{ fontSize: 12, color: '#aaa' }}>R$</span>
          <input type="text" inputMode="decimal" value={txt[s] ?? ''} onChange={e => salvar(s, e.target.value)} placeholder="0" style={inputStyle} />
          <button onClick={() => { if (confirm(`Excluir "${s}"? Os valores lançados nela também são apagados (viram "outros").`)) life.deleteGastoSubcat(cat, s); }} title="excluir subcategoria" style={{ border: 'none', background: 'none', color: '#ccc', fontSize: 18, cursor: 'pointer', lineHeight: 1, flexShrink: 0, padding: '0 2px' }}>×</button>
        </div>
      ))}
      {/* outros = o que falta pra fechar o total do mês */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderBottom: '1px solid #f3f3f3', fontStyle: 'italic', color: '#999' }}>
        <span style={{ fontSize: 13 }}>outros</span>
        <V style={{ fontSize: 13.5, fontWeight: 600, color: outros < -0.01 ? '#c0392b' : '#999' }}>{fmtR(outros)}</V>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 10, paddingTop: 8, borderTop: '2px solid #eee', fontSize: 13.5, fontWeight: 700, color: '#111' }}>
        <span>Total do mês</span><V>{fmtR(catTotalMes)}</V>
      </div>
      {addOpen ? (
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          <input autoFocus value={novo} onChange={e => setNovo(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addSub(); if (e.key === 'Escape') { setAddOpen(false); setNovo(''); } }} placeholder="nova subcategoria" style={{ flex: 1, padding: '9px 11px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 13.5, fontFamily: 'inherit', boxSizing: 'border-box' }} />
          <button onClick={addSub} style={{ border: 'none', borderRadius: 10, background: cor, color: '#fff', fontSize: 13, fontWeight: 700, padding: '0 14px', cursor: 'pointer' }}>ok</button>
        </div>
      ) : (
        <button onClick={() => setAddOpen(true)} style={{ background: 'none', border: '1px dashed #ccc', borderRadius: 10, padding: '9px 0', width: '100%', color: '#999', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 12 }}>+ subcategoria</button>
      )}
    </div>
  );
}

export default function GastosDetalhado({ onBack, oculto }) {
  const life = useLife();
  const [catSel, setCatSel] = useState(null);
  const [form, setForm] = useState(null);
  const [tipoChart, setTipoChart] = useState(null);
  const [mesSel, setMesSel] = useState(null);
  useEffect(() => { setTipoChart(null); }, [catSel]);
  const gastos = life.gastos || [];
  const { anos, anoSel, setAnoSel } = useAnoSel(gastos.map(g => g.mes));
  const doAno = gastos.filter(g => (g.mes || '').slice(0, 4) === anoSel);
  const catTotals = {};
  doAno.forEach(g => (g.itens || []).forEach(it => { catTotals[it.categoria] = (catTotals[it.categoria] || 0) + (Number(it.valor) || 0); }));
  const totalAno = Object.values(catTotals).reduce((a, b) => a + b, 0);
  const mesesAno = [...new Set(doAno.map(g => g.mes))].sort();
  const mesAtual = (mesSel && mesesAno.includes(mesSel)) ? mesSel : mesesAno[mesesAno.length - 1];
  const catMes = {};
  (doAno.find(g => g.mes === mesAtual)?.itens || []).forEach(it => { catMes[it.categoria] = (catMes[it.categoria] || 0) + (Number(it.valor) || 0); });
  const totalMes = Object.values(catMes).reduce((a, b) => a + b, 0);
  const selStyle = { flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: 12, border: '1px solid ' + COR_GASTOS + '55', background: COR_GASTOS + '10', color: '#3a4256', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit', textTransform: 'capitalize', cursor: 'pointer' };

  // Detalhe de uma categoria: preenchimento das subcategorias do MÊS selecionado no
  // topo. Uber/Mãe são únicas (sem subs) — mostram só os totais por mês.
  const detalhe = () => {
    const cor = catCor(catSel);
    const subs = (life.gastoSubcats || {})[catSel] || [];
    const unica = subs.length === 0;
    const catTotalMes = catMes[catSel] || 0;
    const linhas = doAno.map(g => ({ mes: g.mes, valor: Number((g.itens || []).find(i => i.categoria === catSel)?.valor) || 0 }))
      .filter(l => l.valor > 0).sort((a, b) => (b.mes || '').localeCompare(a.mes || ''));
    const maxMes = Math.max(...linhas.map(l => l.valor), 1);
    return (
      <div style={{ paddingBottom: 20 }}>
        <button onClick={() => setCatSel(null)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 14, padding: 0 }}>&larr; Gastos detalhados</button>
        <div style={{ width: 36, height: 4, background: cor, borderRadius: 4, marginBottom: 12 }} />
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#111', margin: '0 0 4px' }}>{catSel}</h2>
        <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px', textTransform: 'capitalize' }}>{mesAtual ? fmtMesAno(mesAtual) : anoSel} · total <V>{fmtR(catTotalMes)}</V></p>
        {unica ? <>
          <p style={{ fontSize: 12.5, color: '#bbb', fontStyle: 'italic', margin: '0 0 12px' }}>Categoria única — sem subcategorias. Total por mês:</p>
          {linhas.length === 0 ? <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic' }}>Sem gastos em {catSel} em {anoSel}.</p> : linhas.map(l => (
            <div key={l.mes} style={{ marginBottom: 9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                <span style={{ color: '#555', textTransform: 'capitalize' }}>{fmtMesAno(l.mes)}</span>
                <span style={{ color: '#222', fontWeight: 600 }}><V>{fmtR(l.valor)}</V></span>
              </div>
              <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4 }}>
                <div style={{ width: (l.valor / maxMes * 100) + '%', height: '100%', background: COR_GASTOS, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </> : <SubcatForm cat={catSel} mes={mesAtual} catTotalMes={catTotalMes} cor={cor} />}
      </div>
    );
  };

  const numRow = (lbl, val, pct) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
      <span style={{ fontSize: 10.5, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{lbl}</span>
      <span style={{ fontSize: 13, color: '#333', fontWeight: 700, whiteSpace: 'nowrap' }}><V>{fmtR(val)}</V> <span style={{ fontSize: 10.5, color: '#aaa', fontWeight: 600 }}>{pct}%</span></span>
    </div>
  );

  const conteudo = () => {
    if (catSel === '__posso') return <PossoDet onBack={() => setCatSel(null)} />;
    if (catSel === '__vr') return <VRDet onBack={() => setCatSel(null)} />;
    if (catSel) return detalhe();
    return (
      <div style={{ paddingBottom: 20 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 14, padding: 0 }}>&larr; Gastos</button>
        <div style={{ width: 36, height: 4, background: COR_GASTOS, borderRadius: 4, marginBottom: 12 }} />
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#111', margin: '0 0 12px' }}>Gastos detalhados</h2>
        {gastos.length === 0 ? (
          <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Sem gastos ainda — eles vêm da aba Gastos.</p>
        ) : <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <select value={anoSel} onChange={e => setAnoSel(e.target.value)} style={selStyle}>
              {anos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={mesAtual || ''} onChange={e => setMesSel(e.target.value)} style={selStyle}>
              {mesesAno.map(m => <option key={m} value={m}>{MESES[+m.slice(5, 7) - 1]}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 24, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 10.5, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>no ano até agora</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#111' }}><V>{fmtR(totalAno)}</V></div>
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>no mês até agora</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#111' }}><V>{fmtR(totalMes)}</V></div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {GASTO_CATS.map((c, i) => {
              const cor = catCor(c, i);
              const va = catTotals[c] || 0, vm = catMes[c] || 0;
              return (
                <button key={c} onClick={() => setCatSel(c)} style={{ background: cor + '12', border: '1px solid ' + cor + '33', borderRadius: 16, padding: '14px 14px', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ width: 22, height: 4, background: cor, borderRadius: 4, marginBottom: 9 }} />
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#222', fontWeight: 700, lineHeight: 1.2 }}>{c}</div>
                  {numRow('ano', va, totalAno ? (va / totalAno * 100).toFixed(0) : 0)}
                  {numRow('mês', vm, totalMes ? (vm / totalMes * 100).toFixed(0) : 0)}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, margin: '24px 0 8px' }}>controle do mês · fora do total</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[['__posso', 'Posso gastar', 'quanto ainda dá pra gastar'], ['__vr', 'VR', 'histórico por ciclo e por dia']].map(([id, label, desc]) => (
              <button key={id} onClick={() => setCatSel(id)} style={{ background: '#b06d1e10', border: '1px solid #b06d1e33', borderRadius: 16, padding: '16px 14px', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: 22, height: 4, background: '#b06d1e', borderRadius: 4, marginBottom: 10 }} />
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#222', fontWeight: 700, lineHeight: 1.2 }}>{label}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{desc}</div>
              </button>
            ))}
          </div>
        </>}
      </div>
    );
  };

  return <PrivCtx.Provider value={!!oculto}>{conteudo()}</PrivCtx.Provider>;
}
