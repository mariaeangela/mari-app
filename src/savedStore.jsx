// Store central dos "Salvos".
// Fonte da verdade em memória, espelhada em dois lugares:
//   - localStorage  -> cache instantâneo e offline (mesmo aparelho)
//   - nuvem (/api)  -> persistência permanente e sincronização entre aparelhos
//
// Fluxo: ao abrir, mostra o cache local na hora e, em paralelo, busca a nuvem
// e reconcilia. Toda mudança grava no local (já) e empurra para a nuvem (logo).
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { fetchSaved, pushSaved, saveSavedNow, UNREACHABLE } from './cloud';

const KEY = 'diagonal_saved';
const REVKEY = 'diagonal_saved_rev';   // carimbo de versão companheiro (Salvos são uma lista)
const SavedContext = createContext(null);

// id estável de um card salvo (igual à convenção antiga: tipo_título).
export const savedId = (type, content) => `${type}_${content && content.titulo}`;

function readLocal() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}
function writeLocal(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); }
  catch {}
}
function readRev() { return Number(localStorage.getItem(REVKEY)) || 0; }
function writeRev(r) { try { localStorage.setItem(REVKEY, String(r)); } catch {} }

export function SavedProvider({ children }) {
  const [items, setItems] = useState(readLocal);
  // Se o usuário já mexeu (salvou/removeu) antes da nuvem responder, NÃO deixa
  // a resposta tardia da nuvem sobrescrever a ação dele (corrigia o "X não remove").
  const dirty = useRef(false);
  const resyncing = useRef(false);
  const revRef = useRef(readRev());
  const itemsRef = useRef(items); itemsRef.current = items; // pro salvar manual

  const bumpRev = () => { const r = Math.max(Date.now(), revRef.current + 1); revRef.current = r; writeRev(r); return r; };
  const adotar = (cloudItems, cloudRev) => { writeLocal(cloudItems); writeRev(cloudRev); revRef.current = cloudRev; setItems(cloudItems); };

  // Carrega da nuvem uma vez e reconcilia por VERSÃO (como life/calendario).
  useEffect(() => {
    let alive = true;
    (async () => {
      const local = readLocal(); const localRev = readRev();
      const res = await fetchSaved(); // { items, rev } | UNREACHABLE
      if (!alive || dirty.current) return;  // já mexeu -> mantém a ação local
      if (res === UNREACHABLE) return;      // não leu -> mantém o local, NÃO empurra
      const { items: cloudItems, rev: cloudRev } = res;
      if (cloudItems.length === 0 && local.length > 0) pushSaved(local, revRef.current || bumpRev()); // nuvem vazia -> migra
      else if (cloudRev > localRev) adotar(cloudItems, cloudRev);   // nuvem mais nova -> adota
      else if (localRev > cloudRev) pushSaved(local, localRev);     // local mais novo (ex.: estrela offline) -> sobe
      else adotar(cloudItems, cloudRev);                            // empatados -> alinha com a nuvem
    })();
    return () => { alive = false; };
  }, []);

  // Re-sincroniza ao voltar ao foco / rede retornar: adota a nuvem só se for mais nova.
  const resyncSaved = async () => {
    if (resyncing.current) return;
    resyncing.current = true;
    try {
      const res = await fetchSaved();
      if (res === UNREACHABLE) return;
      const { items: cloudItems, rev: cloudRev } = res;
      if (cloudRev > revRef.current) { adotar(cloudItems, cloudRev); pushSaved(cloudItems, cloudRev); }
    } finally { resyncing.current = false; }
  };
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible') resyncSaved(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', resyncSaved);
    return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('online', resyncSaved); };
  }, []); // eslint-disable-line

  const persist = (next) => {
    dirty.current = true;
    setItems(next);
    writeLocal(next);          // imediato
    pushSaved(next, bumpRev()); // best-effort, com debounce, carimbando a versão
  };

  const isSaved = (id) => items.some(i => i.id === id);
  const remove = (id) => persist(items.filter(i => i.id !== id));
  const toggle = (item) =>
    isSaved(item.id) ? remove(item.id) : persist([item, ...items]);
  // Salvar AGORA na nuvem (pro botão global) — aguarda e devolve true/false.
  const salvarAgora = async () => { dirty.current = true; return await saveSavedNow(itemsRef.current, revRef.current); };

  return (
    <SavedContext.Provider value={{ items, isSaved, toggle, remove, salvarAgora }}>
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error('useSaved precisa estar dentro de <SavedProvider>');
  return ctx;
}
