import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { MemoryRouter } from 'react-router-dom';
import { theme } from '../theme';
import { Produtores } from './Produtores';

describe('Produtores (página, placeholder até a etapa F2)', () => {
  it('renderiza o título da página, sem quebrar', () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <Produtores />
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Produtores' })).toBeInTheDocument();
    expect(screen.getByText(/em construção/i)).toBeInTheDocument();
  });
});
