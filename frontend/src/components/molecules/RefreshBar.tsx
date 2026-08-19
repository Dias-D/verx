import styled from 'styled-components';
import { Button } from '../atoms/Button';
import { Spinner } from '../atoms/Spinner';
import { Text } from '../atoms/Text';
import { formatCalculatedAt } from '../../utils/formatDateTime';

const Bar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 14px 18px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

/**
 * Molécula: compõe átomos (Text, Button, Spinner) para o propósito único de
 * "mostrar quando os dados foram calculados e deixar o refresh sob controle
 * do usuário" — espelha `.refresh-bar` do wireframe. Não conhece o domínio
 * do dashboard além de receber um `calculatedAt` genérico.
 */
export interface RefreshBarProps {
  calculatedAt?: string;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function RefreshBar({ calculatedAt, onRefresh, isRefreshing }: RefreshBarProps) {
  return (
    <Bar>
      <div>
        <Text>{formatCalculatedAt(calculatedAt)}</Text>
        <Text size="sm" muted>
          Atualização automática a cada 5 min
        </Text>
      </div>
      <Button onClick={onRefresh} disabled={isRefreshing}>
        {isRefreshing ? <Spinner /> : null}
        Atualizar
      </Button>
    </Bar>
  );
}
