// Aba VF — a Vida Financeira com página própria, ao lado de Life.
//
// Reusa a `FinancasSection` que já existia dentro de Life, mas no modo hub: a
// capa mostra Carteira · Salários · Gastos como três cards horizontais (o mesmo
// formato dos cards de Viagens), e cada um abre a sua tela.
//
// NADA foi removido de Life: o card "Vida Financeira" de lá continua abrindo a
// mesma seção com as pastilhas de sempre. Isto aqui é só uma outra porta de
// entrada pros mesmos dados — a remodelagem vem por partes.
import { FinancasSection } from './Life.jsx';

export default function VFPage() {
  return <FinancasSection comoHub />;
}
