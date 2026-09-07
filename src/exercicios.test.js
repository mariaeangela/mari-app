// "Corrida prova" aparecia DUAS vezes na quebra por tipo, 1× em cada linha.
// Motivo: exercícios antigos foram gravados com o subtipo 'corrida' e os novos
// com 'corrida_prova'. São a mesma coisa (um é apelido do outro), mas quem
// contava usava a string crua como chave. Este é o acidente escrito como teste.
import { describe, it, expect } from 'vitest';
import { subtipoCanon, EXERCICIO_BY_ID } from './calendarConfig.js';

// A mesma contagem que a tela de Saúde faz na quebra "por tipo · no ano".
const contarPorTipo = (exercicios) => {
  const por = {};
  exercicios.forEach(x => { const k = subtipoCanon(x.subtipo); por[k] = (por[k] || 0) + 1; });
  return por;
};

describe('subtipoCanon — apelido antigo é o mesmo tipo', () => {
  it('os nomes antigos viram o nome de hoje', () => {
    expect(subtipoCanon('corrida')).toBe('corrida_prova');
    expect(subtipoCanon('corrida_treino')).toBe('corrida_treino_rua');
    expect(subtipoCanon('natacao')).toBe('outros');
  });

  it('o nome de hoje continua ele mesmo', () => {
    expect(subtipoCanon('corrida_prova')).toBe('corrida_prova');
    expect(subtipoCanon('perna')).toBe('perna');
  });

  it('subtipo desconhecido passa direto (não vira undefined)', () => {
    expect(subtipoCanon('remo')).toBe('remo');
  });

  it('e todo canônico tem rótulo — nenhuma linha fica sem nome', () => {
    ['corrida', 'corrida_treino', 'natacao', 'jogo'].forEach(velho => {
      expect(EXERCICIO_BY_ID[subtipoCanon(velho)]?.label).toBeTruthy();
    });
  });
});

describe('quebra por tipo', () => {
  it('duas provas gravadas com nomes diferentes somam UMA linha, 2×', () => {
    const por = contarPorTipo([
      { subtipo: 'corrida' },        // gravada no formato antigo
      { subtipo: 'corrida_prova' },  // gravada no formato de hoje
    ]);
    expect(por).toEqual({ corrida_prova: 2 });
  });

  it('tipos de verdade diferentes continuam em linhas separadas', () => {
    const por = contarPorTipo([
      { subtipo: 'corrida_prova' },
      { subtipo: 'corrida_treino_rua' },
      { subtipo: 'corrida_treino_esteira' },
      { subtipo: 'perna' },
      { subtipo: 'perna' },
    ]);
    expect(por).toEqual({ corrida_prova: 1, corrida_treino_rua: 1, corrida_treino_esteira: 1, perna: 2 });
  });
});
