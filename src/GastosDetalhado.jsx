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
import { evalValor } from './conta.jsx';

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
  // Lista dos gastos de UMA caixa por dia (igual Hoje/VR): dia + total, e cada
  // lançamento com o que foi (nome) e o valor.
  const listaPorDia = (gastos) => {
    const porDia = {};
    (gastos || []).forEach(g => { if (g.data) (porDia[g.data] = porDia[g.data] || []).push(g); });
    const dias = Object.keys(porDia).sort().reverse();
    return dias.map(dia => {
      const arr = porDia[dia];
      const tot = arr.reduce((s, g) => s + (Number(g.valor) || 0), 0);
      return (
        <div key={dia} style={{ marginTop: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', fontWeight: 700, borderBottom: '1px solid #f3f3f3', paddingBottom: 2 }}>
            <span>{dia.slice(8, 10)}/{dia.slice(5, 7)}</span><span style={blur}>{fmtR(tot)}</span>
          </div>
          {arr.map(g => (
            <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '3px 0 3px 12px', fontSize: 12.5, color: '#666' }}>
              <span style={{ color: '#bbb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {g.nome || 'gasto'}</span>
              <span style={blur}>{fmtR(g.valor)}</span>
            </div>
          ))}
        </div>
      );
    });
  };
  // Por caixa (Total/Mercado): rótulo + a lista por dia, só se tiver gasto.
  const listasBuckets = (c) => buckets.map(([bk, lbl]) => {
    const gastos = (c || {})[bk]?.gastos || [];
    if (!gastos.length) return null;
    return (
      <div key={bk} style={{ marginTop: 12 }}>
        <div style={{ fontSize: 10.5, color: cor, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>{lbl} · por dia</div>
        {listaPorDia(gastos)}
      </div>
    );
  });
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
          {listasBuckets(ciclos[cycleKey])}
        </div>
        {anteriores.length > 0 && <p style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, margin: '0 0 8px' }}>meses anteriores</p>}
        {anteriores.map(k => (
          <div key={k} style={{ border: '1px solid #eee', borderRadius: 12, padding: '11px 14px', marginBottom: 10 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#444' }}>{cicloLabel(k)}</div>
            {linhaBuckets(ciclos[k], false)}
            {listasBuckets(ciclos[k])}
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
  // Aceita conta ("500+300"): salva o resultado quando a conta é válida; no blur
  // normaliza o campo pro número (ou volta pro valor guardado se ficou inválida).
  const salvar = (s, v) => { setTxt(t => ({ ...t, [s]: v })); const n = evalValor(v); if (isFinite(n)) life.setGastoSubItem(cat, mes, s, n); };
  const normalizar = (s) => setTxt(t => { const n = evalValor(t[s]); const g = valorDe(s); return { ...t, [s]: (t[s] && isFinite(n)) ? String(Math.round(n * 100) / 100) : (g ? String(g) : '') }; });
  const addSub = () => { const n = novo.trim(); if (!n) return; life.addGastoSubcat(cat, n); setNovo(''); setAddOpen(false); };
  const inputStyle = { width: 110, padding: '7px 9px', border: '1px solid #e2e2e2', borderRadius: 9, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', color: '#222', textAlign: 'right' };
  return (
    <div>
      {subs.map(s => {
        const temConta = /[+\-*/]/.test(txt[s] || '');
        const cv = temConta ? evalValor(txt[s]) : null;
        return (
        <div key={s} style={{ padding: '6px 0', borderBottom: '1px solid #f3f3f3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1, fontSize: 13.5, color: '#333', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{s}</span>
            <span style={{ fontSize: 12, color: '#aaa' }}>R$</span>
            <input type="text" inputMode="text" value={txt[s] ?? ''} onChange={e => salvar(s, e.target.value)} onBlur={() => normalizar(s)} placeholder="0 (aceita conta)" style={inputStyle} />
            <button onClick={() => { if (confirm(`Excluir "${s}"? Os valores lançados nela também são apagados (viram "outros").`)) life.deleteGastoSubcat(cat, s); }} title="excluir subcategoria" style={{ border: 'none', background: 'none', color: '#ccc', fontSize: 18, cursor: 'pointer', lineHeight: 1, flexShrink: 0, padding: '0 2px' }}>×</button>
          </div>
          {temConta && <div style={{ fontSize: 11, textAlign: 'right', color: isFinite(cv) ? '#1a7a4f' : '#c0392b', marginTop: 2 }}>{isFinite(cv) ? '= ' + fmtR(cv) : 'conta inválida'}</div>}
        </div>
        );
      })}
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

// Versão só-leitura das subcategorias de uma categoria num mês (lista dos gastos).
// Mostra as subs com valor + "outros" + total. O editar fica atrás de um botão.
function SubcatLista({ cat, mes, catTotalMes }) {
  const life = useLife();
  const subs = (life.gastoSubcats || {})[cat] || [];
  const itens = life.gastosItens || [];
  const valorDe = (nome) => itens.filter(x => x.categoria === cat && x.mes === mes && x.nome === nome).reduce((a, x) => a + (Number(x.valor) || 0), 0);
  const comValor = subs.map(s => ({ s, v: valorDe(s) })).filter(x => x.v > 0);
  const somaSubs = subs.reduce((a, s) => a + valorDe(s), 0);
  const outros = Math.round((catTotalMes - somaSubs) * 100) / 100;
  const row = (nome, val, opts = {}) => (
    <div key={nome} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0', ...(opts.total ? { marginTop: 8, paddingTop: 8, borderTop: '2px solid #eee' } : { borderBottom: '1px solid #f3f3f3' }) }}>
      <span style={{ fontSize: 13.5, fontStyle: opts.outros ? 'italic' : 'normal', color: opts.total ? '#111' : (opts.outros ? '#999' : '#333'), fontWeight: opts.total ? 700 : 400 }}>{nome}</span>
      <V style={{ fontSize: 13.5, fontWeight: opts.total ? 700 : 600, color: opts.total ? '#111' : (opts.outros ? (outros < -0.01 ? '#c0392b' : '#999') : '#333') }}>{fmtR(val)}</V>
    </div>
  );
  if (comValor.length === 0 && Math.abs(outros) < 0.01) return <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '6px 0' }}>Nada lançado neste mês.</p>;
  return (
    <div>
      {comValor.map(({ s, v }) => row(s, v))}
      {Math.abs(outros) > 0.01 && row('outros', outros, { outros: true })}
      {row('Total do mês', catTotalMes, { total: true })}
    </div>
  );
}

// Gráfico por subcategoria de UMA categoria: escolhe subs (chips) e vê por mês.
// Barras = empilhadas (acumulado do mês); Linhas = uma por sub. Eixo em múltiplos
// de 500. Só oferece subs que tiveram algum valor no ano.
function SubcatChart({ cat, meses, catTotalDe }) {
  const life = useLife();
  const subsAll = (life.gastoSubcats || {})[cat] || [];
  const itens = life.gastosItens || [];
  const valorDe = (sub, mes) => itens.filter(x => x.categoria === cat && x.mes === mes && x.nome === sub).reduce((a, x) => a + (Number(x.valor) || 0), 0);
  const outrosDe = (m) => Math.max(0, Math.round((catTotalDe(m) - subsAll.reduce((a, s) => a + valorDe(s, m), 0)) * 100) / 100);
  const subsComValor = subsAll.filter(s => meses.some(m => valorDe(s, m) > 0));
  const temOutros = meses.some(m => outrosDe(m) > 0.01);
  const opcoes = [...subsComValor, ...(temOutros ? ['__outros'] : [])]; // mesmas séries da tabela
  const valSerie = (s, m) => s === '__outros' ? outrosDe(m) : valorDe(s, m);
  const labelSerie = (s) => s === '__outros' ? 'outros' : s;
  const corDe = (s) => s === '__outros' ? '#b0b0b0' : GASTO_CORES[Math.max(0, subsAll.indexOf(s)) % GASTO_CORES.length];
  const [sels, setSels] = useState([]);
  const [tipo, setTipo] = useState('barras');
  const blur = useBlur();
  const toggle = (s) => setSels(x => x.includes(s) ? x.filter(y => y !== s) : [...x, s]);
  if (meses.length === 0 || opcoes.length === 0) return null;

  const W = 320, H = 172, padL = 40, padR = 10, padT = 12, padB = 26;
  const n = meses.length;
  const totalMes = (m) => sels.reduce((a, s) => a + valSerie(s, m), 0);
  const maxBar = Math.max(...meses.map(totalMes), 1);
  const maxLine = Math.max(...sels.flatMap(s => meses.map(m => valSerie(s, m))), 1);
  const max = sels.length ? (tipo === 'barras' ? maxBar : maxLine) : 1;
  const step = Math.max(500, Math.ceil(max / 4 / 500) * 500);
  const axisMax = Math.max(500, Math.ceil(max / step) * step);
  const y = (v) => (H - padB) - (v / axisMax) * (H - padT - padB);
  const ticks = []; for (let t = 0; t <= axisMax; t += step) ticks.push(t);
  const bandW = (W - padL - padR) / n;
  const xc = (i) => padL + bandW * (i + 0.5);
  const barW = Math.min(30, bandW * 0.55);
  const chip = (on, c, label, onClick) => (
    <button key={label} onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 14, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', border: '1px solid ' + (on ? (c || '#111') : '#e2e2e2'), background: on ? (c ? c + '1c' : '#1111110d') : '#fff', color: on ? '#333' : '#999' }}>{c && <span style={{ width: 9, height: 9, borderRadius: '50%', background: c, flexShrink: 0 }} />}{label}</button>
  );
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {chip(tipo === 'barras', null, 'barras', () => setTipo('barras'))}
        {chip(tipo === 'linhas', null, 'linhas', () => setTipo('linhas'))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke="#f0f0f0" strokeWidth="1" />
            <text x={padL - 4} y={y(t) + 3} textAnchor="end" fontSize="7.5" fill="#bbb" style={blur}>{fmtR(t)}</text>
          </g>
        ))}
        {meses.map((m, i) => <text key={m} x={xc(i)} y={H - 8} textAnchor="middle" fontSize="8" fill="#bbb">{MESES[+m.slice(5, 7) - 1].slice(0, 3)}</text>)}
        {sels.length === 0 ? (
          <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="10" fill="#ccc">escolha subcategorias abaixo</text>
        ) : tipo === 'barras' ? meses.map((m, i) => {
          let acc = H - padB;
          return <g key={m}>{sels.map(s => { const v = valSerie(s, m); const h = (v / axisMax) * (H - padT - padB); acc -= h; return h > 0.3 ? <rect key={s} x={xc(i) - barW / 2} y={acc} width={barW} height={h} fill={corDe(s)} /> : null; })}</g>;
        }) : sels.map(s => (
          <g key={s}>
            <path d={meses.map((m, i) => `${i ? 'L' : 'M'} ${xc(i).toFixed(1)} ${y(valSerie(s, m)).toFixed(1)}`).join(' ')} fill="none" stroke={corDe(s)} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {meses.map((m, i) => <circle key={m} cx={xc(i)} cy={y(valSerie(s, m))} r="2.4" fill={corDe(s)} />)}
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {opcoes.map(s => chip(sels.includes(s), corDe(s), labelSerie(s), () => toggle(s)))}
      </div>
    </div>
  );
}

// Tabela de evolução por SUBCATEGORIA (subs com valor + "outros") × meses. Mesmas
// linhas do gráfico e o Total bate com o total da categoria (vindo de Gastos).
function SubcatTabela({ cat, meses, catTotalDe }) {
  const life = useLife();
  const blurV = useBlur();
  const subsAll = (life.gastoSubcats || {})[cat] || [];
  const itens = life.gastosItens || [];
  const valorDe = (sub, m) => itens.filter(x => x.categoria === cat && x.mes === m && x.nome === sub).reduce((a, x) => a + (Number(x.valor) || 0), 0);
  const outrosDe = (m) => Math.round((catTotalDe(m) - subsAll.reduce((a, s) => a + valorDe(s, m), 0)) * 100) / 100;
  const cols = [...meses].reverse();
  const subsComValor = subsAll.filter(s => meses.some(m => valorDe(s, m) > 0));
  const temOutros = meses.some(m => Math.abs(outrosDe(m)) > 0.01);
  const fmt = (v) => v ? Math.round(Number(v)).toLocaleString('en-US') : '·';
  const mAbbr = (m) => MESES[+m.slice(5, 7) - 1].slice(0, 3);
  const stickyL = { position: 'sticky', left: 0, background: '#fff', zIndex: 1 };
  const th = { padding: '7px 10px', fontSize: 10.5, color: '#888', textTransform: 'uppercase', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', borderBottom: '2px solid #eee' };
  const td = { padding: '7px 10px', fontSize: 12.5, color: '#333', textAlign: 'right', whiteSpace: 'nowrap', borderBottom: '1px solid #f3f3f3' };
  const linha = (label, valDe, o = {}) => (
    <tr key={label}>
      <td style={{ ...td, ...stickyL, textAlign: 'left', fontWeight: o.total ? 700 : (o.outros ? 400 : 600), fontStyle: o.outros ? 'italic' : 'normal', color: o.total ? '#111' : (o.outros ? '#999' : '#222'), ...(o.total ? { borderTop: '2px solid #eee' } : {}) }}>{label}</td>
      {cols.map(m => { const v = valDe(m); return <td key={m} style={{ ...td, ...(o.total ? { fontWeight: 700, color: '#111', borderTop: '2px solid #eee' } : {}), ...(o.outros ? { color: '#999', fontStyle: 'italic' } : {}), ...(v ? blurV : null) }}>{fmt(v)}</td>; })}
    </tr>
  );
  return (
    <div style={{ overflowX: 'auto', marginBottom: 18, border: '1px solid #eee', borderRadius: 12 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead><tr>
          <th style={{ ...th, ...stickyL, textAlign: 'left' }}>sub</th>
          {cols.map(m => <th key={m} style={th}>{mAbbr(m)}</th>)}
        </tr></thead>
        <tbody>
          {subsComValor.map(s => linha(s, (m) => valorDe(s, m)))}
          {temOutros && linha('outros', outrosDe, { outros: true })}
          {linha('Total', catTotalDe, { total: true })}
        </tbody>
      </table>
    </div>
  );
}

// Barras por mês do total de uma categoria (usado nas categorias únicas — Uber e
// Mãe —, que não têm subcategorias pra quebrar). Eixo em múltiplos de 500.
function BarrasMes({ meses, valorDe, cor }) {
  const blur = useBlur();
  const [hi, setHi] = useState(null);
  if (!meses.length) return null;
  const W = 320, H = 150, padL = 40, padR = 10, padT = 12, padB = 26;
  const max = Math.max(...meses.map(valorDe), 1);
  const step = Math.max(500, Math.ceil(max / 4 / 500) * 500);
  const axisMax = Math.max(500, Math.ceil(max / step) * step);
  const y = (v) => (H - padB) - (v / axisMax) * (H - padT - padB);
  const ticks = []; for (let t = 0; t <= axisMax; t += step) ticks.push(t);
  const bandW = (W - padL - padR) / meses.length;
  const xc = (i) => padL + bandW * (i + 0.5);
  const barW = Math.min(30, bandW * 0.55);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', marginBottom: 10 }}>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke="#f0f0f0" strokeWidth="1" />
          <text x={padL - 4} y={y(t) + 3} textAnchor="end" fontSize="7.5" fill="#bbb" style={blur}>{fmtR(t)}</text>
        </g>
      ))}
      {meses.map((m, i) => {
        const v = valorDe(m), h = (v / axisMax) * (H - padT - padB);
        return (
          <g key={m}>
            {h > 0.3 && <rect x={xc(i) - barW / 2} y={y(v)} width={barW} height={h} rx="2" fill={cor} opacity={hi == null || hi === i ? 1 : 0.45}
              style={{ cursor: 'pointer' }} onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)} onClick={() => setHi(hi === i ? null : i)} />}
            <text x={xc(i)} y={H - 8} textAnchor="middle" fontSize="8" fill="#bbb">{MESES[+m.slice(5, 7) - 1].slice(0, 3)}</text>
            {hi === i && <text x={xc(i)} y={Math.max(9, y(v) - 4)} textAnchor="middle" fontSize="8" fontWeight="700" fill="#111" style={blur}>{fmtR(v)}</text>}
          </g>
        );
      })}
    </svg>
  );
}

// Acompanhamento: os principais números pra Mari controlar a vida financeira.
// Primeira leva (dá pra crescer): média do aluguel, maiores gastos do grupo
// "coisas" (Coisas/Roupa/Skin care/Bobeira/Presentes) e Rolês mais caros. Tudo
// do ano selecionado, puxando das subcategorias detalhadas.
function AcompanhamentoInsights({ anoSel, mesAtual }) {
  const life = useLife();
  const subcats = life.gastoSubcats || {};
  const doAno = (life.gastos || []).filter(g => (g.mes || '').slice(0, 4) === anoSel);
  const itensAno = (life.gastosItens || []).filter(x => (x.mes || '').slice(0, 4) === anoSel);
  const mesesAno = [...new Set(doAno.map(g => g.mes))].sort();
  const mesLbl = (m) => MESES[+m.slice(5, 7) - 1];
  // totais de categoria
  const catValMes = (cat, m) => (doAno.find(g => g.mes === m)?.itens || []).filter(i => i.categoria === cat).reduce((a, i) => a + (Number(i.valor) || 0), 0);
  const catTotalAno = (cat) => mesesAno.reduce((a, m) => a + catValMes(cat, m), 0);
  const totalAno = mesesAno.reduce((a, m) => a + (doAno.find(g => g.mes === m)?.itens || []).reduce((s, i) => s + (Number(i.valor) || 0), 0), 0);
  // subcategorias
  const subTotal = (cat, sub) => itensAno.filter(x => x.categoria === cat && x.nome === sub).reduce((a, x) => a + (Number(x.valor) || 0), 0);
  const subMeses = (cat, sub) => new Set(itensAno.filter(x => x.categoria === cat && x.nome === sub && (Number(x.valor) || 0) > 0).map(x => x.mes)).size;

  // 1) médias dos fixos (cada sub / meses em que apareceu)
  const mediasFixos = (subcats['Fixos'] || []).map(sub => { const n = subMeses('Fixos', sub); return { sub, media: n ? subTotal('Fixos', sub) / n : 0 }; }).filter(x => x.media > 0).sort((a, b) => b.media - a.media);
  // 2) este mês vs média (das outras ocorrências)
  const catMediaOutras = (cat) => { const vals = mesesAno.filter(m => m !== mesAtual).map(m => catValMes(cat, m)).filter(v => v > 0); return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0; };
  // TODAS as 13, do maior desvio pro menor. Sem base de comparação (categoria que
  // só apareceu neste mês, ou nunca) fica no fim, marcada — não é desvio, é estreia.
  const desvios = mesAtual ? GASTO_CATS.map(cat => {
    const v = catValMes(cat, mesAtual), med = catMediaOutras(cat);
    // Sem gasto no mês não é "100% abaixo" — não há o que comparar (ainda mais
    // num mês que mal começou). Idem sem histórico: é estreia, não desvio.
    if (v <= 0) return { cat, dev: null, nota: 'sem gasto' };
    if (med <= 0) return { cat, dev: null, nota: 'só neste mês' };
    return { cat, dev: (v - med) / med };
  }).sort((a, b) => {
    if (a.dev == null && b.dev == null) return a.nota === b.nota ? 0 : (a.nota === 'só neste mês' ? -1 : 1);
    if (a.dev == null) return 1;
    if (b.dev == null) return -1;
    return Math.abs(b.dev) - Math.abs(a.dev);
  }) : [];
  // 3) top 5 categorias do ano
  const topCats = GASTO_CATS.map(cat => ({ cat, total: catTotalAno(cat) })).filter(x => x.total > 0).sort((a, b) => b.total - a.total).slice(0, 5);
  // 4) essenciais vs extras
  // Grupos definidos pela Mari. Viagem fica no seu próprio grupo (pedido anterior);
  // juntos, os 5 cobrem as 13 categorias — não sobra "outros".
  const GRUPOS = [
    { id: 'ess', nome: 'essenciais', cor: '#54c08a', txt: '#3a9c6e', cats: ['Fixos', 'Mercado', 'Saúde'] },
    { id: 'ext', nome: 'extras', cor: '#ff8a3d', txt: '#d4762a', cats: ['Bobeira', 'Uber', 'Trabalho', 'Mãe', 'Presentes'] },
    { id: 'coi', nome: 'coisas', cor: '#c77dff', txt: '#8b4bbf', cats: ['Coisas', 'Roupa', 'Skin care'] },
    { id: 'rol', nome: 'rolês', cor: '#c2548f', txt: '#a03a71', cats: ['Rolês'] },
    { id: 'via', nome: 'viagem', cor: '#19b3a6', txt: '#14867d', cats: ['Viagem'] },
  ];
  const somaG = (arr) => arr.reduce((a, c) => a + catTotalAno(c), 0);
  const grupos = GRUPOS.map(g => ({ ...g, total: somaG(g.cats) }));
  const pct = (v) => totalAno ? Math.round(v / totalAno * 100) : 0;
  // 5) maior gasto único
  const maiorItem = itensAno.slice().sort((a, b) => (Number(b.valor) || 0) - (Number(a.valor) || 0))[0];
  // 6) meses mais caros + categoria que puxou
  const mesesCaros = mesesAno.map(m => { const its = doAno.find(g => g.mes === m)?.itens || []; const tot = its.reduce((s, i) => s + (Number(i.valor) || 0), 0); const top = [...its].sort((a, b) => (Number(b.valor) || 0) - (Number(a.valor) || 0))[0]; return { m, tot, top }; }).filter(x => x.tot > 0).sort((a, b) => b.tot - a.tot).slice(0, 3);
  // grupo "coisas" e rolês (pedidos originais)
  const GRUPO = ['Coisas', 'Roupa', 'Skin care', 'Bobeira', 'Presentes'];
  const gastosCoisas = [];
  GRUPO.forEach(cat => (subcats[cat] || []).forEach(sub => { const t = subTotal(cat, sub); if (t > 0) gastosCoisas.push({ cat, sub, total: t }); }));
  const top5Coisas = gastosCoisas.sort((a, b) => b.total - a.total).slice(0, 5);
  const topRoles = (subcats['Rolês'] || []).map(sub => ({ sub, total: subTotal('Rolês', sub) })).filter(x => x.total > 0).sort((a, b) => b.total - a.total).slice(0, 5);

  const box = { background: COR_GASTOS + '0a', border: '1px solid ' + COR_GASTOS + '22', borderRadius: 14, padding: '14px 16px', marginBottom: 12 };
  const titulo = { fontSize: 10.5, color: '#7a8494', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 700, marginBottom: 8, lineHeight: 1.4 };
  const linha = (esq, val, key) => (
    <div key={key || esq} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '3px 0', fontSize: 13, color: '#444' }}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{esq}</span>
      <V style={{ fontWeight: 700, color: '#222', whiteSpace: 'nowrap' }}>{fmtR(val)}</V>
    </div>
  );
  if (totalAno <= 0) return <p style={{ fontSize: 12.5, color: '#bbb', fontStyle: 'italic', padding: '4px 0', lineHeight: 1.6 }}>Lance seus gastos que aqui aparecem seus principais números.</p>;
  return (
    <div>
      {topCats.length > 0 && (
        <div style={box}>
          <div style={titulo}>Onde foi o dinheiro · top categorias · {anoSel}</div>
          {topCats.map((x, i) => linha(`${i + 1}. ${x.cat} · ${pct(x.total)}%`, x.total, x.cat))}
        </div>
      )}
      {totalAno > 0 && (
        <div style={box}>
          <div style={titulo}>Para onde vai · {anoSel}</div>
          <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
            {grupos.map(g => <div key={g.id} style={{ width: pct(g.total) + '%', background: g.cor }} />)}
          </div>
          <div style={{ fontSize: 12, color: '#666', display: 'flex', flexWrap: 'wrap', gap: '2px 12px' }}>
            {grupos.map(g => <span key={g.id}><b style={{ color: g.txt }}>{pct(g.total)}%</b> {g.nome}</span>)}
          </div>
          <div style={{ fontSize: 10.5, color: '#bbb', marginTop: 5, lineHeight: 1.55 }}>
            {grupos.filter(g => g.cats.length > 1).map(g => <span key={g.id}>{g.nome}: {g.cats.join(', ').toLowerCase()}<br /></span>)}
          </div>
        </div>
      )}
      {desvios.length > 0 && (
        <div style={box}>
          <div style={titulo}>Este mês vs sua média · {mesAtual ? mesLbl(mesAtual) : ''}</div>
          {desvios.map(x => (
            <div key={x.cat} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '3px 0', fontSize: 13, color: '#444' }}>
              <span>{x.cat}</span>
              {x.dev == null
                ? <span style={{ fontSize: 12, color: '#bbb', whiteSpace: 'nowrap', fontStyle: 'italic' }}>{x.nota}</span>
                : <span style={{ fontWeight: 700, color: Math.abs(x.dev) < 0.05 ? '#999' : (x.dev > 0 ? '#c0392b' : '#3a9c6e'), whiteSpace: 'nowrap' }}>
                    {Math.abs(x.dev) < 0.05 ? '≈ na média' : `${x.dev > 0 ? '▲' : '▼'} ${Math.abs(Math.round(x.dev * 100))}% ${x.dev > 0 ? 'acima' : 'abaixo'}`}
                  </span>}
            </div>
          ))}
        </div>
      )}
      {mesesCaros.length > 0 && (
        <div style={box}>
          <div style={titulo}>Meses mais caros · {anoSel}</div>
          {mesesCaros.map((x, i) => (
            <div key={x.m} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '3px 0', fontSize: 13, color: '#444' }}>
              <span>{i + 1}. <span style={{ textTransform: 'capitalize' }}>{mesLbl(x.m)}</span> {x.top && <span style={{ color: '#aaa', fontSize: 11.5 }}>· puxado por {x.top.categoria}</span>}</span>
              <V style={{ fontWeight: 700, color: '#222', whiteSpace: 'nowrap' }}>{fmtR(x.tot)}</V>
            </div>
          ))}
        </div>
      )}
      {mediasFixos.length > 0 && (
        <div style={box}>
          <div style={titulo}>Média mensal dos fixos · {anoSel}</div>
          {mediasFixos.map(x => linha(x.sub, x.media, 'f-' + x.sub))}
        </div>
      )}
      {maiorItem && (Number(maiorItem.valor) || 0) > 0 && (
        <div style={box}>
          <div style={titulo}>Maior gasto único · {anoSel}</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#111' }}><V>{fmtR(maiorItem.valor)}</V></div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{maiorItem.nome} · {maiorItem.categoria} · {mesLbl(maiorItem.mes)}</div>
        </div>
      )}
      {top5Coisas.length > 0 && (
        <div style={box}>
          <div style={titulo}>Maiores gastos · coisas, roupa, skin care, bobeira, presentes</div>
          {top5Coisas.map((x, i) => linha(`${i + 1}. ${x.sub} · ${x.cat}`, x.total, 'c-' + x.cat + x.sub))}
        </div>
      )}
      {topRoles.length > 0 && (
        <div style={box}>
          <div style={titulo}>Rolês mais caros · {anoSel}</div>
          {topRoles.map((x, i) => linha(`${i + 1}. ${x.sub}`, x.total, 'r-' + x.sub))}
        </div>
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
  const [editandoTudo, setEditandoTudo] = useState(false); // hub: editar todas de uma vez
  const [editando, setEditando] = useState(false);         // detalhe de UMA categoria: modo editar
  useEffect(() => { setTipoChart(null); setEditando(false); }, [catSel]);
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
          <p style={{ fontSize: 12.5, color: '#bbb', fontStyle: 'italic', margin: '0 0 12px' }}>Categoria única — sem subcategorias. Evolução mês a mês:</p>
          {linhas.length > 0 && <BarrasMes meses={[...linhas].map(l => l.mes).sort()} valorDe={(m) => (linhas.find(l => l.mes === m)?.valor || 0)} cor={cor} />}
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
        </> : <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button onClick={() => setEditando(e => !e)} style={{ border: '1px solid ' + (editando ? cor : '#e2e2e2'), background: editando ? cor + '1c' : '#fff', color: editando ? '#1a4d47' : '#888', borderRadius: 20, padding: '6px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>{editando ? '✓ concluir' : '✎ editar'}</button>
          </div>
          {editando
            ? <SubcatForm cat={catSel} mes={mesAtual} catTotalMes={catTotalMes} cor={cor} />
            : <SubcatLista cat={catSel} mes={mesAtual} catTotalMes={catTotalMes} />}
          {/* Abaixo da lista: tabela + gráfico por subcategoria, sobre os meses que
              existem em Gastos (não só os que já têm item — assim agosto aparece). */}
          {(() => {
            const catTotalDe = (m) => (doAno.find(g => g.mes === m)?.itens || []).filter(i => i.categoria === catSel).reduce((a, i) => a + (Number(i.valor) || 0), 0);
            const mesesCat = [...new Set(doAno.map(g => g.mes))].sort().filter(m => catTotalDe(m) > 0);
            if (!mesesCat.length) return null;
            return (
              <>
                <p style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, margin: '26px 0 8px' }}>evolução por subcategoria · {anoSel}</p>
                <SubcatTabela cat={catSel} meses={mesesCat} catTotalDe={catTotalDe} />
                <SubcatChart cat={catSel} meses={mesesCat} catTotalDe={catTotalDe} />
              </>
            );
          })()}
        </>}
      </div>
    );
  };

  // "Editar mês": todas as categorias (com subs) numa tela só, pra preencher tudo.
  const editarTudo = () => (
    <div style={{ paddingBottom: 20 }}>
      <button onClick={() => setEditandoTudo(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 14, padding: 0 }}>&larr; Gastos detalhados</button>
      <div style={{ width: 36, height: 4, background: COR_GASTOS, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#111', margin: '0 0 4px', textTransform: 'capitalize' }}>Editar {mesAtual ? fmtMesAno(mesAtual) : anoSel}</h2>
      <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 20px' }}>preencha as subcategorias · "outros" fecha o total sozinho</p>
      {GASTO_CATS.map(cat => {
        const subs = (life.gastoSubcats || {})[cat] || [];
        if (!subs.length) return null; // Uber/Mãe: sem subs
        const cor = catCor(cat);
        return (
          <div key={cat} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ width: 16, height: 4, background: cor, borderRadius: 4, flexShrink: 0 }} />
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#222' }}>{cat}</span>
              </span>
              <span style={{ fontSize: 12, color: '#aaa', whiteSpace: 'nowrap' }}>total <V>{fmtR(catMes[cat] || 0)}</V></span>
            </div>
            <SubcatForm cat={cat} mes={mesAtual} catTotalMes={catMes[cat] || 0} cor={cor} />
          </div>
        );
      })}
    </div>
  );

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
    if (editandoTudo) return editarTudo();
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
          <button onClick={() => setEditandoTudo(true)} style={{ display: 'block', width: '100%', border: '1px solid ' + COR_GASTOS + '55', background: COR_GASTOS + '10', color: '#3a4256', borderRadius: 12, padding: '11px 0', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>✎ editar {mesAtual ? fmtMesAno(mesAtual) : anoSel} — preencher tudo</button>
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
          <p style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, margin: '24px 0 8px' }}>acompanhamento</p>
          <AcompanhamentoInsights anoSel={anoSel} mesAtual={mesAtual} />
        </>}
      </div>
    );
  };

  return <PrivCtx.Provider value={!!oculto}>{conteudo()}</PrivCtx.Provider>;
}
