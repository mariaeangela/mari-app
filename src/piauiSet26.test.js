// O bilhete que cadastra as matérias da piauí escreve no documento DELA. O que
// não pode acontecer, fixado aqui:
//   1. rodar de novo e duplicar edições ou matérias;
//   2. encostar nas marcas dela (★ quero ler, ✓ li, comentário).
import { describe, it, expect } from 'vitest';
import { ensurePiauiSet26 } from './lifeStore.jsx';
import { PIAUI_EDICOES_SET26, PIAUI_MATERIAS_SET26 } from './piauiSet26.js';

describe('ensurePiauiSet26 — as matérias da piauí, edições 218 a 229', () => {
  it('num documento vazio, entram as 10 edições e as 237 matérias', () => {
    const d = ensurePiauiSet26({});
    expect(d.reportagens.edicoes).toHaveLength(10);
    expect(d.reportagens.materias).toHaveLength(237);
    expect(d.reportagens.edicoes[0]).toEqual({ n: 229, mes: 'outubro de 2025' });   // mais nova primeiro
    expect(d.piauiSet26).toBe(true);
  });

  it('toda matéria tem id único, edição que existe e um dos três tipos', () => {
    const ids = new Set(PIAUI_MATERIAS_SET26.map(m => m.id));
    expect(ids.size).toBe(PIAUI_MATERIAS_SET26.length);
    const eds = new Set(PIAUI_EDICOES_SET26.map(e => e.n));
    PIAUI_MATERIAS_SET26.forEach(m => {
      expect(eds.has(m.ed)).toBe(true);
      expect(['reportagem', 'esquina', 'outro']).toContain(m.tipo);
      expect(m.titulo).toBeTruthy();
    });
  });

  it('rodar de novo não duplica nada', () => {
    const uma = ensurePiauiSet26({});
    const duas = ensurePiauiSet26({ ...uma, piauiSet26: false });   // mesmo sem a flag
    expect(duas.reportagens.materias).toHaveLength(237);
    expect(duas.reportagens.edicoes).toHaveLength(10);
  });

  it('as marcas dela ficam intocadas', () => {
    const marcas = { 'pz229-01': { quero: true, comentario: 'ler no fim de semana' } };
    const d = ensurePiauiSet26({ reportagensMarcas: marcas });
    expect(d.reportagensMarcas).toBe(marcas);
  });

  it('uma edição que já estava lá continua a mesma, e as novas se juntam em ordem', () => {
    const minha = { id: 'pz230-01', ed: 230, tipo: 'reportagem', titulo: 'Da edição seguinte' };
    const d = ensurePiauiSet26({ reportagens: { edicoes: [{ n: 230, mes: 'novembro de 2025' }], materias: [minha] } });
    expect(d.reportagens.materias[0]).toBe(minha);
    expect(d.reportagens.edicoes.map(e => e.n).slice(0, 2)).toEqual([230, 229]);
    expect(d.reportagens.materias).toHaveLength(238);
  });
});
