import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SingletonLoggerService } from './common/logger';
import { Transport } from '@nestjs/microservices';
import { CustomConfigService } from './common/config/custom-config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(SingletonLoggerService);
  app.useLogger(logger);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const configService = app.get(CustomConfigService);
  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: configService.get('KAFKA_CLIENT_ID', 'ecommerce-service'),
        brokers: configService
          .get('KAFKA_BROKERS', 'localhost:9092')
          .split(';'),
        leaderImbalancePerBrokerPercentage: 10, // 10% 이상 차이나면 리밸런싱
        leaderImbalanceCheckIntervalSeconds: 300, // 5분마다 체크
      },
      consumer: {
        groupId: configService.get(
          'KAFKA_CONSUMER_GROUP_ID',
          'ecommerce-service-group',
        ),
        allowAutoTopicCreation: true, // 토픽 자동 생성 허용
        fromBeginning: true, // 처음부터 메시지 읽기
        rebalanceTimeout: 30000, // 30초 이내에 리밸런싱 완료
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(3000);
}

bootstrap();
