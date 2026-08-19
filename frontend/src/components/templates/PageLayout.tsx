import type { ReactNode } from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import { Heading } from '../atoms/Heading';

const Header = styled.header`
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Brand = styled.div`
  font-weight: 700;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: #24573f;
`;

const Nav = styled.nav`
  a {
    margin-left: 20px;
    text-decoration: none;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textMuted};
    padding-bottom: 4px;
  }

  a.active {
    color: #24573f;
    font-weight: 600;
    border-bottom: 2px solid ${({ theme }) => theme.colors.primary};
  }
`;

const Main = styled.main`
  max-width: 1080px;
  margin: 0 auto;
  padding: 28px 24px 60px;
`;

export interface PageLayoutProps {
  title: string;
  children: ReactNode;
}

/**
 * Template: estrutura de página sem dados próprios — recebe o título e o
 * conteúdo por props/children, não conhece a store nem o domínio de onde
 * vêm os dados (regra "só páginas acessam a store"). Cabeçalho e navegação
 * espelham `header.app-header`/`nav.app-nav` do wireframe congelado; usa
 * `react-router-dom` só como mecanismo de navegação (infra), não como
 * conhecimento de domínio.
 */
export function PageLayout({ title, children }: PageLayoutProps) {
  return (
    <>
      <Header>
        <Brand>Brain Agriculture</Brand>
        <Nav>
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/produtores">Produtores</NavLink>
        </Nav>
      </Header>
      <Main>
        <Heading level={1}>{title}</Heading>
        {children}
      </Main>
    </>
  );
}
