// O lembrete de atualizar os Esportes entra uma vez na lista de tarefas dela.
import { describe, it, expect } from 'vitest';
import { ensureLembreteEsportesNov26 } from './calendarStore.jsx';

describe('ensureLembreteEsportesNov26 — tarefa de 31/out/2026', () => {
  it('entra depois das tarefas dela, no dia 31/out', () => {
    const dela = { id: 't1', titulo: 'Pagar luz' };
    const d = ensureLembreteEsportesNov26({ tasks: [dela] });
    expect(d.tasks).toHaveLength(2);
    expect(d.tasks[0]).toBe(dela);
    expect(d.tasks[1].data).toBe('2026-10-31');
  });

  it('não duplica e não volta se ela apagar', () => {
    const uma = ensureLembreteEsportesNov26({});
    expect(ensureLembreteEsportesNov26({ ...uma, lembreteEsportesNov26: false }).tasks).toHaveLength(1);
    expect(ensureLembreteEsportesNov26({ ...uma, tasks: [] }).tasks).toEqual([]);
  });
});
