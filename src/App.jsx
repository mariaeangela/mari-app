import { useState, useEffect } from 'react';
import { CONTENT_TYPES, CARD_PALETTES, getCategoryDaily, getCategoryRandom, getTodayQuote, getEditionPeriod } from './contentLibrary.js';
import Login from './Login.jsx';
import ContentCard from './ContentCard.jsx';
import { SavedProvider, useSaved } from './savedStore.jsx';
import { CalendarProvider } from './calendarStore.jsx';
import Calendario from './Calendario.jsx';
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
const EXPLORE_TYPES = ['texto', 'imagem', 'cena', 'mito', 'mundo'];
const TYPE_DESC = {
  texto: 'poesia, fragmentos, ensaios',
  imagem: 'arte, artistas, fotografia',
  cena: 'cinema e música',
  mito: 'mitologia, religião, bíblia',
  mundo: 'cidades, história, agora',
};

function Feed({ isWide }) {
  // Um card por categoria; cada um gira pelo seu próprio acervo a cada edição.
  const slots = ['texto', 'imagem', 'cena', 'mundo', 'mito'];
  const cards = slots.map((cat, i) => <CardWithContent key={cat} type={cat} offset={i} tile={isWide} />);
  return isWide
    ? <div style={{ ...GRID_3, padding: '18px 18px 48px' }}>{cards}</div>
    : <div style={{ paddingBottom: 40 }}>{cards}</div>;
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
      </CalendarProvider>
    </SavedProvider>
  );
}
