// Aba "Retrospectiva": hub que agrega seus números e marcos.
// Página inicial: "o ano em números" (clicável) + cards que abrem sub-retrospectivas.
import { useState, useEffect, useRef } from 'react';
import { useCalendar } from './calendarStore.jsx';
import { useLife, simboloMoeda, MOEDAS } from './lifeStore.jsx';
import { fetchSpotifyCover } from './cloud.js';
import { EXERCICIO_BY_ID, fmtTempo, paceSecs, fmtPace, fmtKm, cicloDia27, cicloLabel } from './calendarConfig.js';

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
  { id: 'gastos', label: 'Gastos', desc: 'pra onde foi o dinheiro', cor: '#6b7a99', pronto: true },
  { id: 'coisasCaras', label: 'Coisas caras', desc: 'quando comprei e quanto duram', cor: '#ff8a3d', pronto: true },
  { id: 'quem', label: 'Quem você viu', desc: 'as pessoas do seu ano', cor: '#ff5d8f', pronto: true },
  { id: 'viagens', label: 'Viagens', desc: 'pra onde você foi', cor: '#19b3a6', pronto: true },
  { id: 'musica', label: 'Música', desc: 'o que tocou no seu ano', cor: '#1db954', pronto: true },
  { id: 'leituras', label: 'Leituras', desc: 'os livros do seu ano', cor: '#7a5c9e', pronto: true },
  { id: 'saude', label: 'Saúde', desc: 'terapia, consultas, exames', cor: '#d96459', pronto: true },
  { id: 'corridas', label: 'Corridas', desc: 'suas provas e pace', cor: '#ef6c4d', pronto: true },
  { id: 'amorosa', label: 'Amorosa', desc: 'dates, beijos e afins', cor: '#c2548f', pronto: true },
];

export default function RetrospectivaPage({ isWide, secInicial, onConsumeSec }) {
  const [sec, setSec] = useState(secInicial || null);
  useEffect(() => { if (secInicial) { setSec(secInicial); onConsumeSec && onConsumeSec(); } }, [secInicial]);
  // Ao trocar de sub-tela (abrir um card ou voltar), volta pro topo — senão fica
  // na posição rolada do hub e a sub-tela abre no fim.
  useEffect(() => { window.scrollTo(0, 0); }, [sec]);
  const baseSec = (sec || '').split(':')[0];          // 'gastos:Saúde' → 'gastos'
  const catInicial = (sec || '').split(':').slice(1).join(':') || null; // → 'Saúde'
  if (baseSec === 'gastos') return <GastosRetro onBack={() => setSec(null)} isWide={isWide} catInicial={catInicial} />;
  if (baseSec === 'coisasCaras') return <CoisasCarasView onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec === 'musica') return <MusicaRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec === 'leituras') return <LeiturasRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec === 'corridas') return <CorridasRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec === 'dias') return <DiasRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec === 'viagens') return <ViagensRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec === 'amorosa') return <AmorosaRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec === 'quem') return <QuemRetro onBack={() => setSec(null)} isWide={isWide} />;
  if (baseSec === 'saude') return <SaudeRetro onBack={() => setSec(null)} isWide={isWide} />;
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

// Saúde: nº de sessões de terapia, consultas e exames (eventos categoria 'saude' do Calendário).
function SaudeRetro({ onBack, isWide }) {
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
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Retrospectiva</button>
      <div style={{ width: 36, height: 4, background: cor, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Saúde</h2>
      <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>suas idas ao médico no ano (do Calendário)</p>
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
          <span style={{ fontSize: 10.5, color: ehProva(x) ? COR_CORRIDA : '#aaa', textTransform: 'uppercase', fontWeight: 700, flexShrink: 0 }}>{ehProva(x) ? 'prova' : 'treino'}</span>
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

// Gráfico de barras empilhadas: 1 barra por mês, cada faixa = uma compra (valor em R$).
// Altura da barra = total do mês (evolução); nº embaixo = quantidade de compras no mês.
const COR_COMPRAS = '#ff8a3d';
function ComprasChart({ meses }) {
  const [sel, setSel] = useState(null);
  if (!meses.length) return null;
  const max = Math.max(...meses.map(m => m.total), 1);
  const H = 160, barW = 26, gap = 16, padBot = 24, padTop = 6;
  const chartH = H - padBot - padTop;
  const W = Math.max(meses.length * (barW + gap) + gap, 1);
  const PALETTE = ['#ff8a3d', '#5b8def', '#2bb673', '#c77dff', '#ef6c4d', '#26c6da', '#f0a35e', '#c2548f', '#6b7a99', '#d4a72c'];
  const fmtR = (v) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
      <div style={{ fontSize: 11, color: '#7a3d12', letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>valor por mês <span style={{ color: '#bbb', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· cada faixa = uma compra</span></div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {meses.map((m, mi) => {
          const x = gap + mi * (barW + gap);
          let yAcc = H - padBot;
          return (
            <g key={m.mm}>
              {m.itens.map((it, ii) => {
                const h = (it.vnum / max) * chartH;
                yAcc -= h;
                const ativo = sel && sel.mm === m.mm && sel.ii === ii;
                return <rect key={ii} x={x} y={yAcc} width={barW} height={Math.max(h, 0.6)} fill={PALETTE[ii % PALETTE.length]} stroke={ativo ? '#111' : '#fff'} strokeWidth={ativo ? 1.4 : 0.5} style={{ cursor: 'pointer' }} onClick={() => setSel({ mm: m.mm, ii, titulo: it.titulo, vnum: it.vnum, label: m.label })} />;
              })}
              <text x={x + barW / 2} y={H - 13} textAnchor="middle" fontSize="8.5" fill="#999">{m.label}</text>
              <text x={x + barW / 2} y={H - 3} textAnchor="middle" fontSize="8" fill="#c79a7a" fontWeight="700">{m.itens.length}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ fontSize: 12, color: sel ? '#333' : '#bbb', marginTop: 6, minHeight: 18 }}>
        {sel ? <><b>{sel.titulo}</b> · {fmtR(sel.vnum)} <span style={{ color: '#aaa' }}>({sel.label})</span></> : 'toque numa faixa para ver a compra'}
      </div>
    </div>
  );
}

// ---- Card: Compras — histórico próprio (+ o que foi marcado como comprado nas listas) ----
// Lista das compras marcadas à mão (comprasFeitas) por mês, com preço — mostrada
// INLINE embaixo da tabela de Coisas. `ano` filtra pelo ano selecionado (opcional).
function ComprasFeitasLista({ ano }) {
  const life = useLife();
  const [form, setForm] = useState(null);
  const valorTxt = (v, m) => v ? simboloMoeda(m) + ' ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
  const todas = (life.comprasFeitas || []).map(c => ({ id: c.id, titulo: c.titulo, data: c.data, sub: c.categoria, vtxt: valorTxt(c.valor, c.moeda), moeda: c.moeda || 'BRL', vnum: Number(c.valor) || 0, raw: c }));
  const doAno = ano ? todas.filter(i => (i.data || '').slice(0, 4) === ano) : todas;
  const meses = [...new Set(doAno.map(i => (i.data || '').slice(0, 7)).filter(Boolean))].sort().reverse();
  const grupos = meses.map(mm => ({ mm, itens: doAno.filter(i => (i.data || '').slice(0, 7) === mm).sort((a, b) => (b.data || '').localeCompare(a.data || '')) }));
  const semData = doAno.filter(i => !i.data);
  const linhaItem = (it) => (
    <div key={it.id} onClick={() => setForm({ editing: it.raw })} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '9px 0', borderBottom: '1px solid #f3f3f3', cursor: 'pointer' }}>
      <span style={{ flex: 1, fontSize: 14, color: '#222' }}>{it.titulo}</span>
      <span style={{ fontSize: 11.5, color: '#aaa', flexShrink: 0 }}>{[it.sub, it.vtxt].filter(Boolean).join(' · ')}</span>
    </div>
  );
  return (
    <div style={{ marginTop: 26, borderTop: '1px solid #eee', paddingTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: '#7a3d12', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 700 }}>Compras por mês</span>
        <button onClick={() => setForm({})} title="registrar compra" style={{ width: 34, height: 34, borderRadius: 9, border: 'none', background: '#111', color: '#fff', fontSize: 20, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>+</button>
      </div>
      {doAno.length === 0 ? (
        <p style={{ fontSize: 12.5, color: '#bbb', fontStyle: 'italic', padding: '4px 0' }}>Nenhuma compra marcada{ano ? ' em ' + ano : ''}. Toque no + para registrar.</p>
      ) : <>
        {grupos.map(g => {
          const totalBRL = g.itens.filter(i => i.moeda === 'BRL').reduce((a, i) => a + i.vnum, 0);
          return (
            <div key={g.mm} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: '#7a3d12', letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: 700 }}>{fmtMesAno(g.mm)}</span>
                {totalBRL > 0 && <span style={{ fontSize: 12, color: '#7a3d12', fontWeight: 700 }}>R$ {totalBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
              </div>
              {g.itens.map(linhaItem)}
            </div>
          );
        })}
        {semData.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>sem data</div>
            {semData.map(linhaItem)}
          </div>
        )}
      </>}
      {form && <CompraFeitaForm editing={form.editing} onClose={() => setForm(null)} />}
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

function CompraFeitaForm({ editing, onClose }) {
  const life = useLife();
  const [titulo, setTitulo] = useState(editing?.titulo || '');
  const [data, setData] = useState(editing?.data || '');
  const [moeda, setMoeda] = useState(editing?.moeda || 'BRL');
  const [valor, setValor] = useState(editing?.valor != null ? String(editing.valor) : '');
  const [categoria, setCategoria] = useState(editing?.categoria || '');
  const cats = [...new Set((life.comprasFeitas || []).map(c => c.categoria).filter(Boolean))];
  const podeSalvar = titulo.trim().length > 0;
  const salvar = () => {
    if (!podeSalvar) return;
    life.saveCompraFeita({ id: editing?.id, titulo: titulo.trim(), data: data || undefined, moeda, valor: valor ? Number(valor.replace(',', '.')) : undefined, categoria: categoria.trim() || undefined });
    onClose();
  };
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar' : 'Registrar'} compra</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>
        <label style={labelStyle}>O quê</label>
        <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="ex.: Tênis Asics Novablast" style={inputStyle} />
        <label style={labelStyle}>Quando (opcional)</label>
        <input type="date" value={data} onChange={e => setData(e.target.value)} style={inputStyle} />
        <label style={labelStyle}>Quanto (opcional)</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={moeda} onChange={e => setMoeda(e.target.value)} style={{ ...inputStyle, width: 92, flexShrink: 0 }}>
            {MOEDAS.map(m => <option key={m.id} value={m.id}>{m.simbolo}</option>)}
          </select>
          <input type="text" inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)} placeholder="ex.: 600" style={inputStyle} />
        </div>
        <label style={labelStyle}>Categoria (opcional)</label>
        <input list="cf-cats" value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="ex.: roupa, casa, maquiagem…" style={inputStyle} />
        <datalist id="cf-cats">{cats.map(c => <option key={c} value={c} />)}</datalist>
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          {editing && <button onClick={() => { life.deleteCompraFeita(editing.id); onClose(); }} style={{ padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apagar</button>}
          <button onClick={salvar} disabled={!podeSalvar} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: 'none', background: podeSalvar ? '#111' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: podeSalvar ? 'pointer' : 'default' }}>{editing ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  );
}

// ---- Card: Música (Spotify por mês) ----
const COR_MUSICA = '#1db954';
// Visão em gráfico: barras de minutos por mês + ranking de artistas/músicas do ano.
function MusicaGrafico({ meses, fmtMin, horas }) {
  const [sel, setSel] = useState(null);
  const cron = meses.slice().sort((a, b) => (a.mes || '').localeCompare(b.mes || ''));
  const maxMin = Math.max(1, ...cron.map(m => Number(m.minutos) || 0));
  const rank = (campo) => {
    const map = {};
    cron.forEach(m => { const v = (m[campo] || '').trim(); if (v) map[v] = (map[v] || 0) + 1; });
    return Object.entries(map).map(([nome, n]) => ({ nome, n })).sort((a, b) => b.n - a.n);
  };
  const artistas = rank('artista'), musicas = rank('musica');
  const maxN = Math.max(1, ...artistas.map(a => a.n), ...musicas.map(a => a.n));
  const ranking = (titulo, lista) => lista.length > 0 && (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: 11, color: COR_MUSICA, letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>{titulo}</div>
      {lista.map(item => (
        <div key={item.nome} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nome}</div>
            <div style={{ height: 6, background: COR_MUSICA + '22', borderRadius: 4, marginTop: 3 }}>
              <div style={{ width: (item.n / maxN * 100) + '%', height: '100%', background: COR_MUSICA, borderRadius: 4 }} />
            </div>
          </div>
          <span style={{ fontSize: 11.5, color: '#999', flexShrink: 0 }}>{item.n} {item.n > 1 ? 'meses' : 'mês'}</span>
        </div>
      ))}
    </div>
  );
  return (
    <div>
      <div style={{ fontSize: 11, color: COR_MUSICA, letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>minutos por mês</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 150 }}>
        {cron.map((m, i) => {
          const min = Number(m.minutos) || 0;
          const h = Math.max(2, Math.round((min / maxMin) * 116));
          const on = sel === i;
          return (
            <div key={m.id} onClick={() => setSel(on ? null : i)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', minWidth: 0 }}>
              <div style={{ fontSize: 9, color: '#777', height: 12, fontWeight: 700 }}>{on ? fmtMin(min) : ''}</div>
              <div style={{ width: '100%', maxWidth: 30, height: h, background: COR_MUSICA, borderRadius: '4px 4px 0 0', opacity: sel == null || on ? 1 : 0.4 }} />
              <div style={{ fontSize: 9, color: '#aaa', marginTop: 4 }}>{MESES[+(m.mes || '').slice(5, 7) - 1]?.slice(0, 3)}</div>
            </div>
          );
        })}
      </div>
      {sel != null && (
        <div style={{ fontSize: 12, color: '#777', marginTop: 8, textAlign: 'center' }}>
          {fmtMesAno(cron[sel].mes).replace(/^./, c => c.toUpperCase())}: {fmtMin(cron[sel].minutos)} min · ~{horas(cron[sel].minutos)}h
        </div>
      )}
      {ranking('artistas do ano', artistas)}
      {ranking('músicas do ano', musicas)}
    </div>
  );
}

function MusicaRetro({ onBack, isWide }) {
  const life = useLife();
  const [form, setForm] = useState(null);
  const [vis, setVis] = useState('lista');
  const [verAlbuns, setVerAlbuns] = useState(false);
  const todasMeses = life.musica || [];
  const { anos, anoSel, setAnoSel } = useAnoSel(todasMeses.map(m => m.mes));
  if (verAlbuns) return <AlbunsView onBack={() => setVerAlbuns(false)} isWide={isWide} />; // depois de todos os hooks
  const meses = todasMeses.filter(m => (m.mes || '').slice(0, 4) === anoSel).sort((a, b) => (b.mes || '').localeCompare(a.mes || ''));
  const totalMin = meses.reduce((a, m) => a + (Number(m.minutos) || 0), 0);
  const fmtMin = (n) => Number(n || 0).toLocaleString('pt-BR');
  const horas = (n) => Math.round((Number(n) || 0) / 60);
  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Retrospectiva</button>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: 36, height: 4, background: COR_MUSICA, borderRadius: 4, marginBottom: 12 }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Música</h2>
          <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>minutos, artistas e músicas do seu ano</p>
        </div>
        <button onClick={() => setForm({})} title="adicionar mês" style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>+</button>
      </div>

      <button onClick={() => setVerAlbuns(true)} style={{ width: '100%', marginBottom: 16, padding: '11px 0', borderRadius: 11, border: '1px solid ' + COR_MUSICA + '55', background: COR_MUSICA + '10', color: '#0a7d36', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>💿 Álbuns marcantes ›</button>

      {todasMeses.length === 0 ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Nada por aqui ainda. Toque no + e cadastre o print do Spotify do mês (minutos, top artista e top música).</p>
      ) : <>
        <AnoChips anos={anos} anoSel={anoSel} setAnoSel={setAnoSel} cor={COR_MUSICA} />
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: '#111' }}>{fmtMin(totalMin)}</span>
          <span style={{ fontSize: 13, color: '#999' }}> minutos em {anoSel} · ~{horas(totalMin)}h</span>
        </div>
        {meses.length === 0 && <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '10px 0' }}>Nada registrado em {anoSel}.</p>}
        {meses.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {[['lista', 'Lista'], ['grafico', 'Gráfico']].map(([v, label]) => (
              <button key={v} onClick={() => setVis(v)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: '1px solid ' + (vis === v ? COR_MUSICA : '#e2e2e2'),
                background: vis === v ? COR_MUSICA + '1c' : '#fff', color: vis === v ? '#0a7d36' : '#888',
              }}>{label}</button>
            ))}
          </div>
        )}
        {meses.length > 0 && vis === 'grafico' && <MusicaGrafico meses={meses} fmtMin={fmtMin} horas={horas} />}
        {vis === 'lista' && meses.map(m => (
          <div key={m.id} onClick={() => setForm({ editing: m })} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 16px', marginBottom: 10, cursor: 'pointer' }}>
            <div style={{ fontSize: 11, color: COR_MUSICA, letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>{fmtMesAno(m.mes)}</div>
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#111' }}>{fmtMin(m.minutos)}</span>
              <span style={{ fontSize: 12.5, color: '#999' }}> min · ~{horas(m.minutos)}h</span>
            </div>
            <div style={{ fontSize: 13.5, color: '#333' }}>🎤 {m.artista || '—'}</div>
            <div style={{ fontSize: 13.5, color: '#333', marginTop: 2 }}>🎵 {m.musica || '—'}</div>
          </div>
        ))}
      </>}

      {form && <MusicaForm editing={form.editing} onClose={() => setForm(null)} />}
    </div>
  );
}

// ---- Card: Leituras (livros por ano · páginas · países/idiomas · gênero/tema) ----
const COR_LIVROS = '#7a5c9e';
const LIVRO_FLAG = {
  'Brasil': '🇧🇷', 'Estados Unidos': '🇺🇸', 'Reino Unido': '🇬🇧', 'Inglaterra': '🇬🇧', 'Irlanda': '🇮🇪',
  'França': '🇫🇷', 'Itália': '🇮🇹', 'Espanha': '🇪🇸', 'Portugal': '🇵🇹', 'Alemanha': '🇩🇪', 'Rússia': '🇷🇺',
  'Japão': '🇯🇵', 'Coreia do Sul': '🇰🇷', 'Hungria': '🇭🇺', 'Tchéquia': '🇨🇿', 'Polônia': '🇵🇱',
  'Bielorrússia': '🇧🇾', 'Grécia': '🇬🇷', 'Suíça': '🇨🇭', 'Canadá': '🇨🇦', 'México': '🇲🇽', 'Argentina': '🇦🇷',
  'Chile': '🇨🇱', 'Colômbia': '🇨🇴', 'Peru': '🇵🇪', 'Bolívia': '🇧🇴', 'Paquistão': '🇵🇰', 'Israel': '🇮🇱', 'Austrália': '🇦🇺',
};
// Trechos favoritos: frases marcantes de livros, agrupadas por livro.
function TrechosView({ onBack, isWide }) {
  const life = useLife();
  const trechos = life.trechos || [];
  const [form, setForm] = useState(null);
  const cor = COR_LIVROS;
  const grupos = {};
  [...trechos].sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0)).forEach(t => { const k = t.livro || 'sem livro'; (grupos[k] = grupos[k] || []).push(t); });
  const livros = Object.keys(grupos);
  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Leituras</button>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: 36, height: 4, background: cor, borderRadius: 4, marginBottom: 12 }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Trechos favoritos</h2>
          <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>frases que ficaram com você</p>
        </div>
        <button onClick={() => setForm({})} title="adicionar trecho" style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>+</button>
      </div>
      {trechos.length === 0 ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Nenhum trecho ainda. Toque no + pra guardar uma frase marcante (com o livro de onde veio).</p>
      ) : livros.map(lv => (
        <div key={lv} style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#222', fontWeight: 700, marginBottom: 1 }}>{lv}</div>
          {grupos[lv][0].autor && <div style={{ fontSize: 11.5, color: '#999', marginBottom: 8 }}>{grupos[lv][0].autor}</div>}
          {grupos[lv].map(t => (
            <div key={t.id} onClick={() => setForm({ editing: t })} style={{ borderLeft: '3px solid ' + cor + '55', padding: '2px 0 2px 12px', margin: '0 0 10px', cursor: 'pointer' }}>
              <div style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 14, color: '#333', lineHeight: 1.5 }}>“{t.texto}”</div>
              {t.pagina && <div style={{ fontSize: 11, color: '#bbb', marginTop: 3 }}>p. {t.pagina}</div>}
            </div>
          ))}
        </div>
      ))}
      {form && <TrechoForm editing={form.editing} onClose={() => setForm(null)} />}
    </div>
  );
}
function TrechoForm({ editing, onClose }) {
  const life = useLife();
  const [texto, setTexto] = useState(editing?.texto || '');
  const [livro, setLivro] = useState(editing?.livro || '');
  const [autor, setAutor] = useState(editing?.autor || '');
  const [pagina, setPagina] = useState(editing?.pagina || '');
  const livrosSug = [...new Set((life.leituras || []).map(l => l.titulo).filter(Boolean))];
  const autorDe = (titulo) => (life.leituras || []).find(l => l.titulo === titulo)?.autor || '';
  const podeSalvar = texto.trim() && livro.trim();
  const salvar = () => { if (!podeSalvar) return; life.saveTrecho({ id: editing?.id, texto: texto.trim(), livro: livro.trim(), autor: autor.trim() || undefined, pagina: String(pagina).trim() || undefined }); onClose(); };
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar' : 'Novo'} trecho</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>
        <label style={labelStyle}>Frase</label>
        <textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder="a frase que marcou" style={{ ...inputStyle, minHeight: 84, resize: 'vertical' }} />
        <label style={labelStyle}>Livro</label>
        <input list="trecho-livros" value={livro} onChange={e => { const v = e.target.value; setLivro(v); if (!autor && autorDe(v)) setAutor(autorDe(v)); }} placeholder="de qual livro?" style={inputStyle} />
        <datalist id="trecho-livros">{livrosSug.map(t => <option key={t} value={t} />)}</datalist>
        <label style={labelStyle}>Autor (opcional)</label>
        <input value={autor} onChange={e => setAutor(e.target.value)} placeholder="ex.: Clarice Lispector" style={inputStyle} />
        <label style={labelStyle}>Página (opcional)</label>
        <input type="text" inputMode="numeric" value={pagina} onChange={e => setPagina(e.target.value)} placeholder="ex.: 42" style={inputStyle} />
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          {editing && <button onClick={() => { life.deleteTrecho(editing.id); onClose(); }} style={{ padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apagar</button>}
          <button onClick={salvar} disabled={!podeSalvar} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: 'none', background: podeSalvar ? '#111' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: podeSalvar ? 'pointer' : 'default' }}>{editing ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  );
}

function LeiturasRetro({ onBack, isWide }) {
  const life = useLife();
  const lidos = (life.leituras || []).filter(l => l.lido && l.lidoEm && l.lidoEm.length);
  const anosNum = [...new Set(lidos.flatMap(l => l.lidoEm.filter(a => typeof a === 'number')))].sort((a, b) => b - a);
  const temAntes = lidos.some(l => l.lidoEm.includes('antes'));
  const opcoes = [...anosNum.map(String), ...(temAntes ? ['antes'] : [])];
  const anoAtual = String(new Date().getFullYear());
  const [selRaw, setSel] = useState(null);
  const [verTrechos, setVerTrechos] = useState(false);
  if (verTrechos) return <TrechosView onBack={() => setVerTrechos(false)} isWide={isWide} />;
  const sel = (selRaw && opcoes.includes(selRaw)) ? selRaw : (opcoes.includes(anoAtual) ? anoAtual : opcoes[0]);
  const doAno = sel === 'antes' ? lidos.filter(l => l.lidoEm.includes('antes')) : lidos.filter(l => l.lidoEm.includes(Number(sel)));
  const totalPaginas = doAno.reduce((s, l) => s + (Number(l.paginas) || 0), 0);
  const fmtN = (n) => Number(n || 0).toLocaleString('pt-BR');
  const porAno = {}; lidos.forEach(l => l.lidoEm.forEach(a => { if (typeof a === 'number') porAno[a] = (porAno[a] || 0) + 1; }));
  const anosCron = Object.keys(porAno).map(Number).sort((a, b) => a - b);
  const maxAno = Math.max(1, ...Object.values(porAno));
  const rank = (vals) => { const m = {}; vals.forEach(v => { if (v) m[v] = (m[v] || 0) + 1; }); return Object.entries(m).map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n); };
  const paises = rank(doAno.map(l => l.pais)), idiomas = rank(doAno.map(l => l.idioma)), generos = rank(doAno.map(l => l.tipo)), temas = rank(doAno.flatMap(l => l.temas || []));
  const maxRank = Math.max(1, ...paises.map(x => x.n), ...temas.map(x => x.n), ...generos.map(x => x.n));

  const ranking = (titulo, lista, fmtK = (k) => k, cap = false, limite = 6) => lista.length > 0 && (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: 11, color: COR_LIVROS, letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>{titulo}</div>
      {lista.slice(0, limite).map(item => (
        <div key={item.k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: cap ? 'capitalize' : 'none' }}>{fmtK(item.k)}</div>
            <div style={{ height: 6, background: COR_LIVROS + '22', borderRadius: 4, marginTop: 3 }}>
              <div style={{ width: (item.n / maxRank * 100) + '%', height: '100%', background: COR_LIVROS, borderRadius: 4 }} />
            </div>
          </div>
          <span style={{ fontSize: 11.5, color: '#999', flexShrink: 0 }}>{item.n}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Retrospectiva</button>
      <div style={{ width: 36, height: 4, background: COR_LIVROS, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Leituras</h2>
      <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 14px' }}>os livros que você leu, por ano</p>
      <button onClick={() => setVerTrechos(true)} style={{ width: '100%', marginBottom: 16, padding: '11px 0', borderRadius: 11, border: '1px solid ' + COR_LIVROS + '55', background: COR_LIVROS + '10', color: '#5d3f7e', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>✎ Trechos favoritos ›</button>

      {lidos.length === 0 ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Nenhum livro com ano de leitura ainda. Marque "lido em ANO" nos livros (Explorar › Próximas leituras) que eles aparecem aqui.</p>
      ) : <>
        {anosCron.length > 1 && <>
          <div style={{ fontSize: 11, color: COR_LIVROS, letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>livros por ano</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 130, marginBottom: 18 }}>
            {anosCron.map(a => {
              const n = porAno[a], h = Math.max(3, Math.round((n / maxAno) * 100));
              return (
                <div key={a} onClick={() => setSel(String(a))} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: '#777', height: 13, fontWeight: 700 }}>{n}</div>
                  <div style={{ width: '100%', maxWidth: 34, height: h, background: COR_LIVROS, borderRadius: '4px 4px 0 0', opacity: String(a) === sel ? 1 : 0.45 }} />
                  <div style={{ fontSize: 9.5, color: '#aaa', marginTop: 4 }}>{a}</div>
                </div>
              );
            })}
          </div>
        </>}

        {opcoes.length > 1 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
            {opcoes.map(o => (
              <button key={o} onClick={() => setSel(o)} style={{
                whiteSpace: 'nowrap', padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                border: '1px solid ' + (sel === o ? COR_LIVROS : '#e2e2e2'), background: sel === o ? COR_LIVROS + '1c' : '#fff', color: sel === o ? '#4a3470' : '#999',
              }}>{o === 'antes' ? 'antes de 2013' : o}</button>
            ))}
          </div>
        )}
        <div style={{ marginBottom: 4 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: '#111' }}>{doAno.length}</span>
          <span style={{ fontSize: 13, color: '#999' }}> {doAno.length === 1 ? 'livro' : 'livros'} {sel === 'antes' ? (doAno.length === 1 ? 'lido' : 'lidos') + ' antes de 2013' : 'em ' + sel} · {fmtN(totalPaginas)} páginas</span>
        </div>

        {ranking('países', paises, (k) => `${LIVRO_FLAG[k] || '📖'}  ${k}`)}
        {ranking('idiomas', idiomas)}
        {ranking('gêneros', generos, (k) => k, true)}
        {ranking('temas', temas, (k) => k, true)}

        <div style={{ fontSize: 11, color: COR_LIVROS, letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: 700, margin: '22px 0 8px' }}>os livros</div>
        {doAno.slice().sort((a, b) => (a.titulo || '').localeCompare(b.titulo || '')).map(l => (
          <div key={l.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '10px 13px', marginBottom: 6 }}>
            <div style={{ fontSize: 14, color: '#222', fontWeight: 600 }}>{l.titulo}{(l.lidoEm || []).length > 1 ? <span style={{ fontSize: 11, color: COR_LIVROS, fontWeight: 700 }}>  (releitura)</span> : null}</div>
            <div style={{ fontSize: 11.5, color: '#999', marginTop: 2 }}>{[l.autor, l.pais, l.paginas ? l.paginas + ' p.' : null].filter(Boolean).join(' · ')}</div>
          </div>
        ))}
      </>}
    </div>
  );
}

function MusicaForm({ editing, onClose }) {
  const life = useLife();
  const [mes, setMes] = useState(editing?.mes || '');
  const [minutos, setMinutos] = useState(editing?.minutos != null ? String(editing.minutos) : '');
  const [artista, setArtista] = useState(editing?.artista || '');
  const [musica, setMusica] = useState(editing?.musica || '');
  const podeSalvar = !!mes;
  const salvar = () => {
    if (!podeSalvar) return;
    life.saveMusica({ id: editing?.id, mes, minutos: minutos ? Number(minutos.replace(/\D/g, '')) : undefined, artista: artista.trim() || undefined, musica: musica.trim() || undefined });
    onClose();
  };
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar' : 'Novo'} mês</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>
        <label style={labelStyle}>Mês</label>
        <input type="month" value={mes} onChange={e => setMes(e.target.value)} style={inputStyle} />
        <label style={labelStyle}>Minutos ouvidos</label>
        <input type="text" inputMode="numeric" value={minutos} onChange={e => setMinutos(e.target.value)} placeholder="ex.: 1958" style={inputStyle} />
        <label style={labelStyle}>Top artista</label>
        <input value={artista} onChange={e => setArtista(e.target.value)} placeholder="ex.: Taylor Swift" style={inputStyle} />
        <label style={labelStyle}>Top música</label>
        <input value={musica} onChange={e => setMusica(e.target.value)} placeholder="ex.: Reliquia" style={inputStyle} />
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          {editing && <button onClick={() => { life.deleteMusica(editing.id); onClose(); }} style={{ padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apagar</button>}
          <button onClick={salvar} disabled={!podeSalvar} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: 'none', background: podeSalvar ? '#111' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: podeSalvar ? 'pointer' : 'default' }}>{editing ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  );
}

// Álbuns marcantes: coleção de discos (complementa a Música do Spotify). Por ano ou artista.
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
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Música</button>
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

function CorridasRetro({ onBack, isWide }) {
  const cal = useCalendar();
  const hoje = new Date();
  const hk = `${hoje.getFullYear()}-${pad2(hoje.getMonth() + 1)}-${pad2(hoje.getDate())}`;
  const todasProvas = (cal.data.exercicios || [])
    .filter(x => x.subtipo === 'corrida_prova' || x.subtipo === 'corrida')
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

  const comTempo = provas.filter(p => p.tempo);
  const totalKm = Math.round(provas.reduce((a, p) => a + p.km, 0) * 10) / 10;
  const melhorPace = comTempo.map(p => p.pReal).filter(Boolean).length ? Math.min(...comTempo.map(p => p.pReal).filter(Boolean)) : null;
  const evo = comTempo.filter(p => p.pReal).slice().sort((a, b) => (a.data || '').localeCompare(b.data || '')).map(p => ({ pace: p.pReal, data: p.data, nome: p.nome }));

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Retrospectiva</button>
      <div style={{ width: 36, height: 4, background: COR_CORRIDA, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Corridas</h2>
      <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>suas provas: meta × executado e evolução do pace</p>

      {todasProvas.length === 0 ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Nenhuma prova ainda. Marque uma "Corrida prova" no Calendário com distância, tempo real e meta de tempo.</p>
      ) : <>
        <AnoChips anos={anos} anoSel={anoSel} setAnoSel={setAnoSel} cor={COR_CORRIDA} />
        {provas.length === 0 && <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '10px 0' }}>Nenhuma prova em {anoSel}.</p>}
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 18 }}>
          <div><span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#111' }}>{provas.length}</span><span style={{ fontSize: 12.5, color: '#999' }}> {provas.length === 1 ? 'prova' : 'provas'}</span></div>
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
            </div>
          );
        })}
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

// ---- Card: Gastos (por categoria; Coisas reusa a retrospectiva de Compras) ----
const COR_GASTOS = '#6b7a99';
const GASTO_CATS = ['Fixos', 'Mercado', 'Uber', 'Trabalho', 'Mãe', 'Saúde', 'Viagem', 'Coisas', 'Roupa', 'Skin care', 'Bobeira', 'Rolês', 'Presentes'];
const fmtBRLr = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const GASTO_CORES = ['#ff8a3d', '#5b8def', '#2bb673', '#c77dff', '#ef6c4d', '#26c6da', '#f0a35e', '#c2548f', '#6b7a99', '#d4a72c', '#e0729b', '#3fb6a8', '#8a8f98'];
const catCor = (c, fallback = 0) => { const i = GASTO_CATS.indexOf(c); return GASTO_CORES[(i >= 0 ? i : fallback) % GASTO_CORES.length]; };
// Gráfico de linha por item (bom p/ Fixos): cada item uma linha ao longo dos meses.
// Tocar num item na legenda isola a linha (auto-escala) e mostra os valores por mês.
function LinhasGastoChart({ itens, mesesAsc }) {
  const [sel, setSel] = useState(null);
  const byNomeMes = {};
  itens.forEach(i => { (byNomeMes[i.nome] = byNomeMes[i.nome] || {}); byNomeMes[i.nome][i.mes] = (byNomeMes[i.nome][i.mes] || 0) + (Number(i.valor) || 0); });
  const totalDe = (n) => Object.values(byNomeMes[n]).reduce((a, b) => a + b, 0);
  const nomes = Object.keys(byNomeMes).sort((a, b) => totalDe(b) - totalDe(a));
  const corDe = (n) => GASTO_CORES[nomes.indexOf(n) % GASTO_CORES.length];
  const shown = sel ? [sel] : nomes;
  const W = 320, H = 150, padL = 8, padR = 8, padT = 12, padB = 22;
  const x = (i) => mesesAsc.length <= 1 ? W / 2 : padL + i * (W - padL - padR) / (mesesAsc.length - 1);
  let max = 0; shown.forEach(n => mesesAsc.forEach(mm => { max = Math.max(max, byNomeMes[n][mm] || 0); }));
  max = max || 1;
  const y = (v) => (H - padB) - (v / max) * (H - padT - padB);
  const pathOf = (n) => mesesAsc.map((mm, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(byNomeMes[n][mm] || 0).toFixed(1)}`).join(' ');
  const mAbbr = (mm) => MESES[+mm.slice(5, 7) - 1].slice(0, 3);
  const fmtR = (v) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
      <div style={{ fontSize: 11, color: '#4a5468', letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>evolução por item{sel ? ' · ' + sel : ''} <span style={{ color: '#bbb', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· toque pra isolar</span></div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {shown.map(n => (
          <g key={n}>
            <path d={pathOf(n)} fill="none" stroke={corDe(n)} strokeWidth={sel ? 2.2 : 1.6} strokeLinejoin="round" strokeLinecap="round" />
            {mesesAsc.map((mm, i) => byNomeMes[n][mm] != null ? <circle key={i} cx={x(i)} cy={y(byNomeMes[n][mm] || 0)} r={sel ? 3 : 2.2} fill={corDe(n)} /> : null)}
          </g>
        ))}
        {mesesAsc.map((mm, i) => <text key={mm} x={x(i)} y={H - 6} textAnchor="middle" fontSize="8" fill="#bbb">{mAbbr(mm)}</text>)}
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {nomes.map(n => {
          const ativo = sel === n;
          return (
            <button key={n} onClick={() => setSel(ativo ? null : n)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 14, fontSize: 11.5, cursor: 'pointer', border: '1px solid ' + (ativo ? corDe(n) : '#eee'), background: ativo ? corDe(n) + '1c' : '#fafafa', color: '#444', fontWeight: ativo ? 700 : 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: corDe(n), flexShrink: 0 }} />{n}
            </button>
          );
        })}
      </div>
      {sel && <div style={{ marginTop: 8, fontSize: 12, color: '#666', lineHeight: 1.6 }}>{mesesAsc.filter(mm => byNomeMes[sel][mm] != null).map(mm => `${mAbbr(mm)} ${fmtR(byNomeMes[sel][mm])}`).join(' · ')}</div>}
    </div>
  );
}

// Tabela de evolução: itens nas linhas, meses nas colunas (mais recente à esquerda).
function GastoTabela({ itens, mesesAsc, cor, onEdit }) {
  const mesesDesc = [...mesesAsc].reverse(); // mais recente primeiro (coluna da esquerda)
  const byNomeMes = {};
  itens.forEach(i => { (byNomeMes[i.nome] = byNomeMes[i.nome] || {}); (byNomeMes[i.nome][i.mes] = byNomeMes[i.nome][i.mes] || []).push(i); });
  const valOf = (n, mm) => (byNomeMes[n][mm] || []).reduce((a, i) => a + (Number(i.valor) || 0), 0);
  const totalDe = (n) => mesesDesc.reduce((a, mm) => a + valOf(n, mm), 0);
  const nomes = Object.keys(byNomeMes).sort((a, b) => totalDe(b) - totalDe(a));
  const totalMes = (mm) => nomes.reduce((a, n) => a + valOf(n, mm), 0);
  const totalGeral = nomes.reduce((a, n) => a + totalDe(n), 0);
  const fmt = (v) => v ? Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '·';
  const mAbbr = (mm) => MESES[+mm.slice(5, 7) - 1].slice(0, 3);
  const stickyL = { position: 'sticky', left: 0, background: '#fff', zIndex: 1 };
  const th = { padding: '7px 10px', fontSize: 10.5, color: '#888', textTransform: 'uppercase', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', borderBottom: '2px solid #eee' };
  const td = { padding: '7px 10px', fontSize: 12.5, color: '#333', textAlign: 'right', whiteSpace: 'nowrap', borderBottom: '1px solid #f3f3f3' };
  return (
    <div style={{ overflowX: 'auto', marginBottom: 18, border: '1px solid #eee', borderRadius: 12 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ ...th, ...stickyL, textAlign: 'left' }}>item</th>
            {mesesDesc.map(mm => <th key={mm} style={th}>{mAbbr(mm)}</th>)}
            <th style={{ ...th, color: cor, borderLeft: '2px solid #eee' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {nomes.map(n => (
            <tr key={n}>
              <td style={{ ...td, ...stickyL, textAlign: 'left', fontWeight: 600, color: '#222' }}>{n}</td>
              {mesesDesc.map(mm => {
                const arr = byNomeMes[n][mm] || [];
                const v = valOf(n, mm);
                return <td key={mm} onClick={arr.length ? () => onEdit(arr[0]) : undefined} style={{ ...td, cursor: arr.length ? 'pointer' : 'default', color: v ? '#333' : '#ccc' }}>{fmt(v)}</td>;
              })}
              <td style={{ ...td, fontWeight: 700, color: '#111', borderLeft: '2px solid #eee' }}>{fmt(totalDe(n))}</td>
            </tr>
          ))}
          <tr>
            <td style={{ ...td, ...stickyL, textAlign: 'left', fontWeight: 700, color: cor, borderTop: '2px solid #eee' }}>Total</td>
            {mesesDesc.map(mm => <td key={mm} style={{ ...td, fontWeight: 700, color: cor, borderTop: '2px solid #eee' }}>{fmt(totalMes(mm))}</td>)}
            <td style={{ ...td, fontWeight: 700, color: cor, borderTop: '2px solid #eee', borderLeft: '2px solid #eee' }}>{fmt(totalGeral)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function GastosRetro({ onBack, isWide, catInicial }) {
  const life = useLife();
  const [catSel, setCatSel] = useState(catInicial || null);
  const [form, setForm] = useState(null); // { editing? } — item de gasto
  const [tipoChart, setTipoChart] = useState(null); // null = automático; 'barras' | 'linhas'
  useEffect(() => { setTipoChart(null); }, [catSel]); // reset ao trocar de categoria
  const gastos = life.gastos || [];
  const { anos, anoSel, setAnoSel } = useAnoSel(gastos.map(g => g.mes));
  const doAno = gastos.filter(g => (g.mes || '').slice(0, 4) === anoSel);
  const catTotals = {};
  doAno.forEach(g => (g.itens || []).forEach(it => { catTotals[it.categoria] = (catTotals[it.categoria] || 0) + (Number(it.valor) || 0); }));
  const cats = [...GASTO_CATS.filter(c => catTotals[c] != null), ...Object.keys(catTotals).filter(c => !GASTO_CATS.includes(c))];
  const totalAno = cats.reduce((a, c) => a + (catTotals[c] || 0), 0);

  // "Coisas" é uma categoria NORMAL (gráficos + tabela); embaixo dela, a lista das
  // compras marcadas à mão por mês (ComprasFeitasLista). A durabilidade ("Coisas
  // caras": AirPod/iPhone/…) virou um card próprio no hub da Retrospectiva.

  // Posso gastar e VR ficam DENTRO de Gastos (cards próprios), mas NÃO entram na
  // somatória das categorias — são só organização/controle do mês.
  if (catSel === '__posso') return <PossoGastarRetro onBack={() => setCatSel(null)} isWide={isWide} backLabel="Gastos" />;
  if (catSel === '__vr') return <VRRetro onBack={() => setCatSel(null)} isWide={isWide} />;

  if (catSel) {
    // itens itemizados desta categoria no ano (quebra enviada pela Mari)
    const itens = (life.gastosItens || []).filter(x => x.categoria === catSel && (x.mes || '').slice(0, 4) === anoSel);
    const temItens = itens.length > 0;
    // fallback: total mensal vindo da Vida Financeira (categorias ainda não detalhadas)
    const linhas = doAno.map(g => ({ mes: g.mes, valor: Number((g.itens || []).find(i => i.categoria === catSel)?.valor) || 0 }))
      .filter(l => l.valor > 0).sort((a, b) => (b.mes || '').localeCompare(a.mes || ''));
    const maxMes = Math.max(...linhas.map(l => l.valor), 1);
    const cor = catCor(catSel);
    // agrupa itens por mês (mais recente primeiro)
    const mesesItens = [...new Set(itens.map(i => i.mes))].sort().reverse();
    const totalItens = itens.reduce((a, i) => a + (Number(i.valor) || 0), 0);
    const totalCat = temItens ? totalItens : linhas.reduce((a, l) => a + l.valor, 0);
    // dados do gráfico (design de Compras): meses cronológicos, faixas = itens
    const mesesChart = [...mesesItens].reverse().map(mm => {
      const arr = itens.filter(i => i.mes === mm).map(i => ({ titulo: i.nome, vnum: Number(i.valor) || 0 })).sort((a, b) => b.vnum - a.vnum);
      return { mm, label: MESES[+mm.slice(5, 7) - 1].slice(0, 3), itens: arr, total: arr.reduce((a, i) => a + i.vnum, 0) };
    }).filter(m => m.total > 0);
    const mesesAsc = [...mesesItens].reverse();
    // se 3+ itens se repetem em vários meses (ex.: Fixos) → gráfico de linha por padrão
    const recCount = {}; itens.forEach(i => { (recCount[i.nome] = recCount[i.nome] || new Set()).add(i.mes); });
    const recorrentes = Object.values(recCount).filter(s => s.size >= 2).length;
    const chartTipo = tipoChart || (recorrentes >= 3 ? 'linhas' : 'barras');
    return (
      <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
        <button onClick={() => setCatSel(null)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Gastos</button>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ width: 36, height: 4, background: cor, borderRadius: 4, marginBottom: 12 }} />
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>{catSel}</h2>
            <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>{fmtBRLr(totalCat)} em {anoSel}{temItens ? ` · ${itens.length} ${itens.length === 1 ? 'compra' : 'compras'}` : ''}</p>
          </div>
          <button onClick={() => setForm({})} title="adicionar gasto" style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>+</button>
        </div>

        {temItens ? <>
          {mesesChart.length > 0 && <>
            {mesesAsc.length > 1 && <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {[['barras', 'barras'], ['linhas', 'linhas']].map(([id, lbl]) => (
                <button key={id} onClick={() => setTipoChart(id)} style={{ padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid ' + (chartTipo === id ? cor : '#e2e2e2'), background: chartTipo === id ? cor + '1c' : '#fff', color: chartTipo === id ? '#333' : '#999' }}>{lbl}</button>
              ))}
            </div>}
            {chartTipo === 'linhas' ? <LinhasGastoChart itens={itens} mesesAsc={mesesAsc} /> : <ComprasChart meses={mesesChart} />}
          </>}
          <GastoTabela itens={itens} mesesAsc={mesesAsc} cor={cor} onEdit={(it) => setForm({ editing: it })} />
        </> : linhas.length === 0 ? (
          <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '10px 0' }}>Sem gastos em {catSel} em {anoSel}. Toque no + para detalhar.</p>
        ) : <>
          <p style={{ fontSize: 11.5, color: '#bbb', margin: '0 0 10px' }}>total por mês (ainda não detalhado — toque no + para listar os itens)</p>
          {linhas.map(l => (
            <div key={l.mes} style={{ marginBottom: 9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                <span style={{ color: '#555', textTransform: 'capitalize' }}>{fmtMesAno(l.mes)}</span>
                <span style={{ color: '#222', fontWeight: 600 }}>{fmtBRLr(l.valor)}</span>
              </div>
              <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4 }}>
                <div style={{ width: (l.valor / maxMes * 100) + '%', height: '100%', background: COR_GASTOS, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </>}

        {catSel === 'Coisas' && <ComprasFeitasLista ano={anoSel} />}

        {form && <GastoItemForm editing={form.editing} categoria={catSel} onClose={() => setForm(null)} />}
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Retrospectiva</button>
      <div style={{ width: 36, height: 4, background: COR_GASTOS, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Gastos</h2>
      <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>pra onde foi o dinheiro, por categoria</p>

      {gastos.length === 0 ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Sem gastos registrados ainda (eles vêm da Vida Financeira → Gastos).</p>
      ) : <>
        <AnoChips anos={anos} anoSel={anoSel} setAnoSel={setAnoSel} cor={COR_GASTOS} />
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: '#111' }}>{fmtBRLr(totalAno)}</span>
          <span style={{ fontSize: 12.5, color: '#999' }}> em {anoSel}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isWide ? 'repeat(auto-fill, minmax(160px, 1fr))' : '1fr 1fr', gap: 12 }}>
          {cats.map((c, i) => {
            const cor = catCor(c, i);
            return (
              <button key={c} onClick={() => setCatSel(c)} style={{ background: cor + '12', border: '1px solid ' + cor + '33', borderRadius: 16, padding: '16px 14px', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: 22, height: 4, background: cor, borderRadius: 4, marginBottom: 10 }} />
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#222', fontWeight: 700, lineHeight: 1.2 }}>{c}</div>
                <div style={{ fontSize: 13, color: '#444', marginTop: 5, fontWeight: 700 }}>{fmtBRLr(catTotals[c])}</div>
                <div style={{ fontSize: 10.5, color: '#aaa', marginTop: 2 }}>{totalAno ? (catTotals[c] / totalAno * 100).toFixed(0) + '% do ano' : ''}</div>
              </button>
            );
          })}
        </div>

        {/* Posso gastar e VR: controle do mês, FORA do total acima */}
        <p style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, margin: '24px 0 8px' }}>controle do mês · fora do total</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[['__posso', 'Posso gastar', 'quanto ainda dá pra gastar'], ['__vr', 'VR', 'histórico por ciclo e por dia']].map(([id, label, desc]) => (
            <button key={id} onClick={() => setCatSel(id)} style={{ background: '#b06d1e10', border: '1px solid #b06d1e33', borderRadius: 16, padding: '16px 14px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 22, height: 4, background: '#b06d1e', borderRadius: 4, marginBottom: 10 }} />
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#222', fontWeight: 700, lineHeight: 1.2 }}>{label}</div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{desc}</div>
            </button>
          ))}
        </div>
      </>}
    </div>
  );
}

// VR (retrospectiva): histórico do vale-refeição por ciclo 27→26 e, dentro de cada
// um, os gastos por dia. Fica dentro de Gastos, fora da somatória das categorias.
function VRRetro({ onBack, isWide }) {
  const life = useLife();
  const ciclos = life.vr?.ciclos || {};
  const keys = Object.keys(ciclos).sort().reverse();
  const [aberto, setAberto] = useState(keys[0] || null);
  const cor = '#b06d1e';
  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; Gastos</button>
      <div style={{ width: 36, height: 4, background: cor, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>VR</h2>
      <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>histórico do vale-refeição · ciclo 27→26</p>
      {!keys.length ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Ainda sem VR. Lance no card “VR do mês” no fim da Tela Hoje.</p>
      ) : keys.map(ck => {
        const c = ciclos[ck];
        const gastos = c.gastos || [];
        const gasto = gastos.reduce((s, g) => s + (Number(g.valor) || 0), 0);
        const total = Number(c.total) || 0;
        const sobrou = total - gasto;
        const open = aberto === ck;
        const porDia = {};
        gastos.forEach(g => { (porDia[g.data] = porDia[g.data] || []).push(g); });
        const dias = Object.keys(porDia).sort().reverse();
        return (
          <div key={ck} style={{ border: '1px solid #eee', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
            <div onClick={() => setAberto(open ? null : ck)} style={{ padding: '11px 14px', cursor: 'pointer', background: '#fafafa' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#222' }}>{open ? '▾' : '▸'} {cicloLabel(ck)}</div>
              <div style={{ fontSize: 11.5, color: '#999', marginTop: 2 }}>gastou <b style={{ color: '#555' }}>{fmtBRLr(gasto)}</b> de {fmtBRLr(total)} · sobrou {fmtBRLr(sobrou)}</div>
            </div>
            {open && (
              <div style={{ padding: '4px 14px 12px' }}>
                {dias.length === 0 ? <p style={{ fontSize: 12.5, color: '#bbb', fontStyle: 'italic', margin: '6px 0' }}>Nenhum gasto neste ciclo.</p> :
                  dias.map(dia => {
                    const arr = porDia[dia];
                    const totDia = arr.reduce((s, g) => s + (Number(g.valor) || 0), 0);
                    return (
                      <div key={dia} style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', fontWeight: 700, borderBottom: '1px solid #f3f3f3', paddingBottom: 2 }}>
                          <span>{dia.slice(8, 10)}/{dia.slice(5, 7)}</span><span>{fmtBRLr(totDia)}</span>
                        </div>
                        {arr.map(g => (
                          <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '4px 0 4px 12px', fontSize: 12.5, color: '#666' }}>
                            <span style={{ color: '#bbb' }}>· {g.nota || 'gasto'}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{fmtBRLr(g.valor)}<button onClick={() => life.deleteVrGasto(ck, g.id)} style={{ border: 'none', background: 'none', color: '#ccc', fontSize: 15, cursor: 'pointer', lineHeight: 1 }}>×</button></span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Posso gastar (retrospectiva): quanto ainda dá pra gastar no ciclo atual (Total e
// Mercado, independentes) + histórico dos ciclos anteriores. Ciclo 27→26.
function PossoGastarRetro({ onBack, isWide, backLabel = 'Retrospectiva' }) {
  const life = useLife();
  const ciclos = life.possoGastar?.ciclos || {};
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const { cycleKey } = cicloDia27(hoje);
  const keys = Object.keys(ciclos).sort().reverse();
  const cor = '#b06d1e';
  const buckets = [['total', 'Total'], ['mercado', 'Mercado']];
  const resumo = (b) => { const bb = b || {}; const g = (bb.gastos || []).reduce((s, x) => s + (Number(x.valor) || 0), 0); const bud = Number(bb.budget) || 0; return { budget: bud, gasto: g, resta: bud - g }; };
  const temAlgum = keys.some(k => resumo(ciclos[k].total).budget > 0 || resumo(ciclos[k].mercado).budget > 0 || (ciclos[k].total?.gastos || []).length || (ciclos[k].mercado?.gastos || []).length);
  const linhaBuckets = (c, big) => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: big ? 10 : 6 }}>
      {buckets.map(([bk, lbl]) => { const r = resumo((c || {})[bk]); if (r.budget <= 0 && r.gasto <= 0) return null; return (
        <div key={bk} style={{ flex: '1 1 40%', minWidth: 130 }}>
          <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>{lbl}</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: big ? 25 : 18, fontWeight: 700, color: r.resta < 0 ? '#c0392b' : cor }}>{fmtBRLr(r.resta)}</div>
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>de {fmtBRLr(r.budget)} · gastou {fmtBRLr(r.gasto)}</div>
        </div>
      ); })}
    </div>
  );
  const anteriores = keys.filter(k => k !== cycleKey);
  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0 }}>&larr; {backLabel}</button>
      <div style={{ width: 36, height: 4, background: cor, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 4px' }}>Posso gastar</h2>
      <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>quanto ainda dá pra gastar no mês · ciclo 27→26</p>
      {!temAlgum ? (
        <p style={{ fontSize: 13, color: '#bbb', fontStyle: 'italic', padding: '20px 0', lineHeight: 1.6 }}>Defina seus orçamentos no card “Posso gastar” no fim da Tela Hoje — os lançamentos aparecem aqui, atualizando quanto ainda dá pra gastar.</p>
      ) : <>
        <div style={{ border: '1px solid ' + cor + '33', background: cor + '0c', borderRadius: 16, padding: '14px 16px', marginBottom: 18 }}>
          <div style={{ fontSize: 11.5, color: cor, fontWeight: 700 }}>{cicloLabel(cycleKey)} · agora</div>
          {linhaBuckets(ciclos[cycleKey], true)}
        </div>
        {anteriores.length > 0 && <p style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, margin: '0 0 8px' }}>meses anteriores</p>}
        {anteriores.map(k => (
          <div key={k} style={{ border: '1px solid #eee', borderRadius: 12, padding: '11px 14px', marginBottom: 10 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#444' }}>{cicloLabel(k)}</div>
            {linhaBuckets(ciclos[k], false)}
          </div>
        ))}
      </>}
    </div>
  );
}

function GastoItemForm({ editing, categoria, onClose }) {
  const life = useLife();
  const [nome, setNome] = useState(editing?.nome || '');
  const [mes, setMes] = useState(editing?.mes || '');
  const [valor, setValor] = useState(editing?.valor != null ? String(editing.valor) : '');
  const podeSalvar = nome.trim().length > 0 && mes && valor;
  const salvar = () => {
    if (!podeSalvar) return;
    life.saveGastoItem({ id: editing?.id, categoria, mes, nome: nome.trim(), valor: Number(String(valor).replace(',', '.')) || 0 });
    onClose();
  };
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: '#111', margin: 0 }}>{editing ? 'Editar' : 'Novo'} gasto · {categoria}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: '#aaa', cursor: 'pointer' }}>×</button>
        </div>
        <label style={labelStyle}>O quê</label>
        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="ex.: Presente Lucy e Thales" style={inputStyle} />
        <label style={labelStyle}>Mês</label>
        <input type="month" value={mes} onChange={e => setMes(e.target.value)} style={inputStyle} />
        <label style={labelStyle}>Valor (R$)</label>
        <input type="text" inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)} placeholder="ex.: 533,70" style={inputStyle} />
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          {editing && <button onClick={() => { life.deleteGastoItem(editing.id); onClose(); }} style={{ padding: '12px 16px', borderRadius: 11, border: '1px solid #f0c0c0', background: '#fff', color: '#d05050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apagar</button>}
          <button onClick={salvar} disabled={!podeSalvar} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: 'none', background: podeSalvar ? '#111' : '#ccc', color: '#fff', fontSize: 14, fontWeight: 700, cursor: podeSalvar ? 'pointer' : 'default' }}>{editing ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
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
