import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer, {
  fetchDashboardSnapshot,
  type DashboardState,
} from './dashboardSlice';
import { getDashboardSnapshot } from '../api/dashboard';
import { dashboardSnapshotFixture } from '../mocks/dashboard';

jest.mock('../api/dashboard');

const mockedGetDashboardSnapshot = getDashboardSnapshot as jest.MockedFunction<
  typeof getDashboardSnapshot
>;

describe('dashboardSlice (reducer)', () => {
  const initialState: DashboardState = { data: null, status: 'idle', error: null };

  it('estado inicial: sem dados, status idle', () => {
    expect(dashboardReducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('pending: entra em loading e limpa erro anterior, sem tocar em data', () => {
    const previousState: DashboardState = {
      data: dashboardSnapshotFixture,
      status: 'failed',
      error: 'erro anterior',
    };

    const result = dashboardReducer(previousState, {
      type: fetchDashboardSnapshot.pending.type,
    });

    expect(result.status).toBe('loading');
    expect(result.error).toBeNull();
    expect(result.data).toEqual(dashboardSnapshotFixture);
  });

  it('fulfilled: grava o snapshot recebido e marca succeeded', () => {
    const result = dashboardReducer(initialState, {
      type: fetchDashboardSnapshot.fulfilled.type,
      payload: dashboardSnapshotFixture,
    });

    expect(result.status).toBe('succeeded');
    expect(result.data).toEqual(dashboardSnapshotFixture);
    expect(result.error).toBeNull();
  });

  it('rejected: preserva os dados anteriores e expõe o erro (não limpa a tela)', () => {
    const previousState: DashboardState = {
      data: dashboardSnapshotFixture,
      status: 'succeeded',
      error: null,
    };

    const result = dashboardReducer(previousState, {
      type: fetchDashboardSnapshot.rejected.type,
      error: { message: 'Erro de rede' },
    });

    expect(result.status).toBe('failed');
    expect(result.error).toBe('Erro de rede');
    expect(result.data).toEqual(dashboardSnapshotFixture);
  });
});

describe('fetchDashboardSnapshot (thunk, integrado a uma store real)', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('chama getDashboardSnapshot (api/) e atualiza a store com o resultado', async () => {
    mockedGetDashboardSnapshot.mockResolvedValue(dashboardSnapshotFixture);
    const store = configureStore({ reducer: { dashboard: dashboardReducer } });

    await store.dispatch(fetchDashboardSnapshot());

    expect(mockedGetDashboardSnapshot).toHaveBeenCalledTimes(1);
    expect(store.getState().dashboard).toEqual({
      data: dashboardSnapshotFixture,
      status: 'succeeded',
      error: null,
    });
  });

  it('em falha, mantém o último snapshot bom e marca status failed', async () => {
    mockedGetDashboardSnapshot.mockResolvedValueOnce(dashboardSnapshotFixture);
    const store = configureStore({ reducer: { dashboard: dashboardReducer } });
    await store.dispatch(fetchDashboardSnapshot());

    mockedGetDashboardSnapshot.mockRejectedValueOnce(new Error('Falha ao atualizar'));
    await store.dispatch(fetchDashboardSnapshot());

    const state = store.getState().dashboard;
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Falha ao atualizar');
    expect(state.data).toEqual(dashboardSnapshotFixture);
  });
});
