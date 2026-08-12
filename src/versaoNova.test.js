// "Saiu uma versão nova" vs. "esta tela deu problema".
//
// Quando eu publico, cada pedaço do app troca de nome. O app já aberto no celular
// dela pede o nome velho e leva 404 — o que NÃO é defeito, é versão nova. Errar
// essa distinção dá nos dois lados: chamar defeito de versão nova esconde bug meu;
// chamar versão nova de defeito assusta a Mari à toa.
import { describe, it, expect } from 'vitest';
import { ehVersaoNova } from './App.jsx';

describe('ehVersaoNova — reconhece o pedaço que sumiu porque publiquei', () => {
  it('as mensagens reais dos navegadores', () => {
    const reais = [
      // Chrome / Edge
      'Failed to fetch dynamically imported module: https://diagonal.vercel.app/assets/Life-e59e38c9.js',
      // Firefox
      'error loading dynamically imported module',
      // Safari
      'Importing a module script failed.',
      // webpack/antigos
      'ChunkLoadError: Loading chunk 3 failed.',
    ];
    for (const m of reais) expect(ehVersaoNova(m), m).toBe(true);
  });

  it('defeito de verdade NÃO vira "versão nova" (senão eu escondo bug meu)', () => {
    const bugs = [
      "Cannot read properties of undefined (reading 'map')",
      'x is not a function',
      'Maximum update depth exceeded',
      'Invalid hook call',
    ];
    for (const m of bugs) expect(ehVersaoNova(m), m).toBe(false);
  });

  it('não quebra com mensagem vazia', () => {
    expect(ehVersaoNova('')).toBe(false);
    expect(ehVersaoNova(null)).toBe(false);
    expect(ehVersaoNova(undefined)).toBe(false);
  });
});
