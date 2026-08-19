import styled from 'styled-components';
import { Button, SecondaryButton } from '../atoms/Button';
import { Spinner } from '../atoms/Spinner';
import { Text } from '../atoms/Text';
import type { ProdutorRow } from '../../utils/produtorRows';

const TableCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const Th = styled.th`
  text-align: left;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 12px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Td = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  tr:last-child > & {
    border-bottom: none;
  }
`;

const ActionsTd = styled(Td)`
  text-align: right;
  white-space: nowrap;
`;

const LinkButton = styled.button`
  background: none;
  border: none;
  color: #24573f;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 6px;

  &.danger {
    color: ${({ theme }) => theme.colors.danger};
  }
`;

const CenteredState = styled.div`
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const numberFormatter = new Intl.NumberFormat('pt-BR');

export type ProdutoresTableStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface ProdutoresTableProps {
  status: ProdutoresTableStatus;
  rows: ProdutorRow[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onRetry: () => void;
  onNovoProdutor: () => void;
}

/**
 * Organismo: seção com significado de domínio (produtores), compõe
 * moléculas/átomos. Assume os quatro estados do wireframe congelado
 * (carregando/com dados/vazia/erro) no mesmo componente, igual ao `.table-card`
 * do HTML de referência.
 */
export function ProdutoresTable({
  status,
  rows,
  onEdit,
  onDelete,
  onRetry,
  onNovoProdutor,
}: ProdutoresTableProps) {
  if (status === 'loading') {
    return (
      <TableCard>
        <CenteredState>
          <Spinner />
          <Text muted>Carregando produtores...</Text>
        </CenteredState>
      </TableCard>
    );
  }

  if (status === 'failed') {
    return (
      <TableCard>
        <CenteredState>
          <Text>⚠ Não foi possível carregar os produtores.</Text>
          <SecondaryButton type="button" onClick={onRetry}>
            Tentar novamente
          </SecondaryButton>
        </CenteredState>
      </TableCard>
    );
  }

  if (status === 'succeeded' && rows.length === 0) {
    return (
      <TableCard>
        <CenteredState>
          <Text muted>Nenhum produtor cadastrado ainda.</Text>
          <Button onClick={onNovoProdutor}>+ Novo produtor</Button>
        </CenteredState>
      </TableCard>
    );
  }

  return (
    <TableCard>
      <Table>
        <thead>
          <tr>
            <Th>Nome</Th>
            <Th>CPF/CNPJ</Th>
            <Th>Fazendas</Th>
            <Th>Área total</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <Td>{row.name}</Td>
              <Td>{row.document}</Td>
              <Td>{row.farmsCount}</Td>
              <Td>{numberFormatter.format(row.totalAreaHectares)} ha</Td>
              <ActionsTd>
                <LinkButton type="button" onClick={() => onEdit(row.id)}>
                  Editar
                </LinkButton>
                <LinkButton type="button" className="danger" onClick={() => onDelete(row.id)}>
                  Excluir
                </LinkButton>
              </ActionsTd>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableCard>
  );
}
