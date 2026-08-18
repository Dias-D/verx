import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const validConfig = {
    DATABASE_URL: 'postgresql://user:password@localhost:5432/verx',
    NODE_ENV: 'development',
    PORT: '3000',
    REDIS_URL: 'redis://localhost:6379',
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
      REDIS_URL: validConfig.REDIS_URL,
    };

    const result = validateEnv(configWithoutPort);

    expect(result.PORT).toBe(3000);
  });

  it('aceita uma configuração válida completa sem lançar erro', () => {
    expect(() => validateEnv(validConfig)).not.toThrow();
  });

  it('lança erro descritivo se REDIS_URL estiver ausente', () => {
    const configWithoutRedisUrl = {
      DATABASE_URL: validConfig.DATABASE_URL,
      NODE_ENV: validConfig.NODE_ENV,
      PORT: validConfig.PORT,
    };

    expect(() => validateEnv(configWithoutRedisUrl)).toThrow(/REDIS_URL/);
  });

  it('aplica default 300 quando DASHBOARD_CACHE_TTL_SECONDS não é informado', () => {
    const configWithoutTtl = { ...validConfig };

    const result = validateEnv(configWithoutTtl);

    expect(result.DASHBOARD_CACHE_TTL_SECONDS).toBe(300);
  });

  it('aceita DASHBOARD_CACHE_TTL_SECONDS customizado', () => {
    const result = validateEnv({
      ...validConfig,
      DASHBOARD_CACHE_TTL_SECONDS: '60',
    });

    expect(result.DASHBOARD_CACHE_TTL_SECONDS).toBe(60);
  });
});
