import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const validConfig = {
    DATABASE_URL: 'postgresql://user:password@localhost:5432/verx',
    NODE_ENV: 'development',
    PORT: '3000',
  };

  it('lança erro descritivo se DATABASE_URL estiver ausente', () => {
    const configWithoutDatabaseUrl = {
      NODE_ENV: validConfig.NODE_ENV,
      PORT: validConfig.PORT,
    };

    expect(() => validateEnv(configWithoutDatabaseUrl)).toThrow(/DATABASE_URL/);
  });

  it('aceita NODE_ENV só entre development/test/production', () => {
    expect(() => validateEnv({ ...validConfig, NODE_ENV: 'staging' })).toThrow(
      /NODE_ENV/,
    );

    expect(() =>
      validateEnv({ ...validConfig, NODE_ENV: 'production' }),
    ).not.toThrow();
  });

  it('aplica default 3000 quando PORT não é informado', () => {
    const configWithoutPort = {
      DATABASE_URL: validConfig.DATABASE_URL,
      NODE_ENV: validConfig.NODE_ENV,
    };

    const result = validateEnv(configWithoutPort);

    expect(result.PORT).toBe(3000);
  });

  it('aceita uma configuração válida completa sem lançar erro', () => {
    expect(() => validateEnv(validConfig)).not.toThrow();
  });
});
