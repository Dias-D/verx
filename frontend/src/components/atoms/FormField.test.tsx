import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../theme';
import { FormField } from './FormField';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('FormField (átomo)', () => {
  it('renderiza o label associado ao filho e nenhum erro quando não há error', () => {
    renderWithTheme(
      <FormField label="Nome do produtor" htmlFor="nome">
        <input id="nome" />
      </FormField>,
    );

    expect(screen.getByText('Nome do produtor')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renderiza a mensagem de erro quando error é passado', () => {
    renderWithTheme(
      <FormField label="CPF ou CNPJ" htmlFor="doc" error="document deve ser um CPF ou CNPJ válido">
        <input id="doc" />
      </FormField>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'document deve ser um CPF ou CNPJ válido',
    );
  });
});
