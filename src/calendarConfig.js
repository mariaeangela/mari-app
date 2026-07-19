// Configuração da aba Calendário: categorias de evento, tipos de cultura,
// escala de humor e o "neste dia na história" (curado + Wikipédia).
import { HISTORICAL_FACTS } from './contentLibrary.js';

// --- Categorias de EVENTO (cor + rótulo). Ids estáveis (usados nos dados). ---
// `aguardado: true` = entra na contagem regressiva ("faltam X dias").
export const CATEGORIES = [
  { id: 'trabalho',     label: 'Trabalho',       cor: '#4f7cff' },
  { id: 'viagem',       label: 'Viagem',         cor: '#19b3a6', aguardado: true },
  { id: 'aniversarios', label: 'Aniversários',   cor: '#ff5d8f' },
  { id: 'saude',        label: 'Saúde',          cor: '#54c08a' },
  { id: 'pessoais',     label: 'Datas pessoais', cor: '#f4b740' },
];
export const CAT_BY_ID = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

// Exercício é um TIPO próprio, fora de "Evento". Cada subtipo tem um `grupo`:
//   treino (costas/peitoral/perna, cor por grupo muscular), corrida, outros.
const COR_OUTROS = '#8d99ae';
export const EXERCICIO_SUBTIPOS = [
  { id: 'costas',         label: 'Costas',         grupo: 'treino',  cor: '#5b8def' },
  { id: 'peitoral',       label: 'Peitoral',       grupo: 'treino',  cor: '#c77dff' },
  { id: 'perna',          label: 'Perna',          grupo: 'treino',  cor: '#2bb673' },
  { id: 'alongamento',    label: 'Alongamento',    grupo: 'treino',  cor: '#26c6da' },
  { id: 'corrida_treino', label: 'Corrida treino', grupo: 'corrida', cor: '#f0a35e' },
  { id: 'corrida_prova',  label: 'Corrida prova',  grupo: 'corrida', cor: '#ef6c4d', aguardado: true },
  { id: 'outros',         label: 'Outros',         grupo: 'outros',  cor: COR_OUTROS },
];
export const EXERCICIO_BY_ID = Object.fromEntries(EXERCICIO_SUBTIPOS.map(e => [e.id, e]));
// Compatibilidade com dados antigos (subtipos que não existem mais).
EXERCICIO_BY_ID.corrida = EXERCICIO_BY_ID.corrida_prova;
['natacao', 'caminhada', 'trilha', 'jogo', 'danca'].forEach(k => { EXERCICIO_BY_ID[k] = EXERCICIO_BY_ID.outros; });
// Legenda da visão Exercício.
export const EXERCICIO_LEGENDA = [
  { label: 'Costas', cor: '#5b8def' }, { label: 'Peitoral', cor: '#c77dff' }, { label: 'Perna', cor: '#2bb673' },
  { label: 'Alongamento', cor: '#26c6da' },
  { label: 'Corrida treino', cor: '#f0a35e' }, { label: 'Corrida prova', cor: '#ef6c4d' }, { label: 'Outros', cor: COR_OUTROS },
];

// Rolês, Cultura e Tarefas são TIPOS próprios, com cor própria.
export const ROLE_COR = '#ff8a3d';      // coral
export const CULTURA_COR = '#c2548f';   // berry
export const TAREFA_COR = '#6b7280';    // cinza-ardósia

// --- Subtipos de CULTURA (alimentam a futura aba Projetos). ---
// 'lendo' = livro em andamento (aparece fixo no fim da página); 'lido' = livro concluído.
// 'ouvindo'/'ouvido' = mesma ideia para audiobooks.
export const CULTURA_SUBTIPOS = [
  { id: 'lendo',      label: 'Lendo' },
  { id: 'lido',       label: 'Lido' },
  { id: 'ouvindo',    label: 'Ouvindo' },
  { id: 'ouvido',     label: 'Ouvido' },
  { id: 'filme',      label: 'Filme' },
  { id: 'serie',      label: 'Série' },
  { id: 'exposicao',  label: 'Exposição' },
  { id: 'museu',      label: 'Museu' },
  { id: 'show',       label: 'Show' },
  { id: 'espetaculo', label: 'Espetáculo' },
];
export const CULTURA_BY_ID = Object.fromEntries(CULTURA_SUBTIPOS.map(c => [c.id, c]));

// Legenda de cores da visão Mês (treinos não aparecem no Mês; só corrida).
export const LEGENDA = [
  ...CATEGORIES.map(c => ({ label: c.label, cor: c.cor })),
  { label: 'Corrida prova', cor: EXERCICIO_BY_ID.corrida_prova.cor },
  { label: 'Outros', cor: COR_OUTROS },
  { label: 'Rolê', cor: ROLE_COR },
  { label: 'Cultura', cor: CULTURA_COR },
  { label: 'Tarefa', cor: TAREFA_COR },
];

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

// ---------- Tempo & pace de corrida (form do Calendário + Retrospectiva) ----------
// Tempo guardado em SEGUNDOS. parseTempo aceita "h:mm:ss", "mm:ss" ou "32" (= minutos).
export function parseTempo(str) {
  if (str == null) return null;
  const s = String(str).trim();
  if (!s) return null;
  const parts = s.split(':').map(p => p.trim());
  if (parts.some(p => p === '' || isNaN(Number(p)))) return null;
  const n = parts.map(Number);
  let secs;
  if (n.length === 1) secs = n[0] * 60;                 // só minutos
  else if (n.length === 2) secs = n[0] * 60 + n[1];     // mm:ss
  else secs = n[0] * 3600 + n[1] * 60 + n[2];           // h:mm:ss
  return secs > 0 ? Math.round(secs) : null;
}
// Segundos -> "h:mm:ss" (com hora só se >= 1h) ou "m:ss".
export function fmtTempo(secs) {
  if (secs == null || secs === '') return '';
  const s = Math.round(Number(secs) || 0);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(ss)}` : `${m}:${pad2(ss)}`;
}
// Pace em segundos por km (tempo total / distância).
export function paceSecs(tempoSecs, km) {
  const t = Number(tempoSecs), d = Number(km);
  return t > 0 && d > 0 ? t / d : null;
}
// Pace (s/km) -> "m:ss/km".
export function fmtPace(secsPerKm) {
  if (!secsPerKm) return '';
  const s = Math.round(secsPerKm);
  return `${Math.floor(s / 60)}:${pad2(s % 60)}/km`;
}
// Distância em km para exibição: aceita "5,2"/"5.2"/número, mostra com PONTO e 1 casa (sem zero à toa).
export function fmtKm(d) {
  if (d == null || d === '') return '';
  const n = Number(String(d).replace(',', '.'));
  if (!isFinite(n)) return String(d);
  return String(Math.round(n * 10) / 10);
}
// Distância digitada (com vírgula ou ponto) -> número, ou undefined se vazio/ inválido.
export function parseKm(str) {
  if (str == null || String(str).trim() === '') return undefined;
  const n = Number(String(str).replace(',', '.'));
  return isFinite(n) && n > 0 ? n : undefined;
}

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
