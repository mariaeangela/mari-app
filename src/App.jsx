import { useState, useEffect } from 'react';
import { CONTENT_TYPES, CARD_PALETTES, getCategoryDaily, getCategoryRandom, getTodayQuote, getEditionPeriod } from './contentLibrary.js';
import Login from './Login.jsx';
import ContentCard from './ContentCard.jsx';
import { SavedProvider, useSaved } from './savedStore.jsx';
import { CalendarProvider, useCalendar } from './calendarStore.jsx';
import Calendario, { itemsGeral } from './Calendario.jsx';
import { getOnThisDay, MESES, MOODS, ymd, parseYmd, CAT_BY_ID, EXERCICIO_BY_ID } from './calendarConfig.js';
import { LifeProvider, useLife, simboloMoeda } from './lifeStore.jsx';
import LifePage from './Life.jsx';

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
function CardWithContent({ type, offset = 0, tile = false }) {
  const info = CONTENT_TYPES.find(t => t.id === type);
  const palette = CARD_PALETTES[type] || CARD_PALETTES.texto;
  const [content, setContent] = useState(() => getCategoryDaily(type, offset));
  const reload = () => setContent(getCategoryRandom(type));
  return <ContentCard type={type} typeLabel={info?.label} typeEmoji={info?.emoji} palette={palette} content={content} onReload={reload} tile={tile} />;
}

function Header({ tab, setTab }) {
  const now = new Date();
  const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const quote = getTodayQuote();

  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ padding: '48px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(24px, 7vw, 34px)', fontWeight: 700, color: '#111', letterSpacing: '1px', lineHeight: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>diagonal</div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: '#999', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{days[now.getDay()]}, {now.getDate()} {months[now.getMonth()]}</div>
          <div style={{ fontSize: 10, color: '#ccc', marginTop: 2 }}>edicao diaria</div>
        </div>
      </div>

      {/* Quote of the day */}
      <div style={{ padding: '14px 24px 0' }}>
        <p style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 13, color: '#555', lineHeight: 1.55, margin: '0 0 3px' }}>
          "{quote.texto}"
        </p>
        <p style={{ fontSize: 10, color: '#bbb', letterSpacing: '0.5px' }}>— {quote.autor}, <em>{quote.obra}</em></p>
      </div>

      <div style={{ height: 2, background: '#111', margin: '14px 24px 0' }} />
      <div style={{ display: 'flex', padding: '0 20px', gap: 20, overflowX: 'auto' }}>
        {[
          { id: 'feed', label: 'Hoje' },
          { id: 'explore', label: 'Explorar' },
          { id: 'saved', label: 'Salvos' },
          { id: 'calendar', label: 'Calendário' },
          { id: 'life', label: 'Life' },
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
const TYPE_DESC = {
  texto: 'poesia, fragmentos, ensaios',
  cartas: 'cartas reais, na íntegra',
  imagem: 'arte, artistas, fotografia',
  cena: 'cinema e música',
  mito: 'mitologia, religião, bíblia',
  mundo: 'cidades, história, agora',
};

const hojeMid = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const DIAS_SEM = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const capaInput = { width: '100%', padding: '9px 12px', border: '1px solid #e6e6e6', borderRadius: 10, fontSize: 13.5, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', color: '#222' };

// Saudação + data
function Saudacao() {
  const d = new Date();
  const h = d.getHours();
  const saud = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: 0, lineHeight: 1.15 }}>{saud}, Mari</h2>
      <p style={{ fontSize: 12, color: '#aaa', letterSpacing: '0.5px', marginTop: 3 }}>{DIAS_SEM[d.getDay()]}, {d.getDate()} de {MESES[d.getMonth()]}</p>
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

// Antecipação: contagem regressiva (viagem), próxima prova (corrida) e compra com prazo.
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

  const proxEvento = nearest(cal.data.events.filter(e => CAT_BY_ID[e.categoria]?.aguardado), e => e.inicio);
  const proxProva = nearest(cal.data.exercicios.filter(x => x.subtipo === 'corrida_prova'), x => x.data);
  const proxCompra = nearest((life.compras.itens || []).filter(i => !i.comprado), i => i.dataLimite);

  const linha = (cor, label, dd) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#666', marginBottom: 6 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cor, flexShrink: 0 }} />
      {label} · <b style={{ color: '#333' }}>{dd === 1 ? '1 dia' : dd + ' dias'}</b>
    </div>
  );
  if (!proxEvento && !proxProva && !proxCompra) return null;
  return (
    <div style={{ marginBottom: 22 }}>
      {proxEvento && linha(CAT_BY_ID[proxEvento.it.categoria]?.cor || '#999', proxEvento.it.titulo, proxEvento.dias)}
      {proxProva && linha(EXERCICIO_BY_ID.corrida_prova.cor, 'próxima prova: ' + (proxProva.it.titulo || 'corrida') + (proxProva.it.distancia ? ' (' + proxProva.it.distancia + 'km)' : ''), proxProva.dias)}
      {proxCompra && linha('#ff8a3d', 'comprar: ' + proxCompra.it.titulo + (proxCompra.it.orcamento ? ' · ' + simboloMoeda(proxCompra.it.moeda) + ' ' + proxCompra.it.orcamento : ''), proxCompra.dias)}
    </div>
  );
}

// Lendo no momento
function LendoAgora() {
  const cal = useCalendar();
  const lendo = cal.data.cultura.filter(c => c.subtipo === 'lendo');
  if (!lendo.length) return null;
  return (
    <p style={{ fontSize: 13, color: '#777', marginBottom: 22 }}>
      <span style={{ fontWeight: 700, color: '#999' }}>Lendo: </span>
      <span style={{ fontStyle: 'italic' }}>{lendo.map(c => c.titulo).join(', ')}</span>
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
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const items = itemsGeral(cal.data, hoje);
  if (!items.length) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 11, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>hoje</p>
      {items.map(it => (
        <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #f0f0f0' }}>
          {it._tipo === 'tarefa'
            ? <span onClick={() => cal.toggleTask(it.id, it._doneKey)} style={{ fontSize: 18, color: it.feita ? '#54c08a' : '#ccc', cursor: 'pointer' }}>{it.feita ? '☑' : '☐'}</span>
            : <span style={{ width: 9, height: 9, borderRadius: '50%', background: it._cor, flexShrink: 0 }} />}
          <span style={{ flex: 1, fontSize: 14, color: '#333', textDecoration: it.feita ? 'line-through' : 'none', opacity: it.feita ? 0.5 : 1 }}>{it._titulo}</span>
          {it.horaInicio && <span style={{ fontSize: 12, color: '#999' }}>{it.horaInicio}</span>}
        </div>
      ))}
    </div>
  );
}

function Feed({ isWide }) {
  // Capa (Hoje): saudação · neste dia · seu dia (humor+diário) · antecipação ·
  // lendo · agenda do dia · dois cards (texto e imagem).
  const slots = ['texto', 'imagem'];
  const cards = slots.map((cat, i) => <CardWithContent key={cat} type={cat} offset={i} tile={isWide} />);
  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ padding: '20px 20px 0' }}>
        <Saudacao />
        <NesteDiaFato />
        <SeuDia />
        <Antecipacao />
        <LendoAgora />
        <HojeAgenda />
      </div>
      {isWide ? <div style={{ ...GRID_3, padding: '0 18px 48px' }}>{cards}</div> : cards}
    </div>
  );
}

function ExplorePage({ isWide }) {
  const [selectedType, setSelectedType] = useState(null);
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
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#222', fontWeight: 700, lineHeight: 1.2, marginBottom: 4 }}>{info?.label}</div>
                  <div style={{ fontSize: 11.5, color: '#999', lineHeight: 1.4 }}>{TYPE_DESC[type]}</div>
                </button>
              );
            })}
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

function SavedPage({ isWide }) {
  const { items: saved, remove } = useSaved();
  if (saved.length === 0) return (
    <div style={{ padding: '60px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 16 }}>☆</div>
      <p style={{ fontFamily: "'Lora', serif", fontSize: 18, color: '#333', fontStyle: 'italic', marginBottom: 8 }}>Nada salvo ainda.</p>
      <p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6 }}>Toque na estrela em qualquer card para salvar aqui.</p>
    </div>
  );
  const cards = saved.map(item => {
    const pal = CARD_PALETTES[item.type] || CARD_PALETTES.artwork;
    const info = CONTENT_TYPES.find(t => t.id === item.type);
    return (
      <ContentCard key={item.id} type={item.type} typeLabel={info?.label} typeEmoji={info?.emoji}
        palette={pal} content={item} onRemove={() => remove(item.id)} showSave={false} tile={isWide} />
    );
  });
  return (
    <div style={{ paddingBottom: 60 }}>
      <p style={{ padding: '20px 22px 8px', fontSize: 11, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase' }}>
        {saved.length} {saved.length === 1 ? 'item salvo' : 'itens salvos'}
      </p>
      {isWide ? <div style={{ ...GRID_3, padding: '0 18px 48px' }}>{cards}</div> : cards}
    </div>
  );
}

export default function App() {
  // Não memoriza o login: a senha é pedida sempre que o app abre/recarrega.
  const [loggedIn, setLoggedIn] = useState(false);
  const [tab, setTab] = useState('feed');
  useMinuteTick();
  const isWide = useIsWide();
  useEffect(() => { try { sessionStorage.removeItem('diagonal_auth'); } catch {} }, []);
  const handleLogin = () => { setLoggedIn(true); };
  if (!loggedIn) return <Login onLogin={handleLogin} />;
  return (
    <SavedProvider>
      <CalendarProvider>
        <LifeProvider>
          <div style={{ minHeight: '100dvh', background: '#fafafa', maxWidth: isWide ? 1160 : 480, margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 40 }}>
              <Header tab={tab} setTab={setTab} />
            </div>
            {/* key = edição: o feed só remonta (e troca os cards) às 6h e às 14h */}
            {tab === 'feed' && <Feed key={getEditionPeriod()} isWide={isWide} />}
            {tab === 'explore' && <ExplorePage isWide={isWide} />}
            {tab === 'saved' && <SavedPage isWide={isWide} />}
            {tab === 'calendar' && <Calendario isWide={isWide} />}
            {tab === 'life' && <LifePage isWide={isWide} />}
          </div>
        </LifeProvider>
      </CalendarProvider>
    </SavedProvider>
  );
}
