import type { ReactNode } from 'react';
import styled from 'styled-components';

const Field = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-bottom: 5px;
  color: ${({ theme }) => theme.colors.text};
`;

const FieldError = styled.div`
  color: ${({ theme }) => theme.colors.danger};
  font-size: 12px;
  margin-top: 4px;
`;

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}

/**
 * Átomo puro: não conhece o domínio, só sabe compor label + campo + erro
 * inline — espelha `.field`/`.field-error` do wireframe congelado. O campo
 * em si (Input/Select) chega como `children`, controlado por quem usa.
 */
export function FormField({ label, htmlFor, error, children }: FormFieldProps) {
  return (
    <Field>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <FieldError role="alert">{error}</FieldError> : null}
    </Field>
  );
}
