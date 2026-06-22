// Navegação leve entre abas (ex.: de Vida Financeira → Retrospectiva → Compras).
import { createContext, useContext } from 'react';

export const NavContext = createContext({ goRetro: () => {}, goRetroCompras: () => {} });
export const useNav = () => useContext(NavContext);
