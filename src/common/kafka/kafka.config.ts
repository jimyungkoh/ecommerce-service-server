import { KafkaOptions, Transport } from '@nestjs/microservices';
import { Partitioners } from 'kafkajs';
import { CustomConfigService } from '../config';

export interface KafkaConfig {
  microservice: KafkaOptions;
  clientModule: KafkaOptions;
}

export const createKafkaConfig = (
  configService: CustomConfigService,
): KafkaConfig => {
  const commonOptions: KafkaOptions['options'] = {
    client: {
      clientId: configService.get('KAFKA_CLIENT_ID'),
      brokers: configService.get('KAFKA_BROKERS').split(';'),
      retry: {
        retries: 15,
        initialRetryTime: 100,
        maxRetryTime: 30000,
      },
    },
    consumer: {
      groupId: configService.get('KAFKA_CONSUMER_GROUP_ID') ?? '',
      sessionTimeout: 30000,
      heartbeatInterval: 5000,
      allowAutoTopicCreation: false,
      retry: {
        retries: 10,
      },
    },
    producer: {
      metadataMaxAge: 300000,
      createPartitioner: Partitioners.DefaultPartitioner,
      allowAutoTopicCreation: false,
    },
  };

  const config: KafkaOptions = {
    transport: Transport.KAFKA,
    options: commonOptions,
  };

  return {
    microservice: {
      ...config,
      options: {
        ...config.options,
        run: {
          autoCommit: false,
        },
      },
    },
    clientModule: config,
  };
};
