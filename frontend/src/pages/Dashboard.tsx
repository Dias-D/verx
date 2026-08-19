import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { PageLayout } from '../components/templates/PageLayout';
import { RefreshBar } from '../components/molecules/RefreshBar';
import { ErrorNotice } from '../components/molecules/ErrorNotice';
import { StatsGrid } from '../components/organisms/StatsGrid';
import { PieChartPanel } from '../components/organisms/PieChartPanel';
import { Spinner } from '../components/atoms/Spinner';
import { Text } from '../components/atoms/Text';
import { fetchDashboardSnapshot } from '../store/dashboardSlice';
import type { AppDispatch, RootState } from '../store';
import { formatTimeOnly } from '../utils/formatDateTime';
import type { LandUseType } from '../types/dashboard';

const ChartsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.md};
`;

const CenteredState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xl} 0;
`;

const LAND_USE_LABELS: Record<LandUseType, string> = {
  arable: 'Agricultável',
  vegetation: 'Vegetação',
};

/**
 * Página: único nível deste conjunto que conhece a store (`useDispatch`/
 * `useSelector`) — tudo abaixo (PageLayout, RefreshBar, StatsGrid,
 * PieChartPanel...) recebe dados por props e é puro (regra "só páginas
 * acessam a store", ver frontend-teste-brain-ag.md#2).
 *
 * Três estados possíveis, espelhando o wireframe congelado
 * (resources/templates/wireframes/dashboard.html):
 * - carregando (primeira busca, sem dado nenhum ainda);
 * - sucesso (com o carimbo de horário visível na RefreshBar);
 * - erro no refetch — mantém os últimos dados exibidos, com aviso
 *   discreto, em vez de limpar a tela (mesma filosofia do backend: servir
 *   o último snapshot válido em vez de devolver erro).
 *
 * Um quarto estado, fora do wireframe (que só cobre erro *no refetch*, com
 * dados anteriores já existentes): erro na primeira busca, sem nenhum dado
 * prévio para preservar. Tratado com o mesmo ErrorNotice, sem stats/gráficos
 * (não há o que mostrar).
 */
export function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { data, status, error } = useSelector((state: RootState) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardSnapshot());
  }, [dispatch]);

  function handleRefresh() {
    dispatch(fetchDashboardSnapshot());
  }

  const isInitialLoading = status === 'loading' && !data;
  const isRefreshing = status === 'loading' && !!data;
  const hasError = status === 'failed';

  return (
    <PageLayout title="Dashboard">
      {data ? (
        <RefreshBar
          calculatedAt={data.calculatedAt}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
      ) : null}

      {hasError && data ? (
        <ErrorNotice
          message={`Não foi possível atualizar agora. Mostrando os últimos dados calculados às ${formatTimeOnly(data.calculatedAt)}.`}
        />
      ) : null}

      {hasError && !data ? (
        <ErrorNotice
          message={error ?? 'Não foi possível carregar os dados do dashboard.'}
        />
      ) : null}

      {isInitialLoading ? (
        <CenteredState>
          <Spinner />
          <Text muted>Carregando dashboard...</Text>
        </CenteredState>
      ) : null}

      {data ? (
        <>
          <StatsGrid totalFarms={data.totalFarms} totalHectares={data.totalHectares} />
          <ChartsRow>
            <PieChartPanel
              title="Por estado"
              data={data.byState.map((item) => ({ label: item.state, value: item.count }))}
            />
            <PieChartPanel
              title="Por cultura plantada"
              data={data.byCrop.map((item) => ({ label: item.crop, value: item.count }))}
            />
            <PieChartPanel
              title="Por uso do solo"
              data={data.byLandUse.map((item) => ({
                label: LAND_USE_LABELS[item.type],
                value: item.hectares,
              }))}
            />
          </ChartsRow>
        </>
      ) : null}
    </PageLayout>
  );
}
