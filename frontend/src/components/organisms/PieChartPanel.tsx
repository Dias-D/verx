import styled from 'styled-components';
import { Cell, Pie, PieChart } from 'recharts';
import { Card } from '../atoms/Card';
import { Heading } from '../atoms/Heading';

const DEFAULT_COLORS = ['#2f6f4f', '#6fa287', '#a9c9b8', '#d7e6dd', '#cdbf8e'];

const ChartWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Legend = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const Swatch = styled.span<{ $color: string }>`
  width: 9px;
  height: 9px;
  border-radius: 2px;
  display: inline-block;
  background: ${({ $color }) => $color};
`;

export interface PieChartPanelSlice {
  label: string;
  value: number;
}

export interface PieChartPanelProps {
  title: string;
  data: PieChartPanelSlice[];
  colors?: string[];
}

/**
 * Organismo: seção com significado de domínio (um gráfico de pizza do
 * dashboard), compõe átomos (Card, Heading) direto e a biblioteca de
 * gráficos decidida (Recharts) — mesmo padrão descrito em
 * frontend-teste-brain-ag.md#2 ("PieChartPanel (Recharts + Card)").
 * Reaproveitado três vezes (estado, cultura, uso do solo) variando só
 * `title`/`data`. Espelha `.chart-card` do wireframe, com legenda própria
 * (rótulo + percentual) em vez da legenda embutida do Recharts, para bater
 * exatamente com o texto congelado no wireframe.
 */
export function PieChartPanel({ title, data, colors = DEFAULT_COLORS }: PieChartPanelProps) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <Card>
      <Heading level={3}>{title}</Heading>
      <ChartWrapper>
        <PieChart width={140} height={140}>
          <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={60}>
            {data.map((slice, index) => (
              <Cell key={slice.label} fill={colors[index % colors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ChartWrapper>
      <Legend>
        {data.map((slice, index) => {
          const percentage = total === 0 ? 0 : Math.round((slice.value / total) * 100);
          return (
            <LegendItem key={slice.label}>
              <Swatch $color={colors[index % colors.length]} />
              <span>
                {slice.label} — {percentage}%
              </span>
            </LegendItem>
          );
        })}
      </Legend>
    </Card>
  );
}
