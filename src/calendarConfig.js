// Configuração da aba Calendário: categorias de evento, tipos de cultura,
// escala de humor e o "neste dia na história" (curado + Wikipédia).
import { HISTORICAL_FACTS } from './contentLibrary.js';

// --- Categorias de EVENTO (cor + rótulo). Ids estáveis (usados nos dados). ---
export const CATEGORIES = [
  { id: 'trabalho',     label: 'Trabalho',       cor: '#4f7cff' },
  { id: 'viagem',       label: 'Viagem',         cor: '#19b3a6' },
  { id: 'aniversarios', label: 'Aniversários',   cor: '#ff5d8f' },
  { id: 'treino',       label: 'Treino',         cor: '#8e7cff' },
  { id: 'corridas',     label: 'Corridas',       cor: '#ef6c4d' },
  { id: 'saude',        label: 'Saúde',          cor: '#54c08a' },
  { id: 'pessoais',     label: 'Datas pessoais', cor: '#f4b740' },
  { id: 'estudos',      label: 'Estudos',        cor: '#3f51b5' },
];
export const CAT_BY_ID = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

// Rolês e Cultura são TIPOS próprios (não categorias de evento), com cor própria.
export const ROLE_COR = '#ff8a3d';      // coral
export const CULTURA_COR = '#c2548f';   // berry
export const TAREFA_COR = '#6b7280';    // cinza-ardósia

// --- Subtipos de CULTURA (alimentam a futura aba Projetos). ---
export const CULTURA_SUBTIPOS = [
  { id: 'livro',      label: 'Livro' },
  { id: 'filme',      label: 'Filme' },
  { id: 'serie',      label: 'Série' },
  { id: 'exposicao',  label: 'Exposição' },
  { id: 'museu',      label: 'Museu' },
  { id: 'show',       label: 'Show' },
  { id: 'espetaculo', label: 'Espetáculo' },
];
export const CULTURA_BY_ID = Object.fromEntries(CULTURA_SUBTIPOS.map(c => [c.id, c]));

// --- Escala de HUMOR (sem emoji; só cor + nome). ---
export const MOODS = [
  { id: 'otimo',      label: 'Ótimo',      cor: '#f5b400' },
  { id: 'bem',        label: 'Bem',        cor: '#6cc070' },
  { id: 'triste',     label: 'Triste',     cor: '#5c9ce0' },
  { id: 'estressado', label: 'Estressado', cor: '#ec5b53' },
  { id: 'ansioso',    label: 'Ansioso',    cor: '#b07cd6' },
];
export const MOOD_BY_ID = Object.fromEntries(MOODS.map(m => [m.id, m]));

// ---------- Utilidades de data ----------
export const pad2 = (n) => String(n).padStart(2, '0');
export const ymd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

// ---------- "Neste dia na história" ----------
// 1º) fato curado (conferido à mão); 2º) efemérides da Wikipédia (pt).
// Retorna { texto, fonte, url? } ou null se nada/ offline.
// Cache em memória por MM-DD para não repetir a chamada na mesma sessão.
const _factCache = {};
export async function getOnThisDay(date) {
  const m = date.getMonth() + 1, d = date.getDate();
  const ck = `${m}-${d}`;
  if (ck in _factCache) return _factCache[ck];
  const curado = HISTORICAL_FACTS[ck];
  if (curado) return (_factCache[ck] = { texto: curado, fonte: 'curado' });
  try {
    const url = `https://api.wikimedia.org/feed/v1/wikipedia/pt/onthisday/events/${pad2(m)}/${pad2(d)}`;
    const res = await fetch(url);
    if (!res.ok) return null;  // não cacheia falha de rede (tenta de novo depois)
    const data = await res.json();
    const events = Array.isArray(data?.events) ? data.events : [];
    if (!events.length) return (_factCache[ck] = null);
    // Escolhe o mais "notável": mais artigos ligados (proxy), desempata pelo ano mais recente.
    // Determinístico (sem aleatório), pra o fato do dia ser estável.
    const best = events.slice().sort((a, b) => {
      const pa = (a.pages || []).length, pb = (b.pages || []).length;
      if (pb !== pa) return pb - pa;
      return (b.year || 0) - (a.year || 0);
    })[0];
    const artigo = (best.pages || [])[0];
    const link = artigo?.content_urls?.desktop?.page;
    return (_factCache[ck] = { texto: `em ${best.year}, ${best.text}`, fonte: 'Wikipédia', url: link });
  } catch {
    return null;
  }
}
