import { NestiaSwaggerComposer } from '@nestia/sdk';
import { NestFactory } from '@nestjs/core';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { WinstonLoggerService } from './common/logger';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(WinstonLoggerService));

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
