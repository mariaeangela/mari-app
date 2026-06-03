import { useState, useEffect } from 'react';
import { CONTENT_TYPES, CARD_PALETTES, getDailyContent, getRandomContent, getTodayQuote, getEditionPeriod } from './contentLibrary.js';
import Login from './Login.jsx';
import ContentCard from './ContentCard.jsx';

// Relógio vivo: força um re-render a cada minuto. Assim a DATA vira sozinha à
// meia-noite e a EDIÇÃO (cards + frase) vira às 6h e às 14h, sem recarregar.
function useMinuteTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);
}

function CardWithContent({ type, offset = 0 }) {
  const info = CONTENT_TYPES.find(t => t.id === type);
  const palette = CARD_PALETTES[type] || CARD_PALETTES.artwork;
  const [content, setContent] = useState(() => getDailyContent(type, offset));
  const reload = () => setContent(getRandomContent(type));
  return <ContentCard type={type} typeLabel={info?.label} typeEmoji={info?.emoji} palette={palette} content={content} onReload={reload} />;
}

function Header({ tab, setTab }) {
  const now = new Date();
  const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const quote = getTodayQuote();

  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ padding: '48px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 700, color: '#111', letterSpacing: '-2px', lineHeight: 1, fontStyle: 'italic' }}>diagonal</div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: '#999', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{days[now.getDay()]}, {now.getDate()} {months[now.getMonth()]}</div>
          <div style={{ fontSize: 10, color: '#ccc', marginTop: 2 }}>edicao diaria</div>
        </div>
      </div>

      {/* Quote of the day */}
      <div style={{ padding: '14px 24px 0' }}>
        <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 13, color: '#555', lineHeight: 1.55, margin: '0 0 3px' }}>
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
          { id: 'about', label: 'Sobre' },
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

// Aba Hoje: o 2º card é o slot "cultura", que gira entre cinema/artista/música/
// conexões a cada edição (6h e 14h). Os demais slots são fixos.
const CULTURA_TYPES = ['film', 'artist', 'music', 'connection'];
// Aba Explorar: temas que o usuário escolhe por botão.
const EXPLORE_TYPES = ['artist', 'music', 'connection', 'chess', 'context', 'now', 'movement', 'letter', 'film'];

function Feed() {
  const period = getEditionPeriod();
  const cultura = CULTURA_TYPES[((period % CULTURA_TYPES.length) + CULTURA_TYPES.length) % CULTURA_TYPES.length];
  const slots = ['artwork', cultura, 'concept', 'city'];
  return (
    <div style={{ paddingBottom: 40 }}>
      {slots.map((type, i) => <CardWithContent key={type} type={type} offset={i} />)}
    </div>
  );
}

function ExplorePage() {
  const [selectedType, setSelectedType] = useState(null);
  return (
    <div style={{ padding: '24px 20px 80px' }}>
      {!selectedType ? (
        <>
          <p style={{ fontSize: 11, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 20 }}>escolha um tema</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {EXPLORE_TYPES.map(type => {
              const info = CONTENT_TYPES.find(t => t.id === type);
              const pal = CARD_PALETTES[type];
              return (
                <button key={type} onClick={() => setSelectedType(type)} style={{ background: pal.bg, border: 'none', borderRadius: 16, padding: '22px 16px', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ fontSize: 26, marginBottom: 8 }}>{info?.emoji}</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: pal.text, fontWeight: 700 }}>{info?.label}</div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div>
          <button onClick={() => setSelectedType(null)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 20, padding: 0 }}>
            &larr; voltar
          </button>
          {/* key por edição: o card do Explorar também remonta às 6h e às 14h */}
          <CardWithContent key={`${selectedType}-${getEditionPeriod()}`} type={selectedType} />
        </div>
      )}
    </div>
  );
}

function SavedPage() {
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem('diagonal_saved') || '[]'); }
    catch { return []; }
  });
  const remove = (id) => {
    const updated = saved.filter(i => i.id !== id);
    localStorage.setItem('diagonal_saved', JSON.stringify(updated));
    setSaved(updated);
  };
  if (saved.length === 0) return (
    <div style={{ padding: '60px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 16 }}>☆</div>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#333', fontStyle: 'italic', marginBottom: 8 }}>Nada salvo ainda.</p>
      <p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6 }}>Toque na estrela em qualquer card para salvar aqui.</p>
    </div>
  );
  return (
    <div style={{ paddingBottom: 60 }}>
      <p style={{ padding: '20px 22px 8px', fontSize: 11, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase' }}>
        {saved.length} {saved.length === 1 ? 'item salvo' : 'itens salvos'}
      </p>
      {saved.map(item => {
        const pal = CARD_PALETTES[item.type] || CARD_PALETTES.artwork;
        const info = CONTENT_TYPES.find(t => t.id === item.type);
        return (
          <ContentCard key={item.id} type={item.type} typeLabel={info?.label} typeEmoji={info?.emoji}
            palette={pal} content={item} onRemove={() => remove(item.id)} showSave={false} />
        );
      })}
    </div>
  );
}

function About() {
  return (
    <div style={{ padding: '24px 20px 80px' }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', marginBottom: 4, fontStyle: 'italic' }}>sobre o diagonal</h2>
      <div style={{ width: 36, height: 2, background: '#111', marginBottom: 20 }} />
      <p style={{ color: '#666', fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
        O Diagonal e um app de cultura para substituir o scroll vazio das redes sociais por algo que realmente enriquece. Conteudo curado e personalizado, renovado diariamente, com profundidade real.
      </p>
      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
        {[
          ['Obra do Dia','Arte além do óbvio, com imagem'],
          ['Cinema','O que está por trás do filme'],
          ['Artista','Vidas que inspiram'],
          ['Cidade','Lugares que você visitou'],
          ['Cartas','Correspondências históricas'],
          ['Movimentos','Como a arte muda o mundo'],
          ['Música','A música além da música'],
          ['Conceito','Psicologia, filosofia, economia'],
          ['Xadrez','Histórias do tabuleiro'],
          ['Contexto','O que ninguém te contou'],
          ['Conexões','Links entre obras'],
          ['Agora','Nobel, Oscar, Grammy'],
        ].map(([title, desc]) => (
          <div key={title} style={{ marginBottom: 14 }}>
            <div style={{ color: '#111', fontSize: 13, fontWeight: 600 }}>{title}</div>
            <div style={{ color: '#aaa', fontSize: 12, marginTop: 1 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => sessionStorage.getItem('diagonal_auth') === '1');
  const [tab, setTab] = useState('feed');
  useMinuteTick();
  const handleLogin = () => { sessionStorage.setItem('diagonal_auth', '1'); setLoggedIn(true); };
  if (!loggedIn) return <Login onLogin={handleLogin} />;
  return (
    <div style={{ minHeight: '100dvh', background: '#fafafa', maxWidth: 480, margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 40 }}>
        <Header tab={tab} setTab={setTab} />
      </div>
      {/* key = edição: o feed só remonta (e troca os cards) às 6h e às 14h */}
      {tab === 'feed' && <Feed key={getEditionPeriod()} />}
      {tab === 'explore' && <ExplorePage />}
      {tab === 'saved' && <SavedPage />}
      {tab === 'about' && <About />}
    </div>
  );
}
