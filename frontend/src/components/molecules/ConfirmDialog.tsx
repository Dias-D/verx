import styled from 'styled-components';
import { DangerButton, SecondaryButton } from '../atoms/Button';
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
  max-width: 380px;
  padding: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`;

const WarnIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.dangerBg};
  color: ${({ theme }) => theme.colors.danger};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  font-size: ${({ theme }) => theme.fontSizes.lg};
`;

const Actions = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Molécula: compõe átomos (Heading, Text, Button) para o propósito único de
 * pedir confirmação antes de uma ação destrutiva — genérica, não sabe que é
 * um produtor sendo excluído (quem chama decide título/mensagem/rótulos).
 * Espelha `.panel.confirm` do wireframe congelado.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Overlay onClick={(event) => event.target === event.currentTarget && onCancel()}>
      <Panel role="dialog" aria-modal="true">
        <WarnIcon aria-hidden="true">!</WarnIcon>
        <Heading level={2}>{title}</Heading>
        <Text size="sm" muted>
          {message}
        </Text>
        <Actions>
          <SecondaryButton type="button" onClick={onCancel}>
            {cancelLabel}
          </SecondaryButton>
          <DangerButton type="button" onClick={onConfirm}>
            {confirmLabel}
          </DangerButton>
        </Actions>
      </Panel>
    </Overlay>
  );
}
