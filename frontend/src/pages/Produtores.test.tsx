import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import { MemoryRouter } from 'react-router-dom';
import { theme } from '../theme';
import produtoresReducer from '../store/produtoresSlice';
import { listProdutores, createProdutor, getProdutorById, updateProdutor, deleteProdutor } from '../api/produtores';
import { listFarms, createFarm, updateFarm } from '../api/farms';
import { ApiError } from '../api/client';
import {
  produtorFixture,
  produtoresPaginatedFixture,
  emptyProdutoresPaginatedFixture,
} from '../mocks/produtores';
import { farmFixture, farmsPaginatedFixture } from '../mocks/farms';
import { Produtores } from './Produtores';

jest.mock('../api/produtores');
jest.mock('../api/farms');

const mockedListProdutores = listProdutores as jest.MockedFunction<typeof listProdutores>;
const mockedCreateProdutor = createProdutor as jest.MockedFunction<typeof createProdutor>;
const mockedGetProdutorById = getProdutorById as jest.MockedFunction<typeof getProdutorById>;
const mockedUpdateProdutor = updateProdutor as jest.MockedFunction<typeof updateProdutor>;
const mockedDeleteProdutor = deleteProdutor as jest.MockedFunction<typeof deleteProdutor>;
const mockedListFarms = listFarms as jest.MockedFunction<typeof listFarms>;
const mockedCreateFarm = createFarm as jest.MockedFunction<typeof createFarm>;
const mockedUpdateFarm = updateFarm as jest.MockedFunction<typeof updateFarm>;

function renderProdutores() {
  const store = configureStore({ reducer: { produtores: produtoresReducer } });
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <Produtores />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>,
  );
}

describe('Produtores (página)', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('mostra um indicador de carregamento enquanto a listagem inicial está pendente', () => {
    mockedListProdutores.mockReturnValue(new Promise(() => {}));
    mockedListFarms.mockReturnValue(new Promise(() => {}));

    renderProdutores();

    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument();
  });

  // Caso 1: listagem com dados mockados.
  it('renderiza a listagem com produtores mockados, incluindo fazendas/área calculadas', async () => {
    mockedListProdutores.mockResolvedValue(produtoresPaginatedFixture);
    mockedListFarms.mockResolvedValue(farmsPaginatedFixture);

    renderProdutores();

    expect(await screen.findByText('José Aparecido Silva')).toBeInTheDocument();
    expect(screen.getByText('295.379.955-93')).toBeInTheDocument();
    // farmFixture (producerId: p1, totalAreaHectares: 1240) é a única fazenda de p1
    const row = screen.getByText('José Aparecido Silva').closest('tr');
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText('1')).toBeInTheDocument();
    expect(within(row as HTMLElement).getByText('1.240 ha')).toBeInTheDocument();
  });

  // Caso 2: estado vazio.
  it('estado vazio: mostra a mensagem e permite abrir o formulário de novo produtor', async () => {
    mockedListProdutores.mockResolvedValue(emptyProdutoresPaginatedFixture);
    mockedListFarms.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 100 } });

    renderProdutores();

    expect(await screen.findByText('Nenhum produtor cadastrado ainda.')).toBeInTheDocument();
  });

  it('estado de erro: mostra aviso e "Tentar novamente" refaz a busca', async () => {
    mockedListProdutores.mockRejectedValueOnce(new Error('Falha de rede'));
    mockedListFarms.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 100 } });

    renderProdutores();

    expect(await screen.findByText(/Não foi possível carregar os produtores/)).toBeInTheDocument();

    mockedListProdutores.mockResolvedValueOnce(produtoresPaginatedFixture);
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText('José Aparecido Silva')).toBeInTheDocument();
  });

  // Caso: validação de CPF/CNPJ bloqueando o envio.
  it('bloqueia o envio quando o documento é inválido, sem chamar a API', async () => {
    mockedListProdutores.mockResolvedValue(emptyProdutoresPaginatedFixture);
    mockedListFarms.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 100 } });

    renderProdutores();
    await screen.findByText('Nenhum produtor cadastrado ainda.');

    fireEvent.click(screen.getAllByRole('button', { name: '+ Novo produtor' })[0]);
    fireEvent.change(screen.getByLabelText('Nome do produtor'), {
      target: { value: 'Produtor Teste' },
    });
    fireEvent.change(screen.getByLabelText('CPF ou CNPJ'), {
      target: { value: '123.456.789-99' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(
      await screen.findByText('document deve ser um CPF ou CNPJ válido'),
    ).toBeInTheDocument();
    expect(mockedCreateProdutor).not.toHaveBeenCalled();
  });

  // Caso obrigatório: validação de área bloqueando o envio.
  it('bloqueia o envio quando a soma de área de uma fazenda ultrapassa a área total, sem chamar a API', async () => {
    mockedListProdutores.mockResolvedValue(emptyProdutoresPaginatedFixture);
    mockedListFarms.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 100 } });

    renderProdutores();
    await screen.findByText('Nenhum produtor cadastrado ainda.');

    fireEvent.click(screen.getAllByRole('button', { name: '+ Novo produtor' })[0]);
    fireEvent.change(screen.getByLabelText('Nome do produtor'), {
      target: { value: 'José Aparecido Silva' },
    });
    fireEvent.change(screen.getByLabelText('CPF ou CNPJ'), {
      target: { value: '295.379.955-93' },
    });
    fireEvent.change(screen.getByLabelText('Nome da fazenda'), {
      target: { value: 'Fazenda Santa Rita' },
    });
    fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'Sorriso' } });
    fireEvent.change(screen.getByLabelText('Área total (ha)'), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText('Área agricultável (ha)'), {
      target: { value: '700' },
    });
    fireEvent.change(screen.getByLabelText('Área de vegetação (ha)'), {
      target: { value: '500' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(
      await screen.findByText(
        'A soma das áreas agricultável e de vegetação (1.200 ha) não pode ultrapassar a área total (1.000 ha).',
      ),
    ).toBeInTheDocument();
    expect(mockedCreateProdutor).not.toHaveBeenCalled();
  });

  // Caso obrigatório: envio bem-sucedido chamando a função correta.
  it('envio bem-sucedido: chama createProdutor com o payload correto e volta à listagem', async () => {
    mockedListProdutores.mockResolvedValue(emptyProdutoresPaginatedFixture);
    mockedListFarms.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 100 } });
    mockedCreateProdutor.mockResolvedValue(produtorFixture);

    renderProdutores();
    await screen.findByText('Nenhum produtor cadastrado ainda.');

    fireEvent.click(screen.getAllByRole('button', { name: '+ Novo produtor' })[0]);
    fireEvent.change(screen.getByLabelText('Nome do produtor'), {
      target: { value: produtorFixture.name },
    });
    fireEvent.change(screen.getByLabelText('CPF ou CNPJ'), {
      target: { value: '295.379.955-93' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(mockedCreateProdutor).toHaveBeenCalledWith({
        name: produtorFixture.name,
        document: '295.379.955-93',
      }),
    );
    expect(mockedCreateFarm).not.toHaveBeenCalled();

    // sucesso: volta para a listagem (overlay fecha) e o produtor criado aparece
    await waitFor(() => expect(screen.queryByLabelText('Nome do produtor')).not.toBeInTheDocument());
    expect(await screen.findByText(produtorFixture.name)).toBeInTheDocument();
  });

  // Caso obrigatório: erro da API exibido no formulário.
  it('erro da API (ex.: document duplicado) é exibido no formulário, sem fechar o overlay', async () => {
    mockedListProdutores.mockResolvedValue(emptyProdutoresPaginatedFixture);
    mockedListFarms.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 100 } });
    mockedCreateProdutor.mockRejectedValue(
      new ApiError(409, 'Já existe um produtor com este document.'),
    );

    renderProdutores();
    await screen.findByText('Nenhum produtor cadastrado ainda.');

    fireEvent.click(screen.getAllByRole('button', { name: '+ Novo produtor' })[0]);
    fireEvent.change(screen.getByLabelText('Nome do produtor'), {
      target: { value: produtorFixture.name },
    });
    fireEvent.change(screen.getByLabelText('CPF ou CNPJ'), {
      target: { value: '295.379.955-93' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(
      await screen.findByText('Já existe um produtor com este document.'),
    ).toBeInTheDocument();
    // overlay continua aberto
    expect(screen.getByLabelText('Nome do produtor')).toBeInTheDocument();
  });

  // Caso: edição carregando os dados existentes.
  it('editar: carrega os dados existentes do produtor e preenche o formulário', async () => {
    mockedListProdutores.mockResolvedValue(produtoresPaginatedFixture);
    mockedListFarms.mockResolvedValue(farmsPaginatedFixture);
    mockedGetProdutorById.mockResolvedValue(produtorFixture);
    mockedListFarms.mockResolvedValueOnce(farmsPaginatedFixture);
    mockedListFarms.mockResolvedValueOnce({
      data: [farmFixture],
      meta: { total: 1, page: 1, limit: 100 },
    });

    renderProdutores();
    await screen.findByText('José Aparecido Silva');

    fireEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0]);

    await waitFor(() => expect(mockedGetProdutorById).toHaveBeenCalledWith(produtorFixture.id));

    const nameInput = (await screen.findByLabelText('Nome do produtor')) as HTMLInputElement;
    await waitFor(() => expect(nameInput.value).toBe(produtorFixture.name));
    const farmNameInput = screen.getByLabelText('Nome da fazenda') as HTMLInputElement;
    expect(farmNameInput.value).toBe(farmFixture.name);
  });

  it('editar: envio bem-sucedido chama updateProdutor com o id correto', async () => {
    mockedListProdutores.mockResolvedValue(produtoresPaginatedFixture);
    mockedListFarms.mockResolvedValue(farmsPaginatedFixture);
    mockedGetProdutorById.mockResolvedValue(produtorFixture);
    mockedListFarms.mockResolvedValueOnce(farmsPaginatedFixture);
    mockedListFarms.mockResolvedValueOnce({
      data: [farmFixture],
      meta: { total: 1, page: 1, limit: 100 },
    });
    mockedUpdateProdutor.mockResolvedValue(produtorFixture);
    mockedUpdateFarm.mockResolvedValue(farmFixture);

    renderProdutores();
    await screen.findByText('José Aparecido Silva');

    fireEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0]);
    const nameInput = (await screen.findByLabelText('Nome do produtor')) as HTMLInputElement;
    await waitFor(() => expect(nameInput.value).toBe(produtorFixture.name));

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(mockedUpdateProdutor).toHaveBeenCalledWith(produtorFixture.id, {
        name: produtorFixture.name,
        document: produtorFixture.document,
      }),
    );
  });

  // Caso obrigatório: exclusão pedindo confirmação.
  it('exclusão pede confirmação antes de chamar a API', async () => {
    mockedListProdutores.mockResolvedValue(produtoresPaginatedFixture);
    mockedListFarms.mockResolvedValue(farmsPaginatedFixture);

    renderProdutores();
    await screen.findByText('José Aparecido Silva');

    fireEvent.click(screen.getAllByRole('button', { name: 'Excluir' })[0]);

    expect(screen.getByRole('heading', { name: 'Excluir produtor?' })).toBeInTheDocument();
    expect(mockedDeleteProdutor).not.toHaveBeenCalled();

    // cancelar não exclui
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(mockedDeleteProdutor).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: 'Excluir produtor?' })).not.toBeInTheDocument();

    // reabre e confirma
    fireEvent.click(screen.getAllByRole('button', { name: 'Excluir' })[0]);
    mockedDeleteProdutor.mockResolvedValue(undefined);
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir' }));

    await waitFor(() => expect(mockedDeleteProdutor).toHaveBeenCalledWith(produtorFixture.id));
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Excluir produtor?' })).not.toBeInTheDocument(),
    );
  });
});
