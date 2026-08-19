import { Card } from '../atoms/Card';
import { Text } from '../atoms/Text';

/**
 * Molécula: compõe átomos (Card + Text) para um propósito único, ainda
 * genérica — não sabe se o valor é "fazendas" ou "hectares", só exibe o
 * rótulo/valor recebidos. Espelha `.stat-card` do wireframe congelado.
 */
export interface StatCardProps {
  label: string;
  value: string;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <Card>
      <Text size="sm" muted>
        {label}
      </Text>
      <Text size="xl" bold>
        {value}
      </Text>
    </Card>
  );
}
