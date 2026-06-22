// Store da aba Life (sincroniza na nuvem, igual aos Salvos/Calendário).
// Por enquanto guarda a seção "compras"; as outras seções entram aqui depois.
//
//   life.compras = {
//     listas: [{ id, nome }],                       // listas próprias (além das fixas)
//     itens:  [{ id, titulo, listaId, dataLimite?, orcamento?, links: [], comprado }]
//   }
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { fetchLife, pushLife } from './cloud';

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
const DEFAULT = { compras: { listas: [], itens: [] }, cultural: { itens: [] }, financas: { snapshots: [], usdRate: null }, saude: { pesos: DEFAULT_PESOS, remedios: [], vacinas: [], menstruacao: [] }, comprasFeitas: [], musica: [], assistir: [], marcos: [] };

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

// Gastos por mês (seed; vira editável e sincroniza após a 1ª edição). itens = [{ categoria, valor }].
const G = (categoria, valor) => ({ categoria, valor });
export const DEFAULT_GASTOS = [
  { mes: '2026-01', itens: [G('Fixos', 5737.75), G('Mercado', 1246.58), G('Uber', 582.23), G('Trabalho', 247.31), G('Mãe', 221.98), G('Saúde', 768.25), G('Viagem', 3194.94), G('Coisas', 207.30), G('Roupa', 569.90), G('Skin care', 1378.50), G('Bobeira', 558.16), G('Rolês', 1580.01), G('Presentes', 1014.57)] },
  { mes: '2026-02', itens: [G('Fixos', 6196.58), G('Mercado', 422.76), G('Uber', 707.07), G('Trabalho', 165.56), G('Mãe', 328.26), G('Saúde', 776.70), G('Viagem', 8939.44), G('Coisas', 6671.41), G('Roupa', 837.60), G('Bobeira', 36.85), G('Rolês', 1173.78), G('Presentes', 40.00)] },
  { mes: '2026-03', itens: [G('Fixos', 5651.88), G('Mercado', 1458.74), G('Uber', 845.11), G('Trabalho', 938.30), G('Mãe', 457.65), G('Saúde', 265.91), G('Viagem', 2727.06), G('Coisas', 1663.82), G('Roupa', 4333.68), G('Skin care', 300.61), G('Bobeira', 69.80), G('Rolês', 1654.81), G('Presentes', 278.00)] },
  { mes: '2026-04', itens: [G('Fixos', 5577.80), G('Mercado', 1390.67), G('Uber', 519.88), G('Trabalho', 248.78), G('Mãe', 629.58), G('Saúde', 2763.86), G('Viagem', 13249.03), G('Coisas', 1180.34), G('Roupa', 80.00), G('Skin care', 199.90), G('Bobeira', 140.88), G('Rolês', 584.54)] },
  { mes: '2026-05', itens: [G('Fixos', 5564.89), G('Mercado', 178.84), G('Uber', 494.56), G('Trabalho', 90.81), G('Mãe', 137.41), G('Saúde', 2700.00), G('Viagem', 8753.61), G('Coisas', 171.10), G('Skin care', 132.19), G('Bobeira', 140.61), G('Rolês', 507.75)] },
  { mes: '2026-06', itens: [G('Fixos', 6114.06), G('Mercado', 1565.27), G('Uber', 600.09), G('Trabalho', 194.33), G('Mãe', 293.50), G('Saúde', 2446.01), G('Viagem', 894.50), G('Coisas', 150.79), G('Skin care', 105.00), G('Bobeira', 68.88), G('Rolês', 996.04), G('Presentes', 533.70)] },
];

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
const MAQUIAGEM_ITENS = [
  'Base Vizzela Fix (05 ou 06)',
  'Corretor salmão Sephora',
  'Rare Beauty Stay Vulnerable melting blush (Apricot ou Mauvy)',
  'Boa paleta de sombras',
  'Iluminador Dior (que imita o Charlotte Tilbury)',
  'Corretivo Hourglass (suede)',
  'Rímel marrom para o dia a dia',
  'Curvex (curvador de cílios)',
];
function ensureMaquiagem(d) {
  if (d.maquiagemSeeded) return d;
  const compras = d.compras || { listas: [], itens: [] };
  if (compras.listas.some(l => l.id === 'maquiagem')) return { ...d, maquiagemSeeded: true };
  const itens = MAQUIAGEM_ITENS.map((titulo, i) => ({ id: 'mq' + i, titulo, listaId: 'maquiagem', comprado: false }));
  return { ...d, maquiagemSeeded: true, compras: { ...compras, listas: [...compras.listas, { id: 'maquiagem', nome: 'Maquiagem' }], itens: [...compras.itens, ...itens] } };
}

// Divide a lista Maquiagem em 3 grupos (itens reais, checáveis): "Compras decididas" (o que já tinha),
// "Experimentar BR" e "Comprar fora". As notas do tópico Maquiagem (Aprendizados) viram espelhos por
// grupo. Semeado uma vez (flag maquiagemGruposSeeded).
const MAQ_BR = [
  'Bases e corretivos: NARS (corretivo Honey), Lancôme, Chanel, Rose Inc base 60',
  'MAC Shine Control prime', 'Blush MAC Sunbasque', 'MAC Fix+', 'Stick Make B. multifuncional',
];
const MAQ_FORA = [
  'Glassy blush (Expresso)', 'Refy (blush e contorno em creme, pincel, lip gloss)', 'Patrick Ta (base, blush, contorno)',
  'Makeup by Mario (skin enhancer, contorno, blush)', 'Rhode (lips, blush)', 'Westman Atelier (blush)',
  'Beautycounter: Cheeky Clean cream blush', 'Hourglass (pincel, paleta, batom)', 'Summer Fridays (lip oil, skin tint)',
  'Saie Glowy Super Gel', 'Blush Nudestix', 'Iluminador Merit', 'Sisley Paris lip tint', 'Kosas (corretivo)',
  'Pixi corretor de olheira (Peach)', 'Tarte corretivo (caixinha)', 'The Ordinary Lash Curl',
];
function ensureMaquiagemGrupos(d) {
  if (d.maquiagemGruposSeeded) return d;
  const compras = d.compras || { listas: [], itens: [] };
  const have = new Set(compras.itens.map(i => i.id));
  // itens 'maquiagem' sem grupo viram "Compras decididas"
  let itens = compras.itens.map(i => (i.listaId === 'maquiagem' && !i.grupo) ? { ...i, grupo: 'Compras decididas' } : i);
  // adiciona BR e Fora como itens reais (ids estáveis, sem duplicar)
  const novos = [
    ...MAQ_BR.map((titulo, i) => ({ id: 'mqbr' + i, titulo, listaId: 'maquiagem', grupo: 'Experimentar BR', comprado: false })),
    ...MAQ_FORA.map((titulo, i) => ({ id: 'mqfora' + i, titulo, listaId: 'maquiagem', grupo: 'Comprar fora', comprado: false })),
  ].filter(it => !have.has(it.id));
  itens = [...itens, ...novos];
  // se aprendizados já está na nuvem, converte as notas da Maquiagem em espelhos por grupo
  let extra = {};
  if (d.aprendizados && d.aprendizados.notas) {
    const map = { 'maq-paracomprar': 'Compras decididas', 'maq-provar-br': 'Experimentar BR', 'maq-provar-fora': 'Comprar fora' };
    extra.aprendizados = { ...d.aprendizados, notas: d.aprendizados.notas.map(n => map[n.id] ? { ...n, tipo: 'compras', listaId: 'maquiagem', grupo: map[n.id], itens: [] } : n) };
  }
  return { ...d, maquiagemGruposSeeded: true, compras: { ...compras, itens }, ...extra };
}

// Itens da lista NY26 (viagem) — valores em USD. Sublistas via campo `grupo`; o teto de
// cada categoria fica no nome do grupo. Semeado uma vez (flag ny26Seeded) na lista que a
// Mari já criou (busca pelo nome "NY26"); se não existir, cria.
const G_MAQ = 'Maquiagens diferentes (máx US$ 200)';
const G_BOLSA = 'Bolsa da marca (máx US$ 400)';
const G_CLUTCH = 'Clutch preta de couro (máx US$ 100)';
const G_ROUPA = 'Roupas — outlet (máx US$ 700)';
const G_FONE = 'Fone (máx US$ 500)';
const G_LOJAS = 'Lojas';
const G_ESPEC = 'Coisas específicas';
const NY26_ITENS = [
  { grupo: G_MAQ, titulo: 'Merit' }, { grupo: G_MAQ, titulo: 'Patrick Ta' }, { grupo: G_MAQ, titulo: 'Makeup by Mario' },
  { grupo: G_MAQ, titulo: 'Rhode' }, { grupo: G_MAQ, titulo: 'Hourglass' }, { grupo: G_MAQ, titulo: 'Pixi' },
  { grupo: G_MAQ, titulo: 'YSL' }, { grupo: G_MAQ, titulo: 'Armani' }, { grupo: G_MAQ, titulo: 'Garnier BB cream (mãe)' },
  { grupo: G_BOLSA, titulo: 'Freja NYC' }, { grupo: G_BOLSA, titulo: 'Polène' }, { grupo: G_BOLSA, titulo: 'DeMellier' },
  { grupo: G_BOLSA, titulo: 'Verafied NY' }, { grupo: G_BOLSA, titulo: 'Songmont (Gather)' }, { grupo: G_BOLSA, titulo: 'Bob Oré (Taylor)' },
  { grupo: G_BOLSA, titulo: 'Wandler (Penélope)' }, { grupo: G_BOLSA, titulo: 'Reh Studios bag' }, { grupo: G_BOLSA, titulo: 'Chelsea (Coach)' },
  { grupo: G_BOLSA, titulo: 'Kate Spade duo crossbody' }, { grupo: G_BOLSA, titulo: 'Longchamp (bolsa de lado)' },
  { grupo: G_CLUTCH, titulo: 'Coach' }, { grupo: G_CLUTCH, titulo: 'Kate Spade' }, { grupo: G_CLUTCH, titulo: 'The Pouch' },
  { grupo: G_ROUPA, titulo: 'Ralph Lauren' }, { grupo: G_ROUPA, titulo: 'Calvin Klein' }, { grupo: G_ROUPA, titulo: 'Roupa de cama mil fios' },
  { grupo: G_ROUPA, titulo: 'Roupa de academia' }, { grupo: G_ROUPA, titulo: 'Bolsa Michael Kors' },
  { grupo: G_FONE, titulo: 'Sony' }, { grupo: G_FONE, titulo: 'Sennheiser HD 630' }, { grupo: G_FONE, titulo: 'Apple Max' },
  { grupo: G_LOJAS, titulo: "Macy's" }, { grupo: G_LOJAS, titulo: 'Outlet' }, { grupo: G_LOJAS, titulo: 'Farmácia' },
  { grupo: G_ESPEC, titulo: 'Óculos Wayfarer Ray-Ban', orcamento: 130 },
  { grupo: G_ESPEC, titulo: 'MoMA — relógio do autor', orcamento: 150 },
  { grupo: G_ESPEC, titulo: 'Boas coisas de papelaria (nada pesado)', orcamento: 50 },
  { grupo: G_ESPEC, titulo: 'Vinil — Olivia Dean, Taylor Swift, Rosalía, Bad Bunny (US$ 60 cada)', orcamento: 120 },
  { grupo: G_ESPEC, titulo: "Body splash Victoria's Secret", orcamento: 10 },
  { grupo: G_ESPEC, titulo: 'Tênis caminhada (Nike Zoom Vomero 5, NB 1906R, On Cloudtilt, Hoka Bondi 8)', orcamento: 150 },
  { grupo: G_ESPEC, titulo: 'Tênis corrida (Asics Novablast 4, Nike Pegasus 41, Brooks Ghost 16, Olympikus Corre Max, Hoka Clifton 9, On Cloudmonster 2)', orcamento: 150 },
  { grupo: G_ESPEC, titulo: 'Coisas IKEA', orcamento: 100 },
  { grupo: G_ESPEC, titulo: 'AirTag', orcamento: 90 },
  { grupo: G_ESPEC, titulo: 'Fone WH-1000XM6 (Sony)', orcamento: 400 },
  { grupo: G_ESPEC, titulo: 'Revlon 5 em 1', orcamento: 50 },
];
function ensureNY26(d) {
  if (d.ny26SeededV2) return d;
  const compras = d.compras || { listas: [], itens: [] };
  const norm = (s) => (s || '').replace(/\s+/g, '').toLowerCase();
  const existente = compras.listas.find(l => norm(l.nome) === 'ny26'); // casa "NY26", "NY 26", etc.
  const listaId = existente ? existente.id : 'ny26';
  const listas = existente ? compras.listas : [...compras.listas, { id: listaId, nome: 'NY26' }];
  // ids estáveis (ny0..nyN): só adiciona os que ainda não existem (auto-corretivo, sem duplicar).
  const have = new Set(compras.itens.map(i => i.id));
  const novos = NY26_ITENS
    .map((it, i) => ({ id: 'ny' + i, listaId, comprado: false, moeda: 'USD', grupo: it.grupo, titulo: it.titulo, orcamento: it.orcamento }))
    .filter(it => !have.has(it.id));
  return { ...d, ny26SeededV2: true, compras: { ...compras, listas, itens: [...compras.itens, ...novos] } };
}

// Histórico de compras feitas (Retrospectiva → Compras). Valores em R$. Semeado uma vez.
const CF_SEED = [
  ['2026-01', 'Vinil Cícero', 150], ['2026-01', 'Livro "A Vegetariana"', 52.30],
  ['2026-02', 'Óculos (grau)', 6182.80], ['2026-02', 'Livro "A Insustentável Leveza do Ser"', 37.90],
  ['2026-02', 'Potes de creme de cabelo', 17.90], ['2026-02', 'Blindagem', 19], ['2026-02', 'Óculos de sol', 251.10],
  ['2026-02', 'Creme de cabelo', 57.75], ['2026-02', 'Havaianas', 44.99],
  ['2026-03', 'Plantas (Ceagesp)', 170.35], ['2026-03', 'Filme analógico', 120], ['2026-03', 'Capa de tablet', 31.60],
  ['2026-03', 'Caixas (Kalunga)', 68.70], ['2026-03', 'Faixa de cabelo', 20.99], ['2026-03', 'Óculos Zerezes', 340],
  ['2026-03', 'Câmera analógica', 110], ['2026-03', 'Adaptador SD', 19.89], ['2026-03', 'Livro', 32.29],
  ['2026-04', 'Sapateiro', 30], ['2026-04', 'Estante', 74.17], ['2026-04', 'Banco de planta', 160],
  ['2026-04', 'Revelação de fotos', 130], ['2026-04', 'Relógio', 100], ['2026-04', 'Câmera analógica (×3)', 378],
  ['2026-04', 'Filme analógico (×4)', 149], ['2026-04', 'Revelação de fotos', 17.50],
  ['2026-05', 'Bolsa', 60], ['2026-05', 'Livro Tâmara I', 41.20], ['2026-05', 'Livro Tâmara II', 69.90],
  ['2026-06', 'Filme analógico', 92.36], ['2026-06', 'Mosquetão', 58.43],
];
function ensureComprasFeitas(d) {
  if (d.comprasFeitasSeeded) return d;
  const have = new Set((d.comprasFeitas || []).map(c => c.id));
  const novos = CF_SEED.map(([mes, titulo, valor], i) => ({ id: 'cf' + i, titulo, data: mes + '-15', valor, moeda: 'BRL' }))
    .filter(c => !have.has(c.id));
  return { ...d, comprasFeitasSeeded: true, comprasFeitas: [...(d.comprasFeitas || []), ...novos] };
}

// Retrospectiva → Música (Spotify por mês): [mes, minutos, top artista, top música]. Semeado uma vez.
const MUSICA_SEED = [
  ['2026-01', 3370, 'Taylor Swift', 'Reliquia'],
  ['2026-02', 1958, 'Taylor Swift', 'BAILE INoLVIDABLE'],
  ['2026-03', 1414, 'Taylor Swift', 'Reliquia'],
  ['2026-04', 1989, 'Taylor Swift', "Would've, Could've, Should've"],
  ['2026-05', 1695, 'Taylor Swift', 'Future Nostalgia'],
];
function ensureMusica(d) {
  if (d.musicaSeeded) return d;
  const have = new Set((d.musica || []).map(m => m.id));
  const novos = MUSICA_SEED.map(([mes, minutos, artista, musica], i) => ({ id: 'mu' + i, mes, minutos, artista, musica }))
    .filter(m => !have.has(m.id));
  return { ...d, musicaSeeded: true, musica: [...(d.musica || []), ...novos] };
}

// Dias importantes (marcos) enviados pela Mari. Semeados uma vez (flag marcosSeeded), ids estáveis.
const MARCOS_SEED = [
  ['2023-08-12', 'Me mudei para Capote'],
  ['2024-03-08', 'Comecei a treinar em casa'],
  ['2024-04-02', 'Comecei a treinar no spinning'],
  ['2024-04-03', 'Comecei a seguir dieta seriamente'],
  ['2024-05-25', 'Beijei o Pedro pela primeira vez'],
  ['2024-07-05', 'Comecei a treinar na academia'],
  ['2024-08-08', 'Decidi ir morar sozinha'],
  ['2024-08-31', 'Eu e Pedro começamos a namorar'],
  ['2024-09-07', 'Me mudei para Mourato'],
  ['2024-09-28', 'Conheci os pais do Pedro'],
  ['2024-10-01', 'Eu e o Pedro sobrevivemos à nossa primeira discussão'],
  ['2025-03-09', 'Mãe conhece os pais do Pedro'],
  ['2025-03-15', 'Tomei meu primeiro antidepressivo'],
  ['2025-03-15', 'Fiquei chapada pela primeira vez'],
  ['2025-06-06', 'Pedro terminou comigo'],
  ['2025-07-23', 'Transei com a primeira pessoa depois do Pedro'],
  ['2025-08-19', 'Fiquei no top 10 do II Brasil'],
  ['2025-08-25', 'Tive minha primeira crise de pânico'],
  ['2025-10-04', 'Entendi que o meu relacionamento com o Pedro era uma merda'],
  ['2025-10-05', 'Virei mergulhadora'],
  ['2025-11-29', 'Pisei na Ásia pela primeira vez'],
  ['2025-12-07', 'Fui apresentada como mergulhadora pela primeira vez'],
  ['2025-12-07', 'Mergulhei na Tailândia'],
  ['2025-12-24', 'Mergulhei com minha mãe em Salvador'],
  ['2026-02-08', 'Vivi um primeiro bloco de carnaval que mudou minha vida (Borogodó, no Rio de Janeiro)'],
  ['2026-03-23', 'Fui promovida à Associate'],
  ['2026-04-08', 'Fiz um código em Python rodar pela primeira vez'],
  ['2026-04-12', 'Fiz minha primeira corrida de rua'],
  ['2026-04-25', 'Fiz um banho turco pela primeira vez, em Rudas Budapest, e nunca me senti tão relaxada na vida'],
  ['2026-05-02', 'Decidi que não iria mais viajar com perrengue'],
  ['2026-06-20', 'Ouvi a vida com som de amizade mais uma vez (festa junina na casa do Leo)'],
];
function ensureMarcos(d) {
  if (d.marcosSeeded) return d;
  const have = new Set((d.marcos || []).map(m => m.id));
  const novos = MARCOS_SEED.map(([data, titulo], i) => ({ id: 'mc' + i, data, titulo })).filter(m => !have.has(m.id));
  return { ...d, marcosSeeded: true, marcos: [...(d.marcos || []), ...novos] };
}

// Livros para ler (Conteúdos para assistir, tipo 'livro') enviados pela Mari. Semeados uma vez.
const ASSISTIR_LIVROS_SEED = [
  'Tecidos: história, tramas e usos',
  'Rápido e devagar',
  'Carta de tarot e explicação',
  'O dia em que a Selma sonhou com o ocapi',
  'Knulp: Três histórias da vida de um andarilho',
  'Os sussurros',
  'No meu caminho — Malala',
  'Sobre os ossos dos mortos',
  'Sándor Márai (No rastro dos deuses · O legado de Esther · A conversa · Ember)',
  'Jogo da amarelinha',
  'A casa dos espíritos (trilogia)',
  'Pórtico — Magda Szabó',
  'Trem Noturno para Lisboa — Pascal Mercier',
  'O Fim do Homem Soviético — Svetlana Aleksiévitch',
  'A Bandeira Vermelha: A História do Comunismo — David Priestland',
  'Era dos Extremos: O Breve Século XX — Eric Hobsbawm',
  'The Power of the Powerless — Václav Havel',
  'Limite de caracteres: como Elon Musk destruiu o Twitter',
  'Untrue — Wednesday Martin',
  'A capital da vertigem',
  'A capital da solidão',
  'Metrópole — Ben Wilson',
];
function ensureAssistirLivros(d) {
  if (d.assistirLivrosSeeded) return d;
  const have = new Set((d.assistir || []).map(a => a.id));
  const novos = ASSISTIR_LIVROS_SEED.map((titulo, i) => ({ id: 'asl' + i, tipo: 'livro', titulo, feito: false })).filter(a => !have.has(a.id));
  return { ...d, assistirLivrosSeeded: true, assistir: [...(d.assistir || []), ...novos] };
}
// Patch único: quebra o item combinado do Sándor Márai (asl8) em 4 livros individuais, padronizados.
// Só mexe se o item original ainda existir intacto (respeita edição/remoção da Mari).
function ensureAssistirLivrosV2(d) {
  if (d.assistirLivrosV2) return d;
  let assistir = d.assistir || [];
  const tinhaCombinado = assistir.some(a => a.id === 'asl8' && (a.titulo || '').startsWith('Sándor Márai'));
  assistir = assistir.filter(a => !(a.id === 'asl8' && (a.titulo || '').startsWith('Sándor Márai')));
  if (tinhaCombinado) {
    const marai = [
      { id: 'asl8a', titulo: 'No rastro dos deuses — Sándor Márai' },
      { id: 'asl8b', titulo: 'O legado de Esther — Sándor Márai' },
      { id: 'asl8c', titulo: 'A conversa — Sándor Márai' },
      { id: 'asl8d', titulo: 'Ember — Sándor Márai' },
    ];
    const have = new Set(assistir.map(a => a.id));
    const novos = marai.filter(m => !have.has(m.id)).map(m => ({ ...m, tipo: 'livro', feito: false }));
    assistir = [...assistir, ...novos];
  }
  return { ...d, assistirLivrosV2: true, assistir };
}

// Aplica todos os seeds idempotentes do Life, na ordem.
function runLifeSeeds(d) {
  return rolarComprasVencidas(ensureAssistirLivrosV2(ensureAssistirLivros(ensureMarcos(ensureMusica(ensureComprasFeitas(ensureNY26(ensureMaquiagemGrupos(ensureMaquiagem(d)))))))));
}

const LifeContext = createContext(null);
const uid = (p = 'i') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
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

function readLocal() {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { ...DEFAULT }; }
}
function writeLocal(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} }

export function LifeProvider({ children }) {
  const [data, setData] = useState(() => runLifeSeeds(readLocal()));
  const dirty = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const local = readLocal();
      const cloud = await fetchLife();
      if (!alive || dirty.current) return;
      if (!cloud) {
        const next = runLifeSeeds(local);
        writeLocal(next); setData(next);
        if (next !== local || local.compras.itens.length || local.compras.listas.length) pushLife(next);
        return;
      }
      const merged = { ...DEFAULT, ...cloud, compras: { ...DEFAULT.compras, ...(cloud.compras || {}) }, financas: { ...DEFAULT.financas, ...(cloud.financas || {}) } };
      const next = runLifeSeeds(merged);
      writeLocal(next); setData(next);
      if (next !== merged) pushLife(next);
    })();
    return () => { alive = false; };
  }, []);

  const persist = (next) => { dirty.current = true; setData(next); writeLocal(next); pushLife(next); };

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
  const savePlanoInfo = (info) => setPlanos(info.id && planos.infos.some(x => x.id === info.id)
    ? { ...planos, infos: planos.infos.map(x => x.id === info.id ? info : x) }
    : { ...planos, infos: [...planos.infos, { ...info, id: uid('i') }] });
  const deletePlanoInfo = (id) => setPlanos({ ...planos, infos: planos.infos.filter(x => x.id !== id) });
  const addPlanoCheck = (planoId, texto) => setPlanos({ ...planos, itens: [...planos.itens, { id: uid('k'), planoId, texto, feito: false }] });
  const togglePlanoCheck = (id) => setPlanos({ ...planos, itens: planos.itens.map(x => x.id === id ? { ...x, feito: !x.feito } : x) });
  const setPlanoCheckPrazo = (id, prazo) => setPlanos({ ...planos, itens: planos.itens.map(x => x.id === id ? { ...x, prazo: prazo || undefined } : x) });
  const deletePlanoCheck = (id) => setPlanos({ ...planos, itens: planos.itens.filter(x => x.id !== id) });

  // ---- Calendário cultural ----
  const cultural = data.cultural || DEFAULT.cultural;
  const setCultural = (next) => persist({ ...data, cultural: next });
  const saveCulturalItem = (it) => setCultural(it.id && cultural.itens.some(x => x.id === it.id)
    ? { ...cultural, itens: cultural.itens.map(x => x.id === it.id ? it : x) }
    : { ...cultural, itens: [...cultural.itens, { ...it, id: uid('e') }] });
  const deleteCulturalItem = (id) => setCultural({ ...cultural, itens: cultural.itens.filter(x => x.id !== id) });

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

  // ---- Compras feitas (histórico só da Retrospectiva; não entra nas listas) ----
  const comprasFeitas = data.comprasFeitas || [];
  const saveCompraFeita = (c) => persist({ ...data, comprasFeitas: c.id && comprasFeitas.some(x => x.id === c.id)
    ? comprasFeitas.map(x => x.id === c.id ? c : x)
    : [...comprasFeitas, { ...c, id: uid('cf') }] });
  const deleteCompraFeita = (id) => persist({ ...data, comprasFeitas: comprasFeitas.filter(x => x.id !== id) });
  // Arquiva os itens já comprados de uma lista: saem da lista e viram histórico (comprasFeitas),
  // pra continuarem contando na Retrospectiva/Vida Financeira.
  const arquivarComprados = (listaId, listaNome) => {
    const compradosL = (compras.itens || []).filter(i => i.listaId === listaId && i.comprado);
    if (!compradosL.length) return;
    const feitas = compradosL.map(i => ({ id: uid('cf'), titulo: i.titulo, data: i.compradoEm || hojeISO(), valor: i.orcamento ? Number(i.orcamento) : undefined, moeda: i.moeda || 'BRL', categoria: i.grupo || listaNome || undefined }));
    persist({ ...data, compras: { ...compras, itens: compras.itens.filter(i => !(i.listaId === listaId && i.comprado)) }, comprasFeitas: [...comprasFeitas, ...feitas] });
  };

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

  // ---- Aprendizados (tópicos + notas) ----
  const aprendizados = data.aprendizados || DEFAULT_APRENDIZADOS;
  const setAprendizados = (next) => persist({ ...data, aprendizados: next });
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
  const saveAprendNota = (nota) => setAprendizados(nota.id && aprendizados.notas.some(n => n.id === nota.id)
    ? { ...aprendizados, notas: aprendizados.notas.map(n => n.id === nota.id ? nota : n) }
    : { ...aprendizados, notas: [...aprendizados.notas, { ...nota, id: uid('n') }] });
  const deleteAprendNota = (id) => setAprendizados({ ...aprendizados, notas: aprendizados.notas.filter(n => n.id !== id) });

  const value = {
    data, compras,
    addComprasItem, updateComprasItem, deleteComprasItem, toggleComprado, addComprasLista, deleteComprasLista, moveComprasLista,
    planos, addPlano, setPlanoPrazo, deletePlano, savePlanoInfo, deletePlanoInfo, addPlanoCheck, togglePlanoCheck, setPlanoCheckPrazo, deletePlanoCheck,
    cultural, saveCulturalItem, deleteCulturalItem,
    financas, saveFinancasSnapshot, deleteFinancasSnapshot, setFinancasUsdRate,
    salarios, saveSalarioAno, deleteSalarioAno,
    gastos, saveGastoMes, deleteGastoMes,
    saude, saveSaudeItem, deleteSaudeItem,
    aprendizados, addAprendTopico, deleteAprendTopico, moveAprendTopico, saveAprendNota, deleteAprendNota,
    comprasFeitas, saveCompraFeita, deleteCompraFeita, arquivarComprados,
    musica, saveMusica, deleteMusica,
    assistir, saveAssistir, deleteAssistir, toggleAssistir,
    marcos, saveMarco, deleteMarco,
  };
  return <LifeContext.Provider value={value}>{children}</LifeContext.Provider>;
}

export function useLife() {
  const ctx = useContext(LifeContext);
  if (!ctx) throw new Error('useLife precisa estar dentro de <LifeProvider>');
  return ctx;
}
