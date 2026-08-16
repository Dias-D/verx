// Value object de domínio — as 27 unidades federativas do Brasil. Definido
// aqui, não importado do client de persistência gerado, para que domain/
// nunca dependa de infraestrutura diretamente; o adapter (infrastructure/)
// é quem faz a ponte com o enum equivalente do schema (ver arquitetura.md).

export const BRAZILIAN_STATES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;

export type BrazilianState = (typeof BRAZILIAN_STATES)[number];
