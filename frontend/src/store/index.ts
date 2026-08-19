import { configureStore } from '@reduxjs/toolkit';

/**
 * Store da aplicação. Ainda sem nenhum slice — `dashboardSlice` (F1) e
 * `produtoresSlice` (F2) entram quando a etapa que precisa deles chegar,
 * cada um com seu próprio thunk de leitura/escrita.
 *
 * `reducer: {}` faria o Redux Toolkit chamar `combineReducers({})`, que emite
 * um aviso de "reducer inválido" no console — por isso o placeholder abaixo
 * é uma função identidade direta, substituída pelo objeto de slices reais
 * assim que o primeiro slice existir.
 */
export const store = configureStore({
  reducer: (state = {}) => state,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
