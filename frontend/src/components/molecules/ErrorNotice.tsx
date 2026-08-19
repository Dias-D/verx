import styled from 'styled-components';

const Notice = styled.div`
  background: #fdf3e7;
  border: 1px solid #e8c188;
  color: #6b4a1d;
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 10px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

/**
 * Molécula: aviso de erro discreto, genérico — não sabe que é o dashboard
 * quem falhou, só exibe a mensagem recebida. Espelha `.error-notice` do
 * wireframe (visível só no estado "erro" do refetch, dados anteriores
 * continuam na tela por trás/abaixo dele).
 */
export interface ErrorNoticeProps {
  message: string;
}

export function ErrorNotice({ message }: ErrorNoticeProps) {
  return <Notice role="alert">⚠ {message}</Notice>;
}
