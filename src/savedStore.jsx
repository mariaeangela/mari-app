// Store central dos "Salvos".
// Fonte da verdade em memória, espelhada em dois lugares:
//   - localStorage  -> cache instantâneo e offline (mesmo aparelho)
//   - nuvem (/api)  -> persistência permanente e sincronização entre aparelhos
//
// Fluxo: ao abrir, mostra o cache local na hora e, em paralelo, busca a nuvem
// e reconcilia. Toda mudança grava no local (já) e empurra para a nuvem (logo).
import { createContext, useContext, useEffect, useState } from 'react';
import { fetchSaved, pushSaved } from './cloud';

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

  // Carrega da nuvem uma vez e reconcilia com o cache local.
  useEffect(() => {
    let alive = true;
    (async () => {
      const local = readLocal();
      const cloud = await fetchSaved(); // array | null
      if (!alive) return;
      if (cloud === null) return;       // offline -> mantém o local
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
    setItems(next);
    writeLocal(next);   // imediato
    pushSaved(next);    // best-effort, com debounce
  };

  const isSaved = (id) => items.some(i => i.id === id);
  const remove = (id) => persist(items.filter(i => i.id !== id));
  const toggle = (item) =>
    isSaved(item.id) ? remove(item.id) : persist([item, ...items]);

  return (
    <SavedContext.Provider value={{ items, isSaved, toggle, remove }}>
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error('useSaved precisa estar dentro de <SavedProvider>');
  return ctx;
}
