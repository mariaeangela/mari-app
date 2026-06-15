// Aba "Life": hub pessoal. Seção "Listas de compras" funcional; demais seções
// ainda em placeholder (vamos desenhar uma a uma).
import { useState } from 'react';
import { useLife, MOEDAS, simboloMoeda } from './lifeStore.jsx';

const SECOES = [
  { id: 'compras',        label: 'Compras',        desc: 'o que você quer comprar',          cor: '#ff8a3d' },
  { id: 'planos',         label: 'Planos',         desc: 'projetos com info + checklist',    cor: '#6b7a99' },
  { id: 'estudos',        label: 'Estudos',        desc: 'aulas, leituras, cursos',          cor: '#5c6bc0' },
  { id: 'aprendizados',   label: 'Aprendizados',   desc: 'o que você aprendeu',              cor: '#c78a3a' },
  { id: 'financas',       label: 'Vida Financeira', desc: 'metas, gastos, economia',         cor: '#54c08a' },
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
  const checks = life.planos.itens.filter(i => i.planoId === plano.id);
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
          <button key={it.id} onClick={() => setForm({ editing: it })} style={{ display: 'block', width: '100%', textAlign: 'left', background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '11px 13px', marginBottom: 6, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ flex: 1, fontSize: 14.5, color: '#222', fontWeight: 600 }}>{it.nome}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: COR_CULTURAL, textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>{cultTipoLabel(it.tipo)}</span>
            </div>
            <div style={{ fontSize: 11.5, color: '#999', marginTop: 3 }}>{[it.cidade, meta].filter(Boolean).join(' · ')}</div>
          </button>
        );
      })}

      {form && <CulturalForm editing={form.editing} onClose={() => setForm(null)} />}
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
