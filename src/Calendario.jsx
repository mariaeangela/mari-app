// Aba Calendário (Leva 1). Tipos: Evento, Tarefa, Rolê, Cultura + Humor e
// Diário por dia. Visões: Mês, Agenda, Humor. Adicionar pelo "+" do topo
// (a data é escolhida no formulário, sem rolar o calendário).
import { useState, useEffect, useMemo } from 'react';
import { useCalendar } from './calendarStore.jsx';
import {
  CATEGORIES, CAT_BY_ID, ROLE_COR, CULTURA_COR, TAREFA_COR,
  CULTURA_SUBTIPOS, CULTURA_BY_ID, MOODS, MOOD_BY_ID,
  ymd, parseYmd, pad2, MESES, DIAS_SEMANA, getOnThisDay,
} from './calendarConfig.js';

const hoje = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

// Um evento "acontece" em date? (trata intervalo e repetição)
function eventOccursOn(ev, date) {
  const dayKey = ymd(date);
  if (!ev.repetir || ev.repetir === 'nao') {
    const fim = ev.fim || ev.inicio;
    return dayKey >= ev.inicio && dayKey <= fim;
  }
  if (dayKey < ev.inicio) return false;
  const start = parseYmd(ev.inicio);
  if (ev.repetir === 'semanal') return date.getDay() === start.getDay();
  if (ev.repetir === 'mensal') return date.getDate() === start.getDate();
  if (ev.repetir === 'anual') return date.getMonth() === start.getMonth() && date.getDate() === start.getDate();
  return false;
}

// Todos os itens de um dia, com cor e tipo, para pontinhos e detalhe.
function itemsForDay(data, date) {
  const key = ymd(date);
  const events = data.events.filter(e => eventOccursOn(e, date))
    .map(e => ({ ...e, _tipo: 'evento', _cor: CAT_BY_ID[e.categoria]?.cor || '#999' }));
  const tasks = data.tasks.filter(t => t.data === key)
    .map(t => ({ ...t, _tipo: 'tarefa', _cor: TAREFA_COR }));
  const roles = data.roles.filter(r => r.data === key)
    .map(r => ({ ...r, _tipo: 'role', _cor: ROLE_COR }));
  const cultura = data.cultura.filter(c => c.data === key)
    .map(c => ({ ...c, _tipo: 'cultura', _cor: CULTURA_COR }));
  return { events, tasks, roles, cultura, all: [...events, ...tasks, ...roles, ...cultura] };
}

// ---------------- "Neste dia" ----------------
function NesteDia({ data, today }) {
  const [fato, setFato] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    getOnThisDay(today).then(f => { if (alive) { setFato(f); setLoading(false); } });
    return () => { alive = false; };
  }, [ymd(today)]);

  // Suas lembranças: itens de anos anteriores no mesmo mês-dia.
  const lembrancas = useMemo(() => {
    const mmdd = `${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
    const y = today.getFullYear();
    const out = [];
    const grab = (arr, dateField, label) => arr.forEach(it => {
      const dk = it[dateField]; if (!dk) return;
      const [yy, mm, dd] = dk.split('-');
      if (`${mm}-${dd}` === mmdd && Number(yy) < y) out.push({ anos: y - Number(yy), titulo: it.titulo });
    });
    grab(data.events, 'inicio'); grab(data.cultura, 'data'); grab(data.roles, 'data');
    return out.sort((a, b) => a.anos - b.anos);
  }, [data, ymd(today)]);

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 27, fontWeight: 700, color: '#111', lineHeight: 1.1 }}>
        {today.getDate()} de {MESES[today.getMonth()]}
      </div>
      <div style={{ fontSize: 11, color: '#bbb', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>
        {DIAS_SEMANA[today.getDay()]} · {today.getFullYear()}
      </div>
      {loading ? (
        <p style={{ fontSize: 12, color: '#ccc', fontStyle: 'italic' }}>buscando um fato deste dia…</p>
      ) : fato ? (
        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.55, fontStyle: 'italic' }}>
          <span style={{ fontStyle: 'normal', fontWeight: 700, color: '#999' }}>Neste dia, </span>
          {fato.texto}
          {fato.fonte === 'Wikipédia' && <span style={{ fontSize: 10, color: '#bbb' }}> · via Wikipédia</span>}
        </p>
      ) : null}
      {lembrancas.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {lembrancas.slice(0, 3).map((l, i) => (
            <p key={i} style={{ fontSize: 12.5, color: '#8a6d3b', lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700 }}>Você, há {l.anos} {l.anos === 1 ? 'ano' : 'anos'}:</span> {l.titulo}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- Contagem regressiva (discreta) ----------------
function Countdown({ data, today }) {
  const prox = useMemo(() => {
    let best = null;
    for (const e of data.events) {
      if (!e.inicio || e.inicio <= ymd(today)) continue;
      const dias = Math.round((parseYmd(e.inicio) - today) / 86400000);
      if (dias > 0 && dias <= 60 && (!best || dias < best.dias)) best = { dias, titulo: e.titulo, cor: CAT_BY_ID[e.categoria]?.cor };
    }
    return best;
  }, [data, ymd(today)]);
  if (!prox) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#777', marginBottom: 14 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: prox.cor || '#999' }} />
      faltam <b style={{ color: '#333' }}>{prox.dias}</b> {prox.dias === 1 ? 'dia' : 'dias'}: {prox.titulo}
    </div>
  );
}

// ---------------- Formulário de adicionar/editar ----------------
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', color: '#222' };
const labelStyle = { fontSize: 11, color: '#999', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: 5, marginTop: 14 };

function AddSheet({ initialDate, initialTipo = 'evento', editing, onClose }) {
  const cal = useCalendar();
  const [tipo, setTipo] = useState(editing?._tipo || initialTipo);
  const d0 = initialDate || ymd(hoje());
  // estado por campo (compartilhado entre tipos)
  const [titulo, setTitulo] = useState(editing?.titulo || '');
  const [categoria, setCategoria] = useState(editing?.categoria || CATEGORIES[0].id);
  const [subtipo, setSubtipo] = useState(editing?.subtipo || CULTURA_SUBTIPOS[0].id);
  const [inicio, setInicio] = useState(editing?.inicio || editing?.data || d0);
  const [fim, setFim] = useState(editing?.fim || '');
  const [horaInicio, setHoraInicio] = useState(editing?.horaInicio || '');
  const [horaFim, setHoraFim] = useState(editing?.horaFim || '');
  const [repetir, setRepetir] = useState(editing?.repetir || 'nao');
  const [nota, setNota] = useState(editing?.nota || '');
  const [comQuem, setComQuem] = useState(editing?.comQuem || '');

  const TIPOS = [
    { id: 'evento', label: 'Evento' }, { id: 'tarefa', label: 'Tarefa' },
    { id: 'role', label: 'Rolê' }, { id: 'cultura', label: 'Cultura' },
  ];

  const podeSalvar = titulo.trim().length > 0;
  const salvar = () => {
    if (!podeSalvar) return;
    const base = { id: editing?.id, titulo: titulo.trim() };
    if (tipo === 'evento') cal.saveEvent({ ...base, categoria, inicio, fim: fim || undefined, horaInicio: horaInicio || undefined, horaFim: horaFim || undefined, repetir, nota: nota || undefined, comQuem: comQuem || undefined });
    else if (tipo === 'tarefa') cal.saveTask({ ...base, data: inicio || undefined, nota: nota || undefined, feita: editing?.feita || false });
    else if (tipo === 'role') cal.addRole({ data: inicio, titulo: titulo.trim(), comQuem: comQuem || undefined });
    else if (tipo === 'cultura') cal.saveCultura({ ...base, subtipo, data: inicio, nota: nota || undefined, comQuem: comQuem || undefined });
    onClose();
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fafafa', width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', borderRadius: '20px 20px 0 0', padding: '20px 20px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar' : 'Adicionar'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {!editing && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
            {TIPOS.map(t => (
              <button key={t.id} onClick={() => setTipo(t.id)} style={{
                flex: 1, padding: '8px 0', borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                border: '1px solid ' + (tipo === t.id ? '#111' : '#e2e2e2'),
                background: tipo === t.id ? '#111' : '#fff', color: tipo === t.id ? '#fff' : '#666',
              }}>{t.label}</button>
            ))}
          </div>
        )}

        <label style={labelStyle}>{tipo === 'cultura' ? 'O quê' : 'Título'}</label>
        {tipo === 'role' ? (
          <>
            <input list="savedRoles" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="ex.: barzinho com o pessoal" style={inputStyle} />
            <datalist id="savedRoles">{cal.data.savedRoles.map((r, i) => <option key={i} value={r} />)}</datalist>
          </>
        ) : (
          <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder={tipo === 'cultura' ? 'ex.: A Hora da Estrela' : 'ex.: reunião de equipe'} style={inputStyle} />
        )}

        {tipo === 'evento' && (
          <>
            <label style={labelStyle}>Categoria</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)} style={inputStyle}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </>
        )}
        {tipo === 'cultura' && (
          <>
            <label style={labelStyle}>Tipo</label>
            <select value={subtipo} onChange={e => setSubtipo(e.target.value)} style={inputStyle}>
              {CULTURA_SUBTIPOS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </>
        )}

        <label style={labelStyle}>{tipo === 'evento' ? 'Início' : 'Data'}{tipo === 'tarefa' ? ' (opcional)' : ''}</label>
        <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} style={inputStyle} />

        {tipo === 'evento' && (
          <>
            <label style={labelStyle}>Fim (opcional — para vários dias)</label>
            <input type="date" value={fim} min={inicio} onChange={e => setFim(e.target.value)} style={inputStyle} />
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Hora início</label>
                <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Hora fim</label>
                <input type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <label style={labelStyle}>Repetir</label>
            <select value={repetir} onChange={e => setRepetir(e.target.value)} style={inputStyle}>
              <option value="nao">Não repete</option>
              <option value="semanal">Toda semana</option>
              <option value="mensal">Todo mês</option>
              <option value="anual">Todo ano</option>
            </select>
          </>
        )}

        {(tipo === 'evento' || tipo === 'role' || tipo === 'cultura') && (
          <>
            <label style={labelStyle}>Com quem (opcional)</label>
            <input value={comQuem} onChange={e => setComQuem(e.target.value)} placeholder="ex.: Bia, João" style={inputStyle} />
          </>
        )}
        {tipo !== 'role' && (
          <>
            <label style={labelStyle}>Anotação (opcional)</label>
            <textarea value={nota} onChange={e => setNota(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          </>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          {editing && (
            <button onClick={() => {
              if (tipo === 'evento') cal.deleteEvent(editing.id);
              else if (tipo === 'tarefa') cal.deleteTask(editing.id);
              else if (tipo === 'role') cal.deleteRole(editing.id);
              else if (tipo === 'cultura') cal.deleteCultura(editing.id);
              onClose();
            }} style={{ padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apagar</button>
          )}
          <button onClick={salvar} disabled={!podeSalvar} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: 'none', background: podeSalvar ? '#111' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: podeSalvar ? 'pointer' : 'default' }}>
            {editing ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Detalhe do dia ----------------
function DayModal({ date, onClose, onAdd, onEdit }) {
  const cal = useCalendar();
  const key = ymd(date);
  const { events, tasks, roles, cultura } = itemsForDay(cal.data, date);
  const mood = cal.data.moods[key];

  const linha = (it, extra) => (
    <button key={it.id} onClick={() => onEdit(it)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '10px 12px', marginBottom: 6, cursor: 'pointer' }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: it._cor, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 14, color: '#222', textDecoration: it.feita ? 'line-through' : 'none', opacity: it.feita ? 0.5 : 1 }}>{it.titulo}</span>
      {extra}
    </button>
  );

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fafafa', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', borderRadius: '20px 20px 0 0', padding: '20px 20px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#111', margin: 0 }}>
            {date.getDate()} de {MESES[date.getMonth()]}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>

        {/* Humor do dia */}
        <label style={labelStyle}>Humor do dia</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {MOODS.map(m => (
            <button key={m.id} onClick={() => cal.setMood(key, mood === m.id ? null : m.id)} style={{
              padding: '6px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              border: '1.5px solid ' + (mood === m.id ? m.cor : '#e2e2e2'),
              background: mood === m.id ? m.cor + '22' : '#fff', color: mood === m.id ? '#333' : '#888',
            }}>{m.label}</button>
          ))}
        </div>

        {/* Diário de uma linha */}
        <label style={labelStyle}>Diário (uma linha)</label>
        <input value={cal.data.diary[key] || ''} onChange={e => cal.setDiary(key, e.target.value)}
          placeholder="como foi o dia?" style={inputStyle} />

        {/* Itens do dia */}
        {[['Eventos', events], ['Tarefas', tasks], ['Rolês', roles], ['Cultura', cultura]].map(([titulo, lista]) => lista.length > 0 && (
          <div key={titulo}>
            <label style={labelStyle}>{titulo}</label>
            {lista.map(it => linha(it,
              it._tipo === 'tarefa'
                ? <span onClick={(e) => { e.stopPropagation(); cal.toggleTask(it.id); }} style={{ fontSize: 18, color: it.feita ? '#54c08a' : '#ccc' }}>{it.feita ? '☑' : '☐'}</span>
                : it.horaInicio ? <span style={{ fontSize: 12, color: '#999' }}>{it.horaInicio}</span> : null
            ))}
          </div>
        ))}

        <button onClick={() => onAdd(key)} style={{ width: '100%', marginTop: 18, padding: '12px 0', borderRadius: 11, border: '1px dashed #bbb', background: '#fff', color: '#555', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          + adicionar neste dia
        </button>
      </div>
    </div>
  );
}

// ---------------- Visão Mês ----------------
function MonthView({ refDate, setRefDate, onDayClick, moodMode }) {
  const cal = useCalendar();
  const y = refDate.getFullYear(), m = refDate.getMonth();
  const first = new Date(y, m, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const todayKey = ymd(hoje());

  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button onClick={() => setRefDate(new Date(y, m - 1, 1))} style={navBtn}>‹</button>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#222', textTransform: 'capitalize' }}>{MESES[m]} {y}</span>
        <button onClick={() => setRefDate(new Date(y, m + 1, 1))} style={navBtn}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {DIAS_SEMANA.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.5px', paddingBottom: 4 }}>{d}</div>)}
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const key = ymd(date);
          const { all } = itemsForDay(cal.data, date);
          const mood = cal.data.moods[key];
          const isToday = key === todayKey;
          const bg = moodMode && mood ? MOOD_BY_ID[mood]?.cor + '33' : (isToday ? '#1110' : 'transparent');
          return (
            <button key={i} onClick={() => onDayClick(date)} style={{
              aspectRatio: '1', border: isToday ? '1.5px solid #111' : '1px solid #eee', borderRadius: 10,
              background: moodMode && mood ? MOOD_BY_ID[mood]?.cor + '2e' : '#fff', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
              padding: '4px 2px', position: 'relative',
            }}>
              <span style={{ fontSize: 12.5, color: isToday ? '#111' : '#555', fontWeight: isToday ? 700 : 500 }}>{date.getDate()}</span>
              {!moodMode && all.length > 0 && (
                <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', marginTop: 3 }}>
                  {all.slice(0, 4).map((it, j) => <span key={j} style={{ width: 5, height: 5, borderRadius: '50%', background: it._cor }} />)}
                </div>
              )}
              {moodMode && mood && <span style={{ fontSize: 8, color: '#666', marginTop: 'auto', paddingBottom: 2 }}>{MOOD_BY_ID[mood]?.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
const navBtn = { background: 'none', border: '1px solid #e2e2e2', borderRadius: 8, width: 32, height: 32, fontSize: 18, color: '#666', cursor: 'pointer', lineHeight: 1 };

// ---------------- Visão Agenda ----------------
function AgendaView({ onEdit }) {
  const cal = useCalendar();
  const start = hoje();
  // próximos 60 dias com itens
  const dias = [];
  for (let i = 0; i < 60; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const { all } = itemsForDay(cal.data, d);
    if (all.length) dias.push({ d, all });
  }
  const semData = cal.data.tasks.filter(t => !t.data && !t.feita);
  if (!dias.length && !semData.length) return <p style={{ textAlign: 'center', color: '#bbb', fontSize: 13, padding: '40px 0', fontStyle: 'italic' }}>Nada por aqui ainda. Toque no + para adicionar.</p>;
  return (
    <div>
      {semData.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: '#999', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>Tarefas sem data</div>
          {semData.map(t => (
            <button key={t.id} onClick={() => onEdit({ ...t, _tipo: 'tarefa' })} style={agendaRow}>
              <span onClick={(e) => { e.stopPropagation(); cal.toggleTask(t.id); }} style={{ fontSize: 18, color: '#ccc' }}>☐</span>
              <span style={{ fontSize: 14, color: '#222' }}>{t.titulo}</span>
            </button>
          ))}
        </div>
      )}
      {dias.map(({ d, all }) => (
        <div key={ymd(d)} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#888', fontWeight: 700, marginBottom: 6 }}>
            {DIAS_SEMANA[d.getDay()]}, {d.getDate()} {MESES[d.getMonth()].slice(0, 3)}
          </div>
          {all.map(it => (
            <button key={it.id} onClick={() => onEdit(it)} style={agendaRow}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: it._cor, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 14, color: '#222', textDecoration: it.feita ? 'line-through' : 'none', opacity: it.feita ? 0.5 : 1 }}>{it.titulo}</span>
              {it.horaInicio && <span style={{ fontSize: 12, color: '#999' }}>{it.horaInicio}</span>}
              {it._tipo === 'cultura' && <span style={{ fontSize: 10, color: CULTURA_COR, textTransform: 'uppercase' }}>{CULTURA_BY_ID[it.subtipo]?.label}</span>}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
const agendaRow = { display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '10px 12px', marginBottom: 6, cursor: 'pointer' };

// ---------------- Página principal ----------------
export default function Calendario({ isWide }) {
  const today = hoje();
  const cal = useCalendar();
  const [view, setView] = useState('mes'); // mes | agenda | humor
  const [refDate, setRefDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [dayModal, setDayModal] = useState(null);   // Date
  const [addSheet, setAddSheet] = useState(null);   // { date, editing }

  const VIEWS = [['mes', 'Mês'], ['agenda', 'Agenda'], ['humor', 'Humor']];

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <NesteDia data={cal.data} today={today} />
      <Countdown data={cal.data} today={today} />

      {/* + adicionar no topo + alternador de visão */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 4, background: '#f0f0f0', borderRadius: 10, padding: 3, flex: 1 }}>
          {VIEWS.map(([id, label]) => (
            <button key={id} onClick={() => setView(id)} style={{
              flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', border: 'none',
              background: view === id ? '#fff' : 'transparent', color: view === id ? '#111' : '#999',
              boxShadow: view === id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>{label}</button>
          ))}
        </div>
        <button onClick={() => setAddSheet({ date: ymd(today) })} style={{
          width: 42, height: 42, borderRadius: 12, border: 'none', background: '#111', color: '#fff',
          fontSize: 24, cursor: 'pointer', lineHeight: 1, flexShrink: 0,
        }}>+</button>
      </div>

      {view === 'agenda'
        ? <AgendaView onEdit={(it) => setAddSheet({ editing: it })} />
        : <MonthView refDate={refDate} setRefDate={setRefDate} onDayClick={setDayModal} moodMode={view === 'humor'} />}

      {view === 'humor' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14, justifyContent: 'center' }}>
          {MOODS.map(m => (
            <span key={m.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#888' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: m.cor }} />{m.label}
            </span>
          ))}
        </div>
      )}

      {dayModal && (
        <DayModal date={dayModal} onClose={() => setDayModal(null)}
          onAdd={(dateKey) => { setDayModal(null); setAddSheet({ date: dateKey }); }}
          onEdit={(it) => { setDayModal(null); setAddSheet({ editing: it }); }} />
      )}
      {addSheet && (
        <AddSheet initialDate={addSheet.date} editing={addSheet.editing} onClose={() => setAddSheet(null)} />
      )}
    </div>
  );
}
