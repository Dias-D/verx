import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../theme';
import { StatCard } from './StatCard';

describe('StatCard (molécula)', () => {
  it('renderiza o rótulo e o valor recebidos por props', () => {
    render(
      <ThemeProvider theme={theme}>
        <StatCard label="Fazendas cadastradas" value="128" />
      </ThemeProvider>,
    );

    expect(screen.getByText('Fazendas cadastradas')).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
  });
});
