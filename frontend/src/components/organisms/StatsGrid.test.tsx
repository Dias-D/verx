import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../theme';
import { StatsGrid } from './StatsGrid';

describe('StatsGrid (organismo)', () => {
  it('renderiza os totais de fazendas e hectares, formatados em pt-BR', () => {
    render(
      <ThemeProvider theme={theme}>
        <StatsGrid totalFarms={128} totalHectares={342_500} />
      </ThemeProvider>,
    );

    expect(screen.getByText('Fazendas cadastradas')).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('Hectares registrados')).toBeInTheDocument();
    expect(screen.getByText('342.500 ha')).toBeInTheDocument();
  });
});
