import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../theme';
import { ProdutoresTable } from './ProdutoresTable';
import type { ProdutorRow } from '../../utils/produtorRows';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const rows: ProdutorRow[] = [
  {
    id: 'p1',
    name: 'José Aparecido Silva',
    document: '295.379.955-93',
    farmsCount: 2,
    totalAreaHectares: 1240,
  },
];

describe('ProdutoresTable (organismo)', () => {
  // Caso 1: listagem com dados mockados.
  it('estado "com dados": renderiza uma linha por produtor com nome, documento, fazendas e área', () => {
    renderWithTheme(
      <ProdutoresTable
        status="succeeded"
        rows={rows}
        onEdit={() => {}}
        onDelete={() => {}}
        onRetry={() => {}}
        onNovoProdutor={() => {}}
      />,
    );

    expect(screen.getByText('José Aparecido Silva')).toBeInTheDocument();
    expect(screen.getByText('295.379.955-93')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1.240 ha')).toBeInTheDocument();
  });

  it('estado "carregando": mostra indicador de carregamento, sem linhas de dado', () => {
    renderWithTheme(
      <ProdutoresTable
        status="loading"
        rows={[]}
        onEdit={() => {}}
        onDelete={() => {}}
        onRetry={() => {}}
        onNovoProdutor={() => {}}
      />,
    );

    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument();
    expect(screen.queryByText('José Aparecido Silva')).not.toBeInTheDocument();
  });

  // Caso 2: estado vazio.
  it('estado "vazio": succeeded sem linhas mostra a mensagem e o botão de novo produtor', () => {
    const onNovoProdutor = jest.fn();
    renderWithTheme(
      <ProdutoresTable
        status="succeeded"
        rows={[]}
        onEdit={() => {}}
        onDelete={() => {}}
        onRetry={() => {}}
        onNovoProdutor={onNovoProdutor}
      />,
    );

    expect(screen.getByText('Nenhum produtor cadastrado ainda.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '+ Novo produtor' }));
    expect(onNovoProdutor).toHaveBeenCalledTimes(1);
  });

  // Caso: erro.
  it('estado "erro": mostra aviso e botão de tentar novamente', () => {
    const onRetry = jest.fn();
    renderWithTheme(
      <ProdutoresTable
        status="failed"
        rows={[]}
        onEdit={() => {}}
        onDelete={() => {}}
        onRetry={onRetry}
        onNovoProdutor={() => {}}
      />,
    );

    expect(screen.getByText(/Não foi possível carregar os produtores/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('dispara onEdit/onDelete com o id da linha ao clicar em Editar/Excluir', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    renderWithTheme(
      <ProdutoresTable
        status="succeeded"
        rows={rows}
        onEdit={onEdit}
        onDelete={onDelete}
        onRetry={() => {}}
        onNovoProdutor={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(onEdit).toHaveBeenCalledWith('p1');

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(onDelete).toHaveBeenCalledWith('p1');
  });
});
