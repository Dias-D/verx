// Logging estruturado (JSON) via nestjs-pino, ver praticas.md#observabilidade
// e etapas/06-observabilidade.md. Módulo global — qualquer service injeta o
// `Logger` de 'nestjs-pino' sem precisar importar este módulo de novo.

import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Global, Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule, Params } from 'nestjs-pino';

export const REQUEST_ID_HEADER = 'x-request-id';
export const RESPONSE_REQUEST_ID_HEADER = 'X-Request-Id';

// Campos que nunca podem aparecer em claro no log — defesa em profundidade
// além da disciplina de só logar IDs em eventos de negócio: mesmo que
// alguém passe o objeto inteiro (DTO/entidade) para o logger por engano, o
// document (CPF/CNPJ) é redigido. Cobre tanto um log direto de um objeto
// quanto um eventual log futuro do corpo da requisição.
export const SENSITIVE_LOG_PATHS = ['document', 'req.body.document'];

function resolveRequestId(req: IncomingMessage): string {
  const headerValue = req.headers[REQUEST_ID_HEADER];
  const incoming = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  return incoming && incoming.length > 0 ? incoming : randomUUID();
}

export const loggerModuleParams: Params = {
  pinoHttp: {
    redact: {
      paths: SENSITIVE_LOG_PATHS,
      censor: '[REDACTED]',
    },
    genReqId: (req: IncomingMessage, res: ServerResponse): string => {
      const id = resolveRequestId(req);
      res.setHeader(RESPONSE_REQUEST_ID_HEADER, id);
      return id;
    },
  },
};

@Global()
@Module({
  imports: [PinoLoggerModule.forRoot(loggerModuleParams)],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
