import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer from './dashboardSlice';
import produtoresReducer from './produtoresSlice';

/**
 * Store da aplicação. `dashboardSlice` (F1) e `produtoresSlice` (F2, CRUD de
 * produtor).
 */
export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
    produtores: produtoresReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
