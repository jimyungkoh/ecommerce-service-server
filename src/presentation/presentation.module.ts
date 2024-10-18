import { Module } from '@nestjs/common';
import { ApplicationModule } from 'src/application/application.module';
import { AppController } from './controllers/app.controller';
import { OrderController } from './controllers/order.controller';
import { ProductController } from './controllers/product.controller';
import { WalletController } from './controllers/wallet.controller';

@Module({
  imports: [ApplicationModule],
  controllers: [
    AppController,
    OrderController,
    ProductController,
    WalletController,
  ],
})
export class PresentationModule {}
