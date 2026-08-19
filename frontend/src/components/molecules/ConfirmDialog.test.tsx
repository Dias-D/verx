import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../theme';
import { ConfirmDialog } from './ConfirmDialog';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('ConfirmDialog (molécula)', () => {
  it('renderiza título e mensagem recebidos, genérico (não sabe o domínio)', () => {
    renderWithTheme(
      <ConfirmDialog
        title="Excluir produtor?"
        message='"José Aparecido Silva" e suas fazendas serão removidos. Esta ação não pode ser desfeita.'
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Excluir produtor?' })).toBeInTheDocument();
    expect(screen.getByText(/José Aparecido Silva/)).toBeInTheDocument();
  });

  it('dispara onConfirm ao clicar em confirmar e onCancel ao clicar em cancelar', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    renderWithTheme(
      <ConfirmDialog
        title="Excluir produtor?"
        message="mensagem"
        confirmLabel="Excluir"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
