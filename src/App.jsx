import { useState, useEffect, useRef } from 'react';
import { CONTENT_TYPES, CARD_PALETTES, getCategoryDaily, getCategoryRandom, getTodayQuote, getEditionPeriod } from './contentLibrary.js';
import Login from './Login.jsx';
import ContentCard from './ContentCard.jsx';
import { SavedProvider, useSaved } from './savedStore.jsx';
import { CalendarProvider, useCalendar } from './calendarStore.jsx';
import Calendario, { itemsForDay, trabTag, AddSheet, PLANO_COR } from './Calendario.jsx';
import { getOnThisDay, MESES, MOODS, ymd, parseYmd, CAT_BY_ID, EXERCICIO_BY_ID, cicloDia27 } from './calendarConfig.js';
import { LifeProvider, useLife, getViagemAtiva } from './lifeStore.jsx';
import LifePage, { CulturalSection, AssistirSection, LeiturasSection, PlanoCheckSheet } from './Life.jsx';
import RetrospectivaPage from './Retrospectiva.jsx';
import EsportesSection from './Esportes.jsx';
import { NavContext } from './nav.jsx';
import { getLastSyncError, onSyncStatus } from './cloud';
import { getCidadeFato } from './cidadeFatos.js';

// Relógio vivo: força um re-render a cada minuto. Assim a DATA vira sozinha à
// meia-noite e a EDIÇÃO (cards + frase) vira às 6h e às 14h, sem recarregar.
function useMinuteTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);
}

// Tela larga (notebook/desktop): a partir daqui usamos grade de 3 colunas.
// No iPhone (abaixo do breakpoint) tudo continua em coluna única, como antes.
function useIsWide(bp = 860) {
  const query = `(min-width:${bp}px)`;
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setWide(m.matches);
    m.addEventListener('change', on);
    setWide(m.matches);
    return () => m.removeEventListener('change', on);
  }, [query]);
  return wide;
}

// Estilo da grade de 3 colunas (somente desktop).
const GRID_3 = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'start' };

// `type` controla a EXIBIÇÃO (rótulo, emoji, cor e id de salvamento);
// `contentType` controla de onde vem o CONTEÚDO. Para o slot "Cultura" eles
// diferem: exibe sempre "Cultura", mas o texto vem de cinema/artista/música/conexões.
function CardWithContent({ type, offset = 0, tile = false, showReload = true }) {
  const info = CONTENT_TYPES.find(t => t.id === type);
  const palette = CARD_PALETTES[type] || CARD_PALETTES.texto;
  const [content, setContent] = useState(() => getCategoryDaily(type, offset));
  const reload = () => setContent(getCategoryRandom(type));
  return <ContentCard type={type} typeLabel={info?.label} typeEmoji={info?.emoji} palette={palette} content={content} onReload={showReload ? reload : undefined} tile={tile} />;
}

function Header({ tab, setTab }) {
  const now = new Date();
  const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const quote = getTodayQuote();
  const { isSaved, toggle } = useSaved();
  const fraseItem = { id: 'frase_' + quote.texto, type: 'frase', texto: quote.texto, autor: quote.autor, obra: quote.obra };
  const favoritada = isSaved(fraseItem.id);

  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ padding: '48px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div onClick={() => setTab('feed')} title="ir para Hoje" style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(24px, 7vw, 34px)', fontWeight: 700, color: '#111', letterSpacing: '1px', lineHeight: 1, textTransform: 'uppercase', whiteSpace: 'nowrap', cursor: 'pointer' }}>diagonal</div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: '#999', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{days[now.getDay()]}, {now.getDate()} {months[now.getMonth()]}</div>
          <div style={{ fontSize: 10, color: '#ccc', marginTop: 2 }}>edicao diaria</div>
        </div>
      </div>

      {/* Quote of the day */}
      <div style={{ padding: '14px 24px 0', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 13, color: '#555', lineHeight: 1.55, margin: '0 0 3px' }}>
            "{quote.texto}"
          </p>
          <p style={{ fontSize: 10, color: '#bbb', letterSpacing: '0.5px' }}>— {quote.autor}, <em>{quote.obra}</em></p>
        </div>
        <button onClick={() => toggle(fraseItem)} title={favoritada ? 'remover dos salvos' : 'salvar frase'} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, color: favoritada ? '#e0a83e' : '#ccc', flexShrink: 0, padding: 0 }}>{favoritada ? '★' : '☆'}</button>
      </div>

      <div style={{ height: 2, background: '#111', margin: '14px 24px 0' }} />
      <div style={{ display: 'flex', padding: '0 20px', gap: 20, overflowX: 'auto' }}>
        {[
          { id: 'feed', label: 'Hoje' },
          { id: 'explore', label: 'Explorar' },
          { id: 'saved', label: 'Salvos' },
          { id: 'calendar', label: 'Calendário' },
          { id: 'life', label: 'Life' },
          { id: 'retrospectiva', label: 'Retrospectiva' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '12px 0', fontSize: 13, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.3px',
            color: tab === t.id ? '#111' : '#bbb',
            borderBottom: tab === t.id ? '2px solid #111' : '2px solid transparent',
            whiteSpace: 'nowrap', transition: 'all 0.15s', flexShrink: 0,
          }}>{t.label}</button>
        ))}
      </div>
    </div>
  );
}

// Aba Explorar e Hoje: as 5 categorias consolidadas.
const EXPLORE_TYPES = ['texto', 'cartas', 'imagem', 'cena', 'mito', 'mundo'];

const hojeMid = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const DIAS_SEM = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const capaInput = { width: '100%', padding: '9px 12px', border: '1px solid #e6e6e6', borderRadius: 10, fontSize: 13.5, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', color: '#222' };

// Saudação + data
// Faixa do Modo Viagem: aparece no topo do app inteiro enquanto a viagem está ativa.
function FaixaViagem() {
  const life = useLife();
  const viagem = getViagemAtiva(life.viagensFuturas);
  if (!viagem) return null;
  return (
    <div style={{ background: '#19b3a6', color: '#fff', textAlign: 'center', fontSize: 12.5, fontWeight: 700, padding: '6px 12px', letterSpacing: '0.3px' }}>
      ✈ Você está em {viagem.cidade} · {viagem.titulo}
    </div>
  );
}

function Saudacao() {
  const life = useLife();
  const d = new Date();
  const h = d.getHours();
  const saud = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  // Modo Viagem: com viagem ativa, a saudação vira "Bom dia em <cidade>" + um fato da cidade.
  const viagem = getViagemAtiva(life.viagensFuturas);
  const fatoCidade = viagem ? getCidadeFato(viagem.cidade, d) : null;
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: 0, lineHeight: 1.15 }}>{viagem ? `${saud} em ${viagem.cidade}` : `${saud}, Mari`}</h2>
      <p style={{ fontSize: 12, color: '#aaa', letterSpacing: '0.5px', marginTop: 3 }}>{DIAS_SEM[d.getDay()]}, {d.getDate()} de {MESES[d.getMonth()]}{viagem ? ` · ${viagem.titulo}` : ''}</p>
      {fatoCidade && <p style={{ fontSize: 12.5, color: '#2a6b65', fontStyle: 'italic', marginTop: 8, lineHeight: 1.55, background: '#19b3a612', border: '1px solid #19b3a633', borderRadius: 10, padding: '9px 11px' }}>{fatoCidade}</p>}
    </div>
  );
}

// Humor de hoje (1 toque) + diário rápido
function SeuDia() {
  const cal = useCalendar();
  const k = ymd(hojeMid());
  const mood = cal.data.moods[k];
  return (
    <div style={{ marginBottom: 22 }}>
      <p style={{ fontSize: 11, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>como você está hoje?</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {MOODS.map(m => (
          <button key={m.id} onClick={() => cal.setMood(k, mood === m.id ? null : m.id)} style={{
            padding: '5px 11px', borderRadius: 18, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: '1.5px solid ' + (mood === m.id ? m.cor : '#e2e2e2'),
            background: mood === m.id ? m.cor + '22' : '#fff', color: mood === m.id ? '#333' : '#999',
          }}>{m.label}</button>
        ))}
      </div>
      <input value={cal.data.diary[k] || ''} onChange={e => cal.setDiary(k, e.target.value)} placeholder="como foi o dia? (diário de uma linha)" style={capaInput} />
    </div>
  );
}

// Antecipação: contagem regressiva (viagem), próxima prova (corrida) e eventos culturais
// que "vencem" (dataMax) nos próximos 30 dias (última chance de ver).
function Antecipacao() {
  const cal = useCalendar();
  const life = useLife();
  const today = hojeMid();
  const tk = ymd(today);
  const dias = (key) => Math.round((parseYmd(key) - today) / 86400000);
  const nearest = (arr, getKey) => arr.reduce((best, it) => {
    const k = getKey(it); if (!k || k <= tk) return best;
    const dd = dias(k); if (dd <= 0 || dd > 180) return best;
    return (!best || dd < best.dias) ? { dias: dd, it } : best;
  }, null);

  const proxEvento = nearest((cal.data.events || []).filter(e => CAT_BY_ID[e.categoria]?.aguardado), e => e.inicio);
  const proxProva = nearest((cal.data.exercicios || []).filter(x => x.subtipo === 'corrida_prova'), x => x.data);
  // compras com prazo nos próximos 7 dias (mais urgentes primeiro)
  const comprasPrazo = (life.compras?.itens || [])
    .filter(i => !i.comprado && i.dataLimite && i.dataLimite >= tk && dias(i.dataLimite) <= 7)
    .sort((a, b) => a.dataLimite.localeCompare(b.dataLimite))
    .slice(0, 5);
  // culturais acabando em até 8 dias (mais próximos do fim primeiro)
  const culturais = (life.cultural?.itens || [])
    .filter(c => c.dataMax && c.dataMax >= tk && dias(c.dataMax) <= 8)
    .sort((a, b) => a.dataMax.localeCompare(b.dataMax))
    .slice(0, 5);

  const fmtPrazo = (dd) => dd === 0 ? 'hoje' : dd === 1 ? 'amanhã' : 'em ' + dd + ' dias';
  const linha = (key, cor, label, bold) => (
    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#666', marginBottom: 6 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cor, flexShrink: 0 }} />
      {label} · <b style={{ color: '#333' }}>{bold}</b>
    </div>
  );
  if (!proxEvento && !proxProva && comprasPrazo.length === 0 && culturais.length === 0) return null;
  return (
    <div style={{ marginBottom: 22 }}>
      {proxEvento && linha('ev', CAT_BY_ID[proxEvento.it.categoria]?.cor || '#999', proxEvento.it.titulo, proxEvento.dias === 1 ? '1 dia' : proxEvento.dias + ' dias')}
      {proxProva && linha('prova', EXERCICIO_BY_ID.corrida_prova.cor, 'próxima prova: ' + (proxProva.it.titulo || 'corrida') + (proxProva.it.distancia ? ' (' + proxProva.it.distancia + 'km)' : ''), proxProva.dias === 1 ? '1 dia' : proxProva.dias + ' dias')}
      {comprasPrazo.map(i => linha(i.id, '#ff8a3d', 'comprar: ' + i.titulo, fmtPrazo(dias(i.dataLimite))))}
      {culturais.map(c => linha(c.id, '#c2548f', c.nome, 'acaba ' + fmtPrazo(dias(c.dataMax))))}
    </div>
  );
}

// Lendo no momento
function LendoAgora() {
  const cal = useCalendar();
  const lendo = (cal.data.cultura || []).filter(c => c.subtipo === 'lendo');
  if (!lendo.length) return null;
  return (
    <p style={{ fontSize: 13, color: '#777', marginBottom: 22 }}>
      <span style={{ fontWeight: 700, color: '#999' }}>Lendo: </span>
      <span style={{ fontStyle: 'italic' }}>{lendo.map(c => c.titulo).join(', ')}</span>
    </p>
  );
}

// Ouvindo no momento (audiobooks) — igual ao Lendo, logo abaixo dele.
function OuvindoAgora() {
  const cal = useCalendar();
  const ouvindo = (cal.data.cultura || []).filter(c => c.subtipo === 'ouvindo');
  if (!ouvindo.length) return null;
  return (
    <p style={{ fontSize: 13, color: '#777', marginBottom: 22 }}>
      <span style={{ fontWeight: 700, color: '#999' }}>Ouvindo: </span>
      <span style={{ fontStyle: 'italic' }}>{ouvindo.map(c => c.titulo).join(', ')}</span>
    </p>
  );
}

// "Neste dia, em XXXX..." — fato histórico (movido do calendário para a Hoje).
function NesteDiaFato() {
  const [fato, setFato] = useState(null);
  useEffect(() => {
    let alive = true;
    getOnThisDay(new Date()).then(f => { if (alive) setFato(f); });
    return () => { alive = false; };
  }, []);
  if (!fato) return null;
  return (
    <p style={{ fontSize: 13, color: '#555', lineHeight: 1.55, fontStyle: 'italic', marginBottom: 18 }}>
      <span style={{ fontStyle: 'normal', fontWeight: 700, color: '#999' }}>Neste dia, </span>{fato.texto}
      {fato.fonte === 'Wikipédia' && <span style={{ fontSize: 10, color: '#bbb' }}> · via Wikipédia</span>}
    </p>
  );
}

// Lista do que está marcado para hoje (eventos, tarefas, rolês, cultura…).
function HojeAgenda() {
  const cal = useCalendar();
  const life = useLife();
  const [editing, setEditing] = useState(null);
  const [editCheck, setEditCheck] = useState(null);
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  // passa life.planos → itens do checklist com prazo == hoje entram aqui (não em "próximos")
  const items = itemsForDay(cal.data, hoje, life.planos).all;
  if (!items.length) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 11, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>hoje</p>
      {items.map(it => (
        <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #f0f0f0' }}>
          {it._tipo === 'tarefa'
            ? <span onClick={() => cal.toggleTask(it.id, it._doneKey)} style={{ fontSize: 18, color: it.feita ? '#54c08a' : '#ccc', cursor: 'pointer' }}>{it.feita ? '☑' : '☐'}</span>
            : it._tipo === 'plano'
              ? <span onClick={() => life.togglePlanoCheck(it.id)} style={{ fontSize: 18, color: '#ccc', cursor: 'pointer', flexShrink: 0 }}>☐</span>
              : <span style={{ width: 9, height: 9, borderRadius: '50%', background: it._cor, flexShrink: 0 }} />}
          <span onClick={() => it._tipo === 'plano' ? setEditCheck(it) : setEditing(it)} title="tocar pra editar" style={{ flex: 1, fontSize: 14, color: '#333', textDecoration: it.feita ? 'line-through' : 'none', opacity: it.feita ? 0.5 : 1, cursor: 'pointer' }}>{it._titulo}</span>
          {it._tipo === 'plano' && <span style={{ fontSize: 11.5, color: PLANO_COR, fontWeight: 700, flexShrink: 0 }}>{it._planoNome}</span>}
          {it.trabalho && <span style={trabTag}>trabalho</span>}
          {it.horaInicio && <span style={{ fontSize: 12, color: '#999' }}>{it.horaInicio}</span>}
        </div>
      ))}
      {editing && <AddSheet editing={editing} onClose={() => setEditing(null)} />}
      {editCheck && <PlanoCheckSheet item={editCheck} onClose={() => setEditCheck(null)} />}
    </div>
  );
}

// R$ formatado (curto, 2 casas).
const fmtR$ = (v) => 'R$ ' + (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// VR (vale-refeição) no fim da capa. Ciclo 27→26: você põe o total no dia 27 e
// lança os gastos no +; o app mostra quanto pode gastar POR DIA = (total − gasto)
// ÷ dias restantes até o 26, recalculando a cada gasto.
function VRHoje() {
  const life = useLife();
  const today = hojeMid();
  const { cycleKey, daysLeft } = cicloDia27(today);
  const ciclo = (life.vr?.ciclos || {})[cycleKey] || { total: 0, gastos: [] };
  const gastos = ciclo.gastos || [];
  const gastoTotal = gastos.reduce((s, g) => s + (Number(g.valor) || 0), 0);
  const total = Number(ciclo.total) || 0;
  const resta = total - gastoTotal;
  const porDia = resta / daysLeft;
  const temTotal = total > 0;

  const [addOpen, setAddOpen] = useState(false);
  const [val, setVal] = useState('');
  const [editTotal, setEditTotal] = useState(false);
  const [totalTxt, setTotalTxt] = useState('');

  const addGasto = () => { const v = Number(String(val).replace(',', '.')); if (!v) return; life.addVrGasto(cycleKey, { valor: v, data: ymd(today) }); setVal(''); setAddOpen(false); };
  const salvarTotal = () => { life.setVrTotal(cycleKey, Number(String(totalTxt).replace(',', '.')) || 0); setEditTotal(false); };

  const cor = '#1a7a4f';
  return (
    <div style={{ marginTop: 8, marginBottom: 24, border: '1px solid ' + cor + '2e', background: cor + '0a', borderRadius: 16, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: temTotal ? 10 : 6 }}>
        <span style={{ fontSize: 11, color: cor, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }}>VR do mês</span>
        <span style={{ fontSize: 11, color: '#aaa' }}>ciclo 27→26 · {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'} restantes</span>
      </div>

      {!temTotal || editTotal ? (
        <div>
          <p style={{ fontSize: 12.5, color: '#777', margin: '0 0 8px' }}>Quanto você tem no VR neste ciclo?</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input autoFocus type="text" inputMode="decimal" value={totalTxt} onChange={e => setTotalTxt(e.target.value)} onKeyDown={e => e.key === 'Enter' && salvarTotal()} placeholder="ex.: 1000" style={{ ...capaInput, flex: 1 }} />
            <button onClick={salvarTotal} style={{ border: 'none', borderRadius: 10, background: cor, color: '#fff', fontSize: 13, fontWeight: 700, padding: '0 16px', cursor: 'pointer' }}>salvar</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: resta < 0 ? '#c0392b' : cor, lineHeight: 1.1 }}>{fmtR$(porDia)}</div>
            <div style={{ fontSize: 11.5, color: '#999', marginTop: 2 }}>pode gastar por dia</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, fontSize: 12, color: '#777', marginBottom: 12, flexWrap: 'wrap' }}>
            <span>resta <b style={{ color: '#444' }}>{fmtR$(resta)}</b></span>
            <span>gastou <b style={{ color: '#444' }}>{fmtR$(gastoTotal)}</b></span>
            <span onClick={() => { setTotalTxt(String(total)); setEditTotal(true); }} style={{ cursor: 'pointer' }}>total <b style={{ color: cor }}>{fmtR$(total)}</b> ✎</span>
          </div>

          {addOpen ? (
            <div style={{ display: 'flex', gap: 8, marginBottom: gastos.length ? 10 : 0 }}>
              <input autoFocus type="text" inputMode="decimal" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && addGasto()} placeholder="quanto gastou? ex.: 50" style={{ ...capaInput, flex: 1 }} />
              <button onClick={addGasto} style={{ border: 'none', borderRadius: 10, background: cor, color: '#fff', fontSize: 13, fontWeight: 700, padding: '0 16px', cursor: 'pointer' }}>ok</button>
              <button onClick={() => { setAddOpen(false); setVal(''); }} style={{ border: '1px solid #e2e2e2', borderRadius: 10, background: '#fff', color: '#999', fontSize: 18, padding: '0 12px', cursor: 'pointer' }}>×</button>
            </div>
          ) : (
            <button onClick={() => setAddOpen(true)} style={{ display: 'block', width: '100%', border: '1px dashed ' + cor + '66', borderRadius: 10, background: '#fff', color: cor, fontSize: 13, fontWeight: 700, padding: '10px 0', cursor: 'pointer' }}>+ lançar gasto</button>
          )}

          {gastos.length > 0 && (
            <div style={{ marginTop: 10 }}>
              {[...gastos].reverse().map(g => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '5px 0', borderTop: '1px solid #f0f0f0', fontSize: 12.5, color: '#666' }}>
                  <span>{g.data ? g.data.slice(8, 10) + '/' + g.data.slice(5, 7) : ''}</span>
                  <span style={{ color: '#444', fontWeight: 600 }}>{fmtR$(g.valor)}</span>
                  <button onClick={() => life.deleteVrGasto(cycleKey, g.id)} style={{ border: 'none', background: 'none', color: '#ccc', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Uma "caixa" do Posso gastar (Total ou Mercado): orçamento do ciclo, gastos
// lançados no +, e "resta" = orçamento − gasto. NÃO divide por dia.
function PossoBucket({ ck, bucket, label }) {
  const life = useLife();
  const c = (life.possoGastar?.ciclos || {})[ck] || {};
  const b = c[bucket] || { budget: 0, gastos: [] };
  const gasto = (b.gastos || []).reduce((s, g) => s + (Number(g.valor) || 0), 0);
  const budget = Number(b.budget) || 0;
  const resta = budget - gasto;
  const temBudget = budget > 0;
  const [addOpen, setAddOpen] = useState(false);
  const [val, setVal] = useState('');
  const [editB, setEditB] = useState(false);
  const [bTxt, setBTxt] = useState('');
  const cor = '#b06d1e';
  const add = () => { const v = Number(String(val).replace(',', '.')); if (!v) return; life.addPgGasto(ck, bucket, { valor: v, data: ymd(hojeMid()) }); setVal(''); setAddOpen(false); };
  const salvarB = () => { life.setPgBudget(ck, bucket, Number(String(bTxt).replace(',', '.')) || 0); setEditB(false); };
  return (
    <div style={{ padding: '10px 0', borderTop: '1px solid ' + cor + '22' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#555' }}>{label}</span>
        {temBudget && !editB && <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 21, fontWeight: 700, color: resta < 0 ? '#c0392b' : cor }}>{fmtR$(resta)}</span>}
      </div>
      {!temBudget || editB ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <input autoFocus type="text" inputMode="decimal" value={bTxt} onChange={e => setBTxt(e.target.value)} onKeyDown={e => e.key === 'Enter' && salvarB()} placeholder={`posso gastar em ${label.toLowerCase()}?`} style={{ ...capaInput, flex: 1 }} />
          <button onClick={salvarB} style={{ border: 'none', borderRadius: 10, background: cor, color: '#fff', fontSize: 13, fontWeight: 700, padding: '0 14px', cursor: 'pointer' }}>salvar</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <span style={{ fontSize: 11.5, color: '#999' }}>orçamento <b onClick={() => { setBTxt(String(budget)); setEditB(true); }} style={{ color: cor, cursor: 'pointer' }}>{fmtR$(budget)} ✎</b> · gastou {fmtR$(gasto)}</span>
            {!addOpen && <button onClick={() => setAddOpen(true)} style={{ border: '1px dashed ' + cor + '66', borderRadius: 9, background: '#fff', color: cor, fontSize: 12, fontWeight: 700, padding: '5px 12px', cursor: 'pointer', flexShrink: 0 }}>+ gasto</button>}
          </div>
          {addOpen && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input autoFocus type="text" inputMode="decimal" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="quanto gastou?" style={{ ...capaInput, flex: 1 }} />
              <button onClick={add} style={{ border: 'none', borderRadius: 10, background: cor, color: '#fff', fontSize: 13, fontWeight: 700, padding: '0 14px', cursor: 'pointer' }}>ok</button>
              <button onClick={() => { setAddOpen(false); setVal(''); }} style={{ border: '1px solid #e2e2e2', borderRadius: 10, background: '#fff', color: '#999', fontSize: 18, padding: '0 11px', cursor: 'pointer' }}>×</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Posso gastar na capa: 2 orçamentos independentes (Total e Mercado), ciclo 27→26.
function PossoGastarHoje() {
  const { cycleKey } = cicloDia27(hojeMid());
  const cor = '#b06d1e';
  return (
    <div style={{ marginBottom: 24, border: '1px solid ' + cor + '2e', background: cor + '0a', borderRadius: 16, padding: '12px 16px 8px' }}>
      <div style={{ fontSize: 11, color: cor, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }}>Posso gastar</div>
      <PossoBucket ck={cycleKey} bucket="total" label="Total" />
      <PossoBucket ck={cycleKey} bucket="mercado" label="Mercado" />
    </div>
  );
}

function Feed({ isWide }) {
  // Capa (Hoje) — enxuta, a pedido da Mari: saudação · neste dia · seu dia
  // (humor + diário) · antecipação (viagem/prova/compra + cultura acabando) ·
  // lendo · ouvindo · agenda do dia (hoje) · VR · Posso gastar (fim). Metas do mês,
  // planos e os cards de conteúdo saíram daqui (metas/planos no Calendário; conteúdo no Explorar).
  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ padding: '20px 20px 0' }}>
        <Saudacao />
        <NesteDiaFato />
        <SeuDia />
        <Antecipacao />
        <LendoAgora />
        <OuvindoAgora />
        <HojeAgenda />
        <VRHoje />
        <PossoGastarHoje />
      </div>
    </div>
  );
}

function ExplorePage({ isWide }) {
  const [selectedType, setSelectedType] = useState(null);
  if (selectedType === 'cultural') return (
    <div style={{ maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <CulturalSection onBack={() => setSelectedType(null)} backLabel="Explorar" />
    </div>
  );
  if (selectedType === 'assistir') return (
    <div style={{ maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <AssistirSection onBack={() => setSelectedType(null)} backLabel="Explorar" />
    </div>
  );
  if (selectedType === 'leituras') return (
    <div style={{ maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <LeiturasSection onBack={() => setSelectedType(null)} backLabel="Explorar" />
    </div>
  );
  if (selectedType === 'esportes') return (
    <div style={{ maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <EsportesSection onBack={() => setSelectedType(null)} backLabel="Explorar" />
    </div>
  );
  return (
    <div style={{ padding: '24px 20px 80px' }}>
      {!selectedType ? (
        <>
          <p style={{ fontSize: 11, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 20 }}>escolha um tema</p>
          <div style={{ display: 'grid', gridTemplateColumns: isWide ? 'repeat(auto-fill, minmax(180px, 1fr))' : '1fr 1fr', gap: 12 }}>
            {EXPLORE_TYPES.map(type => {
              const info = CONTENT_TYPES.find(t => t.id === type);
              const cor = CARD_PALETTES[type]?.accent || '#888';
              return (
                <button key={type} onClick={() => setSelectedType(type)} style={{ background: cor + '12', border: '1px solid ' + cor + '33', borderRadius: 16, padding: '20px 16px', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ width: 24, height: 4, background: cor, borderRadius: 4, marginBottom: 12 }} />
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#222', fontWeight: 700, lineHeight: 1.2 }}>{info?.label}</div>
                </button>
              );
            })}
            <button key="cultural" onClick={() => setSelectedType('cultural')} style={{ background: '#c2548f12', border: '1px solid #c2548f33', borderRadius: 16, padding: '20px 16px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 24, height: 4, background: '#c2548f', borderRadius: 4, marginBottom: 12 }} />
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#222', fontWeight: 700, lineHeight: 1.2 }}>Calendário cultural</div>
            </button>
            <button key="assistir" onClick={() => setSelectedType('assistir')} style={{ background: '#4f7cca12', border: '1px solid #4f7cca33', borderRadius: 16, padding: '20px 16px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 24, height: 4, background: '#4f7cca', borderRadius: 4, marginBottom: 12 }} />
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#222', fontWeight: 700, lineHeight: 1.2 }}>Conteúdos para assistir</div>
            </button>
            <button key="leituras" onClick={() => setSelectedType('leituras')} style={{ background: '#7a5c9e12', border: '1px solid #7a5c9e33', borderRadius: 16, padding: '20px 16px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 24, height: 4, background: '#7a5c9e', borderRadius: 4, marginBottom: 12 }} />
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#222', fontWeight: 700, lineHeight: 1.2 }}>Próximas leituras</div>
            </button>
            <button key="esportes" onClick={() => setSelectedType('esportes')} style={{ background: '#e2603a12', border: '1px solid #e2603a33', borderRadius: 16, padding: '20px 16px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 24, height: 4, background: '#e2603a', borderRadius: 4, marginBottom: 12 }} />
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#222', fontWeight: 700, lineHeight: 1.2 }}>Esportes</div>
            </button>
          </div>
        </>
      ) : (
        <div style={{ maxWidth: isWide ? 560 : 'none', margin: '0 auto' }}>
          <button onClick={() => setSelectedType(null)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 20, padding: 0 }}>
            &larr; voltar
          </button>
          {/* key por edição: o card do Explorar também remonta às 6h e às 14h */}
          <CardWithContent key={`${selectedType}-${getEditionPeriod()}`} type={selectedType} tile={isWide} />
        </div>
      )}
    </div>
  );
}

function FrasesCard({ frases, remove }) {
  return (
    <div style={{ padding: '20px 22px 0' }}>
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 16, padding: '16px 18px' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 8 }}>Frases <span style={{ fontSize: 12, color: '#bbb', fontWeight: 400 }}>({frases.length})</span></div>
        {frases.map(f => (
          <div key={f.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #f4f4f4' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 14, color: '#333', lineHeight: 1.5, margin: '0 0 3px' }}>"{f.texto}"</p>
              <p style={{ fontSize: 11, color: '#bbb' }}>— {f.autor}{f.obra ? ', ' : ''}<em>{f.obra}</em></p>
            </div>
            <span onClick={() => remove(f.id)} style={{ color: '#ccc', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>×</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SavedPage({ isWide }) {
  const { items: saved, remove } = useSaved();
  const frases = saved.filter(i => i.type === 'frase');
  const conteudo = saved.filter(i => i.type !== 'frase');
  if (saved.length === 0) return (
    <div style={{ padding: '60px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 16 }}>☆</div>
      <p style={{ fontFamily: "'Lora', serif", fontSize: 18, color: '#333', fontStyle: 'italic', marginBottom: 8 }}>Nada salvo ainda.</p>
      <p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6 }}>Toque na estrela em qualquer card (ou na frase do dia) para salvar aqui.</p>
    </div>
  );
  const cards = conteudo.map(item => {
    const pal = CARD_PALETTES[item.type] || CARD_PALETTES.artwork;
    const info = CONTENT_TYPES.find(t => t.id === item.type);
    return (
      <ContentCard key={item.id} type={item.type} typeLabel={info?.label} typeEmoji={info?.emoji}
        palette={pal} content={item} onRemove={() => remove(item.id)} showSave={false} tile={isWide} />
    );
  });
  return (
    <div style={{ paddingBottom: 60 }}>
      {frases.length > 0 && <FrasesCard frases={frases} remove={remove} />}
      {conteudo.length > 0 && <>
        <p style={{ padding: '20px 22px 8px', fontSize: 11, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase' }}>
          {conteudo.length} {conteudo.length === 1 ? 'item salvo' : 'itens salvos'}
        </p>
        {isWide ? <div style={{ ...GRID_3, padding: '0 18px 48px' }}>{cards}</div> : cards}
      </>}
    </div>
  );
}

// Botão flutuante "Salvar" GLOBAL — grava Life + Calendário + Salvos na nuvem
// AGORA e AGUARDA a confirmação. Fica em TODAS as abas (a Mari pediu garantia de
// que nada se perde ao fechar; o autosync já roda sozinho, isto é o reforço manual).
function SalvarFAB() {
  const life = useLife();
  const cal = useCalendar();
  const saved = useSaved();
  const [msg, setMsg] = useState(null); // null | 'salvando' | 'ok' | 'erro'
  const [detalhe, setDetalhe] = useState(''); // motivo do erro (código HTTP etc.)
  const salvar = async () => {
    setMsg('salvando');
    // Isola cada seção: se uma função nem existir (bundle velho) ou lançar
    // exceção, registra QUAL e o porquê, em vez de virar "erro desconhecido".
    const motivos = [];
    const uma = async (fn, nome) => {
      try {
        if (typeof fn !== 'function') { motivos.push(`${nome}: função ausente (recarregue o app)`); return false; }
        const r = await fn();
        if (!r) motivos.push(`${nome}: ${getLastSyncError() || 'falhou'}`);
        return !!r;
      } catch (e) { motivos.push(`${nome}: ${(e && e.message) || e}`); return false; }
    };
    const r1 = await uma(life.salvarAgora, 'Life');
    const r2 = await uma(cal.salvarAgora, 'Calendário');
    const r3 = await uma(saved.salvarAgora, 'Salvos');
    const ok = r1 && r2 && r3;
    if (!ok) setDetalhe(motivos.join(' · ') || getLastSyncError() || 'erro desconhecido');
    setMsg(ok ? 'ok' : 'erro');
    if (ok) setTimeout(() => setMsg(m => (m === 'ok' ? null : m)), 2500);
  };
  const label = msg === 'salvando' ? 'Salvando…' : msg === 'ok' ? 'Salvo ✓' : msg === 'erro' ? '⚠ Erro — tocar de novo' : '💾 Salvar';
  const bg = msg === 'ok' ? '#2e9e6b' : msg === 'erro' ? '#d05050' : '#111';
  return (
    <div style={{ position: 'fixed', right: 16, bottom: 20, zIndex: 150, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      {msg === 'erro' && detalhe && (
        <div style={{ maxWidth: 240, background: '#fff', border: '1px solid #d05050', color: '#a03030', fontSize: 11, lineHeight: 1.4, padding: '6px 9px', borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.15)', wordBreak: 'break-word' }}>
          {detalhe}
        </div>
      )}
      <button onClick={salvar} disabled={msg === 'salvando'} title="salvar tudo agora na nuvem" style={{
        border: 'none', borderRadius: 24, background: bg, color: '#fff', fontSize: 13.5, fontWeight: 700,
        padding: '11px 18px', cursor: msg === 'salvando' ? 'default' : 'pointer', boxShadow: '0 3px 14px rgba(0,0,0,0.22)',
      }}>{label}</button>
    </div>
  );
}

// Aviso PERSISTENTE de falha de sincronização (item G). O autosync já re-tenta
// sozinho (a cada 4s), então só alarma quando o erro PERSISTE (~8s = 2 tentativas
// falhas seguidas), e some assim que um save volta a dar certo. Serve pra você
// saber NA HORA que algo não está subindo, sem depender de clicar em Salvar.
function SyncAlerta() {
  const [show, setShow] = useState(false);
  const timer = useRef(null);
  useEffect(() => onSyncStatus((s) => {
    if (s === 'saved') { if (timer.current) { clearTimeout(timer.current); timer.current = null; } setShow(false); }
    else if (s === 'error') { if (!timer.current && !show) timer.current = setTimeout(() => { timer.current = null; setShow(true); }, 8000); }
  }), [show]);
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 200, maxWidth: 340, width: 'calc(100% - 24px)',
      background: '#fff4f4', border: '1px solid #d05050', color: '#8a2a2a', fontSize: 12, lineHeight: 1.45, padding: '8px 12px', borderRadius: 12, boxShadow: '0 3px 16px rgba(0,0,0,0.18)' }}>
      ⚠ <b>Não estou conseguindo salvar na nuvem.</b> Suas mudanças estão guardadas neste aparelho e vou continuar tentando. Evite abrir em outro aparelho até isto sumir.
    </div>
  );
}

export default function App() {
  // Não memoriza o login: a senha é pedida sempre que o app abre/recarrega.
  const [loggedIn, setLoggedIn] = useState(false);
  const [tab, setTab] = useState('feed');
  // Clicar numa aba (ou no "diagonal") volta pro topo dela: se já está na aba,
  // o homeNonce muda e remonta a página, voltando à capa (sai de sub-páginas).
  const [homeNonce, setHomeNonce] = useState(0);
  const goTab = (id) => { if (id === tab) setHomeNonce(n => n + 1); setTab(id); };
  const [retroSec, setRetroSec] = useState(null);
  const goRetro = (sec, cat) => { setRetroSec(cat ? sec + ':' + cat : sec); goTab('retrospectiva'); };
  const goRetroCompras = () => goRetro('gastos', 'Coisas');
  useMinuteTick();
  const isWide = useIsWide();
  useEffect(() => { try { sessionStorage.removeItem('diagonal_auth'); } catch {} }, []);
  const handleLogin = () => { setLoggedIn(true); };
  if (!loggedIn) return <Login onLogin={handleLogin} />;
  return (
    <SavedProvider>
      <CalendarProvider>
        <LifeProvider>
          <NavContext.Provider value={{ goRetro, goRetroCompras }}>
          <div style={{ minHeight: '100dvh', background: '#fafafa', maxWidth: isWide ? 1160 : 480, margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 40 }}>
              <Header tab={tab} setTab={goTab} />
              <FaixaViagem />
            </div>
            {/* key = edição (+homeNonce): o feed remonta às 6h/14h e ao reclicar "Hoje" */}
            {tab === 'feed' && <Feed key={getEditionPeriod() + '-' + homeNonce} isWide={isWide} />}
            {tab === 'explore' && <ExplorePage key={homeNonce} isWide={isWide} />}
            {tab === 'saved' && <SavedPage key={homeNonce} isWide={isWide} />}
            {tab === 'calendar' && <Calendario key={homeNonce} isWide={isWide} />}
            {tab === 'life' && <LifePage key={homeNonce} isWide={isWide} />}
            {tab === 'retrospectiva' && <RetrospectivaPage key={homeNonce} isWide={isWide} secInicial={retroSec} onConsumeSec={() => setRetroSec(null)} />}
          </div>
          <SalvarFAB />
          <SyncAlerta />
          </NavContext.Provider>
        </LifeProvider>
      </CalendarProvider>
    </SavedProvider>
  );
}
