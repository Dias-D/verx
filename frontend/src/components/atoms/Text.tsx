import type { ReactNode } from 'react';
import styled from 'styled-components';

type TextElement = 'p' | 'span' | 'div';
type TextSize = 'sm' | 'md' | 'lg' | 'xl';

const StyledText = styled.p<{ $muted?: boolean; $size: TextSize; $bold?: boolean }>`
  margin: 0;
  font-size: ${({ theme, $size }) => theme.fontSizes[$size]};
  color: ${({ theme, $muted }) => ($muted ? theme.colors.textMuted : theme.colors.text)};
  font-weight: ${({ $bold }) => ($bold ? 700 : 400)};
`;

export interface TextProps {
  children: ReactNode;
  as?: TextElement;
  muted?: boolean;
  bold?: boolean;
  size?: TextSize;
}

/**
 * Átomo puro: texto genérico, sem conhecimento de domínio. Cobre rótulo,
 * valor, legenda e nota auxiliar do wireframe (`.label`, `.value`,
 * `.auto-note`, `.legend`) variando só `size`/`muted`/`bold`/`as`.
 */
export function Text({ children, as = 'p', muted, bold, size = 'md' }: TextProps) {
  return (
    <StyledText as={as} $muted={muted} $bold={bold} $size={size}>
      {children}
    </StyledText>
  );
}
