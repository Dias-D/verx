import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../theme';
import { PieChartPanel } from './PieChartPanel';

describe('PieChartPanel (organismo)', () => {
  it('renderiza o título e a legenda com o percentual de cada fatia', () => {
    render(
      <ThemeProvider theme={theme}>
        <PieChartPanel
          title="Por estado"
          data={[
            { label: 'MT', value: 46 },
            { label: 'GO', value: 36 },
            { label: 'PR', value: 24 },
            { label: 'SP', value: 22 },
          ]}
        />
      </ThemeProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Por estado' })).toBeInTheDocument();
    expect(screen.getByText('MT — 36%')).toBeInTheDocument();
    expect(screen.getByText('GO — 28%')).toBeInTheDocument();
    expect(screen.getByText('PR — 19%')).toBeInTheDocument();
    expect(screen.getByText('SP — 17%')).toBeInTheDocument();
  });

  it('não quebra quando a soma dos valores é zero (dataset vazio)', () => {
    render(
      <ThemeProvider theme={theme}>
        <PieChartPanel title="Por cultura plantada" data={[{ label: 'Sem dados', value: 0 }]} />
      </ThemeProvider>,
    );

    expect(screen.getByText('Sem dados — 0%')).toBeInTheDocument();
  });
});
