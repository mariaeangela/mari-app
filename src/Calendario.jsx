// Aba Calendário. Tipos: Evento, Exercício (treino/corrida), Tarefa, Rolê,
// Cultura + Humor e Diário por dia. Visões: Mês, Agenda, Exercício, Humor.
// "+" no topo adiciona escolhendo a data no formulário.
import { useState, useMemo, useEffect } from 'react';
import { useCalendar } from './calendarStore.jsx';
import { useLife, simboloMoeda } from './lifeStore.jsx';
import { PlanoCheckSheet } from './Life.jsx';
import {
  CATEGORIES, CAT_BY_ID, EXERCICIO_SUBTIPOS, EXERCICIO_BY_ID,
  ROLE_COR, CULTURA_COR, TAREFA_COR, CULTURA_SUBTIPOS, CULTURA_BY_ID,
  MOODS, MOOD_BY_ID, LEGENDA, EXERCICIO_LEGENDA, ymd, parseYmd, pad2, MESES, DIAS_SEMANA, getOnThisDay,
  parseTempo, fmtTempo, paceSecs, fmtPace, fmtKm, parseKm,
} from './calendarConfig.js';

const hoje = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const exTitulo = (x) => x.titulo || EXERCICIO_BY_ID[x.subtipo]?.label || 'Exercício';
// Rótulo da corrida: "6km - Centro Histórico" (distância antes do nome).
const corridaLabel = (x) => (x.distancia ? `${fmtKm(x.distancia)}km - ` : '') + exTitulo(x) + (x.tempo ? ` · ${fmtTempo(x.tempo)}` : '');
// meta de tempo formatada (aceita segundos OU string legada "50:00").
const metaLabel = (m) => { if (m == null || m === '') return ''; const s = typeof m === 'number' ? m : parseTempo(m); return s ? fmtTempo(s) : ''; };
// Ordem do dia (Agenda e detalhe do dia): eventos de trabalho SEM horário no
// topo, depois itens com horário em ordem cronológica, e por fim os demais sem horário.
const dayOrder = (a, b) => {
  const rank = (it) => (it._tipo === 'evento' && it.categoria === 'trabalho' && !it.horaInicio) ? 0 : (it.horaInicio ? 1 : 2);
  const ra = rank(a), rb = rank(b);
  if (ra !== rb) return ra - rb;
  return ra === 1 ? a.horaInicio.localeCompare(b.horaInicio) : 0;
};
// Mesma ordem, mas tarefas concluídas vão para o fim da lista.
const tarefaFeita = (it) => (it._tipo === 'tarefa' && it.feita ? 1 : 0);
const dayOrderDoneLast = (a, b) => (tarefaFeita(a) - tarefaFeita(b)) || dayOrder(a, b);

// Ocorrência de algo que começa em startKey e repete (usado por evento e tarefa).
function recurOccursOn(startKey, repetir, date) {
  const dayKey = ymd(date);
  if (dayKey < startKey) return false;
  const start = parseYmd(startKey);
  if (repetir === 'semanal') return date.getDay() === start.getDay();
  if (repetir === 'mensal') return date.getDate() === start.getDate();
  if (repetir === 'anual') return date.getMonth() === start.getMonth() && date.getDate() === start.getDate();
  return false;
}

export function eventOccursOn(ev, date) {
  const dayKey = ymd(date);
  if ((ev.excecoes || []).includes(dayKey)) return false;  // ocorrência apagada
  if (!ev.repetir || ev.repetir === 'nao') {
    const fim = ev.fim || ev.inicio;
    return dayKey >= ev.inicio && dayKey <= fim;
  }
  return recurOccursOn(ev.inicio, ev.repetir, date);
}

function taskOccursOn(t, date) {
  const dayKey = ymd(date);
  if ((t.excecoes || []).includes(dayKey)) return false;
  if (!t.repetir || t.repetir === 'nao') return t.data === dayKey;
  return recurOccursOn(t.data, t.repetir, date);
}

// "Rotina" = não aparece no Mês/Agenda (só na visão Exercício): treinos
// musculares (costas/peitoral/perna) e corrida treino. Corrida prova e Outros aparecem.
const ehRotina = (x) => EXERCICIO_BY_ID[x.subtipo]?.grupo === 'treino' || x.subtipo === 'corrida_treino';
const ehCorrida = (x) => EXERCICIO_BY_ID[x.subtipo]?.grupo === 'corrida';

export const PLANO_COR = '#6b7a99';
// `planos` (opcional, = life.planos) injeta itens do checklist de Planos com `prazo` neste dia.
export function itemsForDay(data, date, planos) {
  const key = ymd(date);
  const events = (data.events || []).filter(e => eventOccursOn(e, date))
    .map(e => ({ ...e, _tipo: 'evento', _cor: CAT_BY_ID[e.categoria]?.cor || '#999', _titulo: e.titulo, _dia: key }));
  const exercicios = (data.exercicios || []).filter(x => x.data === key)
    .map(x => ({ ...x, _tipo: 'exercicio', _cor: EXERCICIO_BY_ID[x.subtipo]?.cor || '#999', _titulo: ehCorrida(x) ? corridaLabel(x) : exTitulo(x) }));
  const tasks = (data.tasks || []).filter(t => t.data && taskOccursOn(t, date))
    .map(t => ({ ...t, _tipo: 'tarefa', _cor: t.trabalho ? '#4f7cff' : TAREFA_COR, _titulo: t.titulo, _doneKey: key, _dia: key, feita: (t.feitas || []).includes(key) }));
  const roles = (data.roles || []).filter(r => r.data === key)
    .map(r => ({ ...r, _tipo: 'role', _cor: ROLE_COR, _titulo: r.titulo + (r.local ? ' · ' + r.local : '') }));
  // 'lendo'/'ouvindo' não entram no dia/calendário — só aparecem nas seções fixas
  // "Lendo/Ouvindo no momento" (e voltam ao calendário como 'lido'/'ouvido' ao concluir).
  const cultura = (data.cultura || []).filter(c => c.data === key && c.subtipo !== 'lendo' && c.subtipo !== 'ouvindo')
    .map(c => ({ ...c, _tipo: 'cultura', _cor: CULTURA_COR, _titulo: c.titulo }));
  let planoItens = [];
  if (planos) {
    const nomeDe = (pid) => (planos.lista || []).find(p => p.id === pid)?.nome || 'Plano';
    planoItens = (planos.itens || []).filter(i => i.prazo === key && !i.feito)
      .map(i => ({ ...i, _tipo: 'plano', _cor: PLANO_COR, _titulo: i.texto, _planoNome: nomeDe(i.planoId), _dia: key }));
  }
  const all = [...events, ...exercicios, ...tasks, ...roles, ...cultura, ...planoItens].sort(dayOrderDoneLast);
  return { events, exercicios, tasks, roles, cultura, planoItens, all };
}

// Itens do dia para as visões Mês/Agenda: exclui os treinos de grupo muscular
// (que só aparecem na visão Exercício). Corrida e "outros" permanecem.
export function itemsGeral(data, date, planos) {
  return itemsForDay(data, date, planos).all.filter(it => !(it._tipo === 'exercicio' && ehRotina(it)));
}

// ---------------- "Neste dia" (data + suas lembranças). O fato histórico
// "Neste dia, em XXXX..." foi para a aba Hoje. ----------------
function NesteDia({ data, today, onHoje }) {
  const lembrancas = useMemo(() => {
    const mmdd = `${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
    const y = today.getFullYear();
    const out = [];
    const grab = (arr, f) => arr.forEach(it => {
      const dk = it[f]; if (!dk) return;
      const [yy, mm, dd] = dk.split('-');
      if (`${mm}-${dd}` === mmdd && Number(yy) < y) out.push({ anos: y - Number(yy), titulo: it.titulo || exTitulo(it) });
    });
    grab(data.events, 'inicio'); grab(data.exercicios, 'data'); grab(data.cultura, 'data'); grab(data.roles, 'data');
    return out.sort((a, b) => a.anos - b.anos);
  }, [data, ymd(today)]);

  return (
    <div style={{ marginBottom: 16 }}>
      <div onClick={onHoje} title="voltar ao mês atual" style={{ fontFamily: "'Playfair Display', serif", fontSize: 27, fontWeight: 700, color: '#111', lineHeight: 1.1, cursor: onHoje ? 'pointer' : 'default', display: 'inline-block' }}>
        {today.getDate()} de {MESES[today.getMonth()]}
      </div>
      <div style={{ fontSize: 11, color: '#bbb', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>
        {DIAS_SEMANA[today.getDay()]} · {today.getFullYear()}
      </div>
      {lembrancas.slice(0, 3).map((l, i) => (
        <p key={i} style={{ fontSize: 12.5, color: '#8a6d3b', lineHeight: 1.5, marginTop: i === 0 ? 8 : 0 }}>
          <span style={{ fontWeight: 700 }}>Você, há {l.anos} {l.anos === 1 ? 'ano' : 'anos'}:</span> {l.titulo}
        </p>
      ))}
    </div>
  );
}

// ---------------- Contagem regressiva ----------------
// Só o que dá pra "aguardar": viagem, aniversário, corrida (cat/sub com aguardado).
function Countdown({ data, today }) {
  const prox = useMemo(() => {
    const cands = [];
    data.events.forEach(e => { const c = CAT_BY_ID[e.categoria]; if (c?.aguardado && e.inicio > ymd(today)) cands.push({ key: e.inicio, titulo: e.titulo, cor: c.cor }); });
    data.exercicios.forEach(x => { const s = EXERCICIO_BY_ID[x.subtipo]; if (s?.aguardado && x.data > ymd(today)) cands.push({ key: x.data, titulo: exTitulo(x), cor: s.cor }); });
    let best = null;
    cands.forEach(c => { const dias = Math.round((parseYmd(c.key) - today) / 86400000); if (dias > 0 && dias <= 90 && (!best || dias < best.dias)) best = { dias, ...c }; });
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

// ---------------- Formulário ----------------
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', color: '#222' };
const labelStyle = { fontSize: 11, color: '#999', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: 5, marginTop: 14 };

export function AddSheet({ initialDate, editing, onClose }) {
  const cal = useCalendar();
  const [tipo, setTipo] = useState(editing?._tipo || 'evento');
  const d0 = initialDate || ymd(hoje());
  const [titulo, setTitulo] = useState(editing?.titulo || '');
  const [categoria, setCategoria] = useState(editing?.categoria || CATEGORIES[0].id);
  const [subtipoCult, setSubtipoCult] = useState((editing?._tipo === 'cultura' && editing?.subtipo) || CULTURA_SUBTIPOS[0].id);
  const [subtipoEx, setSubtipoEx] = useState((editing?._tipo === 'exercicio' && editing?.subtipo) || EXERCICIO_SUBTIPOS[0].id);
  const [semDataChk, setSemDataChk] = useState(editing?._tipo === 'tarefa' && !editing?.data);
  const [inicio, setInicio] = useState(editing?.inicio || editing?.data || d0);
  const [fim, setFim] = useState(editing?.fim || '');
  const [horaInicio, setHoraInicio] = useState(editing?.horaInicio || '');
  const [horaFim, setHoraFim] = useState(editing?.horaFim || '');
  const [repetir, setRepetir] = useState(editing?.repetir || 'nao');
  const [distancia, setDistancia] = useState(editing?.distancia != null ? fmtKm(editing.distancia) : '');
  const [tempo, setTempo] = useState(editing?.tempo != null ? fmtTempo(editing.tempo) : '');
  const [metaTempo, setMetaTempo] = useState(editing?.metaTempo != null ? fmtTempo(editing.metaTempo) : '');
  const [nota, setNota] = useState(editing?.nota || '');
  const [comQuem, setComQuem] = useState(editing?.comQuem || '');
  const [local, setLocal] = useState(editing?.local || '');
  const [trabalho, setTrabalho] = useState(editing?.trabalho || false);

  const TIPOS = [
    { id: 'evento', label: 'Evento' }, { id: 'exercicio', label: 'Exercício' },
    { id: 'tarefa', label: 'Tarefa' }, { id: 'role', label: 'Rolê' }, { id: 'cultura', label: 'Cultura' },
  ];
  const podeSalvar = tipo === 'exercicio' ? true : titulo.trim().length > 0;

  // Monta o objeto do tipo escolhido (sem id) — usado na conversão de tipo.
  const buildObj = () => {
    if (tipo === 'evento') return { titulo: titulo.trim(), categoria, inicio, fim: fim || undefined, horaInicio: horaInicio || undefined, horaFim: horaFim || undefined, repetir, nota: nota || undefined, comQuem: comQuem || undefined };
    if (tipo === 'exercicio') return { subtipo: subtipoEx, titulo: titulo.trim() || undefined, data: inicio, horaInicio: horaInicio || undefined, distancia: parseKm(distancia), tempo: parseTempo(tempo) || undefined, metaTempo: parseTempo(metaTempo) || undefined, nota: nota || undefined };
    if (tipo === 'tarefa') return { titulo: titulo.trim(), data: semDataChk ? undefined : inicio, repetir: semDataChk ? undefined : (repetir === 'nao' ? undefined : repetir), nota: nota || undefined, trabalho: trabalho || undefined, feita: false };
    if (tipo === 'role') return { data: inicio, titulo: titulo.trim(), horaInicio: horaInicio || undefined, comQuem: comQuem || undefined, local: local || undefined };
    return { subtipo: subtipoCult, titulo: titulo.trim(), data: inicio, horaInicio: horaInicio || undefined, nota: nota || undefined, comQuem: comQuem || undefined };
  };

  const salvar = () => {
    if (!podeSalvar) return;
    const origTipo = editing?._tipo;
    if (editing && origTipo && tipo !== origTipo) {  // mudou de tipo -> vira novo item
      cal.convertItem(origTipo, editing.id, tipo, buildObj());
      onClose();
      return;
    }
    const base = { id: editing?.id, titulo: titulo.trim() };
    if (tipo === 'evento') cal.saveEvent({ ...base, categoria, inicio, fim: fim || undefined, horaInicio: horaInicio || undefined, horaFim: horaFim || undefined, repetir, nota: nota || undefined, comQuem: comQuem || undefined });
    else if (tipo === 'exercicio') cal.saveExercicio({ id: editing?.id, subtipo: subtipoEx, titulo: titulo.trim() || undefined, data: inicio, horaInicio: horaInicio || undefined, distancia: parseKm(distancia), tempo: parseTempo(tempo) || undefined, metaTempo: parseTempo(metaTempo) || undefined, nota: nota || undefined });
    else if (tipo === 'tarefa') cal.saveTask({ ...base, data: semDataChk ? undefined : inicio, repetir: semDataChk ? undefined : (repetir === 'nao' ? undefined : repetir), nota: nota || undefined, trabalho: trabalho || undefined, feita: semDataChk ? (editing?.feita || false) : false, feitas: editing?.feitas });
    else if (tipo === 'role') {
      const r = { data: inicio, titulo: titulo.trim(), horaInicio: horaInicio || undefined, comQuem: comQuem || undefined, local: local || undefined };
      if (editing?.id) cal.updateRole({ ...r, id: editing.id }); else cal.addRole(r);
    }
    else if (tipo === 'cultura') cal.saveCultura({ ...base, subtipo: subtipoCult, data: inicio, horaInicio: horaInicio || undefined, nota: nota || undefined, comQuem: comQuem || undefined });
    onClose();
  };

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar' : 'Adicionar'}</h3>
          <button onClick={onClose} style={closeBtn}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {TIPOS.map(t => (
            <button key={t.id} onClick={() => setTipo(t.id)} style={{
              flex: '1 0 auto', padding: '8px 10px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: '1px solid ' + (tipo === t.id ? '#111' : '#e2e2e2'),
              background: tipo === t.id ? '#111' : '#fff', color: tipo === t.id ? '#fff' : '#666',
            }}>{t.label}</button>
          ))}
        </div>
        {editing && tipo !== editing._tipo && (
          <p style={{ fontSize: 11, color: '#a9772f', marginTop: 6 }}>Vai converter de "{TIPOS.find(t => t.id === editing._tipo)?.label}" para "{TIPOS.find(t => t.id === tipo)?.label}".</p>
        )}

        {tipo === 'exercicio' && (
          <>
            <label style={labelStyle}>Tipo</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {EXERCICIO_SUBTIPOS.map(s => (
                <button key={s.id} onClick={() => setSubtipoEx(s.id)} style={{
                  flex: '1 0 auto', padding: '8px 12px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                  border: '1.5px solid ' + (subtipoEx === s.id ? s.cor : '#e2e2e2'),
                  background: subtipoEx === s.id ? s.cor + '22' : '#fff', color: subtipoEx === s.id ? '#333' : '#888',
                }}>{s.label}</button>
              ))}
            </div>
          </>
        )}

        <label style={labelStyle}>
          {tipo === 'cultura' ? 'O quê' : tipo === 'exercicio' ? 'Nome (opcional)' : 'Título'}
        </label>
        {tipo === 'role' ? (
          <>
            <input list="savedRoles" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="ex.: barzinho com o pessoal" style={inputStyle} />
            <datalist id="savedRoles">{cal.data.savedRoles.map((r, i) => <option key={i} value={r} />)}</datalist>
          </>
        ) : (
          <input value={titulo} onChange={e => setTitulo(e.target.value)}
            placeholder={tipo === 'cultura' ? 'ex.: A Hora da Estrela' : tipo === 'exercicio' ? 'ex.: academia, parque…' : 'ex.: reunião de equipe'} style={inputStyle} />
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
            <select value={subtipoCult} onChange={e => setSubtipoCult(e.target.value)} style={inputStyle}>
              {CULTURA_SUBTIPOS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </>
        )}

        {tipo === 'tarefa' && (
          <>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 13, color: '#444', cursor: 'pointer' }}>
              <input type="checkbox" checked={semDataChk} onChange={e => setSemDataChk(e.target.checked)} />
              Sem data (vai para a lista "Tarefas sem data")
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 13, color: '#444', cursor: 'pointer' }}>
              <input type="checkbox" checked={trabalho} onChange={e => setTrabalho(e.target.checked)} />
              Tarefa de trabalho
            </label>
          </>
        )}
        {!(tipo === 'tarefa' && semDataChk) && (
          <>
            <label style={labelStyle}>{tipo === 'evento' ? 'Início' : 'Data'}</label>
            <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} style={inputStyle} />
          </>
        )}
        {tipo === 'tarefa' && !semDataChk && (
          <>
            <label style={labelStyle}>Repetir</label>
            <select value={repetir} onChange={e => setRepetir(e.target.value)} style={inputStyle}>
              <option value="nao">Não repete</option><option value="semanal">Toda semana</option>
              <option value="mensal">Todo mês</option><option value="anual">Todo ano</option>
            </select>
          </>
        )}

        {tipo === 'evento' && (
          <>
            <label style={labelStyle}>Fim (opcional — vários dias)</label>
            <input type="date" value={fim} min={inicio} onChange={e => setFim(e.target.value)} style={inputStyle} />
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}><label style={labelStyle}>Hora início</label><input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} style={inputStyle} /></div>
              <div style={{ flex: 1 }}><label style={labelStyle}>Hora fim</label><input type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)} style={inputStyle} /></div>
            </div>
            <label style={labelStyle}>Repetir</label>
            <select value={repetir} onChange={e => setRepetir(e.target.value)} style={inputStyle}>
              <option value="nao">Não repete</option><option value="semanal">Toda semana</option>
              <option value="mensal">Todo mês</option><option value="anual">Todo ano</option>
            </select>
          </>
        )}

        {(tipo === 'exercicio' || tipo === 'role' || tipo === 'cultura') && (
          <>
            <label style={labelStyle}>Horário (opcional)</label>
            <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} style={inputStyle} />
          </>
        )}
        {tipo === 'exercicio' && EXERCICIO_BY_ID[subtipoEx]?.grupo === 'corrida' && (
          <>
            <label style={labelStyle}>Distância em km (opcional)</label>
            <input type="text" inputMode="decimal" value={distancia} onChange={e => setDistancia(e.target.value)} placeholder="ex.: 5.2" style={inputStyle} />
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Tempo real (opcional)</label>
                <input type="text" inputMode="numeric" value={tempo} onChange={e => setTempo(e.target.value)} placeholder="ex.: 32:10" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Meta de tempo (opcional)</label>
                <input type="text" inputMode="numeric" value={metaTempo} onChange={e => setMetaTempo(e.target.value)} placeholder="ex.: 30:00" style={inputStyle} />
              </div>
            </div>
            {(() => {
              const d = parseKm(distancia) || 0;
              const pReal = paceSecs(parseTempo(tempo), d);
              const pMeta = paceSecs(parseTempo(metaTempo), d);
              if (!pReal && !pMeta) return null;
              return (
                <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 12.5, color: '#666' }}>
                  {pReal && <span>pace real <b style={{ color: '#ef6c4d' }}>{fmtPace(pReal)}</b></span>}
                  {pMeta && <span>pace meta <b style={{ color: '#888' }}>{fmtPace(pMeta)}</b></span>}
                </div>
              );
            })()}
          </>
        )}

        {(tipo === 'evento' || tipo === 'role' || tipo === 'cultura') && (
          <>
            <label style={labelStyle}>Com quem (opcional)</label>
            <input value={comQuem} onChange={e => setComQuem(e.target.value)} placeholder="ex.: Bia, João" style={inputStyle} />
          </>
        )}
        {tipo === 'role' && (
          <>
            <label style={labelStyle}>Onde (opcional)</label>
            <input value={local} onChange={e => setLocal(e.target.value)} placeholder="ex.: Bar do Zé, casa da Bia…" style={inputStyle} />
          </>
        )}
        {tipo !== 'role' && (
          <>
            <label style={labelStyle}>Anotação (opcional)</label>
            <textarea value={nota} onChange={e => setNota(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          </>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
          {editing && (() => {
            const ot = editing._tipo;
            const recorrente = (ot === 'evento' || ot === 'tarefa') && editing.repetir && editing.repetir !== 'nao' && editing._dia;
            const apagarSerie = () => {
              if (ot === 'evento') cal.deleteEvent(editing.id);
              else if (ot === 'exercicio') cal.deleteExercicio(editing.id);
              else if (ot === 'tarefa') cal.deleteTask(editing.id);
              else if (ot === 'role') cal.deleteRole(editing.id);
              else if (ot === 'cultura') cal.deleteCultura(editing.id);
              onClose();
            };
            const apagarEsteDia = () => {
              if (ot === 'evento') cal.addEventExcecao(editing.id, editing._dia);
              else cal.addTaskExcecao(editing.id, editing._dia);
              onClose();
            };
            return recorrente
              ? <>
                  <button onClick={apagarEsteDia} style={delBtn}>Só este dia</button>
                  <button onClick={apagarSerie} style={delBtn}>A série toda</button>
                </>
              : <button onClick={apagarSerie} style={delBtn}>Apagar</button>;
          })()}
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
  const life = useLife();
  const [editCheck, setEditCheck] = useState(null);
  const key = ymd(date);
  const todayKey = ymd(hoje());
  const { events, exercicios, tasks, roles, cultura, planoItens } = itemsForDay(cal.data, date, life.planos);
  const mood = (cal.data.moods || {})[key];

  const linha = (it, extra) => (
    <button key={it.id} onClick={() => onEdit(it)} style={rowBtn}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: it._cor, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 14, color: '#222', textDecoration: it.feita ? 'line-through' : 'none', opacity: it.feita ? 0.5 : 1 }}>{it._titulo}</span>
      {it._tipo === 'tarefa' && it.trabalho && <span style={trabTag}>trabalho</span>}
      {extra}
    </button>
  );

  return (
    <div onClick={onClose} style={{ ...overlay, zIndex: 150 }}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#111', margin: 0 }}>{date.getDate()} de {MESES[date.getMonth()]}</h3>
          <button onClick={onClose} style={closeBtn}>×</button>
        </div>

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

        <label style={labelStyle}>Diário (uma linha)</label>
        <input value={cal.data.diary[key] || ''} onChange={e => cal.setDiary(key, e.target.value)} placeholder="como foi o dia?" style={inputStyle} />

        {key > todayKey && (
          <>
            <label style={labelStyle}>✉ Bilhete para o futuro</label>
            <textarea value={(cal.data.bilhetes || {})[key] || ''} onChange={e => cal.setBilhete(key, e.target.value)} rows={2}
              placeholder="escreva algo para você ler quando este dia chegar" style={{ ...inputStyle, resize: 'vertical' }} />
          </>
        )}
        {key <= todayKey && (cal.data.bilhetes || {})[key] && (
          <>
            <label style={labelStyle}>✉ Bilhete</label>
            <p style={{ fontSize: 14, color: '#5b4a2e', fontStyle: 'italic', lineHeight: 1.5, background: '#fff7ec', border: '1px solid #f0dcc0', borderRadius: 10, padding: '10px 12px' }}>{(cal.data.bilhetes || {})[key]}</p>
          </>
        )}

        {[['Eventos', events], ['Exercício', exercicios], ['Tarefas', tasks], ['Rolês', roles], ['Cultura', cultura]].map(([t, lista]) => lista.length > 0 && (
          <div key={t}>
            <label style={labelStyle}>{t}</label>
            {lista.slice().sort(dayOrderDoneLast).map(it => linha(it,
              it._tipo === 'tarefa'
                ? <span onClick={(e) => { e.stopPropagation(); cal.toggleTask(it.id, it._doneKey); }} style={{ fontSize: 18, color: it.feita ? '#54c08a' : '#ccc' }}>{it.feita ? '☑' : '☐'}</span>
                : it.horaInicio ? <span style={{ fontSize: 12, color: '#999' }}>{it.horaInicio}</span> : null
            ))}
          </div>
        ))}

        {planoItens.length > 0 && (
          <div>
            <label style={labelStyle}>Planos</label>
            {planoItens.map(i => (
              <div key={i.id} style={{ ...rowBtn, cursor: 'default' }}>
                <span onClick={(e) => { e.stopPropagation(); life.togglePlanoCheck(i.id); }} style={{ fontSize: 18, color: '#ccc', cursor: 'pointer' }}>☐</span>
                <span onClick={() => setEditCheck(i)} title="tocar pra editar" style={{ flex: 1, fontSize: 14, color: '#222', cursor: 'pointer' }}>{i._titulo}</span>
                <span style={{ fontSize: 11.5, color: PLANO_COR, fontWeight: 700 }}>{i._planoNome}</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => onAdd(key)} style={dashedBtn}>+ adicionar neste dia</button>
      </div>
      {editCheck && <PlanoCheckSheet item={editCheck} onClose={() => setEditCheck(null)} />}
    </div>
  );
}

// ---------------- Visão Mês ----------------
function MonthView({ refDate, setRefDate, onDayClick, moodMode, getDots }) {
  const cal = useCalendar();
  const y = refDate.getFullYear(), m = refDate.getMonth();
  const startPad = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const todayKey = ymd(hoje());
  // Em vez de células vazias, preenche os dias de fora (mês anterior no início,
  // próximo mês no fim) apagados — completa a 1ª e a última semana, dando um
  // overview que cruza a virada do mês.
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push({ date: new Date(y, m, 1 - (startPad - i)), out: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(y, m, d), out: false });
  let nd = 1;
  while (cells.length % 7 !== 0) cells.push({ date: new Date(y, m + 1, nd++), out: true });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button onClick={() => setRefDate(new Date(y, m - 1, 1))} style={navBtn}>‹</button>
        <span onClick={() => { const t = hoje(); setRefDate(new Date(t.getFullYear(), t.getMonth(), 1)); }} title="voltar ao mês atual" style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#222', textTransform: 'capitalize', cursor: 'pointer' }}>{MESES[m]} {y}</span>
        <button onClick={() => setRefDate(new Date(y, m + 1, 1))} style={navBtn}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {DIAS_SEMANA.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.5px', paddingBottom: 4 }}>{d}</div>)}
        {cells.map(({ date, out }, i) => {
          const key = ymd(date);
          const dots = moodMode ? [] : (getDots ? getDots(date) : itemsForDay(cal.data, date).all);
          const mood = (cal.data.moods || {})[key];
          const isToday = key === todayKey;
          return (
            <button key={i} onClick={() => onDayClick(date)} style={{
              aspectRatio: '1', border: '1px solid #eee', borderRadius: 10,
              background: moodMode && mood ? MOOD_BY_ID[mood]?.cor + '2e' : (out ? '#fafafa' : '#fff'), cursor: 'pointer',
              opacity: out ? 0.5 : 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '4px 2px',
            }}>
              <span style={isToday
                ? { fontSize: 12, fontWeight: 700, color: '#fff', background: '#111', borderRadius: '50%', width: 19, height: 19, display: 'flex', alignItems: 'center', justifyContent: 'center' }
                : { fontSize: 12.5, color: out ? '#aaa' : '#555', fontWeight: 500 }}>{date.getDate()}</span>
              {!moodMode && dots.length > 0 && (
                <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', marginTop: 3 }}>
                  {dots.slice(0, 4).map((it, j) => <span key={j} style={{ width: 5, height: 5, borderRadius: '50%', background: it._cor }} />)}
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

// Legenda de cores (chips)
function Legenda({ items }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 14 }}>
      {items.map((it, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#888' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: it.cor }} />{it.label}
        </span>
      ))}
    </div>
  );
}

// ---------------- Visão Humor (Mês / Ano / Diário) ----------------
function HumorView({ data, onDayClick }) {
  const [sub, setSub] = useState('mes');
  const [refDate, setRefDate] = useState(() => { const t = hoje(); return new Date(t.getFullYear(), t.getMonth(), 1); });
  const [year, setYear] = useState(() => hoje().getFullYear());
  const moodLegenda = MOODS.map(m => ({ label: m.label, cor: m.cor }));
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, justifyContent: 'center' }}>
        {[['mes', 'Mês'], ['ano', 'Ano'], ['diario', 'Diário']].map(([id, label]) => (
          <button key={id} onClick={() => setSub(id)} style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            border: '1px solid ' + (sub === id ? '#111' : '#e2e2e2'), background: sub === id ? '#111' : '#fff', color: sub === id ? '#fff' : '#888',
          }}>{label}</button>
        ))}
      </div>
      {sub === 'mes' && <><MonthView refDate={refDate} setRefDate={setRefDate} onDayClick={onDayClick} moodMode /><Legenda items={moodLegenda} /></>}
      {sub === 'ano' && <YearMoodGrid year={year} setYear={setYear} moods={data.moods} onDayClick={onDayClick} legenda={moodLegenda} />}
      {sub === 'diario' && <DiarioList refDate={refDate} setRefDate={setRefDate} data={data} onDayClick={onDayClick} />}
    </div>
  );
}

function MiniMonth({ year, month, moods, onDayClick }) {
  const startPad = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  // Completa 1ª e última semana com os dias de fora (apagados), igual à visão Mês.
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push({ date: new Date(year, month, 1 - (startPad - i)), out: true });
  for (let d = 1; d <= days; d++) cells.push({ date: new Date(year, month, d), out: false });
  let nd = 1;
  while (cells.length % 7 !== 0) cells.push({ date: new Date(year, month + 1, nd++), out: true });
  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', fontWeight: 700, marginBottom: 5, textTransform: 'capitalize' }}>{MESES[month]}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map(({ date, out }, i) => {
          const mood = moods[ymd(date)];
          return <button key={i} onClick={() => onDayClick(date)} title={String(date.getDate())} style={{
            aspectRatio: '1', borderRadius: 3, border: 'none', padding: 0, cursor: 'pointer',
            background: mood ? MOOD_BY_ID[mood]?.cor : '#f1f1f1',
            opacity: out ? 0.35 : 1,
          }} />;
        })}
      </div>
    </div>
  );
}

function YearMoodGrid({ year, setYear, moods, onDayClick, legenda }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <button onClick={() => setYear(year - 1)} style={navBtn}>‹</button>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#222' }}>{year}</span>
        <button onClick={() => setYear(year + 1)} style={navBtn}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {Array.from({ length: 12 }, (_, m) => <MiniMonth key={m} year={year} month={m} moods={moods} onDayClick={onDayClick} />)}
      </div>
      <Legenda items={legenda} />
    </div>
  );
}

function DiarioList({ refDate, setRefDate, data, onDayClick }) {
  const y = refDate.getFullYear(), m = refDate.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  const entries = [];
  for (let d = days; d >= 1; d--) {  // mais recente primeiro
    const date = new Date(y, m, d); const k = ymd(date);
    if (data.moods[k] || data.diary[k]) entries.push({ date, k, mood: data.moods[k], diary: data.diary[k] });
  }
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button onClick={() => setRefDate(new Date(y, m - 1, 1))} style={navBtn}>‹</button>
        <span onClick={() => { const t = hoje(); setRefDate(new Date(t.getFullYear(), t.getMonth(), 1)); }} title="voltar ao mês atual" style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#222', textTransform: 'capitalize', cursor: 'pointer' }}>{MESES[m]} {y}</span>
        <button onClick={() => setRefDate(new Date(y, m + 1, 1))} style={navBtn}>›</button>
      </div>
      {!entries.length ? <p style={{ textAlign: 'center', color: '#bbb', fontSize: 13, padding: '30px 0', fontStyle: 'italic' }}>Nada escrito neste mês ainda.</p>
        : entries.map(e => (
          <button key={e.k} onClick={() => onDayClick(e.date)} style={{ ...rowBtn, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#999', minWidth: 22 }}>{e.date.getDate()}</span>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: e.mood ? MOOD_BY_ID[e.mood]?.cor : '#e2e2e2', flexShrink: 0, marginTop: 4 }} />
            <span style={{ flex: 1, fontSize: 14, color: e.diary ? '#222' : '#bbb', fontStyle: 'italic', lineHeight: 1.4 }}>{e.diary || '(sem diário)'}</span>
          </button>
        ))}
    </div>
  );
}

// ---------------- Visão Agenda (Próximos / Passado) ----------------
function AgendaView({ onEdit }) {
  const cal = useCalendar();
  const life = useLife();
  const [modo, setModo] = useState('proximos');
  const start = hoje();
  const dias = [];
  if (modo === 'proximos') {
    for (let i = 0; i < 90; i++) { const d = new Date(start); d.setDate(start.getDate() + i); const all = itemsGeral(cal.data, d, life.planos); if (all.length) dias.push({ d, all }); }
  } else {
    for (let i = 1; i <= 180; i++) { const d = new Date(start); d.setDate(start.getDate() - i); const all = itemsGeral(cal.data, d, life.planos); if (all.length) dias.push({ d, all }); }
  }
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[['proximos', 'Próximos'], ['passado', 'Passado']].map(([id, label]) => (
          <button key={id} onClick={() => setModo(id)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
            border: '1px solid ' + (modo === id ? '#111' : '#e2e2e2'), background: modo === id ? '#111' : '#fff', color: modo === id ? '#fff' : '#888',
          }}>{label}</button>
        ))}
      </div>
      {!dias.length ? <p style={{ textAlign: 'center', color: '#bbb', fontSize: 13, padding: '30px 0', fontStyle: 'italic' }}>{modo === 'proximos' ? 'Nada à frente ainda. Toque no + para adicionar.' : 'Nada no passado registrado.'}</p>
        : dias.map(({ d, all }) => (
          <div key={ymd(d)} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#888', fontWeight: 700, marginBottom: 6 }}>{DIAS_SEMANA[d.getDay()]}, {d.getDate()} {MESES[d.getMonth()].slice(0, 3)}</div>
            {all.map(it => it._tipo === 'plano' ? (
              <div key={it.id} style={rowBtn}>
                <span onClick={() => life.togglePlanoCheck(it.id)} style={{ fontSize: 18, color: '#ccc', cursor: 'pointer' }}>☐</span>
                <span style={{ flex: 1, fontSize: 14, color: '#222' }}>{it._titulo}</span>
                <span style={{ fontSize: 11.5, color: PLANO_COR, fontWeight: 700 }}>{it._planoNome}</span>
              </div>
            ) : it._tipo === 'tarefa' ? (
              <div key={it.id} style={rowBtn}>
                <span onClick={() => cal.toggleTask(it.id, it._doneKey)} style={{ fontSize: 18, color: it.feita ? '#54c08a' : '#ccc', cursor: 'pointer' }}>{it.feita ? '☑' : '☐'}</span>
                <span onClick={() => onEdit(it)} style={{ flex: 1, fontSize: 14, color: '#222', cursor: 'pointer', textDecoration: it.feita ? 'line-through' : 'none', opacity: it.feita ? 0.5 : 1 }}>{it._titulo}</span>
                {it.trabalho && <span style={trabTag}>trabalho</span>}
              </div>
            ) : (
              <button key={it.id} onClick={() => onEdit(it)} style={rowBtn}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: it._cor, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14, color: '#222' }}>{it._titulo}</span>
                {it.horaInicio && <span style={{ fontSize: 12, color: '#999' }}>{it.horaInicio}</span>}
                {it._tipo === 'cultura' && <span style={{ fontSize: 10, color: CULTURA_COR, textTransform: 'uppercase' }}>{CULTURA_BY_ID[it.subtipo]?.label}</span>}
              </button>
            ))}
          </div>
        ))}
    </div>
  );
}

// ---------------- Próximas corridas (abaixo do calendário de Exercício) ----------------
function ProximasCorridas({ data, today, onEdit }) {
  const tk = ymd(today);
  const list = data.exercicios.filter(x => ehCorrida(x) && x.subtipo !== 'corrida_treino' && x.data >= tk).sort((a, b) => a.data.localeCompare(b.data));
  return (
    <div style={{ marginTop: 22, borderTop: '1px solid #eee', paddingTop: 16 }}>
      <div style={{ fontSize: 11, color: EXERCICIO_BY_ID.corrida.cor, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Próximas corridas</div>
      {!list.length ? <p style={{ fontSize: 12.5, color: '#bbb', fontStyle: 'italic' }}>Nenhuma corrida marcada.</p>
        : list.map(x => {
          const d = parseYmd(x.data);
          return (
            <button key={x.id} onClick={() => onEdit({ ...x, _tipo: 'exercicio' })} style={rowBtn}>
              <span style={{ fontSize: 12, color: EXERCICIO_BY_ID.corrida.cor, fontWeight: 700, minWidth: 52 }}>{d.getDate()} {MESES[d.getMonth()].slice(0, 3)}</span>
              <span style={{ flex: 1, fontSize: 14, color: '#222' }}>{corridaLabel(x)}</span>
              {x.metaTempo != null && x.metaTempo !== '' && <span style={{ fontSize: 12, fontWeight: 700, color: EXERCICIO_BY_ID.corrida.cor, whiteSpace: 'nowrap', flexShrink: 0 }}>🎯 {metaLabel(x.metaTempo)}</span>}
              {x.horaInicio && <span style={{ fontSize: 12, color: '#999' }}>{x.horaInicio}</span>}
            </button>
          );
        })}
    </div>
  );
}

// ---------------- Resumo de Exercício (acima do calendário de exercício) ----------------
function ExSummary({ data }) {
  const grupo = (g) => data.exercicios.filter(x => EXERCICIO_BY_ID[x.subtipo]?.grupo === g).length;
  const nT = grupo('treino'), nC = grupo('corrida'), nO = grupo('outros');
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 14, fontSize: 12.5, color: '#777' }}>
      <span><b style={{ color: '#5b8def' }}>{nT}</b> treino{nT === 1 ? '' : 's'}</span>
      <span><b style={{ color: EXERCICIO_BY_ID.corrida.cor }}>{nC}</b> corrida{nC === 1 ? '' : 's'}</span>
      <span><b style={{ color: '#8d99ae' }}>{nO}</b> outro{nO === 1 ? '' : 's'}</span>
    </div>
  );
}

// ---------------- Lista de exercícios (por data, editável) ----------------
// Alternativa à visão de calendário: lista simples agrupada por data (ordem
// cronológica, mais antigo primeiro), pra editar rápido. Separada em Próximos /
// Passado, igual à Agenda (padrão: Próximos).
function ExerciciosList({ data, onEdit }) {
  const [modo, setModo] = useState('proximos');
  const tk = ymd(hoje());
  const list = [...data.exercicios]
    .filter(x => modo === 'proximos' ? (x.data || '') >= tk : (x.data || '') < tk)
    .sort((a, b) => (a.data || '').localeCompare(b.data || ''));
  const grupos = [];
  let atual = null;
  for (const x of list) {
    if (!atual || atual.data !== x.data) { atual = { data: x.data, itens: [] }; grupos.push(atual); }
    atual.itens.push(x);
  }
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[['proximos', 'Próximos'], ['passado', 'Passado']].map(([id, label]) => (
          <button key={id} onClick={() => setModo(id)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
            border: '1px solid ' + (modo === id ? '#111' : '#e2e2e2'), background: modo === id ? '#111' : '#fff', color: modo === id ? '#fff' : '#888',
          }}>{label}</button>
        ))}
      </div>
      {!list.length && <p style={{ textAlign: 'center', color: '#bbb', fontSize: 13, padding: '30px 0', fontStyle: 'italic' }}>{modo === 'proximos' ? 'Nenhum exercício futuro marcado.' : 'Nenhum exercício no passado ainda.'}</p>}
      {grupos.map(g => {
        const d = g.data ? parseYmd(g.data) : null;
        return (
          <div key={g.data || 'sem'} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#888', fontWeight: 700, marginBottom: 6 }}>{d ? `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}` : 'Sem data'}</div>
            {g.itens.map(x => {
              const corrida = ehCorrida(x);
              const cor = EXERCICIO_BY_ID[x.subtipo]?.cor || '#999';
              return (
                <button key={x.id} onClick={() => onEdit({ ...x, _tipo: 'exercicio' })} style={rowBtn}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: cor, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 14, color: '#222' }}>{corrida ? corridaLabel(x) : exTitulo(x)}</span>
                  {corrida && x.metaTempo != null && x.metaTempo !== '' && <span style={{ fontSize: 12, fontWeight: 700, color: cor, whiteSpace: 'nowrap', flexShrink: 0 }}>🎯 {metaLabel(x.metaTempo)}</span>}
                  {x.horaInicio && <span style={{ fontSize: 12, color: '#999' }}>{x.horaInicio}</span>}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ---------------- Metas do mês ----------------
const META_COR = '#caa43a';
function MetasMes({ mesKey, mesLabel }) {
  const cal = useCalendar();
  const [txt, setTxt] = useState('');
  const metas = cal.data.metas?.[mesKey] || [];
  const add = () => { cal.addMeta(mesKey, txt); setTxt(''); };
  return (
    <div style={{ marginTop: 22, borderTop: '1px solid #eee', paddingTop: 16 }}>
      <div style={{ fontSize: 11, color: META_COR, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Metas de {mesLabel}</div>
      {metas.map(m => (
        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #f3f3f3' }}>
          <span onClick={() => cal.toggleMeta(mesKey, m.id)} style={{ fontSize: 18, color: m.feito ? '#54c08a' : '#ccc', cursor: 'pointer', flexShrink: 0 }}>{m.feito ? '☑' : '☐'}</span>
          <span style={{ flex: 1, fontSize: 14, color: '#333', textDecoration: m.feito ? 'line-through' : 'none', opacity: m.feito ? 0.5 : 1 }}>{m.texto}</span>
          <button onClick={() => cal.deleteMeta(mesKey, m.id)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>×</button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <input value={txt} onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder={`nova meta de ${mesLabel.toLowerCase()}…`} style={{ ...inputStyle, flex: 1 }} />
        <button onClick={add} style={{ padding: '0 16px', borderRadius: 10, border: 'none', background: '#111', color: '#fff', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>+</button>
      </div>
    </div>
  );
}

// ---------------- Página principal ----------------
export default function Calendario({ isWide }) {
  const today = hoje();
  const cal = useCalendar();
  const [view, setView] = useState('mes');
  const [refDate, setRefDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const life = useLife();
  const [dayModal, setDayModal] = useState(null);
  const [addSheet, setAddSheet] = useState(null);
  const [bilheteAberto, setBilheteAberto] = useState(false);
  const [compraAberta, setCompraAberta] = useState(null);
  const [editCheck, setEditCheck] = useState(null);
  const [verFeitas, setVerFeitas] = useState(false);
  const [exView, setExView] = useState('cal'); // dentro de Exercício: 'cal' (calendário) | 'lista'

  const VIEWS = [['mes', 'Mês'], ['agenda', 'Agenda'], ['exercicio', 'Exercício'], ['humor', 'Humor']];
  const lendo = (cal.data.cultura || []).filter(c => c.subtipo === 'lendo');
  const ouvindo = (cal.data.cultura || []).filter(c => c.subtipo === 'ouvindo');
  const bilheteHoje = (cal.data.bilhetes || {})[ymd(today)];
  // Tarefas sem data: pendentes (visíveis) e concluídas (escondidas atrás de um botão).
  const tarefasPendentes = (cal.data.tasks || []).filter(t => !t.data && !t.feita);
  const tarefasConcluidas = (cal.data.tasks || []).filter(t => !t.data && t.feita).sort((a, b) => (b.feitaEm || '').localeCompare(a.feitaEm || ''));
  const temSemData = cal.data.tasks.some(t => !t.data);
  // Compras com data limite no mês exibido (refDate).
  const mesKey = `${refDate.getFullYear()}-${pad2(refDate.getMonth() + 1)}`;
  const comprasDoMes = (life.compras.itens || []).filter(i => i.dataLimite && i.dataLimite.slice(0, 7) === mesKey)
    .sort((a, b) => a.dataLimite.localeCompare(b.dataLimite));
  const culturalDoMes = (life.cultural?.itens || []).filter(i => i.dataMax && i.dataMax.slice(0, 7) === mesKey)
    .sort((a, b) => a.dataMax.localeCompare(b.dataMax));
  // Planos do mês: prazo do próprio plano e/ou itens do checklist com prazo no mês (pendentes),
  // agrupados sob o plano a que pertencem.
  const itensPrazoMes = (life.planos?.itens || []).filter(i => i.prazo && !i.feito && i.prazo.slice(0, 7) === mesKey);
  const planoIdsMes = [...new Set([
    ...(life.planos?.lista || []).filter(p => p.prazo && p.prazo.slice(0, 7) === mesKey).map(p => p.id),
    ...itensPrazoMes.map(i => i.planoId),
  ])];
  const planosDoMes = planoIdsMes
    .map(id => {
      const p = (life.planos?.lista || []).find(x => x.id === id);
      if (!p) return null;
      const itens = itensPrazoMes.filter(i => i.planoId === id).sort((a, b) => a.prazo.localeCompare(b.prazo));
      const prazoPlano = (p.prazo && p.prazo.slice(0, 7) === mesKey) ? p.prazo : null;
      return { id, nome: p.nome, prazoPlano, itens };
    })
    .filter(Boolean)
    .sort((a, b) => (a.prazoPlano || a.itens[0]?.prazo || '9999').localeCompare(b.prazoPlano || b.itens[0]?.prazo || '9999'));
  const dm = (s) => s.slice(8, 10) + '/' + s.slice(5, 7);

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <NesteDia data={cal.data} today={today} onHoje={() => setRefDate(new Date(today.getFullYear(), today.getMonth(), 1))} />
      <Countdown data={cal.data} today={today} />

      {bilheteHoje && (
        <div onClick={() => setBilheteAberto(v => !v)} style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 12, background: '#fff7ec', border: '1px solid #f0dcc0', cursor: 'pointer' }}>
          <div style={{ fontSize: 12.5, color: '#a9772f', fontWeight: 700 }}>✉ você te deixou um bilhete{bilheteAberto ? '' : ' — toque para ler'}</div>
          {bilheteAberto && <p style={{ fontSize: 14, color: '#5b4a2e', fontStyle: 'italic', lineHeight: 1.5, marginTop: 8 }}>{bilheteHoje}</p>}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 3, background: '#f0f0f0', borderRadius: 10, padding: 3, flex: 1 }}>
          {VIEWS.map(([id, label]) => (
            <button key={id} onClick={() => setView(id)} style={{
              flex: 1, padding: '7px 2px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', border: 'none',
              background: view === id ? '#fff' : 'transparent', color: view === id ? '#111' : '#999',
              boxShadow: view === id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>{label}</button>
          ))}
        </div>
        <button onClick={() => setAddSheet({ date: ymd(today) })} style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>+</button>
      </div>

      {view === 'agenda' && <AgendaView onEdit={(it) => setAddSheet({ editing: it })} />}
      {view === 'exercicio' && <ExSummary data={cal.data} />}
      {/* Exercício: alterna entre calendário (pontinhos) e lista editável */}
      {view === 'exercicio' && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[['cal', 'Calendário'], ['lista', 'Lista']].map(([id, label]) => (
            <button key={id} onClick={() => setExView(id)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
              border: '1px solid ' + (exView === id ? '#111' : '#e2e2e2'), background: exView === id ? '#111' : '#fff', color: exView === id ? '#fff' : '#888',
            }}>{label}</button>
          ))}
        </div>
      )}
      {view === 'exercicio' && exView === 'lista' && <ExerciciosList data={cal.data} onEdit={(it) => setAddSheet({ editing: it })} />}
      {(view === 'mes' || (view === 'exercicio' && exView === 'cal')) && (
        <MonthView refDate={refDate} setRefDate={setRefDate} onDayClick={setDayModal}
          getDots={view === 'exercicio'
            ? (d) => itemsForDay(cal.data, d).exercicios
            : (d) => itemsGeral(cal.data, d, life.planos)} />
      )}
      {view === 'humor' && <HumorView data={cal.data} onDayClick={setDayModal} />}
      {view === 'mes' && <Legenda items={LEGENDA} />}
      {view === 'mes' && <MetasMes mesKey={mesKey} mesLabel={MESES[refDate.getMonth()]} />}
      {view === 'exercicio' && exView === 'cal' && <Legenda items={EXERCICIO_LEGENDA} />}

      {/* Próximas corridas — só na visão Exercício (calendário) */}
      {view === 'exercicio' && exView === 'cal' && <ProximasCorridas data={cal.data} today={today} onEdit={(it) => setAddSheet({ editing: it })} />}

      {/* Lendo no momento — só na visão Mês */}
      {view === 'mes' && lendo.length > 0 && (
        <div style={{ marginTop: 26, borderTop: '1px solid #eee', paddingTop: 16 }}>
          <div style={{ fontSize: 11, color: CULTURA_COR, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Lendo no momento</div>
          {lendo.map(c => (
            <div key={c.id} style={rowBtn}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: CULTURA_COR, flexShrink: 0 }} />
              <span onClick={() => setAddSheet({ editing: { ...c, _tipo: 'cultura' } })} style={{ flex: 1, fontSize: 14, color: '#222', fontStyle: 'italic', cursor: 'pointer' }}>{c.titulo}</span>
              <button onClick={() => cal.saveCultura({ ...c, subtipo: 'lido', data: ymd(today) })}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid ' + CULTURA_COR + '66', background: '#fff', color: CULTURA_COR, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                concluído
              </button>
            </div>
          ))}
        </div>
      )}
      {/* Ouvindo no momento (audiobooks) — só na visão Mês */}
      {view === 'mes' && ouvindo.length > 0 && (
        <div style={{ marginTop: 26, borderTop: '1px solid #eee', paddingTop: 16 }}>
          <div style={{ fontSize: 11, color: CULTURA_COR, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Ouvindo no momento</div>
          {ouvindo.map(c => (
            <div key={c.id} style={rowBtn}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: CULTURA_COR, flexShrink: 0 }} />
              <span onClick={() => setAddSheet({ editing: { ...c, _tipo: 'cultura' } })} style={{ flex: 1, fontSize: 14, color: '#222', fontStyle: 'italic', cursor: 'pointer' }}>{c.titulo}</span>
              <button onClick={() => cal.saveCultura({ ...c, subtipo: 'ouvido', data: ymd(today) })}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid ' + CULTURA_COR + '66', background: '#fff', color: CULTURA_COR, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                concluído
              </button>
            </div>
          ))}
        </div>
      )}
      {view === 'mes' && comprasDoMes.length > 0 && (
        <div style={{ marginTop: 22, borderTop: '1px solid #eee', paddingTop: 16 }}>
          <div style={{ fontSize: 11, color: '#e07a2f', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Compras do mês</div>
          {comprasDoMes.map(it => {
            const aberta = compraAberta === it.id;
            return (
              <div key={it.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '10px 12px', marginBottom: 6 }}>
                <div onClick={() => setCompraAberta(aberta ? null : it.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <span style={{ fontSize: 12, color: '#e07a2f', fontWeight: 700, minWidth: 40 }}>{it.dataLimite.slice(8, 10)}/{it.dataLimite.slice(5, 7)}</span>
                  <span style={{ flex: 1, fontSize: 14, color: '#222', textDecoration: it.comprado ? 'line-through' : 'none', opacity: it.comprado ? 0.5 : 1 }}>{it.titulo}</span>
                  {it.orcamento && <span style={{ fontSize: 12, color: '#999' }}>{simboloMoeda(it.moeda)} {it.orcamento}</span>}
                </div>
                {aberta && (
                  <div style={{ marginTop: 8, paddingLeft: 50 }}>
                    {(it.links || []).length ? (it.links || []).map((l, i) => (
                      <a key={i} href={l} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: 12.5, color: '#e07a2f', fontWeight: 600, textDecoration: 'none', marginBottom: 3, wordBreak: 'break-all' }}>{l} ↗</a>
                    )) : <span style={{ fontSize: 12, color: '#bbb', fontStyle: 'italic' }}>sem links</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {view === 'mes' && culturalDoMes.length > 0 && (
        <div style={{ marginTop: 22, borderTop: '1px solid #eee', paddingTop: 16 }}>
          <div style={{ fontSize: 11, color: '#c2548f', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Cultural do mês</div>
          {culturalDoMes.map(it => (
            <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '10px 12px', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#c2548f', fontWeight: 700, minWidth: 40 }}>{dm(it.dataMax)}</span>
              <span style={{ flex: 1, fontSize: 14, color: '#222' }}>{it.nome}</span>
              {(it.cidade || it.local) && <span style={{ fontSize: 11.5, color: '#999' }}>{[it.cidade, it.local].filter(Boolean).join(' · ')}</span>}
            </div>
          ))}
        </div>
      )}
      {view === 'mes' && planosDoMes.length > 0 && (
        <div style={{ marginTop: 22, borderTop: '1px solid #eee', paddingTop: 16 }}>
          <div style={{ fontSize: 11, color: '#6b7a99', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Planos do mês</div>
          {planosDoMes.map(g => (
            <div key={g.id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: '#222' }}>{g.nome}</span>
                {g.prazoPlano && <span style={{ fontSize: 11.5, color: '#6b7a99', fontWeight: 700 }}>prazo {dm(g.prazoPlano)}</span>}
              </div>
              {g.itens.map(i => (
                <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '9px 12px', marginBottom: 6 }}>
                  <span onClick={() => life.togglePlanoCheck(i.id)} style={{ fontSize: 18, color: '#ccc', cursor: 'pointer' }}>☐</span>
                  <span style={{ fontSize: 12, color: '#6b7a99', fontWeight: 700, minWidth: 40 }}>{dm(i.prazo)}</span>
                  <span onClick={() => setEditCheck(i)} title="tocar pra editar" style={{ flex: 1, fontSize: 14, color: '#222', cursor: 'pointer' }}>{i.texto}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {(view === 'mes' || view === 'agenda') && temSemData && (
        <div style={{ marginTop: 22, borderTop: '1px solid #eee', paddingTop: 16 }}>
          <div style={{ fontSize: 11, color: '#888', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Tarefas sem data</div>
          {tarefasPendentes.length === 0 && <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', margin: '2px 0 4px' }}>Tudo concluído por aqui. ✨</p>}
          {tarefasPendentes.filter(t => !t.trabalho).map(t => (
            <div key={t.id} style={rowBtn}>
              <span onClick={() => cal.toggleTask(t.id)} style={{ fontSize: 18, color: '#ccc', cursor: 'pointer' }}>☐</span>
              <span onClick={() => setAddSheet({ editing: { ...t, _tipo: 'tarefa' } })} style={{ flex: 1, fontSize: 14, color: '#222', cursor: 'pointer' }}>{t.titulo}</span>
            </div>
          ))}
          {tarefasPendentes.some(t => t.trabalho) && (
            <>
              <div style={{ fontSize: 11, color: '#4f7cff', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 700, margin: '12px 0 4px' }}>Trabalho</div>
              {tarefasPendentes.filter(t => t.trabalho).map(t => (
                <div key={t.id} style={rowBtn}>
                  <span onClick={() => cal.toggleTask(t.id)} style={{ fontSize: 18, color: '#ccc', cursor: 'pointer' }}>☐</span>
                  <span onClick={() => setAddSheet({ editing: { ...t, _tipo: 'tarefa' } })} style={{ flex: 1, fontSize: 14, color: '#222', cursor: 'pointer' }}>{t.titulo}</span>
                </div>
              ))}
            </>
          )}
          {tarefasConcluidas.length > 0 && (
            <>
              <button onClick={() => setVerFeitas(v => !v)} style={{ background: 'none', border: 'none', padding: '8px 0 0', color: '#999', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                {verFeitas ? '▾' : '▸'} Tarefas concluídas ({tarefasConcluidas.length})
              </button>
              {verFeitas && tarefasConcluidas.map(t => (
                <div key={t.id} style={rowBtn}>
                  <span onClick={() => cal.toggleTask(t.id)} style={{ fontSize: 18, color: '#54c08a', cursor: 'pointer' }}>☑</span>
                  <span onClick={() => setAddSheet({ editing: { ...t, _tipo: 'tarefa' } })} style={{ flex: 1, fontSize: 14, color: '#222', cursor: 'pointer', textDecoration: 'line-through', opacity: 0.5 }}>{t.titulo}</span>
                  {t.feitaEm && <span style={{ fontSize: 11, color: '#bbb', flexShrink: 0 }}>{t.feitaEm.split('-')[2]}/{t.feitaEm.split('-')[1]}</span>}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {dayModal && <DayModal date={dayModal} onClose={() => setDayModal(null)} onAdd={(k) => { setDayModal(null); setAddSheet({ date: k }); }} onEdit={(it) => { setDayModal(null); setAddSheet({ editing: it }); }} />}
      {addSheet && <AddSheet initialDate={addSheet.date} editing={addSheet.editing} onClose={() => setAddSheet(null)} />}
      {editCheck && <PlanoCheckSheet item={editCheck} onClose={() => setEditCheck(null)} />}
    </div>
  );
}

// estilos compartilhados
const overlay = { position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' };
const sheet = { background: '#fafafa', width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', borderRadius: '20px 20px 0 0', padding: '20px 20px 28px' };
const closeBtn = { background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer', lineHeight: 1 };
const rowBtn = { display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '10px 12px', marginBottom: 6, cursor: 'pointer' };
export const trabTag = { fontSize: 9.5, fontWeight: 700, color: '#4f7cff', background: '#4f7cff18', borderRadius: 6, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.3px', flexShrink: 0 };
const dashedBtn = { width: '100%', marginTop: 18, padding: '12px 0', borderRadius: 11, border: '1px dashed #bbb', background: '#fff', color: '#555', fontSize: 13, fontWeight: 700, cursor: 'pointer' };
const navBtn = { background: 'none', border: '1px solid #e2e2e2', borderRadius: 8, width: 32, height: 32, fontSize: 18, color: '#666', cursor: 'pointer', lineHeight: 1 };
const delBtn = { padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' };
