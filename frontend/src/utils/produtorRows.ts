import type { Produtor } from '../types/produtor';
import type { Farm } from '../types/farm';
import { formatDocument } from './formatDocument';

/**
 * Linha pronta para a `ProdutoresTable` (organismo, puro por props) —
 * "Fazendas" e "Área total" não existem no payload de `GET /producers` (o
 * backend não expõe um agregado por produtor), então são calculadas aqui no
 * frontend a partir de `GET /farms` já carregado (ver
 * store/produtoresSlice.ts). Decisão de escopo documentada em `verx/README.md`:
 * suficiente para o volume de dado deste teste técnico (o teto de paginação
 * do backend é 100 itens por página).
 */
export interface ProdutorRow {
  id: string;
  name: string;
  document: string;
  farmsCount: number;
  totalAreaHectares: number;
}

export function computeProdutorRows(produtores: Produtor[], farms: Farm[]): ProdutorRow[] {
  return produtores.map((produtor) => {
    const ownFarms = farms.filter((farm) => farm.producerId === produtor.id);
    return {
      id: produtor.id,
      name: produtor.name,
      document: formatDocument(produtor.document),
      farmsCount: ownFarms.length,
      totalAreaHectares: ownFarms.reduce((sum, farm) => sum + farm.totalAreaHectares, 0),
    };
  });
}
