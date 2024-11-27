import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CustomConfigService } from '../config/custom-config.service';
import { Partitioners } from 'kafkajs';

export const KafkaClientKey = 'KAFKA_CLIENT';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: KafkaClientKey,
        useFactory: (configService: CustomConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: configService.get(
                'KAFKA_CLIENT_ID',
                'ecommerce-service',
              ),
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
            producer: {
              createPartitioner: Partitioners.DefaultPartitioner,
              allowAutoTopicCreation: true,
            },
          },
        }),
        inject: [CustomConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class KafkaModule {}
