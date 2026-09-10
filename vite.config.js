import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

// Gera dist/sw.js a partir de pwa/sw.js com a lista EXATA do que o build acabou
// de produzir (os nomes em /assets mudam a cada versão). A versão do service
// worker é um resumo dessa lista: mudou o app, muda o sw.js, e o navegador
// instala o novo sozinho.
function appNoAparelho() {
  return {
    name: 'diagonal-app-no-aparelho',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const doBuild = Object.keys(bundle).filter(f => f !== 'index.html' && f !== 'sw.js' && !f.endsWith('.map'));
      const arquivos = [...doBuild.map(f => '/' + f),
        '/manifest.webmanifest', '/favicon.png', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];
      const modelo = readFileSync(new URL('./pwa/sw.js', import.meta.url), 'utf8');
      const versao = createHash('sha1').update(arquivos.join('|') + modelo).digest('hex').slice(0, 12);
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: modelo.replaceAll('__VERSAO__', versao).replaceAll('__ARQUIVOS__', JSON.stringify(arquivos)),
      });
    },
  }
}

export default defineConfig({
  plugins: [react(), appNoAparelho()],
})
