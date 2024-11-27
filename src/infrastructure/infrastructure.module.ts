import { Module } from '@nestjs/common';
import { ProducerModule } from './producer';
import { DatabaseModule } from './database';

@Module({
  imports: [ProducerModule, DatabaseModule],
  exports: [ProducerModule, DatabaseModule],
})
export class InfrastructureModule {}
