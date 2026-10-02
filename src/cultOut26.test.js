// O bilhete da lista de 30/set escreve no documento DELA: não pode duplicar,
// não pode encostar no que já está lá.
import { describe, it, expect } from 'vitest';
import { ensureCultOut26 } from './lifeStore.jsx';

describe('ensureCultOut26 — a lista de 30/set/2026', () => {
  it('num documento vazio, entram todos, em São Paulo, com data de fim e local', () => {
    const d = ensureCultOut26({});
    expect(d.cultural.itens).toHaveLength(11);
    d.cultural.itens.forEach(i => {
      expect(i.cidade).toBe('São Paulo');
      expect(i.dataMax).toMatch(/^202[67]-\d{2}-\d{2}$/);
      expect(i.local).toBeTruthy();
      expect(i.quandoIr).toBeUndefined();
    });
    expect(new Set(d.cultural.itens.map(i => i.id)).size).toBe(11);
    expect(d.cultOut26).toBe(true);
  });

  it('rodar de novo não duplica', () => {
    const uma = ensureCultOut26({});
    const duas = ensureCultOut26({ ...uma, cultOut26: false });
    expect(duas.cultural.itens).toHaveLength(11);
  });

  it('o que ela já tinha continua lá, intocado', () => {
    const dela = { id: 'meu-1', nome: 'Uma expo minha', fui: true };
    const d = ensureCultOut26({ cultural: { itens: [dela], outraCoisa: 1 } });
    expect(d.cultural.itens[0]).toBe(dela);
    expect(d.cultural.outraCoisa).toBe(1);
    expect(d.cultural.itens).toHaveLength(12);
  });
});

import { ensureCultGalOut26 } from './lifeStore.jsx';
describe('ensureCultGalOut26 — as galerias de 30/set/2026', () => {
  it('entram as quatro, sem duplicar e sem encostar no resto', () => {
    const dela = { id: 'meu-1', nome: 'Uma expo minha' };
    const uma = ensureCultGalOut26({ cultural: { itens: [dela] } });
    expect(uma.cultural.itens[0]).toBe(dela);
    expect(uma.cultural.itens).toHaveLength(5);
    const duas = ensureCultGalOut26({ ...uma, cultGalOut26: false });
    expect(duas.cultural.itens).toHaveLength(5);
  });
});

import { ensureCultOut26b } from './lifeStore.jsx';
describe('ensureCultOut26b — as quatro de 02/out/2026', () => {
  it('entram as quatro, sem duplicar e sem encostar no resto', () => {
    const dela = { id: 'meu-1', nome: 'Uma expo minha' };
    const uma = ensureCultOut26b({ cultural: { itens: [dela] } });
    expect(uma.cultural.itens[0]).toBe(dela);
    expect(uma.cultural.itens).toHaveLength(5);
    const duas = ensureCultOut26b({ ...uma, cultOut26b: false });
    expect(duas.cultural.itens).toHaveLength(5);
  });
});
