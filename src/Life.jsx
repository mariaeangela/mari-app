// Aba "Life": hub pessoal com botões para as sub-seções.
// ESBOÇO: as sub-páginas são placeholders por enquanto — vamos desenhar cada
// uma juntas (conteúdo + persistência na nuvem) numa próxima etapa.
import { useState } from 'react';

const SECOES = [
  { id: 'compras',  label: 'Listas de compras',   desc: 'o que você quer comprar',          cor: '#ff8a3d' },
  { id: 'estudos',  label: 'Estudos',             desc: 'aulas, leituras, cursos',          cor: '#5c6bc0' },
  { id: 'financas', label: 'Metas financeiras',   desc: 'quanto quer economizar',           cor: '#54c08a' },
  { id: 'viagens',  label: 'Viagens futuras',     desc: 'pra onde e quando',                cor: '#19b3a6' },
  { id: 'cultural', label: 'Calendário cultural', desc: 'exposições na cidade, até quando', cor: '#c2548f' },
];

function SubPlaceholder({ secao, onBack }) {
  return (
    <div style={{ padding: '24px 20px 80px', maxWidth: 620, margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 22, padding: 0 }}>&larr; Life</button>
      <div style={{ width: 36, height: 4, background: secao.cor, borderRadius: 4, marginBottom: 14 }} />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#111', margin: '0 0 10px' }}>{secao.label}</h2>
      <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>{secao.desc}.</p>
      <div style={{ marginTop: 28, padding: 24, borderRadius: 16, background: secao.cor + '12', border: '1px dashed ' + secao.cor + '55', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: 16, color: '#555', margin: 0 }}>Em construção.</p>
        <p style={{ fontSize: 13, color: '#999', marginTop: 8, lineHeight: 1.6 }}>Vamos desenhar esta seção juntas — me diz como você imagina e eu construo.</p>
      </div>
    </div>
  );
}

export default function LifePage({ isWide }) {
  const [sec, setSec] = useState(null);
  if (sec) return <SubPlaceholder secao={SECOES.find(s => s.id === sec)} onBack={() => setSec(null)} />;
  return (
    <div style={{ padding: '24px 20px 80px', maxWidth: isWide ? 620 : 'none', margin: '0 auto' }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#111', margin: '0 0 4px' }}>Life</h2>
      <p style={{ fontSize: 12, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 22 }}>seu canto pessoal</p>
      <div style={{ display: 'grid', gridTemplateColumns: isWide ? 'repeat(auto-fill, minmax(180px, 1fr))' : '1fr 1fr', gap: 12 }}>
        {SECOES.map(s => (
          <button key={s.id} onClick={() => setSec(s.id)} style={{
            background: s.cor + '12', border: '1px solid ' + s.cor + '33', borderRadius: 16,
            padding: '20px 16px', cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{ width: 24, height: 4, background: s.cor, borderRadius: 4, marginBottom: 12 }} />
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#222', fontWeight: 700, lineHeight: 1.2, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 11.5, color: '#999', lineHeight: 1.4 }}>{s.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
