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

export function SavedProvider({ children }) {
  const [items, setItems] = useState(readLocal);
  // Se o usuário já mexeu (salvou/removeu) antes da nuvem responder, NÃO deixa
  // a resposta tardia da nuvem sobrescrever a ação dele (corrigia o "X não remove").
  const dirty = useRef(false);
  const itemsRef = useRef(items); itemsRef.current = items; // pro salvar manual

  // Carrega da nuvem uma vez e reconcilia com o cache local.
  useEffect(() => {
    let alive = true;
    (async () => {
      const local = readLocal();
      const cloud = await fetchSaved(); // array (leu) | UNREACHABLE (não leu)
      if (!alive || dirty.current) return;  // já mexeu -> mantém a ação local
      if (cloud === UNREACHABLE) return;    // não leu a nuvem -> mantém o local, NÃO empurra
      if (cloud.length === 0 && local.length > 0) {
        // Primeira vez com nuvem vazia: migra os salvos deste aparelho para cima.
        pushSaved(local);
      } else {
        // A nuvem é a verdade -> alinha o cache e a tela.
        writeLocal(cloud);
        setItems(cloud);
      }
    })();
    return () => { alive = false; };
  }, []);

  const persist = (next) => {
    dirty.current = true;
    setItems(next);
    writeLocal(next);   // imediato
    pushSaved(next);    // best-effort, com debounce
  };

  const isSaved = (id) => items.some(i => i.id === id);
  const remove = (id) => persist(items.filter(i => i.id !== id));
  const toggle = (item) =>
    isSaved(item.id) ? remove(item.id) : persist([item, ...items]);
  // Salvar AGORA na nuvem (pro botão global) — aguarda e devolve true/false.
  const salvarAgora = async () => { dirty.current = true; return await saveSavedNow(itemsRef.current); };

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
