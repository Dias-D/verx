/**
 * Substituto de `env.ts` usado só sob Jest (ver `moduleNameMapper` em
 * jest.config.ts) — mesma forma pública (`API_URL`), lendo de
 * `process.env` em vez de `import.meta.env`, que o Jest não compila.
 */
export const API_URL: string =
  process.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
