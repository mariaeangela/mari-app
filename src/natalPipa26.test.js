// O bilhete da viagem Natal & Pipa escreve no documento DELA: entra uma vez, não
// duplica e não encosta nas outras viagens.
import { describe, it, expect } from 'vitest';
import { ensureNatalPipa26, getViagemAtiva } from './lifeStore.jsx';

describe('ensureNatalPipa26 — a viagem de 18 a 28/dez/2026', () => {
  it('entra depois das viagens dela, com voos, as três hospedagens e o roteiro', () => {
    const dela = { id: 'vf1', titulo: 'NY & Chicago', inicio: '2026-09-13', fim: '2026-09-26' };
    const d = ensureNatalPipa26({ viagensFuturas: [dela] });
    expect(d.viagensFuturas).toHaveLength(2);
    expect(d.viagensFuturas[0]).toBe(dela);
    const v = d.viagensFuturas[1];
    expect(v.passagens).toContain('G3 1680');
    expect(v.passagens).toContain('G3 1681');
    expect(v.hospedagem.split('\n')).toHaveLength(4);
    expect(v.mesas.map(m => m.dia)).toEqual(['2026-12-18', '2026-12-19', '2026-12-20', '2026-12-24', '2026-12-28']);
  });

  it('o modo viagem liga na véspera (17/12) e desliga depois do dia 28', () => {
    const { viagensFuturas } = ensureNatalPipa26({});
    expect(getViagemAtiva(viagensFuturas, '2026-12-16')).toBeNull();
    expect(getViagemAtiva(viagensFuturas, '2026-12-17')).not.toBeNull();
    expect(getViagemAtiva(viagensFuturas, '2026-12-28')).not.toBeNull();
    expect(getViagemAtiva(viagensFuturas, '2026-12-29')).toBeNull();
  });

  it('não duplica: nem rodando de novo, nem se ela já cadastrou, nem se apagou', () => {
    const uma = ensureNatalPipa26({});
    expect(ensureNatalPipa26({ ...uma, natalPipa26: false }).viagensFuturas).toHaveLength(1);
    const minha = { viagensFuturas: [{ id: 'x', titulo: 'Natal com a mãe' }] };
    expect(ensureNatalPipa26(minha).viagensFuturas).toBe(minha.viagensFuturas);
    expect(ensureNatalPipa26({ ...uma, viagensFuturas: [] }).viagensFuturas).toEqual([]);
  });
});
