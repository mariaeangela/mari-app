import { describe, it, expect } from 'vitest';
import { previsaoMenstruacao } from './saudeCalc.js';

const r = (data, fim) => ({ id: data, data, fim });

describe('previsaoMenstruacao', () => {
  it('sem pelo menos dois inícios, não prevê', () => {
    expect(previsaoMenstruacao([], '2026-09-10')).toBeNull();
    expect(previsaoMenstruacao([r('2026-08-20')], '2026-09-10')).toBeNull();
  });

  it('soma o ciclo médio ao último início', () => {
    const p = previsaoMenstruacao([r('2026-06-01'), r('2026-06-29'), r('2026-07-27'), r('2026-08-24')], '2026-09-10');
    expect(p.ciclo).toBe(28);
    expect(p.proxima).toBe('2026-09-21');
    expect(p.faltam).toBe(11);
    expect(p.amostra).toBe(3);
  });

  it('um mês esquecido (ciclo de 56 dias) fica fora da média', () => {
    const p = previsaoMenstruacao([r('2026-04-01'), r('2026-04-30'), r('2026-06-25'), r('2026-07-24')], '2026-08-01');
    expect(p.ciclo).toBe(29);
    expect(p.amostra).toBe(2);
  });

  it('a ordem dos registros não importa', () => {
    const p = previsaoMenstruacao([r('2026-08-24'), r('2026-06-01'), r('2026-07-27'), r('2026-06-29')], '2026-09-10');
    expect(p.proxima).toBe('2026-09-21');
  });

  it('quando a data prevista já passou, faltam fica negativo', () => {
    const p = previsaoMenstruacao([r('2026-07-01'), r('2026-07-29')], '2026-09-01');
    expect(p.proxima).toBe('2026-08-26');
    expect(p.faltam).toBe(-6);
  });

  it('a duração média sai dos registros com fim', () => {
    const p = previsaoMenstruacao([r('2026-07-01', '2026-07-05'), r('2026-07-29', '2026-08-02')], '2026-08-10');
    expect(p.duracao).toBe(5);
  });
});
