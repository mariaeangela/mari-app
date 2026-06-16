// Aba "Life": hub pessoal. Seção "Listas de compras" funcional; demais seções
// ainda em placeholder (vamos desenhar uma a uma).
import { useState, useEffect } from 'react';
import { useLife, MOEDAS, simboloMoeda } from './lifeStore.jsx';
import { useCalendar } from './calendarStore.jsx';
import { EXERCICIO_BY_ID } from './calendarConfig.js';

const SECOES = [
  { id: 'compras',        label: 'Compras',        desc: 'o que você quer comprar',          cor: '#ff8a3d' },
  { id: 'planos',         label: 'Planos',         desc: 'projetos com info + checklist',    cor: '#6b7a99' },
  { id: 'estudos',        label: 'Estudos',        desc: 'aulas, leituras, cursos',          cor: '#5c6bc0' },
  { id: 'aprendizados',   label: 'Aprendizados',   desc: 'o que você aprendeu',              cor: '#c78a3a' },
  { id: 'financas',       label: 'Vida Financeira', desc: 'metas, gastos, economia',         cor: '#54c08a' },
  { id: 'saude',          label: 'Saúde',          desc: 'consultas, exames, hábitos',       cor: '#d96459' },
  { id: 'viagens',        label: 'Viagens',        desc: 'pra onde e quando',                cor: '#19b3a6' },
  { id: 'cultural',       label: 'Cultura',        desc: 'exposições na cidade, até quando', cor: '#c2548f' },
  { id: 'retrospectivas', label: 'Retrospectivas', desc: 'seus números e marcos por mês e ano', cor: '#8d6e63' },
];

// estilos
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', color: '#222' };
const labelStyle = { fontSize: 11, color: '#999', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: 5, marginTop: 14 };
const overlay = { position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' };
const sheet = { background: '#fafafa', width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', borderRadius: '20px 20px 0 0', padding: '20px 20px 28px' };

const COR = '#ff8a3d';
const LISTAS_FIXAS = [{ id: 'geral', nome: 'Geral' }, { id: 'algumdia', nome: 'Algum dia' }, { id: 'internacional', nome: 'Internacional' }];
const fmtData = (s) => { const [y, m, d] = s.split('-'); return `${d}/${m}`; };

// ---- Vida financeira: helpers ----
const COR_FIN = '#54c08a';
const FIN_PALETTE = ['#54c08a', '#5c6bc0', '#ff8a3d', '#c2548f', '#19b3a6', '#c78a3a', '#8d6e63', '#6b7a99', '#a8516a', '#9844a7', '#2f746d', '#b24624'];
const MES_ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const fmtBRL = (n) => 'R$ ' + (Number(n) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtBRLcurto = (n) => { const v = Number(n) || 0; if (v >= 1e6) return 'R$ ' + (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'M'; if (v >= 1e3) return 'R$ ' + (v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'k'; return fmtBRL(v); };
const fmtMes = (ym) => { const [y, m] = ym.split('-'); return `${MES_ABREV[(+m) - 1]}/${y.slice(2)}`; };
const fmtMesLongo = (ym) => { const [y, m] = ym.split('-'); return `${MES_ABREV[(+m) - 1]} de ${y}`; };
const fmtUSD = (n) => 'US$ ' + (Number(n) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// Valor de um ativo em R$ (converte de USD pela cotação `rate` quando moeda === 'USD').
const valorBRL = (h, rate) => (h.moeda === 'USD' ? (Number(h.valor) || 0) * (Number(rate) || 0) : (Number(h.valor) || 0));
// Avalia o campo de valor: aceita conta simples (ex.: "1000+2500,50"). Vírgula vira
// ponto decimal; só permite dígitos e + - * / ( ) por segurança.
function evalValor(s) {
  const str = String(s == null ? '' : s).trim().replace(/,/g, '.');
  if (!str) return 0;
  if (!/^[0-9.+\-*/() ]+$/.test(str)) return NaN;
  try { const v = Function('"use strict";return(' + str + ')')(); return (typeof v === 'number' && isFinite(v)) ? v : NaN; }
  catch { return NaN; }
}
// Total da CARTEIRA (exclui itens marcados como `externo`, ex.: FGTS).
const totalCarteiraBRL = (holdings, rate) => (holdings || []).filter(h => !h.externo).reduce((s, h) => s + valorBRL(h, rate), 0);
// Cotação travada de cada mês (cada snapshot guarda a sua em `usdRate`).
const rateOf = (snap) => Number(snap?.usdRate) || 0;
// Busca a cotação USD→BRL: mês atual (ou futuro) usa a cotação ao vivo; mês passado
// usa o fechamento do último dia útil daquele mês (histórico da AwesomeAPI).
async function fetchUsdRate(mes) {
  try {
    const agora = new Date();
    const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
    if (!mes || mes >= mesAtual) {
      const j = await (await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL')).json();
      return parseFloat(j?.USDBRL?.bid) || null;
    }
    const [y, m] = mes.split('-');
    const ultimo = new Date(+y, +m, 0).getDate();
    const arr = await (await fetch(`https://economia.awesomeapi.com.br/json/daily/USD-BRL/?start_date=${y}${m}01&end_date=${y}${m}${String(ultimo).padStart(2, '0')}`)).json();
    return parseFloat(arr?.[0]?.bid) || null; // [0] = dia mais recente do intervalo
  } catch { return null; }
}

function ComprasForm({ editing, listaAtual, listas, onClose }) {
  const life = useLife();
  const [titulo, setTitulo] = useState(editing?.titulo || '');
  const [listaId, setListaId] = useState(editing?.listaId || listaAtual);
  const [orcamento, setOrcamento] = useState(editing?.orcamento || '');
  const [moeda, setMoeda] = useState(editing?.moeda || 'BRL');
  const [pais, setPais] = useState(editing?.pais || '');
  const [dataLimite, setDataLimite] = useState(editing?.dataLimite || '');
  const [links, setLinks] = useState(editing?.links?.length ? editing.links : ['']);

  const setLink = (i, v) => setLinks(links.map((l, j) => j === i ? v : l));
  const podeSalvar = titulo.trim().length > 0;
  const salvar = () => {
    if (!podeSalvar) return;
    const obj = {
      titulo: titulo.trim(), listaId,
      orcamento: orcamento || undefined,
      moeda,
      pais: pais.trim() || undefined,
      dataLimite: dataLimite || undefined,
      links: links.map(l => l.trim()).filter(Boolean),
    };
    if (editing) life.updateComprasItem({ ...editing, ...obj });
    else life.addComprasItem(obj);
    onClose();
  };

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar' : 'Nova compra'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>

        <label style={labelStyle}>O que comprar</label>
        <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="ex.: bolsa de couro preta" style={inputStyle} />

        <label style={labelStyle}>Lista</label>
        <select value={listaId} onChange={e => setListaId(e.target.value)} style={inputStyle}>
          {listas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
        </select>

        <label style={labelStyle}>Quanto posso gastar (opcional)</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={moeda} onChange={e => setMoeda(e.target.value)} style={{ ...inputStyle, width: 92, flexShrink: 0 }}>
            {MOEDAS.map(m => <option key={m.id} value={m.id}>{m.simbolo}</option>)}
          </select>
          <input type="number" inputMode="decimal" value={orcamento} onChange={e => setOrcamento(e.target.value)} placeholder="ex.: 500" style={inputStyle} />
        </div>

        <label style={labelStyle}>Em qual país comprar (opcional)</label>
        <input value={pais} onChange={e => setPais(e.target.value)} placeholder="ex.: Estados Unidos, Japão…" style={inputStyle} />

        <label style={labelStyle}>Data limite (opcional — deixe vazio se não tem)</label>
        <input type="date" value={dataLimite} onChange={e => setDataLimite(e.target.value)} style={inputStyle} />

        <label style={labelStyle}>Links (opcional)</label>
        {links.map((l, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input value={l} onChange={e => setLink(i, e.target.value)} placeholder="https://…" style={inputStyle} />
            {links.length > 1 && <button onClick={() => setLinks(links.filter((_, j) => j !== i))} style={{ border: '1px solid #e2e2e2', borderRadius: 10, background: '#fff', color: '#999', cursor: 'pointer', padding: '0 12px' }}>×</button>}
          </div>
        ))}
        <button onClick={() => setLinks([...links, ''])} style={{ background: 'none', border: 'none', color: COR, fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0 }}>+ outro link</button>

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          {editing && <button onClick={() => { life.deleteComprasItem(editing.id); onClose(); }} style={{ padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apagar</button>}
          <button onClick={salvar} disabled={!podeSalvar} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: 'none', background: podeSalvar ? '#111' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: podeSalvar ? 'pointer' : 'default' }}>{editing ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  );
}

function ComprasSection({ onBack }) {
  const life = useLife();
  const listas = [...LISTAS_FIXAS, ...life.compras.listas];
  const [listaSel, setListaSel] = useState('geral');
  const [form, setForm] = useState(null);      // { editing? }
  const [novaLista, setNovaLista] = useState('');
  const [criandoLista, setCriandoLista] = useState(false);

  const itens = life.compras.itens.filter(i => i.listaId === listaSel)
    .sort((a, b) => (a.comprado === b.comprado ? 0 : a.comprado ? 1 : -1));

  const criarLista = () => {
    if (!novaLista.trim()) { setCriandoLista(false); return; }
    const id = life.addComprasLista(novaLista.trim());
    setNovaLista(''); setCriandoLista(false); setListaSel(id);
  };

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: 620, margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Life</button>
      <div style={{ width: 36, height: 4, background: COR, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 16px' }}>Listas de compras</h2>

      {/* seletor de listas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', flex: 1, paddingBottom: 4 }}>
        {listas.map(l => (
          <button key={l.id} onClick={() => setListaSel(l.id)} style={{
            whiteSpace: 'nowrap', padding: '7px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
            border: '1px solid ' + (listaSel === l.id ? COR : '#e2e2e2'),
            background: listaSel === l.id ? COR + '1c' : '#fff', color: listaSel === l.id ? '#7a3d12' : '#888',
          }}>{l.nome}</button>
        ))}
        {criandoLista ? (
          <input autoFocus value={novaLista} onChange={e => setNovaLista(e.target.value)} onBlur={criarLista}
            onKeyDown={e => e.key === 'Enter' && criarLista()} placeholder="nome da lista" style={{ ...inputStyle, width: 140, flexShrink: 0, padding: '7px 12px' }} />
        ) : (
          <button onClick={() => setCriandoLista(true)} style={{ whiteSpace: 'nowrap', padding: '7px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0, border: '1px dashed #ccc', background: '#fff', color: '#999' }}>+ lista</button>
        )}
        </div>
        <button onClick={() => setForm({})} title="adicionar compra" style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>+</button>
      </div>

      {/* itens */}
      {itens.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#bbb', fontSize: 13, padding: '30px 0', fontStyle: 'italic' }}>Nada nesta lista ainda. Toque no + acima.</p>
      ) : itens.map(it => {
        const meta = [it.orcamento ? simboloMoeda(it.moeda) + ' ' + it.orcamento : null, it.pais || null, it.dataLimite ? fmtData(it.dataLimite) : null].filter(Boolean).join(' · ');
        return (
          <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '10px 12px', marginBottom: 6 }}>
            <span onClick={() => life.toggleComprado(it.id)} style={{ fontSize: 19, color: it.comprado ? '#54c08a' : '#ccc', cursor: 'pointer' }}>{it.comprado ? '☑' : '☐'}</span>
            <div onClick={() => setForm({ editing: it })} style={{ flex: 1, cursor: 'pointer' }}>
              <div style={{ fontSize: 14, color: '#222', textDecoration: it.comprado ? 'line-through' : 'none', opacity: it.comprado ? 0.5 : 1 }}>{it.titulo}</div>
              {meta && <div style={{ fontSize: 11.5, color: '#999', marginTop: 2 }}>{meta}</div>}
            </div>
            {(it.links || []).map((l, i) => (
              <a key={i} href={l} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: COR, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>↗</a>
            ))}
          </div>
        );
      })}

      {form && <ComprasForm editing={form.editing} listaAtual={listaSel} listas={listas} onClose={() => setForm(null)} />}
    </div>
  );
}

const COR_PLANOS = '#6b7a99';

function InfoForm({ planoId, editing, onClose }) {
  const life = useLife();
  const [titulo, setTitulo] = useState(editing?.titulo || '');
  const [texto, setTexto] = useState(editing?.texto || '');
  const podeSalvar = titulo.trim() || texto.trim();
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar' : 'Nova informação'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>
        <label style={labelStyle}>Título</label>
        <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="ex.: Segurança em primeiro lugar" style={inputStyle} />
        <label style={labelStyle}>Texto</label>
        <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={6} style={{ ...inputStyle, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          {editing && <button onClick={() => { life.deletePlanoInfo(editing.id); onClose(); }} style={{ padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apagar</button>}
          <button onClick={() => { if (podeSalvar) { life.savePlanoInfo({ id: editing?.id, planoId, titulo: titulo.trim(), texto: texto.trim() }); onClose(); } }} disabled={!podeSalvar} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: 'none', background: podeSalvar ? '#111' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: podeSalvar ? 'pointer' : 'default' }}>{editing ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  );
}

function PlanoView({ plano, onBack }) {
  const life = useLife();
  const [aba, setAba] = useState('info');
  const [infoForm, setInfoForm] = useState(null);
  const [infoAberta, setInfoAberta] = useState(null);
  const [novoCheck, setNovoCheck] = useState('');
  const infos = life.planos.infos.filter(i => i.planoId === plano.id);
  const checks = life.planos.itens.filter(i => i.planoId === plano.id).sort((a, b) => (a.feito ? 1 : 0) - (b.feito ? 1 : 0));
  const feitos = checks.filter(c => c.feito).length;
  const addCheck = () => { if (novoCheck.trim()) { life.addPlanoCheck(plano.id, novoCheck.trim()); setNovoCheck(''); } };

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: 620, margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Planos</button>
      <div style={{ width: 36, height: 4, background: COR_PLANOS, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 10px' }}>{plano.nome}</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 12.5, color: '#888' }}>
        <span>Prazo (opcional):</span>
        <input type="date" value={plano.prazo || ''} onChange={e => life.setPlanoPrazo(plano.id, e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '5px 10px', fontSize: 13 }} />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[['info', 'Informações'], ['check', `Check list${checks.length ? ` (${feitos}/${checks.length})` : ''}`]].map(([id, label]) => (
          <button key={id} onClick={() => setAba(id)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
            border: '1px solid ' + (aba === id ? COR_PLANOS : '#e2e2e2'), background: aba === id ? COR_PLANOS + '1c' : '#fff', color: aba === id ? '#3e4a5e' : '#888',
          }}>{label}</button>
        ))}
      </div>

      {aba === 'info' && (
        <>
          {infos.length === 0 && <p style={{ color: '#bbb', fontSize: 13, fontStyle: 'italic', padding: '20px 0' }}>Sem informações ainda.</p>}
          {infos.map(info => {
            const aberta = infoAberta === info.id;
            return (
              <div key={info.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
                <div onClick={() => setInfoAberta(aberta ? null : info.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', cursor: 'pointer' }}>
                  <span style={{ flex: 1, fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: '#222' }}>{info.titulo}</span>
                  <span style={{ color: '#bbb', fontSize: 13 }}>{aberta ? '▾' : '▸'}</span>
                </div>
                {aberta && (
                  <div style={{ padding: '0 14px 14px' }}>
                    <p style={{ fontFamily: "'Lora', serif", fontSize: 14, lineHeight: 1.7, color: '#333', whiteSpace: 'pre-line', margin: 0 }}>{info.texto}</p>
                    <button onClick={() => setInfoForm({ editing: info })} style={{ background: 'none', border: 'none', color: COR_PLANOS, fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '8px 0 0' }}>editar</button>
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={() => setInfoForm({})} style={{ width: '100%', marginTop: 8, padding: '11px 0', borderRadius: 11, border: '1px dashed #bbb', background: '#fff', color: '#555', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ informação</button>
        </>
      )}

      {aba === 'check' && (
        <>
          {checks.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '10px 12px', marginBottom: 6 }}>
              <span onClick={() => life.togglePlanoCheck(c.id)} style={{ fontSize: 19, color: c.feito ? '#54c08a' : '#ccc', cursor: 'pointer' }}>{c.feito ? '☑' : '☐'}</span>
              <span style={{ flex: 1, fontSize: 14, color: '#222', textDecoration: c.feito ? 'line-through' : 'none', opacity: c.feito ? 0.5 : 1 }}>{c.texto}</span>
              <span onClick={() => life.deletePlanoCheck(c.id)} style={{ color: '#ccc', cursor: 'pointer', fontSize: 16 }}>×</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <input value={novoCheck} onChange={e => setNovoCheck(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCheck()} placeholder="novo item do checklist" style={inputStyle} />
            <button onClick={addCheck} style={{ border: 'none', borderRadius: 10, background: '#111', color: '#fff', cursor: 'pointer', padding: '0 16px', fontSize: 18 }}>+</button>
          </div>
        </>
      )}

      {infoForm && <InfoForm planoId={plano.id} editing={infoForm.editing} onClose={() => setInfoForm(null)} />}
    </div>
  );
}

function PlanosSection({ onBack }) {
  const life = useLife();
  const [planoSel, setPlanoSel] = useState(null);
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState('');

  if (planoSel) {
    const p = life.planos.lista.find(x => x.id === planoSel);
    if (p) return <PlanoView plano={p} onBack={() => setPlanoSel(null)} />;
  }
  const criar = () => { if (!nome.trim()) { setCriando(false); return; } const id = life.addPlano(nome.trim()); setNome(''); setCriando(false); setPlanoSel(id); };

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: 620, margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Life</button>
      <div style={{ width: 36, height: 4, background: COR_PLANOS, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 16px' }}>Planos</h2>
      {life.planos.lista.map(p => {
        const total = life.planos.itens.filter(i => i.planoId === p.id).length;
        const feitos = life.planos.itens.filter(i => i.planoId === p.id && i.feito).length;
        return (
          <button key={p.id} onClick={() => setPlanoSel(p.id)} style={{ display: 'block', width: '100%', textAlign: 'left', background: COR_PLANOS + '12', border: '1px solid ' + COR_PLANOS + '33', borderRadius: 14, padding: '16px 16px', marginBottom: 8, cursor: 'pointer' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#222' }}>{p.nome}</div>
            {total > 0 && <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{feitos}/{total} no checklist</div>}
          </button>
        );
      })}
      {criando ? (
        <input autoFocus value={nome} onChange={e => setNome(e.target.value)} onBlur={criar} onKeyDown={e => e.key === 'Enter' && criar()} placeholder="nome do plano" style={inputStyle} />
      ) : (
        <button onClick={() => setCriando(true)} style={{ width: '100%', marginTop: 4, padding: '11px 0', borderRadius: 11, border: '1px dashed #bbb', background: '#fff', color: '#555', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ novo plano</button>
      )}
    </div>
  );
}

const COR_CULTURAL = '#c2548f';
const CULT_TIPOS = [
  { id: 'exposicao', label: 'Exposição' }, { id: 'teatro', label: 'Teatro' },
  { id: 'filme', label: 'Filme' }, { id: 'evento', label: 'Evento' },
];
const cultTipoLabel = (id) => CULT_TIPOS.find(t => t.id === id)?.label || 'Evento';
const DIAS_SEM = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_ABREV = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const fmtHora = (h) => h ? h.replace(':00', 'h').replace(':', 'h') : '';
// Formata o funcionamento (objeto novo {dias,abre,fecha} ou string antiga).
function fmtFuncionamento(f) {
  if (!f) return '';
  if (typeof f === 'string') return f;
  const { dias = [], abre, fecha } = f;
  let d = '';
  if (dias.length) {
    const set = [...dias].sort((a, b) => a - b);
    if (set.length === 7) d = 'todo dia';
    else if (set.length === 6) d = 'fecha ' + DIAS_ABREV[[0, 1, 2, 3, 4, 5, 6].find(x => !set.includes(x))];
    else {
      let contig = true;
      for (let i = 1; i < set.length; i++) if (set[i] !== set[i - 1] + 1) contig = false;
      d = (contig && set.length >= 2) ? DIAS_ABREV[set[0]] + ' a ' + DIAS_ABREV[set[set.length - 1]] : set.map(x => DIAS_ABREV[x]).join(', ');
    }
  }
  const h = (abre || fecha) ? [fmtHora(abre), fmtHora(fecha)].filter(Boolean).join('–') : '';
  return [d, h].filter(Boolean).join(' · ');
}

function CulturalForm({ editing, onClose }) {
  const life = useLife();
  const [nome, setNome] = useState(editing?.nome || '');
  const [tipo, setTipo] = useState(editing?.tipo || 'exposicao');
  const [cidade, setCidade] = useState(editing?.cidade || '');
  const [local, setLocal] = useState(editing?.local || '');
  const [dataMax, setDataMax] = useState(editing?.dataMax || '');
  const [preco, setPreco] = useState(editing?.preco || '');
  const [link, setLink] = useState(editing?.link || '');
  const f0 = (editing && typeof editing.funcionamento === 'object') ? editing.funcionamento : {};
  const [dias, setDias] = useState(f0.dias || []);
  const [abre, setAbre] = useState(f0.abre || '');
  const [fecha, setFecha] = useState(f0.fecha || '');
  const toggleDia = (i) => setDias(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]);
  const podeSalvar = nome.trim().length > 0;
  const salvar = () => {
    if (!podeSalvar) return;
    const func = (dias.length || abre || fecha) ? { dias: [...dias].sort((a, b) => a - b), abre: abre || undefined, fecha: fecha || undefined } : undefined;
    life.saveCulturalItem({
      id: editing?.id, nome: nome.trim(), tipo,
      cidade: cidade.trim() || undefined, local: local.trim() || undefined,
      dataMax: dataMax || undefined, preco: preco.trim() || undefined,
      link: link.trim() || undefined,
      funcionamento: func,
    });
    onClose();
  };
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar' : 'Novo em cartaz'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>
        <label style={labelStyle}>O quê</label>
        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="ex.: Tarsila Popular" style={inputStyle} />
        <label style={labelStyle}>Tipo</label>
        <select value={tipo} onChange={e => setTipo(e.target.value)} style={inputStyle}>
          {CULT_TIPOS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <label style={labelStyle}>Cidade</label>
        <input value={cidade} onChange={e => setCidade(e.target.value)} placeholder="ex.: São Paulo" style={inputStyle} />
        <label style={labelStyle}>Local (opcional)</label>
        <input value={local} onChange={e => setLocal(e.target.value)} placeholder="ex.: MASP" style={inputStyle} />
        <label style={labelStyle}>Em cartaz até (opcional)</label>
        <input type="date" value={dataMax} onChange={e => setDataMax(e.target.value)} style={inputStyle} />
        <label style={labelStyle}>Preço (opcional)</label>
        <input value={preco} onChange={e => setPreco(e.target.value)} placeholder="ex.: R$ 40 · grátis" style={inputStyle} />
        <label style={labelStyle}>Link (opcional)</label>
        <input value={link} onChange={e => setLink(e.target.value)} placeholder="https://…" style={inputStyle} />
        <label style={labelStyle}>Dias de funcionamento (opcional)</label>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {DIAS_SEM.map((d, i) => {
            const on = dias.includes(i);
            return (
              <button key={i} onClick={() => toggleDia(i)} style={{
                padding: '7px 11px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                border: '1.5px solid ' + (on ? COR_CULTURAL : '#e2e2e2'),
                background: on ? COR_CULTURAL + '22' : '#fff', color: on ? '#6a2350' : '#999',
              }}>{d}</button>
            );
          })}
        </div>
        <label style={labelStyle}>Horário (opcional)</label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="time" value={abre} onChange={e => setAbre(e.target.value)} style={inputStyle} />
          <span style={{ color: '#999', fontSize: 13 }}>às</span>
          <input type="time" value={fecha} onChange={e => setFecha(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          {editing && <button onClick={() => { life.deleteCulturalItem(editing.id); onClose(); }} style={{ padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apagar</button>}
          <button onClick={salvar} disabled={!podeSalvar} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: 'none', background: podeSalvar ? '#111' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: podeSalvar ? 'pointer' : 'default' }}>{editing ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  );
}

function CulturalSection({ onBack }) {
  const life = useLife();
  const [form, setForm] = useState(null);
  const [cidadeSel, setCidadeSel] = useState('todas');
  const [tipoSel, setTipoSel] = useState('todos');
  const cidades = [...new Set(life.cultural.itens.map(i => i.cidade).filter(Boolean))].sort();
  const itens = life.cultural.itens
    .filter(i => (cidadeSel === 'todas' || i.cidade === cidadeSel) && (tipoSel === 'todos' || i.tipo === tipoSel))
    .sort((a, b) => (a.dataMax || '9999-99-99').localeCompare(b.dataMax || '9999-99-99'));

  const chip = (ativo, label, onClick) => (
    <button key={label} onClick={onClick} style={{
      whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
      border: '1px solid ' + (ativo ? COR_CULTURAL : '#e2e2e2'), background: ativo ? COR_CULTURAL + '1c' : '#fff', color: ativo ? '#6a2350' : '#888',
    }}>{label}</button>
  );

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: 620, margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Life</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: 36, height: 4, background: COR_CULTURAL, borderRadius: 4, marginBottom: 10 }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: 0 }}>Calendário cultural</h2>
        </div>
        <button onClick={() => setForm({})} title="adicionar" style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>+</button>
      </div>

      {/* filtros */}
      {cidades.length > 0 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 8 }}>
          {chip(cidadeSel === 'todas', 'Todas as cidades', () => setCidadeSel('todas'))}
          {cidades.map(c => chip(cidadeSel === c, c, () => setCidadeSel(c)))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
        {chip(tipoSel === 'todos', 'Todos', () => setTipoSel('todos'))}
        {CULT_TIPOS.map(t => chip(tipoSel === t.id, t.label, () => setTipoSel(t.id)))}
      </div>

      {/* lista (ordenada pela data que acaba antes) */}
      {itens.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#bbb', fontSize: 13, padding: '30px 0', fontStyle: 'italic' }}>Nada em cartaz por aqui. Toque no + para adicionar.</p>
      ) : itens.map(it => {
        const meta = [it.local, it.dataMax ? 'até ' + fmtData(it.dataMax) : null, it.preco, fmtFuncionamento(it.funcionamento) || null].filter(Boolean).join(' · ');
        return (
          <div key={it.id} onClick={() => setForm({ editing: it })} style={{ width: '100%', textAlign: 'left', background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '11px 13px', marginBottom: 6, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ flex: 1, fontSize: 14.5, color: '#222', fontWeight: 600 }}>{it.nome}</span>
              {it.link && <a href={it.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: COR_CULTURAL, fontWeight: 700, textDecoration: 'none', fontSize: 15, flexShrink: 0 }}>↗</a>}
              <span style={{ fontSize: 10, fontWeight: 700, color: COR_CULTURAL, textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>{cultTipoLabel(it.tipo)}</span>
            </div>
            <div style={{ fontSize: 11.5, color: '#999', marginTop: 3 }}>{[it.cidade, meta].filter(Boolean).join(' · ')}</div>
          </div>
        );
      })}

      {form && <CulturalForm editing={form.editing} onClose={() => setForm(null)} />}
    </div>
  );
}

// ---- Vida financeira ----
// Gráfico de pizza (SVG) por categoria.
function PizzaFin({ fatias, hover, setHover }) {
  const total = fatias.reduce((s, f) => s + f.valor, 0);
  const cx = 90, cy = 90, r = 82;
  if (total <= 0) return null;
  let acc = -Math.PI / 2;
  const arco = (start, end) => {
    const p = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    const [x1, y1] = p(start), [x2, y2] = p(end);
    const big = end - start > Math.PI ? 1 : 0;
    return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${big} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
  };
  const on = (i) => ({ style: { cursor: 'pointer' }, onMouseEnter: () => setHover(i), onMouseLeave: () => setHover(null), onClick: () => setHover(hover === i ? null : i) });
  return (
    <svg viewBox="0 0 180 180" style={{ width: 180, height: 180, flexShrink: 0 }}>
      {fatias.length === 1
        ? <circle cx={cx} cy={cy} r={r} fill={fatias[0].cor} {...on(0)} />
        : fatias.map((f, i) => {
          const start = acc, end = acc + (f.valor / total) * 2 * Math.PI; acc = end;
          return <path key={i} d={arco(start, end)} fill={f.cor} stroke={hover === i ? '#111' : '#fafafa'} strokeWidth={hover === i ? 2 : 1.5} opacity={hover == null || hover === i ? 1 : 0.5} {...on(i)} />;
        })}
    </svg>
  );
}

// Gráfico de linha (SVG) — total por mês.
function EvolucaoFin({ pontos }) {
  const W = 320, H = 150, padX = 14, padTop = 14, padBot = 26;
  const max = Math.max(...pontos.map(p => p.total), 1);
  const n = pontos.length;
  const x = (i) => n === 1 ? W / 2 : padX + i * (W - 2 * padX) / (n - 1);
  const y = (v) => (H - padBot) - (v / max) * (H - padTop - padBot);
  const linha = pontos.map((p, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(p.total).toFixed(1)}`).join(' ');
  const pulado = n > 6;
  const [hi, setHi] = useState(null);
  const rw = 90, rh = 28;
  const tip = hi != null && pontos[hi] ? (() => {
    const px = x(hi), py = y(pontos[hi].total);
    const tx = Math.max(rw / 2 + 2, Math.min(W - rw / 2 - 2, px));
    const above = py - rh - 8 >= 0;
    return { tx, ry: above ? py - 8 - rh : py + 8, p: pontos[hi] };
  })() : null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      <path d={linha} fill="none" stroke="#111" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      {pontos.map((p, i) => (
        <g key={i}>
          {(!pulado || i % 2 === 0 || i === n - 1) &&
            <text x={x(i)} y={H - 9} textAnchor="middle" fontSize="9" fill="#bbb">{fmtMes(p.mes)}</text>}
          <circle cx={x(i)} cy={y(p.total)} r={hi === i ? 4 : 2.4} fill="#111" stroke="#fafafa" strokeWidth="1" />
          <circle cx={x(i)} cy={y(p.total)} r="11" fill="transparent" style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)} onClick={() => setHi(hi === i ? null : i)} />
        </g>
      ))}
      {tip && (
        <g pointerEvents="none">
          <rect x={tip.tx - rw / 2} y={tip.ry} width={rw} height={rh} rx="5" fill="#111" opacity="0.92" />
          <text x={tip.tx} y={tip.ry + 11} textAnchor="middle" fontSize="8" fill="#bbb">{fmtMes(tip.p.mes)}</text>
          <text x={tip.tx} y={tip.ry + 22} textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">{fmtBRL(tip.p.total)}</text>
        </g>
      )}
    </svg>
  );
}

function LinhaAtivo({ h, denom, rate, pctLabel, hideFin }) {
  const v = valorBRL(h, rate);
  const pct = denom ? (v / denom * 100) : 0;
  const sub = [h.categoria, hideFin ? null : h.finalidade, h.moeda === 'USD' ? fmtUSD(h.valor) : null].filter(Boolean).join(' · ');
  return (
    <tr style={{ borderBottom: '1px solid #f3f3f3' }}>
      <td style={{ padding: '10px 6px' }}>
        <div style={{ color: '#222', fontWeight: 600 }}>{h.nome}</div>
        {sub && <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{sub}</div>}
      </td>
      <td style={{ padding: '10px 6px', textAlign: 'right', color: '#333', whiteSpace: 'nowrap' }}>{fmtBRL(v)}</td>
      <td style={{ padding: '10px 6px', textAlign: 'right', color: '#999', whiteSpace: 'nowrap' }} title={pctLabel}>{pct.toFixed(1)}%</td>
    </tr>
  );
}

// Ordem das finalidades na tabela: Reserva → Investimento → Aposta → (demais por valor).
const FIN_ORDEM = ['reserva', 'investimento', 'aposta'];
const finRank = (f) => { const low = (f || '').toLowerCase().trim(); for (let i = 0; i < FIN_ORDEM.length; i++) if (low.startsWith(FIN_ORDEM[i])) return i; return FIN_ORDEM.length; };
// Agrupa por finalidade (na ordem acima); dentro de cada uma, mantém as classes
// (categoria) juntas — classes maiores primeiro, e por valor desc.
function gruposPorFinalidade(holdings, rate) {
  const map = {};
  holdings.forEach(h => { const f = (h.finalidade || '').trim() || 'Sem finalidade'; (map[f] = map[f] || []).push(h); });
  return Object.entries(map).map(([fin, hs]) => {
    const catTotal = {};
    hs.forEach(h => { const c = (h.categoria || '').trim(); catTotal[c] = (catTotal[c] || 0) + valorBRL(h, rate); });
    const rows = [...hs].sort((a, b) => {
      const ca = (a.categoria || '').trim(), cb = (b.categoria || '').trim();
      if (ca !== cb) return (catTotal[cb] - catTotal[ca]) || ca.localeCompare(cb);
      return valorBRL(b, rate) - valorBRL(a, rate);
    });
    return { fin, total: hs.reduce((s, h) => s + valorBRL(h, rate), 0), rows };
  }).sort((a, b) => (finRank(a.fin) - finRank(b.fin)) || (b.total - a.total));
}
// Soma os ativos por categoria, virando linhas-resumo (valor já em R$).
const agregarCat = (rows, rate) => Object.values(rows.reduce((acc, h) => {
  const c = (h.categoria || '').trim() || 'Sem categoria';
  (acc[c] = acc[c] || { id: 'agg-' + c, nome: c, categoria: '', moeda: 'BRL', valor: 0 }).valor += valorBRL(h, rate);
  return acc;
}, {})).sort((a, b) => b.valor - a.valor);

function FinTabela({ holdings, rate }) {
  const [modo, setModo] = useState('categoria');
  const carteira = holdings.filter(h => !h.externo);
  const externos = [...holdings].filter(h => h.externo).sort((a, b) => (finRank(a.finalidade) - finRank(b.finalidade)) || (valorBRL(b, rate) - valorBRL(a, rate)));
  const total = carteira.reduce((s, h) => s + valorBRL(h, rate), 0);
  if (!carteira.length && !externos.length) return <p style={{ color: '#bbb', fontStyle: 'italic', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Sem ativos neste mês.</p>;
  const grupos = gruposPorFinalidade(carteira, rate);
  const thStyle = { color: '#aaa', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 };
  return (
    <>
      {carteira.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {[['categoria', 'Por categoria'], ['ativo', 'Por ativo']].map(([k, txt]) => (
            <button key={k} onClick={() => setModo(k)} style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid ' + (modo === k ? COR_FIN : '#e2e2e2'), background: modo === k ? COR_FIN + '1c' : '#fff', color: modo === k ? '#1a7a4f' : '#888' }}>{txt}</button>
          ))}
        </div>
      )}
      {carteira.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid #eee' }}>
              <th style={{ ...thStyle, textAlign: 'left', padding: '8px 6px' }}>Ativo</th>
              <th style={{ ...thStyle, textAlign: 'right', padding: '8px 6px' }}>Valor</th>
              <th style={{ ...thStyle, textAlign: 'right', padding: '8px 6px', width: 52 }}>%</th>
            </tr>
          </thead>
          {grupos.map(g => {
            const linhas = modo === 'categoria' ? agregarCat(g.rows, rate) : g.rows;
            return (
              <tbody key={g.fin}>
                <tr style={{ background: '#fafafa' }}>
                  <td colSpan={2} style={{ padding: '9px 6px 5px', fontSize: 11.5, fontWeight: 700, color: '#888', textTransform: 'capitalize', letterSpacing: '0.3px' }}>{g.fin}</td>
                  <td style={{ padding: '9px 6px 5px', textAlign: 'right', fontSize: 11.5, fontWeight: 700, color: '#888' }}>{total ? (g.total / total * 100).toFixed(0) : 0}%</td>
                </tr>
                {linhas.map((h, i) => <LinhaAtivo key={h.id || i} h={h} denom={total} rate={rate} hideFin />)}
              </tbody>
            );
          })}
          <tfoot>
            <tr style={{ borderTop: '2px solid #eee', fontWeight: 700 }}>
              <td style={{ padding: '10px 6px', color: '#111' }}>Total da carteira</td>
              <td style={{ padding: '10px 6px', textAlign: 'right', color: '#1a7a4f', whiteSpace: 'nowrap' }}>{fmtBRL(total)}</td>
              <td style={{ padding: '10px 6px', textAlign: 'right', color: '#999' }}>100%</td>
            </tr>
          </tfoot>
        </table>
      )}
      {externos.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <p style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px', fontWeight: 600 }}>Fora da carteira</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #eee' }}>
                <th style={{ ...thStyle, textAlign: 'left', padding: '8px 6px' }}>Item</th>
                <th style={{ ...thStyle, textAlign: 'right', padding: '8px 6px' }}>Valor</th>
                <th style={{ ...thStyle, textAlign: 'right', padding: '8px 6px', width: 64 }}>% da carteira</th>
              </tr>
            </thead>
            <tbody>
              {externos.map((h, i) => <LinhaAtivo key={h.id || i} h={h} denom={total} rate={rate} pctLabel="em relação ao total da carteira" />)}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function FinPizza({ fatias, total }) {
  const [hover, setHover] = useState(null);
  if (!fatias.length || total <= 0) return <p style={{ color: '#bbb', fontStyle: 'italic', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Sem dados pra exibir.</p>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center', justifyContent: 'center' }}>
      <PizzaFin fatias={fatias} hover={hover} setHover={setHover} />
      <div style={{ flex: 1, minWidth: 190 }}>
        {fatias.map((f, i) => (
          <div key={i}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(hover === i ? null : i)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px', borderRadius: 7, cursor: 'pointer', background: hover === i ? COR_FIN + '14' : 'transparent' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: f.cor, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#333', flex: 1, fontWeight: hover === i ? 700 : 400 }}>{f.label}</span>
            <span style={{ fontSize: 12.5, color: '#999', width: 46, textAlign: 'right' }}>{(f.valor / total * 100).toFixed(1)}%</span>
            <span style={{ fontSize: 12.5, color: '#555', width: 92, textAlign: 'right' }}>{fmtBRLcurto(f.valor)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FinEvolucao({ snaps }) {
  const ativos = [...new Set(snaps.flatMap(s => (s.holdings || []).map(h => h.nome).filter(Boolean)))];
  const categorias = [...new Set(snaps.flatMap(s => (s.holdings || []).filter(h => !h.externo && h.categoria).map(h => h.categoria)))];
  const finalidades = [...new Set(snaps.flatMap(s => (s.holdings || []).filter(h => !h.externo && h.finalidade).map(h => h.finalidade)))];
  const DIMS = [
    ['carteira', 'Carteira'],
    ...(ativos.length ? [['ativo', 'Por ativo']] : []),
    ...(categorias.length ? [['categoria', 'Por categoria']] : []),
    ...(finalidades.length ? [['finalidade', 'Por finalidade']] : []),
  ];
  const [dim, setDim] = useState('carteira');
  const [item, setItem] = useState('');
  const itens = dim === 'ativo' ? ativos : dim === 'categoria' ? categorias : dim === 'finalidade' ? finalidades : [];
  const itemAtivo = dim === 'carteira' ? null : (itens.includes(item) ? item : itens[0]);

  const pontos = snaps.map(s => {
    const r = rateOf(s);
    let total;
    if (dim === 'carteira') total = totalCarteiraBRL(s.holdings, r);
    else if (dim === 'ativo') total = (s.holdings || []).filter(h => h.nome === itemAtivo).reduce((a, h) => a + valorBRL(h, r), 0);
    else if (dim === 'categoria') total = (s.holdings || []).filter(h => !h.externo && h.categoria === itemAtivo).reduce((a, h) => a + valorBRL(h, r), 0);
    else total = (s.holdings || []).filter(h => !h.externo && h.finalidade === itemAtivo).reduce((a, h) => a + valorBRL(h, r), 0);
    return { mes: s.mes, total };
  });
  const linhas = [...pontos].reverse();
  const chip = (on) => ({ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, border: '1px solid ' + (on ? COR_FIN : '#e2e2e2'), background: on ? COR_FIN + '1c' : '#fff', color: on ? '#1a7a4f' : '#888' });

  return (
    <div>
      {DIMS.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {DIMS.map(([k, txt]) => <button key={k} onClick={() => setDim(k)} style={chip(dim === k)}>{txt}</button>)}
        </div>
      )}
      {dim !== 'carteira' && itens.length > 0 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14, paddingBottom: 4 }}>
          {itens.map(it => <button key={it} onClick={() => setItem(it)} style={chip(itemAtivo === it)}>{it}</button>)}
        </div>
      )}
      {pontos.length < 2 ? (
        <p style={{ color: '#bbb', fontStyle: 'italic', fontSize: 13, textAlign: 'center', padding: '20px 0', lineHeight: 1.6 }}>Adicione pelo menos dois meses pra ver a evolução.</p>
      ) : (
        <>
          <EvolucaoFin pontos={pontos} />
          <div style={{ marginTop: 16 }}>
            {linhas.map((p, i) => {
              const prev = linhas[i + 1];
              const delta = prev ? p.total - prev.total : null;
              const pct = prev && prev.total ? (delta / prev.total * 100) : null;
              const up = delta != null && delta >= 0;
              return (
                <div key={p.mes} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f3f3f3' }}>
                  <span style={{ fontSize: 13, color: '#444', width: 70, textTransform: 'capitalize' }}>{fmtMes(p.mes)}</span>
                  <span style={{ fontSize: 13.5, color: '#222', fontWeight: 600, flex: 1 }}>{fmtBRL(p.total)}</span>
                  {pct != null && <span style={{ fontSize: 12.5, fontWeight: 700, color: up ? '#1a7a4f' : '#c0392b' }}>{up ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%</span>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function FinancasForm({ editing, snaps, onClose }) {
  const life = useLife();
  const hojeMes = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
  const novaRow = () => ({ nome: '', categoria: '', finalidade: '', valor: '', moeda: 'BRL', externo: false });
  const [mes, setMes] = useState(editing?.mes || hojeMes());
  const [rows, setRows] = useState(editing?.holdings?.length ? editing.holdings.map(h => ({ ...h, finalidade: h.finalidade || '', valor: String(h.valor), moeda: h.moeda || 'BRL', externo: !!h.externo })) : [novaRow()]);
  const [usdRate, setUsdRate] = useState(editing?.usdRate ? String(editing.usdRate) : '');
  const [buscandoR, setBuscandoR] = useState(false);
  const cats = [...new Set(snaps.flatMap(s => (s.holdings || []).map(h => h.categoria).filter(Boolean)))];
  const fins = [...new Set(snaps.flatMap(s => (s.holdings || []).map(h => h.finalidade).filter(Boolean)))];
  const temUSDrow = rows.some(r => r.moeda === 'USD');
  const buscarR = async () => { setBuscandoR(true); const b = await fetchUsdRate(mes); if (b) setUsdRate(b.toFixed(4)); setBuscandoR(false); };

  const setRow = (i, k, v) => setRows(rows.map((r, j) => j === i ? { ...r, [k]: v } : r));
  const addRow = () => setRows([...rows, novaRow()]);
  const delRow = (i) => setRows(rows.filter((_, j) => j !== i));

  const limpos = rows.filter(r => r.nome.trim() && evalValor(r.valor) > 0);
  const podeSalvar = mes && limpos.length > 0;

  const salvar = () => {
    if (!podeSalvar) return;
    const existente = !editing && snaps.find(s => s.mes === mes);
    const snap = {
      id: editing?.id || existente?.id,
      mes,
      usdRate: Number(usdRate) || undefined,
      holdings: limpos.map((r, i) => ({ id: r.id || ('h' + Date.now().toString(36) + i), nome: r.nome.trim(), categoria: r.categoria.trim(), finalidade: (r.finalidade || '').trim() || undefined, valor: evalValor(r.valor), moeda: r.moeda === 'USD' ? 'USD' : 'BRL', externo: !!r.externo })),
    };
    life.saveFinancasSnapshot(snap);
    onClose();
  };

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar mês' : 'Novo mês'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>

        <label style={labelStyle}>Mês</label>
        <input type="month" value={mes} onChange={e => setMes(e.target.value)} style={inputStyle} />

        <label style={labelStyle}>Ativos</label>
        <datalist id="fin-cats">{cats.map(c => <option key={c} value={c} />)}</datalist>
        <datalist id="fin-fins">{fins.map(c => <option key={c} value={c} />)}</datalist>
        {rows.map((r, i) => (
          <div key={i} style={{ border: '1px solid #eee', borderRadius: 11, padding: 10, marginBottom: 8, background: '#fff' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
              <input value={r.nome} onChange={e => setRow(i, 'nome', e.target.value)} placeholder="nome do ativo" style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
              <button onClick={() => delRow(i)} title="remover" style={{ background: 'none', border: 'none', color: '#ccc', fontSize: 22, cursor: 'pointer', flexShrink: 0, padding: '0 2px' }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
              <input list="fin-cats" value={r.categoria} onChange={e => setRow(i, 'categoria', e.target.value)} placeholder="categoria (ex.: Ações)" style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
              <input list="fin-fins" value={r.finalidade} onChange={e => setRow(i, 'finalidade', e.target.value)} placeholder="finalidade (ex.: Aposentadoria)" style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <select value={r.moeda} onChange={e => setRow(i, 'moeda', e.target.value)} style={{ ...inputStyle, width: 66, flexShrink: 0, padding: '10px 6px' }}>
                <option value="BRL">R$</option>
                <option value="USD">US$</option>
              </select>
              <input type="text" inputMode="text" value={r.valor} onChange={e => setRow(i, 'valor', e.target.value)} placeholder="valor (ex.: 1000+2500)" style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
            </div>
            {/[+\-*/]/.test(r.valor) && (() => {
              const v = evalValor(r.valor);
              return <div style={{ fontSize: 11.5, color: isFinite(v) ? '#1a7a4f' : '#c0392b', textAlign: 'right', marginTop: 4 }}>{isFinite(v) ? '= ' + (r.moeda === 'USD' ? fmtUSD(v) : fmtBRL(v)) : 'conta inválida'}</div>;
            })()}
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, fontSize: 12.5, color: '#777', cursor: 'pointer' }}>
              <input type="checkbox" checked={r.externo} onChange={e => setRow(i, 'externo', e.target.checked)} style={{ width: 15, height: 15, accentColor: COR_FIN }} />
              fora da carteira (ex.: FGTS — não entra no total/pizza)
            </label>
          </div>
        ))}
        <button onClick={addRow} style={{ background: 'none', border: '1px dashed #ccc', borderRadius: 9, padding: '9px 0', width: '100%', color: '#999', fontSize: 13, cursor: 'pointer', marginTop: 2 }}>+ ativo</button>

        {temUSDrow && (
          <>
            <label style={labelStyle}>Cotação do dólar neste mês (US$ 1 = R$)</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="number" inputMode="decimal" step="0.0001" value={usdRate} onChange={e => setUsdRate(e.target.value)} placeholder="ex.: 5,40" style={{ ...inputStyle, flex: 1 }} />
              <button onClick={buscarR} disabled={buscandoR} style={{ background: '#fff', border: '1px solid ' + COR_FIN + '55', color: '#1a7a4f', borderRadius: 9, padding: '10px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{buscandoR ? 'buscando…' : '↻ buscar'}</button>
            </div>
            <p style={{ fontSize: 11, color: '#aaa', margin: '4px 2px 0', lineHeight: 1.5 }}>buscar usa a cotação atual no mês corrente; nos meses passados, o fechamento do último dia do mês.</p>
          </>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {editing && <button onClick={() => { life.deleteFinancasSnapshot(editing.id); onClose(); }} style={{ padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apagar</button>}
          <button onClick={salvar} disabled={!podeSalvar} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: 'none', background: podeSalvar ? '#111' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: podeSalvar ? 'pointer' : 'default' }}>{editing ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  );
}

function FinancasSection({ onBack }) {
  const life = useLife();
  const snaps = [...life.financas.snapshots].sort((a, b) => a.mes.localeCompare(b.mes));
  const [view, setView] = useState('tabela');
  const [selId, setSelId] = useState(null);
  const [form, setForm] = useState(null);
  const [rate, setRate] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [sub, setSub] = useState('carteira');

  const atual = snaps.find(s => s.id === selId) || snaps[snaps.length - 1] || null;
  const atualTemUSD = (atual?.holdings || []).some(h => h.moeda === 'USD');
  const agora = new Date();
  const mesAtualStr = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
  const ehMesCorrente = atual && atual.mes >= mesAtualStr;

  // Campo de cotação reflete o mês selecionado (cada mês trava a sua).
  useEffect(() => { setRate(atual?.usdRate ? String(atual.usdRate) : ''); }, [atual?.id]); // eslint-disable-line
  const rateNum = Number(rate) || 0;

  const salvarRate = (n) => { if (atual && n > 0) life.saveFinancasSnapshot({ ...atual, usdRate: n }); };
  const persistRate = () => salvarRate(Number(rate));
  const buscarDolar = async () => {
    if (!atual) return;
    setBuscando(true);
    const b = await fetchUsdRate(atual.mes);
    if (b) { setRate(b.toFixed(4)); salvarRate(b); }
    setBuscando(false);
  };

  const total = atual ? totalCarteiraBRL(atual.holdings, rateNum) : 0;

  const [pizzaGroup, setPizzaGroup] = useState('categoria');
  const temFinalidade = (atual?.holdings || []).some(h => !h.externo && h.finalidade);
  const pizzaOpcoes = [['nome', 'Por ativo'], ['categoria', 'Por categoria'], ...(temFinalidade ? [['finalidade', 'Por finalidade']] : []), ...(atualTemUSD ? [['moeda', 'Por moeda']] : [])];
  const FALLBACK_LABEL = { nome: 'Sem nome', categoria: 'Sem categoria', finalidade: 'Sem finalidade' };
  const MOEDA_LABEL = { USD: 'Dólar (US$)', BRL: 'Reais (R$)' };
  const grupoAtivo = pizzaOpcoes.some(([k]) => k === pizzaGroup) ? pizzaGroup : 'categoria';
  const agrupar = (campo) => {
    const m = {};
    (atual?.holdings || []).filter(h => !h.externo).forEach(h => {
      const c = campo === 'moeda' ? MOEDA_LABEL[h.moeda === 'USD' ? 'USD' : 'BRL'] : ((h[campo] || '').trim() || FALLBACK_LABEL[campo]);
      m[c] = (m[c] || 0) + valorBRL(h, rateNum);
    });
    return Object.entries(m).map(([label, valor]) => ({ label, valor })).sort((a, b) => b.valor - a.valor)
      .map((f, i) => ({ ...f, cor: FIN_PALETTE[i % FIN_PALETTE.length] }));
  };

  const tabBtn = (id, txt) => (
    <button onClick={() => setView(id)} style={{
      flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
      background: view === id ? COR_FIN : '#eee', color: view === id ? '#fff' : '#888',
    }}>{txt}</button>
  );

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: 640, margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Life</button>
      <div style={{ width: 36, height: 4, background: COR_FIN, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 12px' }}>Vida Financeira</h2>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[['carteira', 'Carteira'], ['salarios', 'Salários'], ['gastos', 'Gastos']].map(([k, txt]) => (
          <button key={k} onClick={() => setSub(k)} style={{ flex: 1, padding: '9px 6px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, background: sub === k ? COR_FIN : '#eee', color: sub === k ? '#fff' : '#888' }}>{txt}</button>
        ))}
      </div>

      {sub === 'salarios' && <SalariosVida />}
      {sub === 'gastos' && <GastosVida />}

      {sub === 'carteira' && (<>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <p style={{ fontSize: 12.5, color: '#999', margin: 0 }}>carteira de investimentos · valores convertidos para R$</p>
        <button onClick={() => setForm({})} title="adicionar mês" style={{ width: 40, height: 40, borderRadius: 11, border: 'none', background: '#111', color: '#fff', fontSize: 22, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>+</button>
      </div>

      {snaps.length === 0 ? (
        <div style={{ marginTop: 12, padding: 24, borderRadius: 16, background: COR_FIN + '10', border: '1px dashed ' + COR_FIN + '55', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 16, color: '#555', margin: 0 }}>Nenhum mês ainda.</p>
          <p style={{ fontSize: 13, color: '#999', marginTop: 8, lineHeight: 1.6 }}>Toque no + pra adicionar a carteira do mês — ou me mande como ela está que eu preencho.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', flex: 1, paddingBottom: 4 }}>
              {[...snaps].reverse().map(s => (
                <button key={s.id} onClick={() => setSelId(s.id)} style={{
                  whiteSpace: 'nowrap', padding: '7px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                  border: '1px solid ' + (atual.id === s.id ? COR_FIN : '#e2e2e2'),
                  background: atual.id === s.id ? COR_FIN + '1c' : '#fff', color: atual.id === s.id ? '#1a7a4f' : '#888',
                }}>{fmtMes(s.mes)}</button>
              ))}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 10.5, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>total</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#1a7a4f' }}>{fmtBRL(total)}</div>
            </div>
          </div>

          {atualTemUSD && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16, padding: '10px 12px', background: COR_FIN + '10', borderRadius: 11, fontSize: 12.5, color: '#555' }}>
              <span style={{ fontWeight: 700 }}>Dólar em {fmtMes(atual.mes)}:</span>
              <span>US$ 1 = R$</span>
              <input type="number" inputMode="decimal" step="0.0001" value={rate} onChange={e => setRate(e.target.value)} onBlur={persistRate} placeholder="5,40" style={{ ...inputStyle, width: 84, padding: '6px 8px', flexShrink: 0 }} />
              <button onClick={buscarDolar} disabled={buscando} style={{ background: '#fff', border: '1px solid ' + COR_FIN + '55', color: '#1a7a4f', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{buscando ? 'buscando…' : '↻ buscar'}</button>
              <span style={{ width: '100%', marginTop: 2, color: rateNum ? '#aaa' : '#c0392b' }}>
                {rateNum ? (ehMesCorrente ? 'cotação atual (atualizável)' : 'travada no fechamento do mês') : 'defina a cotação para converter os ativos em dólar.'}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
            {tabBtn('tabela', 'Tabela')}
            {tabBtn('pizza', 'Pizza')}
            {tabBtn('evolucao', 'Evolução')}
          </div>

          {view === 'tabela' && <FinTabela holdings={atual.holdings} rate={rateNum} />}
          {view === 'pizza' && (
            <>
              {pizzaOpcoes.length > 1 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  {pizzaOpcoes.map(([g, txt]) => (
                    <button key={g} onClick={() => setPizzaGroup(g)} style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid ' + (grupoAtivo === g ? COR_FIN : '#e2e2e2'), background: grupoAtivo === g ? COR_FIN + '1c' : '#fff', color: grupoAtivo === g ? '#1a7a4f' : '#888' }}>{txt}</button>
                  ))}
                </div>
              )}
              <FinPizza fatias={agrupar(grupoAtivo)} total={total} />
            </>
          )}
          {view === 'evolucao' && <FinEvolucao snaps={snaps} />}

          <button onClick={() => setForm({ editing: atual })} style={{ marginTop: 22, background: 'none', border: '1px solid #ddd', borderRadius: 10, padding: '9px 14px', fontSize: 12.5, color: '#777', cursor: 'pointer' }}>Editar {fmtMesLongo(atual.mes)}</button>
        </>
      )}

      {form && <FinancasForm editing={form.editing} snaps={snaps} onClose={() => setForm(null)} />}
      </>)}
    </div>
  );
}

// ---- Salários vida (histórico de renda anual) ----
const SAL_MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
function BarrasSalario({ barras }) {
  const [hi, setHi] = useState(null);
  const W = 320, H = 110, padTop = 12, padBot = 18;
  const n = barras.length;
  const gap = n > 14 ? 2 : 5;
  const max = Math.max(...barras.map(b => b.valor), 1);
  const bw = n > 0 ? (W - (n - 1) * gap) / n : W;
  const tip = hi != null ? barras[hi] : null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      {barras.map((b, i) => {
        const bh = Math.max(1, (b.valor / max) * (H - padTop - padBot));
        const x = i * (bw + gap), y = H - padBot - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} rx="2" fill="#111" opacity={hi == null || hi === i ? 1 : 0.4}
              style={{ cursor: 'pointer' }} onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)} onClick={() => setHi(hi === i ? null : i)} />
            {(n <= 14 || i % 2 === 0) && <text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize="7.5" fill="#bbb">{b.label}</text>}
          </g>
        );
      })}
      {tip && (() => {
        const bh = Math.max(1, (tip.valor / max) * (H - padTop - padBot));
        const cxp = hi * (bw + gap) + bw / 2, y = H - padBot - bh;
        const rw = 84, rh = 26, tx = Math.max(rw / 2 + 2, Math.min(W - rw / 2 - 2, cxp)), ry = Math.max(0, y - rh - 4);
        return (
          <g pointerEvents="none">
            <rect x={tx - rw / 2} y={ry} width={rw} height={rh} rx="5" fill="#111" opacity="0.92" />
            <text x={tx} y={ry + 11} textAnchor="middle" fontSize="8" fill="#bbb">{tip.full}</text>
            <text x={tx} y={ry + 21} textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">{fmtBRL(tip.valor)}</text>
          </g>
        );
      })()}
    </svg>
  );
}

function SalariosVida() {
  const life = useLife();
  const [aberto, setAberto] = useState(null);
  const [abertoP, setAbertoP] = useState(null);
  const [modo, setModo] = useState('ganhos');
  const [form, setForm] = useState(null);

  let acc = 0, prevTotal = null;
  const anos = life.salarios.map(a => {
    const total = a.meses.reduce((s, v) => s + (Number(v) || 0), 0) + (Number(a.extra) || 0) + (Number(a.bonus) || 0);
    acc += total;
    const yoy = a.yoy != null ? a.yoy : (prevTotal ? (total / prevTotal - 1) * 100 : null);
    prevTotal = total;
    return { ...a, total, media: total / 12, vida: acc, yoyCalc: yoy };
  });
  const vidaTotal = acc;
  const maxTotal = Math.max(...anos.map(a => a.total), 1);
  const plPrev = (ano) => { const idx = anos.findIndex(a => a.ano === ano); for (let j = idx - 1; j >= 0; j--) if (anos[j].pl != null) return anos[j].pl; return 0; };

  const snaps2026 = [...life.financas.snapshots].filter(s => s.mes.startsWith('2026')).sort((x, y) => x.mes.localeCompare(y.mes));
  const mesesPL = snaps2026.map(s => ({ mes: s.mes, valor: totalCarteiraBRL(s.holdings, rateOf(s)) }));
  // Patrimônio por ano: anos fechados (pl) + 2026 (último ponto); 2026 guarda os meses.
  const patrimonioAnos = anos.filter(a => a.ano < 2026 && a.pl != null).map(a => ({ ano: a.ano, valor: a.pl, meses: null }));
  if (mesesPL.length) patrimonioAnos.push({ ano: 2026, valor: mesesPL[mesesPL.length - 1].valor, meses: mesesPL });
  else { const a26 = anos.find(a => a.ano === 2026); if (a26 && a26.pl != null) patrimonioAnos.push({ ano: 2026, valor: a26.pl, meses: null }); }

  // Destaques do ano corrente (último ano da lista)
  const cy = anos[anos.length - 1] || {};
  const plAtual = mesesPL.length ? mesesPL[mesesPL.length - 1].valor : (cy.pl != null ? cy.pl : 0);
  const plAnoAnt = (() => { for (let j = anos.length - 2; j >= 0; j--) if (anos[j].pl != null) return anos[j].pl; return 0; })();
  const poupouAno = cy.total ? (plAtual - plAnoAnt) / cy.total * 100 : 0;
  const metaPL = Number(cy.metaPL) || 0;
  const metaProg = metaPL ? plAtual / metaPL * 100 : 0;

  const barrasGanhos = anos.map(a => ({ label: "'" + String(a.ano).slice(2), full: String(a.ano), valor: a.total }));
  const barrasPatr = patrimonioAnos.map(p => ({ label: "'" + String(p.ano).slice(2), full: String(p.ano), valor: p.valor }));

  const chip = (k, txt) => <button onClick={() => setModo(k)} style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: modo === k ? COR_FIN : '#eee', color: modo === k ? '#fff' : '#888' }}>{txt}</button>;
  const rowMes = { display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '5px 0', borderBottom: '1px solid #f5f5f5' };
  const destaque = (rotulo, valor, sub, subCor, prog) => (
    <div style={{ flex: 1, background: '#fafafa', borderRadius: 12, padding: '11px 12px', minWidth: 0 }}>
      <div style={{ fontSize: 9.5, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.3px', lineHeight: 1.25 }}>{rotulo}</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#111', marginTop: 4, lineHeight: 1 }}>{valor}</div>
      {sub && <div style={{ fontSize: 10.5, color: subCor || '#999', marginTop: 3, fontWeight: subCor ? 700 : 400 }}>{sub}</div>}
      {prog != null && <div style={{ height: 4, background: '#e8e8e8', borderRadius: 4, marginTop: 6, overflow: 'hidden' }}><div style={{ height: '100%', width: Math.min(100, Math.max(0, prog)) + '%', background: '#1a7a4f', borderRadius: 4 }} /></div>}
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {chip('ganhos', 'Ganhos por ano')}
        {chip('patrimonio', 'Patrimônio por ano')}
      </div>

      {modo === 'ganhos' ? (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {destaque('ganhei em ' + (cy.ano || ''), fmtBRLcurto(cy.total || 0))}
            {destaque('poupei em ' + (cy.ano || ''), poupouAno.toFixed(0) + '%')}
            {metaPL > 0 && destaque('meta de PL', fmtBRLcurto(metaPL), metaProg.toFixed(0) + '% atingido', '#1a7a4f', metaProg)}
          </div>
          <BarrasSalario barras={barrasGanhos} />
          <p style={{ fontSize: 12, color: '#999', textAlign: 'center', margin: '8px 0 0' }}>ganho na vida <b style={{ color: '#555' }}>{fmtBRL(vidaTotal)}</b> · {anos.length} anos</p>
          <div style={{ marginTop: 18 }}>
            {[...anos].reverse().map(a => {
              const exp = aberto === a.ano;
              const sav = a.pl != null ? (a.pl - plPrev(a.ano)) / a.total * 100 : null;
              return (
                <div key={a.ano} style={{ border: '1px solid #eee', borderRadius: 12, marginBottom: 8, overflow: 'hidden', background: '#fff' }}>
                  <div onClick={() => setAberto(exp ? null : a.ano)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer' }}>
                    <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 40 }}>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, fontWeight: 700, color: '#111', lineHeight: 1 }}>{a.ano}</div>
                      <div style={{ fontSize: 9.5, color: '#aaa', marginTop: 2 }}>{a.idade} anos</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: '#333', fontWeight: 600 }}>{a.cargo}</div>
                      <div style={{ fontSize: 11.5, color: '#999', marginTop: 2 }}>média {fmtBRLcurto(a.media)}/mês{sav != null ? ` · poupou ${sav.toFixed(0)}%` : ''}</div>
                      <div style={{ height: 4, background: '#f0f0f0', borderRadius: 4, marginTop: 6, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: (a.total / maxTotal * 100) + '%', background: '#111', borderRadius: 4 }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: '#111', whiteSpace: 'nowrap' }}>{fmtBRLcurto(a.total)}</div>
                      {a.yoyCalc != null && <div style={{ fontSize: 11.5, fontWeight: 700, color: a.yoyCalc >= 0 ? '#1a7a4f' : '#c0392b' }}>{a.yoyCalc >= 0 ? '▲' : '▼'} {Math.abs(a.yoyCalc).toFixed(0)}%</div>}
                    </div>
                  </div>
                  {exp && (
                    <div style={{ padding: '0 14px 12px', borderTop: '1px solid #f3f3f3' }}>
                      <div style={{ marginTop: 8 }}>
                        {a.meses.map((v, mi) => (
                          <div key={mi} style={{ ...rowMes, color: v ? '#444' : '#ccc' }}>
                            <span style={{ textTransform: 'capitalize' }}>{SAL_MESES[mi]}</span><span>{v ? fmtBRL(v) : '—'}</span>
                          </div>
                        ))}
                        {a.extra > 0 && <div style={{ ...rowMes, color: '#444' }}><span>extra</span><span>{fmtBRL(a.extra)}</span></div>}
                        {a.bonus > 0 && <div style={{ ...rowMes, color: '#444' }}><span>bônus</span><span>{fmtBRL(a.bonus)}</span></div>}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '1px solid #eee', fontSize: 13, fontWeight: 700, color: '#111' }}>
                        <span>Total do ano</span><span>{fmtBRL(a.total)}</span>
                      </div>
                      {a.pl != null && <div style={{ fontSize: 11.5, color: '#999', marginTop: 6 }}>patrimônio no fim do ano: {fmtBRL(a.pl)}</div>}
                      <button onClick={() => setForm({ editing: a })} style={{ marginTop: 12, background: 'none', border: '1px solid #ddd', borderRadius: 9, padding: '8px 14px', fontSize: 12.5, color: '#777', cursor: 'pointer' }}>Editar {a.ano}</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button onClick={() => setForm({ novo: true })} style={{ background: 'none', border: '1px dashed #ccc', borderRadius: 10, padding: '11px 0', width: '100%', color: '#999', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>+ adicionar ano</button>
        </>
      ) : (
        <>
          <BarrasSalario barras={barrasPatr} />
          <div style={{ marginTop: 16 }}>
            {patrimonioAnos.length === 0 ? (
              <p style={{ color: '#bbb', fontStyle: 'italic', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Sem patrimônio registrado ainda.</p>
            ) : [...patrimonioAnos].reverse().map((p, i, arr) => {
              const prev = arr[i + 1];
              const pct = prev && prev.valor ? (p.valor - prev.valor) / prev.valor * 100 : null;
              const temMeses = p.meses && p.meses.length > 0;
              const exp = abertoP === p.ano;
              return (
                <div key={p.ano} style={{ border: '1px solid #eee', borderRadius: 12, marginBottom: 8, overflow: 'hidden', background: '#fff' }}>
                  <div onClick={temMeses ? () => setAbertoP(exp ? null : p.ano) : undefined} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: temMeses ? 'pointer' : 'default' }}>
                    <div style={{ flexShrink: 0, minWidth: 40 }}>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, fontWeight: 700, color: '#111', lineHeight: 1 }}>{p.ano}</div>
                      <div style={{ fontSize: 9.5, color: '#aaa', marginTop: 2 }}>{temMeses ? 'mês a mês' : 'fim do ano'}</div>
                    </div>
                    <div style={{ flex: 1 }} />
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: '#111', whiteSpace: 'nowrap' }}>{fmtBRL(p.valor)}</div>
                      {pct != null && <div style={{ fontSize: 11.5, fontWeight: 700, color: pct >= 0 ? '#1a7a4f' : '#c0392b' }}>{pct >= 0 ? '▲' : '▼'} {Math.abs(pct).toFixed(0)}%</div>}
                    </div>
                  </div>
                  {exp && temMeses && (
                    <div style={{ padding: '0 14px 12px', borderTop: '1px solid #f3f3f3' }}>
                      <div style={{ marginTop: 8 }}>
                        {[...p.meses].reverse().map((m, mi, ma) => {
                          const pm = ma[mi + 1];
                          const dpct = pm && pm.valor ? (m.valor - pm.valor) / pm.valor * 100 : null;
                          return (
                            <div key={m.mes} style={{ ...rowMes, color: '#444', alignItems: 'center' }}>
                              <span style={{ textTransform: 'capitalize' }}>{fmtMes(m.mes)}</span>
                              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                {dpct != null && <span style={{ fontSize: 11, fontWeight: 700, color: dpct >= 0 ? '#1a7a4f' : '#c0392b' }}>{dpct >= 0 ? '▲' : '▼'} {Math.abs(dpct).toFixed(1)}%</span>}
                                <b>{fmtBRL(m.valor)}</b>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: '#aaa', marginTop: 8, lineHeight: 1.5 }}>anos fechados pelo patrimônio do fim do ano; 2026 pelos meses salvos na carteira (toque pra abrir).</p>
        </>
      )}

      {form && <SalarioForm editing={form.editing} onClose={() => setForm(null)} />}
    </div>
  );
}

function SalarioForm({ editing, onClose }) {
  const life = useLife();
  const [ano, setAno] = useState(editing?.ano ? String(editing.ano) : '');
  const [idade, setIdade] = useState(editing?.idade != null ? String(editing.idade) : '');
  const [cargo, setCargo] = useState(editing?.cargo || '');
  const [meses, setMeses] = useState(editing ? editing.meses.map(v => v ? String(v) : '') : Array(12).fill(''));
  const [extra, setExtra] = useState(editing?.extra ? String(editing.extra) : '');
  const [bonus, setBonus] = useState(editing?.bonus ? String(editing.bonus) : '');
  const [pl, setPl] = useState(editing?.pl != null ? String(editing.pl) : '');
  const [metaPL, setMetaPL] = useState(editing?.metaPL != null ? String(editing.metaPL) : '');
  const setMes = (i, v) => setMeses(meses.map((x, j) => j === i ? v : x));
  const podeSalvar = Number(ano) >= 2000;
  const salvar = () => {
    if (!podeSalvar) return;
    life.saveSalarioAno({
      ...(editing || {}),
      ano: Number(ano), idade: Number(idade) || undefined, cargo: cargo.trim(),
      meses: meses.map(v => evalValor(v) || 0),
      extra: evalValor(extra) || 0, bonus: evalValor(bonus) || 0,
      pl: Number(pl) > 0 ? evalValor(pl) : undefined,
      metaPL: Number(metaPL) > 0 ? evalValor(metaPL) : undefined,
    });
    onClose();
  };
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar ano' : 'Novo ano'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}><label style={labelStyle}>Ano</label><input type="number" value={ano} onChange={e => setAno(e.target.value)} placeholder="2026" style={inputStyle} /></div>
          <div style={{ flex: 1 }}><label style={labelStyle}>Idade</label><input type="number" value={idade} onChange={e => setIdade(e.target.value)} placeholder="27" style={inputStyle} /></div>
        </div>
        <label style={labelStyle}>Cargo / empresa</label>
        <input value={cargo} onChange={e => setCargo(e.target.value)} placeholder="ex.: Analista — Research" style={inputStyle} />
        <label style={labelStyle}>Ganhos por mês (R$ · aceita conta)</label>
        {meses.map((v, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ width: 32, fontSize: 12.5, color: '#888', textTransform: 'capitalize' }}>{SAL_MESES[i]}</span>
            <input type="text" inputMode="text" value={v} onChange={e => setMes(i, e.target.value)} placeholder="0" style={{ ...inputStyle, flex: 1 }} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}><label style={labelStyle}>Extra</label><input type="text" value={extra} onChange={e => setExtra(e.target.value)} placeholder="0" style={inputStyle} /></div>
          <div style={{ flex: 1 }}><label style={labelStyle}>Bônus</label><input type="text" value={bonus} onChange={e => setBonus(e.target.value)} placeholder="0" style={inputStyle} /></div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}><label style={labelStyle}>Patrimônio fim do ano</label><input type="text" value={pl} onChange={e => setPl(e.target.value)} placeholder="ex.: 80325" style={inputStyle} /></div>
          <div style={{ flex: 1 }}><label style={labelStyle}>Meta de patrimônio</label><input type="text" value={metaPL} onChange={e => setMetaPL(e.target.value)} placeholder="ex.: 400000" style={inputStyle} /></div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {editing && <button onClick={() => { life.deleteSalarioAno(editing.ano); onClose(); }} style={{ padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apagar</button>}
          <button onClick={salvar} disabled={!podeSalvar} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: 'none', background: podeSalvar ? '#111' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: podeSalvar ? 'pointer' : 'default' }}>{editing ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  );
}

function TabelaGastos({ meses, cats, totalDe, valor }) {
  const cols = [...meses].reverse(); // mês mais recente primeiro
  const cell = { padding: '6px 8px', fontSize: 11.5, whiteSpace: 'nowrap', textAlign: 'right' };
  const stick = { position: 'sticky', left: 0, background: '#fff', textAlign: 'left' };
  return (
    <div style={{ overflowX: 'auto', marginTop: 4, border: '1px solid #f0f0f0', borderRadius: 10 }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 11.5, minWidth: '100%' }}>
        <thead>
          <tr style={{ borderBottom: '1.5px solid #eee' }}>
            <th style={{ ...cell, ...stick, color: '#aaa', fontWeight: 600 }}>Categoria</th>
            {cols.map(m => <th key={m.mes} style={{ ...cell, color: '#aaa', fontWeight: 600, textTransform: 'capitalize' }}>{fmtMes(m.mes)}</th>)}
          </tr>
        </thead>
        <tbody>
          {cats.map(c => (
            <tr key={c} style={{ borderTop: '1px solid #f5f5f5' }}>
              <td style={{ ...cell, ...stick, color: '#333', fontWeight: 600 }}>{c}</td>
              {cols.map(m => { const v = valor(m, c); return <td key={m.mes} style={{ ...cell, color: v ? '#444' : '#ddd' }}>{v ? fmtBRLcurto(v) : '—'}</td>; })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid #eee', fontWeight: 700 }}>
            <td style={{ ...cell, ...stick, color: '#111' }}>Total</td>
            {cols.map(m => <td key={m.mes} style={{ ...cell, color: '#111' }}>{fmtBRLcurto(totalDe(m))}</td>)}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function LinhasGastos({ meses, cats, valor }) {
  const [sel, setSel] = useState(null);
  const W = 320, H = 162, padTop = 12, padBot = 20, padLeft = 40, padRight = 10;
  const n = meses.length;
  const vals = (c) => meses.map(m => valor(m, c));
  const max = Math.max(...(sel ? vals(sel) : cats.flatMap(c => vals(c))), 1);
  const x = (i) => n === 1 ? (padLeft + (W - padLeft - padRight) / 2) : padLeft + i * (W - padLeft - padRight) / (n - 1);
  const y = (v) => (H - padBot) - (v / max) * (H - padTop - padBot);
  const pathFor = (c) => meses.map((m, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(valor(m, c)).toFixed(1)}`).join(' ');
  const corDe = (c) => FIN_PALETTE[cats.indexOf(c) % FIN_PALETTE.length];
  const lista = sel ? [sel] : cats;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => f * max);
  return (
    <div style={{ marginTop: 4 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        {ticks.map((t, i) => (
          <g key={'t' + i}>
            <line x1={padLeft} y1={y(t)} x2={W - padRight} y2={y(t)} stroke="#f0f0f0" strokeWidth="1" />
            <text x={padLeft - 4} y={y(t) + 3} textAnchor="end" fontSize="7.5" fill="#bbb">{fmtBRLcurto(t)}</text>
          </g>
        ))}
        {meses.map((m, i) => (
          <g key={m.mes}>
            <line x1={x(i)} y1={padTop} x2={x(i)} y2={H - padBot} stroke="#f6f6f6" strokeWidth="1" />
            <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="8" fill="#bbb">{fmtMes(m.mes)}</text>
          </g>
        ))}
        {lista.map(c => <path key={c} d={pathFor(c)} fill="none" stroke={corDe(c)} strokeWidth={sel ? 2.5 : 1.4} strokeLinejoin="round" strokeLinecap="round" opacity={sel ? 1 : 0.75} />)}
        {sel && meses.map((m, i) => {
          const v = valor(m, sel);
          return (
            <g key={m.mes}>
              <circle cx={x(i)} cy={y(v)} r="2.8" fill={corDe(sel)} />
              <text x={x(i)} y={Math.max(8, y(v) - 5)} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#111">{fmtBRLcurto(v)}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        {cats.map(c => (
          <button key={c} onClick={() => setSel(sel === c ? null : c)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', border: '1px solid ' + (sel === c ? '#111' : '#e2e2e2'), background: sel === c ? '#1111110d' : '#fff', color: sel === c ? '#111' : '#888' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: corDe(c), flexShrink: 0 }} />{c}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 11, color: '#aaa', marginTop: 8 }}>toque numa categoria pra focar a linha dela.</p>
    </div>
  );
}

function GastosVida() {
  const life = useLife();
  const [selMes, setSelMes] = useState(null);
  const [vista, setVista] = useState('mes');
  const [form, setForm] = useState(null);
  const meses = [...life.gastos].sort((a, b) => a.mes.localeCompare(b.mes));
  const totalDe = (m) => (m?.itens || []).reduce((s, i) => s + (Number(i.valor) || 0), 0);
  const atual = meses.find(m => m.mes === selMes) || meses[meses.length - 1] || null;
  const total = totalDe(atual);
  const barras = meses.map(m => ({ label: fmtMes(m.mes), full: fmtMesLongo(m.mes), valor: totalDe(m) }));
  const cats = atual ? [...atual.itens].sort((a, b) => (Number(b.valor) || 0) - (Number(a.valor) || 0)) : [];
  const maxCat = Math.max(...cats.map(c => Number(c.valor) || 0), 1);
  const totalGeral = {};
  meses.forEach(m => (m.itens || []).forEach(i => { totalGeral[i.categoria] = (totalGeral[i.categoria] || 0) + (Number(i.valor) || 0); }));
  const todasCats = Object.keys(totalGeral).sort((a, b) => totalGeral[b] - totalGeral[a]);
  const valorMesCat = (m, c) => { const it = (m.itens || []).find(x => x.categoria === c); return it ? (Number(it.valor) || 0) : 0; };
  const addBtn = { display: 'block', background: 'none', border: '1px dashed #ccc', borderRadius: 10, padding: '11px 0', width: '100%', color: '#999', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: meses.length ? 12 : 16 };
  const vchip = (k, txt) => <button onClick={() => setVista(k)} style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: vista === k ? COR_FIN : '#eee', color: vista === k ? '#fff' : '#888' }}>{txt}</button>;

  if (meses.length === 0) {
    return (
      <div>
        <div style={{ marginTop: 12, padding: 24, borderRadius: 16, background: COR_FIN + '10', border: '1px dashed ' + COR_FIN + '55', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 16, color: '#555', margin: 0 }}>Nenhum mês ainda.</p>
        </div>
        <button onClick={() => setForm({ novo: true })} style={addBtn}>+ adicionar mês</button>
        {form && <GastoForm editing={form.editing} meses={meses} onClose={() => setForm(null)} />}
      </div>
    );
  }
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {vchip('mes', 'Mês')}{vchip('tabela', 'Tabela')}{vchip('linhas', 'Linhas')}
      </div>

      {vista === 'mes' && (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', flex: 1, paddingBottom: 4 }}>
              {[...meses].reverse().map(m => (
                <button key={m.mes} onClick={() => setSelMes(m.mes)} style={{ whiteSpace: 'nowrap', padding: '7px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', flexShrink: 0, border: '1px solid ' + (atual.mes === m.mes ? COR_FIN : '#e2e2e2'), background: atual.mes === m.mes ? COR_FIN + '1c' : '#fff', color: atual.mes === m.mes ? '#1a7a4f' : '#888' }}>{fmtMes(m.mes)}</button>
              ))}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 10.5, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>gasto no mês</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#111' }}>{fmtBRL(total)}</div>
            </div>
          </div>

          <p style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px', fontWeight: 600 }}>gastos por mês</p>
          <BarrasSalario barras={barras} />

          <div style={{ marginTop: 18 }}>
            {cats.map((c, i) => {
              const v = Number(c.valor) || 0;
              return (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #f3f3f3' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 13.5, color: '#222', fontWeight: 600 }}>{c.categoria}</span>
                    <span style={{ fontSize: 13.5, color: '#333', whiteSpace: 'nowrap' }}>{fmtBRL(v)} <span style={{ fontSize: 11.5, color: '#aaa' }}>{total ? (v / total * 100).toFixed(0) : 0}%</span></span>
                  </div>
                  <div style={{ height: 4, background: '#f0f0f0', borderRadius: 4, marginTop: 5, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: (v / maxCat * 100) + '%', background: '#111', borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 8, borderTop: '2px solid #eee', fontSize: 13.5, fontWeight: 700, color: '#111' }}>
              <span>Total do mês</span><span>{fmtBRL(total)}</span>
            </div>
          </div>

          <button onClick={() => setForm({ editing: atual })} style={{ marginTop: 16, background: 'none', border: '1px solid #ddd', borderRadius: 10, padding: '9px 14px', fontSize: 12.5, color: '#777', cursor: 'pointer' }}>Editar {fmtMesLongo(atual.mes)}</button>
        </>
      )}

      {vista === 'tabela' && <TabelaGastos meses={meses} cats={todasCats} totalDe={totalDe} valor={valorMesCat} />}
      {vista === 'linhas' && <LinhasGastos meses={meses} cats={todasCats} valor={valorMesCat} />}

      <button onClick={() => setForm({ novo: true })} style={addBtn}>+ adicionar mês</button>
      {form && <GastoForm editing={form.editing} meses={meses} onClose={() => setForm(null)} />}
    </div>
  );
}

function GastoForm({ editing, meses, onClose }) {
  const life = useLife();
  const hojeMes = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
  const novaRow = () => ({ categoria: '', valor: '' });
  const [mes, setMes] = useState(editing?.mes || hojeMes());
  const [rows, setRows] = useState(editing?.itens?.length ? editing.itens.map(i => ({ categoria: i.categoria, valor: String(i.valor) })) : [novaRow()]);
  const catsUsadas = [...new Set((meses || []).flatMap(m => (m.itens || []).map(i => i.categoria)))];
  const setRow = (i, k, v) => setRows(rows.map((r, j) => j === i ? { ...r, [k]: v } : r));
  const addRow = () => setRows([...rows, novaRow()]);
  const delRow = (i) => setRows(rows.filter((_, j) => j !== i));
  const limpos = rows.filter(r => r.categoria.trim() && evalValor(r.valor) > 0);
  const totalPrev = limpos.reduce((s, r) => s + (evalValor(r.valor) || 0), 0);
  const podeSalvar = mes && limpos.length > 0;
  const salvar = () => {
    if (!podeSalvar) return;
    life.saveGastoMes({ mes, itens: limpos.map(r => ({ categoria: r.categoria.trim(), valor: evalValor(r.valor) })) });
    onClose();
  };
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar mês' : 'Novo mês'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>
        <label style={labelStyle}>Mês</label>
        <input type="month" value={mes} onChange={e => setMes(e.target.value)} style={inputStyle} />
        <label style={labelStyle}>Gastos por categoria (R$ · aceita conta)</label>
        <datalist id="gasto-cats">{catsUsadas.map(c => <option key={c} value={c} />)}</datalist>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
            <input list="gasto-cats" value={r.categoria} onChange={e => setRow(i, 'categoria', e.target.value)} placeholder="categoria" style={{ ...inputStyle, flex: 1.4, minWidth: 0 }} />
            <input type="text" inputMode="text" value={r.valor} onChange={e => setRow(i, 'valor', e.target.value)} placeholder="valor" style={{ ...inputStyle, width: 96, flexShrink: 0 }} />
            <button onClick={() => delRow(i)} title="remover" style={{ background: 'none', border: 'none', color: '#ccc', fontSize: 20, cursor: 'pointer', flexShrink: 0, padding: '0 2px' }}>×</button>
          </div>
        ))}
        <button onClick={addRow} style={{ background: 'none', border: '1px dashed #ccc', borderRadius: 9, padding: '8px 0', width: '100%', color: '#999', fontSize: 13, cursor: 'pointer', marginTop: 2 }}>+ categoria</button>
        <div style={{ textAlign: 'right', marginTop: 12, fontSize: 13, color: '#777' }}>Total: <b style={{ color: '#111' }}>{fmtBRL(totalPrev)}</b></div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {editing && <button onClick={() => { life.deleteGastoMes(editing.mes); onClose(); }} style={{ padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apagar</button>}
          <button onClick={salvar} disabled={!podeSalvar} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: 'none', background: podeSalvar ? '#111' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: podeSalvar ? 'pointer' : 'default' }}>{editing ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  );
}

// ---- Saúde ----
const COR_SAUDE = '#d96459';
const SAUDE_LOCAIS = ['Smart Fit Pinheiros', 'Smart Fit Teodoro', 'Smart Fit Itaim'];
const PERIODOS = [['manha', 'manhã'], ['tarde', 'tarde'], ['noite', 'noite']];
const PERIODO_LABEL = { manha: 'manhã', tarde: 'tarde', noite: 'noite' };
const TREINOS = [['pre', 'pré treino'], ['pos', 'pós treino']];
const TREINO_LABEL = { pre: 'pré treino', pos: 'pós treino' };
const hojeKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

function PesoLinha({ pontos }) {
  if (pontos.length < 2) return null;
  const W = 320, H = 120, padTop = 14, padBot = 20, padLeft = 36, padRight = 10;
  const n = pontos.length;
  const vs = pontos.map(p => p.valor);
  const min = Math.min(...vs), max = Math.max(...vs), span = (max - min) || 1;
  const x = (i) => n === 1 ? W / 2 : padLeft + i * (W - padLeft - padRight) / (n - 1);
  const y = (v) => (H - padBot) - ((v - min) / span) * (H - padTop - padBot);
  const path = pontos.map((p, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(p.valor).toFixed(1)}`).join(' ');
  const pulado = n > 8;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', marginBottom: 6 }}>
      <text x={padLeft - 4} y={y(max) + 3} textAnchor="end" fontSize="7.5" fill="#bbb">{max.toLocaleString('pt-BR')}</text>
      <text x={padLeft - 4} y={y(min) + 3} textAnchor="end" fontSize="7.5" fill="#bbb">{min.toLocaleString('pt-BR')}</text>
      <path d={path} fill="none" stroke="#111" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      {pontos.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.valor)} r="2.4" fill="#111" stroke="#fafafa" strokeWidth="1" />
          {(!pulado || i % 2 === 0 || i === n - 1) && <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="7.5" fill="#bbb">{fmtData(p.data)}</text>}
        </g>
      ))}
    </svg>
  );
}

function SaudeSection({ onBack }) {
  const life = useLife();
  const cal = useCalendar();
  const [form, setForm] = useState(null);
  const [exMes, setExMes] = useState(null);
  const s = life.saude || {};
  const pesos = [...(s.pesos || [])].sort((a, b) => (a.data || '').localeCompare(b.data || ''));
  const pesosDesc = [...pesos].reverse();
  const remedios = [...(s.remedios || [])].sort((a, b) => (b.ativo ? 1 : 0) - (a.ativo ? 1 : 0) || (b.inicio || '').localeCompare(a.inicio || ''));
  const vacinas = [...(s.vacinas || [])].sort((a, b) => (b.data || '').localeCompare(a.data || ''));
  const menstr = [...(s.menstruacao || [])].sort((a, b) => (b.data || '').localeCompare(a.data || ''));
  const hk = hojeKey();
  const eventos = (cal.data.events || []).filter(e => e.categoria === 'saude');
  const eventosOrd = [
    ...eventos.filter(e => (e.fim || e.inicio) >= hk).sort((a, b) => (a.inicio || '').localeCompare(b.inicio || '')),
    ...eventos.filter(e => (e.fim || e.inicio) < hk).sort((a, b) => (b.inicio || '').localeCompare(a.inicio || '')),
  ];

  // Retrospectiva de exercícios (do calendário), por mês.
  const exercicios = cal.data.exercicios || [];
  const exMeses = [...new Set(exercicios.map(x => (x.data || '').slice(0, 7)).filter(Boolean))].sort().reverse();
  const exAtualMes = (exMes && exMeses.includes(exMes)) ? exMes : exMeses[0];
  const exDoMes = exercicios.filter(x => (x.data || '').slice(0, 7) === exAtualMes);
  const porTipo = {};
  exDoMes.forEach(x => { porTipo[x.subtipo] = (porTipo[x.subtipo] || 0) + 1; });
  const tiposOrd = Object.entries(porTipo)
    .map(([id, n]) => ({ id, n, label: EXERCICIO_BY_ID[id]?.label || id, cor: EXERCICIO_BY_ID[id]?.cor || '#999' }))
    .sort((a, b) => b.n - a.n);
  const kmMes = exDoMes.filter(x => EXERCICIO_BY_ID[x.subtipo]?.grupo === 'corrida').reduce((acc, x) => acc + (Number(x.distancia) || 0), 0);
  const maxN = Math.max(...tiposOrd.map(t => t.n), 1);

  const editLink = { background: 'none', border: 'none', color: '#bbb', fontSize: 11.5, cursor: 'pointer', flexShrink: 0, padding: 0 };
  const bloco = (titulo, addTipo, conteudo) => (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: '#111', margin: 0 }}>{titulo}</h3>
        {addTipo && <button onClick={() => setForm({ tipo: addTipo })} style={{ background: COR_SAUDE + '18', color: COR_SAUDE, border: 'none', borderRadius: 9, width: 30, height: 30, fontSize: 20, lineHeight: 1, cursor: 'pointer' }}>+</button>}
      </div>
      {conteudo}
    </div>
  );
  const linha = (children, key) => <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #f3f3f3' }}>{children}</div>;
  const vazio = (t) => <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '4px 0', lineHeight: 1.5 }}>{t}</p>;

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: 620, margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Life</button>
      <div style={{ width: 36, height: 4, background: COR_SAUDE, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Saúde</h2>
      <p style={{ fontSize: 12.5, color: '#999', margin: 0 }}>consultas, peso, remédios, vacinas, menstruação</p>

      {bloco('Consultas e exames', null,
        eventosOrd.length === 0
          ? vazio('Marque um evento com categoria Saúde no Calendário que ele aparece aqui.')
          : eventosOrd.map(e => linha(<>
            <span style={{ fontSize: 12.5, color: (e.fim || e.inicio) >= hk ? COR_SAUDE : '#bbb', fontWeight: 700, width: 46, flexShrink: 0 }}>{fmtData(e.inicio)}</span>
            <span style={{ flex: 1, fontSize: 14, color: '#222' }}>{e.titulo}</span>
            {e.horaInicio && <span style={{ fontSize: 12, color: '#aaa' }}>{e.horaInicio}</span>}
          </>, e.id)))}

      {bloco('Exercícios', null,
        exMeses.length === 0 ? vazio('Registre exercícios no Calendário que a retrospectiva do mês aparece aqui.') : <>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 8 }}>
            {exMeses.map(mm => (
              <button key={mm} onClick={() => setExMes(mm)} style={{ whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0, border: '1px solid ' + (exAtualMes === mm ? COR_SAUDE : '#e2e2e2'), background: exAtualMes === mm ? COR_SAUDE + '18' : '#fff', color: exAtualMes === mm ? COR_SAUDE : '#888' }}>{fmtMes(mm)}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 10 }}>
            <div><span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#111' }}>{exDoMes.length}</span> <span style={{ fontSize: 12, color: '#999' }}>treinos no mês</span></div>
            {kmMes > 0 && <div><span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#111' }}>{kmMes.toLocaleString('pt-BR')} km</span> <span style={{ fontSize: 12, color: '#999' }}>corridos</span></div>}
          </div>
          {tiposOrd.map(t => (
            <div key={t.id} style={{ padding: '7px 0', borderBottom: '1px solid #f3f3f3' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: t.cor, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13.5, color: '#222' }}>{t.label}</span>
                <span style={{ fontSize: 13.5, color: '#333', fontWeight: 600 }}>{t.n}×</span>
              </div>
              <div style={{ height: 4, background: '#f0f0f0', borderRadius: 4, marginTop: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: (t.n / maxN * 100) + '%', background: t.cor, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </>)}

      {bloco('Peso', 'peso', <>
        {pesos.length >= 2 && <PesoLinha pontos={pesos} />}
        {pesosDesc.length === 0 ? vazio('Nenhuma pesagem ainda.') : pesosDesc.map(p => linha(<>
          <span style={{ fontSize: 12.5, color: '#999', width: 46, flexShrink: 0 }}>{fmtData(p.data)}</span>
          <span style={{ fontSize: 14, color: '#222', fontWeight: 600, width: 72, flexShrink: 0 }}>{p.valor.toLocaleString('pt-BR')} kg</span>
          <span style={{ flex: 1, fontSize: 11.5, color: '#aaa' }}>{[TREINO_LABEL[p.treino], PERIODO_LABEL[p.periodo], p.local].filter(Boolean).join(' · ')}</span>
          <button onClick={() => setForm({ tipo: 'peso', editing: p })} style={editLink}>editar</button>
        </>, p.id))}
      </>)}

      {bloco('Remédios', 'remedio',
        remedios.length === 0 ? vazio('Nenhum remédio cadastrado.') : remedios.map(r => linha(<>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.ativo ? '#54c08a' : '#ddd', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, color: '#222', fontWeight: 600, textDecoration: r.ativo ? 'none' : 'line-through', opacity: r.ativo ? 1 : 0.55 }}>{r.nome}</div>
            <div style={{ fontSize: 11.5, color: '#aaa' }}>{[r.dose, r.duracao && ('por ' + r.duracao), r.inicio && ('desde ' + fmtData(r.inicio))].filter(Boolean).join(' · ')}</div>
          </div>
          <button onClick={() => setForm({ tipo: 'remedio', editing: r })} style={editLink}>editar</button>
        </>, r.id)))}

      {bloco('Vacinas', 'vacina',
        vacinas.length === 0 ? vazio('Nenhuma vacina registrada.') : vacinas.map(v => linha(<>
          <span style={{ fontSize: 12.5, color: '#999', width: 46, flexShrink: 0 }}>{fmtData(v.data)}</span>
          <span style={{ flex: 1, fontSize: 14, color: '#222' }}>{v.nome}</span>
          <button onClick={() => setForm({ tipo: 'vacina', editing: v })} style={editLink}>editar</button>
        </>, v.id)))}

      {bloco('Menstruação', 'menstruacao',
        menstr.length === 0 ? vazio('Nenhum registro ainda.') : menstr.map((m, i) => {
          const prev = menstr[i + 1];
          const ciclo = prev ? Math.round((new Date(m.data) - new Date(prev.data)) / 86400000) : null;
          return linha(<>
            <span style={{ fontSize: 12.5, color: '#999', width: 46, flexShrink: 0 }}>{fmtData(m.data)}</span>
            <span style={{ flex: 1, fontSize: 13.5, color: '#222' }}>início</span>
            {ciclo != null && <span style={{ fontSize: 11.5, color: '#aaa' }}>ciclo de {ciclo} dias</span>}
            <button onClick={() => setForm({ tipo: 'menstruacao', editing: m })} style={editLink}>editar</button>
          </>, m.id);
        }))}

      {form && <SaudeForm tipo={form.tipo} editing={form.editing} onClose={() => setForm(null)} />}
    </div>
  );
}

function SaudeForm({ tipo, editing, onClose }) {
  const life = useLife();
  const [data, setData] = useState(editing?.data || hojeKey());
  const [valor, setValor] = useState(editing?.valor != null ? String(editing.valor) : '');
  const [treino, setTreino] = useState(editing?.treino || 'pos');
  const [periodo, setPeriodo] = useState(editing?.periodo || '');
  const outroLocal = editing?.local && !SAUDE_LOCAIS.includes(editing.local);
  const [localSel, setLocalSel] = useState(outroLocal ? 'Outro' : (editing?.local || SAUDE_LOCAIS[0]));
  const [localOutro, setLocalOutro] = useState(outroLocal ? editing.local : '');
  const [nome, setNome] = useState(editing?.nome || '');
  const [dose, setDose] = useState(editing?.dose || '');
  const [duracao, setDuracao] = useState(editing?.duracao || '');
  const [inicio, setInicio] = useState(editing?.inicio || '');
  const [ativo, setAtivo] = useState(editing?.ativo != null ? editing.ativo : true);
  const titulos = { peso: 'pesagem', remedio: 'remédio', vacina: 'vacina', menstruacao: 'registro' };

  let podeSalvar = false;
  if (tipo === 'peso') podeSalvar = !!data && Number(valor.replace(',', '.')) > 0;
  else if (tipo === 'remedio') podeSalvar = nome.trim().length > 0;
  else if (tipo === 'vacina') podeSalvar = nome.trim().length > 0 && !!data;
  else podeSalvar = !!data;

  const salvar = () => {
    if (!podeSalvar) return;
    const base = { id: editing?.id };
    if (tipo === 'peso') life.saveSaudeItem('pesos', { ...base, data, valor: Number(valor.replace(',', '.')), treino: treino || undefined, periodo: periodo || undefined, local: localSel === 'Outro' ? (localOutro.trim() || undefined) : localSel });
    else if (tipo === 'remedio') life.saveSaudeItem('remedios', { ...base, nome: nome.trim(), dose: dose.trim() || undefined, duracao: duracao.trim() || undefined, inicio: inicio || undefined, ativo: !!ativo });
    else if (tipo === 'vacina') life.saveSaudeItem('vacinas', { ...base, nome: nome.trim(), data });
    else life.saveSaudeItem('menstruacao', { ...base, data });
    onClose();
  };
  const apagar = () => { const map = { peso: 'pesos', remedio: 'remedios', vacina: 'vacinas', menstruacao: 'menstruacao' }; life.deleteSaudeItem(map[tipo], editing.id); onClose(); };

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar' : 'Nova'} {titulos[tipo]}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>

        {tipo === 'peso' && <>
          <label style={labelStyle}>Data</label>
          <input type="date" value={data} onChange={e => setData(e.target.value)} style={inputStyle} />
          <label style={labelStyle}>Peso (kg)</label>
          <input type="text" inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)} placeholder="ex.: 62,5" style={inputStyle} />
          <label style={labelStyle}>Pré / pós treino</label>
          <select value={treino} onChange={e => setTreino(e.target.value)} style={inputStyle}>
            {TREINOS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            <option value="">—</option>
          </select>
          <label style={labelStyle}>Período (opcional)</label>
          <select value={periodo} onChange={e => setPeriodo(e.target.value)} style={inputStyle}>
            <option value="">—</option>
            {PERIODOS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <label style={labelStyle}>Onde</label>
          <select value={localSel} onChange={e => setLocalSel(e.target.value)} style={inputStyle}>
            {SAUDE_LOCAIS.map(l => <option key={l} value={l}>{l}</option>)}
            <option value="Outro">Outro</option>
          </select>
          {localSel === 'Outro' && <input value={localOutro} onChange={e => setLocalOutro(e.target.value)} placeholder="onde?" style={{ ...inputStyle, marginTop: 6 }} />}
        </>}

        {tipo === 'remedio' && <>
          <label style={labelStyle}>Remédio</label>
          <input value={nome} onChange={e => setNome(e.target.value)} placeholder="ex.: Vitamina D" style={inputStyle} />
          <label style={labelStyle}>Dose (opcional)</label>
          <input value={dose} onChange={e => setDose(e.target.value)} placeholder="ex.: 1 comprimido" style={inputStyle} />
          <label style={labelStyle}>Por quanto tempo</label>
          <input value={duracao} onChange={e => setDuracao(e.target.value)} placeholder="ex.: 7 dias · uso contínuo" style={inputStyle} />
          <label style={labelStyle}>Início (opcional)</label>
          <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} style={inputStyle} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 12, fontSize: 13, color: '#555', cursor: 'pointer' }}>
            <input type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} style={{ width: 15, height: 15, accentColor: COR_SAUDE }} />
            tomando atualmente
          </label>
        </>}

        {tipo === 'vacina' && <>
          <label style={labelStyle}>Vacina</label>
          <input value={nome} onChange={e => setNome(e.target.value)} placeholder="ex.: Gripe · HPV · Febre amarela" style={inputStyle} />
          <label style={labelStyle}>Data</label>
          <input type="date" value={data} onChange={e => setData(e.target.value)} style={inputStyle} />
        </>}

        {tipo === 'menstruacao' && <>
          <label style={labelStyle}>Data de início</label>
          <input type="date" value={data} onChange={e => setData(e.target.value)} style={inputStyle} />
        </>}

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {editing && <button onClick={apagar} style={{ padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apagar</button>}
          <button onClick={salvar} disabled={!podeSalvar} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: 'none', background: podeSalvar ? '#111' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: podeSalvar ? 'pointer' : 'default' }}>{editing ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  );
}

function SubPlaceholder({ secao, onBack }) {
  return (
    <div style={{ padding: '24px 20px 80px', maxWidth: 620, margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 22, padding: 0 }}>&larr; Life</button>
      <div style={{ width: 36, height: 4, background: secao.cor, borderRadius: 4, marginBottom: 14 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 10px' }}>{secao.label}</h2>
      <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>{secao.desc}.</p>
      <div style={{ marginTop: 28, padding: 24, borderRadius: 16, background: secao.cor + '12', border: '1px dashed ' + secao.cor + '55', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 16, color: '#555', margin: 0 }}>Em construção.</p>
        <p style={{ fontSize: 13, color: '#999', marginTop: 8, lineHeight: 1.6 }}>Vamos desenhar esta seção juntas — me diz como você imagina e eu construo.</p>
      </div>
    </div>
  );
}

export default function LifePage({ isWide }) {
  const [sec, setSec] = useState(null);
  if (sec === 'compras') return <ComprasSection onBack={() => setSec(null)} />;
  if (sec === 'planos') return <PlanosSection onBack={() => setSec(null)} />;
  if (sec === 'cultural') return <CulturalSection onBack={() => setSec(null)} />;
  if (sec === 'financas') return <FinancasSection onBack={() => setSec(null)} />;
  if (sec === 'saude') return <SaudeSection onBack={() => setSec(null)} />;
  if (sec) return <SubPlaceholder secao={SECOES.find(s => s.id === sec)} onBack={() => setSec(null)} />;
  return (
    <div style={{ padding: '24px 20px 80px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#111', margin: '0 0 4px' }}>Life</h2>
      <p style={{ fontSize: 12, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 22 }}>seu canto pessoal</p>
      <div style={{ display: 'grid', gridTemplateColumns: isWide ? 'repeat(auto-fill, minmax(180px, 1fr))' : '1fr 1fr', gap: 12 }}>
        {SECOES.map(s => (
          <button key={s.id} onClick={() => setSec(s.id)} style={{
            background: s.cor + '12', border: '1px solid ' + s.cor + '33', borderRadius: 16,
            padding: '20px 16px', cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{ width: 24, height: 4, background: s.cor, borderRadius: 4, marginBottom: 12 }} />
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#222', fontWeight: 700, lineHeight: 1.2 }}>{s.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
