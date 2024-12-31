import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { KafkaContext } from '@nestjs/microservices';
import { Effect, pipe } from 'effect';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

@Injectable()
export class ConsumerInterceptor implements NestInterceptor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const kafkaContext = context.switchToRpc().getContext<KafkaContext>();
    const { offset } = kafkaContext.getMessage();
    const partition = kafkaContext.getPartition();
    const topic = kafkaContext.getTopic();
    const consumer = kafkaContext.getConsumer();

    return next.handle().pipe(
      mergeMap((value) => {
        return Effect.runPromise(
          pipe(
            Effect.if(Effect.isEffect(value), {
              onTrue: () => value as Effect.Effect<unknown, never, never>,
              onFalse: () => Effect.tryPromise(() => value),
            }),
            Effect.tap(() =>
              consumer.commitOffsets([{ offset, partition, topic }]),
            ),
            Effect.catchAll(() => {
              return Effect.succeed(null);
            }),
          ),
        );
      }),
    );
  }
}
