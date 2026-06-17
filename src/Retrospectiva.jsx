// Aba "Retrospectiva": agrega seus números e marcos por ano (e depois por mês).
// 1ª versão: "o ano em números", puxando cultura e exercícios do Calendário.
import { useState } from 'react';
import { useCalendar } from './calendarStore.jsx';
import { EXERCICIO_BY_ID } from './calendarConfig.js';

const COR = '#8d6e63';
const pad2 = (n) => String(n).padStart(2, '0');

export default function RetrospectivaPage({ isWide }) {
  const cal = useCalendar();
  const cultura = cal.data.cultura || [];
  const exercicios = cal.data.exercicios || [];

  const hoje = new Date();
  const hk = `${hoje.getFullYear()}-${pad2(hoje.getMonth() + 1)}-${pad2(hoje.getDate())}`;
  const anoAtual = String(hoje.getFullYear());

  // Anos com dados (cultura ou exercícios), do mais novo pro mais antigo, sem futuros.
  const anos = [...new Set([
    ...cultura.map(c => (c.data || '').slice(0, 4)),
    ...exercicios.map(x => (x.data || '').slice(0, 4)),
  ].filter(Boolean))].filter(a => a <= anoAtual).sort().reverse();

  const [anoSelRaw, setAnoSel] = useState(anoAtual);
  const anoSel = anos.includes(anoSelRaw) ? anoSelRaw : (anos[0] || anoAtual);

  const noAno = (arr) => arr.filter(x => (x.data || '').startsWith(anoSel) && (x.data || '') <= hk);
  const cultAno = noAno(cultura);
  const exAno = noAno(exercicios);
  const countSub = (sub) => cultAno.filter(c => c.subtipo === sub).length;
  const grupo = (g) => exAno.filter(x => EXERCICIO_BY_ID[x.subtipo]?.grupo === g);
  const km = Math.round(grupo('corrida').reduce((a, x) => a + (Number(x.distancia) || 0), 0));

  const numeros = [
    { label: 'livros lidos', valor: countSub('lido') },
    { label: 'filmes', valor: countSub('filme') },
    { label: 'séries', valor: countSub('serie') },
    { label: 'exposições', valor: countSub('exposicao') },
    { label: 'museus', valor: countSub('museu') },
    { label: 'shows', valor: countSub('show') },
    { label: 'espetáculos', valor: countSub('espetaculo') },
    { label: 'treinos', valor: grupo('treino').length },
    { label: 'corridas', valor: grupo('corrida').length },
    { label: 'km corridos', valor: km },
  ].filter(n => n.valor > 0);

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: isWide ? 720 : 'none', margin: '0 auto' }}>
      <div style={{ width: 36, height: 4, background: COR, borderRadius: 4, marginBottom: 12 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#111', margin: '0 0 4px' }}>Retrospectiva</h2>
      <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 18px' }}>seus números e marcos por ano</p>

      {anos.length > 1 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
          {anos.map(a => (
            <button key={a} onClick={() => setAnoSel(a)} style={{
              whiteSpace: 'nowrap', padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
              border: '1px solid ' + (anoSel === a ? COR : '#e2e2e2'), background: anoSel === a ? COR + '1c' : '#fff', color: anoSel === a ? '#5d473e' : '#888',
            }}>{a}</button>
          ))}
        </div>
      )}

      <div style={{ fontSize: 11, color: COR, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>{anoSel} em números</div>

      {numeros.length === 0 ? (
        <div style={{ padding: 24, borderRadius: 16, background: COR + '10', border: '1px dashed ' + COR + '55', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 16, color: '#555', margin: 0 }}>Seu ano ainda está em branco por aqui.</p>
          <p style={{ fontSize: 13, color: '#999', marginTop: 8, lineHeight: 1.6 }}>Conforme você registra cultura (livros, filmes, museus…) e exercícios no Calendário, seus números aparecem aqui.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isWide ? 'repeat(auto-fill, minmax(150px, 1fr))' : '1fr 1fr', gap: 12 }}>
          {numeros.map(n => (
            <div key={n.label} style={{ background: COR + '10', border: '1px solid ' + COR + '28', borderRadius: 14, padding: '16px 14px' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: '#111', lineHeight: 1 }}>{n.valor.toLocaleString('pt-BR')}</div>
              <div style={{ fontSize: 12.5, color: '#777', marginTop: 6 }}>{n.label}</div>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 12, color: '#bbb', lineHeight: 1.6, marginTop: 22 }}>
        Em construção: ainda vamos somar <b style={{ color: '#999' }}>quem você viu</b>, o detalhe <b style={{ color: '#999' }}>por mês</b> e um resumo narrativo do período.
      </p>
    </div>
  );
}
