// "Esqueço o app aberto no PC, mexo bastante no celular, e no dia seguinte abro
// o PC e perco as mudanças." (relato da Mari, 11/ago/2026)
//
// O encadeamento era este:
//   1. o PC fica aberto e ESCONDIDO a noite inteira;
//   2. à meia-noite, a tarefa que "puxa os vencidos pra hoje" roda mesmo sem
//      ninguém olhando, mexe no documento VELHO do PC e o carimba com a hora de
//      agora — carimbo mais novo que tudo que ela fez no celular à noite;
//   3. de manhã o PC pergunta pra nuvem, vê um carimbo MENOR que o dele, conclui
//      que ele é a versão certa e ignora o que veio do celular.
//
// Os dois consertos, fixados aqui: a tarefa não roda escondida, e ao acordar o
// app junta os dois lados em vez de escolher um.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rebasear } from './mesclar.js';

function fakeStorage() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k), clear: () => m.clear() };
}

let cloud;
beforeEach(async () => {
  vi.useFakeTimers();
  vi.resetModules();
  vi.stubGlobal('localStorage', fakeStorage());
  vi.stubGlobal('sessionStorage', fakeStorage());
  cloud = await import('./cloud.js');
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('a tarefa automática não pode rodar com o app escondido', () => {
  // A guarda em si é uma linha no store; aqui fica registrado o PORQUÊ, que é o
  // que se perde com o tempo: o carimbo de madrugada é o que estraga o dia seguinte.
  const rolarSeVisivel = (visivel, doc) => {
    if (!visivel) return doc;                       // escondido: não mexe em nada
    return { ...doc, planos: 'puxados', _rev: Date.now() };
  };
  it('escondido: o documento do PC continua com o carimbo de ontem', () => {
    vi.setSystemTime(new Date('2026-08-12T00:00:00'));
    const pcOntem = { planos: 'de ontem', _rev: Date.parse('2026-08-11T09:00:00') };
    const depois = rolarSeVisivel(false, pcOntem);
    expect(depois._rev).toBe(pcOntem._rev);         // NÃO ganhou carimbo de madrugada
  });
  it('à vista: pode puxar e carimbar normalmente', () => {
    vi.setSystemTime(new Date('2026-08-12T09:00:00'));
    const pc = { planos: 'de ontem', _rev: Date.parse('2026-08-11T09:00:00') };
    expect(rolarSeVisivel(true, pc)._rev).toBeGreaterThan(pc._rev);
  });
});

describe('ao acordar, o PC junta os dois lados', () => {
  it('o PC não mexeu em nada: adota inteiro o que veio do celular', async () => {
    // sem nada pendente daqui, `fatiasNaoConfirmadas` devolve {} depois do boot
    cloud.definirBaseLife({ planos: 'A', leituras: 'L' });
    const noPc = { planos: 'A', leituras: 'L', _rev: 1 };
    const daNuvem = { planos: 'A', leituras: 'L2 (do celular)', viagens: 'V (do celular)', _rev: 999 };
    const minhas = cloud.fatiasNaoConfirmadas(noPc);
    expect(minhas).toEqual({});                                   // o PC não mudou nada
    const juntos = { ...daNuvem, ...minhas };
    expect(juntos.leituras).toBe('L2 (do celular)');               // o do celular entrou
    expect(juntos.viagens).toBe('V (do celular)');
  });

  it('o PC mexeu em UMA coisa: essa fica, o resto vem do celular', async () => {
    cloud.definirBaseLife({ planos: 'A', leituras: 'L', viagens: 'V' });
    const noPc = { planos: 'A', leituras: 'L', viagens: 'V (escrito no PC)', _rev: 5 };
    const daNuvem = { planos: 'A2 (do celular)', leituras: 'L2 (do celular)', viagens: 'V', _rev: 999 };
    const juntos = { ...daNuvem, ...cloud.fatiasNaoConfirmadas(noPc) };
    expect(juntos.planos).toBe('A2 (do celular)');                 // veio do celular
    expect(juntos.leituras).toBe('L2 (do celular)');               // veio do celular
    expect(juntos.viagens).toBe('V (escrito no PC)');              // o do PC sobreviveu
  });

  it('sem saber o que é meu, não chuta (devolve null e o app fica conservador)', () => {
    cloud.definirBaseLife(null);
    expect(cloud.fatiasNaoConfirmadas({ planos: 'A' })).toBe(null);
  });
});

describe('a regra geral por trás dos dois', () => {
  it('juntar nunca faz um lado sumir', () => {
    const base = { celular: 'antigo', pc: 'antigo' };
    const doCelular = { celular: 'NOVO', pc: 'antigo' };
    const doPc = { celular: 'antigo', pc: 'NOVO' };
    const juntos = rebasear(doCelular, base, doPc);
    expect(juntos).toEqual({ celular: 'NOVO', pc: 'NOVO' });
  });
});
