import { NestiaSwaggerComposer } from '@nestia/sdk';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SingletonLoggerService } from './common/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(SingletonLoggerService);
  app.useLogger(logger);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  BigInt.prototype['toJSON'] = function () {
    return this.toString();
  };

  const document = await NestiaSwaggerComposer.document(app, {
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local Server',
      },
    ],
  });
  SwaggerModule.setup('api', app, document as unknown as OpenAPIObject);

  await app.listen(3000);
}
bootstrap();
