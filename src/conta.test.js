// Campos de dinheiro: a regra é que NADA vire zero em silêncio.
//
// Este arquivo existe por causa de um bug real: no formulário de item de gasto,
// `Number("30+45")` dava NaN, o `|| 0` transformava em zero e o valor era salvo
// como R$ 0 sem nenhum aviso. Cada `expect` aqui é uma forma de aquilo voltar.
import { describe, it, expect } from 'vitest';
import { evalValor, contaInvalida } from './conta.jsx';

describe('evalValor — entende conta', () => {
  it('número simples', () => {
    expect(evalValor('533')).toBe(533);
    expect(evalValor('533,70')).toBeCloseTo(533.7);   // vírgula é decimal no Brasil
  });
  it('conta de verdade', () => {
    expect(evalValor('30+45')).toBe(75);
    expect(evalValor('300+233,70')).toBeCloseTo(533.7);
    expect(evalValor('(10+5)*2')).toBe(30);
  });
  it('campo vazio é zero, não erro', () => {
    expect(evalValor('')).toBe(0);
    expect(evalValor(null)).toBe(0);
  });
  it('o que não é conta devolve NaN — NUNCA zero', () => {
    // Este é o coração do bug: se devolvesse 0, o valor seria apagado calado.
    for (const lixo of ['abc', '30++45', '30+', 'R$ 30', '10/0']) {
      expect(Number.isNaN(evalValor(lixo)), `"${lixo}" deveria ser NaN`).toBe(true);
    }
  });
  it('não executa código escondido no campo', () => {
    expect(Number.isNaN(evalValor('alert(1)'))).toBe(true);
    expect(Number.isNaN(evalValor('window.x=1'))).toBe(true);
  });
});

describe('contaInvalida — trava o Salvar antes do estrago', () => {
  it('conta que fecha pode salvar', () => {
    expect(contaInvalida('30+45')).toBe(false);
    expect(contaInvalida('533,70')).toBe(false);
  });
  it('conta quebrada trava', () => {
    expect(contaInvalida('30++45')).toBe(true);
    expect(contaInvalida('abc')).toBe(true);
  });
  it('campo vazio não trava (é só um campo em branco)', () => {
    expect(contaInvalida('')).toBe(false);
    expect(contaInvalida(null)).toBe(false);
  });
});

describe('a armadilha original, escrita como teste', () => {
  it('o jeito ANTIGO apagava o valor; o novo se recusa a salvar', () => {
    const digitado = '30+45';
    const antigo = Number(String(digitado).replace(',', '.')) || 0;   // como era
    expect(antigo).toBe(0);                                            // <- o bug
    expect(contaInvalida(digitado)).toBe(false);
    expect(evalValor(digitado)).toBe(75);                              // <- o certo
  });
});
