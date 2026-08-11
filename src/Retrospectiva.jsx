// Aba "Retrospectiva": hub que agrega seus números e marcos.
// Página inicial: "o ano em números" (clicável) + cards que abrem sub-retrospectivas.
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useCalendar } from './calendarStore.jsx';
import { useLife } from './lifeStore.jsx';
// A tela de Saúde continua morando na Life.jsx (é lá que estão os estilos e os
// helpers dela); aqui ela é só carregada sob demanda, ao abrir o card.
const SaudeSection = lazy(() => import('./Life.jsx').then(m => ({ default: m.SaudeSection })));
import { fetchSpotifyCover } from './cloud.js';
import { EXERCICIO_BY_ID, fmtTempo, paceSecs, fmtPace, fmtKm } from './calendarConfig.js';
import { RotaField } from './rota.jsx';

const COR = '#8d6e63';
const overlay = { position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' };
const sheet = { background: '#fafafa', width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', borderRadius: '20px 20px 0 0', padding: '20px 20px 28px' };
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', color: '#222' };
const labelStyle = { fontSize: 11, color: '#999', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: 5, marginTop: 14 };
const pad2 = (n) => String(n).padStart(2, '0');
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const fmtDM = (s) => { const [, m, d] = s.split('-'); return `${d}/${m}`; };
const fmtMesAno = (mm) => `${MESES[+mm.slice(5, 7) - 1]} de ${mm.slice(0, 4)}`;
const fmtDiaMes = (s) => { const [, m, d] = s.split('-'); return `${+d} ${MESES[+m - 1].slice(0, 3)}`; };

// Seletor de ano reutilizável (Compras / Música / Corridas). `datas` = lista de strings "YYYY-..".
function useAnoSel(datas) {
  const anoAtual = String(new Date().getFullYear());
  const anos = [...new Set(datas.map(d => (d || '').slice(0, 4)).filter(Boolean))].filter(a => a <= anoAtual).sort().reverse();
  const [anoSelRaw, setAnoSel] = useState(anoAtual);
  const anoSel = anos.includes(anoSelRaw) ? anoSelRaw : (anos[0] || anoAtual);
  return { anos, anoSel, setAnoSel };
}
function AnoChips({ anos, anoSel, setAnoSel, cor }) {
  if (anos.length < 2) return null;
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
      {anos.map(a => (
        <button key={a} onClick={() => setAnoSel(a)} style={{
          whiteSpace: 'nowrap', padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
          border: '1px solid ' + (anoSel === a ? cor : '#e2e2e2'), background: anoSel === a ? cor + '1c' : '#fff', color: anoSel === a ? '#333' : '#999',
        }}>{a}</button>
      ))}
    </div>
  );
}

// Cards do hub. `pronto` = sub-página já construída.
const CARDS = [
  { id: 'dias', label: 'Dias importantes', desc: 'seus marcos de vida', cor: '#7a6ff0', pronto: true },
  { id: 'coisasCaras', label: 'Coisas caras', desc: 'quando comprei e quanto duram', cor: '#ff8a3d', pronto: true },
  { id: 'quem', label: 'Quem você viu', desc: 'as pessoas do seu ano', cor: '#ff5d8f', pronto: true },
  { id: 'viagens', label: 'Viagens', desc: 'pra onde você foi', cor: '#19b3a6', pronto: true },
  { id: 'albuns', label: 'Álbuns marcantes', desc: 'os discos que ficaram', cor: '#1db954', pronto: true },
  { id: 'leituras', label: 'Leituras', desc: 'os livros do seu ano', cor: '#7a5c9e', pronto: true },
  { id: 'saude', label: 'Saúde', desc: 'consultas, peso, remédios, exames', cor: '#d96459', pronto: true },
  { id: 'habitos', label: 'Acompanhamento', desc: 'sono, trabalho e hábitos do dia', cor: '#3fb6a8', pronto: true },
  { id: 'corridas', label: 'Corridas', desc: 'suas provas e pace', cor: '#ef6c4d', pronto: true },
  { id: 'trilhas', label: 'Trilhas', desc: 'seus percursos na natureza', cor: '#6b8e5a', pronto: true },
  { id: 'amorosa', label: 'Amorosa', desc: 'dates, beijos e afins', cor: '#c2548f', pronto: true },
];

export default function RetrospectivaPage({ isWide, secInicial, onConsumeSec }) {
  const [sec, setSec] = useState(secInicial || null);
  useEffect(() => { if (secInicial) { setSec(secInicial); onConsumeSec && onConsumeSec(); } }, [secInicial]);
  // Ao trocar de sub-tela (abrir um card ou voltar), volta pro topo — senão fica
  // na posição rolada do hub e a sub-tela abre no fim.
  useEffect(() => { window.scrollTo(0, 0); }, [sec]);
  const baseSec = (sec || '').split(':')[0];          // 'viagens:x' → 'viagens'
  if (baseSec === 'coisasCaras') return <CoisasCarasView onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec === 'albuns') return <AlbunsView onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec === 'leituras') return <LeiturasRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec === 'corridas') return <CorridasRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec === 'trilhas') return <TrilhasRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec === 'dias') return <DiasRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec === 'viagens') return <ViagensRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec === 'amorosa') return <AmorosaRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec === 'quem') return <QuemRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec === 'saude') return <SaudeRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec === 'habitos') return <HabitosRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec) return <EmBreve card={CARDS.find(c => c.id === baseSec)} onBack={() => setSec(null)} />;
  return <RetroHome isWide={isWide} onOpen={setSec} />;
}

function RetroHome({ isWide, onOpen }) {
  const cal = useCalendar();
  const cultura = cal.data.cultura || [];
  const exercicios = cal.data.exercicios || [];

  const hoje = new Date();
  const hk = `${hoje.getFullYear()}-${pad2(hoje.getMonth() + 1)}-${pad2(hoje.getDate())}`;
  const anoAtual = String(hoje.getFullYear());
  const anos = [...new Set([
    ...cultura.map(c => (c.data || '').slice(0, 4)),
    ...exercicios.map(x => (x.data || '').slice(0, 4)),
  ].filter(Boolean))].filter(a => a <= anoAtual).sort().reverse();
  const [anoSelRaw, setAnoSel] = useState(anoAtual);
  const anoSel = anos.includes(anoSelRaw) ? anoSelRaw : (anos[0] || anoAtual);
  const [detalhe, setDetalhe] = useState(null);
  const [mesSel, setMesSel] = useState(null); // 'YYYY-MM' ou null (ano inteiro)

  const mesesComDados = [...new Set([...cultura, ...exercicios]
    .filter(x => (x.data || '').startsWith(anoSel) && (x.data || '') <= hk)
    .map(x => x.data.slice(0, 7)))].sort().reverse();
  const mesAtivo = mesSel && mesesComDados.includes(mesSel) ? mesSel : null;
  const noAno = (arr) => arr.filter(x => { const d = x.data || ''; if (!d || d > hk) return false; return mesAtivo ? d.startsWith(mesAtivo) : d.startsWith(anoSel); });
  const cultAno = noAno(cultura);
  const exAno = noAno(exercicios);
  const mesChip = (active) => ({ whiteSpace: 'nowrap', padding: '6px 13px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', flexShrink: 0, border: '1px solid ' + (active ? COR : '#e2e2e2'), background: active ? COR + '1c' : '#fff', color: active ? '#5d473e' : '#888' });
  const byData = (a, b) => (b.data || '').localeCompare(a.data || '');
  const cultItens = (sub) => cultAno.filter(c => c.subtipo === sub).sort(byData).map(c => ({ titulo: c.titulo || '—', data: c.data }));
  const exGrupo = (g) => exAno.filter(x => EXERCICIO_BY_ID[x.subtipo]?.grupo === g).sort(byData);
  const corridas = exGrupo('corrida');                                  // todas as corridas (prova + treino)
  const ehProva = (x) => x.subtipo === 'corrida_prova' || x.subtipo === 'corrida';
  const km = Math.round(corridas.reduce((a, x) => a + (Number(x.distancia) || 0), 0) * 10) / 10;
  const provaLabel = (x) => {
    const nome = x.titulo || EXERCICIO_BY_ID[x.subtipo]?.label || 'Prova';
    const extra = [x.distancia ? `${fmtKm(x.distancia)}km` : null, x.tempo ? fmtTempo(x.tempo) : null].filter(Boolean);
    return extra.length ? `${nome} · ${extra.join(' · ')}` : nome;
  };

  const numeros = [
    { key: 'lido', label: 'livros lidos', itens: cultItens('lido') },
    { key: 'ouvido', label: 'livros ouvidos', itens: cultItens('ouvido') },
    { key: 'filme', label: 'filmes', itens: cultItens('filme') },
    { key: 'serie', label: 'séries', itens: cultItens('serie') },
    { key: 'exposicao', label: 'exposições', itens: cultItens('exposicao') },
    { key: 'museu', label: 'museus', itens: cultItens('museu') },
    { key: 'show', label: 'shows', itens: cultItens('show') },
    { key: 'espetaculo', label: 'espetáculos', itens: cultItens('espetaculo') },
    { key: 'treino', label: 'treinos', itens: exGrupo('treino').map(x => ({ titulo: EXERCICIO_BY_ID[x.subtipo]?.label || 'Treino', data: x.data })) },
    { key: 'provas', label: 'provas de corrida', itens: corridas.filter(ehProva).map(x => ({ titulo: provaLabel(x), data: x.data })) },
    { key: 'km', label: 'km corridos', valor: km, itens: null },
  ].map(n => ({ ...n, valor: n.valor != null ? n.valor : n.itens.length })).filter(n => n.valor > 0);

  const det = detalhe && numeros.find(n => n.key === detalhe);

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 720 : 'none', margin: '0 auto' }}>
      <div style={{ width: 36, height: 4, background: COR, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#111', margin: '0 0 4px' }}>Retrospectiva</h2>
      <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>seus números e marcos por ano</p>

      {anos.length > 1 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
          {anos.map(a => (
            <button key={a} onClick={() => { setAnoSel(a); setDetalhe(null); setMesSel(null); }} style={{
              whiteSpace: 'nowrap', padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
              border: '1px solid ' + (anoSel === a ? COR : '#e2e2e2'), background: anoSel === a ? COR + '1c' : '#fff', color: anoSel === a ? '#5d473e' : '#888',
            }}>{a}</button>
          ))}
        </div>
      )}

      {mesesComDados.length > 1 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 10 }}>
          <button onClick={() => { setMesSel(null); setDetalhe(null); }} style={mesChip(!mesAtivo)}>Ano</button>
          {mesesComDados.map(mm => (
            <button key={mm} onClick={() => { setMesSel(mm); setDetalhe(null); }} style={mesChip(mesAtivo === mm)}>{MESES[+mm.slice(5, 7) - 1].slice(0, 3)}</button>
          ))}
        </div>
      )}
      <div style={{ fontSize: 11, color: COR, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>{mesAtivo ? `${MESES[+mesAtivo.slice(5, 7) - 1]} de ${anoSel}` : `${anoSel} em números`}</div>

      {numeros.length === 0 ? (
        <div style={{ padding: 24, borderRadius: 16, background: COR + '10', border: '1px dashed ' + COR + '55', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 16, color: '#555', margin: 0 }}>Seu ano ainda está em branco por aqui.</p>
          <p style={{ fontSize: 13, color: '#999', marginTop: 8, lineHeight: 1.6 }}>Conforme você registra cultura e exercícios no Calendário, seus números aparecem aqui.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isWide ? 'repeat(auto-fill, minmax(150px, 1fr))' : '1fr 1fr', gap: 12 }}>
          {numeros.map(n => {
            const clicavel = n.key === 'km' ? corridas.length > 0 : (n.itens && n.itens.length > 0);
            const ativo = detalhe === n.key;
            return (
              <div key={n.key} onClick={clicavel ? () => setDetalhe(ativo ? null : n.key) : undefined} style={{
                background: ativo ? COR + '1c' : COR + '10', border: '1px solid ' + (ativo ? COR : COR + '28'), borderRadius: 14, padding: '16px 14px', cursor: clicavel ? 'pointer' : 'default',
              }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: '#111', lineHeight: 1 }}>{n.key === 'km' ? fmtKm(n.valor) : n.valor.toLocaleString('pt-BR')}</div>
                <div style={{ fontSize: 12.5, color: '#777', marginTop: 6 }}>{n.label}{clicavel && <span style={{ color: COR, fontWeight: 700 }}> ›</span>}</div>
              </div>
            );
          })}
        </div>
      )}

      {detalhe === 'km' && <KmDrilldown corridas={corridas} ehProva={ehProva} onClose={() => setDetalhe(null)} />}
      {detalhe === 'treino' && det && <TreinoDrilldown itens={det.itens} onClose={() => setDetalhe(null)} />}

      {det && detalhe !== 'km' && detalhe !== 'treino' && (
        <div style={{ marginTop: 14, background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#222', textTransform: 'capitalize' }}>{det.label}</span>
            <span onClick={() => setDetalhe(null)} style={{ cursor: 'pointer', color: '#bbb', fontSize: 18 }}>×</span>
          </div>
          {det.itens.map((it, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid #f4f4f4' }}>
              <span style={{ fontSize: 12, color: COR, fontWeight: 700, width: 42, flexShrink: 0 }}>{fmtDM(it.data)}</span>
              <span style={{ flex: 1, fontSize: 14, color: '#222' }}>{it.titulo}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 11, color: COR, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 700, margin: '26px 0 10px' }}>retrospectivas</div>
      <div style={{ display: 'grid', gridTemplateColumns: isWide ? 'repeat(auto-fill, minmax(170px, 1fr))' : '1fr 1fr', gap: 12 }}>
        {CARDS.map(c => (
          <button key={c.id} onClick={() => onOpen(c.id)} style={{ background: c.cor + '12', border: '1px solid ' + c.cor + '33', borderRadius: 16, padding: '18px 16px', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: 24, height: 4, background: c.cor, borderRadius: 4, marginBottom: 12 }} />
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#222', fontWeight: 700, lineHeight: 1.2 }}>{c.label}</div>
            <div style={{ fontSize: 11.5, color: '#999', marginTop: 3 }}>{c.pronto ? c.desc : 'em breve'}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Quem você viu: soma as pessoas marcadas (comQuem) em eventos/rolês/cultura, por ano.
function QuemRetro({ onBack, isWide }) {
  const cal = useCalendar();
  const cor = '#ff5d8f';
  const [pessoaSel, setPessoaSel] = useState(null);
  const ocasioes = [];
  (cal.data.events || []).forEach(e => { if (e.comQuem) ocasioes.push({ data: e.inicio, quem: e.comQuem, oque: e.titulo }); });
  (cal.data.roles || []).forEach(r => { if (r.comQuem) ocasioes.push({ data: r.data, quem: r.comQuem, oque: r.titulo }); });
  (cal.data.cultura || []).forEach(c => { if (c.comQuem) ocasioes.push({ data: c.data, quem: c.comQuem, oque: c.titulo }); });
  const registros = [];
  ocasioes.forEach(o => (o.quem || '').split(/[,;]/).map(s => s.trim()).filter(Boolean).forEach(nome => registros.push({ nome, data: o.data, oque: o.oque })));
  const { anos, anoSel, setAnoSel } = useAnoSel(registros.map(r => r.data));
  const doAno = registros.filter(r => (r.data || '').slice(0, 4) === anoSel);
  const porPessoa = {};
  doAno.forEach(r => { (porPessoa[r.nome] = porPessoa[r.nome] || []).push(r); });
  const pessoas = Object.entries(porPessoa).map(([nome, arr]) => ({ nome, n: arr.length, arr: arr.sort((a, b) => (b.data || '').localeCompare(a.data || '')) })).sort((a, b) => b.n - a.n || a.nome.localeCompare(b.nome));
  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Retrospectiva</button>
      <div style={{ width: 36, height: 4, background: cor, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Quem você viu</h2>
      <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>as pessoas que você marcou no calendário</p>
      <AnoChips anos={anos} anoSel={anoSel} setAnoSel={(a) => { setAnoSel(a); setPessoaSel(null); }} cor={cor} />
      {pessoas.length === 0 ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Ninguém marcado em {anoSel}. Use o campo “com quem” ao criar eventos, rolês e cultura no Calendário.</p>
      ) : <>
        <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 12px' }}><b style={{ color: cor }}>{pessoas.length}</b> {pessoas.length === 1 ? 'pessoa' : 'pessoas'} · {doAno.length} {doAno.length === 1 ? 'encontro' : 'encontros'} em {anoSel}</p>
        {pessoas.map(p => (
          <div key={p.nome} style={{ borderBottom: '1px solid #f3f3f3' }}>
            <div onClick={() => setPessoaSel(pessoaSel === p.nome ? null : p.nome)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', cursor: 'pointer' }}>
              <span style={{ fontSize: 14, color: '#222', fontWeight: 600 }}>{pessoaSel === p.nome ? '▾' : '▸'} {p.nome}</span>
              <span style={{ fontSize: 13, color: cor, fontWeight: 700 }}>{p.n}×</span>
            </div>
            {pessoaSel === p.nome && (
              <div style={{ padding: '0 0 10px 16px' }}>
                {p.arr.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '4px 0', fontSize: 12.5, color: '#666' }}>
                    <span style={{ color: cor, fontWeight: 700, width: 46, flexShrink: 0 }}>{r.data ? fmtDiaMes(r.data) : '—'}</span>
                    <span>{r.oque || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </>}
    </div>
  );
}

// Saúde: a seção INTEIRA, que era uma aba da Life (consultas, peso, remédios,
// vacinas, menstruação, exercícios), mais o retrato do ano que já existia aqui —
// quantas sessões de terapia, consultas e exames, contados pelos eventos de
// categoria "saúde" do Calendário. Mudou de casa em ago/2026: saúde é histórico,
// e histórico é o que a Retrospectiva faz.
function SaudeRetro({ onBack, isWide }) {
  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <SaudeAno onBack={onBack} />
      <div style={{ marginTop: 26, paddingTop: 4, borderTop: '1px solid #eee' }}>
        <Suspense fallback={<p style={{ textAlign: 'center', color: '#bbb', fontSize: 13, padding: '30px 0', fontStyle: 'italic' }}>carregando…</p>}>
          <SaudeSection embutido />
        </Suspense>
      </div>
    </div>
  );
}

// O retrato do ano (contagens do Calendário), que abre a tela de Saúde.
function SaudeAno({ onBack }) {
  const cal = useCalendar();
  const cor = '#d96459';
  const [tipoSel, setTipoSel] = useState(null);
  const eventos = (cal.data.events || []).filter(e => e.categoria === 'saude');
  const { anos, anoSel, setAnoSel } = useAnoSel(eventos.map(e => e.inicio));
  const doAno = eventos.filter(e => (e.inicio || '').slice(0, 4) === anoSel);
  const classifica = (e) => { const t = (e.titulo || '').toLowerCase(); if (/terapia|psic[oó]|psiqui/.test(t)) return 'terapia'; if (/exame/.test(t)) return 'exame'; return 'consulta'; };
  const grupos = { terapia: [], consulta: [], exame: [] };
  doAno.forEach(e => grupos[classifica(e)].push(e));
  const cards = [['terapia', 'sessões de terapia'], ['consulta', 'consultas'], ['exame', 'exames']]
    .map(([k, label]) => ({ k, label, itens: grupos[k].sort((a, b) => (b.inicio || '').localeCompare(a.inicio || '')) }))
    .filter(c => c.itens.length);
  const sel = cards.find(c => c.k === tipoSel);
  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Retrospectiva</button>
      <div style={{ width: 36, height: 4, background: cor, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Saúde</h2>
      <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>o ano em consultas, terapia e exames (do Calendário)</p>
      <AnoChips anos={anos} anoSel={anoSel} setAnoSel={(a) => { setAnoSel(a); setTipoSel(null); }} cor={cor} />
      {cards.length === 0 ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Nada de saúde em {anoSel}. Marque consultas e exames como categoria “saúde” no Calendário (terapia, psiquiatria e exames são reconhecidos pelo título).</p>
      ) : <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 8 }}>
          {cards.map(c => (
            <div key={c.k} onClick={() => setTipoSel(tipoSel === c.k ? null : c.k)} style={{ background: tipoSel === c.k ? cor + '1c' : cor + '10', border: '1px solid ' + (tipoSel === c.k ? cor : cor + '28'), borderRadius: 14, padding: '14px 12px', cursor: 'pointer' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: '#111', lineHeight: 1 }}>{c.itens.length}</div>
              <div style={{ fontSize: 11, color: '#777', marginTop: 5 }}>{c.label}<span style={{ color: cor, fontWeight: 700 }}> ›</span></div>
            </div>
          ))}
        </div>
        {sel && (
          <div style={{ marginTop: 10, background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '12px 14px' }}>
            {sel.itens.map((e, i) => (
              <div key={e.id || i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid #f4f4f4' }}>
                <span style={{ fontSize: 12, color: cor, fontWeight: 700, width: 46, flexShrink: 0 }}>{fmtDiaMes(e.inicio)}</span>
                <span style={{ flex: 1, fontSize: 13.5, color: '#222' }}>{e.titulo || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </>}
    </div>
  );
}

// Rótulo do tipo de corrida pro selo: prova / rua / esteira (treino antigo conta como rua).
const corridaTipoLabel = (x) => (x.subtipo === 'corrida_prova' || x.subtipo === 'corrida')
  ? 'prova'
  : (x.subtipo === 'corrida_treino_esteira' ? 'esteira' : 'rua');

// Drill-down do "km corridos": tudo que correu (prova + treino), por data ou por mês (evolução).
function KmDrilldown({ corridas, ehProva, onClose }) {
  const [modo, setModo] = useState('data');
  const total = Math.round(corridas.reduce((a, x) => a + (Number(x.distancia) || 0), 0) * 10) / 10;
  const porMes = {};
  corridas.forEach(x => { const mm = (x.data || '').slice(0, 7); if (!mm) return; porMes[mm] = (porMes[mm] || 0) + (Number(x.distancia) || 0); });
  const mesesAsc = Object.keys(porMes).sort();
  const maxMes = Math.max(1, ...mesesAsc.map(m => porMes[m]));
  const tabBtn = (id, txt) => (
    <button onClick={() => setModo(id)} style={{ padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid ' + (modo === id ? '#ef6c4d' : '#e2e2e2'), background: modo === id ? '#ef6c4d18' : '#fff', color: modo === id ? '#b33d20' : '#999' }}>{txt}</button>
  );
  return (
    <div style={{ marginTop: 14, background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#222' }}>{fmtKm(total)} km corridos</span>
        <span onClick={onClose} style={{ cursor: 'pointer', color: '#bbb', fontSize: 18 }}>×</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>{tabBtn('data', 'por data')}{tabBtn('mes', 'por mês')}</div>

      {modo === 'data' ? corridas.map((x, i) => (
        <div key={x.id || i} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '7px 0', borderBottom: '1px solid #f4f4f4' }}>
          <span style={{ fontSize: 12, color: COR_CORRIDA, fontWeight: 700, width: 42, flexShrink: 0 }}>{fmtDM(x.data)}</span>
          <span style={{ flex: 1, fontSize: 14, color: '#222' }}>{x.distancia ? fmtKm(x.distancia) + 'km' : '—'}{x.tempo ? ' · ' + fmtTempo(x.tempo) : ''}</span>
          <span style={{ fontSize: 10.5, color: EXERCICIO_BY_ID[x.subtipo]?.cor || '#aaa', textTransform: 'uppercase', fontWeight: 700, flexShrink: 0 }}>{corridaTipoLabel(x)}</span>
        </div>
      )) : mesesAsc.map(mm => {
        const v = Math.round(porMes[mm] * 10) / 10;
        return (
          <div key={mm} style={{ padding: '7px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
              <span style={{ color: '#555', textTransform: 'capitalize' }}>{MESES[+mm.slice(5, 7) - 1]}</span>
              <span style={{ color: COR_CORRIDA, fontWeight: 700 }}>{fmtKm(v)} km</span>
            </div>
            <div style={{ height: 6, background: '#f0f0f0', borderRadius: 4 }}>
              <div style={{ width: (v / maxMes * 100) + '%', height: '100%', background: COR_CORRIDA, borderRadius: 4 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Drill-down de "treinos": barras horizontais com a contagem por tipo; clicar abre as datas.
function TreinoDrilldown({ itens, onClose }) {
  const [aberto, setAberto] = useState(null);
  const grupos = {};
  itens.forEach(it => { (grupos[it.titulo] = grupos[it.titulo] || []).push(it); });
  const linhas = Object.entries(grupos).map(([label, arr]) => ({ label, arr, n: arr.length })).sort((a, b) => b.n - a.n);
  const max = Math.max(...linhas.map(l => l.n), 1);
  return (
    <div style={{ marginTop: 14, background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#222' }}>Treinos</span>
        <span onClick={onClose} style={{ cursor: 'pointer', color: '#bbb', fontSize: 18 }}>×</span>
      </div>
      {linhas.map(l => {
        const ativo = aberto === l.label;
        return (
          <div key={l.label} style={{ marginBottom: 8 }}>
            <div onClick={() => setAberto(ativo ? null : l.label)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3, fontSize: 13 }}>
                <span style={{ color: '#333', fontWeight: 600 }}>{l.label}{ativo && <span style={{ color: COR, fontWeight: 700 }}> ▾</span>}</span>
                <span style={{ color: COR, fontWeight: 700 }}>{l.n}x</span>
              </div>
              <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4 }}>
                <div style={{ width: (l.n / max * 100) + '%', height: '100%', background: COR, borderRadius: 4 }} />
              </div>
            </div>
            {ativo && (
              <div style={{ marginTop: 6, paddingLeft: 2 }}>
                {[...l.arr].sort((a, b) => (b.data || '').localeCompare(a.data || '')).map((it, i) => (
                  <div key={i} style={{ fontSize: 12.5, color: COR, fontWeight: 700, padding: '3px 0' }}>{fmtDM(it.data)}</div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---- Coisas caras: quando comprei e quanto duram (por MÊS: ano + mes 0–11) ----
// Compat: itens antigos têm `half` (semestre) — cai no início do semestre.
const halfStartMonth = (h) => (h === 2 ? 6 : 0);
const mesInicio = (c) => (c && c.mes != null) ? c.mes : halfStartMonth(c && c.half);
const mesFim = (c) => (c && c.fimMes != null) ? c.fimMes : halfStartMonth((c && c.fimHalf) || 1);
const mesLabel = (i) => MESES[((i % 12) + 12) % 12].slice(0, 3);
function fmtDuracao(meses) {
  const a = Math.floor(meses / 12), m = meses % 12;
  if (a <= 0) return `${m} ${m === 1 ? 'mês' : 'meses'}`;
  if (m === 0) return `${a} ${a === 1 ? 'ano' : 'anos'}`;
  return `${a} ${a === 1 ? 'ano' : 'anos'} e ${m} ${m === 1 ? 'mês' : 'meses'}`;
}
function CoisasCarasView({ onBack, isWide, backLabel = 'Retrospectiva' }) {
  const life = useLife();
  const [form, setForm] = useState(null);
  const hoje = new Date();
  const nowMonths = hoje.getFullYear() * 12 + hoje.getMonth();
  const itens = [...(life.coisasCaras || [])].sort((a, b) => (b.ano * 12 + mesInicio(b)) - (a.ano * 12 + mesInicio(a)));
  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; {backLabel}</button>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: 36, height: 4, background: '#ff8a3d', borderRadius: 4, marginBottom: 12 }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Coisas caras</h2>
          <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>quando comprei e quanto duram</p>
        </div>
        <button onClick={() => setForm({})} title="adicionar coisa cara" style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>+</button>
      </div>

      {itens.length === 0 ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Nada por aqui ainda. Toque no + para registrar uma coisa cara (ex.: notebook, celular).</p>
      ) : itens.map(c => {
        const startMonths = c.ano * 12 + mesInicio(c);
        const emUso = c.fimAno == null;
        const endMonths = emUso ? nowMonths : c.fimAno * 12 + mesFim(c);
        const dur = Math.max(0, endMonths - startMonths);
        return (
          <div key={c.id} onClick={() => setForm({ editing: c })} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '13px 15px', marginBottom: 8, cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#222' }}>{c.nome}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: emUso ? '#2bb673' : '#999', flexShrink: 0 }}>{emUso ? 'em uso há ' : 'durou '}{fmtDuracao(dur)}</span>
            </div>
            <div style={{ fontSize: 11.5, color: '#999', marginTop: 3 }}>comprei em {mesLabel(mesInicio(c))} de {c.ano}{!emUso ? ` · até ${mesLabel(mesFim(c))} de ${c.fimAno}` : ''}</div>
          </div>
        );
      })}

      {form && <CoisaCaraForm editing={form.editing} onClose={() => setForm(null)} />}
    </div>
  );
}

function CoisaCaraForm({ editing, onClose }) {
  const life = useLife();
  const [nome, setNome] = useState(editing?.nome || '');
  const [ano, setAno] = useState(editing?.ano != null ? String(editing.ano) : '');
  const [mes, setMes] = useState(editing?.mes != null ? editing.mes : (editing ? halfStartMonth(editing.half) : new Date().getMonth()));
  const [aindaUso, setAindaUso] = useState(editing ? editing.fimAno == null : true);
  const [fimAno, setFimAno] = useState(editing?.fimAno != null ? String(editing.fimAno) : '');
  const [fimMes, setFimMes] = useState(editing?.fimMes != null ? editing.fimMes : (editing?.fimHalf ? halfStartMonth(editing.fimHalf) : 0));
  const podeSalvar = nome.trim().length > 0 && ano;
  const salvar = () => {
    if (!podeSalvar) return;
    life.saveCoisaCara({ id: editing?.id, nome: nome.trim(), ano: Number(ano), mes: Number(mes),
      fimAno: aindaUso || !fimAno ? undefined : Number(fimAno), fimMes: aindaUso || !fimAno ? undefined : Number(fimMes) });
    onClose();
  };
  const mesSel = (v, set) => (
    <select value={v} onChange={e => set(Number(e.target.value))} style={{ ...inputStyle, width: 140, flexShrink: 0, textTransform: 'capitalize' }}>
      {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
    </select>
  );
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar' : 'Nova'} coisa cara</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>
        <label style={labelStyle}>O quê</label>
        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="ex.: Notebook" style={inputStyle} />
        <label style={labelStyle}>Comprei em</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="number" inputMode="numeric" value={ano} onChange={e => setAno(e.target.value)} placeholder="ano" style={inputStyle} />
          {mesSel(mes, setMes)}
        </div>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'none', letterSpacing: 0, fontSize: 13, color: '#444', cursor: 'pointer' }}>
          <input type="checkbox" checked={aindaUso} onChange={e => setAindaUso(e.target.checked)} /> Ainda uso
        </label>
        {!aindaUso && (
          <>
            <label style={labelStyle}>Parei de usar em</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" inputMode="numeric" value={fimAno} onChange={e => setFimAno(e.target.value)} placeholder="ano" style={inputStyle} />
              {mesSel(fimMes, setFimMes)}
            </div>
          </>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          {editing && <button onClick={() => { life.deleteCoisaCara(editing.id); onClose(); }} style={{ padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apagar</button>}
          <button onClick={salvar} disabled={!podeSalvar} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: 'none', background: podeSalvar ? '#111' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: podeSalvar ? 'pointer' : 'default' }}>{editing ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  );
}

// ---- Card: Álbuns marcantes ----
const COR_MUSICA = '#1db954';

// Álbuns marcantes: coleção de discos, por ano ou artista. Virou card próprio da
// Retrospectiva em ago/2026, quando a Música (minutos/artistas do Spotify) saiu —
// os números do mês eram trabalho de digitação; os discos que marcaram, não.
// Os meses já cadastrados continuam guardados no documento, só não têm mais tela.
function AlbunsView({ onBack, isWide }) {
  const life = useLife();
  const albuns = life.albuns || [];
  const [form, setForm] = useState(null);
  const [modo, setModo] = useState('ano'); // 'ano' | 'artista'
  const cor = COR_MUSICA;
  const keyDe = (a) => modo === 'ano' ? (a.ano || 'sem ano') : (a.artista || 'sem artista');
  const grupos = {};
  albuns.forEach(a => { (grupos[keyDe(a)] = grupos[keyDe(a)] || []).push(a); });
  const chaves = Object.keys(grupos).sort((x, y) => modo === 'ano' ? String(y).localeCompare(String(x)) : String(x).localeCompare(String(y)));
  // Backfill das capas: pra cada álbum com link do Spotify e sem `capa`, busca a capa
  // (oEmbed via /api/spotify) UMA vez e guarda. O triedRef evita re-buscar em loop.
  const triedRef = useRef(new Set());
  useEffect(() => {
    // Chave por id+link: se o link mudar, conta como nova busca (não fica na capa velha).
    const chave = a => a.id + '|' + a.link;
    const pend = albuns.filter(a => a.link && !a.capa && !triedRef.current.has(chave(a)));
    if (!pend.length) return;
    pend.forEach(a => triedRef.current.add(chave(a)));
    // Busca todas as capas e salva UMA vez (setAlbunsCapas é atômico) — se salvasse
    // uma a uma, os saves usariam `data` velho e se sobrescreveriam (capas sumiam).
    Promise.all(pend.map(a => fetchSpotifyCover(a.link).then(thumb => [a.id, thumb]).catch(() => [a.id, null])))
      .then(pairs => {
        const map = {};
        pairs.forEach(([id, thumb]) => { if (thumb) map[id] = thumb; });
        if (Object.keys(map).length) life.setAlbunsCapas(map);
      });
  }, [albuns]); // eslint-disable-line
  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Retrospectiva</button>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: 36, height: 4, background: cor, borderRadius: 4, marginBottom: 12 }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Álbuns marcantes</h2>
          <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>os discos que marcaram você</p>
        </div>
        <button onClick={() => setForm({})} title="adicionar álbum" style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>+</button>
      </div>
      {albuns.length === 0 ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Nenhum álbum ainda. Toque no + pra guardar um disco que marcou (álbum, artista, ano e o link do Spotify).</p>
      ) : <>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[['ano', 'por ano'], ['artista', 'por artista']].map(([v, label]) => (
            <button key={v} onClick={() => setModo(v)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid ' + (modo === v ? cor : '#e2e2e2'), background: modo === v ? cor + '1c' : '#fff', color: modo === v ? '#0a7d36' : '#888' }}>{label}</button>
          ))}
        </div>
        {chaves.map(k => (
          <div key={k} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: cor, fontWeight: 700, textTransform: modo === 'artista' ? 'none' : 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{k}</div>
            {grupos[k].map(a => (
              <div key={a.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '11px 12px', marginBottom: 8, display: 'flex', gap: 12 }}>
                {a.capa
                  ? <img src={a.capa} alt="" onClick={() => setForm({ editing: a })} style={{ width: 54, height: 54, borderRadius: 8, objectFit: 'cover', flexShrink: 0, cursor: 'pointer' }} />
                  : <div onClick={() => setForm({ editing: a })} style={{ width: 54, height: 54, borderRadius: 8, background: cor + '18', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💿</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div onClick={() => setForm({ editing: a })} style={{ cursor: 'pointer' }}>
                    <div style={{ fontSize: 14.5, color: '#222', fontWeight: 700 }}>{a.album}</div>
                    <div style={{ fontSize: 12.5, color: '#777', marginTop: 1 }}>{a.artista}{modo === 'artista' && a.ano ? ` · ${a.ano}` : ''}</div>
                    {a.nota && <div style={{ fontSize: 12, color: '#999', fontStyle: 'italic', marginTop: 4 }}>{a.nota}</div>}
                  </div>
                  {a.link && <a href={a.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ display: 'inline-block', marginTop: 6, fontSize: 12, fontWeight: 700, color: '#0a7d36', textDecoration: 'none' }}>▶ ouvir no Spotify ↗</a>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </>}
      {form && <AlbumForm editing={form.editing} onClose={() => setForm(null)} />}
    </div>
  );
}
function AlbumForm({ editing, onClose }) {
  const life = useLife();
  const [album, setAlbum] = useState(editing?.album || '');
  const [artista, setArtista] = useState(editing?.artista || '');
  const [ano, setAno] = useState(editing?.ano || '');
  const [nota, setNota] = useState(editing?.nota || '');
  const [link, setLink] = useState(editing?.link || '');
  const podeSalvar = album.trim() && artista.trim();
  const salvar = () => {
    if (!podeSalvar) return;
    const novoLink = link.trim() || undefined;
    // Se o link mudou, zera a capa pra o backfill buscar a nova (senão fica a antiga).
    const capa = editing && novoLink !== editing.link ? undefined : editing?.capa;
    life.saveAlbum({ id: editing?.id, album: album.trim(), artista: artista.trim(), ano: String(ano).trim() || undefined, nota: nota.trim() || undefined, link: novoLink, capa });
    onClose();
  };
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar' : 'Novo'} álbum</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>
        <label style={labelStyle}>Álbum</label>
        <input value={album} onChange={e => setAlbum(e.target.value)} placeholder="ex.: Blue" style={inputStyle} />
        <label style={labelStyle}>Artista</label>
        <input value={artista} onChange={e => setArtista(e.target.value)} placeholder="ex.: Joni Mitchell" style={inputStyle} />
        <label style={labelStyle}>Ano</label>
        <input type="text" inputMode="numeric" value={ano} onChange={e => setAno(e.target.value)} placeholder="ex.: 2019 (do disco ou de quando marcou)" style={inputStyle} />
        <label style={labelStyle}>Link do Spotify (opcional)</label>
        <input value={link} onChange={e => setLink(e.target.value)} placeholder="cole o link do álbum no Spotify" style={inputStyle} />
        <label style={labelStyle}>Nota (opcional)</label>
        <input value={nota} onChange={e => setNota(e.target.value)} placeholder="ex.: trilha do verão de 2019" style={inputStyle} />
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          {editing && <button onClick={() => { life.deleteAlbum(editing.id); onClose(); }} style={{ padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apagar</button>}
          <button onClick={salvar} disabled={!podeSalvar} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: 'none', background: podeSalvar ? '#111' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: podeSalvar ? 'pointer' : 'default' }}>{editing ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  );
}

// ---- Card: Corridas (provas — meta × executado, pace e evolução) ----
const COR_CORRIDA = '#ef6c4d';
// Mini-gráfico de evolução do pace (mais rápido = mais alto). pts em ordem cronológica.
// Cada ponto mostra o pace (em cima) e a data (embaixo).
function PaceChart({ pts }) {
  if (pts.length < 2) return null;
  const W = 320, H = 150, padX = 30, padTop = 28, padBottom = 30;
  const paces = pts.map(p => p.pace);
  const min = Math.min(...paces), max = Math.max(...paces);
  const range = (max - min) || 1;
  const x = (i) => padX + (W - 2 * padX) * (i / (pts.length - 1));
  const y = (p) => padTop + (H - padTop - padBottom) * ((p - min) / range); // pace menor (mais rápido) no topo
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.pace).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <path d={d} fill="none" stroke={COR_CORRIDA} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.pace)} r="3.5" fill={COR_CORRIDA} />
          <text x={x(i)} y={y(p.pace) - 10} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={COR_CORRIDA}>{fmtPace(p.pace)}</text>
          {p.data && <text x={x(i)} y={H - 10} textAnchor="middle" fontSize="9.5" fill="#999">{fmtDM(p.data)}</text>}
        </g>
      ))}
    </svg>
  );
}

// Bloco do trajeto num card de prova: usa o RotaField compartilhado e salva no
// exercício original (campo `rota`), sem os campos derivados do card.
function RotaProva({ prova, cor = COR_CORRIDA }) {
  const cal = useCalendar();
  const orig = (cal.data.exercicios || []).find(e => e.id === prova.id);
  const onChange = (rota) => {
    if (!orig) return;
    if (rota) cal.saveExercicio({ ...orig, rota });
    else { const { rota: _drop, ...rest } = orig; cal.saveExercicio(rest); }
  };
  return <RotaField rota={prova.rota} onChange={onChange} cor={cor} />;
}

function CorridasRetro({ onBack, isWide }) {
  const cal = useCalendar();
  const hoje = new Date();
  const hk = `${hoje.getFullYear()}-${pad2(hoje.getMonth() + 1)}-${pad2(hoje.getDate())}`;
  const [vista, setVista] = useState('provas');            // 'provas' | 'rua'
  const ehProvaSub = (s) => s === 'corrida_prova' || s === 'corrida';
  const ehRuaSub = (s) => s === 'corrida_treino_rua' || s === 'corrida_treino'; // treino antigo = rua
  const naVista = (s) => vista === 'provas' ? ehProvaSub(s) : ehRuaSub(s);
  const todasProvas = (cal.data.exercicios || [])
    .filter(x => naVista(x.subtipo))
    .filter(x => (x.data || '') <= hk)
    .map(x => {
      const km = Number(x.distancia) || 0;
      const pReal = paceSecs(x.tempo, km);
      const pMeta = paceSecs(x.metaTempo, km);
      const nome = x.titulo || EXERCICIO_BY_ID[x.subtipo]?.label || 'Corrida';
      return { ...x, km, pReal, pMeta, nome };
    })
    .sort((a, b) => (b.data || '').localeCompare(a.data || ''));
  const { anos, anoSel, setAnoSel } = useAnoSel(todasProvas.map(p => p.data));
  const provas = todasProvas.filter(p => (p.data || '').slice(0, 4) === anoSel);
  const ehProvas = vista === 'provas';
  const uni = ehProvas ? 'prova' : 'corrida';            // singular
  const plu = ehProvas ? 'provas' : 'corridas';          // plural
  const vistaBtn = (id, txt) => (
    <button key={id} onClick={() => setVista(id)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid ' + (vista === id ? COR_CORRIDA : '#e2e2e2'), background: vista === id ? COR_CORRIDA + '1c' : '#fff', color: vista === id ? '#b33d20' : '#888' }}>{txt}</button>
  );

  const comTempo = provas.filter(p => p.tempo);
  const totalKm = Math.round(provas.reduce((a, p) => a + p.km, 0) * 10) / 10;
  const melhorPace = comTempo.map(p => p.pReal).filter(Boolean).length ? Math.min(...comTempo.map(p => p.pReal).filter(Boolean)) : null;
  const evo = comTempo.filter(p => p.pReal).slice().sort((a, b) => (a.data || '').localeCompare(b.data || '')).map(p => ({ pace: p.pReal, data: p.data, nome: p.nome }));

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Retrospectiva</button>
      <div style={{ width: 36, height: 4, background: COR_CORRIDA, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Corridas</h2>
      <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 14px' }}>{ehProvas ? 'suas provas: meta × executado e evolução do pace' : 'seus treinos na rua: distância, pace e trajeto'}</p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {vistaBtn('provas', 'Provas')}
        {vistaBtn('rua', 'Treinos rua')}
      </div>

      {todasProvas.length === 0 ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>{ehProvas ? 'Nenhuma prova ainda. Marque uma "Corrida prova" no Calendário com distância, tempo real e meta de tempo.' : 'Nenhuma corrida de rua ainda. Marque uma "Corrida rua" no Calendário com distância e tempo.'}</p>
      ) : <>
        <AnoChips anos={anos} anoSel={anoSel} setAnoSel={setAnoSel} cor={COR_CORRIDA} />
        {provas.length === 0 && <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '10px 0' }}>Nenhuma {uni} em {anoSel}.</p>}
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 18 }}>
          <div><span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#111' }}>{provas.length}</span><span style={{ fontSize: 12.5, color: '#999' }}> {provas.length === 1 ? uni : plu}</span></div>
          <div><span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#111' }}>{fmtKm(totalKm)}</span><span style={{ fontSize: 12.5, color: '#999' }}> km</span></div>
          {melhorPace && <div><span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: COR_CORRIDA }}>{fmtPace(melhorPace)}</span><span style={{ fontSize: 12.5, color: '#999' }}> melhor pace</span></div>}
        </div>

        {evo.length >= 2 && (
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: COR_CORRIDA, letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>evolução do pace (mais alto = mais rápido)</div>
            <PaceChart pts={evo} />
          </div>
        )}

        {provas.map(p => {
          const delta = (p.tempo && p.metaTempo) ? p.tempo - p.metaTempo : null;
          const bateu = delta != null && delta <= 0;
          return (
            <div key={p.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#222' }}>{p.nome}</span>
                <span style={{ fontSize: 11.5, color: '#aaa', flexShrink: 0 }}>{p.data ? fmtDM(p.data) : '—'}{p.km ? ` · ${fmtKm(p.km)}km` : ''}</span>
              </div>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13 }}>
                {p.tempo && <span style={{ color: '#333' }}>tempo <b>{fmtTempo(p.tempo)}</b>{p.pReal && <span style={{ color: '#999' }}> · {fmtPace(p.pReal)}</span>}</span>}
                {p.metaTempo && <span style={{ color: '#999' }}>meta {fmtTempo(p.metaTempo)}{p.pMeta && ` · ${fmtPace(p.pMeta)}`}</span>}
              </div>
              {delta != null && (
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: bateu ? '#2bb673' : '#d05050' }}>
                  {bateu ? `✓ bateu a meta por ${fmtTempo(-delta)}` : `${fmtTempo(delta)} acima da meta`}
                </div>
              )}
              <RotaProva prova={p} />
            </div>
          );
        })}
      </>}
    </div>
  );
}

// ---- Card: Trilhas (percursos na natureza — distância, tempo e trajeto) ----
const COR_TRILHA = '#6b8e5a';
function TrilhasRetro({ onBack, isWide }) {
  const cal = useCalendar();
  const hoje = new Date();
  const hk = `${hoje.getFullYear()}-${pad2(hoje.getMonth() + 1)}-${pad2(hoje.getDate())}`;
  const todas = (cal.data.exercicios || [])
    .filter(x => x.subtipo === 'trilha')
    .filter(x => (x.data || '') <= hk)
    .map(x => ({ ...x, km: Number(x.distancia) || 0, nome: x.titulo || 'Trilha' }))
    .sort((a, b) => (b.data || '').localeCompare(a.data || ''));
  const { anos, anoSel, setAnoSel } = useAnoSel(todas.map(t => t.data));
  const trilhas = todas.filter(t => (t.data || '').slice(0, 4) === anoSel);
  const totalKm = Math.round(trilhas.reduce((a, t) => a + t.km, 0) * 10) / 10;

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Retrospectiva</button>
      <div style={{ width: 36, height: 4, background: COR_TRILHA, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Trilhas</h2>
      <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>os percursos que você fez na natureza</p>

      {todas.length === 0 ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Nenhuma trilha ainda. Marque uma "Trilha" no Calendário (em Exercício) com distância e, se quiser, o trajeto (GPX).</p>
      ) : <>
        <AnoChips anos={anos} anoSel={anoSel} setAnoSel={setAnoSel} cor={COR_TRILHA} />
        {trilhas.length === 0 && <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '10px 0' }}>Nenhuma trilha em {anoSel}.</p>}
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 18 }}>
          <div><span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#111' }}>{trilhas.length}</span><span style={{ fontSize: 12.5, color: '#999' }}> {trilhas.length === 1 ? 'trilha' : 'trilhas'}</span></div>
          <div><span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#111' }}>{fmtKm(totalKm)}</span><span style={{ fontSize: 12.5, color: '#999' }}> km</span></div>
        </div>

        {trilhas.map(t => (
          <div key={t.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#222' }}>{t.nome}</span>
              <span style={{ fontSize: 11.5, color: '#aaa', flexShrink: 0 }}>{t.data ? fmtDM(t.data) : '—'}{t.km ? ` · ${fmtKm(t.km)}km` : ''}</span>
            </div>
            {t.tempo && <div style={{ fontSize: 13, color: '#333' }}>tempo <b>{fmtTempo(t.tempo)}</b></div>}
            <RotaProva prova={t} cor={COR_TRILHA} />
          </div>
        ))}
      </>}
    </div>
  );
}

// ---- Card: Dias importantes (marcos de vida) ----
const COR_DIAS = '#7a6ff0';
function DiasRetro({ onBack, isWide }) {
  const life = useLife();
  const [form, setForm] = useState(null);
  const todos = life.marcos || [];
  const { anos, anoSel, setAnoSel } = useAnoSel(todos.map(m => m.data));
  const doAno = todos.filter(m => (m.data || '').slice(0, 4) === anoSel).sort((a, b) => (a.data || '').localeCompare(b.data || '')); // cronológico (mais antigo primeiro)

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Retrospectiva</button>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: 36, height: 4, background: COR_DIAS, borderRadius: 4, marginBottom: 12 }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Dias importantes</h2>
          <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>os marcos que mudaram o seu ano</p>
        </div>
        <button onClick={() => setForm({})} title="registrar dia importante" style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>+</button>
      </div>

      {todos.length === 0 ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Nada por aqui ainda. Toque no + para registrar um dia importante.</p>
      ) : <>
        <AnoChips anos={anos} anoSel={anoSel} setAnoSel={setAnoSel} cor={COR_DIAS} />
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: '#111' }}>{doAno.length}</span>
          <span style={{ fontSize: 13, color: '#999' }}> {doAno.length === 1 ? 'dia' : 'dias'} em {anoSel}</span>
        </div>
        {doAno.length === 0 && <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '10px 0' }}>Nada registrado em {anoSel}.</p>}
        <div style={{ borderLeft: '2px solid ' + COR_DIAS + '33', marginLeft: 5, paddingLeft: 16 }}>
          {doAno.map(m => (
            <div key={m.id} onClick={() => setForm({ editing: m })} style={{ position: 'relative', padding: '8px 0 12px', cursor: 'pointer' }}>
              <span style={{ position: 'absolute', left: -23, top: 12, width: 9, height: 9, borderRadius: '50%', background: COR_DIAS, border: '2px solid #fafafa' }} />
              <div style={{ fontSize: 11, color: COR_DIAS, fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase', marginBottom: 2 }}>{fmtDiaMes(m.data)}</div>
              <div style={{ fontSize: 14, color: '#222', lineHeight: 1.45 }}>{m.titulo}</div>
            </div>
          ))}
        </div>
      </>}

      {form && <DiasForm editing={form.editing} onClose={() => setForm(null)} />}
    </div>
  );
}

function DiasForm({ editing, onClose }) {
  const life = useLife();
  const [data, setData] = useState(editing?.data || '');
  const [titulo, setTitulo] = useState(editing?.titulo || '');
  const podeSalvar = data && titulo.trim().length > 0;
  const salvar = () => {
    if (!podeSalvar) return;
    life.saveMarco({ id: editing?.id, data, titulo: titulo.trim() });
    onClose();
  };
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar' : 'Novo'} dia importante</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>
        <label style={labelStyle}>Quando</label>
        <input type="date" value={data} onChange={e => setData(e.target.value)} style={inputStyle} />
        <label style={labelStyle}>O que aconteceu</label>
        <textarea value={titulo} onChange={e => setTitulo(e.target.value)} rows={2} placeholder="ex.: Fiz minha primeira corrida de rua" style={{ ...inputStyle, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          {editing && <button onClick={() => { life.deleteMarco(editing.id); onClose(); }} style={{ padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apagar</button>}
          <button onClick={salvar} disabled={!podeSalvar} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: 'none', background: podeSalvar ? '#111' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: podeSalvar ? 'pointer' : 'default' }}>{editing ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  );
}

// ---- Card: Viagens (timeline por ano + países com bandeiras) ----
const COR_VIAGENS = '#19b3a6';
const PAIS_FLAG = { 'Brasil': '🇧🇷', 'Espanha': '🇪🇸', 'França': '🇫🇷', 'Itália': '🇮🇹', 'Argentina': '🇦🇷', 'Bélgica': '🇧🇪', 'Portugal': '🇵🇹', 'Peru': '🇵🇪', 'Inglaterra': '🇬🇧', 'Tailândia': '🇹🇭', 'Catar': '🇶🇦', 'Hungria': '🇭🇺', 'República Checa': '🇨🇿' };
const flagOf = (p) => PAIS_FLAG[p] || '🌍';
const vAnoKey = (a) => (String(a) === 'jovem' ? '0000' : String(a));
const vAnoLabel = (a) => (String(a) === 'jovem' ? 'Jovem' : String(a));

function ViagensRetro({ onBack, isWide }) {
  const life = useLife();
  const [form, setForm] = useState(null);
  const viagens = life.viagens || [];
  const cidades = new Set();
  viagens.forEach(v => { const places = (v.locais && v.locais.length) ? v.locais : [v.titulo]; places.forEach(p => cidades.add(p)); });
  const paisesCount = {};
  viagens.forEach(v => (v.paises || []).forEach(p => { paisesCount[p] = (paisesCount[p] || 0) + 1; }));
  const paisesList = Object.entries(paisesCount).sort((a, b) => b[1] - a[1]);
  const porAno = {};
  viagens.forEach(v => { const k = String(v.ano); porAno[k] = (porAno[k] || 0) + 1; });
  const anosDesc = Object.keys(porAno).sort((a, b) => vAnoKey(b).localeCompare(vAnoKey(a)));
  const maxAno = Math.max(...Object.values(porAno), 1);

  const stat = (n, label) => (
    <div><span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#111' }}>{n}</span><span style={{ fontSize: 12.5, color: '#999' }}> {label}</span></div>
  );

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Retrospectiva</button>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: 36, height: 4, background: COR_VIAGENS, borderRadius: 4, marginBottom: 12 }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Viagens</h2>
          <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>para onde você foi</p>
        </div>
        <button onClick={() => setForm({})} title="adicionar viagem" style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>+</button>
      </div>

      {viagens.length === 0 ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Nada por aqui ainda. Toque no + para registrar uma viagem.</p>
      ) : <>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
          {stat(viagens.length, viagens.length === 1 ? 'viagem' : 'viagens')}
          {stat(cidades.size, 'cidades')}
          {stat(paisesList.length, paisesList.length === 1 ? 'país' : 'países')}
        </div>

        <div style={{ fontSize: 11, color: COR_VIAGENS, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>viagens por ano</div>
        <div style={{ marginBottom: 22 }}>
          {anosDesc.map(a => (
            <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
              <span style={{ fontSize: 11.5, color: '#888', fontWeight: 700, width: 42, flexShrink: 0, textAlign: 'right' }}>{vAnoLabel(a)}</span>
              <div style={{ flex: 1, height: 14, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: (porAno[a] / maxAno * 100) + '%', height: '100%', background: COR_VIAGENS, borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 12, color: COR_VIAGENS, fontWeight: 700, width: 20, flexShrink: 0 }}>{porAno[a]}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, color: COR_VIAGENS, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>países · {paisesList.length}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 24 }}>
          {paisesList.map(([nome, n]) => (
            <span key={nome} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 20, background: COR_VIAGENS + '12', border: '1px solid ' + COR_VIAGENS + '33', fontSize: 12.5, color: '#1a5a54', fontWeight: 600 }}>
              <span style={{ fontSize: 14 }}>{flagOf(nome)}</span>{nome}<span style={{ color: '#7fb8b2', fontWeight: 700 }}>{n}</span>
            </span>
          ))}
        </div>

        <div style={{ fontSize: 11, color: COR_VIAGENS, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>linha do tempo</div>
        {anosDesc.map(a => {
          const lista = viagens.filter(v => String(v.ano) === a);
          return (
            <div key={a} style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#222' }}>{vAnoLabel(a)}</span>
                <span style={{ fontSize: 11.5, color: '#bbb' }}>{lista.length} {lista.length === 1 ? 'viagem' : 'viagens'}</span>
              </div>
              <div style={{ borderLeft: '2px solid ' + COR_VIAGENS + '33', marginLeft: 4, paddingLeft: 16 }}>
                {lista.map(v => (
                  <div key={v.id} onClick={() => setForm({ editing: v })} style={{ position: 'relative', padding: '7px 0 10px', cursor: 'pointer' }}>
                    <span style={{ position: 'absolute', left: -23, top: 11, width: 9, height: 9, borderRadius: '50%', background: COR_VIAGENS, border: '2px solid #fafafa' }} />
                    <div style={{ fontSize: 14, color: '#222', fontWeight: 600 }}>{v.titulo} {(v.paises || []).map(flagOf).join('')}</div>
                    {v.locais && v.locais.length > 0 && <div style={{ fontSize: 11.5, color: '#999', marginTop: 2 }}>{v.locais.join(' · ')}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </>}

      {form && <ViagemForm editing={form.editing} onClose={() => setForm(null)} />}
    </div>
  );
}

function ViagemForm({ editing, onClose }) {
  const life = useLife();
  const [titulo, setTitulo] = useState(editing?.titulo || '');
  const [ano, setAno] = useState(editing?.ano != null ? String(editing.ano) : '');
  const [locais, setLocais] = useState((editing?.locais || []).join('\n'));
  const [paises, setPaises] = useState((editing?.paises || []).join(', '));
  const podeSalvar = titulo.trim().length > 0 && ano.trim().length > 0;
  const salvar = () => {
    if (!podeSalvar) return;
    life.saveViagem({ id: editing?.id, ano: ano.trim(), titulo: titulo.trim(),
      locais: locais.split('\n').map(s => s.trim()).filter(Boolean),
      paises: paises.split(',').map(s => s.trim()).filter(Boolean) });
    onClose();
  };
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar' : 'Nova'} viagem</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>
        <label style={labelStyle}>Destino</label>
        <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="ex.: Tailândia ou Paraty" style={inputStyle} />
        <label style={labelStyle}>Ano</label>
        <input value={ano} onChange={e => setAno(e.target.value)} placeholder="ex.: 2026 (ou jovem)" style={inputStyle} />
        <label style={labelStyle}>Cidades (opcional, uma por linha)</label>
        <textarea value={locais} onChange={e => setLocais(e.target.value)} rows={3} placeholder={'Bangkok\nChiang Mai\nKrabi'} style={{ ...inputStyle, resize: 'vertical' }} />
        <label style={labelStyle}>Países (separados por vírgula)</label>
        <input list="vg-paises" value={paises} onChange={e => setPaises(e.target.value)} placeholder="ex.: Itália, França" style={inputStyle} />
        <datalist id="vg-paises">{Object.keys(PAIS_FLAG).map(p => <option key={p} value={p} />)}</datalist>
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          {editing && <button onClick={() => { life.deleteViagem(editing.id); onClose(); }} style={{ padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apagar</button>}
          <button onClick={salvar} disabled={!podeSalvar} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: 'none', background: podeSalvar ? '#111' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: podeSalvar ? 'pointer' : 'default' }}>{editing ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  );
}

// Acompanhamento (retrospectiva): o que a Mari preenche todo dia na Tela Hoje —
// sono, trabalho e os hábitos. Guardado em calendarStore.tracking (chave
// 'YYYY-MM-DD'). Aqui: médias e contagens do mês + o dia a dia, e dá pra editar
// qualquer dia ou preencher um que ficou pra trás.
const COR_HAB = '#3fb6a8';
// Os hábitos liga/desliga, na mesma ordem da Tela Hoje.
const HABS_TRACK = [['exercicio', 'Exercício', '🏃'], ['comidaSaudavel', 'Comida saudável', '🥗'], ['fioDental', 'Fio dental', '🦷'], ['leu', 'Leitura', '📖']];
// Horas guardadas em decimal, mostradas em hh:mm (7,5 → 7:30). Aceita só o número.
const fmtHoraHM = (v) => { if (v == null) return ''; const tot = Math.round(v * 60); return `${Math.floor(tot / 60)}:${String(tot % 60).padStart(2, '0')}`; };
const parseHoraHM = (s) => {
  const str = String(s).trim();
  if (!str) return undefined;
  if (str.includes(':')) { const [h, m] = str.split(':'); const v = (Number(h) || 0) + (Number(m) || 0) / 60; return isFinite(v) ? v : undefined; }
  const n = Number(str.replace(',', '.'));
  return isFinite(n) ? n : undefined;
};

// Editar um dia do acompanhamento — ou preencher um que ela esqueceu. Salva a cada
// mudança (igual à Tela Hoje); trocar a data no topo carrega o que houver naquele dia.
function DiaTrackForm({ dia, escolherData, onClose }) {
  const cal = useCalendar();
  const hoje = new Date();
  const hojeK = `${hoje.getFullYear()}-${pad2(hoje.getMonth() + 1)}-${pad2(hoje.getDate())}`;
  const [k, setK] = useState(dia || hojeK);
  const t = (cal.data.tracking || {})[k] || {};
  const [sono, setSono] = useState(fmtHoraHM(t.sono));
  const [trab, setTrab] = useState(fmtHoraHM(t.trabalho));
  // Ao trocar o dia, os campos recarregam os valores daquele dia.
  useEffect(() => { const d = (cal.data.tracking || {})[k] || {}; setSono(fmtHoraHM(d.sono)); setTrab(fmtHoraHM(d.trabalho)); }, [k]); // eslint-disable-line
  const salvarNum = (campo, txt) => cal.setTracking(k, { [campo]: parseHoraHM(txt) });
  const numLabel = { fontSize: 10.5, color: '#999', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 4, fontWeight: 700 };
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{escolherData ? 'Preencher um dia' : `Dia ${k.slice(8, 10)}/${k.slice(5, 7)}`}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>
        <label style={labelStyle}>Dia</label>
        <input type="date" value={k} max={hojeK} onChange={e => setK(e.target.value || hojeK)} style={inputStyle} />
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={numLabel}>Sono (h)</label>
            <input type="text" value={sono} onChange={e => { setSono(e.target.value); salvarNum('sono', e.target.value); }} placeholder="ex.: 7:30" style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={numLabel}>Trabalho (h)</label>
            <input type="text" value={trab} onChange={e => { setTrab(e.target.value); salvarNum('trabalho', e.target.value); }} placeholder="ex.: 8:00" style={inputStyle} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
          {HABS_TRACK.map(([campo, label]) => {
            const on = !!t[campo];
            return (
              <button key={campo} onClick={() => cal.setTracking(k, { [campo]: !on })} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                border: '1px solid ' + (on ? COR_HAB : '#e2e2e2'), background: on ? COR_HAB + '1c' : '#fff', color: on ? '#1a7a6e' : '#999',
              }}>{on ? '✓' : '○'} {label}</button>
            );
          })}
        </div>
        <p style={{ fontSize: 11.5, color: '#bbb', margin: '14px 0 0', lineHeight: 1.5 }}>Salva sozinho. Um dia sem nada preenchido some da lista.</p>
        <button onClick={onClose} style={{ width: '100%', marginTop: 18, padding: '12px 0', borderRadius: 11, border: 'none', background: '#111', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Pronto</button>
      </div>
    </div>
  );
}
function HabitosRetro({ onBack, isWide }) {
  const cal = useCalendar();
  const tracking = cal.data.tracking || {};
  const dias = Object.keys(tracking);
  const meses = [...new Set(dias.map(d => d.slice(0, 7)))].sort().reverse();
  const [mesSel, setMesSel] = useState(null);
  const mesAtual = (mesSel && meses.includes(mesSel)) ? mesSel : meses[0];
  const regs = dias.filter(d => d.slice(0, 7) === mesAtual).sort().reverse().map(d => ({ d, ...tracking[d] }));
  // Gráfico de linha (estilo do peso): escolhe sono OU trabalho e vê a evolução no
  // mês. Série em ordem cronológica, só dias com o valor preenchido.
  const [metric, setMetric] = useState('sono');
  const serie = regs.filter(r => typeof r[metric] === 'number').map(r => ({ d: r.d, v: r[metric] })).sort((a, b) => a.d.localeCompare(b.d));
  const media = (campo) => { const vs = regs.map(r => r[campo]).filter(v => typeof v === 'number'); return vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null; };
  const conta = (campo) => regs.filter(r => r[campo]).length;
  // Horas guardadas em decimal; exibidas em hh:mm (7,5 → 7:30). Média também.
  const fmtH = (v) => { if (v == null) return '—'; const tot = Math.round(v * 60); return `${Math.floor(tot / 60)}:${String(tot % 60).padStart(2, '0')}`; };
  const plur = (n) => n + (n === 1 ? ' dia' : ' dias');
  const HABS = HABS_TRACK;
  const [editDia, setEditDia] = useState(null);   // { dia } editar | { novo: true } preencher um dia esquecido
  const selStyle = { padding: '9px 12px', borderRadius: 12, border: '1px solid ' + COR_HAB + '55', background: COR_HAB + '10', color: '#26645d', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit', textTransform: 'capitalize', cursor: 'pointer', marginBottom: 16 };
  const statBox = (label, valor, sub, chave) => (
    <div key={chave} style={{ background: COR_HAB + '10', border: '1px solid ' + COR_HAB + '22', borderRadius: 14, padding: '12px 14px' }}>
      <div style={{ fontSize: 10.5, color: '#7a9a95', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#1a4d47', marginTop: 2 }}>{valor}</div>
      {sub && <div style={{ fontSize: 10.5, color: '#aaa', marginTop: 1 }}>{sub}</div>}
    </div>
  );
  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Retrospectiva</button>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: 36, height: 4, background: COR_HAB, borderRadius: 4, marginBottom: 12 }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Acompanhamento</h2>
          <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>seu dia a dia · sono, trabalho e hábitos</p>
        </div>
        <button onClick={() => setEditDia({ novo: true })} title="preencher um dia" style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>+</button>
      </div>
      {!meses.length ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Nada ainda. Preencha o “Acompanhamento do dia” no fim da Tela Hoje — ou toque no + pra lançar um dia aqui mesmo.</p>
      ) : <>
        <div><select value={mesAtual || ''} onChange={e => setMesSel(e.target.value)} style={selStyle}>{meses.map(m => <option key={m} value={m}>{fmtMesAno(m)}</option>)}</select></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          {statBox('Sono médio', fmtH(media('sono')), plur(regs.filter(r => typeof r.sono === 'number').length), 'med-sono')}
          {statBox('Trabalho médio', fmtH(media('trabalho')), plur(regs.filter(r => typeof r.trabalho === 'number').length), 'med-trab')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
          {HABS.map(([campo, label, emoji]) => statBox(label, conta(campo), conta(campo) === 1 ? 'dia' : 'dias', campo))}
        </div>
        <p style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, margin: '0 0 8px' }}>dia a dia <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: '#ccc' }}>· toque num dia pra editar</span></p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {[['sono', 'Sono'], ['trabalho', 'Trabalho']].map(([m, l]) => (
            <button key={m} onClick={() => setMetric(m)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', border: '1px solid ' + (metric === m ? COR_HAB : '#e2e2e2'), background: metric === m ? COR_HAB + '1c' : '#fff', color: metric === m ? '#1a4d47' : '#999' }}>{l}</button>
          ))}
        </div>
        {serie.length >= 2 ? (() => {
          const W = 320, H = 152, padTop = 14, padBot = 44, padLeft = 40, padRight = 10;
          const n = serie.length;
          const vs = serie.map(p => p.v);
          const min = Math.min(...vs), max = Math.max(...vs);
          const pad = Math.max(0.5, (max - min) * 0.6);
          const lo = min - pad, hi = max + pad, span = (hi - lo) || 1;
          const x = (i) => n === 1 ? W / 2 : padLeft + i * (W - padLeft - padRight) / (n - 1);
          const y = (v) => (H - padBot) - ((v - lo) / span) * (H - padTop - padBot);
          const path = serie.map((p, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
          const yLbl = H - padBot + 6;
          return (
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', marginBottom: 14 }}>
              <text x={padLeft - 4} y={y(max) + 3} textAnchor="end" fontSize="7.5" fill="#bbb">{fmtH(max)}</text>
              <text x={padLeft - 4} y={y(min) + 3} textAnchor="end" fontSize="7.5" fill="#bbb">{fmtH(min)}</text>
              <path d={path} fill="none" stroke={COR_HAB} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
              {serie.map((p, i) => (
                <g key={p.d}>
                  <circle cx={x(i)} cy={y(p.v)} r="2.6" fill={COR_HAB} stroke="#fafafa" strokeWidth="1" />
                  <text x={x(i)} y={yLbl} textAnchor="end" fontSize="7" fill="#bbb" transform={`rotate(270 ${x(i)} ${yLbl})`}>{p.d.slice(8, 10)}/{p.d.slice(5, 7)}</text>
                </g>
              ))}
            </svg>
          );
        })() : <p style={{ fontSize: 12, color: '#bbb', fontStyle: 'italic', margin: '0 0 14px' }}>Precisa de ao menos 2 dias com {metric === 'sono' ? 'sono' : 'trabalho'} preenchido pra ver a linha.</p>}
        {regs.map(r => (
          <div key={r.d} onClick={() => setEditDia({ dia: r.d })} title="tocar pra editar" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #f3f3f3', cursor: 'pointer' }}>
            <span style={{ fontSize: 13, color: '#444', fontWeight: 700, width: 46, flexShrink: 0 }}>{r.d.slice(8, 10)}/{r.d.slice(5, 7)}</span>
            <span style={{ fontSize: 12.5, color: '#777', whiteSpace: 'nowrap', flexShrink: 0 }}>😴 {fmtH(r.sono)} · 💼 {fmtH(r.trabalho)}</span>
            {/* só mostra o emoji do hábito que a Mari fez (nada de cinza pra o que não fez) */}
            <span style={{ fontSize: 14, display: 'flex', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
              {HABS.filter(([campo]) => r[campo]).map(([campo, label, emoji]) => <span key={campo} title={label}>{emoji}</span>)}
            </span>
          </div>
        ))}
      </>}
      {editDia && <DiaTrackForm dia={editDia.dia} escolherData={editDia.novo} onClose={() => setEditDia(null)} />}
    </div>
  );
}

// ---- Card: Amorosa (privada — escondida atrás de um toque) ----
const COR_AMOR = '#c2548f';
const TIPOS_AM = [
  { id: 'transa', label: 'Sexo', plural: 'sexo' },
  { id: 'date', label: 'Date', plural: 'dates' },
  { id: 'beijo', label: 'Beijo', plural: 'beijos' },
  { id: 'relacao', label: 'Caso', plural: 'casos' },
];
const tipoAm = (id) => TIPOS_AM.find(t => t.id === id) || TIPOS_AM[0];
const fmtBRLam = (n) => 'R$ ' + Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
// Cadeado: fica no topo; oculto=true borra os valores (toque revela).
function Cadeado({ oculto, setOculto, cor }) {
  return (
    <button onClick={() => setOculto(o => !o)} title={oculto ? 'mostrar valores' : 'ocultar valores'} style={{
      flexShrink: 0, border: '1px solid ' + (oculto ? cor + '66' : '#e2e2e2'), borderRadius: 12,
      background: oculto ? cor + '14' : '#fff', cursor: 'pointer', width: 42, height: 42, fontSize: 18, lineHeight: 1,
    }}>{oculto ? '🔒' : '🔓'}</button>
  );
}

function AmorosaRetro({ onBack, isWide }) {
  const life = useLife();
  const [oculto, setOculto] = useState(true);
  const [form, setForm] = useState(null);
  const [verTudo, setVerTudo] = useState(false);
  const todos = life.amorosa || [];
  const { anos, anoSel, setAnoSel } = useAnoSel(todos.map(a => a.data));
  const registros = (verTudo ? [...todos] : todos.filter(a => (a.data || '').slice(0, 4) === anoSel)).sort((a, b) => (b.data || '').localeCompare(a.data || ''));
  const countTipo = (t) => registros.filter(a => (a.tipo || 'transa') === t).length;
  const gastoTotal = registros.reduce((s, a) => s + (Number(a.valor) || 0), 0);
  const dataLabel = (a) => a.soAno ? (a.data || '').slice(0, 4) : (verTudo ? `${fmtDiaMes(a.data)} ${(a.data || '').slice(0, 4)}` : fmtDiaMes(a.data));

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Retrospectiva</button>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: 36, height: 4, background: COR_AMOR, borderRadius: 4, marginBottom: 12 }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Amorosa</h2>
          <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>só seu · dates, beijos e afins</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <Cadeado oculto={oculto} setOculto={setOculto} cor={COR_AMOR} />
          <button onClick={() => setForm({})} title="registrar" style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>+</button>
        </div>
      </div>

      {todos.length === 0 ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Nada por aqui ainda. Toque no + para registrar sexo, date, beijo ou caso.</p>
      ) : <div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4 }}>
          <button onClick={() => setVerTudo(true)} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', border: '1px solid ' + (verTudo ? COR_AMOR : '#e2e2e2'), background: verTudo ? COR_AMOR + '1c' : '#fff', color: verTudo ? '#333' : '#999' }}>Total</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <AnoChips anos={anos} anoSel={verTudo ? null : anoSel} setAnoSel={(a) => { setAnoSel(a); setVerTudo(false); }} cor={COR_AMOR} />
          </div>
        </div>
        <div style={{ filter: oculto ? 'blur(7px)' : 'none', transition: 'filter .2s', userSelect: oculto ? 'none' : 'auto', pointerEvents: oculto ? 'none' : 'auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 20px', marginBottom: 18 }}>
          {TIPOS_AM.map(t => { const n = countTipo(t.id); return (
            <div key={t.id}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: n ? '#111' : '#ccc' }}>{n}</span>
              <span style={{ fontSize: 12.5, color: '#999' }}> {n === 1 ? t.label.toLowerCase() : t.plural}</span>
            </div>
          ); })}
        </div>

        {gastoTotal > 0 && <p style={{ fontSize: 12.5, color: '#999', margin: '-6px 0 18px' }}>gastou <strong style={{ color: COR_AMOR }}>{fmtBRLam(gastoTotal)}</strong> {verTudo ? 'no total' : 'em ' + anoSel}</p>}

        <div style={{ fontSize: 11, color: COR_AMOR, letterSpacing: '0.4px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>{verTudo ? 'linha do tempo' : 'no ano'}</div>
        {registros.length === 0 ? <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '6px 0' }}>Nada registrado{verTudo ? '.' : ' em ' + anoSel + '.'}</p> : (
          <div style={{ borderLeft: '2px solid ' + COR_AMOR + '33', marginLeft: 5, paddingLeft: 16 }}>
            {registros.map(a => { const T = tipoAm(a.tipo); return (
              <div key={a.id} onClick={() => setForm({ editing: a })} style={{ position: 'relative', padding: '8px 0 12px', cursor: 'pointer' }}>
                <span style={{ position: 'absolute', left: -23, top: 12, width: 9, height: 9, borderRadius: '50%', background: COR_AMOR, border: '2px solid #fafafa' }} />
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: COR_AMOR, fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase' }}>{dataLabel(a)}</span>
                  <span style={{ fontSize: 12, color: '#777' }}>{T.label}</span>
                  {a.pessoa && <span style={{ fontSize: 14, color: '#222', fontWeight: 600 }}>· {a.pessoa}</span>}
                  {a.valor > 0 && <span style={{ fontSize: 11.5, color: COR_AMOR, fontWeight: 700 }}>{fmtBRLam(a.valor)}</span>}
                  {a.tipo === 'relacao' && a.fim && <span style={{ fontSize: 11.5, color: '#aaa' }}>até {fmtDiaMes(a.fim)}</span>}
                </div>
                {(a.local || a.nota) && <div style={{ fontSize: 13, color: '#888', lineHeight: 1.45, marginTop: 3 }}>{[a.local, a.nota].filter(Boolean).join(' · ')}</div>}
              </div>
            ); })}
          </div>
        )}
        </div>
      </div>}

      {form && <AmorosaForm editing={form.editing} onClose={() => setForm(null)} />}
    </div>
  );
}

function AmorosaForm({ editing, onClose }) {
  const life = useLife();
  const [tipo, setTipo] = useState(editing?.tipo || 'transa');
  const [data, setData] = useState(editing?.data || '');
  const [fim, setFim] = useState(editing?.fim || '');
  const [pessoa, setPessoa] = useState(editing?.pessoa || '');
  const [local, setLocal] = useState(editing?.local || '');
  const [valor, setValor] = useState(editing?.valor != null ? String(editing.valor) : '');
  const [nota, setNota] = useState(editing?.nota || '');
  const pessoas = [...new Set((life.amorosa || []).map(a => a.pessoa).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt'));
  const podeSalvar = !!data;
  const salvar = () => {
    if (!podeSalvar) return;
    const v = parseFloat((valor || '').replace(',', '.'));
    life.saveAmorosa({ id: editing?.id, tipo, data, fim: (tipo === 'relacao' && fim) ? fim : undefined, pessoa: pessoa.trim() || undefined, local: local.trim() || undefined, valor: isFinite(v) && v > 0 ? v : undefined, nota: nota.trim() || undefined });
    onClose();
  };
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar' : 'Novo'} registro</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>
        <label style={labelStyle}>Tipo</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {TIPOS_AM.map(t => (
            <button key={t.id} onClick={() => setTipo(t.id)} style={{ border: '1px solid ' + (tipo === t.id ? COR_AMOR : '#e2e2e2'), borderRadius: 20, background: tipo === t.id ? COR_AMOR : '#fff', color: tipo === t.id ? '#fff' : '#777', cursor: 'pointer', padding: '7px 13px', fontSize: 12.5, fontWeight: 700 }}>{t.label}</button>
          ))}
        </div>
        <label style={labelStyle}>{tipo === 'relacao' ? 'Início' : 'Quando'}</label>
        <input type="date" value={data} onChange={e => setData(e.target.value)} style={inputStyle} />
        {tipo === 'relacao' && <>
          <label style={labelStyle}>Fim (opcional)</label>
          <input type="date" value={fim} onChange={e => setFim(e.target.value)} style={inputStyle} />
        </>}
        <label style={labelStyle}>Com quem (opcional)</label>
        <input value={pessoa} onChange={e => setPessoa(e.target.value)} list="amor-pessoas" placeholder="nome ou apelido" style={inputStyle} />
        <datalist id="amor-pessoas">{pessoas.map(p => <option key={p} value={p} />)}</datalist>
        <label style={labelStyle}>Onde (opcional)</label>
        <input value={local} onChange={e => setLocal(e.target.value)} placeholder="ex.: bar, casa dele…" style={inputStyle} />
        <label style={labelStyle}>Quanto gastei — R$ (opcional)</label>
        <input value={valor} onChange={e => setValor(e.target.value)} inputMode="decimal" placeholder="ex.: 120" style={inputStyle} />
        <label style={labelStyle}>Comentário (opcional)</label>
        <textarea value={nota} onChange={e => setNota(e.target.value)} rows={2} placeholder="como foi, o que rolou…" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          {editing && <button onClick={() => { life.deleteAmorosa(editing.id); onClose(); }} style={{ padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apagar</button>}
          <button onClick={salvar} disabled={!podeSalvar} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: 'none', background: podeSalvar ? '#111' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: podeSalvar ? 'pointer' : 'default' }}>{editing ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  );
}

function EmBreve({ card, onBack }) {
  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: 620, margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Retrospectiva</button>
      <div style={{ width: 36, height: 4, background: card.cor, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 10px' }}>{card.label}</h2>
      <div style={{ marginTop: 18, padding: 24, borderRadius: 16, background: card.cor + '12', border: '1px dashed ' + card.cor + '55', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 16, color: '#555', margin: 0 }}>Em breve.</p>
        <p style={{ fontSize: 13, color: '#999', marginTop: 8, lineHeight: 1.6 }}>Vamos construir esta retrospectiva juntas.</p>
      </div>
    </div>
  );
}
