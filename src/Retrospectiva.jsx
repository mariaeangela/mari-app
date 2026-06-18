// Aba "Retrospectiva": hub que agrega seus números e marcos.
// Página inicial: "o ano em números" (clicável) + cards que abrem sub-retrospectivas.
import { useState, useEffect } from 'react';
import { useCalendar } from './calendarStore.jsx';
import { useLife, simboloMoeda, MOEDAS } from './lifeStore.jsx';
import { EXERCICIO_BY_ID } from './calendarConfig.js';

const COR = '#8d6e63';
const overlay = { position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' };
const sheet = { background: '#fafafa', width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', borderRadius: '20px 20px 0 0', padding: '20px 20px 28px' };
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', color: '#222' };
const labelStyle = { fontSize: 11, color: '#999', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: 5, marginTop: 14 };
const pad2 = (n) => String(n).padStart(2, '0');
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const fmtDM = (s) => { const [, m, d] = s.split('-'); return `${d}/${m}`; };
const fmtMesAno = (mm) => `${MESES[+mm.slice(5, 7) - 1]} de ${mm.slice(0, 4)}`;

// Cards do hub. `pronto` = sub-página já construída.
const CARDS = [
  { id: 'compras', label: 'Compras', desc: 'o que você comprou', cor: '#ff8a3d', pronto: true },
  { id: 'quem', label: 'Quem você viu', desc: 'as pessoas do seu ano', cor: '#ff5d8f' },
  { id: 'viagens', label: 'Viagens', desc: 'pra onde você foi', cor: '#19b3a6' },
  { id: 'musica', label: 'Música', desc: 'o que tocou no seu ano', cor: '#1db954' },
  { id: 'saude', label: 'Saúde', desc: 'terapia, consultas', cor: '#d96459' },
  { id: 'corridas', label: 'Corridas', desc: 'suas provas e trajetos', cor: '#ef6c4d' },
  { id: 'amorosa', label: 'Amorosa', desc: 'dates e afins', cor: '#c2548f' },
];

export default function RetrospectivaPage({ isWide, secInicial, onConsumeSec }) {
  const [sec, setSec] = useState(secInicial || null);
  useEffect(() => { if (secInicial) { setSec(secInicial); onConsumeSec && onConsumeSec(); } }, [secInicial]);
  if (sec === 'compras') return <ComprasRetro onBack={() => setSec(null)} isWide={isWide} />;
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
  const km = Math.round(exGrupo('corrida').reduce((a, x) => a + (Number(x.distancia) || 0), 0));

  const numeros = [
    { key: 'lido', label: 'livros lidos', itens: cultItens('lido') },
    { key: 'filme', label: 'filmes', itens: cultItens('filme') },
    { key: 'serie', label: 'séries', itens: cultItens('serie') },
    { key: 'exposicao', label: 'exposições', itens: cultItens('exposicao') },
    { key: 'museu', label: 'museus', itens: cultItens('museu') },
    { key: 'show', label: 'shows', itens: cultItens('show') },
    { key: 'espetaculo', label: 'espetáculos', itens: cultItens('espetaculo') },
    { key: 'treino', label: 'treinos', itens: exGrupo('treino').map(x => ({ titulo: EXERCICIO_BY_ID[x.subtipo]?.label || 'Treino', data: x.data })) },
    { key: 'corrida', label: 'corridas', itens: exGrupo('corrida').map(x => ({ titulo: [x.distancia ? x.distancia + 'km' : null, x.titulo].filter(Boolean).join(' · ') || 'Corrida', data: x.data })) },
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
            const clicavel = n.itens && n.itens.length > 0;
            const ativo = detalhe === n.key;
            return (
              <div key={n.key} onClick={clicavel ? () => setDetalhe(ativo ? null : n.key) : undefined} style={{
                background: ativo ? COR + '1c' : COR + '10', border: '1px solid ' + (ativo ? COR : COR + '28'), borderRadius: 14, padding: '16px 14px', cursor: clicavel ? 'pointer' : 'default',
              }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: '#111', lineHeight: 1 }}>{n.valor.toLocaleString('pt-BR')}</div>
                <div style={{ fontSize: 12.5, color: '#777', marginTop: 6 }}>{n.label}{clicavel && <span style={{ color: COR, fontWeight: 700 }}> ›</span>}</div>
              </div>
            );
          })}
        </div>
      )}

      {det && (
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

// ---- Card: Compras — histórico próprio (+ o que foi marcado como comprado nas listas) ----
function ComprasRetro({ onBack, isWide }) {
  const life = useLife();
  const [form, setForm] = useState(null); // { editing? }
  const LISTA_FIXA = { geral: 'Geral', algumdia: 'Algum dia', internacional: 'Internacional' };
  const nomeLista = (id) => (life.compras.listas || []).find(l => l.id === id)?.nome || LISTA_FIXA[id] || '';
  const valorTxt = (v, m) => v ? simboloMoeda(m) + ' ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';

  // Duas fontes: registro próprio (comprasFeitas) + itens marcados como comprado nas listas.
  const doLog = (life.comprasFeitas || []).map(c => ({ id: c.id, titulo: c.titulo, data: c.data, sub: c.categoria, vtxt: valorTxt(c.valor, c.moeda), moeda: c.moeda || 'BRL', vnum: Number(c.valor) || 0, editavel: true, raw: c }));
  const dasListas = (life.compras.itens || []).filter(i => i.comprado).map(i => ({ id: i.id, titulo: i.titulo, data: i.compradoEm, sub: nomeLista(i.listaId), vtxt: valorTxt(i.orcamento, i.moeda), moeda: i.moeda || 'BRL', vnum: Number(i.orcamento) || 0, editavel: false }));
  const todas = [...doLog, ...dasListas];

  const meses = [...new Set(todas.map(i => (i.data || '').slice(0, 7)).filter(Boolean))].sort().reverse();
  const ordDia = (a, b) => (b.data || '').localeCompare(a.data || '');
  const grupos = meses.map(mm => ({ mm, itens: todas.filter(i => (i.data || '').slice(0, 7) === mm).sort(ordDia) }));
  const semData = todas.filter(i => !i.data);

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
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Nada por aqui ainda. Toque no + para registrar uma compra — ou marque um item como comprado nas Listas de compras.</p>
      ) : <>
        <div style={{ marginBottom: 18 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: '#111' }}>{todas.length}</span>
          <span style={{ fontSize: 13, color: '#999' }}> {todas.length === 1 ? 'compra' : 'compras'}</span>
        </div>
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
