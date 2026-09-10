import { describe, it, expect } from 'vitest';
import { arteDaTelaDeEntrada, ARTE_ESTACAO } from './contentLibrary.js';

const viagem = (mesas = [], cidade = 'Nova York') => ({ cidade, inicio: '2026-09-13', fim: '2026-09-26', mesas });

describe('fundo da tela de entrada', () => {
  it('sem viagem, a pintura da estação', () => {
    expect(arteDaTelaDeEntrada('winter', null, '2026-09-10')).toBe(ARTE_ESTACAO.winter);
    expect(arteDaTelaDeEntrada('spring', null, '2026-10-10')).toBe(ARTE_ESTACAO.spring);
  });

  it('viajando, a da cidade da viagem', () => {
    expect(arteDaTelaDeEntrada('winter', viagem(), '2026-09-15').cidade).toBe('Nova York');
  });

  it('num dia em Chicago (pela programação de hoje), a de Chicago', () => {
    const v = viagem([{ dia: '2026-09-21', titulo: 'Architecture Boat Tour', desc: 'Chicago River' },
      { dia: '2026-09-15', titulo: 'MoMA' }]);
    expect(arteDaTelaDeEntrada('winter', v, '2026-09-21').cidade).toBe('Chicago');
    expect(arteDaTelaDeEntrada('winter', v, '2026-09-15').cidade).toBe('Nova York');
  });

  it('cidade sem imagem própria fica com a estação', () => {
    expect(arteDaTelaDeEntrada('summer', viagem([], 'Lisboa'), '2026-09-15')).toBe(ARTE_ESTACAO.summer);
  });
});
