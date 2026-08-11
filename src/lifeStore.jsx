// Store da aba Life (sincroniza na nuvem, igual aos Salvos/Calendário).
// Por enquanto guarda a seção "compras"; as outras seções entram aqui depois.
//
//   life.compras = {
//     listas: [{ id, nome }],                       // listas próprias (além das fixas)
//     itens:  [{ id, titulo, listaId, dataLimite?, orcamento?, links: [], comprado }]
//   }
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { fetchLife, pushLife, saveLifeNow, onSyncStatus, UNREACHABLE, RESGATE, temPendente, guardarNaLixeira, definirBaseLife, gravarLocal } from './cloud';

const KEY = 'diagonal_life';
const P = (id, data, valor, local, treino, periodo) => ({ id, data, valor, local, treino, periodo });
const DEFAULT_PESOS = [
  P('p1', '2026-01-28', 84.55, 'Smart Fit Pinheiros', 'pos'),
  P('p2', '2026-02-10', 86.75, 'Smart Fit Pinheiros', 'pos'),
  P('p3', '2026-02-11', 86.25, 'Smart Fit Pinheiros', 'pos'),
  P('p4', '2026-02-12', 84.10, 'Smart Fit Pinheiros', 'pre'),
  P('p5', '2026-02-19', 84.20, 'Smart Fit Pinheiros', 'pos'),
  P('p6', '2026-02-24', 86.20, 'Smart Fit Teodoro', 'pos'),
  P('p7', '2026-03-03', 84.85, 'Smart Fit Teodoro', 'pre'),
  P('p8', '2026-03-16', 85.35, 'Smart Fit Teodoro', 'pre'),
  P('p9', '2026-03-23', 85.75, 'Smart Fit Teodoro', 'pos'),
  P('p11', '2026-04-14', 84.75, 'Smart Fit Teodoro', 'pos'),
  P('p12', '2026-04-16', 85.40, 'Smart Fit Teodoro', 'pos'),
  P('p13', '2026-05-07', 86.30, 'Smart Fit Teodoro', 'pos'),
  P('p14', '2026-05-15', 84.80, 'Smart Fit Teodoro', 'pos'),
  P('p15', '2026-05-18', 85.95, 'Smart Fit Teodoro', 'pos'),
  P('p16', '2026-05-19', 84.80, 'Smart Fit Teodoro', 'pos'),
  P('p17', '2026-05-20', 85.10, 'Smart Fit Teodoro', 'pos'),
  P('p18', '2026-05-27', 87.00, 'Smart Fit Teodoro', 'pos', 'noite'),
  P('p19', '2026-05-31', 85.95, 'Smart Fit Teodoro', 'pos', 'manha'),
  P('p20', '2026-06-02', 87.45, 'Smart Fit Teodoro', 'pos', 'manha'),
  P('p21', '2026-06-05', 86.85, 'Smart Fit Teodoro', 'pos', 'manha'),
  P('p22', '2026-06-09', 86.80, 'Smart Fit Teodoro', 'pos', 'manha'),
  P('p23', '2026-06-11', 85.50, 'Smart Fit Teodoro', 'pos', 'manha'),
];
const DEFAULT = { compras: { listas: [], itens: [] }, cultural: { itens: [] }, recorrentes: [], financas: { snapshots: [], usdRate: null }, saude: { pesos: DEFAULT_PESOS, remedios: [], vacinas: [], menstruacao: [] }, musica: [], assistir: [], marcos: [], coisasCaras: [], viagens: [], viagensFuturas: [], leituras: [], gastosItens: [], acompLeituras: [], legendas: [{ id: 'leg-gerais', nome: 'Gerais', itens: [] }], viagensQuero: [], planosViagem: [], ingles: [], amorosa: [], vr: { ciclos: {} }, possoGastar: { ciclos: {} }, trechos: [], albuns: [], gastoSubcats: {} };

// Moedas (item da compra guarda a `moeda`; padrão BRL).
export const MOEDAS = [
  { id: 'BRL', simbolo: 'R$' },
  { id: 'USD', simbolo: 'US$' },
  { id: 'EUR', simbolo: '€' },
  { id: 'GBP', simbolo: '£' },
];
export const simboloMoeda = (id) => (MOEDAS.find(m => m.id === id)?.simbolo) || 'R$';

// Plano-exemplo já preenchido (aparece na 1ª vez; depois é editável/apagável).
export const DEFAULT_PLANOS = {
  lista: [{ id: 'adocao-gato', nome: 'Adoção Gato' }],
  infos: [
    { id: 'i1', planoId: 'adocao-gato', titulo: 'Segurança (gatificar)', texto: '• Redes de proteção (malha 3–5 cm) em janelas, sacadas e basculantes — inegociável.\n• Afaste plantas tóxicas (lírio, comigo-ninguém-pode, costela-de-adão, jiboia).\n• Proteja fios; guarde elásticos, linhas e agulhas (ele engole).' },
    { id: 'i2', planoId: 'adocao-gato', titulo: 'Enxoval', texto: '• Comedouros de inox/cerâmica/vidro (plástico dá acne felina).\n• Fonte de água (gato bebe pouco; previne problema renal).\n• Ração boa + sachês; transição gradual da que ele já comia.\n• 2 caixas de areia grandes (regra: nº de gatos + 1) + areia + pá.\n• Arranhador vertical firme, cama quentinha, caixa de transporte.' },
    { id: 'i3', planoId: 'adocao-gato', titulo: 'Comportamento', texto: '• Amam altura — libere o topo de estantes / prateleiras.\n• Dia da chegada: comece num cômodo só (transporte aberto, comida, água, areia); ele sai no tempo dele.\n• Rabo rápido = irritação (não alegria); orelhas pra trás = medo.\n• Arisco? Não force: chão, voz calma, petisco — deixe ele vir.' },
    { id: 'i4', planoId: 'adocao-gato', titulo: 'Rotina', texto: '• Veterinário felino: check-up, vacinas (V4/V5 + antirrábica), castração.\n• Caixa de areia limpa 2x/dia (suja = xixi fora, em protesto).\n• 15–30 min/dia de brincadeira (varinha) contra tédio e ansiedade.' },
  ],
  itens: [
    { id: 'k1', planoId: 'adocao-gato', texto: 'Instalar redes de proteção (malha 3–5 cm) em janelas, sacadas e basculantes', feito: false },
    { id: 'k2', planoId: 'adocao-gato', texto: 'Conferir e afastar/descartar plantas tóxicas', feito: false },
    { id: 'k3', planoId: 'adocao-gato', texto: 'Proteger fios elétricos e guardar elásticos/linhas/agulhas', feito: false },
    { id: 'k4', planoId: 'adocao-gato', texto: 'Comprar comedouros de inox/cerâmica/vidro', feito: false },
    { id: 'k5', planoId: 'adocao-gato', texto: 'Comprar fonte de água (ou potes espalhados)', feito: false },
    { id: 'k6', planoId: 'adocao-gato', texto: 'Comprar ração de qualidade + sachês (perguntar o que ele comia)', feito: false },
    { id: 'k7', planoId: 'adocao-gato', texto: 'Comprar 2 caixas de areia + areia sanitária + pá', feito: false },
    { id: 'k8', planoId: 'adocao-gato', texto: 'Comprar arranhador vertical estável', feito: false },
    { id: 'k9', planoId: 'adocao-gato', texto: 'Comprar cama/toca e caixa de transporte', feito: false },
    { id: 'k10', planoId: 'adocao-gato', texto: 'Liberar altura (topo de estante / prateleiras pro gato)', feito: false },
    { id: 'k11', planoId: 'adocao-gato', texto: 'Preparar o cômodo do dia da chegada (transporte aberto, comida, água, areia)', feito: false },
    { id: 'k12', planoId: 'adocao-gato', texto: 'Achar veterinário felino (check-up, vacinas V4/V5 + antirrábica, castração)', feito: false },
    { id: 'k13', planoId: 'adocao-gato', texto: 'Rotina: limpar a caixa de areia 2x/dia', feito: false },
    { id: 'k14', planoId: 'adocao-gato', texto: 'Reservar 15–30 min/dia de brincadeira', feito: false },
  ],
};
// Histórico de salários (seed; vira editável e sincroniza após a 1ª edição).
export const DEFAULT_SALARIOS = [
  { ano: 2017, idade: 18, cargo: 'Estágio — Alumni', meses: [0, 0, 0, 0, 0, 0, 1025, 1025, 1025, 1025, 1025, 1025], extra: 0, bonus: 0, yoy: null },
  { ano: 2018, idade: 19, cargo: 'Estágio — J USP / IFMoney', meses: [1025, 1025, 1025, 1025, 1025, 1025, 1025, 1025, 1800, 1800, 1800, 1800], extra: 0, bonus: 0, yoy: 150 },
  { ano: 2019, idade: 20, cargo: 'Estágio — IFMoney / Folha', meses: [1800, 1800, 1800, 1800, 2300, 2300, 2300, 2300, 2300, 2300, 2300, 2300], extra: 0, bonus: 0, yoy: 66 },
  { ano: 2020, idade: 21, cargo: 'Estágio — CNN', meses: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1000], extra: 0, bonus: 0, yoy: null },
  { ano: 2021, idade: 22, cargo: 'Estágio CNN / Rep. Forbes', meses: [1000, 1000, 1000, 1000, 1000, 4500, 4500, 4500, 4500, 4500, 4500, 4500], extra: 0, bonus: 0, yoy: 43 },
  { ano: 2022, idade: 23, cargo: 'Trainee — Itaú', meses: [3845, 5682, 6097, 5758, 5655, 5754, 6283, 5452, 5347, 5918, 6358, 5738], extra: 6190, bonus: 12085, yoy: 136 },
  { ano: 2023, idade: 24, cargo: 'Trainee Itaú / Anl. Research', meses: [5969, 5867, 5809, 9926, 9926, 13991, 9977, 11952, 10144, 10403, 10950, 4744], extra: 26000, bonus: 33276, yoy: 96 },
  { ano: 2024, idade: 25, cargo: 'Analista — Research', meses: [7882, 10507, 11200, 11957, 11579, 9830, 8258, 9969.11, 11731.27, 12512.76, 12134.35, 12242.76], extra: 44992.80, bonus: 78945, yoy: 50, pl: 80325 },
  { ano: 2025, idade: 26, cargo: 'Analista — Research', meses: [11606.31, 12731.16, 12162.16, 10387.07, 13944.99, 14251.76, 11420.15, 14050.01, 14303.19, 14414.89, 14739.14, 7685.16], extra: 39508.75, bonus: 116357.66, yoy: 21, pl: 216318.27 },
  { ano: 2026, idade: 27, cargo: 'Analista Research / Ad Research', meses: [14633.71, 14515.28, 15814.91, 11497.07, 15913.44, 0, 0, 0, 0, 0, 0, 0], extra: 18257.71, bonus: 161198.34, yoy: -18, pl: 366965.04, metaPL: 400000 },
];

// Gastos por mês: ponto de partida de quem nunca editou (itens = [{ categoria, valor }]).
// Totais 2026 (jan–jul) importados de D:ida financeira.xlsx. Isto NÃO é um dos
// bilhetes que rodavam a cada abertura — é só o valor inicial, usado enquanto ela
// não tiver mexido; a partir da 1ª edição o documento dela manda.
const GASTOS_TOTAIS_2026 = [
  { mes: '2026-01', itens: [{ categoria: 'Fixos', valor: 6007.64 }, { categoria: 'Mercado', valor: 1356.96 }, { categoria: 'Uber', valor: 582.23 }, { categoria: 'Trabalho', valor: 247.31 }, { categoria: 'Mãe', valor: 1066.05 }, { categoria: 'Saúde', valor: 768.25 }, { categoria: 'Viagem', valor: 3104.94 }, { categoria: 'Coisas', valor: 207.3 }, { categoria: 'Roupa', valor: 659.9 }, { categoria: 'Skin care', valor: 1378.5 }, { categoria: 'Bobeira', valor: 447.78 }, { categoria: 'Rolês', valor: 1580.01 }, { categoria: 'Presentes', valor: 170.5 }] },
  { mes: '2026-02', itens: [{ categoria: 'Fixos', valor: 6309.63 }, { categoria: 'Mercado', valor: 457.76 }, { categoria: 'Uber', valor: 707.07 }, { categoria: 'Trabalho', valor: 165.56 }, { categoria: 'Mãe', valor: 328.26 }, { categoria: 'Saúde', valor: 776.7 }, { categoria: 'Viagem', valor: 9757.46 }, { categoria: 'Coisas', valor: 6607.42 }, { categoria: 'Roupa', valor: 882.59 }, { categoria: 'Skin care', valor: 19.0 }, { categoria: 'Bobeira', valor: 36.85 }, { categoria: 'Rolês', valor: 1173.78 }, { categoria: 'Presentes', valor: 40.0 }] },
  { mes: '2026-03', itens: [{ categoria: 'Fixos', valor: 5771.78 }, { categoria: 'Mercado', valor: 1508.6 }, { categoria: 'Uber', valor: 845.11 }, { categoria: 'Trabalho', valor: 888.44 }, { categoria: 'Mãe', valor: 457.65 }, { categoria: 'Saúde', valor: 265.91 }, { categoria: 'Viagem', valor: 3545.08 }, { categoria: 'Coisas', valor: 1663.82 }, { categoria: 'Roupa', valor: 4333.68 }, { categoria: 'Skin care', valor: 300.61 }, { categoria: 'Bobeira', valor: 69.8 }, { categoria: 'Rolês', valor: 1654.81 }, { categoria: 'Presentes', valor: 278.0 }] },
  { mes: '2026-04', itens: [{ categoria: 'Fixos', valor: 5577.8 }, { categoria: 'Mercado', valor: 1402.15 }, { categoria: 'Uber', valor: 519.88 }, { categoria: 'Trabalho', valor: 243.79 }, { categoria: 'Mãe', valor: 629.58 }, { categoria: 'Saúde', valor: 2763.86 }, { categoria: 'Viagem', valor: 14067.05 }, { categoria: 'Coisas', valor: 1180.34 }, { categoria: 'Roupa', valor: 80.0 }, { categoria: 'Skin care', valor: 199.9 }, { categoria: 'Bobeira', valor: 134.39 }, { categoria: 'Rolês', valor: 584.54 }] },
  { mes: '2026-05', itens: [{ categoria: 'Fixos', valor: 5564.89 }, { categoria: 'Mercado', valor: 188.83 }, { categoria: 'Uber', valor: 494.56 }, { categoria: 'Trabalho', valor: 90.81 }, { categoria: 'Mãe', valor: 137.41 }, { categoria: 'Saúde', valor: 2700.0 }, { categoria: 'Viagem', valor: 7745.87 }, { categoria: 'Coisas', valor: 111.1 }, { categoria: 'Roupa', valor: 60.0 }, { categoria: 'Skin care', valor: 132.19 }, { categoria: 'Bobeira', valor: 130.62 }, { categoria: 'Rolês', valor: 467.75 }, { categoria: 'Presentes', valor: 40.0 }] },
  { mes: '2026-06', itens: [{ categoria: 'Fixos', valor: 6375.16 }, { categoria: 'Mercado', valor: 1876.36 }, { categoria: 'Uber', valor: 906.45 }, { categoria: 'Trabalho', valor: 522.3 }, { categoria: 'Mãe', valor: 430.86 }, { categoria: 'Saúde', valor: 2676.01 }, { categoria: 'Viagem', valor: 1000.42 }, { categoria: 'Coisas', valor: 816.98 }, { categoria: 'Roupa', valor: 79.8 }, { categoria: 'Skin care', valor: 269.87 }, { categoria: 'Bobeira', valor: 192.88 }, { categoria: 'Rolês', valor: 1605.19 }, { categoria: 'Presentes', valor: 533.7 }] },
  { mes: '2026-07', itens: [{ categoria: 'Fixos', valor: 4510.13 }, { categoria: 'Mercado', valor: 257.61 }, { categoria: 'Uber', valor: 116.85 }, { categoria: 'Saúde', valor: 566.0 }, { categoria: 'Viagem', valor: 1355.58 }, { categoria: 'Coisas', valor: 20.89 }, { categoria: 'Skin care', valor: 280.33 }, { categoria: 'Bobeira', valor: 134.8 }, { categoria: 'Rolês', valor: 572.15 }] },
];
export const DEFAULT_GASTOS = GASTOS_TOTAIS_2026;

// Aprendizados: tópicos (assuntos) + notas organizadas por tópico (seed; vira editável e
// sincroniza após a 1ª edição). nota = { id, topicoId, titulo, itens: [string] }.
export const DEFAULT_APRENDIZADOS = {
  topicos: [{ id: 'cafe', nome: 'Café' }, { id: 'tecidos', nome: 'Tecidos' }, { id: 'fotografia', nome: 'Fotografia analógica' }, { id: 'vinhos', nome: 'Vinhos' }, { id: 'vida', nome: 'Vida' }, { id: 'maquiagem', nome: 'Maquiagem' }],
  notas: [
    { id: 'cafe-grao', topicoId: 'cafe', titulo: 'Entendendo o grão', itens: [
      'Café é uma fruta azedinha; colhido maduro, ganha doçura.',
      'A torra pode preservar as características do café.',
      'Torra escura esconde as características — você sente só o amargor (esconde defeitos; costuma ser grão de pior qualidade).',
      'Muito torrado, o amargor vem do gosto de queimado.',
      'O amargor também vem da cafeína — todo café é um pouco amargo.',
      'Quanto mais transparente, menos corpo o café tem.',
      'Na extração vem primeiro a acidez, depois a doçura, depois o amargor.',
      '1ª dose: mais encorpada e ácida · 2ª: corpo médio e doce · 3ª: pouco encorpada e amarga.',
    ] },
    { id: 'cafe-v60', topicoId: 'cafe', titulo: 'Hario V60', itens: [
      'Pensado para a água passar mais rápido pelo café → café frutado e mais ácido.',
      'O furo do cone é maior: a água fica menos tempo em contato com o pó do que na Melitta → menos amargor.',
      'Cone de 60°.',
      'Filtro pode ser natural ou lavado (branqueado).',
    ] },
    { id: 'cafe-preparo', topicoId: 'cafe', paiId: 'cafe-v60', titulo: 'Como fazer', itens: [
      'Dobre a lateral do papel.',
      'Sempre escalde o filtro de papel e todo o suporte.',
      'Deixe o café nivelado (reto) no filtro.',
      'Interrompa a extração quando começar o "pinga-pinga" — para cortar o amargor.',
    ] },
    { id: 'cafe-classica', topicoId: 'cafe', paiId: 'cafe-v60', titulo: 'Receita clássica', itens: [
      'Proporção 1:10 (30 g de café moído para 300 ml de água).',
      'Pré-infusão (bloom): pouca água, sempre em movimento circular, só para molhar o café (é a 1ª dose).',
      'Depois acrescente de pouco em pouco — cerca de 4 doses de 60 ml.',
    ] },
    { id: 'cafe-winton', topicoId: 'cafe', paiId: 'cafe-v60', titulo: 'Receita Matt Winton', itens: [
      '20 g de café · proporção 1:15 (300 ml de água).',
      'Água a 93 °C (termômetro).',
      'Moagem não pode ficar muito fina.',
      'Comece despejando no meio e depois gire.',
      '5 doses de 60 ml.',
      '1ª dose de 60 ml e espere 30 segundos.',
      'Da 2ª em diante, despeje quando a água parar de jorrar do coador.',
      'Não reaqueça a chaleira.',
    ] },
    { id: 'cafe-tetsu', topicoId: 'cafe', paiId: 'cafe-v60', titulo: 'Receita Tetsu Kasuya (4:6)', itens: [
      '20 g de café, 300 ml de água.',
      '5 pours de 3× o peso do café (5 × 3 × 20 g = 5 doses de 60 ml).',
      '45 segundos entre cada dose.',
      '2 primeiras doses ajustam doçura e acidez: iguais = equilibrado · 1ª menor = mais doce · 2ª menor = mais ácido.',
      '3 últimas doses ajustam a força: 3 iguais = equilibrado · 2 doses = mais fraco · 4 doses = mais forte.',
    ] },
    { id: 'cafe-marcas', topicoId: 'cafe', titulo: 'Cafés & marcas', itens: [
      'Dengo',
      'Urbe',
      'Dutra',
    ] },

    // ---- Tecidos ----
    { id: 'tec-geral', topicoId: 'tecidos', titulo: 'Informações gerais', itens: [
      'Tecidos são tipos de tecido; fibras são a composição — a matéria com que o tecido é fabricado.',
      'Desconfie do que não amassa: tecido de qualidade se adapta ao corpo e vai amassar.',
      'Misturar peça de fibra natural com fibra artificial no mesmo look fica horroroso — destaca a diferença entre elas.',
      'Lavagem: a peça pode ser feita com fio já tingido ou ser tingida depois de pronta. Tingida depois solta mais tinta na lavagem — observe a costura dos fios para tentar descobrir.',
    ] },

    { id: 'tec-tipos', topicoId: 'tecidos', titulo: 'Tipos de tecido', itens: [] },
    { id: 'tec-crepe', topicoId: 'tecidos', paiId: 'tec-tipos', titulo: 'Crepe', itens: [
      'Necessariamente um lado fosco e outro brilhoso.',
      'Fuja de crepe duna ou crepe amassado: baixa qualidade, feito de poliéster.',
      'Pode ser vendido como tecido chique, mas a composição pode ser terrível.',
    ] },
    { id: 'tec-sarja', topicoId: 'tecidos', paiId: 'tec-tipos', titulo: 'Sarja', itens: [
      'Material sarjado, tipo espinha de peixe.',
      'Geralmente algodão com um pouco de elastano para conforto — nessa composição, é 10/10.',
    ] },
    { id: 'tec-alfaiataria', topicoId: 'tecidos', paiId: 'tec-tipos', titulo: 'Alfaiataria', itens: [
      'Tecido mais estruturado, geralmente com pregas.',
      'O de maior qualidade vem forrado.',
    ] },
    { id: 'tec-tricot', topicoId: 'tecidos', paiId: 'tec-tipos', titulo: 'Tricot', itens: [] },
    { id: 'tec-malha', topicoId: 'tecidos', paiId: 'tec-tipos', titulo: 'Malha', itens: [] },

    { id: 'tec-nat', topicoId: 'tecidos', titulo: 'Fibras naturais', itens: [
      'Perfeitas: vêm totalmente da natureza, confortáveis e usadas como são naturalmente.',
    ] },
    { id: 'tec-algodao', topicoId: 'tecidos', paiId: 'tec-nat', titulo: 'Algodão', itens: [
      'Vegetal (vem da semente).',
      'Supremacia! Fresco, confortável, natural — 10/10.',
      'Existem algodões de baixa qualidade: dá pra ver em peças brancas — em geral, quanto mais transparente, pior.',
      'Algodão egípcio: altíssima qualidade e caríssimo.',
      'Algodão pima: peruano de alta qualidade, o melhor algodão do mundo.',
      'Algodão peruano: não tão bom quanto o pima, mas ainda um dos melhores do mercado.',
    ] },
    { id: 'tec-seda', topicoId: 'tecidos', paiId: 'tec-nat', titulo: 'Seda', itens: [
      'Animal (vem da lagarta).',
      'Chiquérrima.',
      'Não gosta de água nem suor (lavar a seco; ruim para eventos em dia de muito calor). Mancha com bebida. Usar com muito cuidado.',
    ] },
    { id: 'tec-couro', topicoId: 'tecidos', paiId: 'tec-nat', titulo: 'Couro', itens: [
      'Animal (ruim para veganos).',
      'Excelente tecido: pega o formato do corpo; precisa ser hidratado.',
      'Quanto mais jovem o animal, mais macio o couro.',
      'Para roupas, couro de pelica é o melhor.',
    ] },
    { id: 'tec-la', topicoId: 'tecidos', paiId: 'tec-nat', titulo: 'Lã', itens: [
      'Animal: pode ser de carneiro, coelho, alpaca, lhama ou cabra (a cabra faz o cashmere).',
      '100000% o melhor tecido do mundo.',
      'Boa para o frio e para o calor (lã fria).',
      'Difícil de achar hoje porque o fast fashion convenceu todo mundo de que é tecido de gente velha.',
    ] },
    { id: 'tec-linho', topicoId: 'tecidos', paiId: 'tec-nat', titulo: 'Linho', itens: [
      'Vegetal (vem do caule).',
      'Chique, lindíssimo e traz bastante estrutura.',
      'Amassa bastante (principalmente cores claras): 100% linho não é a melhor escolha para ocasião formal — amassa só de sentar à mesa.',
      'Pode dar bolinha se ficar em fricção com outras roupas.',
      'Guardar só com linho ou em saquinho para proteger.',
      'Linho pré-lavado pinica menos.',
    ] },
    { id: 'tec-sisal', topicoId: 'tecidos', paiId: 'tec-nat', titulo: 'Sisal', itens: [] },
    { id: 'tec-rafia', topicoId: 'tecidos', paiId: 'tec-nat', titulo: 'Ráfia', itens: [] },
    { id: 'tec-rami', topicoId: 'tecidos', paiId: 'tec-nat', titulo: 'Rami', itens: [] },
    { id: 'tec-juta', topicoId: 'tecidos', paiId: 'tec-nat', titulo: 'Juta', itens: [] },

    { id: 'tec-art', topicoId: 'tecidos', titulo: 'Fibras artificiais', itens: [
      'Muito boas: produzidas a partir de fontes naturais (como a celulose), mas que passam por processos químicos (feitas em laboratório) para virar fibra. Costumam ter bom sensorial.',
    ] },
    { id: 'tec-viscose', topicoId: 'tecidos', paiId: 'tec-art', titulo: 'Viscose', itens: [
      'Derivada da celulose; tecido fresco e leve.',
      'De cor clara pode ser transparente — precisa de forro de algodão.',
      'Para boa estrutura (calça, blazer), precisa de uns 40% de linho ou algodão.',
    ] },
    { id: 'tec-acetato', topicoId: 'tecidos', paiId: 'tec-art', titulo: 'Acetato', itens: [
      'Bom para misturar com viscose e fazer crepe.',
    ] },
    { id: 'tec-modal', topicoId: 'tecidos', paiId: 'tec-art', titulo: 'Modal', itens: [] },
    { id: 'tec-tencel', topicoId: 'tecidos', paiId: 'tec-art', titulo: 'Tencel / Liocel', itens: [] },
    { id: 'tec-cupro', topicoId: 'tecidos', paiId: 'tec-art', titulo: 'Cupro', itens: [] },

    { id: 'tec-sint', topicoId: 'tecidos', titulo: 'Fibras sintéticas', itens: [
      'Totalmente feitas em laboratório. Terríveis — fuja.',
    ] },
    { id: 'tec-poliamida', topicoId: 'tecidos', paiId: 'tec-sint', titulo: 'Poliamida', itens: [
      'Vem do plástico/petróleo.',
      'Único sintético que não é necessariamente tão ruim.',
      'Perfeita para exercício: permite a pele respirar e não pega cheiro.',
      'Cuidado com a composição: para academia, ok; para roupa formal, 50% poliamida + 50% viscose é má qualidade.',
    ] },
    { id: 'tec-acrilico', topicoId: 'tecidos', paiId: 'tec-sint', titulo: 'Acrílico', itens: [
      'FUJA.',
      'Pior material do mercado.',
      'Usado em roupas que querem imitar lã.',
      'Dá bolinha com muita facilidade.',
      'Pinica e causa alergia na pele.',
    ] },
    { id: 'tec-pu', topicoId: 'tecidos', paiId: 'tec-sint', titulo: 'Poliuretano (PU)', itens: [
      'Imitação de couro, terrível.',
      'Não é "se", é "quando" vai esfarelar.',
    ] },
    { id: 'tec-poliester', topicoId: 'tecidos', paiId: 'tec-sint', titulo: 'Poliéster', itens: [
      'Daria pra ficar 2 horas num palanque falando mal.',
      'Vem de plástico/petróleo.',
      'Não deixa a pele respirar; pega cheiro com muita facilidade.',
      'Sensível à temperatura: derrete se passar ou pegar muito sol e fica com aspecto brilhoso na roupa.',
      'É literalmente esfregar plástico no corpo — fugir principalmente em roupa de cama ou pijama (prejudica a qualidade do sono).',
      'Usado para dar estrutura: menos de 10% não chega a ser problema se a peça não for muito cara (pode estar num detalhe/desenho ou na própria estrutura).',
    ] },
    { id: 'tec-helanca', topicoId: 'tecidos', paiId: 'tec-sint', titulo: 'Helanca', itens: [
      'Poliéster com poliamida. Péssimo.',
    ] },
    { id: 'tec-bengaline', topicoId: 'tecidos', paiId: 'tec-sint', titulo: 'Bengaline', itens: [
      'Poliéster com elastano. Terrível.',
    ] },
    { id: 'tec-elastano', topicoId: 'tecidos', paiId: 'tec-sint', titulo: 'Elastano', itens: [
      'Tecido elástico. Bom até 10% misturado com naturais; ruim acima de 10% ou misturado com sintéticos.',
      'Geralmente usado em malhas.',
    ] },

    { id: 'tec-roupas', topicoId: 'tecidos', titulo: 'Tipos de roupa e melhores composições', itens: [
      'Praia e exercício físico: poliamida com elastano.',
      'Quentinhas: lã · alguns algodões · cashmere.',
    ] },

    { id: 'tec-cores', topicoId: 'tecidos', titulo: 'Cores', itens: [
      'Cor gosta de cor.',
      'Cores claras com cores claras; cores escuras com cores escuras (preto com tons escuros).',
      'Preto é usado para destacar cores.',
      'Branco vai com quase tudo.',
    ] },

    // ---- Fotografia analógica (câmera = nota de topo; filmes dentro) ----
    { id: 'foto-amarelinha', topicoId: 'fotografia', titulo: 'Amarelinha', itens: [] },
    { id: 'foto-amarelinha-fuji400', topicoId: 'fotografia', paiId: 'foto-amarelinha', titulo: 'Fujifilm Fuji Color ISO 400', itens: [
      'Funciona muito bem na luz do dia e em locais abertos.',
      'Em locais fechados não funciona: a foto fica muito escura.',
    ] },
    { id: 'foto-amarelinha-kodak200', topicoId: 'fotografia', paiId: 'foto-amarelinha', titulo: 'Kodak Gold ISO 200', itens: [] },

    { id: 'foto-rico', topicoId: 'fotografia', titulo: 'Ricó', itens: [] },
    { id: 'foto-rico-pentax200', topicoId: 'fotografia', paiId: 'foto-rico', titulo: 'Pentax colorido ISO 200', itens: [] },

    { id: 'foto-fuji', topicoId: 'fotografia', titulo: 'Fuji', itens: [] },
    { id: 'foto-fuji-pentaxpb400', topicoId: 'fotografia', paiId: 'foto-fuji', titulo: 'Pentax preto e branco ISO 400', itens: [] },

    // ---- Vinhos (categoria = grupoVinho; cada vinho é nota tipo 'vinho' dentro) ----
    { id: 'vinho-class', topicoId: 'vinhos', titulo: 'Classificação', itens: [
      'Reserva: ótimo — melhor ambiente de plantação da uva.',
      'Reservado: ruim — resto de todas as uvas da área.',
      'Sangue de boi: terrível — uva sem classificação.',
    ] },

    { id: 'vinho-branco', topicoId: 'vinhos', grupoVinho: true, titulo: 'Branco', itens: [
      'Chardonnay é uva branca que aguenta mais tempo. Outras uvas brancas começam a oxidar depois de dois anos.',
    ] },
    { id: 'vinho-elenemigo', topicoId: 'vinhos', paiId: 'vinho-branco', tipo: 'vinho', titulo: 'El Enemigo', nome: 'El Enemigo', pais: 'Argentina', regiao: 'Mendoza', uva: 'Chardonnay', info: 'Frutado e muito fácil de beber; abraça a boca com gentileza.', data: 'dez/24', itens: [] },
    { id: 'vinho-mosquita', topicoId: 'vinhos', paiId: 'vinho-branco', tipo: 'vinho', titulo: 'Mosquita Muerta', nome: 'Mosquita Muerta', pais: 'Argentina', regiao: 'Mendoza', uva: 'Blend de brancas', info: 'Muito frutado e bastante fresco, muito leve.', data: 'dez/24', itens: [] },

    { id: 'vinho-tinto', topicoId: 'vinhos', grupoVinho: true, titulo: 'Tinto', itens: [] },
    { id: 'vinho-orodeisani', topicoId: 'vinhos', paiId: 'vinho-tinto', tipo: 'vinho', titulo: 'Oro dei Sani', nome: 'Oro dei Sani', pais: 'Itália', regiao: 'Chianti', uva: 'Chianti Classico', info: 'Bastante seco, com bastante tanino. Forte (não funciona com comidas leves). Para ser tomado bem devagar. Muita presença no corpo depois de engolido.', data: 'dez/24', itens: [] },
    { id: 'vinho-cordero', topicoId: 'vinhos', paiId: 'vinho-tinto', tipo: 'vinho', titulo: 'Cordero con Piel de Lobo', nome: 'Cordero con Piel de Lobo', pais: 'Argentina', regiao: 'Mendoza', uva: 'Cabernet Sauvignon', info: 'Tinto bem leve e muito cítrico, pouco seco. Quase doce sem ser enjoativo; o sabor da uva é bem forte. Sem muita presença na boca, para comidas leves. Não recompraria.', data: 'dez/24', itens: [] },
    { id: 'vinho-noblealianza', topicoId: 'vinhos', paiId: 'vinho-tinto', tipo: 'vinho', titulo: 'Noble Alianza', nome: 'Noble Alianza', pais: 'Uruguai', uva: 'Cabernet Franc, Tannat, Marselan', info: 'Encorpado, ácido, não tânico, retrogosto intenso e muito curto, untuoso. Vinho bem barato, recompraria.', data: 'jan/25', itens: [] },

    { id: 'vinho-espumante', topicoId: 'vinhos', grupoVinho: true, titulo: 'Espumante', itens: [] },

    // ---- Vida (seção = nota de topo; subcategorias dentro) ----
    { id: 'vida-dinheiro', topicoId: 'vida', titulo: 'Valorização de dinheiro', itens: [] },
    { id: 'vida-dinheiro-compras', topicoId: 'vida', paiId: 'vida-dinheiro', titulo: 'Compras', itens: [
      'Colocar na lista, não fazer por impulso.',
      'Não comprar por dó ou por vergonha.',
      '"Se dinheiro não fosse um problema, eu ainda compraria?"',
      'Roupas e bolsas: (i) não comprar online; (ii) não comprar se não ficar perfeito.',
      'Sapatos: comprar um de cada vez, só se ficar muito confortável.',
      'Maquiagem: testar tons antes de comprar.',
    ] },
    { id: 'vida-dinheiro-cameras', topicoId: 'vida', paiId: 'vida-dinheiro', titulo: 'Câmeras', itens: [
      'Rebobinar no banheiro.',
      'Andar com elas em bolsinha para não dispararem sozinhas.',
    ] },
    { id: 'vida-dinheiro-aulas', topicoId: 'vida', paiId: 'vida-dinheiro', titulo: 'Aulas', itens: [
      'Não marcar se não for dar tempo de focar 100% nelas — ser sincera sobre a rotina.',
    ] },
    { id: 'vida-dinheiro-comida', topicoId: 'vida', paiId: 'vida-dinheiro', titulo: 'Comida', itens: [
      'Não gastar muito em churrascaria (não gosto de carne).',
      'Não matar a fome com alimentos de prazer.',
    ] },

    { id: 'vida-saude', topicoId: 'vida', titulo: 'Valorização de saúde', itens: [] },
    { id: 'vida-saude-exercicio', topicoId: 'vida', paiId: 'vida-saude', titulo: 'Exercício', itens: [
      'Ir de manhã ou no almoço; não deixar para fazer à noite.',
    ] },
    { id: 'vida-saude-comida', topicoId: 'vida', paiId: 'vida-saude', titulo: 'Comida', itens: [
      'Dar um tempo para a comida assentar.',
      'Não fazer compras sem lista.',
      'Não matar a fome com alimentos de prazer.',
      'Se for sair para um lugar que gosto de comer, não comer antes para tentar comer menos.',
      'Não me proibir de comer se sentir fome — mas procurar alimentos que não sejam besteira.',
      'Me perguntar sempre: estou com fome, com tédio, com ansiedade ou com vontade de comer?',
      'Não comer pratos com muito azeite, especialmente massa — não me cai bem.',
    ] },

    { id: 'vida-sentimentos', topicoId: 'vida', titulo: 'Sentimentos', itens: [
      'Não tomar atitudes nem falar nada muito estressada: tomar banho, ir tomar um ar e, se possível, esperar 24 horas.',
    ] },

    { id: 'vida-viagem', topicoId: 'vida', titulo: 'Viagem', itens: [
      'Ano novo ser em praia.',
    ] },

    // ---- Maquiagem (conhecimento + "Para comprar" espelha a lista de Compras) ----
    { id: 'maq-silicone', topicoId: 'maquiagem', titulo: 'Silicone (evitar)', itens: [
      'Reconhece pelos finais do nome do ingrediente:',
      'Termina em -cone',
      'Termina em -methicone',
      'Termina em -siloxane',
    ] },
    { id: 'maq-naofuncionou', topicoId: 'maquiagem', titulo: 'Não funcionou', itens: [
      'Fenty Eaze Drop (tom 9): muito escuro e alaranjado — mas dá pra usar com maquiagem forte.',
      'Born This Way corretivo (Natural Beige): muito escuro e alaranjado.',
      'Rare Beauty blush líquido (Love): muito escuro e fechado.',
      'Benefit Shellie blush: muito rosa claro.',
      'NARS Custard: fundo muito claro e frio (cold) — precisa ser mais quente (warm).',
    ] },
    { id: 'maq-recompra', topicoId: 'maquiagem', titulo: 'Comprarei novamente', itens: [
      'Dupla perfeita de corretivo: Lancôme Serum Glow 220 + Lancôme All Over.',
      'Contorno perfeito: Rare Beauty.',
      'Blindagem da Pop.',
    ] },
    { id: 'maq-paracomprar', topicoId: 'maquiagem', tipo: 'compras', listaId: 'maquiagem', grupo: 'Compras decididas', titulo: 'Para comprar', itens: [] },
    { id: 'maq-provar', topicoId: 'maquiagem', titulo: 'Para provar', itens: [] },
    { id: 'maq-provar-br', topicoId: 'maquiagem', paiId: 'maq-provar', tipo: 'compras', listaId: 'maquiagem', grupo: 'Experimentar BR', titulo: 'Tem no Brasil (experimentar)', itens: [] },
    { id: 'maq-provar-fora', topicoId: 'maquiagem', paiId: 'maq-provar', tipo: 'compras', listaId: 'maquiagem', grupo: 'Comprar fora', titulo: 'Comprar fora (experimentar)', itens: [] },
  ],
};

// Lista de compras "Maquiagem": espelhada pela seção "Para comprar" do tópico
// Maquiagem (Aprendizados). Semeada uma vez (flag maquiagemSeeded) para conviver
// com Compras que a usuária já tenha na nuvem (merge raso não juntaria sozinho).
function ensureCarteiraMesAtual(d) {
  const snaps = d.financas?.snapshots || [];
  if (!snaps.length) return d;                      // nunca inventa carteira do nada
  const agora = new Date();
  const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
  if (d.financas.autoMes === mesAtual) return d;    // já replicado (ou ela apagou de propósito)
  if (snaps.some(s => s.mes === mesAtual)) return { ...d, financas: { ...d.financas, autoMes: mesAtual } };
  const ultimo = snaps.reduce((a, b) => (a.mes > b.mes ? a : b));
  if (ultimo.mes >= mesAtual) return d;             // não há mês anterior pra replicar
  const novo = {
    id: 'f-auto-' + mesAtual,                       // determinístico: rodar 2× não duplica
    mes: mesAtual,
    usdRate: ultimo.usdRate,                        // ponto de partida; o ↻ buscar atualiza
    holdings: (ultimo.holdings || []).map((h, i) => ({ ...h, id: 'h-auto-' + mesAtual + '-' + i })),
  };
  return { ...d, financas: { ...d.financas, autoMes: mesAtual, snapshots: [...snaps, novo] } };
}

// ---- O que ainda roda a cada abertura ----
// Até ago/2026 eram 51 "bilhetes": pedaços de conteúdo que eu escrevia no código
// (o roteiro de NY, a programação da FLIP, as leituras) e que se reescreviam no
// documento dela a CADA abertura, pra sempre. Custavam ~165 KB em toda abertura
// e, pior, davam 51 chances por vez de passar por cima de algo que ela tinha
// editado — o que já aconteceu (ver "patch nunca mais apaga item que a Mari criou").
//
// Todos já tinham cumprido o que tinham pra fazer: o conteúdo está no documento
// DELA há meses, que é o lugar dele. Foram apagados daqui. O git guarda cada um,
// se um dia faltar alguma coisa.
//
// REGRA DAQUI PRA FRENTE: conteúdo novo entra pelo documento (ou por uma tela em
// que ela mesma cadastra), NÃO por um bilhete que roda pra sempre. Se um seed for
// mesmo inevitável, ele nasce com data de validade e é apagado assim que rodar.
//
// Ficaram só os três que PRECISAM rodar sempre, porque dependem da data de hoje:
//   · rolarComprasVencidas / rolarPlanosVencidos — puxam pra hoje o que venceu
//   · ensureCarteiraMesAtual — abre o mês novo da carteira com base no anterior
function runLifeSeeds(d) {
  const seeds = [rolarComprasVencidas, rolarPlanosVencidos, ensureCarteiraMesAtual];
  return seeds.reduce((acc, fn) => fn(acc), d);
}
const LifeContext = createContext(null);
const uid = (p = 'i') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
// Nota de terapia: normaliza a chave. `data` = chave estável (a data). Se o título
// virou "DATA - tema" e ainda não há campo `temas`, move o tema pra `temas` e devolve
// o título pra só a data. NUNCA mexe nos `itens` (os aprendizados salvos).
function _normTerapiaNota(n, dataLabel) {
  const out = { ...n, data: dataLabel };
  const tit = String(out.titulo || '');
  if (!out.temas && tit.startsWith(dataLabel) && tit.trim() !== dataLabel) {
    const suf = tit.slice(dataLabel.length).replace(/^[\s\-–—·|:>/]+/, '').trim();
    if (suf) out.temas = suf;
  }
  if (tit.startsWith(dataLabel)) out.titulo = dataLabel;
  return out;
}
const hojeISO = () => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
// Compras com data limite vencida (e não compradas) puxam pra hoje (pra não se perder).
function rolarComprasVencidas(d) {
  const compras = d.compras;
  if (!compras || !compras.itens) return d;
  const hk = hojeISO();
  let changed = false;
  const itens = compras.itens.map(i => {
    if (i.dataLimite && !i.comprado && i.dataLimite < hk) { changed = true; return { ...i, dataLimite: hk }; }
    return i;
  });
  return changed ? { ...d, compras: { ...compras, itens } } : d;
}

// Itens de checklist de Planos com prazo vencido (e não feitos) puxam pra hoje —
// mesmo comportamento das compras/tarefas, pra não sumirem da capa de Hoje.
function rolarPlanosVencidos(d) {
  const planos = d.planos;
  if (!planos || !planos.itens) return d;
  const hk = hojeISO();
  let changed = false;
  const itens = planos.itens.map(i => {
    if (i.prazo && !i.feito && i.prazo < hk) { changed = true; return { ...i, prazo: hk }; }
    return i;
  });
  return changed ? { ...d, planos: { ...planos, itens } } : d;
}

// Modo Viagem: viagem "ativa" hoje = hoje entre a VÉSPERA do início e o fim (inclusive).
// (decisão da Mari: liga da véspera ao fim.) Funções puras p/ reuso (capa, faixa, senha).
function ymdLocal(d = new Date()) { const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; }
function vesperaYmd(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return ymdLocal(new Date(y, m - 1, d - 1));
}
export function getViagemAtiva(viagensFuturas, hoje = ymdLocal()) {
  return (viagensFuturas || []).find(v => v.inicio && v.fim && vesperaYmd(v.inicio) <= hoje && hoje <= v.fim) || null;
}
// Versão que lê o cache local (p/ a tela de senha, que roda ANTES dos providers).
export function getViagemAtivaCache() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || '{}');
    return getViagemAtiva(d.viagensFuturas);
  } catch { return null; }
}

// Orçamento da viagem já normalizado:
//   { moeda, cambio, categorias: [{ id, nome, limite, gastos: [{ id, valor, nome?, data }] }] }
// Limites e gastos ficam SEMPRE na moeda da viagem (a do lugar); `cambio` é quantos
// reais vale 1 unidade dela — serve só pra mostrar o equivalente em R$ (0 = não mostra).
// Compat: viagens antigas tinham um orçamento único em reais no campo `gastoViagem`;
// ele vira uma categoria "Geral" em R$. O campo antigo continua no documento — nada
// é apagado; a partir da 1ª edição o app passa a gravar em `orcamento`.
export function getOrcamentoViagem(v) {
  const oc = v && v.orcamento;
  if (oc && Array.isArray(oc.categorias)) {
    return { moeda: oc.moeda || 'BRL', cambio: Number(oc.cambio) || 0, categorias: oc.categorias.map(c => ({ ...c, gastos: c.gastos || [] })) };
  }
  const gv = (v && v.gastoViagem) || null;
  const temLegado = gv && ((Number(gv.budget) || 0) > 0 || (gv.gastos || []).length > 0);
  if (!temLegado) return { moeda: 'BRL', cambio: 0, categorias: [] };
  return {
    moeda: 'BRL', cambio: 0,
    categorias: [{
      id: 'oc-geral', nome: 'Geral', limite: Number(gv.budget) || 0,
      gastos: (gv.gastos || []).map(g => ({ id: g.id, valor: Number(g.valor) || 0, nome: g.nome, data: g.data })),
    }],
  };
}

function readLocal() {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { ...DEFAULT }; }
}
function writeLocal(d) { return gravarLocal(KEY, JSON.stringify(d)); }

export function LifeProvider({ children }) {
  const [data, setData] = useState(() => runLifeSeeds(readLocal()));
  const dirty = useRef(false);
  const resyncing = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | saving | saved | error
  useEffect(() => onSyncStatus(setSyncStatus), []);

  useEffect(() => {
    if (RESGATE) return;   // resgate: fica só com o local, sem ler nem adotar a nuvem
    let alive = true;
    (async () => {
      const local = readLocal();
      const cloud = await fetchLife();
      if (!alive || dirty.current) return;
      if (cloud === UNREACHABLE) {
        // NÃO deu pra ler a nuvem (offline/erro/timeout): usa o local e NUNCA
        // empurra pra cima — senão apaga dados bons de outro aparelho.
        const next = runLifeSeeds(local);
        if (next !== local) { writeLocal(next); setData(next); }
        return;
      }
      if (!cloud) {
        // nuvem LIDA e vazia: migra o local pra cima (1ª vez)
        const next = runLifeSeeds(local);
        writeLocal(next); setData(next);
        if (next !== local || local.compras.itens.length || local.compras.listas.length) pushLife(next);
        return;
      }
      const merged = { ...DEFAULT, ...cloud, compras: { ...DEFAULT.compras, ...(cloud.compras || {}) }, financas: { ...DEFAULT.financas, ...(cloud.financas || {}) } };
      // Anti-perda: se o LOCAL for mais novo que a nuvem (edição que não subiu antes
      // de fechar), mantém o local e sobe pra nuvem — nunca descarta o mais recente.
      if ((local._rev || 0) > (merged._rev || 0)) {
        const nx = runLifeSeeds(local);
        writeLocal(nx); setData(nx); pushLife(nx);
        return;
      }
      // PENDÊNCIA: este aparelho tem edição que a nuvem NUNCA confirmou. O `_rev`
      // sozinho não protege — outro aparelho pode ter salvo depois (carimbo maior)
      // com conteúdo velho, e foi exatamente assim que um dia inteiro se perdeu
      // (ago/2026). Então o local VENCE e sobe, e a versão da nuvem vai pra
      // lixeira antes — nenhuma das duas é jogada fora.
      if (temPendente('life')) {
        guardarNaLixeira('life-nuvem', merged, 'nuvem preterida: havia edição local não enviada');
        // carimba mais alto que a nuvem pra este envio não ser recusado por versão
        const base = runLifeSeeds(local);
        const nx = { ...base, _rev: Math.max(Date.now(), (merged._rev || 0) + 1) };
        writeLocal(nx); setData(nx); pushLife(nx);
        return;
      }
      // Vai adotar a nuvem: guarda o que está saindo. Barato, e é a diferença
      // entre "deu ruim" e "perdi tudo".
      guardarNaLixeira('life-local', local, 'substituído pela versão da nuvem no boot');
      const next = runLifeSeeds(merged);
      writeLocal(next); setData(next);
      // A nuvem e este aparelho estão iguais AGORA: fica sendo a base dos deltas
      // (o que mudar daqui pra frente é o que sobe). Se `next !== merged`, os seeds
      // mexeram em algo e esse envio já leva a diferença.
      definirBaseLife(merged);
      if (next !== merged) pushLife(next);
    })();
    return () => { alive = false; };
  }, []);

  // Carimbo monotônico por edição: no boot, quem tem _rev maior vence (local vs nuvem).
  const stampRev = (o) => ({ ...o, _rev: Math.max(Date.now(), ((o && o._rev) || 0) + 1) });
  // Toda gravação monta o documento novo a partir do `data` DAQUELE render
  // (`persist({ ...data, aprendizados })`). Se duas coisas gravam quase juntas — o
  // caso real: sair do campo "principais temas" (onBlur) e clicar em "anotar" no
  // mesmo instante —, a segunda foi construída sobre um `data` que já está velho e
  // APAGAVA a primeira, sem erro nenhum na tela. Era assim que uma anotação sumia
  // segundos depois de ser escrita.
  //
  // Agora o persist REBASEIA: se o estado atual não é mais aquele em que `next` foi
  // construído, aplica só o que de fato MUDOU (as fatias diferentes) por cima do
  // estado atual. As duas gravações sobrevivem, em qualquer ordem.
  const rebasear = (prev, base, next) => {
    if (prev === base) return next;
    const out = { ...prev };
    for (const k of Object.keys(next)) if (next[k] !== base[k]) out[k] = next[k];      // fatia mexida agora
    for (const k of Object.keys(base)) if (!(k in next) && k in out) delete out[k];    // fatia removida agora
    return out;
  };
  // Grava JÁ (localStorage + fila da nuvem) e só depois avisa a tela. Tem que ser
  // síncrono: se dependesse do re-render do React, uma gravação disparada na saída
  // do app (fechar a aba, trocar de app) podia nunca acontecer.
  const gravar = (s) => {
    dirty.current = true;
    dataRef.current = s;      // vale imediatamente pra próxima gravação do mesmo instante
    writeLocal(s); pushLife(s);
    setData(s);
  };
  const persist = (next) => gravar(stampRev(rebasear(dataRef.current, data, next)));
  // Gravação que calcula o documento novo A PARTIR do estado mais recente, e não
  // do render. O rebase acima só salva quem mexe em fatias DIFERENTES; quando as
  // duas gravações são na MESMA fatia (escrever os temas e anotar o aprendizado —
  // as duas em `aprendizados`), só isto aqui garante que nenhuma se perde.
  const persistFn = (fn) => {
    const prev = dataRef.current;
    const alvo = fn(prev);
    if (alvo === prev) return;                 // a função decidiu que não mudou nada
    gravar(stampRev(alvo));
  };
  // Salvar AGORA (botão manual): grava na nuvem e AGUARDA a confirmação. Devolve true/false.
  const salvarAgora = async () => { dirty.current = true; return await saveLifeNow(dataRef.current); };

  // Trazer de volta um arquivo que ela baixou antes (Seus dados → "trazer meu
  // arquivo de volta"). Até ago/2026 o backup .json era um beco sem saída: dava
  // pra baixar e não dava pra devolver — só eu conseguia, na mão. Agora ela mesma
  // faz. O que está no ar vai pra lixeira ANTES, então dá pra desfazer.
  const trocarTudo = async (doc) => {
    if (!doc || typeof doc !== 'object') return false;
    guardarNaLixeira('life-local', dataRef.current, 'substituído por um arquivo que você trouxe de volta');
    const novo = { ...DEFAULT, ...doc, _rev: Math.max(Date.now(), ((dataRef.current && dataRef.current._rev) || 0) + 1) };
    dirty.current = true;
    setData(novo); writeLocal(novo);
    return await saveLifeNow(novo);
  };

  // Re-sincroniza com a nuvem quando o app VOLTA ao foco ou a rede retorna: relê e
  // ADOTA a nuvem só se ela for mais nova que o local (via _rev). Fecha a fresta de
  // um aparelho desatualizado (aberto o dia todo / boot offline) empurrar por cima
  // de uma mudança mais recente de outro aparelho. Nunca descarta edição local mais
  // nova (o _rev dela é maior). O pushLife supera qualquer push pendente já velho.
  const resyncLife = async () => {
    if (RESGATE || resyncing.current) return;
    resyncing.current = true;
    try {
      const cloud = await fetchLife();
      if (cloud === UNREACHABLE || !cloud) return;
      const merged = { ...DEFAULT, ...cloud, compras: { ...DEFAULT.compras, ...(cloud.compras || {}) }, financas: { ...DEFAULT.financas, ...(cloud.financas || {}) } };
      // Com edição local não confirmada, NÃO adota a nuvem: reenvia o local. Sem
      // isto, voltar pro app (visibilitychange) podia trocar o que está aqui por
      // uma versão de fora e apagar o que ainda nem tinha subido.
      if (temPendente('life')) { pushLife(dataRef.current); return; }
      if ((merged._rev || 0) > (dataRef.current?._rev || 0)) {
        guardarNaLixeira('life-local', dataRef.current, 'substituído pela versão da nuvem ao voltar pro app');
        const next = runLifeSeeds(merged);
        writeLocal(next); setData(next);
        definirBaseLife(merged);   // acabou de vir de lá: é a nova base dos deltas
        if (next !== merged) pushLife(next);
      }
    } finally { resyncing.current = false; }
  };
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible') resyncLife(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', resyncLife);
    return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('online', resyncLife); };
  }, []); // eslint-disable-line

  // Re-roda o "puxar vencidos pra hoje" CONTINUAMENTE (não só no login): ao voltar
  // pro app e a cada minuto. Sem isso, se o app ficar aberto e o dia virar, o item
  // de checklist vencido e não-feito não se move sozinho até um reload.
  useEffect(() => {
    const roll = () => setData(prev => {
      const rolled = rolarPlanosVencidos(rolarComprasVencidas(prev));
      if (rolled === prev) return prev;
      const next = stampRev(rolled);                 // mudou -> carimba e persiste (local + nuvem)
      writeLocal(next); pushLife(next);
      return next;
    });
    const onVis = () => { if (document.visibilityState === 'visible') roll(); };
    document.addEventListener('visibilitychange', onVis);
    const id = setInterval(roll, 60000);
    return () => { document.removeEventListener('visibilitychange', onVis); clearInterval(id); };
  }, []);

  // ---- Compras ----
  const compras = data.compras || DEFAULT.compras;
  const setCompras = (next) => persist({ ...data, compras: next });
  const addComprasItem = (it) => setCompras({ ...compras, itens: [...compras.itens, { comprado: false, ...it, id: uid('c') }] });
  const updateComprasItem = (it) => setCompras({ ...compras, itens: compras.itens.map(x => x.id === it.id ? it : x) });
  const deleteComprasItem = (id) => setCompras({ ...compras, itens: compras.itens.filter(x => x.id !== id) });
  const toggleComprado = (id) => setCompras({ ...compras, itens: compras.itens.map(x => {
    if (x.id !== id) return x;
    const comprado = !x.comprado;
    return { ...x, comprado, compradoEm: comprado ? (x.compradoEm || hojeISO()) : undefined };
  }) });
  const addComprasLista = (nome) => { const id = uid('l'); setCompras({ ...compras, listas: [...compras.listas, { id, nome }] }); return id; };
  const deleteComprasLista = (id) => setCompras({
    ...compras,
    listas: compras.listas.filter(l => l.id !== id),
    itens: compras.itens.map(x => x.listaId === id ? { ...x, listaId: 'geral' } : x),
  });
  const moveComprasLista = (id, dir) => {
    const arr = [...compras.listas];
    const i = arr.findIndex(l => l.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setCompras({ ...compras, listas: arr });
  };

  // ---- Planos (com Informações + Check list) ----
  const planos = data.planos || DEFAULT_PLANOS;
  const setPlanos = (next) => persist({ ...data, planos: next });
  const addPlano = (nome) => { const id = uid('p'); setPlanos({ ...planos, lista: [...planos.lista, { id, nome }] }); return id; };
  const setPlanoPrazo = (id, prazo) => setPlanos({ ...planos, lista: planos.lista.map(p => p.id === id ? { ...p, prazo: prazo || undefined } : p) });
  const deletePlano = (id) => setPlanos({ lista: planos.lista.filter(p => p.id !== id), infos: planos.infos.filter(i => i.planoId !== id), itens: planos.itens.filter(c => c.planoId !== id) });
  const movePlano = (id, dir) => {
    const arr = [...planos.lista];
    const i = arr.findIndex(p => p.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setPlanos({ ...planos, lista: arr });
  };
  const savePlanoInfo = (info) => setPlanos(info.id && planos.infos.some(x => x.id === info.id)
    ? { ...planos, infos: planos.infos.map(x => x.id === info.id ? info : x) }
    : { ...planos, infos: [...planos.infos, { ...info, id: uid('i') }] });
  const deletePlanoInfo = (id) => setPlanos({ ...planos, infos: planos.infos.filter(x => x.id !== id) });
  const addPlanoCheck = (planoId, texto) => setPlanos({ ...planos, itens: [...planos.itens, { id: uid('k'), planoId, texto, feito: false }] });
  const togglePlanoCheck = (id) => setPlanos({ ...planos, itens: planos.itens.map(x => x.id === id ? { ...x, feito: !x.feito } : x) });
  const setPlanoCheckPrazo = (id, prazo) => setPlanos({ ...planos, itens: planos.itens.map(x => x.id === id ? { ...x, prazo: prazo || undefined } : x) });
  const setPlanoCheckTexto = (id, texto) => setPlanos({ ...planos, itens: planos.itens.map(x => x.id === id ? { ...x, texto } : x) });
  const deletePlanoCheck = (id) => setPlanos({ ...planos, itens: planos.itens.filter(x => x.id !== id) });

  // ---- Calendário cultural ----
  const cultural = data.cultural || DEFAULT.cultural;
  const setCultural = (next) => persist({ ...data, cultural: next });
  const saveCulturalItem = (it) => setCultural(it.id && cultural.itens.some(x => x.id === it.id)
    ? { ...cultural, itens: cultural.itens.map(x => x.id === it.id ? it : x) }
    : { ...cultural, itens: [...cultural.itens, { ...it, id: uid('e') }] });
  const deleteCulturalItem = (id) => setCultural({ ...cultural, itens: cultural.itens.filter(x => x.id !== id) });

  // ---- Viagens futuras / em curso (card por viagem + Modo Viagem) ----
  // viagem = { id, titulo, cidade, inicio, fim, hospedagem?, passagens?, notas?, link?,
  //   homenageada?:{nome,texto,link}, mesas?:[{id,n,dia,hora,titulo,autores,link?}],
  //   checklist?:[{id,texto,feito}] }
  const viagensFuturas = data.viagensFuturas || [];
  const saveViagemFutura = (v) => persist({ ...data, viagensFuturas: v.id && viagensFuturas.some(x => x.id === v.id)
    ? viagensFuturas.map(x => x.id === v.id ? v : x)
    : [...viagensFuturas, { ...v, id: uid('vf') }] });
  const deleteViagemFutura = (id) => persist({ ...data, viagensFuturas: viagensFuturas.filter(x => x.id !== id) });
  // Orçamento da viagem: as categorias e os limites saem daqui (definidos em Life ›
  // Viagens) e o "Posso gastar em <cidade>" da Tela Hoje só lança os gastos neles.
  // Guardado NA viagem, isolado do slice possoGastar (que é por ciclo 27→26).
  const _ocDe = (id) => { const v = viagensFuturas.find(x => x.id === id); return v ? { v, oc: getOrcamentoViagem(v) } : null; };
  const _salvarOc = (r, oc) => saveViagemFutura({ ...r.v, orcamento: oc });
  const _mapCats = (r, fn) => _salvarOc(r, { ...r.oc, categorias: r.oc.categorias.map(fn) });
  // moeda da viagem + câmbio (R$ por 1 unidade; 0/vazio = não mostra conversão)
  const setViagemOrcamento = (id, patch) => { const r = _ocDe(id); if (!r) return; _salvarOc(r, { ...r.oc, ...patch }); };
  const saveViagemCategoria = (id, cat) => {
    const r = _ocDe(id); if (!r) return;
    const existe = cat.id && r.oc.categorias.some(c => c.id === cat.id);
    _salvarOc(r, { ...r.oc, categorias: existe
      ? r.oc.categorias.map(c => c.id === cat.id ? { ...c, ...cat } : c)
      : [...r.oc.categorias, { gastos: [], ...cat, id: uid('oc') }] });
  };
  const deleteViagemCategoria = (id, catId) => { const r = _ocDe(id); if (!r) return; _salvarOc(r, { ...r.oc, categorias: r.oc.categorias.filter(c => c.id !== catId) }); };
  const addViagemCatGasto = (id, catId, g) => { const r = _ocDe(id); if (!r) return; _mapCats(r, c => c.id === catId ? { ...c, gastos: [...(c.gastos || []), { ...g, id: uid('vg') }] } : c); };
  const updateViagemCatGasto = (id, catId, gid, patch) => { const r = _ocDe(id); if (!r) return; _mapCats(r, c => c.id === catId ? { ...c, gastos: (c.gastos || []).map(x => x.id === gid ? { ...x, ...patch } : x) } : c); };
  const deleteViagemCatGasto = (id, catId, gid) => { const r = _ocDe(id); if (!r) return; _mapCats(r, c => c.id === catId ? { ...c, gastos: (c.gastos || []).filter(x => x.id !== gid) } : c); };

  // ---- Próximas leituras (livros a ler; tema em vez de sinopse, sem spoiler) ----
  // leitura = { id, titulo, autor?, pais?, ano?, genero?, temas:[string], nota?, lido? }
  const leituras = data.leituras || [];
  const saveLeitura = (l) => persist({ ...data, leituras: l.id && leituras.some(x => x.id === l.id)
    ? leituras.map(x => x.id === l.id ? l : x)
    : [...leituras, { ...l, id: uid('lv') }] });
  const deleteLeitura = (id) => persist({ ...data, leituras: leituras.filter(x => x.id !== id) });
  const toggleLeituraLido = (id) => persist({ ...data, leituras: leituras.map(x => x.id === id ? { ...x, lido: !x.lido } : x) });

  // ---- Estudos › Acompanhamento de leituras (livro em curso, de perto) ----
  // Diferente das "Próximas leituras" (catálogo): aqui acompanha-se a leitura ATUAL com
  // mapa de personagens (sem spoiler — construído pela Mari), anotações e guia de contexto.
  // livro = { id, titulo, autor?, ano?, pais?, inicio?, status:'lendo'|'pausado'|'concluido',
  //   personagens:[{id,nome,descricao?,obs?,relacoes:[{id,tipo,comId}]}],
  //   notas:[{id,texto,criadoEm}], guia?:{publicacao?,russia?,autor?} }  // guia = texto curado por mim
  const acompLeituras = data.acompLeituras || [];
  const setAcomp = (next) => persist({ ...data, acompLeituras: next });
  const saveAcompLeitura = (l) => setAcomp(l.id && acompLeituras.some(x => x.id === l.id)
    ? acompLeituras.map(x => x.id === l.id ? { ...x, ...l } : x)
    : [...acompLeituras, { id: uid('al'), personagens: [], notas: [], ...l }]);
  const deleteAcompLeitura = (id) => setAcomp(acompLeituras.filter(x => x.id !== id));
  const _mapLivro = (livroId, fn) => setAcomp(acompLeituras.map(x => x.id === livroId ? fn(x) : x));
  const savePersonagem = (livroId, p) => _mapLivro(livroId, l => {
    const lista = l.personagens || [];
    return { ...l, personagens: p.id && lista.some(x => x.id === p.id)
      ? lista.map(x => x.id === p.id ? { ...x, ...p } : x)
      : [...lista, { id: uid('pg'), relacoes: [], ...p }] };
  });
  const deletePersonagem = (livroId, persId) => _mapLivro(livroId, l => ({
    ...l,
    // remove o personagem e qualquer relação que aponte pra ele
    personagens: (l.personagens || []).filter(x => x.id !== persId)
      .map(x => ({ ...x, relacoes: (x.relacoes || []).filter(r => r.comId !== persId) })),
  }));
  const saveNotaLeitura = (livroId, nota) => _mapLivro(livroId, l => {
    const lista = l.notas || [];
    return { ...l, notas: nota.id && lista.some(x => x.id === nota.id)
      ? lista.map(x => x.id === nota.id ? { ...x, ...nota } : x)
      : [{ id: uid('nl'), criadoEm: Date.now(), ...nota }, ...lista] };
  });
  const deleteNotaLeitura = (livroId, notaId) => _mapLivro(livroId, l => ({ ...l, notas: (l.notas || []).filter(x => x.id !== notaId) }));

  // ---- Legendas (frases salvas pra reusar; grupos livres + Gerais) ----
  // legendas = [{ id, nome, itens:[{id,titulo,texto,criadoEm}] }]  (grupos criados pela Mari)
  const legendas = data.legendas || DEFAULT.legendas;
  const setLegendas = (next) => persist({ ...data, legendas: next });
  const addLegGrupo = (nome) => { const id = uid('lg'); setLegendas([...legendas, { id, nome, itens: [] }]); return id; };
  const renameLegGrupo = (id, nome) => setLegendas(legendas.map(g => g.id === id ? { ...g, nome } : g));
  const deleteLegGrupo = (id) => setLegendas(legendas.filter(g => g.id !== id));
  const moveLegGrupo = (id, dir) => {
    const arr = [...legendas];
    const i = arr.findIndex(g => g.id === id), j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setLegendas(arr);
  };
  const saveLegenda = (grupoId, item) => setLegendas(legendas.map(g => g.id === grupoId
    ? { ...g, itens: item.id && (g.itens || []).some(x => x.id === item.id)
        ? g.itens.map(x => x.id === item.id ? { ...x, ...item } : x)
        : [{ id: uid('li'), criadoEm: Date.now(), ...item }, ...(g.itens || [])] }
    : g));
  const deleteLegenda = (grupoId, itemId) => setLegendas(legendas.map(g => g.id === grupoId ? { ...g, itens: (g.itens || []).filter(x => x.id !== itemId) } : g));

  // ---- Viagens que quero fazer (wishlist por região; mora na aba Viagens) ----
  // viagensQuero = [{ id, nome, itens:[{id,texto,feito}] }]
  const viagensQuero = data.viagensQuero || [];
  const setViagensQuero = (next) => persist({ ...data, viagensQuero: next });
  const addQueroGrupo = (nome) => { const id = uid('vq'); setViagensQuero([...viagensQuero, { id, nome, itens: [] }]); return id; };
  const renameQueroGrupo = (id, nome) => setViagensQuero(viagensQuero.map(g => g.id === id ? { ...g, nome } : g));
  const deleteQueroGrupo = (id) => setViagensQuero(viagensQuero.filter(g => g.id !== id));
  const moveQueroGrupo = (id, dir) => {
    const arr = [...viagensQuero];
    const i = arr.findIndex(g => g.id === id), j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setViagensQuero(arr);
  };
  const addQueroItem = (gid, texto) => setViagensQuero(viagensQuero.map(g => g.id === gid ? { ...g, itens: [...(g.itens || []), { id: uid('vqi'), texto, notas: [] }] } : g));
  const saveQueroItemTexto = (gid, iid, texto) => setViagensQuero(viagensQuero.map(g => g.id === gid ? { ...g, itens: (g.itens || []).map(x => x.id === iid ? { ...x, texto } : x) } : g));
  const deleteQueroItem = (gid, iid) => setViagensQuero(viagensQuero.map(g => g.id === gid ? { ...g, itens: (g.itens || []).filter(x => x.id !== iid) } : g));
  // Notas por destino (anotações pra viagens futuras)
  const _mapQueroItem = (gid, iid, fn) => setViagensQuero(viagensQuero.map(g => g.id === gid ? { ...g, itens: (g.itens || []).map(x => x.id === iid ? fn(x) : x) } : g));
  const addQueroNota = (gid, iid, texto) => _mapQueroItem(gid, iid, x => ({ ...x, notas: [...(x.notas || []), { id: uid('vqn'), texto }] }));
  const saveQueroNotaTexto = (gid, iid, nid, texto) => _mapQueroItem(gid, iid, x => ({ ...x, notas: (x.notas || []).map(n => n.id === nid ? { ...n, texto } : n) }));
  const deleteQueroNota = (gid, iid, nid) => _mapQueroItem(gid, iid, x => ({ ...x, notas: (x.notas || []).filter(n => n.id !== nid) }));

  // ---- Planos próximos de viagem (seções editáveis: 2026, 2027, ideias…) ----
  // planosViagem = [{ id, nome, itens:[{id,texto}] }]
  const planosViagem = data.planosViagem || [];
  const setPlanosViagem = (next) => persist({ ...data, planosViagem: next });
  const addPVGrupo = (nome) => { const id = uid('pv'); setPlanosViagem([...planosViagem, { id, nome, itens: [] }]); return id; };
  const renamePVGrupo = (id, nome) => setPlanosViagem(planosViagem.map(g => g.id === id ? { ...g, nome } : g));
  const deletePVGrupo = (id) => setPlanosViagem(planosViagem.filter(g => g.id !== id));
  const movePVGrupo = (id, dir) => {
    const arr = [...planosViagem];
    const i = arr.findIndex(g => g.id === id), j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setPlanosViagem(arr);
  };
  const addPVItem = (gid, texto) => setPlanosViagem(planosViagem.map(g => g.id === gid ? { ...g, itens: [...(g.itens || []), { id: uid('pvi'), texto }] } : g));
  const savePVItemTexto = (gid, iid, texto) => setPlanosViagem(planosViagem.map(g => g.id === gid ? { ...g, itens: (g.itens || []).map(x => x.id === iid ? { ...x, texto } : x) } : g));
  const deletePVItem = (gid, iid) => setPlanosViagem(planosViagem.map(g => g.id === gid ? { ...g, itens: (g.itens || []).filter(x => x.id !== iid) } : g));

  // ---- Estudos › Inglês (dicionário: termo → definição) ----
  const ingles = data.ingles || [];
  const saveInglesEntry = (e) => persist({ ...data, ingles: e.id && ingles.some(x => x.id === e.id)
    ? ingles.map(x => x.id === e.id ? { ...x, ...e } : x)
    : [...ingles, { id: uid('en'), ...e }] });
  const deleteInglesEntry = (id) => persist({ ...data, ingles: ingles.filter(x => x.id !== id) });

  // ---- Retrospectiva › Amorosa (privada: transas, dates, beijos, relações) ----
  // entrada = { id, tipo:'transa'|'date'|'beijo'|'relacao', data, fim?, pessoa?, local?, nota? }
  const amorosa = data.amorosa || [];
  const saveAmorosa = (a) => persist({ ...data, amorosa: a.id && amorosa.some(x => x.id === a.id)
    ? amorosa.map(x => x.id === a.id ? { ...x, ...a } : x)
    : [...amorosa, { ...a, id: uid('am') }] });
  const deleteAmorosa = (id) => persist({ ...data, amorosa: amorosa.filter(x => x.id !== id) });

  // ---- Eventos recorrentes (opções pra "o que fazer" quando bate a dúvida) ----
  // recorrente = { id, nome, tipo, cidade?, local?, quando?, preco?, link?, nota? }
  const recorrentes = data.recorrentes || DEFAULT.recorrentes;
  const setRecorrentes = (next) => persist({ ...data, recorrentes: next });
  const saveRecorrente = (it) => setRecorrentes(it.id && recorrentes.some(x => x.id === it.id)
    ? recorrentes.map(x => x.id === it.id ? it : x)
    : [...recorrentes, { ...it, id: uid('r') }]);
  const deleteRecorrente = (id) => setRecorrentes(recorrentes.filter(x => x.id !== id));

  // ---- Vida financeira (carteira de investimentos: 1 snapshot por mês) ----
  // snapshot = { id, mes: 'YYYY-MM', holdings: [{ id, nome, categoria, valor }] } (valores em R$)
  const financas = data.financas || DEFAULT.financas;
  const setFinancas = (next) => persist({ ...data, financas: next });
  const saveFinancasSnapshot = (snap) => setFinancas(snap.id && financas.snapshots.some(s => s.id === snap.id)
    ? { ...financas, snapshots: financas.snapshots.map(s => s.id === snap.id ? snap : s) }
    : { ...financas, snapshots: [...financas.snapshots, { ...snap, id: uid('f') }] });
  const deleteFinancasSnapshot = (id) => setFinancas({ ...financas, snapshots: financas.snapshots.filter(s => s.id !== id) });
  const setFinancasUsdRate = (usdRate) => setFinancas({ ...financas, usdRate });

  // ---- Salários vida (histórico de renda anual) ----
  const salarios = data.salarios || DEFAULT_SALARIOS;
  const saveSalarioAno = (a) => persist({ ...data, salarios: (salarios.some(s => s.ano === a.ano)
    ? salarios.map(s => s.ano === a.ano ? a : s)
    : [...salarios, a]).sort((x, y) => x.ano - y.ano) });
  const deleteSalarioAno = (ano) => persist({ ...data, salarios: salarios.filter(s => s.ano !== ano) });

  // ---- Gastos por mês ----
  const gastos = data.gastos || DEFAULT_GASTOS;
  const saveGastoMes = (g) => persist({ ...data, gastos: (gastos.some(x => x.mes === g.mes)
    ? gastos.map(x => x.mes === g.mes ? g : x)
    : [...gastos, g]).sort((a, b) => a.mes.localeCompare(b.mes)) });
  const deleteGastoMes = (mes) => persist({ ...data, gastos: gastos.filter(x => x.mes !== mes) });

  // ---- Saúde (peso, remédios, vacinas, menstruação) ----
  const saude = data.saude || DEFAULT.saude;
  const saveSaudeItem = (tipo, item) => {
    const lista = saude[tipo] || [];
    const next = item.id && lista.some(x => x.id === item.id)
      ? lista.map(x => x.id === item.id ? item : x)
      : [...lista, { ...item, id: item.id || uid('s') }];
    persist({ ...data, saude: { ...DEFAULT.saude, ...saude, [tipo]: next } });
  };
  const deleteSaudeItem = (tipo, id) => persist({ ...data, saude: { ...DEFAULT.saude, ...saude, [tipo]: (saude[tipo] || []).filter(x => x.id !== id) } });

  // ---- Música (Retrospectiva): 1 registro por mês ----
  const musica = data.musica || [];
  const saveMusica = (m) => persist({ ...data, musica: m.id && musica.some(x => x.id === m.id)
    ? musica.map(x => x.id === m.id ? m : x)
    : [...musica, { ...m, id: uid('mu') }] });
  const deleteMusica = (id) => persist({ ...data, musica: musica.filter(x => x.id !== id) });

  // ---- Conteúdos para assistir/ler depois (aba Explorar) ----
  const assistir = data.assistir || [];
  const saveAssistir = (a) => persist({ ...data, assistir: a.id && assistir.some(x => x.id === a.id)
    ? assistir.map(x => x.id === a.id ? a : x)
    : [{ ...a, id: uid('as'), criadoEm: hojeISO() }, ...assistir] });
  const deleteAssistir = (id) => persist({ ...data, assistir: assistir.filter(x => x.id !== id) });
  const toggleAssistir = (id) => persist({ ...data, assistir: assistir.map(x => x.id === id ? { ...x, feito: !x.feito } : x) });

  // ---- Dias importantes (marcos) — Retrospectiva ----
  const marcos = data.marcos || [];
  const saveMarco = (m) => persist({ ...data, marcos: m.id && marcos.some(x => x.id === m.id)
    ? marcos.map(x => x.id === m.id ? m : x)
    : [...marcos, { ...m, id: uid('mc') }] });
  const deleteMarco = (id) => persist({ ...data, marcos: marcos.filter(x => x.id !== id) });

  // ---- Coisas caras (Retrospectiva > Compras) ----
  const coisasCaras = data.coisasCaras || [];
  const saveCoisaCara = (c) => persist({ ...data, coisasCaras: c.id && coisasCaras.some(x => x.id === c.id)
    ? coisasCaras.map(x => x.id === c.id ? c : x)
    : [...coisasCaras, { ...c, id: uid('cc') }] });
  const deleteCoisaCara = (id) => persist({ ...data, coisasCaras: coisasCaras.filter(x => x.id !== id) });

  // ---- Viagens (Retrospectiva) ----
  const viagens = data.viagens || [];
  const saveViagem = (v) => persist({ ...data, viagens: v.id && viagens.some(x => x.id === v.id)
    ? viagens.map(x => x.id === v.id ? v : x)
    : [...viagens, { ...v, id: uid('vg') }] });
  const deleteViagem = (id) => persist({ ...data, viagens: viagens.filter(x => x.id !== id) });

  // ---- Gastos itemizados (Retrospectiva > Gastos) ----
  const gastosItens = data.gastosItens || [];
  const saveGastoItem = (it) => persist({ ...data, gastosItens: it.id && gastosItens.some(x => x.id === it.id)
    ? gastosItens.map(x => x.id === it.id ? it : x)
    : [...gastosItens, { ...it, id: uid('gi') }] });
  const deleteGastoItem = (id) => persist({ ...data, gastosItens: gastosItens.filter(x => x.id !== id) });

  // ---- Subcategorias de gastos (lista editável por categoria) ----
  const gastoSubcats = data.gastoSubcats || {};
  const addGastoSubcat = (cat, nome) => {
    const n = (nome || '').trim(); if (!n) return;
    const lista = gastoSubcats[cat] || [];
    if (lista.some(x => x.toLowerCase() === n.toLowerCase())) return; // já existe (a menos de caixa)
    persist({ ...data, gastoSubcats: { ...gastoSubcats, [cat]: [...lista, n] } });
  };
  // Excluir subcategoria: some da lista E apaga os lançamentos dela (o dinheiro
  // passa a compor "outros"). Feito num persist só.
  const deleteGastoSubcat = (cat, nome) => {
    const lista = (gastoSubcats[cat] || []).filter(x => x !== nome);
    persist({ ...data, gastoSubcats: { ...gastoSubcats, [cat]: lista }, gastosItens: gastosItens.filter(x => !(x.categoria === cat && x.nome === nome)) });
  };
  // Valor de UMA subcategoria num mês: 1 lançamento por (cat, mês, nome). Remove os
  // que houver e recria com o novo valor (0/vazio = fica sem lançamento).
  const setGastoSubItem = (cat, mes, nome, valor) => {
    const v = Number(valor) || 0;
    const semEsse = gastosItens.filter(x => !(x.categoria === cat && x.mes === mes && x.nome === nome));
    const novos = v > 0 ? [...semEsse, { id: uid('gi'), categoria: cat, mes, nome, valor: v }] : semEsse;
    persist({ ...data, gastosItens: novos });
  };

  // ---- VR (vale-refeição): ciclo dia 27→26. Por ciclo: { total, gastos:[{id,valor,data,nota?}] }.
  // Chave do ciclo = ymd do dia 27 que o inicia. "Pode gastar por dia" = (total − gasto) / dias até o 26.
  const vr = (data.vr && data.vr.ciclos) ? data.vr : { ciclos: {} };
  const setVr = (next) => persist({ ...data, vr: next });
  const vrCicloDe = (ck) => vr.ciclos[ck] || { total: 0, gastos: [] };
  const setVrTotal = (ck, total) => setVr({ ...vr, ciclos: { ...vr.ciclos, [ck]: { ...vrCicloDe(ck), total: Number(total) || 0 } } });
  const addVrGasto = (ck, g) => { const c = vrCicloDe(ck); setVr({ ...vr, ciclos: { ...vr.ciclos, [ck]: { ...c, gastos: [...c.gastos, { ...g, id: uid('vg') }] } } }); };
  const deleteVrGasto = (ck, id) => { const c = vr.ciclos[ck]; if (!c) return; setVr({ ...vr, ciclos: { ...vr.ciclos, [ck]: { ...c, gastos: c.gastos.filter(x => x.id !== id) } } }); };
  // Corrigir um gasto já lançado (valor e/ou data) — o gasto continua no MESMO
  // ciclo, a data só diz em que dia dele aconteceu. Mesmo formato do updatePgGasto.
  const updateVrGasto = (ck, id, patch) => { const c = vr.ciclos[ck]; if (!c) return; setVr({ ...vr, ciclos: { ...vr.ciclos, [ck]: { ...c, gastos: c.gastos.map(x => x.id === id ? { ...x, ...patch } : x) } } }); };

  // ---- Posso gastar: orçamento do mês (ciclo 27→26), 2 caixas INDEPENDENTES:
  // 'total' e 'mercado'. Cada uma { budget, gastos:[...] }. Resta = budget − gasto.
  // NÃO divide por dia e NÃO tem relação com as categorias de Gastos.
  const possoGastar = (data.possoGastar && data.possoGastar.ciclos) ? data.possoGastar : { ciclos: {} };
  const setPG = (next) => persist({ ...data, possoGastar: next });
  const pgCicloDe = (ck) => { const c = possoGastar.ciclos[ck] || {}; return { total: c.total || { budget: 0, gastos: [] }, mercado: c.mercado || { budget: 0, gastos: [] } }; };
  const setPgBudget = (ck, bucket, budget) => { const c = pgCicloDe(ck); setPG({ ...possoGastar, ciclos: { ...possoGastar.ciclos, [ck]: { ...c, [bucket]: { ...c[bucket], budget: Number(budget) || 0 } } } }); };
  const addPgGasto = (ck, bucket, g) => { const c = pgCicloDe(ck); setPG({ ...possoGastar, ciclos: { ...possoGastar.ciclos, [ck]: { ...c, [bucket]: { ...c[bucket], gastos: [...c[bucket].gastos, { ...g, id: uid('pg') }] } } } }); };
  const deletePgGasto = (ck, bucket, id) => { const c = pgCicloDe(ck); setPG({ ...possoGastar, ciclos: { ...possoGastar.ciclos, [ck]: { ...c, [bucket]: { ...c[bucket], gastos: c[bucket].gastos.filter(x => x.id !== id) } } } }); };
  const updatePgGasto = (ck, bucket, id, patch) => { const c = pgCicloDe(ck); setPG({ ...possoGastar, ciclos: { ...possoGastar.ciclos, [ck]: { ...c, [bucket]: { ...c[bucket], gastos: c[bucket].gastos.map(x => x.id === id ? { ...x, ...patch } : x) } } } }); };

  // ---- Trechos favoritos (frases marcantes de livros) ----
  const trechos = data.trechos || [];
  const saveTrecho = (t) => persist({ ...data, trechos: t.id && trechos.some(x => x.id === t.id) ? trechos.map(x => x.id === t.id ? { ...x, ...t } : x) : [...trechos, { ...t, id: uid('tr'), criadoEm: Date.now() }] });
  const deleteTrecho = (id) => persist({ ...data, trechos: trechos.filter(x => x.id !== id) });

  // ---- Álbuns marcantes (discos que marcaram; complementa a Música do Spotify) ----
  const albuns = data.albuns || [];
  const saveAlbum = (a) => persist({ ...data, albuns: a.id && albuns.some(x => x.id === a.id) ? albuns.map(x => x.id === a.id ? { ...x, ...a } : x) : [...albuns, { ...a, id: uid('alb'), criadoEm: Date.now() }] });
  const deleteAlbum = (id) => persist({ ...data, albuns: albuns.filter(x => x.id !== id) });
  // Backfill de capas: aplica VÁRIAS capas de uma vez (mapa id->capa), atômico. Update
  // funcional (lê `prev`, não o `data` do closure) pra vários saves não se sobrescreverem.
  const setAlbunsCapas = (capaById) => setData(prev => {
    const arr = prev.albuns || [];
    if (!arr.some(x => capaById[x.id] && !x.capa)) return prev;
    const next = stampRev({ ...prev, albuns: arr.map(x => (capaById[x.id] && !x.capa) ? { ...x, capa: capaById[x.id] } : x) });
    dirty.current = true; writeLocal(next); pushLife(next);
    return next;
  });

  // ---- Aprendizados (tópicos + notas) ----
  const aprendizados = data.aprendizados || DEFAULT_APRENDIZADOS;
  // Aceita o valor pronto OU uma função (aprendizados atuais) => novos. A forma de
  // função é a segura pra tudo que escreve NOTA: ela lê o estado mais recente, então
  // duas gravações seguidas (temas + aprendizado) se somam em vez de se apagarem.
  const setAprendizados = (next) => (typeof next === 'function'
    ? persistFn(d => { const ap = d.aprendizados || DEFAULT_APRENDIZADOS; const nx = next(ap); return nx === ap ? d : { ...d, aprendizados: nx }; })
    : persist({ ...data, aprendizados: next }));
  const addAprendTopico = (nome) => { const id = uid('t'); setAprendizados({ ...aprendizados, topicos: [...aprendizados.topicos, { id, nome }] }); return id; };
  const deleteAprendTopico = (id) => setAprendizados({ topicos: aprendizados.topicos.filter(t => t.id !== id), notas: aprendizados.notas.filter(n => n.topicoId !== id) });
  const moveAprendTopico = (id, dir) => {
    const arr = [...aprendizados.topicos];
    const i = arr.findIndex(t => t.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setAprendizados({ ...aprendizados, topicos: arr });
  };
  const saveAprendNota = (nota) => setAprendizados(ap => (nota.id && ap.notas.some(n => n.id === nota.id)
    ? { ...ap, notas: ap.notas.map(n => n.id === nota.id ? { ...n, ...nota } : n) }   // merge preserva criadoEm
    : { ...ap, notas: [...ap.notas, { ...nota, id: uid('n'), criadoEm: Date.now() }] }));
  const deleteAprendNota = (id) => setAprendizados(ap => ({ ...ap, notas: ap.notas.filter(n => n.id !== id) }));

  // ---- Estudos › tópicos da Mari (mesmo formato dos Aprendizados: tópicos + notas) ----
  // Slice PRÓPRIO (`estudoTemas`), separado dos Aprendizados de propósito: lá é "o
  // que já aprendi", aqui é o que ela está estudando. A UI é a mesma (TopicoView/
  // NotaCard), trocando só o caderno. Começa vazio — sem seed.
  const estudoTemas = data.estudoTemas || { topicos: [], notas: [] };
  // Igual aos Aprendizados: a forma de função lê o estado mais recente, pra duas
  // gravações seguidas não se apagarem (ver o comentário do `persistFn`).
  const setEstudoTemas = (next) => (typeof next === 'function'
    ? persistFn(d => { const et = d.estudoTemas || { topicos: [], notas: [] }; const nx = next(et); return nx === et ? d : { ...d, estudoTemas: nx }; })
    : persist({ ...data, estudoTemas: next }));
  const addEstudoTopico = (nome) => { const id = uid('et'); setEstudoTemas({ ...estudoTemas, topicos: [...estudoTemas.topicos, { id, nome }] }); return id; };
  const deleteEstudoTopico = (id) => setEstudoTemas({ topicos: estudoTemas.topicos.filter(t => t.id !== id), notas: estudoTemas.notas.filter(n => n.topicoId !== id) });
  const moveEstudoTopico = (id, dir) => {
    const arr = [...estudoTemas.topicos];
    const i = arr.findIndex(t => t.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setEstudoTemas({ ...estudoTemas, topicos: arr });
  };
  const renameEstudoTopico = (id, nome) => setEstudoTemas({ ...estudoTemas, topicos: estudoTemas.topicos.map(t => t.id === id ? { ...t, nome } : t) });
  const saveEstudoNota = (nota) => setEstudoTemas(et => (nota.id && et.notas.some(n => n.id === nota.id)
    ? { ...et, notas: et.notas.map(n => n.id === nota.id ? { ...n, ...nota } : n) }   // merge preserva criadoEm
    : { ...et, notas: [...et.notas, { ...nota, id: uid('en'), criadoEm: Date.now() }] }));
  const deleteEstudoNota = (id) => setEstudoTemas(et => ({ ...et, notas: et.notas.filter(n => n.id !== id) }));
  // Ordem MANUAL das anotações: troca a nota de lugar com a IRMÃ vizinha (mesmo
  // tópico e mesmo pai), mexendo direto no array `notas` — a tela lê na ordem do
  // array, sem ordenar. Vale pros dois níveis (anotação e tópico dentro dela).
  const moveEstudoNota = (id, dir) => {
    const arr = [...estudoTemas.notas];
    const nota = arr.find(n => n.id === id);
    if (!nota) return;
    const irmas = arr.filter(n => n.topicoId === nota.topicoId && (n.paiId || null) === (nota.paiId || null));
    const pos = irmas.findIndex(n => n.id === id);
    const alvo = irmas[pos + dir];
    if (!alvo) return;
    const i = arr.indexOf(nota), j = arr.indexOf(alvo);
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setEstudoTemas({ ...estudoTemas, notas: arr });
  };
  // Insight de terapia do dia: acha (ou cria) o tópico "Terapia Insights" e a nota
  // com o dia (dataLabel) como título, e adiciona o aprendizado dentro — tudo num
  // único save (atômico). Usado pela caixa da Tela Hoje nos dias de terapia.
  // Busca ROBUSTA da nota do dia: pela chave estável `data`, OU título === data, OU
  // título que COMEÇA com a data (ex.: "28/07/2026 - FLIP") — assim renomear o título
  // não faz o app "criar" nota nova. Primeiro match na ordem do array (a original vem
  // antes de uma eventual duplicata vazia criada depois).
  const _matchTerapia = (n, topicoId, dataLabel) => n.topicoId === topicoId && (n.data === dataLabel || n.titulo === dataLabel || String(n.titulo || '').startsWith(dataLabel));
  const _ensureTerapiaTopico = (ap) => {
    let topicos = ap.topicos || [];
    let topico = topicos.find(t => /terapia/i.test(t.nome || ''));
    if (!topico) { topico = { id: uid('t'), nome: 'Terapia Insights' }; topicos = [...topicos, topico]; }
    return { topico, topicos };
  };
  const addTerapiaInsight = (dataLabel, texto) => setAprendizados(ap => {
    const { topico, topicos } = _ensureTerapiaTopico(ap);
    let notas = ap.notas || [];
    const nota = notas.find(n => _matchTerapia(n, topico.id, dataLabel));
    if (nota) notas = notas.map(n => n === nota ? _normTerapiaNota({ ...n, itens: [...(n.itens || []), texto] }, dataLabel) : n);
    else notas = [...notas, { id: uid('n'), topicoId: topico.id, titulo: dataLabel, data: dataLabel, temas: '', itens: [texto], criadoEm: Date.now() }];
    return { ...ap, topicos, notas };
  });
  // "Principais temas" da nota de terapia do dia (campo separado, mostrado ao lado da data).
  const setTerapiaTemas = (dataLabel, temas) => setAprendizados(ap => {
    const { topico, topicos } = _ensureTerapiaTopico(ap);
    let notas = ap.notas || [];
    const nota = notas.find(n => _matchTerapia(n, topico.id, dataLabel));
    const t = String(temas || '').trim();
    if (nota) notas = notas.map(n => n === nota ? { ..._normTerapiaNota(n, dataLabel), temas: t } : n);
    else if (t) notas = [...notas, { id: uid('n'), topicoId: topico.id, titulo: dataLabel, data: dataLabel, temas: t, itens: [], criadoEm: Date.now() }];
    else return ap;
    return { ...ap, topicos, notas };
  });

  const value = {
    data, compras, salvarAgora, syncStatus, trocarTudo,
    addComprasItem, updateComprasItem, deleteComprasItem, toggleComprado, addComprasLista, deleteComprasLista, moveComprasLista,
    planos, addPlano, setPlanoPrazo, deletePlano, movePlano, savePlanoInfo, deletePlanoInfo, addPlanoCheck, togglePlanoCheck, setPlanoCheckPrazo, setPlanoCheckTexto, deletePlanoCheck,
    cultural, saveCulturalItem, deleteCulturalItem,
    recorrentes, saveRecorrente, deleteRecorrente,
    financas, saveFinancasSnapshot, deleteFinancasSnapshot, setFinancasUsdRate,
    salarios, saveSalarioAno, deleteSalarioAno,
    gastos, saveGastoMes, deleteGastoMes,
    saude, saveSaudeItem, deleteSaudeItem,
    aprendizados, addAprendTopico, deleteAprendTopico, moveAprendTopico, saveAprendNota, deleteAprendNota, addTerapiaInsight, setTerapiaTemas,
    estudoTemas, addEstudoTopico, deleteEstudoTopico, moveEstudoTopico, renameEstudoTopico, saveEstudoNota, deleteEstudoNota, moveEstudoNota,
    musica, saveMusica, deleteMusica,
    assistir, saveAssistir, deleteAssistir, toggleAssistir,
    marcos, saveMarco, deleteMarco,
    coisasCaras, saveCoisaCara, deleteCoisaCara,
    viagens, saveViagem, deleteViagem,
    viagensFuturas, saveViagemFutura, deleteViagemFutura,
    setViagemOrcamento, saveViagemCategoria, deleteViagemCategoria, addViagemCatGasto, updateViagemCatGasto, deleteViagemCatGasto,
    leituras, saveLeitura, deleteLeitura, toggleLeituraLido,
    acompLeituras, saveAcompLeitura, deleteAcompLeitura, savePersonagem, deletePersonagem, saveNotaLeitura, deleteNotaLeitura,
    legendas, addLegGrupo, renameLegGrupo, deleteLegGrupo, moveLegGrupo, saveLegenda, deleteLegenda,
    viagensQuero, addQueroGrupo, renameQueroGrupo, deleteQueroGrupo, moveQueroGrupo, addQueroItem, saveQueroItemTexto, deleteQueroItem, addQueroNota, saveQueroNotaTexto, deleteQueroNota,
    planosViagem, addPVGrupo, renamePVGrupo, deletePVGrupo, movePVGrupo, addPVItem, savePVItemTexto, deletePVItem,
    ingles, saveInglesEntry, deleteInglesEntry,
    amorosa, saveAmorosa, deleteAmorosa,
    gastosItens, saveGastoItem, deleteGastoItem,
    gastoSubcats, addGastoSubcat, deleteGastoSubcat, setGastoSubItem,
    vr, setVrTotal, addVrGasto, deleteVrGasto, updateVrGasto,
    possoGastar, setPgBudget, addPgGasto, deletePgGasto, updatePgGasto,
    trechos, saveTrecho, deleteTrecho,
    albuns, saveAlbum, deleteAlbum, setAlbunsCapas,
  };
  return <LifeContext.Provider value={value}>{children}</LifeContext.Provider>;
}

export function useLife() {
  const ctx = useContext(LifeContext);
  if (!ctx) throw new Error('useLife precisa estar dentro de <LifeProvider>');
  return ctx;
}
