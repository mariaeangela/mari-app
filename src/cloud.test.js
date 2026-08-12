// As regras que impedem a Diagonal de perder coisa. Cada teste aqui é um jeito
// pelo qual algo JÁ se perdeu (ou quase), fixado pra não voltar:
//
//  1. falha de LEITURA nunca pode virar "a nuvem está vazia"  (apagaria o outro aparelho)
//  2. 409 (a nuvem está à frente) tem que MESCLAR, nunca descartar em silêncio
//  3. se a mescla não entrar, a pendência CONTINUA — quem some sem avisar é o inimigo
//  4. aparelho sem espaço tem que falhar ALTO, não calado
//
// O servidor é de mentira: `fetch` é trocado por um roteiro por teste.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ---- localStorage de mentira (com cota, pra testar a falta de espaço) ----
function fakeStorage(limiteBytes = Infinity) {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    removeItem: (k) => m.delete(k),
    clear: () => m.clear(),
    setItem(k, v) {
      const total = [...m.entries()].filter(([kk]) => kk !== k).reduce((s, [kk, vv]) => s + kk.length + vv.length, 0);
      if (total + k.length + v.length > limiteBytes) { const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e; }
      m.set(k, v);
    },
    get _mapa() { return m; },
  };
}

// Servidor de mentira: `roteiro` responde na ordem em que as chamadas chegam.
function servidor(roteiro) {
  const chamadas = [];
  const fn = vi.fn(async (url, opts = {}) => {
    const metodo = opts.method || 'GET';
    const corpo = opts.body ? JSON.parse(opts.body) : null;
    chamadas.push({ metodo, corpo, url });
    const proximo = roteiro.shift();
    if (!proximo) throw new Error('servidor de mentira sem resposta pra ' + metodo);
    if (proximo.erro) throw new Error(proximo.erro);
    return { ok: proximo.status < 400, status: proximo.status, json: async () => proximo.corpo, text: async () => JSON.stringify(proximo.corpo || '') };
  });
  return { fn, chamadas };
}

let cloud;
async function carregar(limite) {
  vi.resetModules();
  vi.stubGlobal('localStorage', fakeStorage(limite));
  vi.stubGlobal('sessionStorage', fakeStorage());
  cloud = await import('./cloud.js');
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('1. falha de leitura NUNCA vira "nuvem vazia"', () => {
  it('rede caiu → UNREACHABLE (e não null)', async () => {
    await carregar();
    vi.stubGlobal('fetch', servidor([{ erro: 'offline' }]).fn);
    expect(await cloud.fetchLife()).toBe(cloud.UNREACHABLE);
  });

  it('servidor com erro → UNREACHABLE', async () => {
    await carregar();
    vi.stubGlobal('fetch', servidor([{ status: 500, corpo: {} }]).fn);
    expect(await cloud.fetchLife()).toBe(cloud.UNREACHABLE);
  });

  it('senha recusada (401) também é UNREACHABLE, não vazio', async () => {
    // Tratar 401 como "vazio" empurraria o local por cima e apagaria a nuvem.
    await carregar();
    vi.stubGlobal('fetch', servidor([{ status: 401, corpo: {} }]).fn);
    expect(await cloud.fetchLife()).toBe(cloud.UNREACHABLE);
  });

  it('nuvem respondeu e a seção está mesmo vazia → null (que é diferente)', async () => {
    await carregar();
    vi.stubGlobal('fetch', servidor([{ status: 200, corpo: { saved: [] } }]).fn);
    expect(await cloud.fetchLife()).toBe(null);
  });
});

describe('2. o 409 mescla — nunca descarta em silêncio', () => {
  it('a fatia escrita aqui entra na nuvem, e a de lá continua lá', async () => {
    await carregar();
    const s = servidor([
      { status: 409, corpo: { conflict: true } },                                   // 1) recusa por versão
      { status: 200, corpo: { life: { aprendizados: 'DA NUVEM', compras: 'C', _rev: 999 } } }, // 2) relê a nuvem
      { status: 200, corpo: { ok: true } },                                          // 3) manda o patch
    ]);
    vi.stubGlobal('fetch', s.fn);

    cloud.pushLife({ aprendizados: 'ESCRITO AGORA', compras: 'C', _rev: 5 });
    await vi.advanceTimersByTimeAsync(500);

    const patch = s.chamadas.find(c => c.corpo && c.corpo.lifePatch);
    expect(patch, 'devia ter mandado um patch depois do 409').toBeTruthy();
    // só a fatia que mudou vai; `compras` é igual dos dois lados e não é reenviada
    expect(patch.corpo.lifePatch).toEqual({ aprendizados: 'ESCRITO AGORA' });
    expect(patch.corpo.lifePatch.compras).toBeUndefined();
    // resolvido: a pendência some
    expect(cloud.temPendente('life')).toBe(false);
  });

  it('a versão da nuvem vai pra lixeira antes de ser mesclada', async () => {
    await carregar();
    vi.stubGlobal('fetch', servidor([
      { status: 409, corpo: {} },
      { status: 200, corpo: { life: { aprendizados: 'DA NUVEM', _rev: 999 } } },
      { status: 200, corpo: { ok: true } },
    ]).fn);
    cloud.pushLife({ aprendizados: 'DAQUI', _rev: 5 });
    await vi.advanceTimersByTimeAsync(500);
    const lixo = cloud.lerLixeira();
    expect(lixo.length).toBeGreaterThan(0);
    expect(lixo[0].doc.aprendizados).toBe('DA NUVEM');
  });

  it('Salvos: 409 vira UNIÃO — nenhuma estrela some', async () => {
    await carregar();
    const s = servidor([
      { status: 409, corpo: {} },
      { status: 200, corpo: { saved: [{ id: 'do-outro-aparelho' }], savedRev: 10 } },
      { status: 200, corpo: { ok: true } },
    ]);
    vi.stubGlobal('fetch', s.fn);
    cloud.pushSaved([{ id: 'daqui' }], 5);
    await vi.advanceTimersByTimeAsync(500);
    const ultimo = s.chamadas.filter(c => c.corpo && c.corpo.saved).pop();
    const ids = ultimo.corpo.saved.map(i => i.id).sort();
    expect(ids).toEqual(['daqui', 'do-outro-aparelho']);
  });

  it('Calendário: 409 junta o diário daqui com o evento de lá', async () => {
    await carregar();
    const s = servidor([
      { status: 409, corpo: {} },
      { status: 200, corpo: { calendario: { diary: {}, events: ['evento de la'], _rev: 999 } } },
      { status: 200, corpo: { ok: true } },
    ]);
    vi.stubGlobal('fetch', s.fn);
    cloud.pushCalendario({ diary: { '2026-08-11': 'escrito aqui' }, events: [], _rev: 5 });
    await vi.advanceTimersByTimeAsync(500);
    const ultimo = s.chamadas.filter(c => c.corpo && c.corpo.calendario).pop();
    expect(ultimo.corpo.calendario.diary['2026-08-11']).toBe('escrito aqui');   // o daqui entrou
    expect(ultimo.corpo.calendario.events).toEqual([]);                          // a fatia que mexi aqui manda
    expect(ultimo.corpo.calendario._rev).toBeGreaterThan(999);                   // carimbo acima do de lá
  });
});

describe('3. se a mescla não entrar, a pendência CONTINUA', () => {
  it('409 e a nuvem some no meio → nada é dado como salvo', async () => {
    await carregar();
    vi.stubGlobal('fetch', servidor([
      { status: 409, corpo: {} },
      { erro: 'offline' },        // não deu pra reler a nuvem
    ]).fn);
    cloud.pushLife({ aprendizados: 'ESCRITO AGORA', _rev: 5 });
    await vi.advanceTimersByTimeAsync(500);
    // era exatamente aqui que a nota sumia: a pendência era limpa e ninguém avisava
    expect(cloud.temPendente('life')).toBe(true);
  });

  it('erro de rede comum mantém a pendência e re-tenta', async () => {
    await carregar();
    const s = servidor([{ erro: 'offline' }, { status: 200, corpo: { ok: true } }]);
    vi.stubGlobal('fetch', s.fn);
    cloud.pushLife({ x: 1, _rev: 5 });
    await vi.advanceTimersByTimeAsync(300);
    expect(cloud.temPendente('life')).toBe(true);
    await vi.advanceTimersByTimeAsync(5000);          // o retry (4s)
    expect(cloud.temPendente('life')).toBe(false);
  });
});

describe('4. aparelho sem espaço falha ALTO', () => {
  it('grava normal quando cabe', async () => {
    await carregar(1000);
    expect(cloud.gravarLocal('k', 'abc')).toBe(true);
    expect(cloud.temSemEspaco()).toBe(false);
  });

  it('sem espaço: sacrifica as cópias de precaução e consegue gravar', async () => {
    await carregar(300);
    cloud.guardarNaLixeira('life', { lixo: 'x'.repeat(150) }, 'teste');
    expect(cloud.lerLixeira().length).toBe(1);
    expect(cloud.gravarLocal('dados', 'y'.repeat(200))).toBe(true);   // não cabia com a lixeira
    expect(cloud.lerLixeira().length).toBe(0);                        // ela foi sacrificada
    expect(cloud.temSemEspaco()).toBe(false);
  });

  it('não cabe de jeito nenhum: devolve false E avisa (não finge que gravou)', async () => {
    await carregar(50);
    const avisos = [];
    cloud.onSemEspaco((v) => avisos.push(v));
    expect(cloud.gravarLocal('dados', 'z'.repeat(500))).toBe(false);
    expect(cloud.temSemEspaco()).toBe(true);
    expect(avisos).toContain(true);
  });
});
