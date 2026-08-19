import styled from 'styled-components';
import { StatCard } from '../molecules/StatCard';

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const numberFormatter = new Intl.NumberFormat('pt-BR');

/**
 * Organismo: seção com significado de domínio (totais do dashboard),
 * compõe moléculas (StatCard). Espelha `.stats-grid` do wireframe. Só
 * conhece "fazendas"/"hectares" aqui — StatCard continua genérica.
 */
export interface StatsGridProps {
  totalFarms: number;
  totalHectares: number;
}

export function StatsGrid({ totalFarms, totalHectares }: StatsGridProps) {
  return (
    <Grid>
      <StatCard label="Fazendas cadastradas" value={numberFormatter.format(totalFarms)} />
      <StatCard
        label="Hectares registrados"
        value={`${numberFormatter.format(totalHectares)} ha`}
      />
    </Grid>
  );
}
