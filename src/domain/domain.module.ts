import { Module } from '@nestjs/common';
import { ServiceModule } from './services';

@Module({
  imports: [ServiceModule],
  exports: [ServiceModule],
})
export class DomainModule {}
