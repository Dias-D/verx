import type { FormEvent, ReactNode } from 'react';
import styled from 'styled-components';
import { Button, SecondaryButton } from '../atoms/Button';
import { FormField } from '../atoms/FormField';
import { Input } from '../atoms/Input';
import { Heading } from '../atoms/Heading';
import { Text } from '../atoms/Text';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(20, 30, 24, 0.35);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 16px;
  overflow-y: auto;
`;

const Panel = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
  width: 100%;
  max-width: 640px;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const Subtitle = styled(Text)`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const FormError = styled.div`
  background: ${({ theme }) => theme.colors.dangerBg};
  color: ${({ theme }) => theme.colors.danger};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 10px 14px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export interface ProdutorFormProps {
  title: string;
  subtitle?: string;
  name: string;
  document: string;
  nameError?: string | null;
  documentError?: string | null;
  formError?: string | null;
  submitting?: boolean;
  onNameChange: (value: string) => void;
  onDocumentChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  children?: ReactNode;
}

/**
 * Molécula: compõe átomos (Heading, Text, FormField, Input, Button) para o
 * propósito único de "editar nome + documento de um produtor e deixar a
 * página injetar o que mais precisar" — não importa `PropriedadesFieldset`
 * (organismo): recebe esse bloco pronto via `children`, a mesma ideia de
 * "template recebe regiões por props/children" aplicada aqui para não violar
 * a regra "dependência só desce um nível" (ver
 * frontend-teste-brain-ag.md#2). Espelha `.panel`/`.panel-actions` do
 * wireframe congelado.
 */
export function ProdutorForm({
  title,
  subtitle,
  name,
  document,
  nameError,
  documentError,
  formError,
  submitting,
  onNameChange,
  onDocumentChange,
  onSubmit,
  onCancel,
  children,
}: ProdutorFormProps) {
  return (
    <Overlay>
      <Panel role="dialog" aria-modal="true">
        <Heading level={2}>{title}</Heading>
        {subtitle ? (
          <Subtitle size="sm" muted>
            {subtitle}
          </Subtitle>
        ) : null}

        {formError ? <FormError role="alert">{formError}</FormError> : null}

        <form onSubmit={onSubmit}>
          <FormField label="Nome do produtor" htmlFor="produtor-name" error={nameError ?? undefined}>
            <Input
              id="produtor-name"
              placeholder="Ex.: José Aparecido Silva"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
            />
          </FormField>
          <FormField
            label="CPF ou CNPJ"
            htmlFor="produtor-document"
            error={documentError ?? undefined}
          >
            <Input
              id="produtor-document"
              placeholder="000.000.000-00"
              value={document}
              invalid={!!documentError}
              onChange={(event) => onDocumentChange(event.target.value)}
            />
          </FormField>

          {children}

          <Actions>
            <SecondaryButton type="button" onClick={onCancel}>
              Cancelar
            </SecondaryButton>
            <Button type="submit" disabled={submitting}>
              Salvar
            </Button>
          </Actions>
        </form>
      </Panel>
    </Overlay>
  );
}
