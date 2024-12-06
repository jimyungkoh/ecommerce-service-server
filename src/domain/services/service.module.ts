import { Module } from '@nestjs/common';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import { CartService } from './cart.service';
import { OrderService } from './order.service';
import { OutboxEventService } from './outbox-event.service';
import { OutboxPollingService } from './outbox-polling.service';
import { PointService } from './point.service';
import { ProductService } from './product.service';
import { UserService } from './user.service';
import { WalletService } from './wallet.service';

@Module({
  imports: [InfrastructureModule],
  providers: [
    CartService,
    OrderService,
    PointService,
    ProductService,
    UserService,
    WalletService,
    OutboxEventService,
    OutboxPollingService,
  ],
  exports: [
    CartService,
    OrderService,
    PointService,
    ProductService,
    UserService,
    WalletService,
    OutboxEventService,
    OutboxPollingService,
  ],
})
export class ServiceModule {}
