import { useState } from 'react';
import { useLife } from './lifeStore.jsx';

// 50ª Mostra Internacional de Cinema em São Paulo. As datas vêm do site oficial
// (mostra.org, conferido em 02/out/2026). Os filmes e as sessões são DELA: ficam
// no documento e ela vai preenchendo conforme a programação é divulgada.
const COR = '#b8392f';
const INICIO = '2026-10-15', FIM = '2026-10-29';
const DIAS_ABREV = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

const parseData = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const fmtSessaoDia = (s) => { const d = parseData(s); return `${DIAS_ABREV[d.getDay()]} ${s.slice(8, 10)}/${s.slice(5, 7)}`; };
const fmtHora = (h) => h ? h.replace(':00', 'h').replace(':', 'h') : '';

// "faltam 13 dias" / "hoje é o dia 3 de 15" / "já acabou".
function situacao() {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const ate = Math.round((parseData(INICIO) - hoje) / 86400000);
  if (ate > 1) return `faltam ${ate} dias`;
  if (ate === 1) return 'começa amanhã';
  if (hoje > parseData(FIM)) return 'já acabou';
  return `hoje é o dia ${1 - ate} de 15`;
}

const inputStyle = { width: '100%', padding: '9px 11px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', color: '#222' };
const botaoEscuro = (ativo) => ({ padding: '9px 16px', borderRadius: 10, border: 'none', background: ativo ? '#111' : '#ccc', color: '#fff', fontSize: 13, fontWeight: 700, cursor: ativo ? 'pointer' : 'default' });
const linkCinza = { background: 'none', border: 'none', color: '#aaa', fontSize: 12.5, cursor: 'pointer', padding: 0 };

function NovaSessao({ onAdd, onCancel }) {
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [sala, setSala] = useState('');
  return (
    <div style={{ marginTop: 10, background: '#fafafa', border: '1px solid #eee', borderRadius: 12, padding: 12 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input type="date" value={data} min="2026-10-14" max={FIM} onChange={e => setData(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
        <input type="time" value={hora} onChange={e => setHora(e.target.value)} style={{ ...inputStyle, width: 108, flexShrink: 0 }} />
      </div>
      <input value={sala} onChange={e => setSala(e.target.value)} placeholder="cinema / sala (ex.: Cinesesc)" style={inputStyle} />
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10 }}>
        <button disabled={!data} onClick={() => onAdd({ data, hora: hora || undefined, sala: sala.trim() || undefined })} style={botaoEscuro(!!data)}>Adicionar sessão</button>
        <button onClick={onCancel} style={linkCinza}>cancelar</button>
      </div>
    </div>
  );
}

function NovoFilme({ onAdd, onCancel }) {
  const [titulo, setTitulo] = useState('');
  const [diretor, setDiretor] = useState('');
  const [pais, setPais] = useState('');
  const ok = titulo.trim().length > 0;
  return (
    <div style={{ background: '#fff', border: '1px solid ' + COR + '55', borderRadius: 14, padding: 14, marginBottom: 12 }}>
      <input autoFocus value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="nome do filme" style={{ ...inputStyle, marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={diretor} onChange={e => setDiretor(e.target.value)} placeholder="direção" style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
        <input value={pais} onChange={e => setPais(e.target.value)} placeholder="país" style={{ ...inputStyle, width: 110, flexShrink: 0 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10 }}>
        <button disabled={!ok} onClick={() => onAdd({ titulo: titulo.trim(), diretor: diretor.trim() || undefined, pais: pais.trim() || undefined })} style={botaoEscuro(ok)}>Adicionar filme</button>
        <button onClick={onCancel} style={linkCinza}>cancelar</button>
      </div>
    </div>
  );
}

export default function MostraSection({ onBack, backLabel = 'Explorar' }) {
  const life = useLife();
  const [novoFilme, setNovoFilme] = useState(false);
  const [sessaoPara, setSessaoPara] = useState(null);     // id do filme com o "+ sessão" aberto
  const [ingEdit, setIngEdit] = useState(null);           // texto em edição dos ingressos
  const filmes = life.mostra.filmes || [];
  const ingressos = life.mostra.ingressos;
  const salvarIngressos = () => { life.setMostraIngressos((ingEdit || '').trim()); setIngEdit(null); };

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: 620, margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; {backLabel}</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: 36, height: 4, background: COR, borderRadius: 4, marginBottom: 10 }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: 0 }}>Mostra de Cinema de SP</h2>
          <p style={{ fontSize: 12.5, color: '#999', margin: '4px 0 0' }}>50ª edição</p>
        </div>
        <button onClick={() => setNovoFilme(true)} title="adicionar filme" style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>+</button>
      </div>

      <div style={{ background: COR + '10', border: '1px solid ' + COR + '30', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, fontWeight: 700, color: '#111' }}>15 a 29 de outubro</span>
          <span style={{ fontSize: 12.5, color: COR, fontWeight: 700 }}>{situacao()}</span>
        </div>
        <p style={{ fontSize: 12, color: '#888', margin: '4px 0 12px' }}>abertura para convidados na quarta 14/10, na Sala São Paulo</p>
        <div style={{ borderTop: '1px solid ' + COR + '25', paddingTop: 10 }}>
          <span style={{ fontSize: 11, color: '#999', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Ingressos</span>
          {ingEdit === null ? (
            <div onClick={() => setIngEdit(ingressos || '')} title="toque pra escrever" style={{ cursor: 'pointer', marginTop: 3 }}>
              <span style={{ fontSize: 14, color: ingressos ? '#222' : '#999', fontWeight: 600, fontStyle: ingressos ? 'normal' : 'italic' }}>{ingressos || 'em breve'}</span>
              <span style={{ fontSize: 11.5, color: '#bbb', marginLeft: 8 }}>editar</span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <input autoFocus value={ingEdit} onChange={e => setIngEdit(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') salvarIngressos(); }} placeholder="ex.: venda abre 10/10 no site da Mostra" style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
              <button onClick={salvarIngressos} style={botaoEscuro(true)}>ok</button>
            </div>
          )}
        </div>
      </div>

      <p style={{ fontSize: 11, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>filmes que quero ver</p>
      {novoFilme && <NovoFilme onCancel={() => setNovoFilme(false)} onAdd={(f) => { life.saveMostraFilme(f); setNovoFilme(false); }} />}
      {filmes.length === 0 && !novoFilme && <p style={{ fontSize: 13, color: '#aaa', fontStyle: 'italic' }}>Nenhum filme ainda. Toque no + pra adicionar.</p>}
      {filmes.map(f => {
        const sessoes = [...(f.sessoes || [])].sort((a, b) => (a.data + (a.hora || '')).localeCompare(b.data + (b.hora || '')));
        return (
          <div key={f.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: '14px 16px', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ flex: 1, fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#111' }}>{f.titulo}</span>
              <button onClick={() => { if (window.confirm(`Tirar "${f.titulo}" da lista?`)) life.deleteMostraFilme(f.id); }} title="tirar da lista" style={{ ...linkCinza, color: '#ccc', fontSize: 18 }}>×</button>
            </div>
            <div style={{ fontSize: 12.5, color: '#888', marginTop: 2 }}>{[f.diretor, f.pais, f.obs].filter(Boolean).join(' · ')}</div>
            <div style={{ marginTop: 10 }}>
              {sessoes.length === 0 && <p style={{ fontSize: 12.5, color: '#aaa', fontStyle: 'italic', margin: 0 }}>programação ainda não divulgada</p>}
              {sessoes.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #f4f4f4' }}>
                  <span style={{ fontSize: 13, color: COR, fontWeight: 700, width: 74, flexShrink: 0 }}>{fmtSessaoDia(s.data)}</span>
                  <span style={{ fontSize: 13, color: '#222', fontWeight: 600, width: 48, flexShrink: 0 }}>{fmtHora(s.hora)}</span>
                  <span style={{ flex: 1, fontSize: 13, color: '#555' }}>{s.sala}</span>
                  <button onClick={() => life.deleteMostraSessao(f.id, s.id)} title="apagar sessão" style={{ ...linkCinza, color: '#ccc', fontSize: 16 }}>×</button>
                </div>
              ))}
            </div>
            {sessaoPara === f.id
              ? <NovaSessao onCancel={() => setSessaoPara(null)} onAdd={(s) => { life.addMostraSessao(f.id, s); setSessaoPara(null); }} />
              : <button onClick={() => setSessaoPara(f.id)} style={{ marginTop: 10, background: 'none', border: '1px dashed ' + COR + '66', borderRadius: 10, color: COR, fontSize: 12.5, fontWeight: 700, padding: '7px 12px', cursor: 'pointer' }}>+ sessão</button>}
          </div>
        );
      })}
    </div>
  );
}
