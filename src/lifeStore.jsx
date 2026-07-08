// Store da aba Life (sincroniza na nuvem, igual aos Salvos/Calendário).
// Por enquanto guarda a seção "compras"; as outras seções entram aqui depois.
//
//   life.compras = {
//     listas: [{ id, nome }],                       // listas próprias (além das fixas)
//     itens:  [{ id, titulo, listaId, dataLimite?, orcamento?, links: [], comprado }]
//   }
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { fetchLife, pushLife, saveLifeNow, onSyncStatus } from './cloud';
import { LEITURAS_LIDOS_SEED, TEMA_CANON, NAOFICCAO_TITULOS, LEITURAS_CASA_SEED, LEITURAS_NAOTENHO_SEED, LEITURA_ESPANHOL, LEITURA_INGLES, LEITURAS_ANOS_SEED } from './leiturasSeed.js';
import { GASTOS_ITENS_2026, GASTOS_TOTAIS_2026 } from './gastosSeed.js';

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
const DEFAULT = { compras: { listas: [], itens: [] }, cultural: { itens: [] }, recorrentes: [], financas: { snapshots: [], usdRate: null }, saude: { pesos: DEFAULT_PESOS, remedios: [], vacinas: [], menstruacao: [] }, comprasFeitas: [], musica: [], assistir: [], marcos: [], coisasCaras: [], viagens: [], viagensFuturas: [], leituras: [], gastosItens: [], acompLeituras: [], legendas: [{ id: 'leg-gerais', nome: 'Gerais', itens: [] }], viagensQuero: [], planosViagem: [], ingles: [], amorosa: [] };

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
// Totais 2026 (jan–jul) importados de D:\vida financeira.xlsx — ver src/gastosSeed.js.
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
// Patch: junho/2026 do Spotify (print da Mari).
function ensureMusicaJun(d) {
  if (d.musicaJun2026) return d;
  const nova = { id: 'mu5', mes: '2026-06', minutos: 2247, artista: 'Kid Abelha', musica: 'drop dead' };
  const have = (d.musica || []).some(m => m.id === nova.id || m.mes === nova.mes);
  return { ...d, musicaJun2026: true, musica: have ? d.musica : [...(d.musica || []), nova] };
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

// "Coisas caras" (Retrospectiva > Compras): quando comprou e quanto dura. ano + half (1|2 = semestre).
const COISAS_CARAS_SEED = [
  ['Kindle', 2017, 1],
  ['Computador', 2018, 1],
  ['Tablet', 2022, 2],
  ['iPhone', 2025, 1],
];
function ensureCoisasCaras(d) {
  if (d.coisasCarasSeeded) return d;
  const have = new Set((d.coisasCaras || []).map(c => c.id));
  const novos = COISAS_CARAS_SEED.map(([nome, ano, half], i) => ({ id: 'cc' + i, nome, ano, half })).filter(c => !have.has(c.id));
  return { ...d, coisasCarasSeeded: true, coisasCaras: [...(d.coisasCaras || []), ...novos] };
}

// Plano "Carnaval 2027" (Life > Planos) enviado pela Mari. Semeado uma vez (flag carnaval2027Seeded).
// Placas = info; Fantasias e Coisas a comprar = checklist (prefixados pra manter os grupos).
function ensureCarnaval2027(d) {
  if (d.carnaval2027Seeded) return d;
  const base = d.planos || DEFAULT_PLANOS;
  if (base.lista.some(p => p.id === 'carnaval-2027')) return { ...d, carnaval2027Seeded: true };
  const lista = [...base.lista, { id: 'carnaval-2027', nome: 'Carnaval 2027' }];
  const infos = [...base.infos, { id: 'cn-placas', planoId: 'carnaval-2027', titulo: 'Placas', texto: '• Viver é melhor que sonhar\n• Esqueceu de me bloquear no bloco\n• A mais linda história de amor' }];
  const novos = [
    'Fantasia: Medusa', 'Fantasia: Aranha', 'Fantasia: Anjo', 'Fantasia: Mounjaro', 'Fantasia: Repórter da Choquei',
    'Comprar: Dino', 'Comprar: Bolinha de sabão',
  ].map((texto, i) => ({ id: 'cn-k' + i, planoId: 'carnaval-2027', texto, feito: false }));
  const itens = [...base.itens, ...novos];
  return { ...d, carnaval2027Seeded: true, planos: { ...base, lista, infos, itens } };
}

// Viagens (Retrospectiva) enviadas pela Mari. [ano, titulo, locais[], paises[]]. Semeadas uma vez.
const VIAGENS_SEED = [
  ['jovem', 'Cananéia', [], ['Brasil']],
  ['jovem', 'Maceió', [], ['Brasil']],
  ['jovem', 'Rio de Janeiro', [], ['Brasil']],
  ['jovem', 'Porto Seguro', [], ['Brasil']],
  ['2020', 'Madrid', [], ['Espanha']],
  ['2020', 'Barcelona', [], ['Espanha']],
  ['2020', 'Granada', [], ['Espanha']],
  ['2020', 'Málaga', [], ['Espanha']],
  ['2020', 'Sevilla', [], ['Espanha']],
  ['2020', 'Cádiz', [], ['Espanha']],
  ['2020', 'Valência', [], ['Espanha']],
  ['2020', 'Paris', [], ['França']],
  ['2020', 'Roma', [], ['Itália']],
  ['2020', 'Caserta', [], ['Itália']],
  ['2020', 'Napoli', [], ['Itália']],
  ['2020', 'Capri', [], ['Itália']],
  ['2020', 'Pompéia', [], ['Itália']],
  ['2021', 'Salvador', [], ['Brasil']],
  ['2022', 'Porto Alegre', [], ['Brasil']],
  ['2022', 'Chapada dos Veadeiros', [], ['Brasil']],
  ['2022', 'Canoa Quebrada', [], ['Brasil']],
  ['2023', 'Foz do Iguaçu', [], ['Brasil']],
  ['2023', 'Argentina', ['Salta', 'Buenos Aires', 'Bariloche'], ['Argentina']],
  ['2023', 'Paraty', [], ['Brasil']],
  ['2023', 'Europa', ['Roma', 'Verona', 'Veneza', 'Milão', 'Paris', 'Bruxelas', 'Lisboa'], ['Itália', 'França', 'Bélgica', 'Portugal']],
  ['2024', 'Porto de Galinhas', [], ['Brasil']],
  ['2024', 'Jalapão', [], ['Brasil']],
  ['2024', 'Peru', ['Lima', 'Paracas', 'Cusco', 'Machu Picchu'], ['Peru']],
  ['2024', 'Londres', [], ['Inglaterra']],
  ['2024', 'Buenos Aires', [], ['Argentina']],
  ['2025', 'Petar', [], ['Brasil']],
  ['2025', 'Ilha Grande', [], ['Brasil']],
  ['2025', 'Roteiro mineiro', ['Belo Horizonte', 'Inhotim', 'Ouro Preto', 'Tiradentes', 'São João del-Rei'], ['Brasil']],
  ['2025', 'Tailândia', ['Bangkok', 'Chiang Mai', 'Koh Phi Phi', 'Krabi'], ['Tailândia']],
  ['2025', 'Doha', [], ['Catar']],
  ['2026', 'Carnaval BH', [], ['Brasil']],
  ['2026', 'Itatiaia', [], ['Brasil']],
  ['2026', 'Europa', ['Madrid', 'Budapest', 'Praga'], ['Espanha', 'Hungria', 'República Checa']],
];
function ensureViagens(d) {
  if (d.viagensSeeded) return d;
  const have = new Set((d.viagens || []).map(v => v.id));
  const novos = VIAGENS_SEED.map(([ano, titulo, locais, paises], i) => ({ id: 'vg' + i, ano, titulo, locais, paises })).filter(v => !have.has(v.id));
  return { ...d, viagensSeeded: true, viagens: [...(d.viagens || []), ...novos] };
}

// Patch: cidades visitadas que faltavam (lista do Google Maps da Mari, anos confirmados
// por ela). Cidade isolada vai no `titulo` (locais []); grupo/região vai em `locais`
// (ViagensRetro conta `locais` quando há, senão o título). Vaticano contado em Itália.
const VIAGENS_CIDADES_SEED = [
  ['jovem', 'Litoral e interior de SP', ['Bertioga', 'Guarujá', 'Santos', 'São Vicente', 'Praia Grande', 'Mairiporã', 'Embu-Guaçu', 'Itapecerica da Serra', 'Aparecida', 'Pres. Prudente', 'Bauru'], ['Brasil']],
  ['jovem', 'Ilhas de Cananéia', ['Ilha do Cardoso', 'Ilha Comprida'], ['Brasil']],
  ['2013', 'Trancoso', [], ['Brasil']],
  ['2016', 'Niterói', [], ['Brasil']],
  ['2017', 'Avaré e Americana', ['Avaré', 'Americana'], ['Brasil']],
  ['2018', 'Araraquara e São Carlos', ['Araraquara', 'São Carlos'], ['Brasil']],
  ['2019', 'Itu e Casa Branca', ['Itu', 'Casa Branca'], ['Brasil']],
  ['2020', 'Espanha — arredores de Madrid e Andaluzia', ['Segóvia', 'Toledo', 'Aranjuez', 'Alcalá de Henares', 'Navacerrada', 'Buitrago del Lozoya', 'San Lorenzo de El Escorial', 'Nerja', 'Maro', 'Alicante'], ['Espanha']],
  ['2020', 'França e Itália (mais)', ['Versalhes', 'Vaticano', 'Santa Maria Capua Vetere'], ['França', 'Itália']],
  ['2020', 'Litoral do Paraná', ['Matinhos', 'Morretes'], ['Brasil']],
  ['2021', 'Ubatuba', [], ['Brasil']],
  ['2021', 'Ilhas da Bahia', ['Itaparica', 'Morro de São Paulo', 'Ilha dos Frades'], ['Brasil']],
  ['2022', 'Ubatuba', [], ['Brasil']],
  ['2022', 'Boituva', [], ['Brasil']],
  ['2022', 'Luminárias', [], ['Brasil']],
  ['2022', 'Beberibe', [], ['Brasil']],
  ['2022', 'Chapada dos Veadeiros (arredores)', ['Cavalcante', 'Alto Paraíso de Goiás'], ['Brasil']],
  ['2022', 'Serra gaúcha', ['Canela', 'Gramado'], ['Brasil']],
  ['2023', 'Argentina — Salta e Andes', ['Cafayate', 'Cachi', 'San Martín de Los Andes'], ['Argentina']],
  ['2023', 'Puerto Iguazú', [], ['Argentina']],
  ['2023', 'Europa — Veneza, Bruges e Vaticano', ['Murano', 'Burano', 'Torcello', 'Bruges', 'Vaticano'], ['Itália', 'Bélgica']],
  ['2023', 'Trindade', [], ['Brasil']],
  ['2023', 'São Miguel dos Milagres', [], ['Brasil']],
  ['2024', 'Peru — Vale Sagrado e Ica', ['Maras', 'Písac', 'Ollantaytambo', 'Chinchero', 'Urubamba', 'Huacachina', 'Ica', 'Machu Picchu pueblo'], ['Peru']],
  ['2024', 'Palmas', [], ['Brasil']],
  ['2024', 'Recife', [], ['Brasil']],
  ['2024', 'Campos do Jordão', [], ['Brasil']],
  ['2024', 'Tigre', [], ['Argentina']],
  ['2025', 'Tailândia — Ayutthaya, Chiang Rai e Railay', ['Ayutthaya', 'Chiang Rai', 'Praia de Railay'], ['Tailândia']],
  ['2025', 'Iporanga', [], ['Brasil']],
  ['2025', 'Angra e Ilha da Jipóia', ['Angra dos Reis', 'Ilha da Jipóia'], ['Brasil']],
];
function ensureViagensCidades(d) {
  if (d.viagensCidades1) return d;
  const have = new Set((d.viagens || []).map(v => v.id));
  const novos = VIAGENS_CIDADES_SEED.map(([ano, titulo, locais, paises], i) => ({ id: 'vgc' + i, ano, titulo, locais, paises })).filter(v => !have.has(v.id));
  return { ...d, viagensCidades1: true, viagens: [...(d.viagens || []), ...novos] };
}

// Patch: junta os "extras" que eu havia criado como entradas separadas dentro da
// viagem-pai (ex.: Tailândia aparecia 2x; Petar e Iporanga eram a mesma viagem) e
// remove as redundantes. Cidade conta por `locais`, então a pai vira um grupo com
// todas as cidades (mantém a contagem; some a duplicação na timeline).
function ensureViagensMerge(d) {
  if (d.viagensMerge1) return d;
  const M = {
    vg0:  { titulo: 'Cananéia e ilhas', locais: ['Cananéia', 'Ilha do Cardoso', 'Ilha Comprida'] },
    vg17: { titulo: 'Salvador e ilhas', locais: ['Salvador', 'Itaparica', 'Morro de São Paulo', 'Ilha dos Frades'] },
    vg18: { titulo: 'Porto Alegre e serra gaúcha', locais: ['Porto Alegre', 'Canela', 'Gramado'] },
    vg19: { titulo: 'Chapada dos Veadeiros e arredores', locais: ['Chapada dos Veadeiros', 'Cavalcante', 'Alto Paraíso de Goiás'] },
    vg20: { titulo: 'Canoa Quebrada e Beberibe', locais: ['Canoa Quebrada', 'Beberibe'] },
    vg21: { titulo: 'Foz e Puerto Iguazú', locais: ['Foz do Iguaçu', 'Puerto Iguazú'], paises: ['Brasil', 'Argentina'] },
    vg22: { titulo: 'Argentina', locais: ['Salta', 'Buenos Aires', 'Bariloche', 'Cafayate', 'Cachi', 'San Martín de Los Andes'] },
    vg23: { titulo: 'Paraty e Trindade', locais: ['Paraty', 'Trindade'] },
    vg24: { titulo: 'Europa', locais: ['Roma', 'Verona', 'Veneza', 'Milão', 'Paris', 'Bruxelas', 'Lisboa', 'Murano', 'Burano', 'Torcello', 'Bruges', 'Vaticano'] },
    vg25: { titulo: 'Porto de Galinhas e Recife', locais: ['Porto de Galinhas', 'Recife'] },
    vg26: { titulo: 'Jalapão e Palmas', locais: ['Jalapão', 'Palmas'] },
    vg27: { titulo: 'Peru', locais: ['Lima', 'Paracas', 'Cusco', 'Machu Picchu', 'Maras', 'Písac', 'Ollantaytambo', 'Chinchero', 'Urubamba', 'Huacachina', 'Ica', 'Machu Picchu pueblo'] },
    vg30: { titulo: 'Petar e Iporanga', locais: ['Petar', 'Iporanga'] },
    vg31: { titulo: 'Ilha Grande e Angra', locais: ['Ilha Grande', 'Angra dos Reis', 'Ilha da Jipóia'] },
    vg33: { titulo: 'Tailândia', locais: ['Bangkok', 'Chiang Mai', 'Koh Phi Phi', 'Krabi', 'Ayutthaya', 'Chiang Rai', 'Praia de Railay'] },
  };
  const remove = new Set(['vgc1', 'vgc11', 'vgc15', 'vgc16', 'vgc17', 'vgc18', 'vgc19', 'vgc20', 'vgc21', 'vgc23', 'vgc24', 'vgc25', 'vgc28', 'vgc29', 'vgc30']);
  const viagens = (d.viagens || []).filter(v => !remove.has(v.id)).map(v => M[v.id] ? { ...v, ...M[v.id] } : v);
  return { ...d, viagensMerge1: true, viagens };
}

// Viagem futura FLIP 2026 (alimenta o Modo Viagem + o card em Life > Viagens).
// Mesas (21): títulos = versos da Orides Fontela (homenageada). [dia, hora, n, titulo, autores, link].
// Links oficiais por mesa (flip.org.br/evento/...), conferidos no site da 24ª Flip.
const FLIP_MESAS = [
  ['2026-07-22', '19h30', 1, '"entra furtivamente a luz"', 'Augusto Massi, Marília Garcia', 'https://flip.org.br/evento/mesa-1-entra-furtivamente-a-luz/'],
  ['2026-07-23', '10h', 2, '"saber de cor o silêncio"', 'Edimilson de Almeida Pereira, José Tolentino de Mendonça', 'https://flip.org.br/evento/mesa-2-saber-de-cor-o-silencio/'],
  ['2026-07-23', '12h', 3, '"não vim. não vi. não havia guerra alguma"', 'Andrei Kurkov, Maria Reva', 'https://flip.org.br/evento/mesa-3-nao-vim-nao-vi-nao-havia-guerra-alguma/'],
  ['2026-07-23', '15h', 4, '"mas para que serve o pássaro? o pássaro não serve"', 'Andréa del Fuego, Paulliny Tort', 'https://flip.org.br/evento/mesa-4-mas-para-que-serve-o-passaro-o-passaro-nao-serve/'],
  ['2026-07-23', '17h', 5, '"A infância volta devagarinho"', 'Andrea Bajani, Maria Esther Maciel', 'https://flip.org.br/evento/mesa-5-a-infancia-volta-devagarinho/'],
  ['2026-07-23', '19h', 6, '"falo do que impede o sono"', 'Djaimilia Pereira de Almeida, Kamel Daoud', 'https://flip.org.br/evento/mesa-6-falo-do-que-impede-o-sono/'],
  ['2026-07-23', '21h', 7, '"Do livro ao palco: Dalton, que tinha um cachorro"', 'Denise Stoklos', 'https://flip.org.br/evento/mesa-7-do-livro-ao-palco-dalton-que-tinha-um-cachorro/'],
  ['2026-07-24', '10h', 8, '"água parada água parada água parando"', 'Carmen Stephan, Drauzio Varella', 'https://flip.org.br/evento/mesa-8-agua-parada-agua-parada-agua-parando/'],
  ['2026-07-24', '12h', 9, '"a severa arquitetura serenamente prende-nos"', 'José Godoy, Solano Benítez', 'https://flip.org.br/evento/mesa-9-mesa-ze-kleber-a-severa-arquitetura-serenamente-prende-nos/'],
  ['2026-07-24', '13h30', 10, '"estado de sítio, estado de sido, estase"', 'Carmen Lúcia', 'https://flip.org.br/evento/mesa-10-estado-de-sitio-estado-de-sido-estase/'],
  ['2026-07-24', '15h', 11, '"Como revelar-te se me revelas?"', 'Flávia Péret, Julieta Correa', 'https://flip.org.br/evento/mesa-11-como-revelar-te-se-me-revelas/'],
  ['2026-07-24', '17h', 12, '"e perdura. Apesar"', 'Bethânia Pires Amaro, Nathacha Appanah', 'https://flip.org.br/evento/mesa-12-e-perdura-apesar/'],
  ['2026-07-24', '19h', 13, '"o tecido: não sabemos qual a trama"', 'Katie Kitamura, Marta Pérez-Carbonell', 'https://flip.org.br/evento/mesa-13-o-tecido-nao-sabemos-qual-a-trama/'],
  ['2026-07-25', '10h', 14, '"a saída é a volta"', 'Eduardo Halfon, Paloma Vidal', 'https://flip.org.br/evento/mesa-14-a-saida-e-a-volta/'],
  ['2026-07-25', '12h', 15, '"se o delírio te eleva à potência do abismo"', 'João Cezar de Castro Rocha, Paulo Schiller', 'https://flip.org.br/evento/mesa-15-se-o-delirio-te-eleva-a-potencia-do-abismo/'],
  ['2026-07-25', '15h', 16, '"o boi é só. o boi é só. o boi"', 'Ana Paula Tavares', 'https://flip.org.br/evento/mesa-16-o-boi-e-so-o-boi-e-so-o-boi/'],
  ['2026-07-25', '17h', 17, '"não mais sabemos do barco, mas há sempre um náufrago"', 'Hisham Matar, Milton Hatoum', 'https://flip.org.br/evento/mesa-17-nao-mais-sabemos-do-barco-mas-ha-sempre-um-naufrago/'],
  ['2026-07-25', '19h', 18, '"e este chão não existe, e esta paz é vertigem"', 'Zadie Smith', 'https://flip.org.br/evento/mesa-18-e-este-chao-nao-existe-e-esta-paz-e-vertigem/'],
  ['2026-07-26', '10h', 19, '"a porta está aberta"', 'Ernesto Mané, Ève Guerra', 'https://flip.org.br/evento/mesa-19-a-porta-esta-aberta/'],
  ['2026-07-26', '12h', 20, '"nunca crer no que não canta"', 'Leonardo Gandolfi, Mateus Baldi', 'https://flip.org.br/evento/mesa-20-nunca-crer-no-que-nao-canta/'],
  ['2026-07-26', '15h30', 21, '"o que faço desfaço, o que amo desamo"', 'Eva Baltasar, Susy Freitas', 'https://flip.org.br/evento/mesa-21-o-que-faco-desfaco-o-que-amo-desamo/'],
];
const FLIP_HOMENAGEADA = {
  nome: 'Orides Fontela',
  texto: 'Orides Fontela (São João da Boa Vista/SP, 1940 – São Paulo, 1998) foi uma das vozes mais originais da poesia brasileira contemporânea. De família humilde, formou-se em Filosofia na USP e trabalhou como professora primária e bibliotecária. Seu poema "Elegia", publicado em 1965 no jornal O Município, chamou a atenção do crítico Davi Arrigucci Jr. e a projetou no cenário literário; ao longo da vida teve o apoio de figuras como Antonio Candido e Marilena Chaui. Praticante de zen-budismo desde 1972, uniu a essa influência suas leituras filosóficas e a vida no interior — marcas de uma poesia povoada de pássaros, flores, rios e silêncio.\n\nSua obra é conhecida pela concisão, pelo rigor formal com a língua e pelo despojamento de ornamentos. Publicou Transposição (1969), Helianto (1973), Alba (1983, Prêmio Jabuti), Rosácea (1986) e Teia (1996, Prêmio APCA); a obra foi reunida postumamente em Poesia reunida (2006) e Poesia completa (2015). Em 2007 recebeu, postumamente, a Medalha da Ordem do Mérito Cultural.',
  link: 'https://flip.org.br/ed/24a-flip/artistico/orides-fontela-autora-homenageada/',
};
// Sinopses oficiais de cada mesa (flip.org.br/evento/…), por número da mesa.
const FLIP_MESA_DESCS = {
  1: 'Dois poetas que transitam bem entre a poesia e outros gêneros — o romance, a crônica — e entendem a poesia não só como exercício espontâneo, mas desenhada com capricho para criar um projeto que faça sentido.',
  2: 'Poetas de uma mesma geração, de obra vasta e grande erudição, o português José Tolentino Mendonça e o brasileiro Edimilson de Almeida Pereira conversam sobre linguagem poética, enigma e identidade.',
  3: 'Como narrar o que se viu — e o que não se viu, mas está acontecendo? Maria Reva (canadense de origem ucraniana) e Andrei Kurkov tratam, por caminhos distintos (ela em romance bem-humorado, ele em diários), da guerra da Ucrânia e do dilema ético de narrar o conflito.',
  4: 'Duas das mais inventivas ficcionistas brasileiras da atualidade conversam sobre seus livros, a capacidade de fabulação e a função da literatura.',
  5: 'Dois grandes escritores, um italiano e uma brasileira, conversam sobre romances que questionam o amor compulsório dos filhos pelos pais e revisam a relação familiar.',
  6: 'Vencedor do Goncourt 2024, Kamel Daoud, e a luso-angolana Djaimilia Pereira de Almeida (autora de Luanda, Lisboa, Paraíso) conversam sobre a construção de seus romances e sobre esquecimento, luto e dever de memória.',
  7: 'Espetáculo inspirado na obra de Dalton Trevisan, com direção de Alessandra Maestrini — estreia na FLIP.',
  8: 'Uma conversa sobre escrita, doenças tropicais, medicina, vida e morte. Carmen Stephan, autora de um romance sobre a malária narrado pelo mosquito, e Drauzio Varella, de O médico doente, sobre quando contraiu febre amarela e esteve à beira da morte.',
  9: '"De que modo se habita um espaço? A serviço de quem está o uso de um lugar?" Um arquiteto paraguaio e um jornalista brasileiro debatem formas de ocupar o espaço, contrastando a história repressiva da Ilha Dawson com arquiteturas que respeitam a natureza e as populações locais.',
  10: 'A ministra do STF Cármen Lúcia fala de seu livro recém-lançado, Pela mão do povo – Democracia e voto no Brasil, e dos recentes ataques à democracia brasileira.',
  11: 'Uma escritora mineira e uma argentina falam de seus livros, que narram com delicadeza e humor o adoecimento por demência de mulheres da família, refletindo sobre as relações entre gerações.',
  12: 'Duas escritoras, uma brasileira e uma franco-mauriciana, conversam sobre livros de protagonistas mulheres e as diferentes formas de violência que enfrentam. Com Nathacha Appanah (Femina 2025) e Bethânia Pires Amaro (Jabuti 2024).',
  13: '"Até onde acreditar no que se lê?" As romancistas Katie Kitamura e Marta Pérez-Carbonell discutem narradores pouco confiáveis, narrativas que desestabilizam o leitor e o efeito ilusório da ficção.',
  14: 'Um escritor guatemalteco de origem judaica, criado nos EUA e hoje em Berlim, e uma escritora argentina que vive no Brasil discutem seus projetos literários, deslocamentos e identidades — ambos escrevem em línguas diferentes de suas origens.',
  15: 'Encontro de dois ensaístas sobre o autoritarismo e a ascensão da extrema direita. O crítico João Cezar de Castro Rocha e o psicanalista e tradutor Paulo Schiller tentam entender, a partir de suas áreas, como comportamentos autoritários ganharam a cena.',
  16: 'Vencedora do Prêmio Camões 2025, a poeta, ensaísta e pesquisadora angolana Ana Paula Tavares fala de sua trajetória e de sua poesia — marcadas pela história de seu país e pela luta pela emancipação feminina — e de sua conexão com o Brasil pela língua e pela literatura.',
  17: 'Hisham Matar conversa com Milton Hatoum sobre famílias cujo destino é determinado por governos autoritários, a partir de suas experiências com ditaduras, explorando memória, literatura, política e ficção.',
  18: 'Entrevista com a britânica Zadie Smith, uma das vozes mais celebradas da literatura em língua inglesa, sobre sua obra, a construção de seus livros e temas como colonialismo, imigração e racismo.',
  19: 'Dois autores refletem sobre a diáspora africana contemporânea — imigração, violência, famílias birraciais, afeto, identidade e pertencimento. Um físico e diplomata brasileiro relata a viagem à Guiné-Bissau para conhecer a família paterna; a francesa Ève Guerra narra a repatriação do corpo do pai do Congo para a Europa.',
  20: 'Um poeta atento às pequenas coisas do cotidiano e uma contista que mira o espaço urbano; somam-se um poeta-pesquisador que enaltece a música nos versos e uma ensaísta dedicada a um dos maiores discos da MPB. Um encontro sobre poemas, canções e cidades.',
  21: 'Encontro de duas escritoras de enorme originalidade: a catalã Eva Baltasar, de uma vertiginosa trilogia sobre a maternidade, e a amazonense Susy Freitas, de No baile do juízo final. Ambas desconstroem estereótipos femininos e exploram personagens em situações-limite.',
};
function ensureFlip2026(d) {
  if (d.flip2026Seeded) return d;
  const have = new Set((d.viagensFuturas || []).map(v => v.id));
  if (have.has('vf-flip2026')) return { ...d, flip2026Seeded: true };
  const viagem = {
    id: 'vf-flip2026', titulo: 'FLIP 2026', cidade: 'Paraty',
    inicio: '2026-07-22', fim: '2026-07-26',
    link: 'https://flip.org.br/ed/24a-flip/',
    hospedagem: '', passagens: '', notas: '',
    homenageada: FLIP_HOMENAGEADA,
    mesas: FLIP_MESAS.map(([dia, hora, n, titulo, autores, link]) => ({ id: 'flipm-' + n, n, dia, hora, titulo, autores, link: link || '', desc: FLIP_MESA_DESCS[n] || '' })),
    levar: [], comprar: [],
  };
  return { ...d, flip2026Seeded: true, viagensFuturas: [...(d.viagensFuturas || []), viagem] };
}
// Patch único: preenche o link oficial de cada mesa da FLIP já semeada, SEM sobrescrever
// um link que a Mari tenha colado à mão (só age em mesa com link vazio). Flag nova.
function ensureFlipMesaLinks(d) {
  if (d.flipMesaLinks1) return d;
  const links = Object.fromEntries(FLIP_MESAS.map(([, , n, , , link]) => ['flipm-' + n, link]));
  const viagens = (d.viagensFuturas || []).map(v => v.id !== 'vf-flip2026' ? v
    : { ...v, mesas: (v.mesas || []).map(m => (!m.link && links[m.id]) ? { ...m, link: links[m.id] } : m) });
  return { ...d, flipMesaLinks1: true, viagensFuturas: viagens };
}
// Patch único: preenche a sinopse de cada mesa (onde vazia) e atualiza a bio da homenageada
// na FLIP já semeada; migra a checklist antiga (`checklist`) para a lista "levar". Flag nova.
function ensureFlipDetalhes(d) {
  if (d.flipDetalhes1) return d;
  const viagens = (d.viagensFuturas || []).map(v => v.id !== 'vf-flip2026' ? v : {
    ...v,
    homenageada: { ...(v.homenageada || {}), nome: 'Orides Fontela', texto: FLIP_HOMENAGEADA.texto, link: FLIP_HOMENAGEADA.link },
    levar: v.levar || v.checklist || [],
    comprar: v.comprar || [],
    mesas: (v.mesas || []).map(m => (!m.desc && FLIP_MESA_DESCS[m.n]) ? { ...m, desc: FLIP_MESA_DESCS[m.n] } : m),
  });
  return { ...d, flipDetalhes1: true, viagensFuturas: viagens };
}

// Livros já lidos (importados do Skoob) → slice `leituras` com lido:true. Idempotente.
function ensureLeiturasLidos(d) {
  if (d.leiturasLidosSeeded) return d;
  const have = new Set((d.leituras || []).map(l => l.id));
  const novos = LEITURAS_LIDOS_SEED
    .map(([titulo, autor, pais, idioma, ano, genero, paginas, temas], i) => ({
      id: 'lv-lido-' + i, titulo, autor, pais, idioma,
      ano: ano || undefined, genero, paginas, temas, lido: true,
    }))
    .filter(l => !have.has(l.id));
  return { ...d, leiturasLidosSeeded: true, leituras: [...(d.leituras || []), ...novos] };
}
// Livros que a Mari tem em casa (a ler) → slice `leituras` com lido:false. Idempotente.
function ensureLeiturasCasa(d) {
  if (d.leiturasCasaSeeded) return d;
  const have = new Set((d.leituras || []).map(l => l.id));
  const novos = LEITURAS_CASA_SEED
    .map(([titulo, autor, pais, idioma, ano, genero, paginas, temas, tipo], i) => ({
      id: 'lv-casa-' + i, titulo, autor, pais, idioma, ano: ano || undefined, genero, paginas, temas, tipo, lido: false,
    }))
    .filter(l => !have.has(l.id));
  return { ...d, leiturasCasaSeeded: true, leituras: [...(d.leituras || []), ...novos] };
}
// Livros que a Mari quer ler mas NÃO TEM (de "Conteúdos para assistir") → leituras com tenho:false.
function ensureLeiturasNaoTenho(d) {
  if (d.leiturasNaoTenhoSeeded) return d;
  const have = new Set((d.leituras || []).map(l => l.id));
  const novos = LEITURAS_NAOTENHO_SEED
    .map(([titulo, autor, pais, idioma, ano, genero, paginas, temas, tipo], i) => ({
      id: 'lv-nt-' + i, titulo, autor, pais, idioma, ano: ano || undefined, genero, paginas, temas, tipo, tenho: false, lido: false,
    }))
    .filter(l => !have.has(l.id));
  return { ...d, leiturasNaoTenhoSeeded: true, leituras: [...(d.leituras || []), ...novos] };
}
// Patch único: classifica cada leitura em ficção / não ficção (onde ainda não tem `tipo`).
function ensureLeiturasTipo(d) {
  if (d.leiturasTipo1) return d;
  if (!d.leituras || !d.leituras.length) return { ...d, leiturasTipo1: true };
  const naoFiccao = new Set(NAOFICCAO_TITULOS);
  const leituras = d.leituras.map(l => l.tipo ? l : { ...l, tipo: naoFiccao.has(l.titulo) ? 'não ficção' : 'ficção' });
  return { ...d, leiturasTipo1: true, leituras };
}
// Patch: gênero simplificado em 7 categorias (campo `tipo`): ficção / não ficção / poesia / teatro /
// contos e crônicas / quadrinhos / YA — derivado do gênero detalhado (+ tipo não-ficção anterior).
function ensureLeiturasCat(d) {
  if (d.leiturasCat1) return d;
  if (!d.leituras || !d.leituras.length) return { ...d, leiturasCat1: true };
  const catDe = (l) => {
    const g = (l.genero || '').toLowerCase();
    if (/poesia/.test(g)) return 'poesia';
    if (/teatro|tragédia/.test(g)) return 'teatro';
    if (/quadrinhos/.test(g)) return 'quadrinhos';
    if (/conto|crônica/.test(g)) return 'contos e crônicas';
    if (l.tipo === 'não ficção' || /não ficção/.test(g)) return 'não ficção';
    if (/\bya\b/.test(g)) return 'YA';
    return 'ficção';
  };
  return { ...d, leiturasCat1: true, leituras: d.leituras.map(l => ({ ...l, tipo: catDe(l) })) };
}
// Patch: preenche o(s) ano(s) de leitura (`lidoEm`) por título (não sobrescreve se a Mari já editou).
function ensureLeiturasAnos(d) {
  if (d.leiturasAnos1) return d;
  if (!d.leituras || !d.leituras.length) return { ...d, leiturasAnos1: true };
  const leituras = d.leituras.map(l => {
    const anos = LEITURAS_ANOS_SEED[l.titulo];
    return (anos && !(l.lidoEm && l.lidoEm.length)) ? { ...l, lidoEm: anos } : l;
  });
  return { ...d, leiturasAnos1: true, leituras };
}
// Patch: acrescenta um livro lido que faltou nos prints do Skoob (Amyr Klink, lido em 2025).
function ensureLeiturasAmyr(d) {
  if (d.leiturasAmyr1) return d;
  const have = new Set((d.leituras || []).map(l => (l.titulo || '').toLowerCase()));
  if (have.has('cem dias entre céu e mar')) return { ...d, leiturasAmyr1: true };
  const livro = {
    id: 'lv-amyr-cemdias', titulo: 'Cem dias entre céu e mar', autor: 'Amyr Klink',
    pais: 'Brasil', idioma: 'Português', ano: 1985, genero: 'Não ficção / Relato', paginas: 264,
    tipo: 'não ficção', temas: ['aventura', 'natureza', 'solidão', 'sobrevivência'],
    lido: true, tenho: true, lidoEm: [2025],
  };
  return { ...d, leiturasAmyr1: true, leituras: [...(d.leituras || []), livro] };
}
// Patch: idioma de leitura em 3 línguas (Português padrão; Espanhol/Inglês p/ os títulos no original).
function ensureLeiturasIdioma3(d) {
  if (d.leiturasIdioma3) return d;
  if (!d.leituras || !d.leituras.length) return { ...d, leiturasIdioma3: true };
  const es = new Set(LEITURA_ESPANHOL), en = new Set(LEITURA_INGLES);
  const idiomaDe = (t) => es.has(t) ? 'Espanhol' : en.has(t) ? 'Inglês' : 'Português';
  return { ...d, leiturasIdioma3: true, leituras: d.leituras.map(l => ({ ...l, idioma: idiomaDe(l.titulo) })) };
}
// Patch: remove os itens de livro de "Conteúdos para assistir" (agora concentrados nas Leituras).
function ensureAssistirSemLivros(d) {
  if (d.assistirSemLivros) return d;
  return { ...d, assistirSemLivros: true, assistir: (d.assistir || []).filter(a => a.tipo !== 'livro') };
}
// Patch único: poesia / teatro / quadrinhos / contos viram a categoria "outros" (pelo gênero).
function ensureLeiturasOutros(d) {
  if (d.leiturasOutros1) return d;
  if (!d.leituras || !d.leituras.length) return { ...d, leiturasOutros1: true };
  const ehOutro = (g) => /poesia|teatro|tragédia|quadrinhos|conto/i.test(g || '');
  const leituras = d.leituras.map(l => ehOutro(l.genero) ? { ...l, tipo: 'outros' } : l);
  return { ...d, leiturasOutros1: true, leituras };
}
// Patch único: consolida os temas das leituras p/ o vocabulário enxuto (TEMA_CANON),
// funde sinônimos e descarta lugares; dedupe + teto de 5. Não mexe em outros campos.
function ensureLeiturasTemasV2(d) {
  if (d.leiturasTemasV2) return d;
  if (!d.leituras || !d.leituras.length) return { ...d, leiturasTemasV2: true };
  const leituras = d.leituras.map(l => {
    if (!l.temas || !l.temas.length) return l;
    const norm = [];
    for (const t of l.temas) {
      const c = (t in TEMA_CANON) ? TEMA_CANON[t] : t;
      if (c && !norm.includes(c)) norm.push(c);
    }
    return { ...l, temas: norm.slice(0, 5) };
  });
  return { ...d, leiturasTemasV2: true, leituras };
}

// Quebra itemizada dos Gastos por categoria (Retrospectiva). [mes, categoria, nome, valor].
// Os itens somam o total da categoria no mês (que vem da Vida Financeira). Semeado por lote/categoria.
const GASTOS_PRESENTES_SEED = [
  ['2026-01', 'Presentes', 'Doação', 10],
  ['2026-01', 'Presentes', 'Estacionamento mãe', 60],
  ['2026-01', 'Presentes', 'Assador mãe', 712.47],
  ['2026-01', 'Presentes', 'Café mãe', 71.60],
  ['2026-01', 'Presentes', 'Posto praia', 121.80],
  ['2026-01', 'Presentes', 'Pedágio', 38.70],
  ['2026-02', 'Presentes', 'Laços', 40],
  ['2026-03', 'Presentes', 'Laços', 80],
  ['2026-03', 'Presentes', 'Sorvete Raul', 48],
  ['2026-03', 'Presentes', 'Vaquinha Milena', 150],
  ['2026-06', 'Presentes', 'Presente Lucy e Thales (Westwing)', 533.70],
];
function ensureGastosPresentes(d) {
  if (d.gastosPresentesSeeded) return d;
  const have = new Set((d.gastosItens || []).map(x => x.id));
  const novos = GASTOS_PRESENTES_SEED.map(([mes, categoria, nome, valor], i) => ({ id: 'gi-pres-' + i, mes, categoria, nome, valor })).filter(x => !have.has(x.id));
  return { ...d, gastosPresentesSeeded: true, gastosItens: [...(d.gastosItens || []), ...novos] };
}

// Limpeza única: remove de comprasFeitas os itens que vazaram da lista de compras (botão antigo
// "limpar comprados"), pelos títulos exatos confirmados pela Mari. Roda uma vez (flag).
function ensureLimparVazados(d) {
  if (d.limparVazados1) return d;
  const nomes = new Set(['Escova secadora', 'Protetor térmico', 'Depilação buço', 'Creme depilatório', 'Sabonete academia']);
  return { ...d, limparVazados1: true, comprasFeitas: (d.comprasFeitas || []).filter(c => !nomes.has((c.titulo || '').trim())) };
}

// Exposições que a Mari quer ver (calendário cultural). Dados verificados nos sites oficiais
// das galerias (jul/2026). `dias` = dias abertos (0=Dom..6=Sáb); horário varia por dia,
// então não fixo abre/fecha pra não passar info errada. Ids estáveis + flag (não duplica; se
// ela editar/apagar, não volta). Só semeia os que confirmei — Vermelho e CasaGaleria ficaram
// de fora até fechar nome/data direitinho.
const EXPOS_SEED = [
  {
    id: 'exp-maluf-acesa', nome: 'Sempre Acesa — Guilherme Santos da Silva', tipo: 'exposicao',
    cidade: 'São Paulo', local: 'Galeria Luis Maluf (Jardins) · R. Peixoto Gomide, 1887',
    dataMax: '2026-09-16', preco: 'grátis', link: 'https://luismaluf.com/',
    funcionamento: { dias: [1, 2, 3, 4, 5, 6] },
  },
  {
    id: 'exp-lbrito-inverno', nome: 'Inverno dentro do bosque (coletiva)', tipo: 'exposicao',
    cidade: 'São Paulo', local: 'Luciana Brito Galeria (Jardins) · Av. Nove de Julho, 5.162',
    dataMax: '2026-08-08', preco: 'grátis', link: 'https://lucianabritogaleria.com.br/',
    funcionamento: { dias: [1, 2, 3, 4, 5, 6] },
  },
];
function ensureExpos2026(d) {
  if (d.expos2026Seeded) return d;
  const have = new Set((d.cultural?.itens || []).map(i => i.id));
  const novos = EXPOS_SEED.filter(e => !have.has(e.id));
  const cultural = d.cultural || { itens: [] };
  return { ...d, expos2026Seeded: true, cultural: { ...cultural, itens: [...(cultural.itens || []), ...novos] } };
}

// Lote 2 (jul/2026) — lista grande enviada pela Mari, verificada nos sites oficiais pelos
// pesquisadores. `local` = instituição · endereço curto; `dias` = dias abertos (0=Dom..6=Sáb).
// Corrigidos alguns títulos aproximados (A.R., Damián Ortega: matéria e energia, Shiro: uma
// escala de nuances, Estrelas escolhidas/Zerbini, das–vindas—i/Pedro Torres, nem mais nem
// menos/Zilio). Deixados de fora: "Coletiva" (Vermelho, já saiu de cartaz) e "Terra e Tempo"
// (galeria não localizada). Flag própria (expos2026Lote2Seeded) pra somar aos já semeados.
const EXPOS_SEED2 = [
  // Galeria Vermelho (R. Minas Gerais, 350, Higienópolis) — em cartaz até 25/jul
  { id: 'exp-vermelho-paciente', nome: 'O Paciente Circular 0.6 — Carlito Contini', tipo: 'exposicao', cidade: 'São Paulo', local: 'Galeria Vermelho · R. Minas Gerais, 350, Higienópolis', dataMax: '2026-07-25', preco: 'grátis', link: 'https://galeriavermelho.com.br/exposicoes/o-paciente-circular-0-6/', funcionamento: { dias: [2, 3, 4, 5, 6] } },
  { id: 'exp-vermelho-comunismo', nome: 'Comunismo Concreto — Dora Longo Bahia', tipo: 'exposicao', cidade: 'São Paulo', local: 'Galeria Vermelho · R. Minas Gerais, 350, Higienópolis', dataMax: '2026-07-25', preco: 'grátis', link: 'https://galeriavermelho.com.br/exposicoes/comunismo-concreto/', funcionamento: { dias: [2, 3, 4, 5, 6] } },
  { id: 'exp-vermelho-jamac', nome: 'Ocupação JAMAC', tipo: 'exposicao', cidade: 'São Paulo', local: 'Galeria Vermelho · R. Minas Gerais, 350, Higienópolis', dataMax: '2026-07-25', preco: 'grátis', link: 'https://galeriavermelho.com.br/exposicoes/ocupacao-jamac/', funcionamento: { dias: [2, 3, 4, 5, 6] } },
  // Outras galerias / museus / teatros
  { id: 'exp-oma-ar', nome: 'A.R. — Ana Kawajiri', tipo: 'exposicao', cidade: 'São Paulo', local: 'OMA Galeria · R. França Pinto, 1100, Vila Mariana', dataMax: '2026-07-25', preco: 'grátis', link: 'https://omagaleria.com/EXPOSICOES', funcionamento: { dias: [3, 4, 5, 6] } },
  { id: 'exp-teatrovivo-historias', nome: 'Histórias Lindas de Morrer (teatro)', tipo: 'teatro', cidade: 'São Paulo', local: 'Teatro Vivo · Av. Dr. Chucri Zaidan, 2460', dataMax: '2026-10-01', preco: 'R$ 90 · meia R$ 45', link: 'https://vivo.com.br/a-vivo/a-empresa/patrocinios/cultura/teatro-vivo/programacao', funcionamento: { dias: [3, 4], abre: '20:00' } },
  { id: 'exp-masp-ortega', nome: 'Damián Ortega: matéria e energia', tipo: 'exposicao', cidade: 'São Paulo', local: 'MASP · Av. Paulista, 1578', dataMax: '2026-09-13', preco: 'R$ 85 · meia R$ 42 · ter grátis', link: 'https://masp.org.br/exposicoes/damian-ortega-materia-e-energia', funcionamento: { dias: [2, 3, 4, 5, 6, 0] } },
  { id: 'exp-japanhouse-shiro', nome: 'Shiro: uma escala de nuances', tipo: 'exposicao', cidade: 'São Paulo', local: 'Japan House · Av. Paulista, 52', dataMax: '2026-10-25', preco: 'grátis', link: 'https://japanhousesp.com.br/', funcionamento: { dias: [2, 3, 4, 5, 6, 0] } },
  { id: 'exp-maluf-fluxos', nome: 'Fluxos — Janet Vollebregt', tipo: 'exposicao', cidade: 'São Paulo', local: 'Galeria Luis Maluf (Barra Funda) · R. Brigadeiro Galvão, 996', dataMax: '2026-08-08', preco: 'grátis', link: 'https://luismaluf.com/', funcionamento: { dias: [1, 2, 3, 4, 5, 6] } },
  { id: 'exp-oca-edorocha', nome: 'Arte e Arquitetura — Edo Rocha', tipo: 'exposicao', cidade: 'São Paulo', local: 'Oca do Ibirapuera · Parque Ibirapuera', dataMax: '2026-07-19', link: 'https://www.parquedoibirapuera.org/', funcionamento: { dias: [2, 3, 4, 5, 6, 0] } },
  { id: 'exp-contempo-cortejo', nome: 'Cortejo de um cão da lua — Sandra Lapage', tipo: 'exposicao', cidade: 'São Paulo', local: 'Galeria Contempo · Al. Gabriel Monteiro da Silva, 1644', dataMax: '2026-07-18', preco: 'grátis', link: 'https://www.galeriacontempo.com.br/exposicoes', funcionamento: { dias: [1, 2, 3, 4, 5, 6] } },
  { id: 'exp-mis-azul', nome: 'Quando o sonho encontra o azul — Daniela Dib', tipo: 'exposicao', cidade: 'São Paulo', local: 'MIS-SP · Av. Europa, 158', dataMax: '2026-08-02', preco: 'grátis', link: 'https://mis-sp.org.br/exposicao/quando-o-sonho-encontra-o-azul-nova-fotografia-2026/', funcionamento: { dias: [2, 3, 4, 5, 6, 0] } },
  { id: 'exp-sesc-lorena', nome: 'O Caso Lorena (teatro)', tipo: 'teatro', cidade: 'São Paulo', local: 'Sesc Ipiranga · R. Bom Pastor, 822', dataMax: '2026-07-25', link: 'https://www.sescsp.org.br/programacao/o-caso-lorena/', funcionamento: { dias: [5, 6, 0] } },
  { id: 'exp-wg-plenoacaso', nome: 'Pleno acaso — Renata Laguardia', tipo: 'exposicao', cidade: 'São Paulo', local: 'WG Galeria · R. Araújo, 154, República', dataMax: '2026-08-01', preco: 'grátis', link: 'https://wggaleria.com.br/', funcionamento: { dias: [2, 3, 4, 5, 6] } },
  { id: 'exp-macusp-beijo', nome: 'Beijo de Língua — Nelson Felix', tipo: 'exposicao', cidade: 'São Paulo', local: 'MAC USP · Av. Pedro Álvares Cabral, 1301', dataMax: '2026-09-20', preco: 'grátis', link: 'https://www.mac.usp.br/mac/expos/2026/beijo-lingua/index.html', funcionamento: { dias: [2, 3, 4, 5, 6, 0] } },
  { id: 'exp-tomie-estrelas', nome: 'Estrelas escolhidas — Luiz Zerbini', tipo: 'exposicao', cidade: 'São Paulo', local: 'Instituto Tomie Ohtake · R. Coropés, 88, Pinheiros', dataMax: '2026-08-16', preco: 'grátis', link: 'https://www.institutotomieohtake.org.br/', funcionamento: { dias: [2, 3, 4, 5, 6, 0] } },
  { id: 'exp-marli-catarata', nome: 'Catarata — Gabriella Barbosa', tipo: 'exposicao', cidade: 'São Paulo', local: 'Marli Matsumoto · R. João Alberto Moreira, 128, V. Madalena', dataMax: '2026-07-25', preco: 'grátis', link: 'https://marlimatsumoto.com.br/exposicoes/catarata/', funcionamento: { dias: [2, 3, 4, 5, 6] } },
  { id: 'exp-arnaud-zilio', nome: 'nem mais nem menos — Carlos Zilio', tipo: 'exposicao', cidade: 'São Paulo', local: 'Galeria Raquel Arnaud · R. Fidalga, 125, V. Madalena', dataMax: '2026-08-22', preco: 'grátis', link: 'https://raquelarnaud.com/exposicoes/nem-mais-nem-menos-pinturas-recentes_-carlos-zilio/', funcionamento: { dias: [1, 2, 3, 4, 5, 6] } },
  { id: 'exp-aura-voceemtudo', nome: 'Você em Tudo — Roberto Vivo', tipo: 'exposicao', cidade: 'São Paulo', local: 'Aura Galeria · R. da Consolação, 2767', dataMax: '2026-07-25', preco: 'grátis', link: 'https://aura.art.br/exposicoes-aura/toca-obra-928rm/voce-em-tudo', funcionamento: { dias: [1, 2, 3, 4, 5, 6] } },
  { id: 'exp-zielinsky-dasvindas', nome: 'das–vindas—i — Pedro Torres', tipo: 'exposicao', cidade: 'São Paulo', local: 'Galeria Zielinsky · Tv. Dona Paula, 33', dataMax: '2026-08-01', preco: 'grátis', link: 'https://www.zielinskyart.com/pedro-torres-das-vindas-i', funcionamento: { dias: [2, 3, 4, 5, 6] } },
];
function ensureExpos2026Lote2(d) {
  if (d.expos2026Lote2Seeded) return d;
  const have = new Set((d.cultural?.itens || []).map(i => i.id));
  const novos = EXPOS_SEED2.filter(e => !have.has(e.id));
  const cultural = d.cultural || { itens: [] };
  return { ...d, expos2026Lote2Seeded: true, cultural: { ...cultural, itens: [...(cultural.itens || []), ...novos] } };
}

// Quebra itemizada de Fixos (jan–jun/2026), padronizada. Personal/Faxina/Conta de luz unificados.
const GASTOS_FIXOS_SEED = [
  ['2026-01', 'Personal', 740], ['2026-01', 'Convênio mãe', 1080], ['2026-01', 'Aluguel', 3155.93], ['2026-01', 'Internet', 137.34], ['2026-01', 'Conta de luz', 49.05], ['2026-01', 'Faxina', 250], ['2026-01', 'Gás', 12.12], ['2026-01', 'Streaming', 313.31],
  ['2026-02', 'Internet', 133.89], ['2026-02', 'Personal', 740], ['2026-02', 'Aluguel', 3380], ['2026-02', 'Conta de luz', 71.98], ['2026-02', 'Gás', 15.32], ['2026-02', 'Faxina', 270], ['2026-02', 'Convênio mãe', 1105.71], ['2026-02', 'Streaming', 329.69], ['2026-02', 'Wellhub', 149.99],
  ['2026-03', 'Convênio mãe', 1079.79], ['2026-03', 'Bilhete único', 50], ['2026-03', 'Conta de luz', 61.26], ['2026-03', 'Internet', 133.89], ['2026-03', 'Aluguel', 3319.35], ['2026-03', 'Gás', 12.71], ['2026-03', 'Personal', 400], ['2026-03', 'Faxina', 270], ['2026-03', 'Streaming', 259.88], ['2026-03', 'Velocity', 65],
  ['2026-04', 'Personal', 400], ['2026-04', 'Internet', 133.90], ['2026-04', 'Bilhete único', 50], ['2026-04', 'Conta de luz', 58.90], ['2026-04', 'Aluguel', 3319], ['2026-04', 'Gás', 12.40], ['2026-04', 'Convênio mãe', 1079.79], ['2026-04', 'Streaming', 383.93], ['2026-04', 'Total pass', 119.90], ['2026-04', 'Bilhete único', 20],
  ['2026-05', 'Personal', 400], ['2026-05', 'Bilhete único', 150], ['2026-05', 'Aluguel', 3268], ['2026-05', 'Gás', 15.02], ['2026-05', 'Streaming', 306.87], ['2026-05', 'Internet', 133.89], ['2026-05', 'Conta de luz', 68.74], ['2026-05', 'Convênio mãe', 1102.47], ['2026-05', 'Total pass', 119.90],
  ['2026-06', 'Bilhete único', 150], ['2026-06', 'Personal', 400], ['2026-06', 'Internet', 148.62], ['2026-06', 'Faxina', 270], ['2026-06', 'Conta de luz', 48.31], ['2026-06', 'Aluguel', 3268.08], ['2026-06', 'Gás', 12.40], ['2026-06', 'Convênio mãe', 1079.79], ['2026-06', 'Streaming', 878.06],
];
function ensureGastosFixos(d) {
  if (d.gastosFixosSeeded) return d;
  const have = new Set((d.gastosItens || []).map(x => x.id));
  const novos = GASTOS_FIXOS_SEED.map(([mes, nome, valor], i) => ({ id: 'gi-fix-' + i, mes, categoria: 'Fixos', nome, valor })).filter(x => !have.has(x.id));
  return { ...d, gastosFixosSeeded: true, gastosItens: [...(d.gastosItens || []), ...novos] };
}
// Patch único: corrige o total de Fixos na Vida Financeira p/ bater com a soma itemizada
// (jun/2026 → 6255.26; abr/2026 → 5577.82). Flag nova p/ reaplicar mesmo em quem rodou a v1.
function ensureFixosJunhoFix(d) {
  if (d.fixosFix2) return d;
  const corr = { '2026-06': 6255.26, '2026-04': 5577.82 };
  if (!d.gastos) return { ...d, fixosFix2: true }; // sem gastos salvos → usa DEFAULT (já corrigido)
  return { ...d, fixosFix2: true, gastos: d.gastos.map(g => corr[g.mes] == null ? g : { ...g, itens: (g.itens || []).map(it => it.categoria === 'Fixos' ? { ...it, valor: corr[g.mes] } : it) }) };
}

// Importa do Excel (jan–jul/2026) a quebra itemizada COMPLETA das 13 categorias e
// refresca os totais do mês pra bater com o arquivo. Supera os seeds parciais antigos
// (gi-pres-/gi-fix-) e preserva itens que a Mari adicionou à mão. Ver src/gastosSeed.js.
function ensureGastos2026Detalhe(d) {
  if (d.gastos2026ImpV3) return d; // V3: Uber dividido (Uber vida/Uber trabalho); V2: Mercado consolidado
  const semSeed = (d.gastosItens || []).filter(x => !/^gi-(pres|fix|imp)-/.test(x.id || ''));
  const novos = GASTOS_ITENS_2026.map((r, i) => ({ id: 'gi-imp-' + i, mes: r[0], categoria: r[1], nome: r[2], valor: r[3] }));
  const out = { ...d, gastos2026ImpV3: true, gastosItens: [...semSeed, ...novos] };
  if (d.gastos) { // já congelado na nuvem → refresca só os meses importados
    const imp = new Set(GASTOS_TOTAIS_2026.map(g => g.mes));
    out.gastos = [...d.gastos.filter(g => !imp.has(g.mes)), ...GASTOS_TOTAIS_2026].sort((a, b) => a.mes.localeCompare(b.mes));
  }
  return out;
}

// Aplica todos os seeds idempotentes do Life, na ordem (primeiro→último).
// Primeiro livro do Acompanhamento de leituras: Anna Kariênina (começou em 25/06/2026).
// O GUIA é texto curado/verificado por mim (Wikipédia PT/EN), SEM NENHUM SPOILER do enredo:
// só publicação, contexto da Rússia da época e o autor.
function ensureAnnaKarenina(d) {
  if (d.annaKareninaSeeded) return d;
  const livro = {
    id: 'al-anna-karenina',
    titulo: 'Anna Kariênina',
    autor: 'Liev Tolstói',
    ano: 1877,
    pais: 'Rússia',
    inicio: '2026-06-25',
    status: 'lendo',
    personagens: [],
    notas: [],
    guia: {
      publicacao: 'Anna Kariênina saiu em capítulos na revista O Mensageiro Russo (Russkii Vestnik) entre 1875 e 1877. O editor, Mikhail Katkov — nacionalista — recusou-se a publicar a última parte por discordar das posições de Tolstói sobre o envolvimento russo na guerra dos Bálcãs; Tolstói então lançou a Parte 8 como um folheto avulso, em 1877. O romance completo só saiu em livro em 1878. Foi a obra que Tolstói escreveu logo depois de Guerra e Paz (1869).',
      russia: 'O livro nasce numa Rússia em plena transformação. Em 1861, o czar Alexandre II — o "czar libertador" — emancipou cerca de 22,5 milhões de servos, pondo fim à servidão que estruturava o campo havia séculos. Vieram as "Grandes Reformas", resposta ao atraso exposto pela derrota na Guerra da Crimeia: reorganização do exército, reforma da Justiça, criação dos zemstvos (conselhos locais) e a expansão das ferrovias, que encurtavam um país imenso. Era um tempo de tensão entre o velho e o novo — a aristocracia rural diante da modernização, o debate entre eslavófilos (um caminho russo próprio) e ocidentalizadores (olhos na Europa), o despertar da "questão feminina" e um pan-eslavismo crescente que empurrava o país para os Bálcãs, culminando na Guerra Russo-Turca de 1877–78, contemporânea dos últimos capítulos.',
      autor: 'Liev Tolstói (1828–1910) nasceu em Iasnaia Poliana, a propriedade da família perto de Tula, numa antiga linhagem da nobreza russa. Estudou direito e línguas orientais em Cazã, mas largou a universidade. Serviu no exército no Cáucaso e na Guerra da Crimeia, de onde tirou as Crônicas de Sebastopol (1855). Já consagrado por Guerra e Paz (1869), escreveu Anna Kariênina entre 1873 e 1877 — para muitos, seu "primeiro romance verdadeiro". Casou-se com Sófia Behrs em 1862, com quem teve treze filhos; ela foi também sua copista e editora. Foi justamente nos anos 1870, enquanto escrevia este livro, que mergulhou na crise espiritual que mudaria sua vida (relatada depois em Uma Confissão, 1882), rumo a um cristianismo radical, pacifista e de não-violência que mais tarde inspiraria Gandhi. Anos antes, fundara escolas para filhos de camponeses em suas terras.',
    },
  };
  return { ...d, annaKareninaSeeded: true, acompLeituras: [...(d.acompLeituras || []), livro] };
}

// Wishlist "Viagens que quero fazer" (lista da Mari, por região; verbatim dos prints).
function ensureViagensQuero(d) {
  if (d.viagensQueroSeeded) return d;
  const mk = (id, nome, itens) => ({ id, nome, itens: itens.map((texto, i) => ({ id: `${id}-${i + 1}`, texto, feito: false })) });
  const grupos = [
    mk('vq-brasil', 'Brasil', [
      'Chapada Diamantina / Vale do Pati',
      'Amazônia (anavilhanas, dolphi lodge, presidente figueiredo)',
      'Alter do chão',
      'Lençóis maranhenses',
      'Ilha bela',
      'Cambará do sul',
      'Bahia - boipeba, maraú, algodões (perto de morro de sp), moreré',
      'Bahia - abrolhos para ver baleia jubarte',
    ]),
    mk('vq-latam', 'América Latina', [
      'Atacama', 'Patagônia chilena', 'Patagônia argentina', 'Mendoza', 'Córdoba',
      'Salar de uyni alagado', 'Arequipa', 'Curaçao', 'Cartagena', 'Guatemala',
    ]),
    mk('vq-europa', 'Europa', [
      'Norte da espanha', 'Lisboa, porto, sintra, cascais, alagarve', 'Costa amalfitana',
      'Grécia', 'Croácia', 'Reino Unido', 'Viena', 'Vale de Aosta (italia)',
      'Berlim, munique, Frankfurt', 'Turquia', 'Uzbequistão', 'Caminho de Santiago',
    ]),
    mk('vq-norte', 'América do Norte', [
      'Nova York', 'Arizona / gran canyon', 'Miami', 'Califórnia', 'Chicago',
    ]),
    mk('vq-asia', 'Ásia', [
      'Camboja', 'Vietna', 'India', 'Laos', 'Indonésia', 'Malásia',
      'Russia (em Moscou, visitar a praça vermelha sábado de manhã, para ver estudantes colegiais russos lustrando as estátuas de renas)',
    ]),
    mk('vq-africa', 'África', [
      'África do Sul', 'Quênia', 'Tanzania', 'Egito', 'Jordânia',
    ]),
  ];
  return { ...d, viagensQueroSeeded: true, viagensQuero: [...(d.viagensQuero || []), ...grupos] };
}

// Patch: completa a wishlist com o que faltou nos prints — mais 4 destinos na
// África e a região "Outros". Não duplica nem mexe no que a Mari editou.
function ensureViagensQueroV2(d) {
  if (d.viagensQueroV2) return d;
  let vq = d.viagensQuero || [];
  const maisAfrica = ['Giraffe manor', 'Namíbia (giraffe manor)', 'Ruanda (gorila trekking)', 'Marrocos'];
  vq = vq.map(g => g.id === 'vq-africa'
    ? { ...g, itens: [...(g.itens || []), ...maisAfrica.filter(t => !(g.itens || []).some(i => i.texto === t)).map((texto, i) => ({ id: `vq-africa-x${i + 1}`, texto, feito: false }))] }
    : g);
  if (!vq.some(g => g.id === 'vq-outros')) {
    vq = [...vq, { id: 'vq-outros', nome: 'Outros', itens: ['Antártida', 'Islândia', 'Dubai', 'Butao'].map((texto, i) => ({ id: `vq-outros-${i + 1}`, texto, feito: false })) }];
  }
  return { ...d, viagensQueroV2: true, viagensQuero: vq };
}

// Patch: corrige os erros de digitação da wishlist (verbatim dos prints → grafia
// certa). Só troca o texto EXATO semeado — se a Mari já editou um item, não casa
// e fica intacto. Roda depois do seed, então também corrige instalações novas.
function ensureViagensQueroFix(d) {
  if (d.viagensQueroFix1) return d;
  const FIX = {
    'Amazônia (anavilhanas, dolphi lodge, presidente figueiredo)': 'Amazônia (Anavilhanas, Dolphin Lodge, Presidente Figueiredo)',
    'Alter do chão': 'Alter do Chão',
    'Lençóis maranhenses': 'Lençóis Maranhenses',
    'Ilha bela': 'Ilhabela',
    'Cambará do sul': 'Cambará do Sul',
    'Bahia - boipeba, maraú, algodões (perto de morro de sp), moreré': 'Bahia - Boipeba, Maraú, Algodões (perto de Morro de São Paulo), Moreré',
    'Bahia - abrolhos para ver baleia jubarte': 'Bahia - Abrolhos para ver baleia jubarte',
    'Salar de uyni alagado': 'Salar de Uyuni alagado',
    'Norte da espanha': 'Norte da Espanha',
    'Lisboa, porto, sintra, cascais, alagarve': 'Lisboa, Porto, Sintra, Cascais, Algarve',
    'Costa amalfitana': 'Costa Amalfitana',
    'Vale de Aosta (italia)': 'Vale de Aosta (Itália)',
    'Berlim, munique, Frankfurt': 'Berlim, Munique, Frankfurt',
    'Arizona / gran canyon': 'Arizona / Grand Canyon',
    'Vietna': 'Vietnã',
    'India': 'Índia',
    'Russia (em Moscou, visitar a praça vermelha sábado de manhã, para ver estudantes colegiais russos lustrando as estátuas de renas)': 'Rússia (em Moscou, visitar a praça vermelha sábado de manhã, para ver estudantes colegiais russos lustrando as estátuas de renas)',
    'Tanzania': 'Tanzânia',
    'Giraffe manor': 'Giraffe Manor',
    'Namíbia (giraffe manor)': 'Namíbia (Giraffe Manor)',
    'Butao': 'Butão',
  };
  const vq = (d.viagensQuero || []).map(g => ({ ...g, itens: (g.itens || []).map(it => FIX[it.texto] ? { ...it, texto: FIX[it.texto] } : it) }));
  return { ...d, viagensQueroFix1: true, viagensQuero: vq };
}

// Seed: planos próximos de viagem da Mari (seções por ano + ideias + mais caras).
function ensurePlanosViagem(d) {
  if (d.planosViagemSeeded) return d;
  const mk = (id, nome, itens) => ({ id, nome, itens: itens.map((texto, i) => ({ id: `${id}-${i + 1}`, texto })) });
  const grupos = [
    mk('pv-2026', '2026', ['Flip', 'Nova York, Filadélfia, Chicago', 'Atacama / Amazonas', 'Fim do ano: Mergulho ou Amazonas']),
    mk('pv-2027', '2027', ['Carnaval Olinda', 'Turquia e Egito']),
    mk('pv-ideias', 'Ideias', ['Indonésia', 'Guatemala', 'Vale do Pati / Chapada Diamantina', 'Colômbia', 'Amazônia', 'Mergulho Abrolhos']),
    mk('pv-caras', 'Mais caras', ['China', 'Vietnã', 'Indonésia']),
  ];
  return { ...d, planosViagemSeeded: true, planosViagem: [...(d.planosViagem || []), ...grupos] };
}

// Dicionário de inglês da Mari (termo → definição; grafia dos termos corrigida,
// explicações dela preservadas). Editável/expansível pela própria UI.
const INGLES_SEED = [
  ["Acquaintance", "a person one knows slightly, but who is not a close friend"],
  ["Athwart", "across"],
  ["By trial and error", "por tentativa e erro"],
  ["Branches / boughs", "galhos de árvore"],
  ["Mirth", "happiness, alegria — não necessariamente genuína; alegria do momento"],
  ["Mighty", "powerful"],
  ["Pry into (verb)", "enquire too inquisitively into a person's private affairs; bisbilhotar"],
  ["Speak in jest", "dizer de brincadeira, quando não era sério"],
  ["Strike / struck / stricken", "to hit, to beat"],
  ["Stirs", "move a little bit (quando alguém dorme, ou ao cozinhar)"],
  ["Thus", "therefore; in this way; assim, portanto"],
  ["Upbringing", "criação (teve criações diferentes)"],
  ["Fret", "reclamar, estar aborrecido; 'don't fret' = não se preocupe"],
  ["Hermits", "religious person who lives in isolation, meditating; eremita"],
  ["Cells", "prison/monastery: small rooms; celas"],
  ["Pensive", "related to thinking; pensativo"],
  ["Citadels", "walled cities; cidadelas"],
  ["Wheel", "roda"],
  ["Maids at the wheel", "a roda (de fiar) usada para fazer roupas"],
  ["Weaver", "fiar; fiandeiro / tecelão"],
  ["Loom", "machine used to weave; tear"],
  ["Mumbling", "complaining; resmungar"],
  ["Murmur", "just the sound; murmúrio"],
  ["Blithe", "synonym for happy"],
  ["Soar", "related to flying high; sense of freedom"],
  ["Bloom", "synonym for flower; florescer"],
  ["Foxglove", "a flower; dedaleira"],
  ["Doom", "related to destiny; fatalidade, perdição"],
  ["Prison into which we devote ourselves", "prisão à qual nos entregamos (frase)"],
  ["Hence", "assim, portanto"],
  ["Sundry", "various, diverse"],
  ["To bind", "atar, prender"],
  ["Bound", "to be limited; preso"],
  ["Scanty", "limited, small; escasso"],
  ["Pastime", "passatempo"],
  ["Solace", "consolation, comfort"],
  ["Should", "modal verb (também usado como passado de 'shall')"],
  ["There needs must be", "needs to be"],
  ["Stammer", "gaguejar"],
  ["Requiem", "the funeral mass / the funeral mass music"],
  ["Healing swaying", "related to the catharsis of a requiem"],
  ["Limbs", "members of the body; membros"],
  ["Quivering", "to tremble"],
  ["Flush", "dar descarga; fazer um líquido escoar; corar; make something come out of hiding"],
  ["Spell", "feitiço; soletrar; a period of something"],
  ["Cool heart", "even tempered (sem altos e baixos de sentimento)"],
  ["Sink", "afundar"],
  ["Pool", "any body of still water"],
  ["Fading colors", "cores desbotadas"],
  ["Subaqueous", "sub-aquatic"],
  ["To sink in the unconscious", "afundar no inconsciente"],
  ["Daffodils", "flor narciso (pron. 'défodils')"],
  ["Wonder", "viajar na imaginação; maravilhar-se"],
  ["Wander", "vagar, andar sem rumo"],
  ["Host", "to host a party; também 'host' = army (dá origem a 'hostile')"],
  ["Milky way", "via láctea"],
  ["Twinkle", "brilhar (brilha brilha estrelinha)"],
  ["Bay", "baía"],
  ["Tossing", "lançar, jogar"],
  ["Sprightly", "lively, animated, excited"],
  ["Out-did", "to do it better/more; superar"],
  ["Glee", "happiness, joy"],
  ["Jocund and gay", "means happy"],
  ["To gaze / gazed", "to look at something intently, staring"],
  ["Inward eye", "mente; olho interno da imaginação"],
  ["Bliss", "happiness, great pleasure; deleite"],
  ["Bliss of heaven", "joy of heaven"],
  ["Up to speed", "a par, atualizado"],
  ["Summon", "invocar"],
  ["Summon forth", "to bring it up, from the back of your mind"],
  ["Instilled", "to infuse; instilar; becomes part of your memories"],
  ["Infill", "to fill in"],
  ["Embrace", "hug"],
  ["Motif", "tema, lema (like 'tantantan')"],
  ["Still heart", "stagnant"],
  ["Bows", "to bow; se curvar, se dobrar"],
  ["Vicissitude", "percalços; as contingências das situações"],
  ["Scorned", "desprezado, zombado, ridicularizado"],
  ["Spurned", "to kick; rejection; rejeitar"],
  ["Spat", "past of spit"],
  ["Spite", "desprezo, malícia, rancor; 'out of spite' = por rancor"],
  ["Spate", "flood; 'in spate' = abundant"],
  ["Skewed", "to bend; entortar, desviar"],
  ["Sight", "the vision itself, the view"],
  ["Fancy", "from fantasy/imagination; 'you fancy someone' = like a crush"],
  ["To long for", "desejar algo, ansiar ('I do long…')"],
  ["In stills", "still pictures of movies, scenes"],
  ["Ladder", "escada (móvel, não fixa)"],
  ["Sticking", "apoiada, pendurada (o fim passando pela árvore)"],
  ["Barrel", "barril"],
  ["Bough", "tree branch (pron. 'báu')"],
  ["Drowsing", "to fall asleep; 'drowsing off' = cochilando"],
  ["Scent", "smell, perfume"],
  ["Enchanted / bewitched", "enfeitiçado, encantado"],
  ["Pane of glass", "painel de vidro"],
  ["Skimmed", "passar de leve pela superfície; skimmed milk = leite desnatado"],
  ["Abdominal cramps", "cólica"],
  ["Period cramps", "cólica menstrual"],
  ["Choking", "engasgar"],
  ["Castle", "o 't' é mudo (ca-sle)"],
  ["Muscle", "o 'c' é mudo (mu-sle)"],
  ["Touch and go", "something fragile/uncertain"],
  ["Pupil", "pupila / aluno (pron. 'piúpou')"],
  ["Seldom", "rarely"],
  ["Loved", "o 'e' do -ed só é pronunciado depois de t ou d (não depois de v)"],
  ["Buckle up", "get ready"],
  ["Buckle down", "go for it"],
  ["Swamped", "atolado de coisas"],
  ["Might", "poder (força; ou modal de possibilidade)"],
  ["Sorry my French", "desculpa o palavrão; 'a pain in the ass' = um saco"],
  ["Happy", "full of 'hap', full of good chance"],
  ["Hap", "related to luck/chance"],
  ["Happen", "o que acontece é o que a probabilidade vinga; like chance"],
  ["Perhaps", "like maybe, by chance"],
  ["Haphazard", "happened by chance ('azard' ~ azar/chance)"],
  ["To dart", "to move fast; disparar"],
  ["Thrusts in", "avançar para frente rápido, como um ataque"],
  ["Needle", "agulha"],
  ["Bill", "bico (of the bird)"],
  ["Hummingbird", "beija-flor"],
];
function ensureIngles(d) {
  if (d.inglesSeeded) return d;
  const novos = INGLES_SEED.map(([termo, definicao], i) => ({ id: 'en-' + (i + 1), termo, definicao }));
  return { ...d, inglesSeeded: true, ingles: [...(d.ingles || []), ...novos] };
}

// Patch: marca a origem "Daffodils (Wordsworth)" nas palavras que vêm do poema
// (só onde a origem está vazia — não sobrescreve o que a Mari editou).
function ensureInglesDaffodils(d) {
  if (d.inglesDaffodils1) return d;
  const doPoema = new Set(['Daffodils', 'Wander', 'Host', 'Milky way', 'Twinkle', 'Bay', 'Tossing', 'Sprightly', 'Out-did', 'Glee', 'Jocund and gay', 'To gaze / gazed', 'Inward eye', 'Bliss', 'Pensive']);
  const origem = 'Daffodils (Wordsworth)';
  const ingles = (d.ingles || []).map(e => (doPoema.has(e.termo) && !e.origem) ? { ...e, origem } : e);
  return { ...d, inglesDaffodils1: true, ingles };
}

// Seed da Retrospectiva Amorosa (dados da Mari). `soAno` = só o ano (sem dia certo).
function ensureAmorosaSeed(d) {
  if (d.amorosaSeed1) return d;
  const s = (id, o) => ({ id: 'am-seed-' + id, tipo: 'transa', ...o });
  const novos = [
    s(1, { data: '2016-01-01', soAno: true, pessoa: 'Luiz Klein', local: 'drive-in, Butantã' }),
    s(2, { data: '2019-01-01', soAno: true, pessoa: 'Nalu', local: 'casa dela' }),
    s(3, { data: '2022-01-01', soAno: true, pessoa: 'Matheus Prado', local: 'casa dele' }),
    s(4, { data: '2022-01-01', soAno: true, pessoa: 'Matheus Nistal', local: 'motel' }),
    s(5, { data: '2023-01-01', soAno: true, pessoa: 'Alice', local: 'casa dela' }),
    s(6, { data: '2024-01-01', soAno: true, pessoa: 'Bruno', local: 'Airbnb dele', nota: 'primo do Diego' }),
    s(7, { data: '2024-01-01', soAno: true, pessoa: 'Odilson', local: 'minha casa' }),
    s(8, { data: '2024-01-01', soAno: true, pessoa: 'Pedro Rufato', nota: 'incontáveis vezes' }),
    s(9, { data: '2025-01-01', soAno: true, pessoa: 'Pedro Rufato', nota: 'incontáveis vezes' }),
    s(10, { data: '2025-07-24', pessoa: 'Hugo' }),
    s(11, { data: '2025-11-24', pessoa: 'Pedro Cantisano', local: 'casa dele', nota: 'conheci no Fachada' }),
    s(12, { data: '2026-01-10', pessoa: 'Diego Armando', local: 'minha casa' }),
    s(13, { data: '2026-02-26', pessoa: 'Thiago', local: 'casa dele' }),
    s(14, { data: '2026-04-16', pessoa: 'Thiago', local: 'minha casa' }),
    s(15, { data: '2026-06-04', pessoa: 'Thiago', local: 'minha casa' }),
    s(16, { data: '2026-06-30', pessoa: 'Matheus Nistal', local: 'minha casa' }),
  ];
  const have = new Set((d.amorosa || []).map(x => x.id));
  return { ...d, amorosaSeed1: true, amorosa: [...(d.amorosa || []), ...novos.filter(x => !have.has(x.id))] };
}

// Patch: date da Mari (30/06/2026, Pitico). Novos ela adiciona pelo + na UI.
function ensureAmorosaDate1(d) {
  if (d.amorosaDate1) return d;
  const nova = { id: 'am-seed-d1', tipo: 'date', data: '2026-06-30', pessoa: 'Matheus Nistal', local: 'Pitico', valor: 85.8 };
  const have = (d.amorosa || []).some(x => x.id === nova.id);
  return { ...d, amorosaDate1: true, amorosa: have ? d.amorosa : [...(d.amorosa || []), nova] };
}

// Patch: mais dates que a Mari lembrou (2026).
function ensureAmorosaDate2(d) {
  if (d.amorosaDate2) return d;
  const dt = (id, data, pessoa, local) => ({ id: 'am-seed-d' + id, tipo: 'date', data, pessoa, local });
  const novos = [
    dt(2, '2026-06-26', 'Matheus Bumble', 'Tamashii'),
    dt(3, '2026-06-18', 'Matheus Bumble', 'Guarita'),
    dt(4, '2026-03-17', 'Bruno Pasini', 'Caso Bar'),
    dt(5, '2026-06-04', 'Thiago', 'Singelo Bar'),
    dt(6, '2026-06-16', 'Thiago', 'Boca de Oro'),
    dt(7, '2026-02-26', 'Thiago', 'Santana Bar'),
    dt(8, '2026-01-10', 'Diego Armando', 'Guarita'),
  ];
  const have = new Set((d.amorosa || []).map(x => x.id));
  return { ...d, amorosaDate2: true, amorosa: [...(d.amorosa || []), ...novos.filter(x => !have.has(x.id))] };
}

function runLifeSeeds(d) {
  const seeds = [ensureMaquiagem, ensureMaquiagemGrupos, ensureNY26, ensureComprasFeitas, ensureMusica, ensureMusicaJun, ensureMarcos, ensureAssistirLivros, ensureAssistirLivrosV2, ensureCoisasCaras, ensureViagens, ensureViagensCidades, ensureViagensMerge, ensureFlip2026, ensureFlipMesaLinks, ensureFlipDetalhes, ensureLeiturasLidos, ensureLeiturasCasa, ensureLeiturasNaoTenho, ensureLeiturasTemasV2, ensureLeiturasTipo, ensureLeiturasOutros, ensureLeiturasCat, ensureLeiturasIdioma3, ensureLeiturasAnos, ensureLeiturasAmyr, ensureAssistirSemLivros, ensureGastosPresentes, ensureGastosFixos, ensureFixosJunhoFix, ensureGastos2026Detalhe, ensureAnnaKarenina, ensureViagensQuero, ensureViagensQueroV2, ensureViagensQueroFix, ensurePlanosViagem, ensureIngles, ensureInglesDaffodils, ensureAmorosaSeed, ensureAmorosaDate1, ensureAmorosaDate2, rolarComprasVencidas, rolarPlanosVencidos, ensureLimparVazados, ensureExpos2026, ensureExpos2026Lote2];
  return seeds.reduce((acc, fn) => fn(acc), d);
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

function readLocal() {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { ...DEFAULT }; }
}
function writeLocal(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} }

export function LifeProvider({ children }) {
  const [data, setData] = useState(() => runLifeSeeds(readLocal()));
  const dirty = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | saving | saved | error
  useEffect(() => onSyncStatus(setSyncStatus), []);

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
  // Salvar AGORA (botão manual): grava na nuvem e AGUARDA a confirmação. Devolve true/false.
  const salvarAgora = async () => { dirty.current = true; return await saveLifeNow(dataRef.current); };

  // Re-roda o "puxar vencidos pra hoje" CONTINUAMENTE (não só no login): ao voltar
  // pro app e a cada minuto. Sem isso, se o app ficar aberto e o dia virar, o item
  // de checklist vencido e não-feito não se move sozinho até um reload.
  useEffect(() => {
    const roll = () => setData(prev => {
      const next = rolarPlanosVencidos(rolarComprasVencidas(prev));
      if (next !== prev) { writeLocal(next); pushLife(next); }  // muda -> persiste (local + nuvem)
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
    ? { ...aprendizados, notas: aprendizados.notas.map(n => n.id === nota.id ? { ...n, ...nota } : n) } // merge preserva criadoEm
    : { ...aprendizados, notas: [...aprendizados.notas, { ...nota, id: uid('n'), criadoEm: Date.now() }] });
  const deleteAprendNota = (id) => setAprendizados({ ...aprendizados, notas: aprendizados.notas.filter(n => n.id !== id) });

  const value = {
    data, compras, salvarAgora, syncStatus,
    addComprasItem, updateComprasItem, deleteComprasItem, toggleComprado, addComprasLista, deleteComprasLista, moveComprasLista,
    planos, addPlano, setPlanoPrazo, deletePlano, movePlano, savePlanoInfo, deletePlanoInfo, addPlanoCheck, togglePlanoCheck, setPlanoCheckPrazo, setPlanoCheckTexto, deletePlanoCheck,
    cultural, saveCulturalItem, deleteCulturalItem,
    recorrentes, saveRecorrente, deleteRecorrente,
    financas, saveFinancasSnapshot, deleteFinancasSnapshot, setFinancasUsdRate,
    salarios, saveSalarioAno, deleteSalarioAno,
    gastos, saveGastoMes, deleteGastoMes,
    saude, saveSaudeItem, deleteSaudeItem,
    aprendizados, addAprendTopico, deleteAprendTopico, moveAprendTopico, saveAprendNota, deleteAprendNota,
    comprasFeitas, saveCompraFeita, deleteCompraFeita, arquivarComprados,
    musica, saveMusica, deleteMusica,
    assistir, saveAssistir, deleteAssistir, toggleAssistir,
    marcos, saveMarco, deleteMarco,
    coisasCaras, saveCoisaCara, deleteCoisaCara,
    viagens, saveViagem, deleteViagem,
    viagensFuturas, saveViagemFutura, deleteViagemFutura,
    leituras, saveLeitura, deleteLeitura, toggleLeituraLido,
    acompLeituras, saveAcompLeitura, deleteAcompLeitura, savePersonagem, deletePersonagem, saveNotaLeitura, deleteNotaLeitura,
    legendas, addLegGrupo, renameLegGrupo, deleteLegGrupo, moveLegGrupo, saveLegenda, deleteLegenda,
    viagensQuero, addQueroGrupo, renameQueroGrupo, deleteQueroGrupo, moveQueroGrupo, addQueroItem, saveQueroItemTexto, deleteQueroItem, addQueroNota, saveQueroNotaTexto, deleteQueroNota,
    planosViagem, addPVGrupo, renamePVGrupo, deletePVGrupo, movePVGrupo, addPVItem, savePVItemTexto, deletePVItem,
    ingles, saveInglesEntry, deleteInglesEntry,
    amorosa, saveAmorosa, deleteAmorosa,
    gastosItens, saveGastoItem, deleteGastoItem,
  };
  return <LifeContext.Provider value={value}>{children}</LifeContext.Provider>;
}

export function useLife() {
  const ctx = useContext(LifeContext);
  if (!ctx) throw new Error('useLife precisa estar dentro de <LifeProvider>');
  return ctx;
}
