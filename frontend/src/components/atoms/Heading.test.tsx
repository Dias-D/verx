import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../theme';
import { Heading } from './Heading';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('Heading (átomo)', () => {
  it('renderiza como h1 por padrão', () => {
    renderWithTheme(<Heading>Dashboard</Heading>);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Dashboard' }),
    ).toBeInTheDocument();
  });

  it('renderiza no nível pedido via prop level', () => {
    renderWithTheme(<Heading level={3}>Por estado</Heading>);

    expect(
      screen.getByRole('heading', { level: 3, name: 'Por estado' }),
    ).toBeInTheDocument();
  });
});
