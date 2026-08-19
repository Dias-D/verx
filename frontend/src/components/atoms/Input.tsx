import type { InputHTMLAttributes } from 'react';
import styled from 'styled-components';

/**
 * Átomo puro: não importa nenhum outro componente e não conhece o domínio.
 * Estilo espelha `.field input` do wireframe congelado
 * (resources/templates/wireframes/crud-produtor.html).
 */
const StyledInput = styled.input<{ $invalid?: boolean }>`
  width: 100%;
  padding: 8px 10px;
  border: 1px solid
    ${({ theme, $invalid }) => ($invalid ? theme.colors.danger : theme.colors.border)};
  background: ${({ theme, $invalid }) => ($invalid ? theme.colors.dangerBg : theme.colors.surface)};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-family: inherit;
  box-sizing: border-box;
`;

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid, ...rest }: InputProps) {
  return <StyledInput $invalid={invalid} {...rest} />;
}
