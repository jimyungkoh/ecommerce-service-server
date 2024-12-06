import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomConfigService } from './common/config/custom-config.service';
import { createKafkaConfig } from './common/kafka';
import { SingletonLoggerService } from './common/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(SingletonLoggerService);
  app.useLogger(logger);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const configService = app.get(CustomConfigService);

  app.connectMicroservice(createKafkaConfig(configService).microservice);

  await app.startAllMicroservices();
  await app.listen(3000);
}

bootstrap();
