import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../theme';
import { Spinner } from './Spinner';

describe('Spinner (átomo)', () => {
  it('expõe role="status" com nome acessível "Carregando"', () => {
    render(
      <ThemeProvider theme={theme}>
        <Spinner />
      </ThemeProvider>,
    );

    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument();
  });
});
