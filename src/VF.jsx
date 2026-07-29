// Aba VF — a Vida Financeira com página própria, ao lado de Life.
//
// Ponto de partida: reusa a `FinancasSection` que já existia dentro de Life
// (Carteira · Salários · Gastos), sem o botão "← Life", já que aqui é a página
// inteira. NADA foi removido de Life: o card "Vida Financeira" continua lá e
// abre exatamente a mesma tela. A ideia é ir remodelando esta aba aos poucos.
import { FinancasSection } from './Life.jsx';

export default function VFPage() {
  return <FinancasSection />;
}
