// Fatos curados de cidade para o Modo Viagem (saudação da senha e da capa).
// Chave = nome da cidade (igual ao campo `cidade` da viagem, ou uma das partes
// quando a viagem combina cidades, ex.: "Nova York · Chicago"). Frases curtas e verificadas.
export const CIDADE_FATOS = {
  Paraty: [
    'O centro histórico de Paraty, com suas ruas de pedra "pé de moleque", é tombado pelo IPHAN como patrimônio nacional.',
    'Em 2019, Paraty e Ilha Grande viraram o primeiro sítio misto (cultura + natureza) do Brasil reconhecido como Patrimônio Mundial pela UNESCO.',
    'Nas marés de lua cheia, o mar sobe e entra pelas ruas do centro — feitas inclinadas de propósito pra "lavar" a cidade.',
    'Paraty foi porto do Caminho do Ouro: o ouro de Minas descia a Serra do Mar até o cais da cidade.',
    'A tradição de alambiques é tão forte por aqui que "parati" já foi usado como sinônimo de cachaça.',
    'A FLIP nasceu em Paraty em 2003 e colocou a cidade no mapa literário do mundo.',
  ],
  'Nova York': [
    'O Central Park foi o primeiro grande parque público paisagístico dos EUA — projeto de Frederick Law Olmsted e Calvert Vaux, aberto a partir de 1858.',
    'A Estátua da Liberdade foi um presente da França, inaugurada em 1886; sua estrutura interna de ferro foi projetada por Gustave Eiffel.',
    'O metrô de Nova York funciona 24 horas por dia, todos os dias do ano.',
    'O apelido "The Big Apple" se popularizou nos anos 1920, a partir da gíria de jornalistas que cobriam corridas de cavalo.',
    'A Times Square leva esse nome porque o jornal The New York Times se mudou para lá em 1904.',
    'O teto da Grand Central Terminal mostra as constelações — e elas aparecem pintadas de trás pra frente.',
  ],
  Chicago: [
    'O primeiro arranha-céu do mundo, o Home Insurance Building, foi erguido em Chicago em 1885.',
    'Depois do Grande Incêndio de 1871, a cidade foi quase toda reconstruída — e virou um berço da arquitetura moderna.',
    'Em 1900, uma obra de engenharia inverteu o sentido do rio Chicago para afastar o esgoto do lago Michigan.',
    'Todo dia de São Patrício, desde 1962, o rio Chicago é tingido de verde.',
    'O "Cloud Gate" — o "Feijão" (The Bean), de Anish Kapoor — foi inaugurado no Millennium Park em 2004.',
    'A deep-dish, a pizza de massa alta, nasceu em Chicago nos anos 1940.',
  ],
};

// Retorna um fato da cidade, girando por dia (muda todo dia). null se não houver.
// `cidade` pode ser combinada ("Nova York · Chicago"): junta os fatos de cada
// sub-cidade conhecida num só rodízio.
export function getCidadeFato(cidade, date = new Date()) {
  const partes = String(cidade || '').split(/[·&,/]/).map(s => s.trim()).filter(Boolean);
  const arr = [];
  const vistos = new Set();
  for (const p of (partes.length ? partes : [cidade])) {
    (CIDADE_FATOS[p] || []).forEach(f => { if (!vistos.has(f)) { vistos.add(f); arr.push(f); } });
  }
  if (!arr.length) return null;
  const inicioAno = new Date(date.getFullYear(), 0, 0);
  const doy = Math.floor((date - inicioAno) / 86400000);
  return arr[doy % arr.length];
}
