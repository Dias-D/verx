import type { SelectHTMLAttributes } from 'react';
import styled from 'styled-components';

/**
 * Átomo puro: não importa nenhum outro componente e não conhece o domínio —
 * recebe as opções prontas por props, nunca sabe se são UFs ou outra coisa.
 * Estilo espelha `.field select` do wireframe congelado.
 */
const StyledSelect = styled.select<{ $invalid?: boolean }>`
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

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[];
  invalid?: boolean;
}

export function Select({ options, invalid, ...rest }: SelectProps) {
  return (
    <StyledSelect $invalid={invalid} {...rest}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </StyledSelect>
  );
}
