import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getDashboardSnapshot } from '../api/dashboard';
import type { DashboardSnapshot } from '../types/dashboard';

export type DashboardStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface DashboardState {
  data: DashboardSnapshot | null;
  status: DashboardStatus;
  error: string | null;
}

const initialState: DashboardState = {
  data: null,
  status: 'idle',
  error: null,
};

/**
 * Único thunk desta etapa: busca o snapshot atual (nunca recalcula — ver
 * frontend-teste-brain-ag.md#4). Reaproveitado tanto pelo carregamento
 * inicial quanto pelo clique em "Atualizar" (RefreshBar via
 * pages/Dashboard.tsx) — mesma ação, disparada duas vezes.
 */
export const fetchDashboardSnapshot = createAsyncThunk(
  'dashboard/fetchSnapshot',
  () => getDashboardSnapshot(),
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardSnapshot.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        // `data` propositalmente intocado: no refetch, os dados anteriores
        // continuam disponíveis para a tela renderizar enquanto carrega.
      })
      .addCase(fetchDashboardSnapshot.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchDashboardSnapshot.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Erro ao atualizar o dashboard.';
        // `data` propositalmente preservado — mesma filosofia do backend:
        // servir o último snapshot válido em vez de limpar a tela no erro
        // (ver frontend-teste-brain-ag.md#5-estados-de-tela).
      });
  },
});

export default dashboardSlice.reducer;
