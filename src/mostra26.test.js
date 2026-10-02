// O bilhete da Mostra escreve no documento DELA: só com a lista vazia, e uma vez.
import { describe, it, expect } from 'vitest';
import { ensureMostra26 } from './lifeStore.jsx';

describe('ensureMostra26 — os dois primeiros filmes da Mostra', () => {
  it('num documento vazio, entram os dois, sem sessões', () => {
    const d = ensureMostra26({});
    expect(d.mostra.filmes.map(f => f.titulo)).toEqual(['Tigre de Papel', 'All of a Sudden']);
    d.mostra.filmes.forEach(f => expect(f.sessoes).toEqual([]));
    expect(d.mostra26).toBe(true);
  });

  it('se ela já tem filmes na lista, não encosta', () => {
    const mostra = { ingressos: 'abre dia 10', filmes: [{ id: 'x', titulo: 'Outro' }] };
    expect(ensureMostra26({ mostra }).mostra).toBe(mostra);
  });

  it('depois de rodar, não volta: se ela apagar um filme, ele fica apagado', () => {
    const uma = ensureMostra26({});
    const semTigre = { ...uma, mostra: { filmes: [] } };
    expect(ensureMostra26(semTigre).mostra.filmes).toEqual([]);
  });

  it('guarda o que ela escreveu nos ingressos', () => {
    expect(ensureMostra26({ mostra: { ingressos: 'abre dia 10' } }).mostra.ingressos).toBe('abre dia 10');
  });
});
