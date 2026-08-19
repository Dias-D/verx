import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { MemoryRouter } from 'react-router-dom';
import { theme } from '../../theme';
import { PageLayout } from './PageLayout';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </MemoryRouter>,
  );
}

describe('PageLayout (template)', () => {
  it('renderiza a marca, a navegação e o título da página recebido por props', () => {
    renderWithProviders(
      <PageLayout title="Dashboard">
        <p>conteúdo da página</p>
      </PageLayout>,
    );

    expect(screen.getByText('Brain Agriculture')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Produtores' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('conteúdo da página')).toBeInTheDocument();
  });

  it('renderiza os filhos passados por props/children, sem acessar a store', () => {
    renderWithProviders(
      <PageLayout title="Produtores">
        <span>região de conteúdo</span>
      </PageLayout>,
    );

    expect(screen.getByText('região de conteúdo')).toBeInTheDocument();
  });
});
