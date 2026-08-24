import { useState, useEffect, useRef, lazy, Suspense, Component } from 'react';
import { CONTENT_TYPES, CARD_PALETTES, carregarFraseDoDia, getEditionPeriod } from './contentLibrary.js';
import Login from './Login.jsx';
import ContentCard from './ContentCard.jsx';
import { SavedProvider, useSaved } from './savedStore.jsx';
import { CalendarProvider, useCalendar } from './calendarStore.jsx';
import Calendario, { itemsForDay, tarefasRecorrentesAtrasadas, trabTag, AddSheet, PLANO_COR } from './Calendario.jsx';
import { getOnThisDay, MESES, MOODS, ymd, parseYmd, CAT_BY_ID, EXERCICIO_BY_ID, cicloDia27 } from './calendarConfig.js';
import { LifeProvider, useLife, getViagemAtiva, getOrcamentoViagem, simboloMoeda } from './lifeStore.jsx';
// Telas pesadas carregam SÓ quando abertas (Life ~330 KB, Retrospectiva ~150 KB,
// Gastos detalhados ~65 KB). Antes tudo vinha junto na abertura, mesmo pra ficar
// na Tela Hoje — era o principal motivo da demora no celular.
const lazyDe = (imp, nome) => lazy(() => imp().then(m => ({ default: nome ? m[nome] : m.default })));
const LifePage = lazyDe(() => import('./Life.jsx'));
const CulturalSection = lazyDe(() => import('./Life.jsx'), 'CulturalSection');
const AssistirSection = lazyDe(() => import('./Life.jsx'), 'AssistirSection');
const LeiturasSection = lazyDe(() => import('./Life.jsx'), 'LeiturasSection');
const PlanoCheckSheet = lazyDe(() => import('./Life.jsx'), 'PlanoCheckSheet');
const RetrospectivaPage = lazyDe(() => import('./Retrospectiva.jsx'));
const VFPage = lazyDe(() => import('./VF.jsx'));
const EsportesSection = lazyDe(() => import('./Esportes.jsx'));
// Enquanto o pedaço chega (só na 1ª vez que abre a aba).
const Carregando = () => <p style={{ textAlign: 'center', color: '#bbb', fontSize: 13, padding: '40px 0', fontStyle: 'italic' }}>carregando…</p>;
import { NavContext, useNav } from './nav.jsx';
import { getLastSyncError, onSyncStatus, onSemChave, pendenciasAbertas, pendenteDesde, onSemEspaco, temSemEspaco } from './cloud';
import { getCidadeFato } from './cidadeFatos.js';
import { evalValor, contaInvalida, PreviaConta } from './conta.jsx';

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

// Indicador MINÚSCULO de sincronização (canto do cabeçalho): ✓ sincronizado ·
// ↻ sincronizando/puxando · ⚠ offline ou não-sincronizado. Discreto de propósito.
function SyncDot() {
  const [st, setSt] = useState(typeof navigator !== 'undefined' && !navigator.onLine ? 'warn' : 'ok');
  useEffect(() => onSyncStatus((s) => {
    if (s === 'saving') setSt('saving');
    else if (s === 'saved') setSt('ok');
    else if (s === 'error') setSt('warn');
    // 'conflict' é benigno (a nuvem tinha algo mais novo e o app se corrige) — não alarma.
  }), []);
  useEffect(() => {
    let t;
    const puxando = () => { if (!navigator.onLine) { setSt('warn'); return; } setSt('saving'); clearTimeout(t); t = setTimeout(() => setSt('ok'), 900); };
    const offline = () => setSt('warn');
    const onVis = () => { if (document.visibilityState === 'visible') puxando(); };  // ao voltar pra aba, ela puxa a nuvem
    window.addEventListener('online', puxando);
    window.addEventListener('offline', offline);
    document.addEventListener('visibilitychange', onVis);
    return () => { clearTimeout(t); window.removeEventListener('online', puxando); window.removeEventListener('offline', offline); document.removeEventListener('visibilitychange', onVis); };
  }, []);
  const M = {
    ok: { ic: '✓', cor: '#9ac1a8', t: 'sincronizado' },
    saving: { ic: '↻', cor: '#c9a24a', t: 'sincronizando…' },
    warn: { ic: '⚠', cor: '#d08a3e', t: 'offline ou não-sincronizado — evite editar o mesmo dado em dois aparelhos até voltar' },
  };
  const m = M[st] || M.ok;
  return <span title={m.t} style={{ fontSize: 10, fontWeight: 700, color: m.cor, lineHeight: 1, cursor: 'default' }}>{m.ic}</span>;
}

function Header({ tab, setTab }) {
  const now = new Date();
  const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  // A frase do dia chega um instante DEPOIS da tela: ela mora no pedaço pesado
  // (frasesEfatos.js) e não vale a pena segurar a abertura do app por causa dela.
  const [quote, setQuote] = useState(null);
  useEffect(() => { let vivo = true; carregarFraseDoDia().then(q => { if (vivo) setQuote(q); }); return () => { vivo = false; }; }, []);
  const { isSaved, toggle } = useSaved();
  const fraseItem = quote && { id: 'frase_' + quote.texto, type: 'frase', texto: quote.texto, autor: quote.autor, obra: quote.obra };
  const favoritada = !!fraseItem && isSaved(fraseItem.id);

  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ padding: '48px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div onClick={() => setTab('feed')} title="ir para Hoje" style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(24px, 7vw, 34px)', fontWeight: 700, color: '#111', letterSpacing: '1px', lineHeight: 1, textTransform: 'uppercase', whiteSpace: 'nowrap', cursor: 'pointer' }}>diagonal</div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: '#999', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{days[now.getDay()]}, {now.getDate()} {months[now.getMonth()]}</div>
          <div style={{ fontSize: 10, color: '#ccc', marginTop: 2, display: 'flex', gap: 5, justifyContent: 'flex-end', alignItems: 'center' }}>edicao diaria <SyncDot /></div>
        </div>
      </div>

      {/* Frase do dia. `minHeight` reserva o lugar dela: sem isso a tela dava um
          pulinho quando a frase chegava, um instante depois da abertura. */}
      <div style={{ padding: '14px 24px 0', display: 'flex', alignItems: 'flex-start', gap: 10, minHeight: 46, boxSizing: 'border-box' }}>
        {quote && <>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 13, color: '#555', lineHeight: 1.55, margin: '0 0 3px' }}>
              "{quote.texto}"
            </p>
            <p style={{ fontSize: 10, color: '#bbb', letterSpacing: '0.5px' }}>— {quote.autor}, <em>{quote.obra}</em></p>
          </div>
          <button onClick={() => toggle(fraseItem)} title={favoritada ? 'remover dos salvos' : 'salvar frase'} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, color: favoritada ? '#e0a83e' : '#ccc', flexShrink: 0, padding: 0 }}>{favoritada ? '★' : '☆'}</button>
        </>}
      </div>

      <div style={{ height: 2, background: '#111', margin: '14px 24px 0' }} />
      <div style={{ display: 'flex', padding: '0 20px', gap: 20, overflowX: 'auto' }}>
        {[
          { id: 'feed', label: 'Hoje' },
          { id: 'calendar', label: 'Calendário' },
          { id: 'explore', label: 'Explorar', icone: <IconeBussola /> },
          { id: 'life', label: 'Life' },
          { id: 'vf', label: 'Finanças' },
          { id: 'retrospectiva', label: 'Retrospectiva' },
          { id: 'saved', label: 'Salvos' },
        ].map(t => (
          // `icone` troca o texto da aba por um símbolo; o label continua vivo no
          // title/aria-label, pra leitor de tela e pro tooltip de quem passa o mouse.
          <button key={t.id} onClick={() => setTab(t.id)} title={t.icone ? t.label : undefined} aria-label={t.label} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '12px 0', fontSize: 13, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.3px',
            color: tab === t.id ? '#111' : '#bbb',
            borderBottom: tab === t.id ? '2px solid #111' : '2px solid transparent',
            whiteSpace: 'nowrap', transition: 'all 0.15s', flexShrink: 0,
            display: 'flex', alignItems: 'center',
          }}>{t.icone || t.label}</button>
        ))}
      </div>
    </div>
  );
}

// Bússola da aba Explorar: círculo em linha + agulha, herdando a cor do botão
// (some junto com o cinza quando a aba está inativa).
function IconeBussola() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" focusable="false" style={{ display: 'block' }}>
      <circle cx="10" cy="10" r="7.4" />
      <path d="M13.4 6.6 L11.1 11.1 L6.6 13.4 L8.9 8.9 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

const hojeMid = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const DIAS_SEM = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const capaInput = { width: '100%', padding: '9px 12px', border: '1px solid #e6e6e6', borderRadius: 10, fontSize: 13.5, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', color: '#222' };

// Saudação + data
// Faixa do Modo Viagem: aparece no topo do app inteiro enquanto a viagem está ativa.
// Clicar leva direto pra página da viagem em Life › Viagens.
function FaixaViagem() {
  const life = useLife();
  const nav = useNav();
  const viagem = getViagemAtiva(life.viagensFuturas);
  if (!viagem) return null;
  return (
    <button onClick={() => nav.goViagem(viagem.id)} title="abrir a viagem" style={{ display: 'block', width: '100%', border: 'none', cursor: 'pointer', background: '#19b3a6', color: '#fff', textAlign: 'center', fontSize: 12.5, fontWeight: 700, padding: '7px 12px', letterSpacing: '0.3px', fontFamily: 'inherit' }}>
      ✈ Você está em {viagem.cidade} · {viagem.titulo} ›
    </button>
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

// Nos dias com terapia marcada no Calendário, uma caixa na capa (logo após o humor)
// pra anotar o que aprendeu — vira/atualiza a nota do dia em "Terapia Insights"
// (Aprendizados). Assim não esquece de preencher.
function TerapiaHoje() {
  const cal = useCalendar();
  const life = useLife();
  const today = hojeMid();
  const eventosHoje = itemsForDay(cal.data, today).events;
  const temTerapia = eventosHoje.some(e => e.categoria === 'saude' && /terapia|psic[oó]|psiqui/i.test(e.titulo || ''));
  const dataLabel = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  const ap = life.aprendizados || { topicos: [], notas: [] };
  const topico = (ap.topicos || []).find(t => /terapia/i.test(t.nome || ''));
  // Busca robusta: pela data (chave estável), título === data, ou título que começa com a
  // data (nota renomeada "28/07/2026 - FLIP") — assim renomear não "cria" nota nova.
  const notaHoje = topico ? (ap.notas || []).find(n => n.topicoId === topico.id && (n.data === dataLabel || n.titulo === dataLabel || String(n.titulo || '').startsWith(dataLabel))) : null;
  const sufixo = (notaHoje && String(notaHoje.titulo || '').startsWith(dataLabel) && String(notaHoje.titulo).trim() !== dataLabel) ? String(notaHoje.titulo).slice(dataLabel.length).replace(/^[\s\-–—·|:>/]+/, '').trim() : '';
  const temasSalvo = notaHoje?.temas || sufixo;
  const itens = notaHoje?.itens || [];
  const [txt, setTxt] = useState('');
  const [temas, setTemas] = useState(temasSalvo);
  // O que está digitado também vive num ref: `add` lê e LIMPA o ref na hora, sem
  // esperar o React. Assim dá pra salvar ao SAIR do campo (antes o texto que ela
  // escrevia e não "anotava" simplesmente sumia) sem correr o risco de anotar duas
  // vezes quando o clique no botão vem logo depois do onBlur.
  const txtRef = useRef('');
  const anotarRef = useRef(() => {});
  anotarRef.current = () => {
    const t = txtRef.current.trim();
    if (!t) return;
    txtRef.current = '';
    life.addTerapiaInsight(dataLabel, t);
    setTxt('');
  };
  useEffect(() => { setTemas(temasSalvo); }, [notaHoje?.id]); // eslint-disable-line
  // Fechar o app / trocar de aba com texto na caixa também anota: sair da tela não
  // pode ser a mesma coisa que apagar o que ela acabou de escrever.
  useEffect(() => {
    const aoSair = () => anotarRef.current();
    const aoEsconder = () => { if (document.visibilityState === 'hidden') anotarRef.current(); };
    document.addEventListener('visibilitychange', aoEsconder);
    window.addEventListener('pagehide', aoSair);
    return () => { document.removeEventListener('visibilitychange', aoEsconder); window.removeEventListener('pagehide', aoSair); };
  }, []);
  if (!temTerapia) return null;
  const escrever = (v) => { txtRef.current = v; setTxt(v); };
  const add = () => anotarRef.current();
  const salvarTemas = () => { if ((temas || '').trim() !== (temasSalvo || '').trim()) life.setTerapiaTemas(dataLabel, temas); };
  const cor = '#7a5c9e';
  return (
    <div style={{ marginBottom: 22, border: '1px solid ' + cor + '2e', background: cor + '0a', borderRadius: 16, padding: '13px 16px' }}>
      <div style={{ fontSize: 11, color: cor, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }}>Terapia de hoje ✍</div>
      <p style={{ fontSize: 12, color: '#888', margin: '4px 0 8px' }}>o que você aprendeu? vai pra <b style={{ color: cor }}>Terapia Insights</b> · nota {dataLabel}</p>
      <input value={temas} onChange={e => setTemas(e.target.value)} onBlur={salvarTemas} onKeyDown={e => { if (e.key === 'Enter') { salvarTemas(); e.currentTarget.blur(); } }} placeholder="principais temas (ex.: FLIP, ansiedade)" style={{ ...capaInput, width: '100%', marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={txt} onChange={e => escrever(e.target.value)} onBlur={add} onKeyDown={e => e.key === 'Enter' && add()} placeholder="um aprendizado…" style={{ ...capaInput, flex: 1 }} />
        <button onClick={add} style={{ border: 'none', borderRadius: 10, background: cor, color: '#fff', fontSize: 13, fontWeight: 700, padding: '0 16px', cursor: 'pointer' }}>anotar</button>
      </div>
      {itens.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {itens.map((it, i) => (
            <div key={i} style={{ fontSize: 13, color: '#444', padding: '3px 0', display: 'flex', gap: 7 }}><span style={{ color: cor, flexShrink: 0 }}>•</span><span>{it}</span></div>
          ))}
        </div>
      )}
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

  // Um evento por CATEGORIA aguardada (viagem, cultura…), da mais próxima em diante.
  // Antes era só o mais próximo de todos, e uma exposição em 12 dias escondia a
  // viagem em 20 — a viagem some da capa justo quando ela mais quer ver.
  const aguardados = (cal.data.events || []).filter(e => CAT_BY_ID[e.categoria]?.aguardado);
  const proxEventos = [...new Set(aguardados.map(e => e.categoria))]
    .map(catId => nearest(aguardados.filter(e => e.categoria === catId), e => e.inicio))
    .filter(Boolean)
    .sort((a, b) => a.dias - b.dias);
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
  if (!proxEventos.length && !proxProva && comprasPrazo.length === 0 && culturais.length === 0) return null;
  return (
    <div style={{ marginBottom: 22 }}>
      {proxEventos.map(p => linha('ev-' + p.it.categoria, CAT_BY_ID[p.it.categoria]?.cor || '#999', p.it.titulo, p.dias === 1 ? '1 dia' : p.dias + ' dias'))}
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

// Bilhete que você deixou para hoje (escrito num dia futuro no Calendário) — também
// aparece na capa, logo após o "Neste dia". Toque para ler.
function BilheteHoje() {
  const cal = useCalendar();
  const [aberto, setAberto] = useState(false);
  const bilhete = (cal.data.bilhetes || {})[ymd(hojeMid())];
  if (!bilhete) return null;
  return (
    <div onClick={() => setAberto(v => !v)} style={{ marginBottom: 18, padding: '11px 14px', borderRadius: 12, background: '#fff7ec', border: '1px solid #f0dcc0', cursor: 'pointer' }}>
      <div style={{ fontSize: 12.5, color: '#a9772f', fontWeight: 700 }}>✉ você te deixou um bilhete{aberto ? '' : ' — toque para ler'}</div>
      {aberto && <p style={{ fontSize: 14, color: '#5b4a2e', fontStyle: 'italic', lineHeight: 1.55, marginTop: 8, marginBottom: 0 }}>{bilhete}</p>}
    </div>
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
  // Antes dos itens de hoje vêm as tarefas que REPETEM e ficaram pra trás (ex.: a de
  // todo dia 1): elas não podem ser movidas — a data é a âncora da repetição —, então
  // aparecem aqui marcadas com o dia em que venceram.
  const atrasadas = tarefasRecorrentesAtrasadas(cal.data, hoje);
  const items = [...atrasadas, ...itemsForDay(cal.data, hoje, life.planos).all];
  if (!items.length) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 11, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>hoje</p>
      {items.map(it => (
        <div key={it._atrasadaDe ? it.id + it._atrasadaDe : it.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #f0f0f0' }}>
          {it._tipo === 'tarefa'
            ? <span onClick={() => cal.toggleTask(it.id, it._doneKey)} style={{ fontSize: 18, color: it.feita ? '#54c08a' : '#ccc', cursor: 'pointer' }}>{it.feita ? '☑' : '☐'}</span>
            : it._tipo === 'plano'
              ? <span onClick={() => life.togglePlanoCheck(it.id)} style={{ fontSize: 18, color: '#ccc', cursor: 'pointer', flexShrink: 0 }}>☐</span>
              : <span style={{ width: 9, height: 9, borderRadius: '50%', background: it._cor, flexShrink: 0 }} />}
          <span onClick={() => it._tipo === 'plano' ? setEditCheck(it) : setEditing(it)} title="tocar pra editar" style={{ flex: 1, fontSize: 14, color: '#333', textDecoration: it.feita ? 'line-through' : 'none', opacity: it.feita ? 0.5 : 1, cursor: 'pointer' }}>{it._titulo}</span>
          {it._atrasadaDe && <span style={{ fontSize: 10.5, fontWeight: 700, color: '#c0392b', background: '#c0392b14', borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>atrasada · {it._atrasadaDe.slice(8, 10)}/{it._atrasadaDe.slice(5, 7)}</span>}
          {it._tipo === 'plano' && <span style={{ fontSize: 11.5, color: PLANO_COR, fontWeight: 700, flexShrink: 0 }}>{it._planoNome}</span>}
          {it.trabalho && <span style={trabTag}>trabalho</span>}
          {it.horaInicio && <span style={{ fontSize: 12, color: '#999' }}>{it.horaInicio}</span>}
        </div>
      ))}
      {editing && <AddSheet editing={editing} onClose={() => setEditing(null)} />}
      {editCheck && <Suspense fallback={null}><PlanoCheckSheet item={editCheck} onClose={() => setEditCheck(null)} /></Suspense>}
    </div>
  );
}

// R$ formatado (curto, 2 casas).
const fmtR$ = (v) => 'R$ ' + (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Dia da semana em 3 letras, pra acompanhar a data na lista do VR.
const DIA_ABREV = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

// Agrupa gastos por dia (mais recente primeiro) somando o valor de cada dia.
// Compartilhado pelo VR e pelas caixas do Posso gastar: nos dois, a lista crua
// crescia demais até o fim do ciclo.
const agruparPorDia = (gastos) => {
  const m = {};
  (gastos || []).forEach(g => { const d = g.data || ''; (m[d] = m[d] || []).push(g); });
  return Object.keys(m).sort().reverse().map(d => ({ dia: d, itens: m[d], soma: m[d].reduce((s, x) => s + (Number(x.valor) || 0), 0) }));
};

// Cabeçalho de um dia na lista agrupada:  ▸ 28/07 ter 3×  ....  R$ 76,30
function LinhaDia({ dia, qtd, soma, aberto, cor, onClick, fmt = fmtR$ }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 0', fontSize: 12.5, color: '#666', cursor: 'pointer' }}>
      <span>
        <span style={{ color: cor, fontWeight: 700, fontSize: 10, marginRight: 5 }}>{aberto ? '▾' : '▸'}</span>
        {dia ? dia.slice(8, 10) + '/' + dia.slice(5, 7) : 'sem data'}
        {dia && <span style={{ color: '#aaa', marginLeft: 5 }}>{DIA_ABREV[parseYmd(dia).getDay()]}</span>}
        <span style={{ color: '#c4c4c4', marginLeft: 6, fontSize: 11 }}>{qtd}×</span>
      </span>
      <span style={{ color: '#444', fontWeight: 600 }}>{fmt(soma)}</span>
    </div>
  );
}

// Botão discreto que abre/fecha a lista agrupada por dia.
function BotaoPorDia({ aberto, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'block', width: '100%', border: 'none', background: 'none', color: '#999', fontSize: 11.5, fontWeight: 600, padding: '5px 0', cursor: 'pointer' }}>
      {aberto ? '▴' : '▾'} gasto por dia
    </button>
  );
}

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
  const [data, setData] = useState(ymd(today));
  const [editTotal, setEditTotal] = useState(false);
  const [totalTxt, setTotalTxt] = useState('');
  // A lista crua de gastos crescia demais até o fim do ciclo. Agora ela nasce
  // fechada e, aberta, mostra UMA linha por dia com o valor somado; tocar no dia
  // abre os lançamentos daquele dia (é lá que dá pra corrigir ou apagar um).
  const [verDias, setVerDias] = useState(false);
  const [diaExp, setDiaExp] = useState(null);
  const [editId, setEditId] = useState(null);   // gasto em edição (data + valor)
  const [eVal, setEVal] = useState('');
  const [eData, setEData] = useState('');
  const gastosPorDia = agruparPorDia(gastos);

  // A data é só "em que dia DESTE ciclo o gasto aconteceu" — o gasto pertence ao
  // ciclo aberto de qualquer jeito. Então o campo só anda entre o dia 27 (início
  // do ciclo) e hoje; `noCiclo` trava também quem digitar a data na mão.
  const hojeK = ymd(today);
  const noCiclo = (d) => (!d ? hojeK : d < cycleKey ? cycleKey : d > hojeK ? hojeK : d);

  // Sem valor numérico o "ok" fica apagado (em vez de o toque não fazer nada).
  // Valor do lançamento: aceita conta ("30+45"). Sem número válido o "ok" fica
  // apagado, em vez de o toque simplesmente não fazer nada.
  const numVal = (t) => { const s = String(t).trim(); if (!s) return null; const v = evalValor(s); return (isFinite(v) && v !== 0) ? v : null; };
  const podeAdd = numVal(val) != null;
  const addGasto = () => { const v = numVal(val); if (v == null) return; life.addVrGasto(cycleKey, { valor: v, data: noCiclo(data) }); setVal(''); setData(hojeK); setAddOpen(false); };
  // Conta quebrada NÃO vira zero: não salva e o campo continua aberto com o que
  // ela escreveu (era assim que um valor sumia sem aviso). Vale pros 5 campos
  // de dinheiro editáveis da capa — mesma regra dos Salários e da Carteira.
  const salvarTotal = () => { if (contaInvalida(totalTxt)) return; life.setVrTotal(cycleKey, evalValor(totalTxt)); setEditTotal(false); };
  const abrirEdit = (g) => { setEditId(g.id); setEVal(String(g.valor ?? '')); setEData(g.data || hojeK); };
  const salvarEdit = (id) => { if (contaInvalida(eVal) || !(evalValor(eVal) > 0)) return; life.updateVrGasto(cycleKey, id, { valor: evalValor(eVal), data: noCiclo(eData) }); setEditId(null); };

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
            <input autoFocus={editTotal} type="text" inputMode="decimal" value={totalTxt} onChange={e => setTotalTxt(e.target.value)} onKeyDown={e => e.key === 'Enter' && salvarTotal()} placeholder="ex.: 1000" style={{ ...capaInput, flex: 1 }} />
            <button onClick={salvarTotal} disabled={contaInvalida(totalTxt)} style={{ border: 'none', borderRadius: 10, background: contaInvalida(totalTxt) ? '#ddd' : cor, color: '#fff', fontSize: 13, fontWeight: 700, padding: '0 16px', cursor: contaInvalida(totalTxt) ? 'default' : 'pointer' }}>salvar</button>
          </div>
          <PreviaConta txt={totalTxt} />
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
            <div style={{ marginBottom: gastos.length ? 10 : 0 }}>
              <input type="date" value={data} min={cycleKey} max={hojeK} onChange={e => setData(e.target.value)} title="que dia foi" style={{ ...capaInput, width: 140, marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <input autoFocus type="text" inputMode="decimal" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && addGasto()} placeholder="quanto gastou? ex.: 50" style={{ ...capaInput, flex: 1, minWidth: 0 }} />
                <button onClick={addGasto} disabled={!podeAdd} title={podeAdd ? '' : 'falta o valor (só números)'} style={{ border: 'none', borderRadius: 10, background: podeAdd ? cor : '#ddd', color: '#fff', fontSize: 13, fontWeight: 700, padding: '0 16px', cursor: podeAdd ? 'pointer' : 'default', flexShrink: 0 }}>ok</button>
                <button onClick={() => { setAddOpen(false); setVal(''); setData(hojeK); }} style={{ border: '1px solid #e2e2e2', borderRadius: 10, background: '#fff', color: '#999', fontSize: 18, padding: '0 12px', cursor: 'pointer', flexShrink: 0 }}>×</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddOpen(true)} style={{ display: 'block', width: '100%', border: '1px dashed ' + cor + '66', borderRadius: 10, background: '#fff', color: cor, fontSize: 13, fontWeight: 700, padding: '10px 0', cursor: 'pointer' }}>+ lançar gasto</button>
          )}

          {gastos.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <BotaoPorDia aberto={verDias} onClick={() => setVerDias(v => !v)} />
              {verDias && gastosPorDia.map(d => {
                const aberto = diaExp === d.dia;
                return (
                  <div key={d.dia || 'sem-data'} style={{ borderTop: '1px solid #f0f0f0' }}>
                    <LinhaDia dia={d.dia} qtd={d.itens.length} soma={d.soma} aberto={aberto} cor={cor} onClick={() => setDiaExp(aberto ? null : d.dia)} />
                    {aberto && (
                      <div style={{ paddingLeft: 16, paddingBottom: 5 }}>
                        {d.itens.map(g => editId === g.id ? (
                          <div key={g.id} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '3px 0' }}>
                            <input type="date" value={eData} min={cycleKey} max={hojeK} onChange={e => setEData(e.target.value)} style={{ ...capaInput, width: 128, flexShrink: 0, fontSize: 12, padding: '6px 9px' }} />
                            <input autoFocus value={eVal} onChange={e => setEVal(e.target.value)} inputMode="decimal" onKeyDown={e => { if (e.key === 'Enter') salvarEdit(g.id); if (e.key === 'Escape') setEditId(null); }} placeholder="valor" style={{ ...capaInput, flex: 1, minWidth: 0, fontSize: 12, padding: '6px 9px', textAlign: 'right' }} />
                            <button onClick={() => salvarEdit(g.id)} style={{ border: 'none', borderRadius: 9, background: cor, color: '#fff', fontSize: 12, fontWeight: 700, padding: '0 11px', cursor: 'pointer', flexShrink: 0 }}>ok</button>
                            <button onClick={() => setEditId(null)} style={{ border: '1px solid #e2e2e2', borderRadius: 9, background: '#fff', color: '#999', fontSize: 16, padding: '0 9px', cursor: 'pointer', flexShrink: 0 }}>×</button>
                          </div>
                        ) : (
                          <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '3px 0', fontSize: 12, color: '#8a8a8a' }}>
                            <span onClick={() => abrirEdit(g)} title="tocar pra editar (dia e valor)" style={{ cursor: 'pointer' }}>{fmtR$(g.valor)}</span>
                            <button onClick={() => life.deleteVrGasto(cycleKey, g.id)} title="apagar" style={{ border: 'none', background: 'none', color: '#ccc', fontSize: 15, cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
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
  const [nome, setNome] = useState(bucket === 'mercado' ? 'mercado' : '');   // "o que foi"; Mercado já vem preenchido
  const [editB, setEditB] = useState(false);
  const [bTxt, setBTxt] = useState('');
  const [editId, setEditId] = useState(null); // gasto em edição na lista
  const [eNome, setENome] = useState('');
  const [eVal, setEVal] = useState('');
  const [data, setData] = useState(ymd(hojeMid()));   // dia do gasto que está sendo lançado
  const [eData, setEData] = useState('');             // dia do gasto em edição
  // Mesma lógica do VR: a lista nasce fechada e mostra 1 linha por dia (data +
  // dia da semana + quantas compras + soma); abrir o dia revela cada gasto.
  const [verDias, setVerDias] = useState(false);
  const [diaExp, setDiaExp] = useState(null);
  const gastosPorDia = agruparPorDia(b.gastos);
  const cor = '#b06d1e';
  const comNome = true;                   // Total e Mercado ganham descrição + lista
  const nomeDefault = bucket === 'mercado' ? 'mercado' : ''; // Mercado já vem preenchido (a Mari troca se quiser)
  // Igual ao VR: a data só diz em que dia DESTE ciclo o gasto aconteceu (o gasto
  // pertence ao ciclo aberto), então anda só entre o dia 27 e hoje — `noCiclo`
  // trava também quem digitar a data na mão.
  const hojeK = ymd(hojeMid());
  const noCiclo = (d) => (!d ? hojeK : d < ck ? ck : d > hojeK ? hojeK : d);
  // O "ok" só grava com um valor numérico. Antes ele apenas não fazia nada quando
  // o campo não era número — e num toque errado (valor e descrição trocados de
  // campo) parecia que o app tinha travado. Agora o botão fica apagado e a linha
  // diz o que falta.
  // Valor do lançamento: aceita conta ("30+45"). Sem número válido o "ok" fica
  // apagado, em vez de o toque simplesmente não fazer nada.
  const numVal = (t) => { const s = String(t).trim(); if (!s) return null; const v = evalValor(s); return (isFinite(v) && v !== 0) ? v : null; };
  const podeAdd = numVal(val) != null;
  const add = () => { const v = numVal(val); if (v == null) return; life.addPgGasto(ck, bucket, { valor: v, nome: nome.trim() || undefined, data: noCiclo(data) }); setVal(''); setNome(nomeDefault); setData(hojeK); setAddOpen(false); };
  const salvarB = () => { if (contaInvalida(bTxt)) return; life.setPgBudget(ck, bucket, evalValor(bTxt)); setEditB(false); };
  const abrirEdit = (g) => { setEditId(g.id); setENome(g.nome || nomeDefault); setEVal(String(g.valor ?? '')); setEData(g.data || hojeK); };
  const salvarEdit = (id) => { if (contaInvalida(eVal) || !(evalValor(eVal) > 0)) return; life.updatePgGasto(ck, bucket, id, { valor: evalValor(eVal), data: noCiclo(eData), ...(comNome ? { nome: eNome.trim() || undefined } : {}) }); setEditId(null); };
  return (
    <div style={{ padding: '10px 0', borderTop: '1px solid ' + cor + '22' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#555' }}>{label}</span>
        {temBudget && !editB && <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 21, fontWeight: 700, color: resta < 0 ? '#c0392b' : cor }}>{fmtR$(resta)}</span>}
      </div>
      {!temBudget || editB ? (
        <>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <input autoFocus={editB} type="text" inputMode="decimal" value={bTxt} onChange={e => setBTxt(e.target.value)} onKeyDown={e => e.key === 'Enter' && salvarB()} placeholder={`posso gastar em ${label.toLowerCase()}?`} style={{ ...capaInput, flex: 1 }} />
            <button onClick={salvarB} disabled={contaInvalida(bTxt)} style={{ border: 'none', borderRadius: 10, background: contaInvalida(bTxt) ? '#ddd' : cor, color: '#fff', fontSize: 13, fontWeight: 700, padding: '0 14px', cursor: contaInvalida(bTxt) ? 'default' : 'pointer' }}>salvar</button>
          </div>
          <PreviaConta txt={bTxt} />
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <span style={{ fontSize: 11.5, color: '#999' }}>orçamento <b onClick={() => { setBTxt(String(budget)); setEditB(true); }} style={{ color: cor, cursor: 'pointer' }}>{fmtR$(budget)} ✎</b> · gastou {fmtR$(gasto)}</span>
            {!addOpen && <button onClick={() => setAddOpen(true)} style={{ border: '1px dashed ' + cor + '66', borderRadius: 9, background: '#fff', color: cor, fontSize: 12, fontWeight: 700, padding: '5px 12px', cursor: 'pointer', flexShrink: 0 }}>+ gasto</button>}
          </div>
          {addOpen && (
            <div style={{ marginTop: 8 }}>
              {/* dia + QUANTO em cima, o que foi embaixo: o campo largo da última
                  linha (do lado do "ok") é o que a mão procura por último. */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input type="date" value={data} min={ck} max={hojeK} onChange={e => setData(e.target.value)} title="que dia foi" style={{ ...capaInput, width: 140, flexShrink: 0 }} />
                <input autoFocus type="text" inputMode="decimal" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="quanto gastou?" style={{ ...capaInput, flex: 1, minWidth: 0 }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {comNome && <input type="text" value={nome} onChange={e => setNome(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="o que foi? (opcional)" style={{ ...capaInput, flex: 1, minWidth: 0 }} />}
                <button onClick={add} disabled={!podeAdd} title={podeAdd ? '' : 'falta o valor (só números)'} style={{ border: 'none', borderRadius: 10, background: podeAdd ? cor : '#ddd', color: '#fff', fontSize: 13, fontWeight: 700, padding: '0 14px', cursor: podeAdd ? 'pointer' : 'default', flexShrink: 0 }}>ok</button>
                <button onClick={() => { setAddOpen(false); setVal(''); setNome(nomeDefault); setData(hojeK); }} style={{ border: '1px solid #e2e2e2', borderRadius: 10, background: '#fff', color: '#999', fontSize: 18, padding: '0 11px', cursor: 'pointer', flexShrink: 0 }}>×</button>
              </div>
              {val.trim() && !podeAdd && <p style={{ fontSize: 11.5, color: '#c0392b', margin: '6px 0 0' }}>o valor tem que ser um número (ex.: 23,80) — a descrição vai no campo de baixo.</p>}
            </div>
          )}
          {(b.gastos || []).length > 0 && (
            <div style={{ marginTop: 8 }}>
              <BotaoPorDia aberto={verDias} onClick={() => setVerDias(v => !v)} />
              {verDias && gastosPorDia.map(d => {
                const diaAberto = diaExp === d.dia;
                return (
                  <div key={d.dia || 'sem-data'} style={{ borderTop: '1px solid ' + cor + '1a' }}>
                    <LinhaDia dia={d.dia} qtd={d.itens.length} soma={d.soma} aberto={diaAberto} cor={cor} onClick={() => setDiaExp(diaAberto ? null : d.dia)} />
                    {diaAberto && (
                      <div style={{ paddingLeft: 16, paddingBottom: 5 }}>
                        {d.itens.map(g => editId === g.id ? (
                          <div key={g.id} style={{ padding: '3px 0' }}>
                            {/* mesma ordem do lançamento: dia + valor, depois o que foi */}
                            <div style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
                              <input type="date" value={eData} min={ck} max={hojeK} onChange={e => setEData(e.target.value)} style={{ ...capaInput, width: 128, flexShrink: 0, fontSize: 12, padding: '6px 9px' }} />
                              <input autoFocus value={eVal} onChange={e => setEVal(e.target.value)} inputMode="decimal" onKeyDown={e => { if (e.key === 'Enter') salvarEdit(g.id); if (e.key === 'Escape') setEditId(null); }} placeholder="valor" style={{ ...capaInput, flex: 1, minWidth: 0, fontSize: 12, padding: '6px 9px', textAlign: 'right' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              {comNome && <input value={eNome} onChange={e => setENome(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') salvarEdit(g.id); if (e.key === 'Escape') setEditId(null); }} placeholder="o que foi?" style={{ ...capaInput, flex: 1, minWidth: 0, fontSize: 12, padding: '6px 9px' }} />}
                              <button onClick={() => salvarEdit(g.id)} style={{ border: 'none', borderRadius: 9, background: cor, color: '#fff', fontSize: 12, fontWeight: 700, padding: '0 11px', cursor: 'pointer', flexShrink: 0 }}>ok</button>
                              <button onClick={() => setEditId(null)} style={{ border: '1px solid #e2e2e2', borderRadius: 9, background: '#fff', color: '#999', fontSize: 16, padding: '0 9px', cursor: 'pointer', flexShrink: 0 }}>×</button>
                            </div>
                          </div>
                        ) : (
                          <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#888', padding: '3px 0' }}>
                            {comNome && <span onClick={() => abrirEdit(g)} title="tocar pra editar" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}>{g.nome || '—'}</span>}
                            <span onClick={() => abrirEdit(g)} title="tocar pra editar" style={{ flexShrink: 0, cursor: 'pointer', ...(comNome ? {} : { flex: 1, textAlign: 'left' }) }}>{fmtR$(g.valor)}</span>
                            <span onClick={() => life.deletePgGasto(ck, bucket, g.id)} title="apagar" style={{ cursor: 'pointer', color: '#ccc', fontSize: 15, flexShrink: 0 }}>×</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Valor na moeda da viagem (US$ 40,00). Os limites e os gastos da viagem ficam
// sempre na moeda do lugar; o câmbio só serve pra mostrar o equivalente em reais.
const fmtMoedaVal = (v, moeda) => simboloMoeda(moeda) + ' ' + (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Uma categoria do orçamento da viagem (Hotel, Comida, Roupas…). Mesmo desenho das
// caixas do Posso gastar do mês: limite, gastos lançados no +, e "resta" = limite −
// gasto. O limite NÃO se edita aqui — vem do orçamento definido em Life › Viagens.
function ViagemBucket({ viagemId, cat, moeda, cambio, cor }) {
  const life = useLife();
  const [addOpen, setAddOpen] = useState(false);
  const [val, setVal] = useState('');
  const [nome, setNome] = useState('');
  const [data, setData] = useState(ymd(hojeMid()));
  const [editId, setEditId] = useState(null);
  const [eNome, setENome] = useState('');
  const [eVal, setEVal] = useState('');
  const [eData, setEData] = useState('');
  const [verDias, setVerDias] = useState(false);
  const [diaExp, setDiaExp] = useState(null);
  const gastos = cat.gastos || [];
  const gasto = gastos.reduce((s, g) => s + (Number(g.valor) || 0), 0);
  const limite = Number(cat.limite) || 0;
  const resta = limite - gasto;
  const fmt = (v) => fmtMoedaVal(v, moeda);
  const emReais = (v) => cambio > 0 ? fmtR$((Number(v) || 0) * cambio) : null;
  const gastosPorDia = agruparPorDia(gastos);
  // Mesma trava do Posso gastar: sem valor numérico o "ok" fica apagado, em vez
  // de o toque simplesmente não fazer nada.
  // Valor do lançamento: aceita conta ("30+45"). Sem número válido o "ok" fica
  // apagado, em vez de o toque simplesmente não fazer nada.
  const numVal = (t) => { const s = String(t).trim(); if (!s) return null; const v = evalValor(s); return (isFinite(v) && v !== 0) ? v : null; };
  const podeAdd = numVal(val) != null;
  const add = () => {
    const v = numVal(val);
    if (v == null) return;
    life.addViagemCatGasto(viagemId, cat.id, { valor: v, nome: nome.trim() || undefined, data: data || ymd(hojeMid()) });
    setVal(''); setNome(''); setData(ymd(hojeMid())); setAddOpen(false);
  };
  const abrirEdit = (g) => { setEditId(g.id); setENome(g.nome || ''); setEVal(String(g.valor ?? '')); setEData(g.data || ymd(hojeMid())); };
  const salvarEdit = (id) => {
    if (contaInvalida(eVal) || !(evalValor(eVal) > 0)) return;
    life.updateViagemCatGasto(viagemId, cat.id, id, { valor: evalValor(eVal), nome: eNome.trim() || undefined, data: eData || undefined });
    setEditId(null);
  };
  const btnOk = { border: 'none', borderRadius: 10, background: cor, color: '#fff', fontSize: 13, fontWeight: 700, padding: '0 14px', cursor: 'pointer', flexShrink: 0 };
  const btnX = { border: '1px solid #e2e2e2', borderRadius: 10, background: '#fff', color: '#999', fontSize: 18, padding: '0 11px', cursor: 'pointer', flexShrink: 0 };
  return (
    <div style={{ padding: '10px 0', borderTop: '1px solid ' + cor + '22' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#555' }}>{cat.nome}</span>
        <span style={{ textAlign: 'right', flexShrink: 0 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 21, fontWeight: 700, color: resta < 0 ? '#c0392b' : cor }}>{fmt(resta)}</span>
          {cambio > 0 && <span style={{ display: 'block', fontSize: 10.5, color: '#aaa' }}>≈ {emReais(resta)}</span>}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 2 }}>
        <span style={{ fontSize: 11.5, color: '#999' }}>limite <b style={{ color: cor }}>{fmt(limite)}</b> · gastou {fmt(gasto)}</span>
        {!addOpen && <button onClick={() => setAddOpen(true)} style={{ border: '1px dashed ' + cor + '66', borderRadius: 9, background: '#fff', color: cor, fontSize: 12, fontWeight: 700, padding: '5px 12px', cursor: 'pointer', flexShrink: 0 }}>+ gasto</button>}
      </div>
      {addOpen && (
        <div style={{ marginTop: 8 }}>
          {/* dia + quanto em cima, o que foi embaixo (mesma ordem do Posso gastar) */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input type="date" value={data} onChange={e => setData(e.target.value)} title="que dia foi" style={{ ...capaInput, flex: '0 0 auto', width: 140 }} />
            <input autoFocus type="text" inputMode="decimal" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder={`quanto gastou? (${simboloMoeda(moeda)})`} style={{ ...capaInput, flex: 1, minWidth: 0 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="o que foi? (opcional)" style={{ ...capaInput, flex: 1, minWidth: 0 }} />
            <button onClick={add} disabled={!podeAdd} title={podeAdd ? '' : 'falta o valor (só números)'} style={{ ...btnOk, background: podeAdd ? cor : '#ddd', cursor: podeAdd ? 'pointer' : 'default' }}>ok</button>
            <button onClick={() => { setAddOpen(false); setVal(''); setNome(''); }} style={btnX}>×</button>
          </div>
          {val.trim() && !podeAdd && <p style={{ fontSize: 11.5, color: '#c0392b', margin: '6px 0 0' }}>o valor tem que ser um número — a descrição vai no campo de baixo.</p>}
        </div>
      )}
      {gastos.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <BotaoPorDia aberto={verDias} onClick={() => setVerDias(v => !v)} />
          {verDias && gastosPorDia.map(d => {
            const diaAberto = diaExp === d.dia;
            return (
              <div key={d.dia || 'sem-data'} style={{ borderTop: '1px solid ' + cor + '1a' }}>
                <LinhaDia dia={d.dia} qtd={d.itens.length} soma={d.soma} aberto={diaAberto} cor={cor} fmt={fmt} onClick={() => setDiaExp(diaAberto ? null : d.dia)} />
                {diaAberto && (
                  <div style={{ paddingLeft: 16, paddingBottom: 5 }}>
                    {d.itens.map(g => editId === g.id ? (
                      <div key={g.id} style={{ padding: '3px 0' }}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
                          <input type="date" value={eData} onChange={e => setEData(e.target.value)} style={{ ...capaInput, flex: '0 0 auto', width: 132, fontSize: 12, padding: '6px 9px' }} />
                          <input autoFocus value={eVal} onChange={e => setEVal(e.target.value)} inputMode="decimal" onKeyDown={e => { if (e.key === 'Enter') salvarEdit(g.id); if (e.key === 'Escape') setEditId(null); }} placeholder="valor" style={{ ...capaInput, flex: 1, minWidth: 0, fontSize: 12, padding: '6px 9px', textAlign: 'right' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input value={eNome} onChange={e => setENome(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') salvarEdit(g.id); if (e.key === 'Escape') setEditId(null); }} placeholder="o que foi?" style={{ ...capaInput, flex: 1, minWidth: 0, fontSize: 12, padding: '6px 9px' }} />
                          <button onClick={() => salvarEdit(g.id)} style={{ ...btnOk, fontSize: 12, padding: '0 11px', borderRadius: 9 }}>ok</button>
                          <button onClick={() => setEditId(null)} style={{ ...btnX, fontSize: 16, padding: '0 9px', borderRadius: 9 }}>×</button>
                        </div>
                      </div>
                    ) : (
                      <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#888', padding: '3px 0' }}>
                        <span onClick={() => abrirEdit(g)} title="tocar pra editar" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}>{g.nome || '—'}</span>
                        <span onClick={() => abrirEdit(g)} title="tocar pra editar" style={{ flexShrink: 0, cursor: 'pointer' }}>{fmt(g.valor)}</span>
                        <span onClick={() => life.deleteViagemCatGasto(viagemId, cat.id, g.id)} title="apagar" style={{ cursor: 'pointer', color: '#ccc', fontSize: 15, flexShrink: 0 }}>×</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Posso gastar na viagem: só aparece no Modo Viagem, acima do Posso gastar do mês
// (os dois convivem). As CATEGORIAS, os limites, a moeda e o câmbio vêm do orçamento
// definido em Life › Viagens › a viagem ("definir orçamento"); aqui só se lança o
// gasto — na moeda do lugar e no dia em que ele aconteceu.
function PossoGastarViagem() {
  const life = useLife();
  const nav = useNav();
  const viagem = getViagemAtiva(life.viagensFuturas);
  if (!viagem) return null;
  const oc = getOrcamentoViagem(viagem);
  const cor = '#19b3a6';
  const onde = viagem.cidade || viagem.titulo;
  const fmt = (v) => fmtMoedaVal(v, oc.moeda);
  const limiteTotal = oc.categorias.reduce((s, c) => s + (Number(c.limite) || 0), 0);
  const gastoTotal = oc.categorias.reduce((s, c) => s + (c.gastos || []).reduce((a, g) => a + (Number(g.valor) || 0), 0), 0);
  return (
    <div style={{ marginBottom: 24, border: '1px solid ' + cor + '2e', background: cor + '0a', borderRadius: 16, padding: '12px 16px 8px' }}>
      <div style={{ fontSize: 11, color: cor, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }}>✈ Posso gastar em {onde}</div>
      {oc.categorias.length === 0 ? (
        <div style={{ padding: '10px 0 6px' }}>
          <p style={{ fontSize: 12.5, color: '#888', lineHeight: 1.55, margin: '0 0 10px' }}>Esta viagem ainda não tem orçamento. As categorias (hotel, comida, roupas…), os limites e a moeda são definidos na viagem, em Life › Viagens.</p>
          <button onClick={() => nav.goViagem(viagem.id)} style={{ border: '1px dashed ' + cor + '66', borderRadius: 10, background: '#fff', color: cor, fontSize: 12.5, fontWeight: 700, padding: '8px 14px', cursor: 'pointer' }}>definir orçamento →</button>
        </div>
      ) : <>
        {oc.categorias.map(c => <ViagemBucket key={c.id} viagemId={viagem.id} cat={c} moeda={oc.moeda} cambio={oc.cambio} cor={cor} />)}
        <div style={{ borderTop: '1px solid ' + cor + '22', paddingTop: 7, marginTop: 4, fontSize: 11.5, color: '#999', display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <span>na viagem toda: gastou <b style={{ color: '#555' }}>{fmt(gastoTotal)}</b> de {fmt(limiteTotal)}</span>
          {oc.cambio > 0 && <span>≈ {fmtR$(gastoTotal * oc.cambio)} · câmbio {fmtR$(oc.cambio)}</span>}
        </div>
      </>}
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

// Acompanhamento do dia: a Mari preenche todo dia (sono, trabalho, exercício, comida
// saudável, fio dental, leitura). Salva no calendarStore (chave do dia); o histórico
// aparece na Retrospectiva › Acompanhamento, onde também dá pra editar dias passados.
// Números guardam a hora (aceita 7,5); os hábitos são liga/desliga.
function TrackingHoje() {
  const cal = useCalendar();
  const hojeK = ymd(hojeMid());
  // Dá pra preencher dias anteriores: o seletor de data (discreto, no cabeçalho)
  // troca o dia editado. Começa em hoje. Nunca deixa escolher o futuro (max=hoje).
  const [dataSel, setDataSel] = useState(hojeK);
  const k = dataSel;
  const t = (cal.data.tracking || {})[k] || {};
  const cor = '#3fb6a8';
  // Horas em hh:mm (7:30 = sete e meia). Guarda em horas DECIMAIS por dentro (bom
  // pra tirar média na Retrospectiva); mostra e edita em hh:mm. Aceita também só o
  // número ("8" = 8:00). Texto local pra digitar sem o parse atrapalhar.
  const fmtHM = (v) => { if (v == null) return ''; const tot = Math.round(v * 60); return `${Math.floor(tot / 60)}:${String(tot % 60).padStart(2, '0')}`; };
  const parseHM = (s) => { const str = String(s).trim(); if (!str) return undefined; if (str.includes(':')) { const [h, m] = str.split(':'); const v = (Number(h) || 0) + (Number(m) || 0) / 60; return isFinite(v) ? v : undefined; } const n = Number(str.replace(',', '.')); return isFinite(n) ? n : undefined; };
  const [sono, setSono] = useState(fmtHM(t.sono));
  const [trab, setTrab] = useState(fmtHM(t.trabalho));
  // Ao trocar o dia, os campos de hora recarregam os valores daquele dia.
  useEffect(() => { setSono(fmtHM(t.sono)); setTrab(fmtHM(t.trabalho)); }, [dataSel]); // eslint-disable-line
  const salvarNum = (campo, txt) => { cal.setTracking(k, { [campo]: parseHM(txt) }); };
  const numLabel = { fontSize: 10.5, color: '#999', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 4, fontWeight: 700 };
  const numInput = { width: '100%', padding: '8px 10px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', color: '#222' };
  const toggle = (campo, label) => {
    const on = !!t[campo];
    return (
      <button onClick={() => cal.setTracking(k, { [campo]: !on })} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer',
        border: '1px solid ' + (on ? cor : '#e2e2e2'), background: on ? cor + '1c' : '#fff', color: on ? '#1a7a6e' : '#999',
      }}>{on ? '✓' : '○'} {label}</button>
    );
  };
  return (
    <div style={{ marginBottom: 24, border: '1px solid ' + cor + '2e', background: cor + '0a', borderRadius: 16, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: '#2f746d', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }}>Acompanhamento {k === hojeK ? 'do dia' : 'de'}</span>
        {/* seletor de data discreto: troca o dia editado; nunca deixa ir pro futuro */}
        <input type="date" value={dataSel} max={hojeK} onChange={e => setDataSel(e.target.value || hojeK)} title="escolher o dia" style={{ border: 'none', background: 'transparent', color: k === hojeK ? '#9bb8b3' : '#2f746d', fontSize: 12, fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', padding: 0 }} />
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={numLabel}>Sono (h)</label>
          <input type="text" inputMode="text" value={sono} onChange={e => { setSono(e.target.value); salvarNum('sono', e.target.value); }} placeholder="ex.: 7:30" style={numInput} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={numLabel}>Trabalho (h)</label>
          <input type="text" inputMode="text" value={trab} onChange={e => { setTrab(e.target.value); salvarNum('trabalho', e.target.value); }} placeholder="ex.: 8:00" style={numInput} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {toggle('exercicio', 'Exercício')}
        {toggle('comidaSaudavel', 'Comida saudável')}
        {toggle('fioDental', 'Fio dental')}
        {toggle('leu', 'Leitura')}
      </div>
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
        <BilheteHoje />
        <SeuDia />
        <TerapiaHoje />
        <Antecipacao />
        <LendoAgora />
        <OuvindoAgora />
        <HojeAgenda />
        <PossoGastarViagem />
        <VRHoje />
        <PossoGastarHoje />
        <TrackingHoje />
      </div>
    </div>
  );
}

// Explorar: quatro seções, e só. Os cards de conteúdo (texto, cartas, imagem,
// cena, mito, mundo) saíram em ago/2026 — não era mais essa a intenção do app.
const EXPLORE_SECOES = [
  { id: 'cultural', label: 'Calendário cultural',    cor: '#c2548f', Comp: () => CulturalSection },
  { id: 'assistir', label: 'Conteúdos para assistir', cor: '#4f7cca', Comp: () => AssistirSection },
  { id: 'leituras', label: 'Próximas leituras',       cor: '#7a5c9e', Comp: () => LeiturasSection },
  { id: 'esportes', label: 'Esportes',                cor: '#e2603a', Comp: () => EsportesSection },
];

function ExplorePage({ isWide }) {
  const [sec, setSec] = useState(null);
  const atual = EXPLORE_SECOES.find(s => s.id === sec);
  if (atual) { const Sub = atual.Comp(); return (
    <div style={{ maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <Suspense fallback={<Carregando />}><Sub onBack={() => setSec(null)} backLabel="Explorar" /></Suspense>
    </div>
  ); }
  return (
    <div style={{ padding: '24px 20px 80px' }}>
      <p style={{ fontSize: 11, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 20 }}>escolha um tema</p>
      <div style={{ display: 'grid', gridTemplateColumns: isWide ? 'repeat(auto-fill, minmax(180px, 1fr))' : '1fr 1fr', gap: 12 }}>
        {EXPLORE_SECOES.map(s => (
          <button key={s.id} onClick={() => setSec(s.id)} style={{ background: s.cor + '12', border: '1px solid ' + s.cor + '33', borderRadius: 16, padding: '20px 16px', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: 24, height: 4, background: s.cor, borderRadius: 4, marginBottom: 12 }} />
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#222', fontWeight: 700, lineHeight: 1.2 }}>{s.label}</div>
          </button>
        ))}
      </div>
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
// Aviso de "não está salvo". Ele TEM que existir (foi a falha silenciosa que
// custou um dia inteiro de edições), mas não pode gritar a cada tecla.
//
// O erro anterior: a pendência é marcada em TODO envio e só sai quando a nuvem
// confirma — ou seja, ela existe por uma fração de segundo em qualquer save
// normal. Como o aviso olhava "tem pendência?", ele piscava a cada mudança.
//
// Agora só aparece quando é problema DE VERDADE: pendência VELHA (mais de 2 min
// sem confirmação — save saudável resolve em menos de 1s) ou erro que persiste.
// E discreto: uma tarja fina, sem caixa vermelha no meio da tela.
const PEND_VELHA = 120000;
function SyncAlerta() {
  const [erroFirme, setErroFirme] = useState(false);
  const timer = useRef(null);
  const [velha, setVelha] = useState(0);   // desde quando há pendência não confirmada
  // Aparelho sem espaço: a gravação local não está acontecendo. É o aviso mais
  // grave dos três, porque nesse estado nem o "está guardado neste aparelho" vale.
  const [semEspaco, setSemEspaco] = useState(temSemEspaco);
  useEffect(() => onSemEspaco(setSemEspaco), []);
  useEffect(() => {
    const ver = () => {
      const ts = pendenciasAbertas().map(f => pendenteDesde(f)).filter(Boolean);
      const maisAntiga = ts.length ? Math.min(...ts) : 0;
      setVelha(maisAntiga && (Date.now() - maisAntiga > PEND_VELHA) ? maisAntiga : 0);
    };
    ver();
    const id = setInterval(ver, 20000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => onSyncStatus((s) => {
    if (s === 'saved') { if (timer.current) { clearTimeout(timer.current); timer.current = null; } setErroFirme(false); setVelha(0); }
    else if (s === 'error') { if (!timer.current && !erroFirme) timer.current = setTimeout(() => { timer.current = null; setErroFirme(true); }, 15000); }
  }), [erroFirme]);
  const tarja = (texto, forte) => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, background: forte ? '#fdecec' : '#fff4f4', borderBottom: '1px solid ' + (forte ? '#d98d8d' : '#e8b4b4'), color: '#8a2a2a', fontSize: 11.5, lineHeight: 1.45, padding: '6px 12px', textAlign: 'center', fontWeight: forte ? 700 : 400 }}>
      {texto}
    </div>
  );
  // Sem espaço vem primeiro: é o único caso em que nem o aparelho está guardando.
  if (semEspaco) return tarja('⚠ o aparelho está sem espaço e não estou conseguindo gravar aqui. Baixe uma cópia em Life › Seus dados e me avise.', true);
  if (!erroFirme && !velha) return null;
  const min = velha ? Math.round((Date.now() - velha) / 60000) : 0;
  const quando = !min ? '' : min < 60 ? ` há ${min} min` : ` há ${Math.round(min / 60)}h`;
  return tarja(`⚠ sem salvar na nuvem${quando} — está guardado neste aparelho. Evite abrir em outro até sumir.`);
}

// 401 = a sessão perdeu o direito de gravar (chave ausente/trocada). Era a falha
// silenciosa que custou um dia inteiro: o app continuava usável e nada subia.
// Agora ela para a tela e pede a senha; ao entrar, a chave volta e o pendente sobe.
function PedirSenhaDeNovo({ onSair }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(255,255,255,0.97)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 34, marginBottom: 10 }}>🔒</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#111', margin: '0 0 10px' }}>Preciso da senha de novo</h2>
        <p style={{ fontSize: 13.5, color: '#555', lineHeight: 1.6, margin: '0 0 8px' }}>
          Esta sessão perdeu o acesso e <b>o que você escrever agora não está sendo salvo na nuvem</b>.
        </p>
        <p style={{ fontSize: 12.5, color: '#777', lineHeight: 1.6, margin: '0 0 18px' }}>
          Nada foi perdido: está tudo guardado neste aparelho e sobe assim que você entrar.
        </p>
        <button onClick={onSair} style={{ width: '100%', padding: '13px', background: '#111', border: 'none', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' }}>
          entrar de novo
        </button>
      </div>
    </div>
  );
}

// Uma tela que não CARREGA quase nunca é defeito: é uma versão nova no ar.
// Quando eu publico, cada pedaço do app troca de nome; o app que já estava aberto
// no celular dela ainda conhece os nomes velhos, então o pedaço que ela pedir
// agora dá 404. Estes são os jeitos que os navegadores têm de dizer isso.
export const ehVersaoNova = (msg) => /dynamically imported module|module script failed|Failed to fetch|ChunkLoadError|Loading chunk/i.test(String(msg || ''));

// O recado da versão nova. Fica DENTRO da rede de proteção (que por sua vez está
// dentro dos providers), então pode falar com os stores e salvar antes de
// recarregar — a Mari não precisa lembrar de apertar Salvar primeiro.
// Um botão só, na ordem certa. Não recarrega sozinho de propósito: recarregar sem
// ela mandar interromperia uma frase pela metade.
function AvisoVersaoNova() {
  const life = useLife();
  const cal = useCalendar();
  const saved = useSaved();
  const [salvando, setSalvando] = useState(false);
  const atualizar = async () => {
    setSalvando(true);
    // Best-effort: se a nuvem não responder, recarregar continua seguro — o que
    // ela escreveu está no aparelho e sobe sozinho na próxima abertura.
    try { await Promise.all([life.salvarAgora(), cal.salvarAgora(), saved.salvarAgora()]); } catch { /* segue */ }
    window.location.reload();
  };
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center', maxWidth: 420, margin: '0 auto' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 21, color: '#111', margin: '0 0 10px' }}>Saiu uma versão nova do app</h2>
      <p style={{ fontSize: 13.5, color: '#555', lineHeight: 1.65, margin: '0 0 20px' }}>
        Vou salvar o que você escreveu e recarregar. <b>Nada seu se perde.</b>
      </p>
      <button onClick={atualizar} disabled={salvando} style={{ padding: '13px 24px', background: salvando ? '#999' : '#111', border: 'none', borderRadius: 12, color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: salvando ? 'default' : 'pointer', fontFamily: 'inherit' }}>
        {salvando ? 'salvando…' : 'salvar e atualizar'}
      </button>
    </div>
  );
}

// ---- Rede de proteção das telas ----
// Um erro de programação em QUALQUER tela derrubava o app inteiro pra uma página
// em branco. O pior não era o branco: era que os stores morriam junto, e o que
// estava escrito e ainda não tinha subido ia com eles.
// Agora o tombo fica preso na tela. Os stores ficam POR FORA daqui, então
// continuam vivos e o que estava pendente continua subindo sozinho; ela vê um
// recado em vez de branco, e trocar de aba já limpa o erro.
class RedeDeProtecao extends Component {
  constructor(props) { super(props); this.state = { caiu: null }; }
  static getDerivedStateFromError(e) { return { caiu: String((e && e.message) || e).slice(0, 200) }; }
  componentDidUpdate(anterior) {
    if (anterior.tab !== this.props.tab && this.state.caiu) this.setState({ caiu: null });
  }
  render() {
    if (!this.state.caiu) return this.props.children;
    // Versão nova não é defeito — merece outro recado (e outro botão).
    if (ehVersaoNova(this.state.caiu)) return <AvisoVersaoNova />;
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', maxWidth: 420, margin: '0 auto' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🩹</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 21, color: '#111', margin: '0 0 10px' }}>Esta tela deu problema</h2>
        <p style={{ fontSize: 13.5, color: '#555', lineHeight: 1.65, margin: '0 0 6px' }}>
          <b>Nada seu se perdeu.</b> O que você escreveu está guardado e continua subindo normalmente.
        </p>
        <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6, margin: '0 0 20px' }}>
          Toque em outra aba lá em cima — o resto do app está funcionando. Se quiser tentar de novo, recarregue.
        </p>
        <button onClick={() => window.location.reload()} style={{ padding: '12px 22px', background: '#111', border: 'none', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          recarregar
        </button>
        <p style={{ fontSize: 10.5, color: '#ccc', marginTop: 22, wordBreak: 'break-word' }}>{this.state.caiu}</p>
      </div>
    );
  }
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
  const [viagemInicial, setViagemInicial] = useState(null);
  const goViagem = (id) => { setViagemInicial(id); goTab('life'); };
  const [comprasInicial, setComprasInicial] = useState(null);
  const goCompras = (listaId) => { setComprasInicial(listaId || 'geral'); goTab('life'); };
  useMinuteTick();
  const isWide = useIsWide();
  useEffect(() => { try { sessionStorage.removeItem('diagonal_auth'); } catch {} }, []);
  // Chave recusada pelo servidor: para tudo e pede a senha. O `loggedIn` volta a
  // false e o Login repõe a chave — os envios pendentes destravam sozinhos.
  const [semChave, setSemChave] = useState(false);
  useEffect(() => onSemChave(() => setSemChave(true)), []);
  const handleLogin = () => { setSemChave(false); setLoggedIn(true); };
  if (!loggedIn) return <Login onLogin={handleLogin} />;
  if (semChave) return <PedirSenhaDeNovo onSair={() => { setSemChave(false); setLoggedIn(false); }} />;
  return (
    <SavedProvider>
      <CalendarProvider>
        <LifeProvider>
          <NavContext.Provider value={{ goRetro, goViagem, goCompras }}>
          <div style={{ minHeight: '100dvh', background: '#fafafa', maxWidth: isWide ? 1160 : 480, margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 40 }}>
              <Header tab={tab} setTab={goTab} />
              <FaixaViagem />
            </div>
            {/* A rede de proteção fica AQUI DENTRO, por baixo dos providers: se uma
                tela cair, os stores continuam vivos e o que está por salvar sobe. */}
            <RedeDeProtecao tab={tab + '-' + homeNonce}>
              {/* key = edição (+homeNonce): o feed remonta às 6h/14h e ao reclicar "Hoje" */}
              {tab === 'feed' && <Feed key={getEditionPeriod() + '-' + homeNonce} isWide={isWide} />}
              {tab === 'explore' && <ExplorePage key={homeNonce} isWide={isWide} />}
              {tab === 'saved' && <SavedPage key={homeNonce} isWide={isWide} />}
              {tab === 'calendar' && <Calendario key={homeNonce} isWide={isWide} />}
              <Suspense fallback={<Carregando />}>
                {tab === 'life' && <LifePage key={homeNonce} isWide={isWide} viagemInicial={viagemInicial} onConsumeViagem={() => setViagemInicial(null)} comprasInicial={comprasInicial} onConsumeCompras={() => setComprasInicial(null)} />}
                {tab === 'vf' && <VFPage key={homeNonce} isWide={isWide} />}
                {tab === 'retrospectiva' && <RetrospectivaPage key={homeNonce} isWide={isWide} secInicial={retroSec} onConsumeSec={() => setRetroSec(null)} />}
              </Suspense>
            </RedeDeProtecao>
          </div>
          <SalvarFAB />
          <SyncAlerta />
          </NavContext.Provider>
        </LifeProvider>
      </CalendarProvider>
    </SavedProvider>
  );
}
