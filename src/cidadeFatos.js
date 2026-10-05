// Fatos curados de cidade para o Modo Viagem (saudação da senha e da capa).
// Chave = nome da cidade (igual ao campo `cidade` da viagem, ou uma das partes
// quando a viagem combina cidades, ex.: "Natal · Pipa"). Frases curtas e verificadas.
export const CIDADE_FATOS = {
  Paraty: [
    'O centro histórico de Paraty, com suas ruas de pedra "pé de moleque", é tombado pelo IPHAN como patrimônio nacional.',
    'Em 2019, Paraty e Ilha Grande viraram o primeiro sítio misto (cultura + natureza) do Brasil reconhecido como Patrimônio Mundial pela UNESCO.',
    'Nas marés de lua cheia, o mar sobe e entra pelas ruas do centro — feitas inclinadas de propósito pra "lavar" a cidade.',
    'Paraty foi porto do Caminho do Ouro: o ouro de Minas descia a Serra do Mar até o cais da cidade.',
    'A tradição de alambiques é tão forte por aqui que "parati" já foi usado como sinônimo de cachaça.',
    'A FLIP nasceu em Paraty em 2003 e colocou a cidade no mapa literário do mundo.',
  ],
  Natal: [
    'Natal foi fundada em 25 de dezembro de 1599 — e é daí que vem o nome da cidade.',
    'O Forte dos Reis Magos tem forma de estrela e começou a ser erguido em 6 de janeiro de 1598, Dia de Reis.',
    'De 1633 a 1654 a cidade ficou nas mãos dos holandeses, que a chamaram de Nova Amsterdã.',
    'Na Segunda Guerra, a base aérea vizinha era o "Trampolim da Vitória": dali os aviões aliados cruzavam o Atlântico rumo à África.',
    'Em janeiro de 1943, Roosevelt e Getúlio Vargas se encontraram em Natal, a bordo de um navio no rio Potengi.',
    'O Morro do Careca, em Ponta Negra, é uma duna de mais de 100 metros; subir nele é proibido desde os anos 1990, para ela não se desfazer.',
    'O maior cajueiro do mundo fica em Pirangi do Norte, pertinho de Natal: sozinho, cobre uns 8.500 m².',
    'O Parque das Dunas, criado em 1977, é um dos maiores parques urbanos do Brasil — mais de mil hectares de duna e Mata Atlântica dentro da cidade.',
    'Câmara Cascudo, o maior estudioso do folclore brasileiro, nasceu, viveu e escreveu a vida toda em Natal.',
    'Ginga com tapioca — peixinho frito dentro da tapioca — é o lanche clássico da praia da Redinha.',
    'A Barreira do Inferno, ao lado de Natal, foi a primeira base de lançamento de foguetes da América do Sul (1965).',
  ],
  Pipa: [
    'Pipa é um distrito de Tibau do Sul, a uns 85 km de Natal.',
    'O nome vem dos navegadores portugueses: do mar, uma pedra da costa parecia um barril de vinho — uma pipa.',
    'Na Baía dos Golfinhos, os botos-cinza aparecem quase todo dia; a pé, só se chega lá com a maré baixa.',
    'Vista do alto do Chapadão, a Praia do Amor tem o desenho de um coração.',
    'Era uma vila de pescadores até os anos 1970, quando os surfistas descobriram as ondas daqui.',
    'As falésias coloridas de Pipa são de arenito e argila, esculpidas pelo mar e pela chuva.',
    'De novembro a maio, tartarugas-de-pente sobem as praias da região para desovar.',
    'O Santuário Ecológico de Pipa protege, desde os anos 1980, um pedaço de Mata Atlântica com trilhas e mirantes sobre o mar.',
    'A Lagoa de Guaraíras, em Tibau do Sul, era de água doce até 1924, quando uma enchente rompeu a barra e a ligou ao mar.',
  ],
};

// Retorna um fato da cidade, girando por dia (muda todo dia). null se não houver.
// `cidade` pode ser combinada ("Natal · Pipa"): junta os fatos de cada
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
