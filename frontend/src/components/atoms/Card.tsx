import type { ReactNode } from 'react';
import styled from 'styled-components';

/**
 * Átomo puro: contêiner visual genérico, reaproveitado por `.stat-card` e
 * `.chart-card` do wireframe (mesmo padrão visual — borda, raio, fundo).
 */
const StyledCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing.lg};
`;

export interface CardProps {
  children: ReactNode;
}

export function Card({ children }: CardProps) {
  return <StyledCard>{children}</StyledCard>;
}
