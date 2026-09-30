// O bilhete da Antígona escreve no documento DELA: não pode duplicar, não pode
// encostar no que já está lá, e não pode inventar um dia pra ela ir.
import { describe, it, expect } from 'vitest';
import { ensureAntigonaSet26 } from './lifeStore.jsx';

describe('ensureAntigonaSet26 — a peça de 30/set/2026', () => {
  it('entra como teatro, qua e qui 20h, até 05/11, sem "quando ir"', () => {
    const d = ensureAntigonaSet26({});
    expect(d.cultural.itens).toHaveLength(1);
    const [p] = d.cultural.itens;
    expect(p).toMatchObject({ tipo: 'teatro', dataMax: '2026-11-05', funcionamento: { dias: [3, 4], abre: '20:00' } });
    expect(p.quandoIr).toBeUndefined();
    expect(p.eventoId).toBeUndefined();
    expect(d.antigonaSet26).toBe(true);
  });

  it('rodar de novo não duplica', () => {
    const uma = ensureAntigonaSet26({});
    const duas = ensureAntigonaSet26({ ...uma, antigonaSet26: false });
    expect(duas.cultural.itens).toHaveLength(1);
  });

  it('se ela já tiver cadastrado a Antígona na mão, não entra de novo', () => {
    const dela = { id: 'meu-1', nome: 'Antigona' };
    const d = ensureAntigonaSet26({ cultural: { itens: [dela] } });
    expect(d.cultural.itens).toEqual([dela]);
  });

  it('o que ela já tinha continua lá, intocado', () => {
    const dela = { id: 'meu-1', nome: 'Uma expo minha', fui: true };
    const d = ensureAntigonaSet26({ cultural: { itens: [dela], outraCoisa: 1 } });
    expect(d.cultural.itens[0]).toBe(dela);
    expect(d.cultural.outraCoisa).toBe(1);
    expect(d.cultural.itens).toHaveLength(2);
  });
});
