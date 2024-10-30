import { Module } from '@nestjs/common';
import { ApplicationModule } from 'src/application/application.module';
import {
  AppController,
  OrderController,
  ProductController,
  UserController,
} from './controllers';

@Module({
  imports: [ApplicationModule],
  controllers: [
    AppController,
    OrderController,
    ProductController,
    UserController,
  ],
  providers: [],
})
export class PresentationModule {}
