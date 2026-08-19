import type { ReactNode } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';

type HeadingLevel = 1 | 2 | 3;

const sizeByLevel: Record<HeadingLevel, keyof typeof theme.fontSizes> = {
  1: 'xl',
  2: 'lg',
  3: 'sm',
};

const StyledHeading = styled.h1<{ $level: HeadingLevel }>`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme, $level }) => theme.fontSizes[sizeByLevel[$level]]};
`;

export interface HeadingProps {
  level?: HeadingLevel;
  children: ReactNode;
}

/**
 * Átomo puro: um único elemento visual, sem conhecimento de domínio. `level`
 * escolhe a tag semântica (h1/h2/h3) — cobre tanto `h1.page-title` quanto
 * `.chart-card h3` do wireframe com o mesmo componente.
 */
export function Heading({ level = 1, children }: HeadingProps) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
  return (
    <StyledHeading as={Tag} $level={level}>
      {children}
    </StyledHeading>
  );
}
