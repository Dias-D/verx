import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styled from 'styled-components';

/**
 * Átomo puro: não importa nenhum outro componente, não conhece o domínio.
 * Estilo espelha `button.btn-primary` do wireframe congelado
 * (resources/templates/wireframes/dashboard.html).
 */
const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.primaryText};
  border: none;
  padding: 9px 16px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #24573f;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  children: ReactNode;
  type?: 'button' | 'submit';
}

export function Button({ children, type = 'button', ...rest }: ButtonProps) {
  return (
    <StyledButton type={type} {...rest}>
      {children}
    </StyledButton>
  );
}

/**
 * Variante de Button — espelha `button.btn-secondary` do wireframe congelado
 * (fundo branco, borda neutra). Mesmo átomo, sem novo componente/nível: só
 * estilo diferente para a ação "Cancelar" que os fluxos de F2 introduzem
 * (ConfirmDialog, ProdutorForm).
 */
export const SecondaryButton = styled(StyledButton)`
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.background};
  }
`;

/**
 * Variante de Button — espelha `button.btn-danger` do wireframe congelado,
 * usada pela ação destrutiva de exclusão (ConfirmDialog).
 */
export const DangerButton = styled(StyledButton)`
  background: ${({ theme }) => theme.colors.danger};

  &:hover:not(:disabled) {
    opacity: 0.9;
  }
`;
