// Conversa com a função serverless /api/data.
// Tudo é "best-effort": se a nuvem estiver fora (ex.: rodando local com
// `npm run dev`, ou sem internet), as funções falham em silêncio e o app
// segue usando o cache do localStorage.
const ENDPOINT = '/api/data';

// Busca os salvos da nuvem. Devolve um array, ou null se a nuvem estiver
// inacessível (para o chamador saber distinguir "vazio" de "offline").
export async function fetchSaved() {
  try {
    const res = await fetch(ENDPOINT, { method: 'GET' });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data && data.saved) ? data.saved : [];
  } catch {
    return null;
  }
}

// Envia a lista inteira de salvos para a nuvem, com debounce para não disparar
// um request a cada clique rápido. Mescla no servidor (não apaga projetos).
let timer = null;
let pending = null;
export function pushSaved(saved) {
  pending = saved;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    const body = JSON.stringify({ saved: pending });
    timer = null;
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }).catch(() => {});
  }, 400);
}
