import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer from './dashboardSlice';

/**
 * Store da aplicação. `dashboardSlice` (F1) é o primeiro slice real;
 * `produtoresSlice` (F2) entra quando a etapa que precisa dele chegar.
 */
export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
