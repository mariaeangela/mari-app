import { describe, it, expect } from 'vitest';
import { arteDaTelaDeEntrada, cidadeDoDia, ARTE_ESTACAO, IMAGENS_DA_CIDADE } from './contentLibrary.js';
import { getCidadeFato } from './cidadeFatos.js';

const viagem = (mesas = [], cidade = 'Natal') => ({ cidade, inicio: '2026-12-18', fim: '2026-12-28', mesas });
// o roteiro que o bilhete da viagem cadastrou: só os voos e as trocas de hotel
const ROTEIRO = [
  { dia: '2026-12-18', titulo: 'Voo São Paulo → Natal' },
  { dia: '2026-12-19', titulo: 'Chegada em Natal · Apart Hotel Casa Grande' },
  { dia: '2026-12-20', titulo: 'Natal → Pipa · Pousada Carambola', desc: 'Saída do Casa Grande · reserva em Pipa de 20 a 24/12' },
  { dia: '2026-12-24', titulo: 'Pipa → Natal · Sol Nascente Hotel Pousada Beira Mar', desc: 'Saída da Carambola · reserva em Natal de 24 a 28/12' },
  { dia: '2026-12-28', titulo: 'Voo Natal → São Paulo' },
];

describe('fundo da tela de entrada', () => {
  it('sem viagem, a pintura da estação', () => {
    expect(arteDaTelaDeEntrada('winter', null, '2026-09-10')).toBe(ARTE_ESTACAO.winter);
    expect(arteDaTelaDeEntrada('spring', null, '2026-10-10')).toBe(ARTE_ESTACAO.spring);
  });

  it('viajando, a da cidade da viagem', () => {
    expect(arteDaTelaDeEntrada('summer', viagem(), '2026-12-19').cidade).toBe('Natal');
  });

  it('viagem de duas cidades ("Natal · Pipa"): antes de qualquer pista, vale a PRIMEIRA do cadastro', () => {
    const v = viagem(ROTEIRO, 'Natal · Pipa');
    expect(cidadeDoDia(v, '2026-12-17')).toBe('Natal');   // véspera, sem programação
  });

  it('no dia do deslocamento, vale o destino', () => {
    const v = viagem(ROTEIRO, 'Natal · Pipa');
    expect(cidadeDoDia(v, '2026-12-18')).toBe('Natal');
    expect(cidadeDoDia(v, '2026-12-20')).toBe('Pipa');
    expect(cidadeDoDia(v, '2026-12-24')).toBe('Natal');
  });

  it('num dia sem nada na programação, continua onde ela estava', () => {
    const v = viagem(ROTEIRO, 'Natal · Pipa');
    ['2026-12-21', '2026-12-22', '2026-12-23'].forEach(d => expect(cidadeDoDia(v, d)).toBe('Pipa'));
    ['2026-12-25', '2026-12-26', '2026-12-27', '2026-12-28'].forEach(d => expect(cidadeDoDia(v, d)).toBe('Natal'));
    // um passeio sem nome de cidade no meio não muda nada
    const comPasseio = viagem([...ROTEIRO, { dia: '2026-12-22', titulo: 'Passeio de barco' }], 'Natal · Pipa');
    expect(cidadeDoDia(comPasseio, '2026-12-22')).toBe('Pipa');
    expect(cidadeDoDia(comPasseio, '2026-12-23')).toBe('Pipa');
  });

  it('cada cidade tem várias imagens, e troca a cada dia (o mesmo o dia todo)', () => {
    const natal = IMAGENS_DA_CIDADE('Natal').map(i => i.url);
    expect(natal.length).toBeGreaterThanOrEqual(5);
    expect(IMAGENS_DA_CIDADE('Pipa').length).toBeGreaterThanOrEqual(5);
    const v = viagem([], 'Natal · Pipa');
    const dias = ['2026-12-24', '2026-12-25', '2026-12-26', '2026-12-27', '2026-12-28'];
    const urls = dias.map(d => arteDaTelaDeEntrada('summer', v, d).url);
    expect(new Set(urls).size).toBe(5);                           // 5 dias seguidos, 5 imagens
    urls.forEach(u => expect(natal).toContain(u));
    expect(arteDaTelaDeEntrada('summer', v, '2026-12-26').url).toBe(urls[2]);   // mesmo dia, mesma
    expect(arteDaTelaDeEntrada('summer', v, '2026-12-26').credito).toBeTruthy();
  });

  it('as duas cidades têm curiosidade do dia', () => {
    expect(getCidadeFato('Natal', new Date(2026, 11, 19))).toBeTruthy();
    expect(getCidadeFato('Pipa', new Date(2026, 11, 21))).toBeTruthy();
  });

  it('cidade sem imagem própria fica com a estação', () => {
    expect(arteDaTelaDeEntrada('summer', viagem([], 'Lisboa'), '2026-09-15')).toBe(ARTE_ESTACAO.summer);
  });
});
