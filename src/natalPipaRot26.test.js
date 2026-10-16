// O bilhete dos passeios de Natal & Pipa entra na viagem DELA, uma vez só,
// sem repetir item e sem encostar no que já está lá.
import { describe, it, expect } from 'vitest';
import { ensureNatalPipa26, ensureNatalPipaRot26 } from './lifeStore.jsx';

describe('ensureNatalPipaRot26 — os passeios de 19 a 27/dez', () => {
  const base = () => ensureNatalPipa26({});

  it('põe os passeios nos dias e os opcionais em "Ainda sem data", em Natal', () => {
    const d = ensureNatalPipaRot26(base());
    const v = d.viagensFuturas[0];
    expect(v.mesas.slice(0, 5)).toEqual(base().viagensFuturas[0].mesas);
    const novos = v.mesas.slice(5);
    expect(novos).toHaveLength(18);
    const opc = novos.filter(m => m.bucket === 'semdata');
    expect(opc.map(m => m.titulo)).toEqual(['Parque das Dunas', 'Parrachos de Maracajaú', 'Parrachos de Pirangi']);
    expect(opc.every(m => m.cidadeId === 'cd-natal' && m.dia === '')).toBe(true);
    expect(new Set(novos.filter(m => !m.bucket).map(m => m.dia)).size).toBe(9);
  });

  it('não repete: rodando de novo, nem item com o mesmo título', () => {
    const uma = ensureNatalPipaRot26(base());
    const de_novo = ensureNatalPipaRot26({ ...uma, natalPipaRot26: false });
    expect(de_novo.viagensFuturas[0].mesas).toHaveLength(23);
    const b = base();
    b.viagensFuturas[0].mesas.push({ id: 'meu', titulo: 'ceia de natal', dia: '2026-12-24' });
    expect(ensureNatalPipaRot26(b).viagensFuturas[0].mesas.filter(m => /ceia/i.test(m.titulo))).toHaveLength(1);
  });

  it('sem a viagem, só marca que rodou', () => {
    const d = ensureNatalPipaRot26({ viagensFuturas: [{ id: 'x', titulo: 'Paraty' }] });
    expect(d.natalPipaRot26).toBe(true);
    expect(d.viagensFuturas[0].mesas).toBeUndefined();
  });
});
