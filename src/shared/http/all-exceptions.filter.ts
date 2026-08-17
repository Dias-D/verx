// Exception filter global — padroniza o FORMATO do corpo de erro devolvido
// ao cliente. O mapeamento fino de cenário de negócio -> status HTTP é a
// etapa opcional 6.1 (não aqui): um `HttpException` já lançado (404, 409...)
// mantém seu status/mensagem originais; qualquer outro erro vira 500
// genérico. Stack trace completo só vai pro log (via pino), nunca no corpo
// da resposta — ver etapas/06-observabilidade.md.

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
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

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = isHttpException
      ? extractMessage(exception)
      : 'Internal server error';

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
