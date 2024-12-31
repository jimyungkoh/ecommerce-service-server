import { Module } from '@nestjs/common';
import { CacheModule } from './cache';
import { DatabaseModule } from './database';
import { ProducerModule } from './producer';

@Module({
  imports: [ProducerModule, DatabaseModule, CacheModule],
  exports: [ProducerModule, DatabaseModule, CacheModule],
})
export class InfrastructureModule {}
