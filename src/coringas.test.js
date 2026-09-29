// Dias coringa: a lista é POR MÊS. O que não pode acontecer, fixado aqui:
// mexer num mês mudar outro — foi a reclamação dela (set/2026).
import { describe, it, expect } from 'vitest';
import {
  CORINGAS_PADRAO, coringaTiposDoMes, coringaAdd, coringaRename, coringaMove, coringaDelete, coringasDoDia,
} from './calendarConfig.js';

const nomes = (d, mes) => coringaTiposDoMes(d, mes).map(t => t.nome);

describe('dias coringa por mês', () => {
  it('quem nunca mexeu vê os cinco de partida', () => {
    expect(coringaTiposDoMes({}, '2026-09')).toBe(CORINGAS_PADRAO);
    expect(coringaTiposDoMes({ coringaTipos: {} }, '2026-09')).toBe(CORINGAS_PADRAO);
  });

  it('renomear em outubro NÃO mexe em setembro', () => {
    const d = coringaRename({}, '2026-10', 'journaling', 'Escrever');
    expect(nomes(d, '2026-10')).toContain('Escrever');
    expect(nomes(d, '2026-09')).toContain('Journaling');
    expect(nomes(d, '2026-09')).not.toContain('Escrever');
  });

  it('um mês novo começa com a lista do último mês mexido', () => {
    const d = coringaAdd({}, '2026-10', 'Dia de cuidar de mim', 'cg1');
    expect(nomes(d, '2026-11')).toContain('Dia de cuidar de mim');   // herda outubro
    expect(nomes(d, '2026-12')).toContain('Dia de cuidar de mim');
    expect(nomes(d, '2026-08')).not.toContain('Dia de cuidar de mim'); // mês anterior, não
  });

  it('mês ANTERIOR não herda do futuro: fica com os cinco de partida', () => {
    const d = coringaAdd({}, '2026-10', 'Novo', 'cg1');
    expect(nomes(d, '2026-01')).not.toContain('Novo');
    expect(nomes(d, '2026-01')).toEqual(CORINGAS_PADRAO.map(c => c.nome));
  });

  it('apagar tira só daquele mês, junto com a data marcada nele', () => {
    const base = { coringas: { '2026-09': { journaling: 12, financeira: 3 }, '2026-10': { journaling: 5 } } };
    const d = coringaDelete(base, '2026-09', 'journaling');
    expect(nomes(d, '2026-09')).not.toContain('Journaling');
    expect(d.coringas['2026-09']).toEqual({ financeira: 3 });   // a data dele saiu
    expect(d.coringas['2026-10']).toEqual({ journaling: 5 });   // outubro, intacto
  });

  it('a ordem muda só no mês em que ela mexeu', () => {
    const d = coringaMove({}, '2026-10', 'together', -1);
    expect(nomes(d, '2026-10').slice(0, 2)).toEqual(['Get your shit together', 'Arrumar vida financeira']);
    expect(nomes(d, '2026-09').slice(0, 2)).toEqual(['Arrumar vida financeira', 'Get your shit together']);
  });

  it('nome vazio não vira dia coringa nem apaga o nome de um', () => {
    expect(coringaAdd({}, '2026-10', '   ', 'cg1')).toEqual({});
    expect(coringaRename({}, '2026-10', 'journaling', ' ')).toEqual({});
  });

  it('formato antigo (uma lista só) segue valendo em todos os meses', () => {
    const antigo = { coringaTipos: [{ id: 'a', nome: 'Só esse' }] };
    expect(nomes(antigo, '2026-09')).toEqual(['Só esse']);
    expect(nomes(antigo, '2027-03')).toEqual(['Só esse']);
    // ao mexer num mês, o mês mexido ganha lista própria e os outros herdam dele
    const d = coringaAdd(antigo, '2026-10', 'Outro', 'cg2');
    expect(nomes(d, '2026-10')).toEqual(['Só esse', 'Outro']);
    expect(nomes(d, '2026-11')).toEqual(['Só esse', 'Outro']);
    expect(nomes(d, '2026-09')).toEqual(['Só esse']);   // o passado segue como era
  });

  it('o nome que aparece no dia é o do mês daquele dia', () => {
    let d = { coringas: { '2026-09': { journaling: 12 }, '2026-10': { journaling: 12 } } };
    d = coringaRename(d, '2026-10', 'journaling', 'Escrever');
    expect(coringasDoDia(d, new Date(2026, 8, 12))).toEqual(['Journaling']);
    expect(coringasDoDia(d, new Date(2026, 9, 12))).toEqual(['Escrever']);
  });
});
