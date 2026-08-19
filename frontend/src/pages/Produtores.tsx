import { PageLayout } from '../components/templates/PageLayout';
import { Text } from '../components/atoms/Text';

/**
 * Placeholder da rota "/produtores", só para o link de navegação do
 * PageLayout (presente no wireframe congelado de ambas as telas) não levar
 * a uma rota inexistente enquanto a etapa F2 (CRUD de produtor) não chega.
 * Sem store, sem lógica — não antecipa nenhum componente do CRUD (regra:
 * "componentes nascem dentro da etapa que precisa deles").
 */
export function Produtores() {
  return (
    <PageLayout title="Produtores">
      <Text muted>Em construção — chega na etapa F2 (CRUD de produtor).</Text>
    </PageLayout>
  );
}
