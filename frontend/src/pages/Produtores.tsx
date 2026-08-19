import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { PageLayout } from '../components/templates/PageLayout';
import { Button } from '../components/atoms/Button';
import { Spinner } from '../components/atoms/Spinner';
import { Text } from '../components/atoms/Text';
import { ProdutoresTable } from '../components/organisms/ProdutoresTable';
import { PropriedadesFieldset } from '../components/organisms/PropriedadesFieldset';
import { ProdutorForm } from '../components/molecules/ProdutorForm';
import { ConfirmDialog } from '../components/molecules/ConfirmDialog';
import {
  fetchFarms,
  fetchProdutores,
  loadProdutorForEdit,
  removeProdutor,
  resetDeleteStatus,
  resetEditing,
  resetWriteStatus,
  saveProdutor,
  type SaveFarmArg,
} from '../store/produtoresSlice';
import type { AppDispatch, RootState } from '../store';
import { computeProdutorRows } from '../utils/produtorRows';
import { isValidDocument } from '../validation/document';
import { validateAreas } from '../validation/area';
import { createEmptyFarmDraft, type FarmDraft } from '../types/farmDraft';
import { isBlankFarmDraft } from '../utils/isBlankFarmDraft';
import type { Farm } from '../types/farm';

const EditingLoadingOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(20, 30, 24, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
`;

const EditingLoadingPanel = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing.xl};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const numberFormatter = new Intl.NumberFormat('pt-BR');

const DOCUMENT_ERROR_MESSAGE = 'document deve ser um CPF ou CNPJ válido';

type OverlayState = 'none' | 'create' | 'edit' | 'delete';

function farmToDraft(farm: Farm): FarmDraft {
  return {
    id: farm.id,
    name: farm.name,
    city: farm.city,
    state: farm.state,
    totalAreaHectares: String(farm.totalAreaHectares),
    arableAreaHectares: String(farm.arableAreaHectares),
    vegetationAreaHectares: String(farm.vegetationAreaHectares),
  };
}

function buildAreaErrorMessage(total: number, arable: number, vegetation: number): string {
  const sum = arable + vegetation;
  return `A soma das áreas agricultável e de vegetação (${numberFormatter.format(sum)} ha) não pode ultrapassar a área total (${numberFormatter.format(total)} ha).`;
}

/**
 * Página: único nível deste conjunto que conhece a store (`useDispatch`/
 * `useSelector`) — tudo abaixo (PageLayout, ProdutoresTable, ProdutorForm,
 * PropriedadesFieldset, ConfirmDialog) recebe dados por props e é puro
 * (regra "só páginas acessam a store", ver frontend-teste-brain-ag.md#2).
 *
 * Orquestra o recurso inteiro (listar/criar/editar/excluir produtor, com o
 * fieldset de propriedades embutido no mesmo formulário — o backend não tem
 * um endpoint composto, ver store/produtoresSlice.ts) e as duas validações
 * client-side que espelham o backend: documento (CPF/CNPJ) e a regra de
 * área por fazenda — nenhuma das duas chama a API quando falha.
 */
export function Produtores() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, status, farms, editingStatus, writeStatus, writeError } = useSelector(
    (state: RootState) => state.produtores,
  );

  const [overlay, setOverlay] = useState<OverlayState>('none');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [farmDrafts, setFarmDrafts] = useState<FarmDraft[]>([createEmptyFarmDraft()]);
  const [farmErrors, setFarmErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    dispatch(fetchProdutores());
    dispatch(fetchFarms());
  }, [dispatch]);

  const rows = computeProdutorRows(items, farms);

  function handleRetry() {
    dispatch(fetchProdutores());
    dispatch(fetchFarms());
  }

  function openCreate() {
    dispatch(resetWriteStatus());
    setSelectedId(null);
    setName('');
    setDocument('');
    setDocumentError(null);
    setFarmDrafts([createEmptyFarmDraft()]);
    setFarmErrors({});
    setOverlay('create');
  }

  async function openEdit(id: string) {
    dispatch(resetWriteStatus());
    dispatch(resetEditing());
    setSelectedId(id);
    setOverlay('edit');

    try {
      // Edição carregando os dados existentes: só popula o formulário local
      // quando a resposta chega — enquanto isso, o overlay mostra um
      // indicador de carregamento (editingStatus === 'loading', ver JSX).
      const result = await dispatch(loadProdutorForEdit(id)).unwrap();
      setName(result.produtor.name);
      setDocument(result.produtor.document);
      setFarmDrafts(
        result.farms.length > 0 ? result.farms.map(farmToDraft) : [createEmptyFarmDraft()],
      );
      setDocumentError(null);
      setFarmErrors({});
    } catch {
      // erro já fica exposto via editingStatus/editingError (ver o painel
      // de erro renderizado abaixo, condicionado a editingStatus==='failed')
    }
  }

  function openDelete(id: string) {
    dispatch(resetDeleteStatus());
    setSelectedId(id);
    setOverlay('delete');
  }

  function closeOverlay() {
    setOverlay('none');
    setSelectedId(null);
    dispatch(resetWriteStatus());
  }

  function handleFarmChange(index: number, patch: Partial<FarmDraft>) {
    setFarmDrafts((previous) =>
      previous.map((draft, draftIndex) => (draftIndex === index ? { ...draft, ...patch } : draft)),
    );
  }

  function handleAddFarm() {
    setFarmDrafts((previous) => [...previous, createEmptyFarmDraft()]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidDocument(document)) {
      setDocumentError(DOCUMENT_ERROR_MESSAGE);
      return;
    }
    setDocumentError(null);

    const nextFarmErrors: Record<number, string> = {};
    const farmsToSave: SaveFarmArg[] = [];

    farmDrafts.forEach((draft, index) => {
      if (isBlankFarmDraft(draft)) {
        return;
      }
      const total = Number(draft.totalAreaHectares) || 0;
      const arable = Number(draft.arableAreaHectares) || 0;
      const vegetation = Number(draft.vegetationAreaHectares) || 0;

      if (!validateAreas(total, arable, vegetation)) {
        nextFarmErrors[index] = buildAreaErrorMessage(total, arable, vegetation);
        return;
      }

      farmsToSave.push({
        id: draft.id,
        name: draft.name,
        city: draft.city,
        state: draft.state,
        totalAreaHectares: total,
        arableAreaHectares: arable,
        vegetationAreaHectares: vegetation,
      });
    });

    if (Object.keys(nextFarmErrors).length > 0) {
      setFarmErrors(nextFarmErrors);
      return;
    }
    setFarmErrors({});

    try {
      await dispatch(
        saveProdutor({
          id: overlay === 'edit' ? (selectedId ?? undefined) : undefined,
          name,
          document,
          farms: farmsToSave,
        }),
      ).unwrap();
      // sucesso: o produtor e suas fazendas já foram gravados na store pelo
      // próprio slice (ver saveProdutor.fulfilled) — só falta fechar o
      // overlay e voltar para a listagem.
      setOverlay('none');
      setSelectedId(null);
    } catch {
      // erro já fica exposto via writeError (renderizado como formError no
      // ProdutorForm) — overlay continua aberto para o usuário corrigir.
    }
  }

  async function handleConfirmDelete() {
    if (!selectedId) {
      return;
    }
    try {
      await dispatch(removeProdutor(selectedId)).unwrap();
      setOverlay('none');
      setSelectedId(null);
    } catch {
      // erro fica exposto via deleteError na store; diálogo continua aberto
      // para o usuário tentar novamente ou cancelar.
    }
  }

  return (
    <PageLayout
      title="Produtores"
      actions={<Button onClick={openCreate}>+ Novo produtor</Button>}
    >
      <ProdutoresTable
        status={status}
        rows={rows}
        onEdit={openEdit}
        onDelete={openDelete}
        onRetry={handleRetry}
        onNovoProdutor={openCreate}
      />

      {overlay === 'create' ? (
        <ProdutorForm
          title="Novo produtor"
          subtitle="Cadastre o produtor e, opcionalmente, suas propriedades."
          name={name}
          document={document}
          documentError={documentError}
          formError={writeError}
          submitting={writeStatus === 'loading'}
          onNameChange={setName}
          onDocumentChange={setDocument}
          onSubmit={handleSubmit}
          onCancel={closeOverlay}
        >
          <PropriedadesFieldset
            farms={farmDrafts}
            onChange={handleFarmChange}
            onAdd={handleAddFarm}
            errors={farmErrors}
          />
        </ProdutorForm>
      ) : null}

      {overlay === 'edit' && editingStatus === 'loading' ? (
        <EditingLoadingOverlay>
          <EditingLoadingPanel role="dialog" aria-modal="true">
            <Spinner />
            <Text muted>Carregando dados do produtor...</Text>
          </EditingLoadingPanel>
        </EditingLoadingOverlay>
      ) : null}

      {overlay === 'edit' && editingStatus === 'succeeded' ? (
        <ProdutorForm
          title="Editar produtor"
          subtitle="Atualize os dados do produtor e, se necessário, suas propriedades."
          name={name}
          document={document}
          documentError={documentError}
          formError={writeError}
          submitting={writeStatus === 'loading'}
          onNameChange={setName}
          onDocumentChange={setDocument}
          onSubmit={handleSubmit}
          onCancel={closeOverlay}
        >
          <PropriedadesFieldset
            farms={farmDrafts}
            onChange={handleFarmChange}
            onAdd={handleAddFarm}
            errors={farmErrors}
          />
        </ProdutorForm>
      ) : null}

      {overlay === 'edit' && editingStatus === 'failed' ? (
        <ConfirmDialog
          title="Não foi possível carregar o produtor"
          message="Tente novamente."
          confirmLabel="Tentar novamente"
          onConfirm={() => selectedId && dispatch(loadProdutorForEdit(selectedId))}
          onCancel={closeOverlay}
        />
      ) : null}

      {overlay === 'delete' ? (
        <ConfirmDialog
          title="Excluir produtor?"
          message={`"${items.find((item) => item.id === selectedId)?.name ?? ''}" e suas fazendas serão removidos. Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setOverlay('none');
            setSelectedId(null);
            dispatch(resetDeleteStatus());
          }}
        />
      ) : null}
    </PageLayout>
  );
}
