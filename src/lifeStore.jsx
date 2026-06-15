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
const DEFAULT = { compras: { listas: [], itens: [] } };

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
    { id: 'i1', planoId: 'adocao-gato', titulo: 'Segurança em primeiro lugar (gatificar)', texto: 'Antes de levar o gato pra casa, o apê precisa estar à prova de fugas e acidentes.\n\n• Redes de proteção: inegociável em apartamento — gatos perdem o equilíbrio, sim. Telas com malha de 3–5 cm em todas as janelas, sacadas e basculantes (até os do banheiro).\n• Plantas tóxicas: muitas comuns são venenosas (lírios, comigo-ninguém-pode, costela-de-adão, jiboia). Afaste ou descarte.\n• Fios e objetos pequenos: filhotes adoram morder fios — use protetores de cabo. Cuidado com elásticos, linhas e agulhas, que podem ser engolidos.' },
    { id: 'i2', planoId: 'adocao-gato', titulo: 'O enxoval — o que comprar', texto: '• Comedouros de inox, cerâmica ou vidro (plástico acumula bactéria e causa acne felina no queixo).\n• Água: gatos bebem mal por instinto e preferem água corrente — fonte elétrica ajuda a prevenir problema renal; ou potes espalhados.\n• Ração de qualidade: pergunte ao abrigo o que ele já comia, pra transição gradual. Tenha sachês (ração úmida) pra hidratação.\n• Caixa de areia grande o bastante pra ele dar uma volta dentro. Regra: nº de caixas = nº de gatos + 1 (pra 1 gato, 2 caixas).\n• Areia: argila, milho/mandioca ou sílica — as biodegradáveis de grão fino costumam ter ótima aceitação.\n• Arranhador vertical e estável (senão ele usa o sofá), cama/toca quentinha e caixa de transporte (nunca transportar solto no carro).' },
    { id: 'i3', planoId: 'adocao-gato', titulo: 'Comportamento felino (não é cachorro pequeno)', texto: '• Pensam em 3D: amam altura e se sentem seguros controlando o ambiente do alto. Liberar o topo de uma estante / pôr prateleiras ajuda muito.\n• O dia da chegada: não solte na sala inteira. Deixe num cômodo menor com a caixa de transporte aberta, comida, água e areia por perto. Ele sai no tempo dele — pode levar horas ou dias.\n• Linguagem corporal: rabo balançando rápido NÃO é alegria (é irritação/superestimulação); orelhas pra trás = medo ou agressividade.\n• Socialização: se vier arisco, não pegue à força. Sente no chão, voz calma, ofereça petisco úmido e deixe ele vir até você.' },
    { id: 'i4', planoId: 'adocao-gato', titulo: 'Rotina', texto: '• Veterinário amigo dos gatos (de preferência felino ou com atendimento separado de cães) pro check-up, vacinas (V4/V5 + antirrábica) e castração.\n• Limpeza: caixa de areia limpa pelo menos 2x/dia. Gato é limpíssimo — caixa suja vira xixi no tapete/cama em protesto.\n• Brincadeira: 15–30 min/dia gastando energia (varinha com penas/fitas, simulando caça) pra evitar tédio e ansiedade.' },
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
const LifeContext = createContext(null);
const uid = (p = 'i') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function readLocal() {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { ...DEFAULT }; }
}
function writeLocal(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} }

export function LifeProvider({ children }) {
  const [data, setData] = useState(readLocal);
  const dirty = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const local = readLocal();
      const cloud = await fetchLife();
      if (!alive || dirty.current) return;
      if (!cloud) {
        if (local.compras.itens.length || local.compras.listas.length) pushLife(local);
        return;
      }
      const merged = { ...DEFAULT, ...cloud, compras: { ...DEFAULT.compras, ...(cloud.compras || {}) } };
      writeLocal(merged); setData(merged);
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
  const toggleComprado = (id) => setCompras({ ...compras, itens: compras.itens.map(x => x.id === id ? { ...x, comprado: !x.comprado } : x) });
  const addComprasLista = (nome) => { const id = uid('l'); setCompras({ ...compras, listas: [...compras.listas, { id, nome }] }); return id; };
  const deleteComprasLista = (id) => setCompras({
    ...compras,
    listas: compras.listas.filter(l => l.id !== id),
    itens: compras.itens.map(x => x.listaId === id ? { ...x, listaId: 'geral' } : x),
  });

  // ---- Planos (com Informações + Check list) ----
  const planos = data.planos || DEFAULT_PLANOS;
  const setPlanos = (next) => persist({ ...data, planos: next });
  const addPlano = (nome) => { const id = uid('p'); setPlanos({ ...planos, lista: [...planos.lista, { id, nome }] }); return id; };
  const deletePlano = (id) => setPlanos({ lista: planos.lista.filter(p => p.id !== id), infos: planos.infos.filter(i => i.planoId !== id), itens: planos.itens.filter(c => c.planoId !== id) });
  const savePlanoInfo = (info) => setPlanos(info.id && planos.infos.some(x => x.id === info.id)
    ? { ...planos, infos: planos.infos.map(x => x.id === info.id ? info : x) }
    : { ...planos, infos: [...planos.infos, { ...info, id: uid('i') }] });
  const deletePlanoInfo = (id) => setPlanos({ ...planos, infos: planos.infos.filter(x => x.id !== id) });
  const addPlanoCheck = (planoId, texto) => setPlanos({ ...planos, itens: [...planos.itens, { id: uid('k'), planoId, texto, feito: false }] });
  const togglePlanoCheck = (id) => setPlanos({ ...planos, itens: planos.itens.map(x => x.id === id ? { ...x, feito: !x.feito } : x) });
  const deletePlanoCheck = (id) => setPlanos({ ...planos, itens: planos.itens.filter(x => x.id !== id) });

  const value = {
    data, compras,
    addComprasItem, updateComprasItem, deleteComprasItem, toggleComprado, addComprasLista, deleteComprasLista,
    planos, addPlano, deletePlano, savePlanoInfo, deletePlanoInfo, addPlanoCheck, togglePlanoCheck, deletePlanoCheck,
  };
  return <LifeContext.Provider value={value}>{children}</LifeContext.Provider>;
}

export function useLife() {
  const ctx = useContext(LifeContext);
  if (!ctx) throw new Error('useLife precisa estar dentro de <LifeProvider>');
  return ctx;
}
