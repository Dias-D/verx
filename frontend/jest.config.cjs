/**
 * Config em `.cjs` de propósito: `package.json` tem `"type": "module"`
 * (padrão do Vite), e um `jest.config.js` nesse contexto seria carregado
 * como ESM pelo Node sem que o Jest peça isso — `.cjs` remove a ambiguidade
 * sem precisar de `ts-node` só para ler a config.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  testEnvironment: 'jsdom',
  rootDir: '.',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
  },
  moduleNameMapper: {
    // Isola o único ponto do código que usa `import.meta.env` (sintaxe que
    // o Jest/ts-jest em CommonJS não compila) — ver src/config/env.ts.
    '^(\\.\\./)+config/env$': '<rootDir>/src/config/env.jest.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  maxWorkers: 2,
};
