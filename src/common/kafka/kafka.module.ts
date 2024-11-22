import { ClientsModule, Transport } from '@nestjs/microservices';
import { Module } from '@nestjs/common';
import { CustomConfigService } from '../config/custom-config.service';

export const KafkaClientKey = Symbol('KafkaClient');

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
