// Service worker do Diagonal — deixa o APP guardado no aparelho, pra abrir sem
// internet (avião, metrô, roaming). Set/2026.
//
// É um MODELO: o `vite build` (plugin em vite.config.js) preenche a versão e a
// lista de arquivos com o que acabou de ser gerado e grava dist/sw.js.
//
// O que ele NÃO faz, de propósito:
//  • não toca em /api — os dados dela continuam indo e vindo como sempre (e já
//    ficavam guardados no aparelho antes disto existir);
//  • não guarda nada de outro site (pinturas do Wikimedia, fontes): sem rede, a
//    tela de entrada cai no fundo colorido da estação, e as letras na do sistema.
//
// Versão nova: com internet, a página vem SEMPRE do servidor (rede primeiro).
// O service worker novo guarda a versão nova inteira de uma vez e apaga a velha;
// quem estava com o app aberto na versão velha cai no aviso de sempre ("Saiu uma
// versão nova do app"), porque os pedaços velhos deixam de existir — igual a
// antes. Nunca fica preso numa versão velha enquanto houver internet.
const VERSAO = '__VERSAO__';
const CACHE = 'diagonal-app-' + VERSAO;
const ARQUIVOS = __ARQUIVOS__;

self.addEventListener('install', (e) => {
  // `reload`: pega do servidor, não de um cache do navegador que pode estar velho.
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(['/', ...ARQUIVOS].map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('diagonal-app-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  if (req.mode === 'navigate') { e.respondWith(paginaRedePrimeiro(req)); return; }
  if (url.pathname.startsWith('/assets/') || ARQUIVOS.includes(url.pathname)) {
    // ignoreVary: o script do app é pedido com cabeçalho de origem e o servidor
    // responde com "Vary: Origin"; sem isto a cópia guardada não é reconhecida
    // e, sem rede, o app abria em BRANCO (testado).
    e.respondWith(caches.match(req, { ignoreVary: true }).then(r => r || fetch(req)));
  }
});

// A página: tenta o servidor; sem resposta em 4s (ou sem rede), a guardada.
// A guardada NUNCA é trocada aqui — só na instalação, junto com os pedaços dela.
// Assim a página guardada e os pedaços guardados são sempre da MESMA versão.
async function paginaRedePrimeiro(req) {
  try {
    return await Promise.race([
      fetch(req),
      new Promise((_, nao) => setTimeout(() => nao(new Error('sem resposta')), 4000)),
    ]);
  } catch {
    return (await caches.match('/', { ignoreVary: true })) || Response.error();
  }
}
