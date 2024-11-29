import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SingletonLoggerService } from './common/logger';
import { CustomConfigService } from './common/config/custom-config.service';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(SingletonLoggerService);
  app.useLogger(logger);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const configService = app.get(CustomConfigService);

  const kafkaConfig = {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: configService.get('KAFKA_CLIENT_ID'),
        brokers: configService.get('KAFKA_BROKERS').split(';'),
      },
      consumer: {
        groupId: configService.get('KAFKA_CONSUMER_GROUP_ID'),
        allowAutoTopicCreation: true,
      },
    },
  };

  app.connectMicroservice(kafkaConfig);

  await app.startAllMicroservices();
  await app.listen(3000);
}

bootstrap();
