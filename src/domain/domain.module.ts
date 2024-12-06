import { Module } from '@nestjs/common';
import { EventsModule } from './events';
import { ServiceModule } from './services';

@Module({
  imports: [ServiceModule, EventsModule],
  exports: [ServiceModule],
})
export class DomainModule {}
