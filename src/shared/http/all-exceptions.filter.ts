// Exception filter global — padroniza o FORMATO do corpo de erro devolvido
// ao cliente e, desde a etapa 6.1, também mapeia cenários de falha real para
// o status HTTP mais preciso: um `HttpException` já lançado pelos módulos
// (404, 409...) mantém seu status/mensagem originais (é ali que a maioria
// dos cenários da tabela de praticas.md#observabilidade já é resolvida,
// module a module); uma falha de conectividade do Prisma (banco
// inalcançável/timeout) vira `503 Service Unavailable`; qualquer outro erro
// desconhecido continua como 500 genérico. Stack trace completo só vai pro
// log (via pino), nunca no corpo da resposta — ver etapas/06-observabilidade.md
// e etapas/06.1-contrato-erros.md.

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import type { Logger } from 'nestjs-pino';

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path: string;
}

function extractMessage(exception: HttpException): string | string[] {
  const response = exception.getResponse();
  if (typeof response === 'string') {
    return response;
  }
  if (typeof response === 'object' && response !== null) {
    const message = (response as { message?: unknown }).message;
    if (typeof message === 'string' || Array.isArray(message)) {
      return message;
    }
  }
  return exception.message;
}

// Códigos de erro do Prisma que representam falha de CONECTIVIDADE com o
// banco (servidor inalcançável, timeout, conexão fechada) — distintos dos
// códigos de regra de negócio (P2002 unicidade, P2003 FK, P2025 not found),
// que já são tratados pelos adapters de cada módulo e nunca chegam até aqui
// sem já terem virado um `HttpException`. Ver
// https://www.prisma.io/docs/orm/reference/error-reference#common.
const DATABASE_CONNECTIVITY_ERROR_CODES = new Set([
  'P1001', // Can't reach database server
  'P1002', // Database server was reached but timed out
  'P1008', // Operations timed out
  'P1017', // Server has closed the connection
]);

function isDatabaseConnectivityError(exception: unknown): boolean {
  if (exception instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  return (
    exception instanceof Prisma.PrismaClientKnownRequestError &&
    DATABASE_CONNECTIVITY_ERROR_CODES.has(exception.code)
  );
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    let statusCode: number;
    let message: string | string[];
    if (isHttpException) {
      statusCode = exception.getStatus();
      message = extractMessage(exception);
    } else if (isDatabaseConnectivityError(exception)) {
      statusCode = HttpStatus.SERVICE_UNAVAILABLE;
      message = 'Service temporarily unavailable';
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
    }

    this.logger.error(
      { err: exception, statusCode, path: request.url },
      'Unhandled exception',
    );

    const body: ErrorResponseBody = {
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(body);
  }
}
