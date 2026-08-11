// Store da aba Life (sincroniza na nuvem, igual aos Salvos/Calendário).
// Por enquanto guarda a seção "compras"; as outras seções entram aqui depois.
//
//   life.compras = {
//     listas: [{ id, nome }],                       // listas próprias (além das fixas)
//     itens:  [{ id, titulo, listaId, dataLimite?, orcamento?, links: [], comprado }]
//   }
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { fetchLife, pushLife, saveLifeNow, onSyncStatus, UNREACHABLE, RESGATE, temPendente, guardarNaLixeira, definirBaseLife } from './cloud';
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
// Patch único: marca as 21 mesas oficiais já semeadas como tipo:'principal' (as que ainda
// não têm tipo). Assim o selo principal/paralela e os filtros funcionam. Flag nova.
function ensureFlipTipoPrincipal(d) {
  if (d.flipTipoPrincipal1) return d;
  const viagens = (d.viagensFuturas || []).map(v => v.id !== 'vf-flip2026' ? v
    : { ...v, mesas: (v.mesas || []).map(m => m.tipo ? m : { ...m, tipo: 'principal' }) });
  return { ...d, flipTipoPrincipal1: true, viagensFuturas: viagens };
}
// NOTA: a programação PARALELA da FLIP (~946 sessões, seed `flipParalelaSeed.js`) já foi injetada
// na época (flag `flipParalela1`) e depois PURGADA para só as favoritas (ver abaixo). O seed e o
// patch `ensureFlipParalela` foram REMOVIDOS do código pra aliviar o bundle (256 KB). Como a flag
// nunca mais deixaria o patch rodar, remover é seguro; as favoritas da Mari vivem nos dados dela.

// Limpeza única (a pedido da Mari, jul/2026): a FLIP acabou; apaga as mesas NÃO favoritas
// (as centenas de sessões que ela não marcou) e mantém só as favoritas (as que ela foi), pra
// enxugar os dados sincronizados. Trava de segurança: se a FLIP ainda não carregou OU não há
// NENHUMA favorita, não apaga nada e nem marca a flag — assim tenta de novo no próximo load e
// nunca zera tudo por engano.
function ensureFlipPurgeNaoFav(d) {
  if (d.flipPurgeNaoFav1) return d;
  const trip = (d.viagensFuturas || []).find(v => v.id === 'vf-flip2026');
  if (!trip || !Array.isArray(trip.mesas) || !trip.mesas.length) return d;
  const favs = trip.mesas.filter(m => m.favorito);
  if (favs.length === 0) return d;                    // nada favoritado ainda: não apaga, tenta depois
  if (favs.length === trip.mesas.length) return { ...d, flipPurgeNaoFav1: true }; // já está limpo
  const viagens = d.viagensFuturas.map(v => v.id === 'vf-flip2026' ? { ...v, mesas: favs } : v);
  return { ...d, flipPurgeNaoFav1: true, viagensFuturas: viagens };
}

// ---- Viagem Nova York & Chicago 2026 (roteiro da Mari, 13–26/09) ----
// Cada lugar vira um item da programação, com descrição, dias/horário de abertura,
// preço de entrada e link do Google Maps (pra chegar). Preços/horários confirmados por
// pesquisa em jul/2026 — a Mari pode editar tudo no app. Dias 20–24: Chicago (a definir).
const gmap = (q) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
const NYC_ROTEIRO = [
  // Dom 13/09 — Chegada leve (Upper West Side + Frick)
  { d: '2026-09-13', t: 'Barney Greengrass', desc: 'Deli judaico clássico do Upper West Side (1908), famoso pelo salmão e sturgeon defumados. Brunch sem pressa.', ab: 'Ter–Dom, 8h30–16h (fecha seg) · só dinheiro', pr: 'Brunch ~US$ 25–40' },
  { d: '2026-09-13', t: 'Central Park (borda oeste)', desc: 'Caminhada leve pela borda oeste do parque pra se ambientar. Volte quantas vezes quiser.', ab: 'Todos os dias, 6h–1h', pr: 'Grátis', mq: 'Central Park West New York' },
  { d: '2026-09-13', t: 'The Frick Collection', desc: 'Mansão-museu com acervo europeu (Vermeer, Rembrandt, Bellini) e pátio-jardim; reabriu a mansão reformada em 2025. Reserve horário, ~2h.', ab: 'Qua–Dom (fecha seg/ter) · dom 11h–18h', pr: 'US$ 30 (qua 14h–18h: pague quanto quiser)', link: 'https://www.frick.org' },
  { d: '2026-09-13', t: 'Times Square (opcional à noite)', desc: 'O cartão-postal iluminado. Sem horário.', ab: '24h', pr: 'Grátis' },
  { d: '2026-09-13', t: 'Top of the Rock (opcional)', desc: 'Mirante do Rockefeller com vista do Empire State e do Central Park; aberto até meia-noite se sobrar pique.', ab: 'Todos os dias, 8h–24h (última entrada 23h10)', pr: 'US$ 47–60 (varia por demanda)', link: 'https://www.rockefellercenter.com/attractions/top-of-the-rock-observation-deck/' },
  { d: '2026-09-13', t: 'Giants x Cowboys (opcional NFL)', desc: 'Jogão da NFL no MetLife Stadium (NJ). Puxado no dia de chegada.', ab: 'Domingo, 20h20', pr: 'Ingressos a partir de ~US$ 150', mq: 'MetLife Stadium East Rutherford NJ', hora: '20:20' },
  // Seg 14/09 — Upper East Side, MET e Central Park + jazz
  { d: '2026-09-14', t: 'The Met', desc: 'O maior museu dos EUA: do Egito a Velázquez, arte europeia, armaria e rooftop com vista do parque. Reserve ~3h; suba no rooftop e passe na loja.', ab: 'Dom–Qui 10h–17h, Sex–Sáb 10h–21h (fecha qua) · abre segunda', pr: 'US$ 30 (residentes de NY: pague quanto quiser)', link: 'https://www.metmuseum.org' },
  { d: '2026-09-14', t: 'Central Park (atrás do MET)', desc: 'Tarde no ritmo lento: Bethesda Terrace, The Mall, Bow Bridge.', ab: 'Todos os dias, 6h–1h', pr: 'Grátis', mq: 'Bethesda Terrace Central Park New York' },
  { d: '2026-09-14', t: 'Bemelmans Bar', desc: 'Bar do hotel Carlyle com murais de Ludwig Bemelmans (Madeline); alta coquetelaria clássica.', ab: 'Todos os dias, ~12h–0h30', pr: 'Drinks ~US$ 25–35 (couvert de música à noite)' },
  { d: '2026-09-14', t: 'Village Vanguard (jazz)', desc: 'Clube de jazz lendário (1935) no West Village. Segunda = Vanguard Jazz Orchestra (big band), sets 20h e 22h. Alternativas: Smalls / Mezzrow.', ab: 'Shows todos os dias · portas ~19h30', pr: '~US$ 40 (couvert) + consumação', link: 'https://villagevanguard.com' },
  // Ter 15/09 — Villages + SoHo (dia cinematográfico) + off-Broadway
  { d: '2026-09-15', t: 'Strand Book Store', desc: 'Livraria icônica (1927), as "18 milhas de livros". Comece perto da Union Square.', ab: 'Todos os dias, 10h–20h (dom até 21h)', pr: 'Grátis (entrada)', link: 'https://www.strandbooks.com' },
  { d: '2026-09-15', t: 'Washington Square Park', desc: 'Arco, chafariz, música e jazz de rua; o coração de Greenwich Village.', ab: 'Todos os dias, 6h–0h', pr: 'Grátis' },
  { d: '2026-09-15', t: 'Caffe Reggio', desc: 'Café de 1927, o 1º cappuccino dos EUA; apareceu em O Poderoso Chefão II.', ab: 'Todos os dias, ~11h–3h', pr: 'Café ~US$ 5–10' },
  { d: '2026-09-15', t: '66 Perry St (casa da Carrie)', desc: 'A fachada de Sex and the City + as brownstones do West Village.', ab: 'Rua (só por fora)', pr: 'Grátis', mq: '66 Perry Street New York' },
  { d: '2026-09-15', t: 'Housing Works Bookstore Cafe', desc: 'Livraria-café beneficente no SoHo, em prédio cast-iron; renda vai pra causas de HIV e moradia.', ab: 'Seg–Sex 10h–21h · fim de semana 10h–17h', pr: 'Grátis (entrada)' },
  { d: '2026-09-15', t: 'ICP — Int. Center of Photography', desc: 'Principal museu de fotografia de NY (84 Ludlow St). ⚠️ Costuma FECHAR às terças — confirme antes de contar com ele.', ab: 'Qua–Seg (fecha TER) — confirmar', pr: '~US$ 16 (qui à noite: pague quanto quiser)', link: 'https://www.icp.org' },
  { d: '2026-09-15', t: 'Teatro alternativo (noite)', desc: 'Off-Broadway: The Public Theater e Joe’s Pub no mesmo prédio. Alternativas: SoHo Playhouse.', ab: 'Confira a programação', pr: 'Varia por espetáculo', link: 'https://publictheater.org' },
  { d: '2026-09-15', t: 'Attaboy (speakeasy)', desc: 'Speakeasy sem menu — os bartenders criam pro seu gosto (Lower East Side). Alternativas: PDT, Employees Only.', ab: 'Todos os dias, ~18h–2h · sem reserva (fila)', pr: 'Drinks ~US$ 20' },
  // Qua 16/09 — Bate-e-volta a Filadélfia
  { d: '2026-09-16', t: 'Amtrak → Filadélfia', desc: 'Trem da Penn Station à 30th Street Station (~1h15–1h30). Compre com antecedência (quanto antes, mais barato).', ab: 'Vários horários por dia', pr: '~US$ 30–90', link: 'https://www.amtrak.com', mq: 'Moynihan Train Hall New York' },
  { d: '2026-09-16', t: 'Independence Hall', desc: 'Onde foram assinadas a Declaração de Independência e a Constituição dos EUA. Ingresso grátis com horário (recreation.gov) — reserve antes.', ab: 'Todos os dias, ~9h–17h · entrada com horário', pr: 'Grátis (taxa US$ 1 de reserva)', link: 'https://www.nps.gov/inde/index.htm', mq: 'Independence Hall Philadelphia' },
  { d: '2026-09-16', t: 'Liberty Bell', desc: 'O sino rachado, símbolo da liberdade americana. Sem ingresso.', ab: 'Todos os dias, ~9h–17h', pr: 'Grátis', mq: 'Liberty Bell Center Philadelphia' },
  { d: '2026-09-16', t: 'Old City (Filadélfia)', desc: 'Ruas históricas de tijolinho, Elfreth’s Alley, cafés e livrarias; a área dos museus fica por perto. Volte a NY sem apertar.', ab: 'Passeio a pé', pr: 'Grátis', mq: 'Old City Philadelphia' },
  // Qui 17/09 — Woodbury Common (outlets)
  { d: '2026-09-17', t: 'Woodbury Common Premium Outlets', desc: 'Dia inteiro de compras: 250+ lojas de grife com desconto (~1h de NY). Ônibus direto da Port Authority. Chegue cedo pra render.', ab: 'Todos os dias, ~10h–21h', pr: 'Grátis (entrada) · ônibus ~US$ 45 ida/volta', link: 'https://www.premiumoutlets.com/outlet/woodbury-common', mq: 'Woodbury Common Premium Outlets Central Valley NY' },
  // Sex 18/09 — Chelsea / Meatpacking / Hudson Yards + Broadway #1
  { d: '2026-09-18', t: 'Whitney Museum', desc: 'Arte americana dos séc. XX–XXI (Hopper, O’Keeffe, Warhol), com terraços sobre o Hudson. Sextas 17h–22h a entrada é grátis.', ab: 'Fecha ter · sex 10h30–22h', pr: 'US$ 30 (sex 17h–22h grátis, com ingresso)', link: 'https://whitney.org' },
  { d: '2026-09-18', t: 'Little Island', desc: 'Parque flutuante sobre o Hudson, apoiado em "tulipas" de concreto; coladinho no Whitney.', ab: 'Todos os dias, ~6h–23h', pr: 'Grátis', link: 'https://littleisland.org' },
  { d: '2026-09-18', t: 'Chelsea Market', desc: 'Mercado gastronômico num antigo prédio da Nabisco (onde nasceu o Oreo). Almoço.', ab: 'Todos os dias, ~7h–21h', pr: 'Grátis (entrada)' },
  { d: '2026-09-18', t: 'The High Line', desc: 'Parque linear sobre uma antiga ferrovia elevada; caminhe rumo ao norte, com jardins e vistas + galerias de Chelsea.', ab: 'Todos os dias, ~7h–22h', pr: 'Grátis', link: 'https://www.thehighline.org' },
  { d: '2026-09-18', t: 'Vessel / Hudson Yards', desc: 'Escultura em favo de mel na ponta norte da High Line; reabriu em 2024 (agora com ingresso).', ab: 'Todos os dias, ~10h–21h', pr: 'US$ 10 (US$ 15 online)', link: 'https://www.vesselnyc.com' },
  { d: '2026-09-18', t: 'Musical da Broadway #1 (noite)', desc: 'Primeiro musical da viagem. Reserve com bastante antecedência.', ab: 'Sessão à noite (confira o horário)', pr: 'Varia (~US$ 80–250)', mq: 'Broadway Theatre District New York' },
  // Sáb 19/09 — Midtown clássico + Broadway #2
  { d: '2026-09-19', t: 'MoMA', desc: 'Arte moderna: Van Gogh (Noite Estrelada), Monet, Picasso, Warhol. Abre 10h30; comece fresco, ~2h30.', ab: 'Todos os dias 10h30–17h30 (sex até 20h30)', pr: 'US$ 30 (US$ 28 online)', link: 'https://www.moma.org' },
  { d: '2026-09-19', t: 'Grand Central Terminal', desc: 'Estação de 1913 com teto celeste pintado; o Chrysler Building fica em frente (por fora).', ab: 'Todos os dias, ~5h30–2h', pr: 'Grátis', mq: 'Grand Central Terminal New York' },
  { d: '2026-09-19', t: 'New York Public Library', desc: 'A biblioteca dos leões de mármore; a Rose Main Reading Room é deslumbrante. Fecha domingo.', ab: 'Fecha dom · sáb 10h–18h', pr: 'Grátis', link: 'https://www.nypl.org', mq: 'New York Public Library Stephen A Schwarzman Building' },
  { d: '2026-09-19', t: 'Bryant Park', desc: 'Parque logo atrás da biblioteca: gramado, cafés e carrossel.', ab: 'Todos os dias, ~7h–22h', pr: 'Grátis' },
  { d: '2026-09-19', t: 'The Morgan Library & Museum', desc: 'A biblioteca particular de J.P. Morgan: manuscritos, uma Bíblia de Gutenberg, teto renascentista. Fecha segunda.', ab: 'Fecha seg · sáb 10h30–17h', pr: 'US$ 22 (sex 17h–20h grátis)', link: 'https://www.themorgan.org' },
  { d: '2026-09-19', t: 'Top of the Rock (pôr do sol)', desc: 'Mirante do Rockefeller ao pôr do sol; St. Patrick’s e o Rockefeller na base + Rizzoli Bookstore (NoMad) se der tempo. Reserve horário.', ab: 'Todos os dias, 8h–24h', pr: 'US$ 47–60 (varia por demanda)', link: 'https://www.rockefellercenter.com/attractions/top-of-the-rock-observation-deck/' },
  { d: '2026-09-19', t: 'Musical da Broadway #2 (noite)', desc: 'Segundo musical. Timing: se for 19h, suba no Top of the Rock mais cedo; se for 20h, dá pra pegar o pôr do sol com folga.', ab: 'Sessão à noite (confira o horário)', pr: 'Varia (~US$ 80–250)', mq: 'Broadway Theatre District New York' },
  // Dias 20–24/09 — Chicago (a definir)
  { d: '2026-09-20', t: 'Chicago — roteiro a definir', desc: 'Me manda seu roteiro de Chicago (dias 20–24) e eu preencho cada lugar com descrição, horário, preço e Google Maps, igual fiz com Nova York. Confirme também o voo NY → Chicago.', ab: '', pr: '', mq: 'Chicago Illinois' },
  // Sex 25/09 — Lower Manhattan + Brooklyn
  { d: '2026-09-25', t: 'Charging Bull', desc: 'O touro de bronze de Wall Street, em Bowling Green.', ab: '24h', pr: 'Grátis', mq: 'Charging Bull Bowling Green New York' },
  { d: '2026-09-25', t: 'Wall Street + Stone Street', desc: 'O coração financeiro; Stone Street é uma ruela de paralelepípedos cheia de bares e restaurantes.', ab: 'Passeio a pé', pr: 'Grátis', mq: 'Stone Street New York' },
  { d: '2026-09-25', t: 'Oculus / One World Trade Center', desc: 'O Oculus de Calatrava (hub em forma de ave) + a torre mais alta do hemisfério; Brookfield Place ao lado.', ab: 'Oculus diário · Observatório One World ~9h–21h', pr: 'Oculus grátis · Observatório ~US$ 44', mq: 'Oculus World Trade Center New York' },
  { d: '2026-09-25', t: 'Memorial do 11 de Setembro', desc: 'As duas piscinas nas pegadas das Torres Gêmeas, com os nomes das vítimas. Área externa gratuita.', ab: 'Todos os dias, ~8h–20h', pr: 'Memorial grátis (Museu ~US$ 33)', link: 'https://www.911memorial.org', mq: '9/11 Memorial New York' },
  { d: '2026-09-25', t: 'Brooklyn Bridge (travessia a pé)', desc: 'Atravesse a pé rumo ao Brooklyn (~30 min) pela passarela de madeira suspensa.', ab: '24h', pr: 'Grátis', mq: 'Brooklyn Bridge New York' },
  { d: '2026-09-25', t: 'DUMBO / Washington Street', desc: 'O enquadramento clássico da ponte entre os prédios + o Brooklyn Bridge Park à beira d’água.', ab: 'Passeio a pé', pr: 'Grátis', mq: 'Washington Street DUMBO Brooklyn' },
  { d: '2026-09-25', t: 'Staten Island Ferry (pôr do sol)', desc: 'Balsa grátis; na ida, sente à direita pra ver a Estátua da Liberdade. Ótimo pôr do sol.', ab: '24h, a cada ~30 min', pr: 'Grátis', mq: 'Staten Island Ferry Whitehall Terminal New York' },
  { d: '2026-09-25', t: 'Rooftop (noite)', desc: 'Drinks com vista: The Crown ou Harriet’s Rooftop.', ab: 'À noite', pr: 'Drinks ~US$ 20–30' },
  // Sáb 26/09 — Chinatown, Essex Market e brechós (último dia)
  { d: '2026-09-26', t: 'Chinatown + Doyers Street', desc: 'Doyers, a curva mais fotogênica da cidade; dim sum e mercados.', ab: 'Passeio a pé', pr: 'Grátis', mq: 'Doyers Street New York' },
  { d: '2026-09-26', t: 'Essex Market', desc: 'Mercado histórico do Lower East Side (~15 min a pé); comidas do mundo todo.', ab: 'Aberto sábado, ~8h–20h', pr: 'Grátis (entrada)', link: 'https://www.essexmarket.nyc' },
  { d: '2026-09-26', t: 'Brechós de fim de semana (opcional)', desc: 'Artists & Fleas em Williamsburg (metrô J/M/Z de Essex St) ou Chelsea Flea, em Manhattan. Pule se quiser um último dia mais leve.', ab: 'Fins de semana', pr: 'Grátis (entrada)', mq: 'Artists and Fleas Williamsburg Brooklyn' },
  { d: '2026-09-26', t: 'Saída para o JFK', desc: 'Voo 20h30 → saída do hotel para o JFK ~17h30. Manhã e início de tarde livres; depois pegar as malas e seguir.', ab: '', pr: '', mq: 'John F Kennedy International Airport', hora: '17:30' },
];
// ---- Roteiro de Nova York, versão da Mari (ago/2026) ----
// Ela mandou a lista dia a dia; aqui cada lugar ganha descrição, horário, preço e
// Maps. Preços/horários conferidos na web em ago/2026 — o que não deu pra
// confirmar está marcado como "confira no site" em vez de chutado.
// NÃO entra nada de 20 a 24/09 (Chicago): aqueles itens são dela e ficam intactos.
const NYC_V2 = [
  // ---------- Dom 13/09 — chegada (JFK 7h40), Midtown ----------
  { d: '2026-09-13', hora: '07:40', t: 'Chegada no JFK', desc: 'Voo do Brasil pousa ~7h40. Imigração costuma levar 40–90 min. Até Gramercy (168 E 24th St):\n• Táxi: ~1h, tarifa fixa JFK↔Manhattan US$ 70 + pedágio e taxas (~US$ 85 no total).\n• AirTrain + metrô: ~1h20. AirTrain até Jamaica → linha E até a 23rd St/Lexington → 5 min a pé. US$ 8,50 + US$ 2,90.\n\n(Confira o horário e o número do voo — este item foi reposto por mim.)', ab: '', pr: 'Táxi ~US$ 85 · metrô ~US$ 11', mq: 'John F Kennedy International Airport' },
  { d: '2026-09-13', hora: '10:00', t: 'Chegar e tomar banho', desc: 'American Dream — 168 E 24th St, Gramercy. Check-in costuma ser só ~15h: deixe as malas, tome um banho se der e saia leve. Não marque nada com hora hoje.\n\nA localização ajuda: Madison Square Park fica a 5 min a pé, o Flatiron a 8, e a linha 6 (23rd St) leva ao Upper East Side em 15 min.', ab: '', pr: '', mq: '168 East 24th Street New York NY 10010' },
  { d: '2026-09-13', hora: '11:00', t: 'Café da manhã gostoso', desc: 'Decida na hora — os três ficam a menos de 10 min a pé de Gramercy:\n• Friend of a Farmer (77 Irving Pl) — casa de campo no meio da cidade, brunch caseiro e pão feito ali. Todos os dias 9h–16h. US$ 20–35. ~7 min.\n• Daily Provisions (103 E 19th St) — do Danny Meyer: cruller de baunilha e sanduíche de ovo. Todos os dias 7h–21h. US$ 10–20. ~9 min.\n• Eataly Flatiron (200 5th Ave) — café italiano em pé, cornetto e cappuccino, mercado inteiro em volta. Todos os dias 7h–23h. US$ 8–18. ~8 min.', ab: 'Todos abrem cedo · Friend of a Farmer só a partir das 9h', pr: 'US$ 8–35, conforme o escolhido', mq: 'Friend of a Farmer 77 Irving Place New York' },
  { d: '2026-09-13', t: 'Madison Square Park', desc: 'A 5 minutos a pé da sua hospedagem — é o seu quintal nesta viagem. Praça arborizada com vista do Flatiron; o Shake Shack original fica aqui, num quiosque do parque.', ab: 'Todos os dias 6h–23h', pr: 'Grátis', mq: 'Madison Square Park New York' },
  { d: '2026-09-13', t: 'Descer a Quinta Avenida', desc: 'Caminhada da Madison Square Park subindo a 5ª até o Rockefeller: Flatiron, Empire State (fachada), Biblioteca e as vitrines. ~40 min a pé sem paradas.', ab: '24h', pr: 'Grátis', mq: 'Fifth Avenue New York' },
  { d: '2026-09-13', t: 'Comprar calçado de caminhada', desc: 'Opções no caminho entre a Madison Square Park e a 5ª Avenida:\n• Paragon Sports (867 Broadway, Union Square) — esportiva de verdade, atendimento que mede seu pé. Seg–Sáb 10h–20h, Dom 11h–19h.\n• On Running (Flatiron, 30 W 20th St) — a marca suíça de tênis leve; deixam testar na esteira.\n• Nike NYC (650 5th Ave) e Foot Locker (Herald Square) — em cima da hora, no caminho do Rockefeller.\nUS$ 90–180 no geral.', ab: 'Lojas ~10h–20h', pr: 'US$ 90–180', mq: 'Paragon Sports 867 Broadway New York' },
  { d: '2026-09-13', hora: '17:00', t: 'Top of the Rock', desc: 'O mirante com a vista que Nova York inteira quer: o Empire State de frente e o Central Park inteiro atrás. Entrada por horário marcado — reserve com dias de antecedência, sobretudo o pôr do sol.', ab: 'Todos os dias 8h–24h', pr: 'A partir de US$ 45 (Beam a partir de US$ 73)', link: 'https://www.rockefellercenter.com/tickets/top-of-the-rock-observation-deck', mq: 'Top of the Rock 30 Rockefeller Plaza New York' },
  { d: '2026-09-13', t: 'Rockefeller Center', desc: 'O complexo art déco embaixo do mirante: a praça rebaixada, o Prometeu dourado, o Atlas e os murais do lobby do 30 Rock. Dá pra ver de graça, sem ingresso.', ab: '24h (praça)', pr: 'Grátis', mq: 'Rockefeller Center New York' },
  { d: '2026-09-13', t: "St. Patrick's Cathedral", desc: 'Catedral neogótica de 1878 na 5ª Avenida, em frente ao Rockefeller. Entrada livre; vale entrar pelos vitrais e pela nave.', ab: 'Todos os dias 6h30–20h45', pr: 'Grátis (doação sugerida)', mq: "St Patrick's Cathedral 5th Avenue New York" },
  { bk: 'lojas', t: "Trader Joe's", desc: 'Mercado americano de marca própria — bom pra levar pra casa: temperos, snacks, chocolate, as sacolas de pano. O mais perto de você é o de Chelsea (675 6th Ave, na altura da 21st), ~12 min a pé; tem outro na Union Square (142 E 14th St), ~15 min.', ab: 'Todos os dias 8h–21h', pr: 'Barato', mq: "Trader Joe's 675 6th Ave New York" },
  { bk: 'lojas', t: "Macy's Herald Square", desc: 'A loja de departamentos mais famosa do mundo, 10 andares. Peça o Visitor Savings Pass (10–15% de desconto pra turista) no balcão do Visitor Center.', ab: 'Seg–Sáb 10h–21h · Dom 11h–20h', pr: 'Entrada grátis', mq: "Macy's Herald Square 151 W 34th St New York" },
  // ---------- Lojas para passar (sem dia; ela marca conforme entra) ----------
  { bk: 'lojas', t: 'Beacon’s Closet (brechó)', desc: 'O brechó mais conhecido de Nova York — o de Williamsburg é o maior. Roupa selecionada, preço honesto, muita coisa de marca. Encaixa no dia 25, quando você estiver em Williamsburg.', ab: 'Todos os dias 11h–20h', pr: 'US$ 10–60 a peça', mq: "Beacon's Closet 74 Guernsey St Brooklyn" },
  { bk: 'lojas', t: 'L Train Vintage (brechó)', desc: 'Rede de brechós baratos do Brooklyn, com várias lojas na mesma região (Bushwick e Williamsburg). Menos curado que o Beacon’s, mais garimpo — e mais barato.', ab: 'Todos os dias ~12h–20h', pr: 'US$ 5–30 a peça', mq: 'L Train Vintage Brooklyn' },
  { bk: 'lojas', t: 'Housing Works Thrift (brechó)', desc: 'Brechó da mesma ONG da livraria-café: tudo doado, lucro pra causa de HIV/aids. A loja do Chelsea (143 W 17th St) tem boas peças; a do Gramercy fica a 10 min de você (157 E 23rd St).', ab: 'Seg–Sáb 10h–19h · Dom 12h–18h', pr: 'US$ 5–50 a peça', mq: 'Housing Works Thrift Shop 157 E 23rd St New York' },
  { d: '2026-09-13', hora: '20:00', t: 'Times Square', desc: 'O cartão-postal iluminado. Vale à noite, quando os letreiros fazem sentido. Dez minutos bastam.', ab: '24h', pr: 'Grátis', mq: 'Times Square New York' },
  { d: '2026-09-13', hora: '20:30', t: 'Drink + jazz no Village', desc: 'Três casas históricas, todas no West Village, a caminhar entre si. Village Vanguard: a lendária, sets 20h e 22h, reserve online. Smalls: subsolo apertado e barato, vai até tarde. Mezzrow: piano e contrabaixo, quieto e íntimo (mesma dona do Smalls).', ab: 'Sets ~20h e 22h', pr: 'Vanguard ~US$ 25–30 + 1 drink · Smalls ~US$ 35', link: 'https://villagevanguard.com/', mq: 'Village Vanguard 178 7th Ave S New York' },

  // ---------- Seg 14/09 — Upper East Side, MET, Soho, teatro ----------
  { d: '2026-09-14', t: 'Upper East Side + Central Park', desc: 'Manhã pelas ruas do Upper East Side e pela borda leste do parque. O Museum Mile é a 5ª Avenida entre a 82nd e a 105th.', ab: 'Parque 6h–1h', pr: 'Grátis', mq: 'Upper East Side New York' },
  { d: '2026-09-14', hora: '11:00', t: 'The MET', desc: 'O museu que não se vence num dia: escolha duas ou três alas (egípcia com o Templo de Dendur, europeia, americana). O rooftop tem bar e vista do parque — só na temporada quente, e setembro pega. A loja do térreo é ótima pra presente.', ab: 'Dom–Ter e Qui 10h–17h · Sex–Sáb 10h–21h · FECHA QUARTA', pr: 'US$ 30 (vale o mesmo dia pro Cloisters)', link: 'https://www.metmuseum.org', mq: 'Metropolitan Museum of Art New York' },
  { d: '2026-09-14', hora: '15:00', t: 'Soho', desc: 'Tarde entre os prédios de ferro fundido (cast iron) e as lojas: Broadway pras grandes marcas, Prince e Spring pras pequenas. Greene St tem o quarteirão de ferro fundido mais bonito da cidade.', ab: 'Lojas ~11h–19h', pr: 'Grátis (andar)', mq: 'SoHo New York' },
  { d: '2026-09-14', hora: '19:30', t: 'Teatro à noite (fora da Broadway)', desc: 'The Public Theater: onde nasceram Hamilton e A Chorus Line; teatro sério a preço civil. Joe’s Pub fica dentro do Public — música e cabaré, mesa com jantar. SoHo Playhouse: casa pequena de 1824, off-Broadway experimental.', ab: 'Sessões ~19h/20h', pr: 'Public US$ 40–100 · Joe’s Pub US$ 25–60', link: 'https://publictheater.org/', mq: 'The Public Theater 425 Lafayette St New York' },

  // ---------- Ter 15/09 — West Village e Greenwich Village ----------
  { d: '2026-09-15', t: 'West Village', desc: 'O bairro mais fotogênico de Manhattan: ruas tortas (as únicas que fogem da grade), brownstones de tijolo, portinhas com escada. Perca-se de propósito por Bleecker, Bank, Charles e Grove.', ab: '24h', pr: 'Grátis', mq: 'West Village New York' },
  { d: '2026-09-15', t: '66 Perry St — casa da Carrie', desc: 'A escada de Sex and the City. É prédio residencial: os moradores pediram distância, tem corrente na escada e não se sobe. Foto da calçada, rápido, e siga.', ab: '24h (rua)', pr: 'Grátis', mq: '66 Perry Street New York' },
  { d: '2026-09-15', t: 'Greenwich Village', desc: 'A vizinhança da NYU e da boemia dos anos 50–60: Dylan, Baldwin, os cafés de poesia. Colada no West Village, dá pra emendar a pé.', ab: '24h', pr: 'Grátis', mq: 'Greenwich Village New York' },
  { d: '2026-09-15', t: 'Washington Square Park', desc: 'O arco, o chafariz, os pianos de rua e os enxadristas. Coração da NYU, sempre com gente tocando alguma coisa.', ab: 'Todos os dias 6h–24h', pr: 'Grátis', mq: 'Washington Square Park New York' },
  { d: '2026-09-15', t: 'Cornelia Street', desc: 'Uma quadra só, entre Bleecker e W 4th. Ficou famosa pela música da Taylor Swift; o Cornelia Street Cafe do verso fechou em 2018, mas a rua e as portinhas continuam lá.', ab: '24h', pr: 'Grátis', mq: 'Cornelia Street New York' },
  { d: '2026-09-15', t: 'The Strand Book Store', desc: '"18 milhas de livros" desde 1927 — a livraria de Nova York. Os carrinhos de US$ 1 na calçada, o andar de raros no 3º e a seção de arte valem o tempo.', ab: 'Todos os dias 10h–20h', pr: 'Entrada grátis', link: 'https://www.strandbooks.com/', mq: 'Strand Book Store 828 Broadway New York' },
  { d: '2026-09-15', t: 'Housing Works Bookstore Cafe', desc: 'Sebo-café em salão de dois andares com mezanino de madeira, no Soho. Tudo doado e todo o lucro vai pra causa de HIV/aids e moradia. Um dos lugares mais bonitos pra sentar e ler na cidade.', ab: 'Seg–Sex 10h–21h · Sáb–Dom 10h–17h (confira no site)', pr: 'Café ~US$ 5', link: 'https://www.housingworks.org/bookstore', mq: 'Housing Works Bookstore Cafe 126 Crosby St New York' },
  { d: '2026-09-15', t: 'Caffe Reggio', desc: 'De 1927, o café que trouxe o primeiro cappuccino aos EUA — a máquina original de 1902 ainda está no salão. Interior escuro, quadros do século XVI, mesinhas de mármore. Foi cenário do Poderoso Chefão II.', ab: 'Todos os dias ~9h–01h', pr: 'US$ 6–14', mq: 'Caffe Reggio 119 MacDougal St New York' },
  { d: '2026-09-15', hora: '20:00', t: 'Drinks: Employees Only / PDT / Attaboy', desc: 'Employees Only: fachada de vidente, art déco, sempre cheio — chegue antes das 19h ou espere. PDT: entra-se por uma cabine telefônica dentro da lanchonete Crif Dogs; só com reserva por telefone às 15h. Attaboy: sem cardápio, você diz o que gosta e eles inventam; sem reserva, fila na porta.', ab: 'Noite, até ~2h–4h', pr: 'Coquetéis US$ 18–24', mq: 'Employees Only 510 Hudson St New York' },

  // ---------- Qua 16/09 — Grand Central, Central Park, Frick ----------
  { d: '2026-09-16', hora: '07:30', t: 'Correr no Riverside Park', desc: 'O parque comprido na beira do Hudson, do lado oeste do Upper West Side — 6,5 km de caminho contínuo à beira d’água, sem cruzamento de rua. Trecho mais bonito: da 72nd (marina de barcos-casa) até a 96th. Bebedouros e banheiros ao longo do percurso; de manhã é só corredor local.\n\nDe Gramercy: linha 1 até a 72nd St, ~25 min.', ab: 'Todos os dias 6h–1h', pr: 'Grátis', mq: 'Riverside Park 72nd Street New York' },
  { d: '2026-09-16', hora: '10:00', t: 'Museu Americano de História Natural', desc: 'A baleia azul pendurada no teto, os dinossauros do 4º andar e os dioramas antigos — e agora a ala Gilder, de vidro ondulado, com o insetário e o borboletário. Enorme: escolha duas alas, ~2h30. Fica na borda oeste do Central Park, colado no Riverside/UWS.\n\n⚠ Dia cheio: se quiser o museu com calma, vale trocar o Empire State (opcional, à noite) por mais tempo aqui.', ab: 'Todos os dias 10h–17h30', pr: 'US$ 28 (entrada geral) · nova-iorquino paga quanto quiser', link: 'https://www.amnh.org/', mq: 'American Museum of Natural History New York' },
  { d: '2026-09-16', t: 'Grand Central Terminal', desc: 'A estação de 1913 com o teto de constelações pintado ao contrário (erro que nunca corrigiram). Veja a galeria dos sussurros (fale num canto do arco e alguém ouve no outro) e o relógio de latão do saguão.', ab: 'Todos os dias 5h15–2h', pr: 'Grátis', mq: 'Grand Central Terminal New York' },
  { d: '2026-09-16', t: 'Ruas do Upper West Side', desc: 'Caminhada pelo bairro: as brownstones da 70th a 80th, o Dakota (onde Lennon morava, na 72nd com Central Park West) e a Columbus Avenue.', ab: '24h', pr: 'Grátis', mq: 'Upper West Side New York' },
  { d: '2026-09-16', t: 'Cruzar o Central Park', desc: 'Do lado oeste ao leste, na altura da 72nd: Strawberry Fields, Bethesda Terrace, o lago e o Conservatory Water. ~40 min sem parar.', ab: 'Todos os dias 6h–1h', pr: 'Grátis', mq: 'Bethesda Terrace Central Park New York' },
  { d: '2026-09-16', hora: '13:30', t: 'The Frick Collection', desc: '⚠ HOJE É QUARTA E ENTRE 13h30 E 17h30 A ENTRADA É "PAGUE QUANTO QUISER" — você escolhe o valor, inclusive US$ 1. Chegue perto das 13h30: a fila do pague-quanto-quiser cresce, e os ingressos desse horário também podem ser reservados online com antecedência.\n\nA mansão do magnata Henry Frick com o acervo que ele juntou: Vermeer, Rembrandt, Bellini, Goya — pendurados como numa casa, não como num museu. A mansão reformada reabriu em 2025. ~2h bastam.', ab: 'Qua–Dom · fecha seg e ter', pr: 'US$ 30 · hoje (quarta) 13h30–17h30: pague quanto quiser', link: 'https://www.frick.org/tickets', mq: 'The Frick Collection 1 E 70th St New York' },
  { d: '2026-09-16', t: 'Empire State (opcional)', desc: 'Se quiser um segundo mirante: o 86º andar é o clássico ao ar livre. Como você já sobe o Top of the Rock no dia 13, dá pra pular sem culpa.', ab: 'Todos os dias 9h–24h', pr: 'US$ 47–60 (86º) · +US$ 20 pelo 102º', link: 'https://www.esbnyc.com/', mq: 'Empire State Building New York' },
  { d: '2026-09-16', hora: '21:00', t: 'Shrine — música ao vivo no Harlem', desc: 'Bar-palco no Harlem que emenda várias bandas por noite, cada uma ~45 min: afrobeat, jazz, reggae, rock africano. Paredes cobertas de capas de disco, entrada quase sempre de graça (às vezes chapéu passando), público do bairro. Não precisa reservar — chegue e entre.\n\nCai bem hoje: o Harlem fica logo acima do Upper West Side. Da 116th, a linha 2/3 traz você de volta a Gramercy em ~30 min.', ab: 'Todos os dias, shows a partir de ~19h até tarde', pr: 'Entrada geralmente grátis · drinks US$ 8–14', link: 'https://www.shrinenyc.com/', mq: 'Shrine World Music Venue 2271 Adam Clayton Powell Blvd New York' },
  { d: '2026-09-16', hora: '18:30', t: 'Roosevelt Island Tramway (opcional)', desc: 'O bondinho que cruza o East River pendurado ao lado da Queensboro Bridge — 4 minutos de travessia, a vista de Manhattan de perfil. Passa o metrô normal: é só o MetroCard/OMNY, sem ingresso de atração.', ab: 'Todos os dias ~6h–2h', pr: 'US$ 2,90 (tarifa de metrô)', mq: 'Roosevelt Island Tramway 59th St New York' },

  // ---------- Qui 17/09 — bate e volta (duas opções) ----------
  { d: '2026-09-17', op: 'Opção 1 — Filadélfia', hora: '07:30', t: 'Amtrak para a Filadélfia', desc: 'Sai da Moynihan/Penn Station e chega na 30th Street em ~1h20. Trens de meia em meia hora. Compre com antecedência: a tarifa "Value" cai muito quando se compra cedo.', ab: 'Trens a partir de ~5h', pr: 'US$ 28–60 ida (a partir de US$ 10 se comprar cedo)', link: 'https://www.amtrak.com/', mq: 'Moynihan Train Hall New York' },
  { d: '2026-09-17', op: 'Opção 1 — Filadélfia', t: 'Independence Hall', desc: 'Onde a Declaração de Independência e a Constituição foram assinadas. A visita é guiada por ranger, 30 min. Ingresso é grátis, mas precisa reservar horário no recreation.gov (US$ 1 de taxa) — faça semanas antes.', ab: 'Todos os dias 9h–17h', pr: 'Grátis (+US$ 1 de reserva)', link: 'https://www.nps.gov/inde/', mq: 'Independence Hall Philadelphia' },
  { d: '2026-09-17', op: 'Opção 1 — Filadélfia', t: 'Old City a pé', desc: 'O centro histórico inteiro cabe a pé: Liberty Bell (grátis, sem reserva), Elfreth’s Alley (a rua residencial mais antiga do país, de 1703), Christ Church e as ruas de tijolo em volta. Cafés e livrarias no caminho.', ab: 'Ruas 24h · atrações ~9h–17h', pr: 'Grátis', mq: "Elfreth's Alley Philadelphia" },
  { d: '2026-09-17', op: 'Opção 1 — Filadélfia', t: 'Museus da Filadélfia', desc: 'Se sobrar tempo: Philadelphia Museum of Art (a escada do Rocky) e a Barnes Foundation, com uma das maiores coleções de Renoir e Cézanne do mundo. Ficam juntos, ~25 min a pé do Old City.', ab: 'Qua–Seg (fecha ter)', pr: 'PMA US$ 30 · Barnes US$ 30', mq: 'Philadelphia Museum of Art' },
  { d: '2026-09-17', op: 'Opção 2 — Outlet', hora: '08:30', t: 'Woodbury Common', desc: 'O outlet grande, a 1h de Nova York: 250 lojas, das grifes ao básico. Ônibus sai do Port Authority (Shortline, ala sul, entrada na 41st com 8th Ave) — chegue 20 min antes. Pegue o cupom book no Marketing Center ao chegar.', ab: 'Todos os dias ~10h–21h', pr: 'Ônibus US$ 40 ida e volta', link: 'https://www.premiumoutlets.com/outlet/woodbury-common', mq: 'Woodbury Common Premium Outlets Central Valley NY' },

  // ---------- Sex 18/09 — Chelsea, High Line, Broadway ----------
  { d: '2026-09-18', hora: '17:00', t: 'Whitney Museum of American Art', desc: '⚠ HOJE É SEXTA E A PARTIR DAS 17h A ENTRADA É "PAGUE QUANTO QUISER" — por isso ficou no fim da tarde. A sexta é o dia longo do museu (até 22h), então dá pra ver com calma.\n\nSó arte americana, do século XX pra cá — Hopper, Georgia O’Keeffe, Basquiat. Os terraços escalonados do prédio do Renzo Piano têm vista do Hudson e da High Line, que começa na porta.\n\nSe for ao musical às 20h, saia daqui ~19h15: são ~25 min de metrô (linha A/C/E da 14th St até a 42nd) até a Broadway.', ab: 'Qua–Seg 10h30–18h · SEXTA até 22h · fecha terça', pr: 'US$ 30 · hoje a partir das 17h: pague quanto quiser', link: 'https://whitney.org/visit', mq: 'Whitney Museum 99 Gansevoort St New York' },
  { d: '2026-09-18', t: 'Chelsea Market', desc: 'Antiga fábrica de biscoitos Nabisco (o Oreo nasceu aqui) virada em galeria de comida: tacos, lagosta, doces, especiarias. Tijolo aparente e canos à mostra. Lotado na hora do almoço.', ab: 'Seg–Sáb 7h–22h · Dom 8h–21h', pr: 'Almoço US$ 15–30', mq: 'Chelsea Market 75 9th Ave New York' },
  { d: '2026-09-18', t: 'The High Line', desc: 'Linha de trem elevada dos anos 30 transformada em parque suspenso de 2,3 km, da Gansevoort à 34th. Jardins selvagens, bancos de madeira e a cidade vista de dez metros de altura.', ab: 'Todos os dias 7h–22h', pr: 'Grátis', link: 'https://www.thehighline.org/', mq: 'The High Line New York' },
  { d: '2026-09-18', t: 'Galerias de Chelsea', desc: 'O maior conjunto de galerias de arte do mundo, entre a 20th e a 26th, da 10ª à 11ª Avenida. Entrada livre em todas — David Zwirner, Gagosian, Pace. Fecham domingo e segunda; sexta é dia bom.', ab: 'Ter–Sáb 10h–18h', pr: 'Grátis', mq: 'Chelsea Art Galleries West 24th Street New York' },
  { d: '2026-09-18', t: 'Little Island', desc: 'Parque flutuante sobre o Hudson, apoiado em 132 "tulipas" de concreto. Pequeno, dá 30 min. Entrada grátis; em dias cheios pode pedir horário marcado à tarde.', ab: 'Todos os dias 6h–23h (varia por estação)', pr: 'Grátis', link: 'https://littleisland.org/', mq: 'Little Island Pier 55 New York' },
  { d: '2026-09-18', t: 'Hudson Yards + Vessel', desc: 'O bairro novo de arranha-céus de vidro no fim da High Line. O Vessel é a escadaria de favo de mel, 154 lances — reabriu com redes de proteção; ingresso barato e rápido. O shopping tem as marcas todas.', ab: 'Vessel: todos os dias ~10h–21h', pr: 'Vessel US$ 10 (horário marcado) ou US$ 15 (livre)', link: 'https://www.hudsonyardsnewyork.com/discover/vessel', mq: 'Vessel Hudson Yards New York' },
  { d: '2026-09-18', hora: '20:00', t: 'Musical da Broadway (sexta — o mais caro)', desc: '💡 SEXTA E SÁBADO SÃO AS NOITES MAIS CARAS. A mesma poltrona numa TERÇA ou QUARTA sai 40–60% mais barata (preço é dinâmico, como passagem aérea). Você tem a noite de quarta 16/09 livre — mudar um dos dois musicais pra lá economiza muito.\n\nOutras formas de baratear: TKTS na Times Square vende sobra do dia com 20–50% off (fila a partir das 15h); cada produção tem loteria digital no app TodayTix por ~US$ 30; e "rush" na bilheteria quando ela abre.', ab: 'Sessões 19h ou 20h · matinê quarta e sábado', pr: 'Sex/Sáb US$ 120–300 · Ter/Qua US$ 60–150 · TKTS 20–50% off', link: 'https://www.tdf.org/tkts/', mq: 'TKTS Times Square New York' },

  // ---------- Sáb 19/09 — MoMA, Bryant Park, Morgan ----------
  { d: '2026-09-19', hora: '10:30', t: 'Museum of Modern Art (MoMA)', desc: 'A Noite Estrelada, as Damoiselles de Picasso, os nenúfares do Monet numa sala inteira. Vá cedo: no meio da tarde o 5º andar fica impossível. O jardim de esculturas é o respiro.', ab: 'Todos os dias 10h30–17h30 · sáb até 19h', pr: 'US$ 30', link: 'https://www.moma.org/', mq: 'Museum of Modern Art 11 W 53rd St New York' },
  { d: '2026-09-19', t: 'Chrysler Building', desc: 'O art déco mais bonito de Nova York (1930), com a coroa de aço e as gárgulas de radiador de carro. Só o lobby é visitável — mármore vermelho e o mural do teto. A torre se vê melhor de longe.', ab: 'Lobby seg–sex ~8h–18h', pr: 'Grátis (lobby)', mq: 'Chrysler Building 405 Lexington Ave New York' },
  { d: '2026-09-19', t: 'New York Public Library', desc: 'Os leões Patience e Fortitude na escada e a Rose Reading Room: 24 metros de pé-direito, teto pintado e lustres de bronze. Entrada livre; a sala de leitura fecha pra eventos às vezes.', ab: 'Sáb 10h–18h', pr: 'Grátis', link: 'https://www.nypl.org/', mq: 'New York Public Library Stephen A Schwarzman Building New York' },
  { d: '2026-09-19', t: 'The Morgan Library & Museum', desc: 'A biblioteca particular do banqueiro Pierpont Morgan: três andares de estantes de nogueira, teto pintado, uma Bíblia de Gutenberg e manuscritos de Dickens e Mozart. Pequeno e perfeito — 1h30.', ab: 'Ter–Dom 10h30–17h · sex até 20h · fecha segunda', pr: 'US$ 25', link: 'https://www.themorgan.org/visit', mq: 'Morgan Library and Museum 225 Madison Ave New York' },
  { d: '2026-09-19', t: 'Bryant Park', desc: 'O gramado atrás da biblioteca, cercado de cadeirinhas verdes. Bom pra sentar entre um museu e outro; tem carrossel e quiosques.', ab: 'Todos os dias 7h–22h', pr: 'Grátis', mq: 'Bryant Park New York' },
  { d: '2026-09-19', hora: '20:00', t: 'Musical da Broadway (sábado — o mais caro)', desc: 'A segunda noite de teatro. Se a primeira foi um clássico, aqui cabe algo novo — ou o contrário.\n\n💡 Sábado é a noite mais cara da semana. Se topar mover este pra TERÇA 15/09 ou QUARTA 16/09, a economia é de 40–60% na mesma poltrona. O sábado também tem matinê (14h), que costuma custar menos que a sessão da noite.', ab: 'Sessões 19h/20h · matinê sábado 14h', pr: 'Sáb noite US$ 120–300 · matinê e meio de semana bem menos', mq: 'Broadway Theatre District New York' },

  // ---------- Sex 25/09 — Downtown e Brooklyn ----------
  { d: '2026-09-25', t: 'Wall Street', desc: 'A rua estreita e sombreada do dinheiro: a Bolsa de fachada neoclássica (não se visita), o Federal Hall onde Washington tomou posse, e a Trinity Church no fim.', ab: '24h (rua)', pr: 'Grátis', mq: 'Wall Street New York' },
  { d: '2026-09-25', t: 'Charging Bull', desc: 'O touro de bronze de 3,2 toneladas, posto ali clandestinamente em 1989 e nunca mais tirado. Fica no Bowling Green, não na Wall Street. Fila pra foto o dia todo — vá cedo.', ab: '24h', pr: 'Grátis', mq: 'Charging Bull Bowling Green New York' },
  { d: '2026-09-25', t: 'Stone Street', desc: 'Uma quadra de paralelepípedo do século XVII, fechada pra carros, com mesas na rua e prédios baixos de tijolo. O contraste com os arranha-céus em volta é o encanto. Bom pra almoçar.', ab: 'Restaurantes ~11h–23h', pr: 'Almoço US$ 20–35', mq: 'Stone Street New York' },
  { d: '2026-09-25', t: 'One World Trade Center', desc: 'A torre mais alta do hemisfério (541 m — 1776 pés, a data). O observatório fica nos andares 100–102 e o elevador sobe mostrando 500 anos da cidade em 47 segundos. Ao lado, as duas fontes quadradas do memorial (grátis).', ab: 'Todos os dias 9h–21h', pr: 'A partir de US$ 44', link: 'https://www.oneworldobservatory.com/', mq: 'One World Observatory New York' },
  { d: '2026-09-25', t: 'Brookfield Place', desc: 'Do outro lado da rua do WTC: o Winter Garden, um átrio de vidro com palmeiras de verdade e vista da marina. Lojas boas e o Le District, mercado francês, no subsolo.', ab: 'Seg–Sáb 10h–20h · Dom 11h–19h', pr: 'Entrada grátis', mq: 'Brookfield Place 230 Vesey St New York' },
  { d: '2026-09-25', hora: '16:00', t: 'Brooklyn Bridge a pé', desc: 'Atravesse de Manhattan pra Brooklyn (o sentido certo: a skyline vem crescendo nas suas costas e você a vê ao virar). 1,8 km, ~35 min. A passarela de madeira fica acima do trânsito.', ab: '24h', pr: 'Grátis', mq: 'Brooklyn Bridge New York' },
  { d: '2026-09-25', t: 'DUMBO + Washington Street', desc: 'Down Under the Manhattan Bridge Overpass: paralelepípedo, armazéns de tijolo e a foto — na Washington St com Water St, o arco da ponte emoldura o Empire State. Cuidado com os carros na hora da foto.', ab: '24h', pr: 'Grátis', mq: 'Washington Street DUMBO Brooklyn' },
  { d: '2026-09-25', t: 'Brooklyn Bridge Park', desc: 'O parque na beira do East River, embaixo das duas pontes, com a melhor vista frontal de Manhattan. Tem o carrossel Jane’s (de 1922, dentro de uma caixa de vidro) e píeres com gramado.', ab: 'Todos os dias 6h–1h', pr: 'Grátis', mq: 'Brooklyn Bridge Park Brooklyn' },
  { d: '2026-09-25', t: 'Staten Island Ferry (se der tempo)', desc: 'A balsa de graça que passa ao lado da Estátua da Liberdade, ida e volta em ~50 min. Sente do lado direito na ida. Sai do Whitehall Terminal, coladinho no Charging Bull.', ab: '24h, a cada 15–30 min', pr: 'Grátis', mq: 'Staten Island Ferry Whitehall Terminal New York' },
  { d: '2026-09-25', hora: '17:00', t: 'Balsa DUMBO → Williamsburg', desc: 'A NYC Ferry, linha East River, encosta no Fulton Ferry Landing (DUMBO) e sobe até North Williamsburg em ~10 min, passando debaixo das duas pontes. É o melhor passeio barato da cidade — fique no convés de cima, atrás.\n\nA mesma linha liga o Financial District: Pier 11 (Wall St) → DUMBO em 8 min, → North Williamsburg em ~15 min. Se quiser cortar caminho de manhã, dá pra ir de balsa em vez de atravessar a ponte a pé — mas aí você perde a travessia, que vale por si.', ab: 'Todos os dias · a cada 20–30 min', pr: 'US$ 4,50 por trecho (passe de 2 dias US$ 15)', link: 'https://www.ferry.nyc/routes-and-schedules/east-river/', mq: 'NYC Ferry Fulton Ferry Landing DUMBO Brooklyn' },
  { d: '2026-09-25', hora: '17:30', t: 'Williamsburg sem rumo', desc: 'O bairro pra andar sem destino: Bedford Ave é a espinha (lojas, sebos, café), e as ruas em volta — N 6th, Wythe, Berry — têm brechó, disco de vinil, mural em prédio inteiro. Desça até a Domino Park, na beira do rio, pra ver Manhattan de frente no fim da tarde.\n\nDica: o Artists & Fleas (70 N 7th St) é o mercado de brechó e design local, fins de semana.', ab: 'Lojas ~11h–20h · bares até tarde', pr: 'Grátis (andar)', mq: 'Bedford Avenue Williamsburg Brooklyn' },
  { d: '2026-09-25', hora: '19:30', t: 'Rooftop no fim do dia', desc: 'O Westlight fica em Williamsburg, no 22º andar — ou seja, é a continuação natural do fim de tarde: você já está no bairro. Vista de Manhattan inteira do outro lado do rio.\n\nAlternativas se preferir voltar pra Manhattan: The Crown (Lower East Side), vista das pontes, mais chique; 230 Fifth, o mais famoso e turístico, com o Empire State de frente.', ab: 'Noite, até ~1h–2h', pr: 'Coquetéis US$ 18–25', mq: 'Westlight 111 N 12th St Brooklyn' },

  // ---------- Sáb 26/09 — último dia (voo 20h30) ----------
  { d: '2026-09-26', hora: '10:00', t: 'Chinatown', desc: 'Mercados de rua, ervas, peixarias e o melhor dim sum barato da cidade. Canal Street pras bugigangas, Mott e Bayard pra comer de verdade.', ab: 'Lojas ~10h–19h', pr: 'Refeição US$ 10–25', mq: 'Chinatown Manhattan New York' },
  { d: '2026-09-26', t: 'Doyers Street', desc: 'A curva de 90 graus mais famosa de Nova York — apelidada de "Bloody Angle" pelas brigas de gangue dos anos 1900. Hoje é um beco pintado, cheio de mural e de barbearia antiga.', ab: '24h', pr: 'Grátis', mq: 'Doyers Street New York' },
  { d: '2026-09-26', t: 'Essex Market', desc: 'Mercado público de 1940 no Lower East Side, mudado em 2019 pro prédio novo em frente. Bancas de queijo, peixe, pupusas, café. Bom almoço de despedida.', ab: 'Seg–Sáb 8h–20h · Dom 10h–18h', pr: 'Almoço US$ 12–25', mq: 'Essex Market 88 Essex St New York' },
  { d: '2026-09-26', t: 'ICP — International Center of Photography', desc: 'O museu de fotografia da cidade, fundado por Cornell Capa (irmão do Robert) pra defender a "fotografia preocupada". Fica na Essex St, dentro do mesmo complexo do mercado. Pequeno, 1h.', ab: 'Qua–Seg 11h–19h · qui até 21h · fecha terça', pr: 'US$ 16 · quinta 17h–20h por US$ 5', link: 'https://www.icp.org/visit', mq: 'International Center of Photography 84 Ludlow St New York' },
  { d: '2026-09-26', hora: '17:30', t: 'Saída para o JFK', desc: 'Voo 20h30 → sair do hotel ~17h30. Pegue as malas e siga; o AirTrain + metrô leva ~1h15, táxi ~1h (mais no trânsito de sexta).', ab: '', pr: 'Táxi fixo JFK ~US$ 70 + pedágio', mq: 'John F Kennedy International Airport' },
  { d: '2026-09-26', hora: '20:30', t: 'Voo de volta ao Brasil', desc: 'Decolagem 20h30 do JFK. Voo internacional: esteja no aeroporto ~3h antes, ou seja, por volta das 17h30.\n\n(Confira o horário e o número do voo — este item foi reposto por mim.)', ab: '', pr: '', mq: 'John F Kennedy International Airport' },
];

// Todos os lugares acima também viram ENDEREÇO ÚTIL, com a categoria certa
// (as 5 que a Mari definiu: turistico · museu · restaurante · loja · hospedagem).
// `n` = nome curto pra lista, `e` = endereço, `c` = categoria, `q` = busca no Maps.
const NYC_ENDS = [
  // Museus e casas de espetáculo
  { n: 'American Dream (hospedagem)', e: '168 E 24th St, Gramercy', c: 'hospedagem' },
  { n: 'The MET', e: '1000 5th Ave', c: 'museu' },
  { n: 'The Frick Collection', e: '1 E 70th St', c: 'museu' },
  { n: 'Whitney Museum', e: '99 Gansevoort St', c: 'museu' },
  { n: 'MoMA', e: '11 W 53rd St', c: 'museu' },
  { n: 'The Morgan Library & Museum', e: '225 Madison Ave', c: 'museu' },
  { n: 'New York Public Library', e: '476 5th Ave', c: 'museu' },
  { n: 'ICP — Center of Photography', e: '84 Ludlow St', c: 'museu' },
  { n: 'The Public Theater', e: '425 Lafayette St', c: 'museu' },
  { n: "Joe's Pub", e: '425 Lafayette St', c: 'museu' },
  { n: 'SoHo Playhouse', e: '15 Vandam St', c: 'museu' },
  { n: 'Village Vanguard', e: '178 7th Ave S', c: 'museu' },
  { n: 'Smalls Jazz Club', e: '183 W 10th St', c: 'museu' },
  { n: 'Mezzrow', e: '163 W 10th St', c: 'museu' },
  { n: 'TKTS Times Square (ingressos)', e: '47th St & Broadway', c: 'museu' },
  // Pontos turísticos
  { n: 'Top of the Rock', e: '30 Rockefeller Plaza', c: 'turistico' },
  { n: 'Rockefeller Center', e: '45 Rockefeller Plaza', c: 'turistico' },
  { n: "St. Patrick's Cathedral", e: '5th Ave & 50th St', c: 'turistico' },
  { n: 'Times Square', e: 'Broadway & 7th Ave', c: 'turistico' },
  { n: 'Madison Square Park', e: '11 Madison Ave', c: 'turistico' },
  { n: 'Quinta Avenida', e: '5th Ave', c: 'turistico' },
  { n: 'Central Park', e: 'Central Park', c: 'turistico' },
  { n: 'Bethesda Terrace', e: 'Central Park, 72nd St', c: 'turistico' },
  { n: 'Grand Central Terminal', e: '89 E 42nd St', c: 'turistico' },
  { n: 'Empire State Building', e: '20 W 34th St', c: 'turistico' },
  { n: 'Chrysler Building', e: '405 Lexington Ave', c: 'turistico' },
  { n: 'Bryant Park', e: '5th Ave & 42nd St', c: 'turistico' },
  { n: 'Roosevelt Island Tramway', e: '2nd Ave & E 59th St', c: 'turistico' },
  { n: 'West Village', e: 'West Village', c: 'turistico' },
  { n: '66 Perry St (Carrie)', e: '66 Perry St', c: 'turistico' },
  { n: 'Greenwich Village', e: 'Greenwich Village', c: 'turistico' },
  { n: 'Washington Square Park', e: 'Washington Square', c: 'turistico' },
  { n: 'Cornelia Street', e: 'Cornelia St', c: 'turistico' },
  { n: 'SoHo', e: 'SoHo', c: 'turistico' },
  { n: 'The High Line', e: 'Gansevoort St & Washington St', c: 'turistico' },
  { n: 'Little Island', e: 'Pier 55, 13th St & Hudson River', c: 'turistico' },
  { n: 'Vessel / Hudson Yards', e: '20 Hudson Yards', c: 'turistico' },
  { n: 'Galerias de Chelsea', e: 'W 24th St & 10th Ave', c: 'turistico' },
  { n: 'Wall Street', e: 'Wall St', c: 'turistico' },
  { n: 'Charging Bull', e: 'Bowling Green', c: 'turistico' },
  { n: 'Stone Street', e: 'Stone St', c: 'turistico' },
  { n: 'One World Observatory', e: '117 West St', c: 'turistico' },
  { n: 'Brooklyn Bridge', e: 'Brooklyn Bridge', c: 'turistico' },
  { n: 'DUMBO — Washington St', e: 'Washington St & Water St, Brooklyn', c: 'turistico' },
  { n: 'Brooklyn Bridge Park', e: '334 Furman St, Brooklyn', c: 'turistico' },
  { n: 'Staten Island Ferry', e: '4 Whitehall St', c: 'turistico' },
  { n: 'Chinatown', e: 'Mott St & Canal St', c: 'turistico' },
  { n: 'Doyers Street', e: 'Doyers St', c: 'turistico' },
  { n: 'Riverside Park (corrida)', e: 'Riverside Dr & W 72nd St', c: 'turistico' },
  { n: 'Museu de História Natural', e: '200 Central Park West', c: 'museu' },
  { n: 'Shrine (música ao vivo, Harlem)', e: '2271 Adam Clayton Powell Jr Blvd', c: 'restaurante' },
  { n: 'Williamsburg (Bedford Ave)', e: 'Bedford Ave, Brooklyn', c: 'turistico' },
  { n: 'Domino Park', e: '300 Kent Ave, Brooklyn', c: 'turistico' },
  { n: 'NYC Ferry — Fulton Landing (DUMBO)', e: '1 Water St, Brooklyn', c: 'turistico' },
  { n: 'NYC Ferry — Pier 11 (Wall St)', e: '11 South St', c: 'turistico' },
  { n: 'Moynihan Train Hall (Amtrak)', e: '351 W 31st St', c: 'turistico' },
  { n: 'Port Authority (ônibus do outlet)', e: '625 8th Ave', c: 'turistico' },
  // Restaurantes, cafés e bares
  { n: 'Barney Greengrass', e: '541 Amsterdam Ave', c: 'restaurante' },
  { n: 'Caffe Reggio', e: '119 MacDougal St', c: 'restaurante' },
  { n: 'Employees Only', e: '510 Hudson St', c: 'restaurante' },
  { n: "Please Don't Tell (PDT)", e: '113 St Marks Pl', c: 'restaurante' },
  { n: 'Attaboy', e: '134 Eldridge St', c: 'restaurante' },
  { n: 'Chelsea Market', e: '75 9th Ave', c: 'restaurante' },
  { n: 'Essex Market', e: '88 Essex St', c: 'restaurante' },
  { n: 'Westlight', e: '111 N 12th St, Brooklyn', c: 'restaurante' },
  { n: 'The Crown', e: '50 Bowery', c: 'restaurante' },
  { n: "Harriet's Rooftop", e: '60 Furman St, Brooklyn', c: 'restaurante' },
  { n: '230 Fifth Rooftop', e: '230 5th Ave', c: 'restaurante' },
  // Lojas
  { n: "Trader Joe's (UWS)", e: '2073 Broadway', c: 'loja' },
  { n: "Macy's Herald Square", e: '151 W 34th St', c: 'loja' },
  { n: 'Paragon Sports (tênis)', e: '867 Broadway', c: 'loja' },
  { n: 'The Strand Book Store', e: '828 Broadway', c: 'loja' },
  { n: 'Housing Works Bookstore', e: '126 Crosby St', c: 'loja' },
  { n: 'Brookfield Place', e: '230 Vesey St', c: 'loja' },
  { n: 'Woodbury Common (outlet)', e: '498 Red Apple Ct, Central Valley', c: 'loja' },
];

// Aplica o roteiro novo da Mari SEM tocar em nada de Chicago (20 a 24/09), que
// é dela: os voos LGA↔ORD e o marcador ficam exatamente onde estão.
// Preserva os check de "visitado" e as estrelas dos lugares que continuam na
// lista (casando pelo título), e não duplica endereço que ela já cadastrou.
// Tudo que precisa ser resolvido ANTES de embarcar, na ordem de urgência (o que
// esgota primeiro vem primeiro). Vira um card de checklist na capa da viagem.
const NYC_RESERVAS = [
  'Independence Hall (17/09, se for a Opção 1) — grátis + US$ 1 de taxa, só no recreation.gov. É o que esgota mais cedo: reserve JÁ.',
  'Musicais da Broadway (18 e 19/09) — considere TROCAR COM O OFF-BROADWAY: Broadway na segunda 14 (40–60% mais barato) e Public/SoHo Playhouse na sexta e no sábado (o off-Broadway custa quase o mesmo em qualquer dia).',
  'Museu de História Natural (16/09) — ingresso com horário; entrada geral US$ 28.',
  'Top of the Rock (13/09, ~17h) — entrada por horário marcado; o pôr do sol esgota com semanas.',
  'Village Vanguard (13/09, 20h) — É O ÚNICO JAZZ QUE PRECISA RESERVAR. Online, sets 20h e 22h. US$ 25–30 + 1 drink. (Smalls e Mezzrow aceitam entrar na hora; domingo à noite enche, chegue 30–45 min antes.)',
  'Teatro off-Broadway do dia 14 (Public / Joe’s Pub / SoHo Playhouse) — ingresso online, US$ 25–100. Bem mais barato que Broadway, inclusive no fim de semana.',
  'The Frick (16/09, 13h30) — quarta é pague quanto quiser; dá pra garantir o horário online.',
  'The MET (14/09) — ingresso com horário; comprar online evita a fila da escadaria.',
  'MoMA (19/09) — horário marcado; sábado de manhã lota.',
  'Whitney (18/09, 17h) — sexta a partir das 17h é pague quanto quiser; ainda assim reserve o horário.',
  'Morgan Library (19/09) — ingresso online.',
  'Trem Amtrak NY→Filadélfia (17/09, Opção 1) — quanto antes, mais barato (de US$ 10 a US$ 60).',
  'Ônibus do Woodbury Common (17/09, Opção 2) — US$ 40 ida e volta, sai do Port Authority.',
  "Please Don't Tell (15/09) — reserva SÓ por telefone, no mesmo dia, a partir das 15h.",
  'Employees Only (15/09) — não reserva pra grupo pequeno: chegue antes das 19h.',
  'Empire State (16/09, opcional) — só se decidir subir o segundo mirante.',
  'One World Observatory (25/09) — horário marcado.',
  'Vessel (18/09) — US$ 10 com horário marcado ou US$ 15 livre.',
  'Rooftops (25/09) — Westlight e The Crown aceitam reserva; sexta à noite enche.',
];

const CHI_INI = '2026-09-20', CHI_FIM = '2026-09-24';

// ⛔ NÃO BUMPAR MAIS ESTA FLAG. ⛔
// Este patch RECONSTRÓI os itens `nyc2-` a partir do NYC_V2 — ou seja, a cada
// versão nova ele passava por cima das descrições que a Mari tinha editado à mão.
// Ela perdeu texto assim mais de uma vez (ago/2026) e pediu, com razão, pra eu
// parar. A partir daqui o roteiro dela é a fonte da verdade: mudança de conteúdo
// se faz PELO APP, ou num patch novo que altere só o item pedido, pelo id, e
// NUNCA reescreva `desc`. Editar o NYC_V2 abaixo só afeta instalação nova.
function ensureNYRoteiroV2(d) {
  if (d.nyRoteiroV7) return d;
  const viagens = d.viagensFuturas || [];
  const i = viagens.findIndex(v => v.id === 'vf-nychicago2026');
  if (i < 0) return d;                       // viagem não carregou: não faz nada
  const trip = viagens[i];
  const antigas = trip.mesas || [];
  // REGRA (corrigida ago/2026): só descarto o que EU criei. A versão anterior
  // guardava apenas o que estava entre 20 e 24/09 e apagou itens que a Mari tinha
  // criado à mão fora dessa janela — os voos Brasil↔Nova York nos dias 12, 13 e 26.
  // Agora: sai o que tem id de seed meu (`nyc2-`, e os `nyc-` do seed original que
  // não sejam de Chicago); TUDO o que ela criou fica, em qualquer data.
  const meuV2 = (m) => /^nyc2-/.test(m.id || '');
  const seedVelho = (m) => /^nyc-/.test(m.id || '');
  const ehChicago = (m) => !!m.dia && m.dia >= CHI_INI && m.dia <= CHI_FIM;
  const manter = antigas.filter(m => !meuV2(m) && (ehChicago(m) || !seedVelho(m)));
  // marcas dela nos itens de Nova York, pra não se perderem
  const marcas = {};
  antigas.forEach(m => { if (m.titulo && (m.visitado || m.favorito)) marcas[m.titulo] = { visitado: m.visitado, favorito: m.favorito }; });
  // Itens que MUDARAM DE NOME entre versões: sem isto o check dela sumia junto
  // com o título antigo. Mapa nome-velho → nome-novo.
  const RENOMEADOS = {
    'Café da manhã: Barney Greengrass': 'Café da manhã gostoso',
    'Musical da Broadway': 'Musical da Broadway (sexta — o mais caro)',
  };
  Object.entries(RENOMEADOS).forEach(([velho, novo]) => { if (marcas[velho] && !marcas[novo]) marcas[novo] = marcas[velho]; });
  const novas = NYC_V2.map((x, n) => ({
    id: 'nyc2-' + n, n, dia: x.d || '', bucket: x.bk || undefined, hora: x.hora || '',
    titulo: x.t, desc: x.desc,
    abertura: x.ab || undefined, preco: x.pr || undefined,
    maps: gmap(x.mq || (x.t + ' New York')), link: x.link,
    opcao: x.op || undefined,          // roteiros alternativos do mesmo dia (17/09)
    ...(marcas[x.t] || {}),
  }));
  // Os dois voos Brasil↔Nova York eu REPUS porque meu patch anterior os apagou.
  // Se o dela ainda estiver lá (ou ela repuser à mão), não duplico: o dela manda.
  const jaTemVoo = (dia, re) => manter.some(m => m.dia === dia && re.test(m.titulo || ''));
  const novasSemDuplicar = novas.filter(m => {
    if (m.titulo === 'Chegada no JFK') return !jaTemVoo('2026-09-13', /jfk|chegad/i);
    if (m.titulo === 'Voo de volta ao Brasil') return !jaTemVoo('2026-09-26', /voo|gru|brasil/i);
    return true;
  });
  const mesas = [...novasSemDuplicar, ...manter].sort((a, b) => (a.dia || '').localeCompare(b.dia || '') || (a.hora || '').localeCompare(b.hora || ''));
  // endereços: mantém os dela, acrescenta os que faltam (compara pelo nome)
  const jaTem = new Set((trip.enderecos || []).map(e => (e.nome || '').toLowerCase().trim()));
  const novosEnds = NYC_ENDS.filter(e => !jaTem.has(e.n.toLowerCase().trim())).map((e, n) => ({
    id: 'nyend-' + n, nome: e.n, endereco: e.e + (e.e.includes('Brooklyn') || e.e.includes('Valley') ? '' : ', Nova York'),
    tipo: e.c, maps: gmap((e.q || (e.n + ' ' + e.e)) + ' New York'),
  }));
  // Card "Reservar antes de ir": cria uma vez e, se já existir, só acrescenta o
  // que falta — os que ela já marcou como feitos ficam marcados.
  const secoes = trip.secoes || [];
  const jaRes = secoes.find(s => s.id === 'sec-reservas-ny');
  const textosRes = new Set((jaRes?.itens || []).map(it => it.texto));
  const itensRes = [
    ...(jaRes?.itens || []),
    ...NYC_RESERVAS.filter(t => !textosRes.has(t)).map((t, n) => ({ id: 'res-' + n, texto: t, feito: false })),
  ];
  const secReservas = { id: 'sec-reservas-ny', titulo: '🎟️ Reservar antes de ir', tipo: 'lista', local: 'card', texto: '', itens: itensRes };
  const novasSecoes = jaRes ? secoes.map(s => (s.id === 'sec-reservas-ny' ? secReservas : s)) : [...secoes, secReservas];

  // CAMPOS DE TEXTO (hospedagem, passagens): só escrevo por cima se o que está lá
  // for MEU (vazio ou uma das versões que eu mesma gravei). Se a Mari escreveu ou
  // editou, fica o dela — foi assim que apaguei as 3 hospedagens dela, deixando só
  // a que ela tinha me citado. Regra irmã da dos itens: não mexo no que é dela.
  // REGRA: campo de texto que a Mari escreve (hospedagem, passagens) SÓ é
  // preenchido quando está VAZIO. Nunca por cima — foi assim que apaguei as três
  // hospedagens dela (duas em Nova York e uma em Chicago), deixando só a que ela
  // tinha me citado no chat. Se ela apagar o campo, eu repovoo; se tiver
  // qualquer coisa escrita, não encosto.
  const soSeVazio = (atual, novo) => ((atual || '').trim() ? atual : novo);
  const hospedagem = soSeVazio(trip.hospedagem,
    'American Dream — 168 E 24th St, Gramercy, Nova York, NY 10010.\n'
    + 'Check-in costuma ser ~15h (no dia 13 você chega de manhã: deixe as malas e saia leve).\n'
    + 'A pé: Madison Square Park 5 min · Flatiron 8 min · Union Square 10 min · Eataly 8 min.\n'
    + 'Metrô: 23rd St (linha 6) a 5 min; 23rd St (linhas N/R/W e F/M) a 8 min.');
  const passagens = soSeVazio(trip.passagens,
    'Chegada ~7h40 no JFK (13/09). Volta: voo 20h30 (26/09), saída do hotel ~17h30.\n'
    + 'NY → Chicago (20/09): sai 06:45 de LGA, chega 08:50 em ORD.\n'
    + 'Chicago → NY (24/09): sai 05:45 de ORD, chega 09:30 em LGA.');

  const nova = { ...trip, mesas, enderecos: [...(trip.enderecos || []), ...novosEnds], secoes: novasSecoes, passagens, hospedagem };
  return { ...d, nyRoteiroV2: true, nyRoteiroV3: true, nyRoteiroV4: true, nyRoteiroV5: true, nyRoteiroV6: true, nyRoteiroV7: true, viagensFuturas: viagens.map((v, k) => (k === i ? nova : v)) };
}

// Ingresso COMPRADO (o 1º da viagem, 09/ago/2026): Harry Potter e a Criança
// Amaldiçoada, sexta 18/09 às 19h, no Lyric Theatre.
// Este patch é do tipo que passou a ser a regra: SÓ ACRESCENTA um item. Não lê,
// não reescreve e não apaga nada do que a Mari já tem — nem o item genérico de
// musical do mesmo dia, que é ela quem decide se some.
function ensureNYHarryPotter(d) {
  if (d.nyHarryPotter1) return d;
  const viagens = d.viagensFuturas || [];
  const i = viagens.findIndex(v => v.id === 'vf-nychicago2026');
  if (i < 0) return d;
  const trip = viagens[i];
  const mesas = trip.mesas || [];
  if (mesas.some(m => m.id === 'nyc-hp')) return { ...d, nyHarryPotter1: true };
  const item = {
    id: 'nyc-hp', dia: '2026-09-18', hora: '19:00',
    titulo: '🎟️ Harry Potter e a Criança Amaldiçoada — INGRESSO COMPRADO',
    desc: 'Lyric Theatre, 214 W 43rd St (entre a 7ª e a 8ª, ao lado da Times Square).\n\n'
      + 'É uma PEÇA, não musical — a continuação da história, 19 anos depois, com Harry pai e o filho Albus. Efeitos de palco que são o motivo de todo mundo sair falando dela.\n\n'
      + 'Dura 2h55 com um intervalo de 20 min, então termina por volta das 21h55.\n\n'
      + 'Chegue 30 min antes: a entrada do Lyric tem fila e revista. Vale ver o saguão, que é art déco restaurado.',
    abertura: 'Sessão 19h · portas 18h30',
    preco: 'comprado ✓',
    maps: gmap('Lyric Theatre 214 W 43rd St New York'),
    link: 'https://broadway.harrypottertheplay.com/',
  };
  const nova = { ...trip, mesas: [...mesas, item] };
  return { ...d, nyHarryPotter1: true, viagensFuturas: viagens.map((v, k) => (k === i ? nova : v)) };
}

function ensureNYChicago2026(d) {
  if (d.nyChicago2026Seeded) return d;
  const have = new Set((d.viagensFuturas || []).map(v => v.id));
  if (have.has('vf-nychicago2026')) return { ...d, nyChicago2026Seeded: true };
  const viagem = {
    id: 'vf-nychicago2026', titulo: 'Nova York & Chicago', cidade: 'Nova York · Chicago',
    inicio: '2026-09-13', fim: '2026-09-26',
    link: 'https://www.nyctourism.com/',
    hospedagem: 'American Dream — 168 E 24th St, Gramercy, Nova York, NY 10010. Check-in ~15h.',
    passagens: 'Chegada ~7h40 no JFK (13/09). Volta: voo 20h30 (26/09), saída do hotel ~17h30. Trecho Nova York ↔ Chicago: a confirmar.',
    notas: 'Reservar com antecedência: musicais da Broadway (18 e 19), Frick (13), Top of the Rock (19), Amtrak + Independence Hall (16) e Village Vanguard (14). Sem dia fixo: Central Park (volte quantas vezes quiser) e compras (Macy’s, brechós e lojinhas — o outlet do dia 17 cobre o grosso). Dias 20–24: Chicago (roteiro a definir).',
    mesas: NYC_ROTEIRO.map((x, i) => ({
      id: 'nyc-' + i, n: i, dia: x.d, hora: x.hora,
      titulo: x.t, desc: x.desc,
      abertura: x.ab || undefined, preco: x.pr || undefined,
      maps: gmap(x.mq || (x.t + ' New York')), link: x.link,
    })),
    levar: [], comprar: [],
  };
  return { ...d, nyChicago2026Seeded: true, viagensFuturas: [...(d.viagensFuturas || []), viagem] };
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
  if (d.gastos2026ImpV22) return d; // V22: Mercado "Cozinha de atleta"->"Performance" (+barra de proteína); V21: Presentes junta Laços em Doação; V20: Rolês; V19: Fixos; V18: Viagem; V17: Coisas; V16: Coisas baldes; V15: Bolsa/Roupas BZ; V14: Sapatos; V13: Roupa; V12: Presentes->Mãe; V11: Nutricar; V10: Bobeira; V9: Skin care; V8: Podologia; V7-2: demais
  const semSeed = (d.gastosItens || []).filter(x => !/^gi-(pres|fix|imp)-/.test(x.id || ''));
  const novos = GASTOS_ITENS_2026.map((r, i) => ({ id: 'gi-imp-' + i, mes: r[0], categoria: r[1], nome: r[2], valor: r[3] }));
  const out = { ...d, gastos2026ImpV22: true, gastosItens: [...semSeed, ...novos] };
  if (d.gastos) { // já congelado na nuvem → refresca só os meses importados
    const imp = new Set(GASTOS_TOTAIS_2026.map(g => g.mes));
    out.gastos = [...d.gastos.filter(g => !imp.has(g.mes)), ...GASTOS_TOTAIS_2026].sort((a, b) => a.mes.localeCompare(b.mes));
  }
  return out;
}

// Subcategorias fixas de cada categoria de Gastos (a Mari edita: cria/exclui).
// "outros" NÃO entra aqui — é sempre o resto automático (total − soma das subs),
// menos em Uber e Mãe, que são únicas (lista vazia = sem subs, sem "outros").
const GASTO_SUBCATS_SEED = {
  'Fixos': ['Aluguel', 'Contas casa', 'Academia/personal', 'Streaming/assinaturas', 'Mãe', 'Transporte'],
  'Mercado': ['Mercado', 'Nutricar', 'Livup', 'Performance'],
  'Uber': [],
  'Trabalho': ['Uber', 'Almoço'],
  'Mãe': [],
  'Saúde': ['Farmácia', 'Dentista', 'Psiquiatra', 'Consulta', 'Exames', 'Estética', 'Academia'],
  'Viagem': ['NY', 'FLIP', 'Trilhas', 'Olinda', 'Europa', 'Rio', 'Carnaval BH', 'Salvador'],
  'Coisas': ['Óculos', 'Câmera/foto', 'Arte', 'Casa', 'Livros', 'Cabelo', 'Papelaria', 'Acessórios'],
  'Roupa': ['Roupa', 'Fantasias', 'Bolsas', 'Ajustes', 'Esporte', 'Sapatos'],
  'Skin care': ['Cabelo', 'Pele', 'Maquiagem'],
  'Bobeira': ['Comida salgado', 'Comida doce', 'Água'],
  'Rolês': ['Bares', 'Restaurante', 'Shows', 'Festas', 'Aniversário', 'Cultura', 'Corrida', 'Dates'],
  'Presentes': ['Westwing', 'Doação', 'Milena', 'Posto praia', 'Sorvete Raul', 'Pedágio'],
};
function ensureGastoSubcats(d) {
  if (d.gastoSubcatsSeeded) return d;
  // só preenche categorias que a Mari ainda não personalizou (merge não-destrutivo)
  const atual = d.gastoSubcats || {};
  const next = { ...atual };
  Object.keys(GASTO_SUBCATS_SEED).forEach(cat => { if (!next[cat]) next[cat] = [...GASTO_SUBCATS_SEED[cat]]; });
  return { ...d, gastoSubcatsSeeded: true, gastoSubcats: next };
}
// A Mari pediu tirar "Diversos" do Rolês (fica só o "outros" automático). Migra
// quem já foi semeado com ele: some da lista e apaga os lançamentos (viram outros).
function ensureRolesSemDiversos(d) {
  if (d.rolesSemDiversos) return d;
  const subs = (d.gastoSubcats || {})['Rolês'];
  if (!subs || !subs.includes('Diversos')) return { ...d, rolesSemDiversos: true };
  return {
    ...d, rolesSemDiversos: true,
    gastoSubcats: { ...d.gastoSubcats, 'Rolês': subs.filter(s => s !== 'Diversos') },
    gastosItens: (d.gastosItens || []).filter(x => !(x.categoria === 'Rolês' && x.nome === 'Diversos')),
  };
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

// Carteira do mês corrente: quando vira o mês (ex.: chega agosto), replica os
// ativos do último mês — mesmos nomes, categorias, finalidades e moedas, com os
// valores do mês anterior como ponto de partida — pra Mari só ajustar os números
// em vez de digitar a carteira inteira de novo.
//
// Roda como seed, ou seja, DEPOIS do merge com a nuvem: nunca cria mês em cima
// de um estado desatualizado. Quando a nuvem está inalcançável o seed até grava
// local, mas o boot não empurra — mantendo a invariante de sync.
//
// `financas.autoMes` guarda o último mês já replicado. Sem essa marca, apagar o
// mês criado o faria voltar no boot seguinte, e não haveria como se livrar dele.
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

function runLifeSeeds(d) {
  const seeds = [ensureMaquiagem, ensureMaquiagemGrupos, ensureNY26, ensureMusica, ensureMusicaJun, ensureMarcos, ensureAssistirLivros, ensureAssistirLivrosV2, ensureCoisasCaras, ensureViagens, ensureViagensCidades, ensureViagensMerge, ensureFlip2026, ensureFlipMesaLinks, ensureFlipDetalhes, ensureFlipTipoPrincipal, ensureFlipPurgeNaoFav, ensureNYChicago2026, ensureNYRoteiroV2, ensureNYHarryPotter, ensureLeiturasLidos, ensureLeiturasCasa, ensureLeiturasNaoTenho, ensureLeiturasTemasV2, ensureLeiturasTipo, ensureLeiturasOutros, ensureLeiturasCat, ensureLeiturasIdioma3, ensureLeiturasAnos, ensureLeiturasAmyr, ensureAssistirSemLivros, ensureGastosPresentes, ensureGastosFixos, ensureFixosJunhoFix, ensureGastos2026Detalhe, ensureAnnaKarenina, ensureViagensQuero, ensureViagensQueroV2, ensureViagensQueroFix, ensurePlanosViagem, ensureIngles, ensureInglesDaffodils, ensureAmorosaSeed, ensureAmorosaDate1, ensureAmorosaDate2, rolarComprasVencidas, rolarPlanosVencidos, ensureExpos2026, ensureExpos2026Lote2, ensureCarteiraMesAtual, ensureGastoSubcats, ensureRolesSemDiversos];
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
function writeLocal(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} }

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
    data, compras, salvarAgora, syncStatus,
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
