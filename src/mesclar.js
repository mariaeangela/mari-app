// A regra que impede duas edições no mesmo instante de se apagarem.
//
// Todo store monta o documento novo a partir do `data` DAQUELE render:
// `persist({ ...data, aprendizados })`. Se duas coisas gravam quase juntas — o
// caso real: sair do campo "principais temas" (onBlur) e tocar em "anotar" no
// mesmo instante —, a segunda foi construída sobre um `data` que já está velho e
// APAGAVA a primeira, sem erro nenhum na tela. Foi assim que uma anotação de
// terapia sumiu segundos depois de ser escrita (ago/2026).
//
// `rebasear` conserta: se o estado atual (`prev`) não é mais aquele em que `next`
// foi construído (`base`), aplica só o que de fato MUDOU por cima do atual.
// As duas gravações sobrevivem, em qualquer ordem.
//
// Estava copiado no lifeStore e no calendarStore. Duplicata é como o bug dos
// campos de dinheiro entrou (uma cópia nasceu sem a trava), então mora aqui, uma só.
export function rebasear(prev, base, next) {
  if (prev === base) return next;                 // ninguém mexeu no meio: usa direto
  const out = { ...prev };
  // fatia que ESTA gravação mexeu (comparada com a base dela) entra por cima
  for (const k of Object.keys(next)) if (next[k] !== base[k]) out[k] = next[k];
  // fatia que ESTA gravação removeu sai também
  for (const k of Object.keys(base)) if (!(k in next) && k in out) delete out[k];
  return out;
}
