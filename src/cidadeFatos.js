// Fatos curados de cidade para o Modo Viagem (saudação da senha e da capa).
// Chave = nome da cidade (igual ao campo `cidade` da viagem). Frases curtas e verificadas.
export const CIDADE_FATOS = {
  Paraty: [
    'O centro histórico de Paraty, com suas ruas de pedra "pé de moleque", é tombado pelo IPHAN como patrimônio nacional.',
    'Em 2019, Paraty e Ilha Grande viraram o primeiro sítio misto (cultura + natureza) do Brasil reconhecido como Patrimônio Mundial pela UNESCO.',
    'Nas marés de lua cheia, o mar sobe e entra pelas ruas do centro — feitas inclinadas de propósito pra "lavar" a cidade.',
    'Paraty foi porto do Caminho do Ouro: o ouro de Minas descia a Serra do Mar até o cais da cidade.',
    'A tradição de alambiques é tão forte por aqui que "parati" já foi usado como sinônimo de cachaça.',
    'A FLIP nasceu em Paraty em 2003 e colocou a cidade no mapa literário do mundo.',
  ],
};

// Retorna um fato da cidade, girando por dia (muda todo dia). null se a cidade não tiver fatos.
export function getCidadeFato(cidade, date = new Date()) {
  const arr = CIDADE_FATOS[cidade];
  if (!arr || !arr.length) return null;
  const inicioAno = new Date(date.getFullYear(), 0, 0);
  const doy = Math.floor((date - inicioAno) / 86400000);
  return arr[doy % arr.length];
}
