import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Partitioners } from 'kafkajs';
import { CustomConfigService } from '../config';

export const KafkaClientKey = 'KAFKA_CLIENT';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: KafkaClientKey,
        useFactory: (configService: CustomConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: configService.get('KAFKA_CLIENT_ID'),
              brokers: configService.get('KAFKA_BROKERS').split(';'),
              retry: {
                retries: 3,
                initialRetryTime: 100,
              },
            },
            producer: {
              metadataMaxAge: 300_000,
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
