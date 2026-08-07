// Levar os dados embora — sem depender de mim nem do app.
//
// Desde que o `/api/data` passou a exigir chave (ago/2026), abrir o endereço no
// navegador não devolve mais nada (401): a chave só existe dentro do app, na
// sessão logada. Então é o próprio app que precisa entregar os arquivos. Tudo é
// montado AQUI no navegador, a partir do que já está carregado na memória — não
// há servidor, upload nem serviço no meio.
//
// Dois formatos, de propósito:
//  • TEXTO (.md)  — o que ela ESCREVE (estudos, aprendizados, diário, legendas…),
//    legível, pra abrir no Word/Docs/Notion ou imprimir. Deixa de fora dinheiro e
//    a aba Amorosa: é um arquivo pra circular, e essas duas não são.
//  • BACKUP (.json) — TUDO, sem exceção, do jeito que está guardado. É o que
//    permite reconstruir o app inteiro (ou migrar pra outro) um dia.

function baixar(nome, texto, tipo) {
  const blob = new Blob([texto], { type: tipo + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // deixa o navegador terminar o download antes de soltar o blob
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

const hoje = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

// ---------- Backup completo (JSON) ----------
export function exportarJSON(life, calendario, saved) {
  const doc = {
    _sobre: 'Backup completo do Diagonal. Guarde este arquivo: ele tem tudo.',
    _exportadoEm: new Date().toISOString(),
    life, calendario, saved,
  };
  baixar(`diagonal-backup-${hoje()}.json`, JSON.stringify(doc, null, 2), 'application/json');
}

// ---------- Texto legível (Markdown) ----------
const L = [];
const linha = (s = '') => L.push(s);
const bloco = (itens) => {
  (itens || []).forEach(it => {
    if (!String(it).trim()) linha('');        // linha em branco = respiro, igual no app
    else linha('- ' + it);
  });
};

// Notas aninhadas (Estudos e Aprendizados usam o mesmo formato).
function notasRec(notas, paiId, nivel, titulos) {
  const filhas = (notas || []).filter(n => (n.paiId || null) === (paiId || null));
  filhas.forEach(n => {
    const h = '#'.repeat(Math.min(titulos + nivel, 6));
    linha(`${h} ${n.titulo}${n.quando ? `  *(${n.quando})*` : ''}`);
    linha();
    if ((n.itens || []).length) { bloco(n.itens); linha(); }
    notasRec(notas, n.id, nivel + 1, titulos);
  });
}

export function exportarTexto(life, calendario) {
  L.length = 0;
  const l = life || {};
  const cal = calendario || {};

  linha('# Diagonal — meus textos');
  linha();
  linha(`*Exportado em ${new Date().toLocaleDateString('pt-BR')}.*`);
  linha();
  linha('> Este arquivo tem o que você escreve: estudos, aprendizados, diário, legendas, leituras e viagens.');
  linha('> Ele NÃO inclui a Vida Financeira nem a aba Amorosa — essas ficam só no backup completo (.json).');
  linha();

  // --- Estudos (tópicos → anotações → tópicos → subtópicos) ---
  const est = l.estudoTemas || {};
  if ((est.topicos || []).length) {
    linha('---'); linha(); linha('# Estudos'); linha();
    est.topicos.forEach(t => {
      linha(`## ${t.nome}`); linha();
      const notas = (est.notas || []).filter(n => n.topicoId === t.id);
      if (!notas.length) { linha('*(sem anotações)*'); linha(); return; }
      notasRec(notas, null, 0, 3);
    });
  }

  // --- Aprendizados ---
  const ap = l.aprendizados || {};
  if ((ap.topicos || []).length) {
    linha('---'); linha(); linha('# Aprendizados'); linha();
    ap.topicos.forEach(t => {
      linha(`## ${t.nome}`); linha();
      const notas = (ap.notas || []).filter(n => n.topicoId === t.id);
      if (!notas.length) { linha('*(sem notas)*'); linha(); return; }
      notasRec(notas, null, 0, 3);
    });
  }

  // --- Acompanhamento de leituras (personagens, anotações, guia) ---
  const acomp = l.acompLeituras || [];
  if (acomp.length) {
    linha('---'); linha(); linha('# Acompanhamento de leituras'); linha();
    acomp.forEach(livro => {
      linha(`## ${livro.titulo}${livro.autor ? ' — ' + livro.autor : ''}`);
      linha();
      const meta = [livro.ano, livro.pais, livro.status].filter(Boolean).join(' · ');
      if (meta) { linha(`*${meta}*`); linha(); }
      if ((livro.personagens || []).length) {
        linha('### Personagens'); linha();
        livro.personagens.forEach(p => {
          const rel = (p.relacoes || []).map(r => {
            const outro = livro.personagens.find(x => x.id === r.comId);
            return `${r.tipo} de ${outro ? outro.nome : '?'}`;
          }).join(', ');
          linha(`- **${p.nome}**${p.descricao ? ' — ' + p.descricao : ''}${rel ? ` *(${rel})*` : ''}${p.obs ? ` — ${p.obs}` : ''}`);
        });
        linha();
      }
      if ((livro.notas || []).length) {
        linha('### Anotações'); linha();
        livro.notas.forEach(n => {
          const d = n.criadoEm ? new Date(n.criadoEm).toLocaleDateString('pt-BR') : '';
          linha(`- ${d ? `**${d}** — ` : ''}${n.texto}`);
        });
        linha();
      }
      const g = livro.guia || {};
      const partes = [['Publicação', g.publicacao], ['Contexto', g.russia], ['Autor', g.autor]].filter(([, v]) => v);
      if (partes.length) {
        linha('### Guia (sem spoiler)'); linha();
        partes.forEach(([k, v]) => { linha(`**${k}.** ${v}`); linha(); });
      }
    });
  }

  // --- Inglês ---
  const en = l.ingles || [];
  if (en.length) {
    linha('---'); linha(); linha('# Inglês'); linha();
    [...en].sort((a, b) => (a.termo || '').localeCompare(b.termo || '')).forEach(e => {
      linha(`- **${e.termo}** — ${e.definicao}${e.origem ? `  *(${e.origem})*` : ''}`);
    });
    linha();
  }

  // --- Diário + humor (do calendário) ---
  const diary = cal.diary || {};
  const moods = cal.moods || {};
  const dias = Object.keys(diary).filter(k => String(diary[k] || '').trim()).sort().reverse();
  if (dias.length) {
    linha('---'); linha(); linha('# Diário'); linha();
    dias.forEach(k => {
      const [y, m, d] = k.split('-');
      linha(`**${d}/${m}/${y}**${moods[k] ? ` — *${moods[k]}*` : ''}  `);
      linha(diary[k]);
      linha();
    });
  }

  // --- Legendas ---
  const legs = l.legendas || [];
  if (legs.some(g => (g.itens || []).length)) {
    linha('---'); linha(); linha('# Legendas'); linha();
    legs.forEach(g => {
      if (!(g.itens || []).length) return;
      linha(`## ${g.nome}`); linha();
      g.itens.forEach(it => {
        if (it.titulo) linha(`**${it.titulo}**  `);
        if (it.texto) linha(it.texto);
        linha();
      });
    });
  }

  // --- Planos (informações + checklist) ---
  const planos = l.planos || {};
  if ((planos.lista || []).length) {
    linha('---'); linha(); linha('# Planos'); linha();
    planos.lista.forEach(p => {
      linha(`## ${p.nome}`); linha();
      (planos.infos || []).filter(i => i.planoId === p.id).forEach(i => {
        linha(`### ${i.titulo}`); linha(); linha(i.texto); linha();
      });
      const itens = (planos.itens || []).filter(i => i.planoId === p.id);
      if (itens.length) {
        itens.forEach(i => linha(`- [${i.feito ? 'x' : ' '}] ${i.texto}${i.prazo ? `  *(prazo ${i.prazo})*` : ''}`));
        linha();
      }
    });
  }

  // --- Leituras (a estante) ---
  const livros = l.leituras || [];
  if (livros.length) {
    linha('---'); linha(); linha('# Leituras'); linha();
    const lidos = livros.filter(b => b.lido);
    const naEstante = livros.filter(b => !b.lido);
    const linhaLivro = (b) => {
      const meta = [b.autor, b.pais, b.ano, b.paginas ? b.paginas + 'p' : null].filter(Boolean).join(' · ');
      const temas = (b.temas || []).length ? `  *(${b.temas.join(', ')})*` : '';
      linha(`- **${b.titulo}**${meta ? ' — ' + meta : ''}${temas}`);
    };
    if (lidos.length) { linha(`## Já lidos (${lidos.length})`); linha(); lidos.forEach(linhaLivro); linha(); }
    if (naEstante.length) { linha(`## Por ler (${naEstante.length})`); linha(); naEstante.forEach(linhaLivro); linha(); }
  }

  // --- Viagens (roteiro) ---
  const viagens = l.viagensFuturas || [];
  if (viagens.length) {
    linha('---'); linha(); linha('# Viagens'); linha();
    viagens.forEach(v => {
      linha(`## ${v.titulo}${v.cidade ? ` — ${v.cidade}` : ''}`);
      linha();
      if (v.inicio) { linha(`*${v.inicio}${v.fim ? ` a ${v.fim}` : ''}*`); linha(); }
      if (v.hospedagem) { linha(`**Hospedagem.** ${v.hospedagem}`); linha(); }
      if (v.passagens) { linha(`**Passagens.** ${v.passagens}`); linha(); }
      if ((v.mesas || []).length) {
        linha('### Programação'); linha();
        v.mesas.forEach(m => {
          linha(`- ${[m.dia, m.hora].filter(Boolean).join(' ')} — **${m.titulo}**${m.autores ? ` (${m.autores})` : ''}`);
          if (m.desc) linha(`  ${m.desc}`);
        });
        linha();
      }
      [['O que levar', v.levar], ['O que comprar', v.comprar], ['O que fazer', v.fazer]].forEach(([nome, lista]) => {
        if (!(lista || []).length) return;
        linha(`### ${nome}`); linha();
        lista.forEach(i => linha(`- [${i.feito ? 'x' : ' '}] ${i.texto}`));
        linha();
      });
    });
  }

  baixar(`diagonal-textos-${hoje()}.md`, L.join('\n'), 'text/markdown');
}
