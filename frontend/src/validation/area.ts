// Espelha src/farms/application/area-rule.ts do backend — regra de negócio
// central do enunciado: a soma de área agricultável + área de vegetação não
// pode ultrapassar a área total da fazenda. Reescrita própria em TypeScript
// (app separado, não importa o backend), função pura sem dependência de
// framework.

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
