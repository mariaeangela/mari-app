// Contas da Saúde que não dependem de tela (pra poder testar sem abrir o app).

const dia = (ymd) => { const [y, m, d] = String(ymd).split('-').map(Number); return new Date(y, m - 1, d); };
const ymd = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
const entre = (a, b) => Math.round((dia(b) - dia(a)) / 86400000);

// Previsão da próxima menstruação pela média dos ciclos que ELA registrou.
// Ciclo = dias entre um início e o seguinte. Usa os 6 mais recentes e deixa de
// fora o que não parece ciclo (menos de 18 ou mais de 45 dias — um mês esquecido
// de registrar viraria um "ciclo" de 60 dias e puxaria a média pra longe).
// Devolve null quando ainda não dá pra prever (precisa de 2 inícios).
export function previsaoMenstruacao(registros, hoje) {
  const inicios = [...new Set((registros || []).map(r => r && r.data).filter(Boolean))].sort();
  if (inicios.length < 2) return null;
  const ciclos = [];
  for (let i = 1; i < inicios.length; i++) ciclos.push(entre(inicios[i - 1], inicios[i]));
  const validos = ciclos.filter(c => c >= 18 && c <= 45).slice(-6);
  if (!validos.length) return null;
  const ciclo = Math.round(validos.reduce((a, b) => a + b, 0) / validos.length);
  const ultimo = inicios[inicios.length - 1];
  const prox = dia(ultimo); prox.setDate(prox.getDate() + ciclo);
  const proxima = ymd(prox);
  const duracoes = (registros || []).filter(r => r && r.data && r.fim).map(r => entre(r.data, r.fim) + 1).filter(n => n >= 1 && n <= 12);
  const duracao = duracoes.length ? Math.round(duracoes.slice(-6).reduce((a, b) => a + b, 0) / Math.min(6, duracoes.length)) : null;
  return { proxima, ciclo, amostra: validos.length, faltam: entre(hoje, proxima), duracao };
}
