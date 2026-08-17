// Prova que a configuração de redact do pino (loggerModuleParams) esconde o
// document mesmo quando um objeto completo (id + document) é passado ao
// logger — defesa em profundidade além da disciplina de só logar IDs em
// eventos de negócio (ver praticas.md#observabilidade). Não sobe a
// aplicação inteira: só a configuração real de logging, contra um stream
// capturado em memória (integração leve, sem Testcontainers).

import { randomUUID } from 'node:crypto';
import { Writable } from 'node:stream';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cpf } from 'cpf-cnpj-validator';
import { Logger, LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import type { Options as PinoHttpOptions } from 'pino-http';
import { loggerModuleParams } from './logger.module';

describe('Logger redaction', () => {
  it('nunca loga o document em claro, mesmo quando o objeto completo é passado ao logger por engano', async () => {
    const chunks: Buffer[] = [];
    const captureStream = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        chunks.push(chunk);
        callback();
      },
    });

    const moduleRef = await Test.createTestingModule({
      imports: [
        PinoLoggerModule.forRoot({
          pinoHttp: [
            loggerModuleParams.pinoHttp as PinoHttpOptions,
            captureStream,
          ],
        }),
      ],
    }).compile();

    const app: INestApplication = moduleRef.createNestApplication();
    await app.init();

    const logger = app.get(Logger);
    const knownDocument = cpf.generate();
    const producerId = randomUUID();

    // Evento de negócio "correto" (só o id) — o formato que o código de
    // aplicação realmente usa (ver ProducersService).
    logger.log({ producerId }, 'Producer created');
    // Cenário de regressão: alguém loga o objeto inteiro do producer por
    // engano. Mesmo assim, o redact precisa esconder o document.
    logger.log(
      {
        producerId,
        document: knownDocument,
        name: 'Producer Redaction Test',
      },
      'Producer created (full payload, should still redact)',
    );

    await app.close();

    const output = Buffer.concat(chunks).toString('utf8');
    expect(output).not.toContain(knownDocument);
    expect(output).toContain(producerId);
  });
});
