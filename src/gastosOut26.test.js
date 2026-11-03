// O bilhete de outubro/2026 troca só outubro, uma vez, casando as subcategorias
// com as dela e guardando o que havia antes.
import { describe, it, expect } from 'vitest';
import { ensureGastosOut26 } from './lifeStore.jsx';

describe('ensureGastosOut26 — Gastos de outubro da aba Out26', () => {
  const base = () => ({
    gastos: [{ mes: '2026-09', itens: [{ categoria: 'Fixos', valor: 6033.88 }] }, { mes: '2026-10', itens: [{ categoria: 'Fixos', valor: 1 }] }],
    gastoSubcats: { Fixos: ['Aluguel', 'Academia-personal'], Bobeira: ['Comida salgado'] },
    gastosItens: [{ id: 'a', categoria: 'Fixos', mes: '2026-09', nome: 'Aluguel', valor: 3423.34 }, { id: 'b', categoria: 'Fixos', mes: '2026-10', nome: 'Aluguel', valor: 9 }],
  });

  it('troca outubro, não encosta em setembro e guarda o antigo', () => {
    const d = ensureGastosOut26(base());
    expect(d.gastos[0]).toEqual(base().gastos[0]);
    const out = d.gastos.find(g => g.mes === '2026-10').itens;
    expect(Math.round(out.reduce((a, i) => a + i.valor, 0) * 100) / 100).toBe(19399.37);
    expect(d.gastosItens.find(x => x.id === 'a')).toBeTruthy();
    expect(d.gastosItens.find(x => x.id === 'b')).toBeUndefined();
    expect(d.gastosOut26Antes.itens.map(x => x.id)).toEqual(['b']);
    expect(d.gastosOut26Antes.gasto.itens[0].valor).toBe(1);
  });

  it('usa o nome dela da subcategoria e cria só o que falta', () => {
    const d = ensureGastosOut26(base());
    expect(d.gastoSubcats.Fixos.slice(0, 2)).toEqual(['Aluguel', 'Academia-personal']);
    expect(d.gastoSubcats.Fixos).toHaveLength(6);
    expect(d.gastoSubcats.Bobeira).toEqual(['Comida salgado', 'Água']);
    const it = d.gastosItens.find(x => x.mes === '2026-10' && x.nome === 'Academia-personal');
    expect(it.valor).toBe(549.99);
  });

  it('roda uma vez só', () => {
    const d = ensureGastosOut26(base());
    expect(ensureGastosOut26({ ...d, gastos: [] }).gastos).toEqual([]);
  });
});
