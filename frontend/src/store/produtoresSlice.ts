import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  createProdutor,
  deleteProdutor,
  getProdutorById,
  listProdutores,
  updateProdutor,
} from '../api/produtores';
import { createFarm, listFarms, updateFarm } from '../api/farms';
import type { Produtor } from '../types/produtor';
import type { BrazilianState, Farm } from '../types/farm';

export type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface SaveFarmArg {
  id?: string;
  name: string;
  city: string;
  state: BrazilianState;
  totalAreaHectares: number;
  arableAreaHectares: number;
  vegetationAreaHectares: number;
}

export interface SaveProdutorArgs {
  id?: string;
  name: string;
  document: string;
  farms: SaveFarmArg[];
}

export interface ProdutoresState {
  items: Produtor[];
  status: AsyncStatus;
  error: string | null;

  farms: Farm[];
  farmsStatus: AsyncStatus;
  farmsError: string | null;

  editing: { produtor: Produtor; farms: Farm[] } | null;
  editingStatus: AsyncStatus;
  editingError: string | null;

  writeStatus: AsyncStatus;
  writeError: string | null;

  deleteStatus: AsyncStatus;
  deleteError: string | null;
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

/**
 * Teto de paginação do backend (100 itens/página, ver
 * common/dto/pagination-query.dto.ts) — usado tanto para a listagem de
 * produtores quanto de fazendas. O backend não expõe um agregado
 * "fazendas por produtor"; buscar as duas listas com esse teto e cruzar no
 * frontend (ver utils/produtorRows.ts) é a decisão de escopo documentada em
 * verx/README.md, suficiente para o volume de dado deste teste técnico.
 */
const LIST_LIMIT = 100;

export const fetchProdutores = createAsyncThunk('produtores/fetchAll', async () => {
  const response = await listProdutores({ limit: LIST_LIMIT });
  return response.data;
});

export const fetchFarms = createAsyncThunk('produtores/fetchFarms', async () => {
  const response = await listFarms({ limit: LIST_LIMIT });
  return response.data;
});

/**
 * "Edição carregando os dados existentes" (ver etapa F2): busca o produtor
 * por id e suas fazendas direto da API, em vez de confiar no que já estiver
 * na store — garante dado fresco mesmo se a listagem não tiver sido
 * recarregada desde a última escrita.
 */
export const loadProdutorForEdit = createAsyncThunk(
  'produtores/loadForEdit',
  async (id: string) => {
    const [produtor, farmsResponse] = await Promise.all([
      getProdutorById(id),
      listFarms({ producerId: id, limit: LIST_LIMIT }),
    ]);
    return { produtor, farms: farmsResponse.data };
  },
);

/**
 * Orquestra a criação/edição de um produtor junto com suas fazendas — o
 * backend não tem um endpoint composto (POST /producers só cria o produtor;
 * cada fazenda é POST/PATCH /farms em separado, ver
 * verx/src/farms/infrastructure/http/farms.controller.ts), então esse thunk
 * é quem faz a sequência de chamadas: cria/atualiza o produtor primeiro
 * (precisa do id resultante para as fazendas novas), depois cria/atualiza
 * cada fazenda.
 */
export const saveProdutor = createAsyncThunk(
  'produtores/save',
  async (args: SaveProdutorArgs) => {
    const produtor = args.id
      ? await updateProdutor(args.id, { name: args.name, document: args.document })
      : await createProdutor({ name: args.name, document: args.document });

    const farms: Farm[] = [];
    for (const farm of args.farms) {
      const { id: farmId, ...payload } = farm;
      const saved = farmId
        ? await updateFarm(farmId, payload)
        : await createFarm({ ...payload, producerId: produtor.id });
      farms.push(saved);
    }

    return { produtor, farms };
  },
);

export const removeProdutor = createAsyncThunk('produtores/remove', async (id: string) => {
  await deleteProdutor(id);
  return id;
});

const produtoresSlice = createSlice({
  name: 'produtores',
  initialState,
  reducers: {
    resetWriteStatus(state) {
      state.writeStatus = 'idle';
      state.writeError = null;
    },
    resetEditing(state) {
      state.editing = null;
      state.editingStatus = 'idle';
      state.editingError = null;
    },
    resetDeleteStatus(state) {
      state.deleteStatus = 'idle';
      state.deleteError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProdutores.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProdutores.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchProdutores.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Erro ao carregar produtores.';
      })

      .addCase(fetchFarms.pending, (state) => {
        state.farmsStatus = 'loading';
        state.farmsError = null;
      })
      .addCase(fetchFarms.fulfilled, (state, action) => {
        state.farmsStatus = 'succeeded';
        state.farms = action.payload;
        state.farmsError = null;
      })
      .addCase(fetchFarms.rejected, (state, action) => {
        state.farmsStatus = 'failed';
        state.farmsError = action.error.message ?? 'Erro ao carregar fazendas.';
      })

      .addCase(loadProdutorForEdit.pending, (state) => {
        state.editingStatus = 'loading';
        state.editingError = null;
        state.editing = null;
      })
      .addCase(loadProdutorForEdit.fulfilled, (state, action) => {
        state.editingStatus = 'succeeded';
        state.editing = action.payload;
        state.editingError = null;
      })
      .addCase(loadProdutorForEdit.rejected, (state, action) => {
        state.editingStatus = 'failed';
        state.editingError = action.error.message ?? 'Erro ao carregar dados do produtor.';
        state.editing = null;
      })

      .addCase(saveProdutor.pending, (state) => {
        state.writeStatus = 'loading';
        state.writeError = null;
      })
      .addCase(saveProdutor.fulfilled, (state, action) => {
        state.writeStatus = 'succeeded';
        state.writeError = null;

        const { produtor, farms } = action.payload;
        const producerIndex = state.items.findIndex((item) => item.id === produtor.id);
        if (producerIndex >= 0) {
          state.items[producerIndex] = produtor;
        } else {
          state.items.push(produtor);
        }

        for (const farm of farms) {
          const farmIndex = state.farms.findIndex((item) => item.id === farm.id);
          if (farmIndex >= 0) {
            state.farms[farmIndex] = farm;
          } else {
            state.farms.push(farm);
          }
        }
      })
      .addCase(saveProdutor.rejected, (state, action) => {
        state.writeStatus = 'failed';
        state.writeError = action.error.message ?? 'Erro ao salvar produtor.';
      })

      .addCase(removeProdutor.pending, (state) => {
        state.deleteStatus = 'loading';
        state.deleteError = null;
      })
      .addCase(removeProdutor.fulfilled, (state, action) => {
        state.deleteStatus = 'succeeded';
        state.deleteError = null;
        state.items = state.items.filter((item) => item.id !== action.payload);
        state.farms = state.farms.filter((farm) => farm.producerId !== action.payload);
      })
      .addCase(removeProdutor.rejected, (state, action) => {
        state.deleteStatus = 'failed';
        state.deleteError = action.error.message ?? 'Erro ao excluir produtor.';
      });
  },
});

export const { resetWriteStatus, resetEditing, resetDeleteStatus } = produtoresSlice.actions;
export default produtoresSlice.reducer;
