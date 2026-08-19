import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../theme';
import { ErrorNotice } from './ErrorNotice';

describe('ErrorNotice (molécula)', () => {
  it('renderiza a mensagem de erro recebida por props', () => {
    render(
      <ThemeProvider theme={theme}>
        <ErrorNotice message="Não foi possível atualizar agora." />
      </ThemeProvider>,
    );

    expect(
      screen.getByText(/não foi possível atualizar agora\./i),
    ).toBeInTheDocument();
  });
});
