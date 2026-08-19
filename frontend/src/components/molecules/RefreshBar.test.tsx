import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../theme';
import { RefreshBar } from './RefreshBar';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('RefreshBar (molécula)', () => {
  it('exibe o horário de cálculo formatado e a nota de atualização automática', () => {
    renderWithTheme(
      <RefreshBar calculatedAt="2026-08-19T21:14:00.000Z" onRefresh={jest.fn()} />,
    );

    expect(screen.getByText('Dados calculados às 18:14')).toBeInTheDocument();
    expect(
      screen.getByText('Atualização automática a cada 5 min'),
    ).toBeInTheDocument();
  });

  it('exibe um texto de cálculo em andamento quando calculatedAt está ausente', () => {
    renderWithTheme(<RefreshBar onRefresh={jest.fn()} />);

    expect(screen.getByText('Calculando dados...')).toBeInTheDocument();
  });

  it('dispara onRefresh ao clicar em Atualizar', () => {
    const onRefresh = jest.fn();
    renderWithTheme(
      <RefreshBar calculatedAt="2026-08-19T21:14:00.000Z" onRefresh={onRefresh} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /atualizar/i }));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('desabilita o botão e mostra o spinner quando isRefreshing', () => {
    renderWithTheme(
      <RefreshBar
        calculatedAt="2026-08-19T21:14:00.000Z"
        onRefresh={jest.fn()}
        isRefreshing
      />,
    );

    expect(screen.getByRole('button', { name: /atualizar/i })).toBeDisabled();
    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument();
  });
});
