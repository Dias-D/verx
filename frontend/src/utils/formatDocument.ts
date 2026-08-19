/**
 * Formata um documento normalizado (sem pontuação, ver
 * validation/document.ts) para exibição — máscara posicional, não numérica,
 * então também formata o CNPJ alfanumérico da Nota Técnica RFB 49/2024
 * (ex.: "00000000E08G12" -> "00.000.000/E08G-12").
 */
export function formatDocument(document: string): string {
  if (document.length === 11) {
    return document.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  if (document.length === 14) {
    return document.replace(
      /^(.{2})(.{3})(.{3})(.{4})(.{2})$/,
      '$1.$2.$3/$4-$5',
    );
  }

  return document;
}
