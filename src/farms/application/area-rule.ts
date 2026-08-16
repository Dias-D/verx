// Regra de negócio central do enunciado: a soma de área agricultável + área
// de vegetação não pode ultrapassar a área total da fazenda. Função pura,
// sem dependência de framework — usada tanto pelo validador customizado do
// DTO (@IsValidArea) quanto pelo Service (revalidação no PATCH, mesclando
// estado persistido com payload parcial).

export function validateAreas(
  total: number,
  arable: number,
  vegetation: number,
): boolean {
  if (total < 0 || arable < 0 || vegetation < 0) {
    return false;
  }
  return arable + vegetation <= total;
}
