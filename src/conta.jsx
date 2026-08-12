// Campos de dinheiro que aceitam CONTA ("30+45" = 75).
//
// As três peças moravam duplicadas (uma cópia em `Life.jsx`, outra em
// `GastosDetalhado.jsx`) e a cópia de lá nasceu sem a trava — resultado: no
// formulário de item de gasto uma conta quebrada virava **zero, em silêncio**.
// Agora é uma coisa só, num lugar só, e quem usa ganha as três de uma vez:
//
//   evalValor(txt)      → o número, ou NaN se a conta não fecha
//   contaInvalida(txt)  → true quando há texto e a conta não fecha (trava o Salvar)
//   <PreviaConta />     → mostra "= R$ 75" (ou "conta inválida") embaixo do campo
//
// REGRA pra qualquer campo de dinheiro novo: usar as três juntas. Sozinho,
// `evalValor` devolve NaN e algum `|| 0` lá na frente transforma em zero —
// que é exatamente o jeito de apagar um valor sem ninguém perceber.

// Aceita conta simples. Vírgula vira ponto decimal; só permite dígitos e
// + - * / ( ) por segurança. Devolve NaN quando não dá pra calcular.
export function evalValor(s) {
  const str = String(s == null ? '' : s).trim().replace(/,/g, '.');
  if (!str) return 0;
  if (!/^[0-9.+\-*/() ]+$/.test(str)) return NaN;
  try { const v = Function('"use strict";return(' + str + ')')(); return (typeof v === 'number' && isFinite(v)) ? v : NaN; }
  catch { return NaN; }
}

// Tem texto e a conta não fecha? Serve pra desligar o botão ANTES de salvar 0.
export const contaInvalida = (v) => { const s = String(v == null ? '' : v).trim(); return !!s && !isFinite(evalValor(s)); };

// Dinheiro inteiro, vírgula de milhar (padrão da Vida Financeira).
const fmtPadrao = (n) => 'R$ ' + Math.round(Number(n) || 0).toLocaleString('en-US');

// Mostra o resultado embaixo do campo — só quando há operador, pra não poluir
// quando o valor é um número simples. Verde quando fecha, vermelho quando não.
export function PreviaConta({ txt, fmt = fmtPadrao }) {
  if (!/[+\-*/]/.test(String(txt == null ? '' : txt))) return null;
  const v = evalValor(txt);
  return (
    <div style={{ fontSize: 11.5, color: isFinite(v) ? '#1a7a4f' : '#c0392b', textAlign: 'right', marginTop: 3 }}>
      {isFinite(v) ? '= ' + fmt(v) : 'conta inválida'}
    </div>
  );
}
