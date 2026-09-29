// O bilhete que cadastra três exposições escreve no documento DELA. As duas
// coisas que não podem acontecer, fixadas aqui:
//   1. rodar de novo e duplicar;
//   2. encostar em qualquer coisa que ela já tinha no Calendário cultural.
import { describe, it, expect } from 'vitest';
import { ensureExposSet26 } from './lifeStore.jsx';

const nomes = (d) => (d.cultural?.itens || []).map(i => i.nome);

describe('ensureExposSet26 — as exposições de 29/set/2026', () => {
  it('num documento vazio, entram as três', () => {
    const d = ensureExposSet26({});
    expect(nomes(d)).toEqual([
      'Não lugares — Vera Chaves Barcellos',
      'Cantaria — Daniel Jorge',
      'Contrarregra — Tatiana Blass',
    ]);
    expect(d.exposSet26).toBe(true);
  });

  it('entram como exposição em São Paulo, com data de encerramento', () => {
    const [primeira] = ensureExposSet26({}).cultural.itens;
    expect(primeira).toMatchObject({
      id: 'cult-set26-naolugares', tipo: 'exposicao', cidade: 'São Paulo', dataMax: '2026-10-03',
    });
    ensureExposSet26({}).cultural.itens.forEach(i => {
      expect(i.dataMax).toMatch(/^2026-\d{2}-\d{2}$/);
      expect(i.local).toBeTruthy();
    });
  });

  it('rodar de novo não duplica nada', () => {
    const uma = ensureExposSet26({});
    const duas = ensureExposSet26({ ...uma, exposSet26: false });
    expect(duas.cultural.itens).toHaveLength(3);
  });

  it('a Contrarregra, que já pode estar lá desde agosto, não entra de novo', () => {
    const dela = { id: 'cult-ago26-contrarregra', nome: 'Contrarregra — Tatiana Blass', fui: true };
    const d = ensureExposSet26({ cultural: { itens: [dela] } });
    expect(d.cultural.itens[0]).toBe(dela);                       // o item dela, o mesmo
    expect(nomes(d).filter(n => /Contrarregra/.test(n))).toHaveLength(1);
    expect(d.cultural.itens).toHaveLength(3);
  });

  it('o que ela já tinha continua lá, intocado', () => {
    const dela = { id: 'meu-1', nome: 'Uma expo minha', fui: true };
    const d = ensureExposSet26({ cultural: { itens: [dela], outraCoisa: 1 } });
    expect(d.cultural.itens[0]).toBe(dela);
    expect(d.cultural.outraCoisa).toBe(1);
    expect(d.cultural.itens).toHaveLength(4);
  });

  it('sem nada novo pra escrever, não mexe na lista', () => {
    const jaTem = ensureExposSet26({});
    const d = ensureExposSet26({ cultural: jaTem.cultural });     // sem a flag, mas com as três
    expect(d.cultural).toBe(jaTem.cultural);
  });
});
