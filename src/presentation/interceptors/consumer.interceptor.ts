import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { KafkaContext } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class ConsumerInterceptor implements NestInterceptor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const kafkaContext = context.switchToRpc().getContext<KafkaContext>();
    const { offset } = kafkaContext.getMessage();
    const partition = kafkaContext.getPartition();
    const topic = kafkaContext.getTopic();
    const consumer = kafkaContext.getConsumer();

    return next
      .handle()
      .pipe(
        tap(
          async () =>
            await consumer.commitOffsets([{ offset, partition, topic }]),
        ),
      );
  }
}
