import { Global, Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { createKafkaConfig } from '.';
import { CustomConfigService } from '../config';

export const KafkaClientKey = 'KAFKA_CLIENT';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: KafkaClientKey,
        useFactory: (configService: CustomConfigService) =>
          createKafkaConfig(configService).clientModule,
        inject: [CustomConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class KafkaModule {}
