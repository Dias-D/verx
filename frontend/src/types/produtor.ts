/**
 * Contrato do recurso `producers` do backend (ver
 * verx/src/producers/domain/producer.entity.ts, fonte da verdade). Tipo
 * puro, sem lógica.
 */
export interface Produtor {
  id: string;
  name: string;
  document: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProdutorInput {
  name: string;
  document: string;
}

export interface UpdateProdutorInput {
  name?: string;
  document?: string;
}
