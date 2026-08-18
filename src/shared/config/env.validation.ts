import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsIn(Object.values(NodeEnv))
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsNumber()
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  REDIS_URL!: string;

  @IsNumber()
  DASHBOARD_CACHE_TTL_SECONDS: number = 300;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const message = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');

    throw new Error(`Configuração de ambiente inválida: ${message}`);
  }

  return validatedConfig;
}
