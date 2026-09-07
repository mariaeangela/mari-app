// O bilhete que cadastra cinco livros nas Próximas leituras escreve no documento
// DELA. As duas coisas que não podem acontecer, fixadas aqui:
//   1. rodar de novo e duplicar os livros;
//   2. encostar em qualquer livro que ela já tinha.
// (É a mesma regra dos bilhetes antigos: "patch nunca apaga item que a Mari criou".)
import { describe, it, expect } from 'vitest';
import { ensureLeiturasSet26 } from './lifeStore.jsx';

const titulos = (d) => (d.leituras || []).map(l => l.titulo);

describe('ensureLeiturasSet26 — os cinco livros de set/2026', () => {
  it('num documento vazio, entram os cinco', () => {
    const d = ensureLeiturasSet26({});
    expect(titulos(d)).toEqual([
      'A Náusea', 'O Estrangeiro', 'A Morte de Ivan Ilitch',
      'Crítica da Razão Impura', 'O Ano do Pensamento Mágico',
    ]);
    expect(d.leiturasSet26).toBe(true);
  });

  it('entram na estante, não lidos, com id estável', () => {
    const [primeiro] = ensureLeiturasSet26({}).leituras;
    expect(primeiro).toMatchObject({
      id: 'lv-set26-nausea', titulo: 'A Náusea', autor: 'Jean-Paul Sartre',
      idioma: 'Português', lido: false, tenho: true,
    });
    expect(Array.isArray(primeiro.temas)).toBe(true);
  });

  it('rodar de novo não duplica nada', () => {
    const uma = ensureLeiturasSet26({});
    const duas = ensureLeiturasSet26(uma);
    expect(titulos(duas)).toEqual(titulos(uma));
    expect(duas.leituras).toHaveLength(5);
  });

  it('o que ela já tinha continua lá, intocado', () => {
    const dela = { id: 'meu-1', titulo: 'A Hora da Estrela', autor: 'Clarice Lispector', lido: true };
    const d = ensureLeiturasSet26({ leituras: [dela] });
    expect(d.leituras[0]).toBe(dela);          // o objeto dela, o mesmo
    expect(d.leituras).toHaveLength(6);
  });

  it('título que ela já cadastrou não entra de novo (nem com outra caixa)', () => {
    const d = ensureLeiturasSet26({ leituras: [{ id: 'meu-2', titulo: 'o estrangeiro', autor: 'Camus' }] });
    expect(titulos(d).filter(t => /estrangeiro/i.test(t))).toEqual(['o estrangeiro']);
    expect(d.leituras).toHaveLength(5);
  });

  it('sem nada novo pra escrever, não mexe na lista', () => {
    const jaTem = ensureLeiturasSet26({});
    const d = ensureLeiturasSet26({ leituras: jaTem.leituras });   // sem a flag, mas com os livros
    expect(d.leituras).toBe(jaTem.leituras);
  });
});
