// O bilhete que cadastra sete livros nas Próximas leituras escreve no documento
// DELA. As duas coisas que não podem acontecer, fixadas aqui:
//   1. rodar de novo e duplicar os livros;
//   2. encostar em qualquer livro que ela já tinha.
// (É a mesma regra dos bilhetes antigos: "patch nunca apaga item que a Mari criou".)
import { describe, it, expect } from 'vitest';
import { ensureLeiturasSet26b } from './lifeStore.jsx';

const titulos = (d) => (d.leituras || []).map(l => l.titulo);

describe('ensureLeiturasSet26b — os sete livros de 10/set/2026', () => {
  it('num documento vazio, entram os sete', () => {
    const d = ensureLeiturasSet26b({});
    expect(titulos(d)).toEqual([
      'O Inferno dos Outros', 'A Vida Brinca Comigo', 'Os Colaboradores',
      'Stay Alive: Berlin, 1939–1945', 'Assassinato em Amsterdã',
      'Ocidentalismo: O Ocidente aos Olhos de seus Inimigos',
      'Domar os Deuses: Religião e Democracia em Três Continentes',
    ]);
    expect(d.leiturasSet26b).toBe(true);
  });

  it('entram na estante, não lidos, com id estável; o idioma padrão é português', () => {
    const d = ensureLeiturasSet26b({});
    expect(d.leituras[0]).toMatchObject({
      id: 'lv-set26-infernooutros', titulo: 'O Inferno dos Outros', autor: 'David Grossman',
      idioma: 'Português', lido: false, tenho: true,
    });
    expect(d.leituras.find(l => l.id === 'lv-set26-stayalive').idioma).toBe('Inglês');
    d.leituras.forEach(l => expect(Array.isArray(l.temas)).toBe(true));
  });

  it('rodar de novo não duplica nada', () => {
    const uma = ensureLeiturasSet26b({});
    const duas = ensureLeiturasSet26b(uma);
    expect(titulos(duas)).toEqual(titulos(uma));
    expect(duas.leituras).toHaveLength(7);
  });

  it('o que ela já tinha continua lá, intocado', () => {
    const dela = { id: 'meu-1', titulo: 'A Hora da Estrela', autor: 'Clarice Lispector', lido: true };
    const d = ensureLeiturasSet26b({ leituras: [dela] });
    expect(d.leituras[0]).toBe(dela);          // o objeto dela, o mesmo
    expect(d.leituras).toHaveLength(8);
  });

  it('título que ela já cadastrou não entra de novo (nem com outra caixa)', () => {
    const d = ensureLeiturasSet26b({ leituras: [{ id: 'meu-2', titulo: 'assassinato em amsterdã', autor: 'Buruma' }] });
    expect(titulos(d).filter(t => /amsterd/i.test(t))).toEqual(['assassinato em amsterdã']);
    expect(d.leituras).toHaveLength(7);
  });

  it('sem nada novo pra escrever, não mexe na lista', () => {
    const jaTem = ensureLeiturasSet26b({});
    const d = ensureLeiturasSet26b({ leituras: jaTem.leituras });   // sem a flag, mas com os livros
    expect(d.leituras).toBe(jaTem.leituras);
  });
});
