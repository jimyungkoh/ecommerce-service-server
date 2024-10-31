import { Module } from '@nestjs/common';
import { ApplicationModule } from 'src/application/application.module';
import { LoggerModule } from 'src/common/logger';
import {
  AppController,
  OrderController,
  ProductController,
  UserController,
} from './controllers';

@Module({
  imports: [ApplicationModule, LoggerModule],
  controllers: [
    AppController,
    OrderController,
    ProductController,
    UserController,
  ],
  providers: [],
})
export class PresentationModule {}
