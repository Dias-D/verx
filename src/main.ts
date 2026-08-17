import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './shared/http/all-exceptions.filter';

export function configureApp(app: INestApplication): void {
  app.useLogger(app.get(Logger));

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter(app.get(Logger)));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Brain Agriculture API')
    .setDescription('Teste técnico Brain Agriculture — API backend')
    .setVersion('0.0.1')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  configureApp(app);
  await app.listen(process.env.PORT ?? 3000);
}

/* istanbul ignore next -- só executa quando o arquivo roda como entrypoint, nunca em testes que importam configureApp */
if (require.main === module) {
  void bootstrap();
}
