import { render, screen } from '@testing-library/react';
import App from './App';
import { getDashboardSnapshot } from './api/dashboard';
import { dashboardSnapshotFixture } from './mocks/dashboard';

jest.mock('./api/dashboard');

const mockedGetDashboardSnapshot = getDashboardSnapshot as jest.MockedFunction<
  typeof getDashboardSnapshot
>;

/**
 * Smoke test da etapa F1: prova que a casca inteira (Redux Provider,
 * ThemeProvider, Router) sobe com a rota padrão renderizando o Dashboard,
 * e que a navegação para Produtores está presente. Cobertura de regra de
 * negócio de verdade fica em pages/Dashboard.test.tsx (os cinco casos
 * obrigatórios da etapa).
 */
describe('App', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renderiza a rota padrão (Dashboard) com Redux, styled-components e Router conectados', async () => {
    mockedGetDashboardSnapshot.mockResolvedValue(dashboardSnapshotFixture);

    render(<App />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Dashboard' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('128')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Produtores' })).toBeInTheDocument();
  });
});
