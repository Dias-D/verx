/**
 * Único ponto do código-fonte que lê `import.meta.env` (variáveis de
 * ambiente do Vite). Isolado deliberadamente neste arquivo: o Jest (via
 * ts-jest, compilando para CommonJS) não entende a sintaxe `import.meta`,
 * então os testes substituem este módulo por `env.jest.ts` via
 * `moduleNameMapper` (ver jest.config.ts) em vez de precisar de suporte a
 * ESM no runner de testes.
 *
 * Nada fora deste arquivo deve acessar `import.meta.env` diretamente.
 */
export const API_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
