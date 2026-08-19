import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const StyledSpinner = styled.span`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
`;

/**
 * Átomo puro: indicador visual de carregamento, sem conhecimento de
 * domínio. `role="status"` + `aria-label` deixam o estado anunciável para
 * leitores de tela e queryable via RTL (`getByRole('status')`).
 */
export function Spinner() {
  return <StyledSpinner role="status" aria-label="Carregando" />;
}
