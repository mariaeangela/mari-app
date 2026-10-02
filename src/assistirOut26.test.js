// O bilhete dos quatro títulos escreve no documento DELA: não duplica e não
// encosta no que já está na lista.
import { describe, it, expect } from 'vitest';
import { ensureAssistirOut26 } from './lifeStore.jsx';

describe('ensureAssistirOut26 — os quatro de 02/out/2026', () => {
  it('entram os quatro, dois filmes e duas séries, na frente da lista', () => {
    const dela = { id: 'as1', titulo: 'Um vídeo meu', feito: true };
    const d = ensureAssistirOut26({ assistir: [dela] });
    expect(d.assistir).toHaveLength(5);
    expect(d.assistir[4]).toBe(dela);
    expect(d.assistir.slice(0, 4).map(i => i.tipo)).toEqual(['filme', 'serie', 'filme', 'serie']);
  });

  it('rodar de novo não duplica, e título que ela já tem não entra', () => {
    const uma = ensureAssistirOut26({});
    expect(ensureAssistirOut26({ ...uma, assistirOut26: false }).assistir).toHaveLength(4);
    const d = ensureAssistirOut26({ assistir: [{ id: 'x', titulo: 'two lovers' }] });
    expect(d.assistir).toHaveLength(4);
  });
});
