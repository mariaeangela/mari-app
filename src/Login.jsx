import { useState, useEffect } from 'react';
import { getSeason, SEASON_THEMES, getGreeting, getDayName, getTodayFact } from './contentLibrary.js';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  // Mantém estação, saudação e data atualizadas ao vivo enquanto a tela fica aberta.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const season = getSeason();
  const theme = SEASON_THEMES[season];
  const greeting = getGreeting();
  const dayName = getDayName();
  const now = new Date();
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const dateStr = `${now.getDate()} de ${months[now.getMonth()]}`;
  const fact = getTodayFact();

  const handleSubmit = () => {
    if (password === 'ts1312') {
      onLogin();
    } else {
      setError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setTimeout(() => setError(false), 2500);
      setPassword('');
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: theme.greeting_bg, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>

      {/* Decorative floating shapes */}
      {theme.decoration.map((color, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: [80,60,100,70][i], height: [80,60,100,70][i],
          borderRadius: '50%',
          background: color + '40',
          top: [`8%`,`70%`,`15%`,`55%`][i],
          left: [`75%`,`8%`,`5%`,`80%`][i],
          animation: `float ${3 + i}s ease-in-out infinite`,
          animationDelay: `${i * 0.5}s`,
        }} />
      ))}

      {/* Color band top */}
      <div style={{ display: 'flex', height: 5 }}>
        {theme.decoration.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
        <div style={{ flex: 1, background: theme.accent }} />
        <div style={{ flex: 1, background: '#111' }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 28px', animation: shaking ? 'shake 0.5s ease' : 'fadeUp 0.7s ease', position: 'relative', zIndex: 1 }}>

        {/* Season badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: theme.accentLight, borderRadius: 20, padding: '4px 12px', marginBottom: 28, width: 'fit-content' }}>
          <span style={{ fontSize: 14 }}>{theme.emoji}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, letterSpacing: '2px', textTransform: 'uppercase' }}>{theme.tagline}</span>
        </div>

        {/* Logo */}
        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(30px, 10vw, 48px)', fontWeight: 700, color: '#111', letterSpacing: '1.5px', lineHeight: 1.1, textTransform: 'uppercase', marginBottom: 6, whiteSpace: 'nowrap' }}>diagonal</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ flex: 1, height: 1.5, background: theme.accent }} />
          <span style={{ fontSize: 9, letterSpacing: '2.5px', color: theme.sub, textTransform: 'uppercase' }}>arte · literatura · história</span>
          <div style={{ flex: 1, height: 1.5, background: theme.accent }} />
        </div>

        {/* Greeting card */}
        <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '20px 22px', marginBottom: 28, border: `1px solid ${theme.accentLight}`, boxShadow: `0 4px 24px ${theme.accent}15` }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#111', marginBottom: 4, fontStyle: 'italic' }}>
            {greeting}, Mari! ✨
          </p>
          <p style={{ fontSize: 12, color: '#777', marginBottom: 14 }}>
            Hoje é {dayName}, {dateStr}.
          </p>
          <div style={{ width: '100%', height: 1, background: theme.accentLight, marginBottom: 14 }} />
          <p style={{ fontSize: 12, color: '#555', lineHeight: 1.65 }}>
            <span style={{ fontWeight: 700, color: theme.accent }}>Sabia que</span> {fact}
          </p>
        </div>

        {/* Input */}
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 9, color: theme.sub, letterSpacing: '2.5px', textTransform: 'uppercase', display: 'block', marginBottom: 8, fontWeight: 600 }}>senha de acesso</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoComplete="off"
            style={{ width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.9)', border: error ? `1.5px solid #e53935` : `1.5px solid ${theme.accentLight}`, borderRadius: 12, fontSize: 16, color: '#111', outline: 'none', letterSpacing: '4px', transition: 'border-color 0.2s' }}
          />
        </div>

        {error && <p style={{ color: '#e53935', fontSize: 12, marginBottom: 8 }}>senha incorreta. tente novamente.</p>}

        <button onClick={handleSubmit} style={{ width: '100%', padding: '14px', background: theme.accent, border: 'none', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: '1.5px', textTransform: 'uppercase', boxShadow: `0 4px 16px ${theme.accent}40` }}>
          entrar →
        </button>
      </div>

      {/* Color band bottom */}
      <div style={{ display: 'flex', height: 5 }}>
        <div style={{ flex: 1, background: '#111' }} />
        <div style={{ flex: 1, background: theme.accent }} />
        {theme.decoration.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
      </div>
    </div>
  );
}
