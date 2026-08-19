import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../theme';
import { ProdutorForm } from './ProdutorForm';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('ProdutorForm (molécula)', () => {
  it('renderiza título, subtítulo, os campos e o children recebido (sem conhecer o domínio de Farm)', () => {
    renderWithTheme(
      <ProdutorForm
        title="Novo produtor"
        subtitle="Cadastre o produtor e, opcionalmente, suas propriedades."
        name=""
        document=""
        onNameChange={() => {}}
        onDocumentChange={() => {}}
        onSubmit={() => {}}
        onCancel={() => {}}
      >
        <div data-testid="farms-slot">conteúdo injetado pela página</div>
      </ProdutorForm>,
    );

    expect(screen.getByRole('heading', { name: 'Novo produtor' })).toBeInTheDocument();
    expect(
      screen.getByText('Cadastre o produtor e, opcionalmente, suas propriedades.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Nome do produtor')).toBeInTheDocument();
    expect(screen.getByLabelText('CPF ou CNPJ')).toBeInTheDocument();
    expect(screen.getByTestId('farms-slot')).toBeInTheDocument();
  });

  it('dispara onNameChange/onDocumentChange ao digitar nos campos', () => {
    const onNameChange = jest.fn();
    const onDocumentChange = jest.fn();
    renderWithTheme(
      <ProdutorForm
        title="Novo produtor"
        name=""
        document=""
        onNameChange={onNameChange}
        onDocumentChange={onDocumentChange}
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );

    fireEvent.change(screen.getByLabelText('Nome do produtor'), {
      target: { value: 'José Aparecido Silva' },
    });
    fireEvent.change(screen.getByLabelText('CPF ou CNPJ'), {
      target: { value: '295.379.955-93' },
    });

    expect(onNameChange).toHaveBeenCalledWith('José Aparecido Silva');
    expect(onDocumentChange).toHaveBeenCalledWith('295.379.955-93');
  });

  it('dispara onSubmit ao clicar em Salvar (submit do form) e onCancel ao clicar em Cancelar', () => {
    const onSubmit = jest.fn((event: React.FormEvent) => event.preventDefault());
    const onCancel = jest.fn();
    renderWithTheme(
      <ProdutorForm
        title="Novo produtor"
        name=""
        document=""
        onNameChange={() => {}}
        onDocumentChange={() => {}}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renderiza o erro inline do campo document quando documentError é passado', () => {
    renderWithTheme(
      <ProdutorForm
        title="Editar produtor"
        name="José Aparecido Silva"
        document="123.456.789-99"
        documentError="CPF inválido."
        onNameChange={() => {}}
        onDocumentChange={() => {}}
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('CPF inválido.');
  });

  it('renderiza o erro de submissão (formError) da API, quando presente', () => {
    renderWithTheme(
      <ProdutorForm
        title="Novo produtor"
        name=""
        document=""
        formError="Já existe um produtor com este document."
        onNameChange={() => {}}
        onDocumentChange={() => {}}
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByText('Já existe um produtor com este document.')).toBeInTheDocument();
  });

  it('desabilita o botão Salvar quando submitting é true', () => {
    renderWithTheme(
      <ProdutorForm
        title="Novo produtor"
        name=""
        document=""
        submitting
        onNameChange={() => {}}
        onDocumentChange={() => {}}
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
  });
});
