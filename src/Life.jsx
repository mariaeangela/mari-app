// Aba "Life": hub pessoal. Seção "Listas de compras" funcional; demais seções
// ainda em placeholder (vamos desenhar uma a uma).
import { useState } from 'react';
import { useLife } from './lifeStore.jsx';

const SECOES = [
  { id: 'compras',  label: 'Listas de compras',   desc: 'o que você quer comprar',          cor: '#ff8a3d' },
  { id: 'estudos',  label: 'Estudos',             desc: 'aulas, leituras, cursos',          cor: '#5c6bc0' },
  { id: 'financas', label: 'Metas financeiras',   desc: 'quanto quer economizar',           cor: '#54c08a' },
  { id: 'viagens',  label: 'Viagens futuras',     desc: 'pra onde e quando',                cor: '#19b3a6' },
  { id: 'cultural', label: 'Calendário cultural', desc: 'exposições na cidade, até quando', cor: '#c2548f' },
];

// estilos
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', color: '#222' };
const labelStyle = { fontSize: 11, color: '#999', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: 5, marginTop: 14 };
const overlay = { position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' };
const sheet = { background: '#fafafa', width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', borderRadius: '20px 20px 0 0', padding: '20px 20px 28px' };

const COR = '#ff8a3d';
const LISTAS_FIXAS = [{ id: 'geral', nome: 'Geral' }, { id: 'algumdia', nome: 'Algum dia' }];
const fmtData = (s) => { const [y, m, d] = s.split('-'); return `${d}/${m}`; };

function ComprasForm({ editing, listaAtual, listas, onClose }) {
  const life = useLife();
  const [titulo, setTitulo] = useState(editing?.titulo || '');
  const [listaId, setListaId] = useState(editing?.listaId || listaAtual);
  const [orcamento, setOrcamento] = useState(editing?.orcamento || '');
  const [dataLimite, setDataLimite] = useState(editing?.dataLimite || '');
  const [links, setLinks] = useState(editing?.links?.length ? editing.links : ['']);

  const setLink = (i, v) => setLinks(links.map((l, j) => j === i ? v : l));
  const podeSalvar = titulo.trim().length > 0;
  const salvar = () => {
    if (!podeSalvar) return;
    const obj = {
      titulo: titulo.trim(), listaId,
      orcamento: orcamento || undefined,
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

        <label style={labelStyle}>Até quanto posso gastar — R$ (opcional)</label>
        <input type="number" inputMode="decimal" value={orcamento} onChange={e => setOrcamento(e.target.value)} placeholder="ex.: 500" style={inputStyle} />

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
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
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

      {/* itens */}
      {itens.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#bbb', fontSize: 13, padding: '30px 0', fontStyle: 'italic' }}>Nada nesta lista ainda. Toque em "+ adicionar".</p>
      ) : itens.map(it => {
        const meta = [it.orcamento ? 'até R$ ' + it.orcamento : null, it.dataLimite ? 'até ' + fmtData(it.dataLimite) : null].filter(Boolean).join(' · ');
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

      <button onClick={() => setForm({})} style={{ width: '100%', marginTop: 16, padding: '12px 0', borderRadius: 11, border: 'none', background: '#111', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>+ adicionar</button>

      {form && <ComprasForm editing={form.editing} listaAtual={listaSel} listas={listas} onClose={() => setForm(null)} />}
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
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#222', fontWeight: 700, lineHeight: 1.2, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 11.5, color: '#999', lineHeight: 1.4 }}>{s.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
