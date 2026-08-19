import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import { MemoryRouter } from 'react-router-dom';
import { theme } from '../theme';
import dashboardReducer from '../store/dashboardSlice';
import { getDashboardSnapshot } from '../api/dashboard';
import { dashboardSnapshotFixture, emptyDashboardSnapshotFixture } from '../mocks/dashboard';
import { Dashboard } from './Dashboard';

jest.mock('../api/dashboard');

const mockedGetDashboardSnapshot = getDashboardSnapshot as jest.MockedFunction<
  typeof getDashboardSnapshot
>;

function renderDashboard() {
  const store = configureStore({ reducer: { dashboard: dashboardReducer } });
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>,
  );
}

describe('Dashboard (página)', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  // Caso 1: estado de carregamento.
  it('mostra um indicador de carregamento enquanto a primeira busca está pendente', () => {
    mockedGetDashboardSnapshot.mockReturnValue(new Promise(() => {}));

    renderDashboard();

    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument();
  });

  // Caso 2: renderiza totais e gráficos com serviço mockado.
  it('renderiza os totais e os três gráficos de pizza com o serviço mockado', async () => {
    mockedGetDashboardSnapshot.mockResolvedValue(dashboardSnapshotFixture);

    renderDashboard();

    expect(await screen.findByText('128')).toBeInTheDocument();
    expect(screen.getByText('342.500 ha')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Por estado' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Por cultura plantada' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Por uso do solo' })).toBeInTheDocument();
  });

  // Caso 3: exibe o horário de cálculo vindo da API.
  it('exibe o horário de cálculo (calculatedAt) vindo da API', async () => {
    mockedGetDashboardSnapshot.mockResolvedValue(dashboardSnapshotFixture);

    renderDashboard();

    expect(await screen.findByText('Dados calculados às 18:14')).toBeInTheDocument();
  });

  // Caso 4: clique em "Atualizar" dispara novo fetch.
  it('clicar em Atualizar dispara uma nova busca', async () => {
    mockedGetDashboardSnapshot.mockResolvedValue(dashboardSnapshotFixture);

    renderDashboard();
    await screen.findByText('128');

    fireEvent.click(screen.getByRole('button', { name: /atualizar/i }));

    await waitFor(() => expect(mockedGetDashboardSnapshot).toHaveBeenCalledTimes(2));
  });

  // Caso 5: erro no refetch preserva os dados anteriores e mostra aviso.
  it('em erro no refetch, mantém os últimos dados exibidos e mostra um aviso', async () => {
    mockedGetDashboardSnapshot.mockResolvedValueOnce(dashboardSnapshotFixture);

    renderDashboard();
    await screen.findByText('128');

    mockedGetDashboardSnapshot.mockRejectedValueOnce(new Error('Falha ao atualizar'));
    fireEvent.click(screen.getByRole('button', { name: /atualizar/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível atualizar agora. Mostrando os últimos dados calculados às 18:14.',
    );
    // dados anteriores continuam na tela, não zeram
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('342.500 ha')).toBeInTheDocument();
  });

  // Estado vazio (banco sem nenhum produtor/fazenda cadastrado ainda) — não
  // é um dos 5 casos obrigatórios da etapa, mas é exigido pelo Definition
  // of Done ("funcionalidade completa incluindo carregando/erro/vazio").
  it('não quebra com banco vazio (byState/byCrop vazios, totais zerados)', async () => {
    mockedGetDashboardSnapshot.mockResolvedValue(emptyDashboardSnapshotFixture);

    renderDashboard();

    expect(await screen.findByText('Fazendas cadastradas')).toBeInTheDocument();
    expect(screen.getAllByText('0')).not.toHaveLength(0);
    expect(screen.getByText('0 ha')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Por estado' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Por uso do solo' })).toBeInTheDocument();
  });
});
