// Testa o filtro isoladamente (ArgumentsHost/Response/Request mockados) —
// o e2e (test/exception-filter.e2e-spec.ts) cobre o fluxo HTTP real.

import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import type { Logger } from 'nestjs-pino';
import { AllExceptionsFilter } from './all-exceptions.filter';

interface ResponseMock {
  status: jest.Mock;
  json: jest.Mock<void, [Record<string, unknown>]>;
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let loggerMock: Pick<Logger, 'error'>;

  const buildHost = (
    url: string,
  ): { host: ArgumentsHost; response: ResponseMock } => {
    const response: ResponseMock = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn<void, [Record<string, unknown>]>(),
    };
    const request = { url };
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as unknown as ArgumentsHost;
    return { host, response };
  };

  beforeEach(() => {
    loggerMock = { error: jest.fn() };
    filter = new AllExceptionsFilter(loggerMock as Logger);
  });

  it('formata uma HttpException conhecida com o status e a mensagem originais', () => {
    const { host, response } = buildHost('/api/v1/producers/unknown-id');

    filter.catch(
      new HttpException('Producer not found', HttpStatus.NOT_FOUND),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(404);
    const body = response.json.mock.calls[0][0];
    expect(body).toMatchObject({
      statusCode: 404,
      message: 'Producer not found',
      path: '/api/v1/producers/unknown-id',
    });
    expect(typeof body.timestamp).toBe('string');
    expect(body).not.toHaveProperty('stack');
  });

  it('preserva mensagens em array (ex.: erros do ValidationPipe)', () => {
    const { host, response } = buildHost('/api/v1/producers');

    filter.catch(
      new HttpException(
        { message: ['name should not be empty'], error: 'Bad Request' },
        HttpStatus.BAD_REQUEST,
      ),
      host,
    );

    const body = response.json.mock.calls[0][0];
    expect(body.message).toEqual(['name should not be empty']);
  });

  it('trata um erro desconhecido como 500, sem vazar mensagem/stack interno no corpo', () => {
    const { host, response } = buildHost('/api/v1/producers');

    filter.catch(new Error('conexão perdida com detalhe sensível'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    const body = response.json.mock.calls[0][0];
    expect(body.statusCode).toBe(500);
    expect(body.message).toBe('Internal server error');
    expect(body.message).not.toContain('conexão perdida');
    expect(body).not.toHaveProperty('stack');
  });

  it('sempre loga a exceção original (para investigação), mesmo quando o corpo da resposta não expõe detalhes', () => {
    const { host } = buildHost('/api/v1/producers');
    const error = new Error('boom');

    filter.catch(error, host);

    expect(loggerMock.error).toHaveBeenCalledTimes(1);
  });
});
