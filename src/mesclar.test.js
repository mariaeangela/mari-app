// Duas edições no mesmo instante não podem se apagar.
// Este é o acidente da nota de terapia, escrito como teste.
import { describe, it, expect } from 'vitest';
import { rebasear } from './mesclar.js';

describe('rebasear — ninguém apaga ninguém', () => {
  it('sem ninguém no meio, usa a gravação como veio', () => {
    const base = { a: 1 };
    const next = { a: 2 };
    expect(rebasear(base, base, next)).toBe(next);
  });

  it('duas gravações em fatias DIFERENTES: as duas ficam', () => {
    const base = { aprendizados: 'A', compras: 'C' };
    // 1ª gravação (já entrou): mexeu em aprendizados
    const prev = { aprendizados: 'A2', compras: 'C' };
    // 2ª gravação, montada sobre a base VELHA: mexeu em compras
    const next = { aprendizados: 'A', compras: 'C2' };
    expect(rebasear(prev, base, next)).toEqual({ aprendizados: 'A2', compras: 'C2' });
  });

  it('a 2ª gravação NÃO ressuscita a fatia velha que ela não tocou', () => {
    const base = { x: 'velho', y: 1 };
    const prev = { x: 'novo', y: 1 };
    const next = { x: 'velho', y: 2 };            // só mexeu em y
    expect(rebasear(prev, base, next).x).toBe('novo');
  });

  it('remover uma fatia continua removendo', () => {
    const base = { a: 1, b: 2 };
    const prev = { a: 9, b: 2 };
    const next = { a: 1 };                        // esta gravação apagou `b`
    const out = rebasear(prev, base, next);
    expect('b' in out).toBe(false);
    expect(out.a).toBe(9);                        // e não desfaz o que a outra fez
  });

  it('fatia nova criada pela 2ª gravação entra', () => {
    const base = { a: 1 };
    const prev = { a: 2 };
    const next = { a: 1, novo: 'oi' };
    expect(rebasear(prev, base, next)).toEqual({ a: 2, novo: 'oi' });
  });

  it('o caso REAL: temas + dois aprendizados, tudo no mesmo tick', () => {
    // (aqui as três gravações são na MESMA fatia, então o que vale é chegar cada
    //  uma com a fatia já atualizada — é o que `persistFn` garante no store.)
    const base = { aprendizados: { temas: '', itens: [] } };
    const g1 = { aprendizados: { temas: 'ansiedade', itens: [] } };
    const depois1 = rebasear(base, base, g1);
    const g2 = { aprendizados: { ...depois1.aprendizados, itens: ['primeiro'] } };
    const depois2 = rebasear(depois1, depois1, g2);
    const g3 = { aprendizados: { ...depois2.aprendizados, itens: [...depois2.aprendizados.itens, 'segundo'] } };
    const fim = rebasear(depois2, depois2, g3);
    expect(fim.aprendizados.temas).toBe('ansiedade');
    expect(fim.aprendizados.itens).toEqual(['primeiro', 'segundo']);
  });
});
