import { configureStore } from '@reduxjs/toolkit';
import produtoresReducer, {
  fetchFarms,
  fetchProdutores,
  loadProdutorForEdit,
  removeProdutor,
  resetEditing,
  resetWriteStatus,
  saveProdutor,
  type ProdutoresState,
} from './produtoresSlice';
import { createFarm, listFarms, updateFarm } from '../api/farms';
import { createProdutor, deleteProdutor, getProdutorById, listProdutores, updateProdutor } from '../api/produtores';
import { produtorFixture, produtoresPaginatedFixture } from '../mocks/produtores';
import { farmFixture, farmsPaginatedFixture, farmsListFixture } from '../mocks/farms';
import { ApiError } from '../api/client';

jest.mock('../api/produtores');
jest.mock('../api/farms');

const mockedListProdutores = listProdutores as jest.MockedFunction<typeof listProdutores>;
const mockedGetProdutorById = getProdutorById as jest.MockedFunction<typeof getProdutorById>;
const mockedCreateProdutor = createProdutor as jest.MockedFunction<typeof createProdutor>;
const mockedUpdateProdutor = updateProdutor as jest.MockedFunction<typeof updateProdutor>;
const mockedDeleteProdutor = deleteProdutor as jest.MockedFunction<typeof deleteProdutor>;
const mockedListFarms = listFarms as jest.MockedFunction<typeof listFarms>;
const mockedCreateFarm = createFarm as jest.MockedFunction<typeof createFarm>;
const mockedUpdateFarm = updateFarm as jest.MockedFunction<typeof updateFarm>;

function buildStore(preloadedState?: { produtores: ProdutoresState }) {
  return configureStore({ reducer: { produtores: produtoresReducer }, preloadedState });
}

const initialState: ProdutoresState = {
  items: [],
  status: 'idle',
  error: null,
  farms: [],
  farmsStatus: 'idle',
  farmsError: null,
  editing: null,
  editingStatus: 'idle',
  editingError: null,
  writeStatus: 'idle',
  writeError: null,
  deleteStatus: 'idle',
  deleteError: null,
};

describe('produtoresSlice (reducer)', () => {
  it('estado inicial', () => {
    expect(produtoresReducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('resetWriteStatus volta writeStatus/writeError para o estado inicial', () => {
    const previous: ProdutoresState = {
      ...initialState,
      writeStatus: 'failed',
      writeError: 'algum erro',
    };
    const result = produtoresReducer(previous, resetWriteStatus());
    expect(result.writeStatus).toBe('idle');
    expect(result.writeError).toBeNull();
  });

  it('resetEditing limpa o produtor/fazendas carregados para edição', () => {
    const previous: ProdutoresState = {
      ...initialState,
      editing: { produtor: produtorFixture, farms: [farmFixture] },
      editingStatus: 'succeeded',
    };
    const result = produtoresReducer(previous, resetEditing());
    expect(result.editing).toBeNull();
    expect(result.editingStatus).toBe('idle');
  });
});

describe('fetchProdutores (thunk)', () => {
  afterEach(() => jest.resetAllMocks());

  // Caso 1: listagem com dados mockados.
  it('busca produtores via listProdutores (api/) e grava a lista', async () => {
    mockedListProdutores.mockResolvedValue(produtoresPaginatedFixture);

    const store = buildStore();
    await store.dispatch(fetchProdutores());

    expect(mockedListProdutores).toHaveBeenCalledWith({ limit: 100 });
    expect(store.getState().produtores.status).toBe('succeeded');
    expect(store.getState().produtores.items).toEqual(produtoresPaginatedFixture.data);
  });

  it('em falha, marca status failed com a mensagem do erro', async () => {
    mockedListProdutores.mockRejectedValue(new Error('Falha ao carregar'));

    const store = buildStore();
    await store.dispatch(fetchProdutores());

    expect(store.getState().produtores.status).toBe('failed');
    expect(store.getState().produtores.error).toBe('Falha ao carregar');
  });
});

describe('fetchFarms (thunk)', () => {
  afterEach(() => jest.resetAllMocks());

  it('busca fazendas via listFarms (api/) e grava a lista', async () => {
    mockedListFarms.mockResolvedValue(farmsPaginatedFixture);

    const store = buildStore();
    await store.dispatch(fetchFarms());

    expect(mockedListFarms).toHaveBeenCalledWith({ limit: 100 });
    expect(store.getState().produtores.farmsStatus).toBe('succeeded');
    expect(store.getState().produtores.farms).toEqual(farmsListFixture);
  });
});

describe('loadProdutorForEdit (thunk)', () => {
  afterEach(() => jest.resetAllMocks());

  // Caso: edição carregando os dados existentes.
  it('busca o produtor por id e suas fazendas, gravando em editing', async () => {
    mockedGetProdutorById.mockResolvedValue(produtorFixture);
    mockedListFarms.mockResolvedValue({
      data: [farmFixture],
      meta: { total: 1, page: 1, limit: 100 },
    });

    const store = buildStore();
    await store.dispatch(loadProdutorForEdit(produtorFixture.id));

    expect(mockedGetProdutorById).toHaveBeenCalledWith(produtorFixture.id);
    expect(mockedListFarms).toHaveBeenCalledWith({ producerId: produtorFixture.id, limit: 100 });
    expect(store.getState().produtores.editingStatus).toBe('succeeded');
    expect(store.getState().produtores.editing).toEqual({
      produtor: produtorFixture,
      farms: [farmFixture],
    });
  });
});

describe('saveProdutor (thunk)', () => {
  afterEach(() => jest.resetAllMocks());

  // Caso: envio bem-sucedido chamando a função correta (criação).
  it('criação sem id: chama createProdutor e, para cada fazenda sem id, createFarm com o producerId resultante', async () => {
    mockedCreateProdutor.mockResolvedValue(produtorFixture);
    mockedCreateFarm.mockResolvedValue(farmFixture);

    const store = buildStore();
    await store.dispatch(
      saveProdutor({
        name: produtorFixture.name,
        document: produtorFixture.document,
        farms: [
          {
            name: 'Fazenda Santa Rita',
            city: 'Sorriso',
            state: 'MT',
            totalAreaHectares: 1240,
            arableAreaHectares: 800,
            vegetationAreaHectares: 440,
          },
        ],
      }),
    );

    expect(mockedCreateProdutor).toHaveBeenCalledWith({
      name: produtorFixture.name,
      document: produtorFixture.document,
    });
    expect(mockedCreateFarm).toHaveBeenCalledWith({
      name: 'Fazenda Santa Rita',
      city: 'Sorriso',
      state: 'MT',
      totalAreaHectares: 1240,
      arableAreaHectares: 800,
      vegetationAreaHectares: 440,
      producerId: produtorFixture.id,
    });
    expect(mockedUpdateFarm).not.toHaveBeenCalled();

    const state = store.getState().produtores;
    expect(state.writeStatus).toBe('succeeded');
    expect(state.items).toEqual([produtorFixture]);
    expect(state.farms).toEqual([farmFixture]);
  });

  it('edição com id: chama updateProdutor e, para fazendas com id, updateFarm (não createFarm)', async () => {
    mockedUpdateProdutor.mockResolvedValue(produtorFixture);
    mockedUpdateFarm.mockResolvedValue(farmFixture);

    const store = buildStore();
    await store.dispatch(
      saveProdutor({
        id: produtorFixture.id,
        name: produtorFixture.name,
        document: produtorFixture.document,
        farms: [
          {
            id: farmFixture.id,
            name: farmFixture.name,
            city: farmFixture.city,
            state: farmFixture.state,
            totalAreaHectares: farmFixture.totalAreaHectares,
            arableAreaHectares: farmFixture.arableAreaHectares,
            vegetationAreaHectares: farmFixture.vegetationAreaHectares,
          },
        ],
      }),
    );

    expect(mockedUpdateProdutor).toHaveBeenCalledWith(produtorFixture.id, {
      name: produtorFixture.name,
      document: produtorFixture.document,
    });
    expect(mockedUpdateFarm).toHaveBeenCalledWith(farmFixture.id, {
      name: farmFixture.name,
      city: farmFixture.city,
      state: farmFixture.state,
      totalAreaHectares: farmFixture.totalAreaHectares,
      arableAreaHectares: farmFixture.arableAreaHectares,
      vegetationAreaHectares: farmFixture.vegetationAreaHectares,
    });
    expect(mockedCreateFarm).not.toHaveBeenCalled();
  });

  // Caso: erro da API exibido.
  it('em falha da API, marca writeStatus failed com a mensagem do backend', async () => {
    mockedCreateProdutor.mockRejectedValue(
      new ApiError(409, 'Já existe um produtor com este document.'),
    );

    const store = buildStore();
    await store.dispatch(
      saveProdutor({ name: 'Duplicado', document: '29537995593', farms: [] }),
    );

    const state = store.getState().produtores;
    expect(state.writeStatus).toBe('failed');
    expect(state.writeError).toBe('Já existe um produtor com este document.');
  });
});

describe('removeProdutor (thunk)', () => {
  afterEach(() => jest.resetAllMocks());

  // Caso: exclusão (o pedido de confirmação é responsabilidade da página/UI,
  // este thunk só executa a exclusão já confirmada).
  it('chama deleteProdutor e remove o produtor e suas fazendas do estado', async () => {
    mockedDeleteProdutor.mockResolvedValue(undefined);

    const store = buildStore({
      produtores: { ...initialState, items: [produtorFixture], farms: [farmFixture] },
    });

    await store.dispatch(removeProdutor(produtorFixture.id));

    expect(mockedDeleteProdutor).toHaveBeenCalledWith(produtorFixture.id);
    const state = store.getState().produtores;
    expect(state.deleteStatus).toBe('succeeded');
    expect(state.items).toEqual([]);
    expect(state.farms).toEqual([]);
  });
});
