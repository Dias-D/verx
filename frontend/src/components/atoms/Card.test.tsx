import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../theme';
import { Card } from './Card';

describe('Card (átomo)', () => {
  it('renderiza os filhos dentro do container', () => {
    render(
      <ThemeProvider theme={theme}>
        <Card>
          <p>conteúdo</p>
        </Card>
      </ThemeProvider>,
    );

    expect(screen.getByText('conteúdo')).toBeInTheDocument();
  });
});
